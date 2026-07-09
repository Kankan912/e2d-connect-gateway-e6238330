import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://esm.sh/zod@3.23.8";
import {
  AppError,
  ConflictError,
  EmailAlreadyExistsError,
  ForbiddenError,
  InternalError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
  errorResponse,
  successResponse,
} from "../_shared/errors.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BodySchema = z.object({
  email: z.string().trim().toLowerCase().email("Email invalide").max(255),
  nom: z.string().trim().min(1, "Le nom est obligatoire").max(100),
  prenom: z.string().trim().min(1, "Le prénom est obligatoire").max(100),
  telephone: z
    .union([z.string().trim().max(30), z.null()])
    .optional()
    .transform((v) => (v && v.length > 0 ? v : null)),
  password: z
    .string()
    .min(8, "Le mot de passe doit faire au moins 8 caractères")
    .max(128)
    .refine((p) => /[A-Za-z]/.test(p) && /[0-9]/.test(p), {
      message: "Le mot de passe doit contenir lettres et chiffres",
    })
    .optional(),
  roleIds: z.array(z.string().uuid()).max(20).optional(),
  membreId: z.union([z.string().uuid(), z.null()]).optional(),
});

function generatePassword(): string {
  const chars = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let p = "";
  for (let i = 0; i < 10; i++) p += chars.charAt(Math.floor(Math.random() * chars.length));
  return p + "A1!";
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // ── 1. Auth caller ──
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new UnauthorizedError();

    const supaCaller = createClient(SUPABASE_URL, ANON, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user: caller }, error: authErr } = await supaCaller.auth.getUser();
    if (authErr || !caller) throw new UnauthorizedError("Session invalide");

    // ── 2. Admin check ──
    const { data: isAdmin, error: adminErr } = await supaCaller.rpc("is_admin");
    if (adminErr || !isAdmin) {
      console.warn("[create-user-account] Forbidden caller", caller.email, adminErr);
      throw new ForbiddenError("Accès réservé aux administrateurs");
    }

    // ── 3. Validation ──
    let raw: unknown;
    try { raw = await req.json(); }
    catch { throw new ValidationError("Corps de requête invalide"); }

    const parsed = BodySchema.safeParse(raw);
    if (!parsed.success) {
      throw new ValidationError("Données invalides", parsed.error.flatten().fieldErrors);
    }
    const {
      email, nom, prenom, telephone,
      password: providedPassword,
      roleIds = [],
      membreId = null,
    } = parsed.data;
    const password = providedPassword ?? generatePassword();

    const supaAdmin = createClient(SUPABASE_URL, SERVICE, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // ── 4. Pre-checks (fast, before creating auth user) ──
    const { data: byEmail } = await supaAdmin
      .from("profiles")
      .select("id")
      .ilike("email", email)
      .maybeSingle();
    if (byEmail?.id) throw new EmailAlreadyExistsError();

    if (membreId) {
      const { data: m, error: mErr } = await supaAdmin
        .from("membres").select("id, user_id").eq("id", membreId).maybeSingle();
      if (mErr || !m) throw new NotFoundError("Membre introuvable");
      if (m.user_id) throw new ConflictError("Ce membre a déjà un compte");
    }

    // ── 5. Create auth user ──
    const { data: created, error: createErr } = await supaAdmin.auth.admin.createUser({
      email, password, email_confirm: true,
      user_metadata: { nom, prenom, telephone },
    });
    if (createErr || !created.user) {
      const code = (createErr as { code?: string } | null)?.code;
      if (code === "email_exists" || /already/i.test(createErr?.message || "")) {
        throw new EmailAlreadyExistsError();
      }
      console.error("[create-user-account] createUser failed:", createErr);
      throw new InternalError("Impossible de créer le compte");
    }

    const userId = created.user.id;

    // ── 6. Transactional provisioning (profile + roles + membre + audit) ──
    const { error: rpcErr } = await supaAdmin.rpc("provision_user_account", {
      p_user_id: userId,
      p_email: email,
      p_nom: nom,
      p_prenom: prenom,
      p_telephone: telephone,
      p_role_ids: roleIds.length > 0 ? roleIds : null,
      p_membre_id: membreId,
    });

    if (rpcErr) {
      console.error("[create-user-account] provision RPC failed, rolling back auth user:", rpcErr);
      try { await supaAdmin.auth.admin.deleteUser(userId); }
      catch (delErr) { console.error("[create-user-account] rollback deleteUser failed:", delErr); }

      const msg = rpcErr.message || "";
      if (msg.includes("membre_already_linked")) {
        throw new ConflictError("Ce membre est déjà lié à un autre compte");
      }
      if (msg.includes("membre_not_found") || msg.includes("profile_not_found")) {
        throw new NotFoundError("Ressource introuvable");
      }
      throw new InternalError("Erreur lors de la provision du compte");
    }

    console.log("[create-user-account] ✅ provisioned", { userId, email, membreId });
    return successResponse({ userId, email, tempPassword: password }, corsHeaders);
  } catch (error: unknown) {
    if (!(error instanceof AppError)) {
      console.error("[create-user-account] FATAL:", error);
    }
    return errorResponse(error, corsHeaders, "create-user-account");
  }
});
