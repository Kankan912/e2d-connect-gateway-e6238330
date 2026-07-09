import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  AppError,
  EmailAlreadyExistsError,
  ForbiddenError,
  InternalError,
  UnauthorizedError,
  ValidationError,
  errorResponse,
  successResponse,
} from "../_shared/errors.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CreateAccountBody {
  email?: string;
  nom?: string;
  prenom?: string;
  telephone?: string | null;
  password?: string;
  roleIds?: string[];
  membreId?: string | null;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_MIN = 8;

function validatePassword(p: string): string | null {
  if (p.length < PASSWORD_MIN) return `Le mot de passe doit faire au moins ${PASSWORD_MIN} caractères`;
  if (!/[A-Za-z]/.test(p) || !/[0-9]/.test(p)) return "Le mot de passe doit contenir lettres et chiffres";
  return null;
}

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

    // Auth caller
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new UnauthorizedError();

    const supaCaller = createClient(SUPABASE_URL, ANON, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user: caller }, error: authErr } = await supaCaller.auth.getUser();
    if (authErr || !caller) throw new UnauthorizedError("Session invalide");

    // Admin check
    const { data: isAdmin, error: adminErr } = await supaCaller.rpc("is_admin");
    if (adminErr || !isAdmin) {
      console.warn("[create-user-account] Forbidden caller", caller.email, adminErr);
      throw new ForbiddenError("Accès réservé aux administrateurs");
    }

    // Parse + validate
    let body: CreateAccountBody;
    try { body = await req.json(); }
    catch { throw new ValidationError("Corps de requête invalide"); }

    const email = (body.email ?? "").trim().toLowerCase();
    const nom = (body.nom ?? "").trim();
    const prenom = (body.prenom ?? "").trim();
    const telephone = body.telephone?.toString().trim() || null;
    const password = body.password?.toString() || generatePassword();
    const roleIds = Array.isArray(body.roleIds) ? body.roleIds.filter(Boolean) : [];
    const membreId = body.membreId || null;

    if (!email || !EMAIL_RE.test(email)) throw new ValidationError("Email invalide");
    if (!nom) throw new ValidationError("Le nom est obligatoire");
    if (!prenom) throw new ValidationError("Le prénom est obligatoire");
    const pErr = validatePassword(password);
    if (pErr) throw new ValidationError(pErr);

    const supaAdmin = createClient(SUPABASE_URL, SERVICE, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Pre-check: email exists?
    const { data: byEmail } = await supaAdmin
      .from("profiles")
      .select("id")
      .ilike("email", email)
      .maybeSingle();
    if (byEmail?.id) throw new EmailAlreadyExistsError();

    // Pre-check membre
    if (membreId) {
      const { data: m, error: mErr } = await supaAdmin
        .from("membres").select("id, user_id").eq("id", membreId).maybeSingle();
      if (mErr || !m) throw new ValidationError("Membre introuvable");
      if (m.user_id) throw new ValidationError("Ce membre a déjà un compte");
    }

    // Step A: create auth user
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

    // Helper: rollback
    const rollback = async (reason: string, err: unknown) => {
      console.error(`[create-user-account] ROLLBACK (${reason}):`, err);
      try { await supaAdmin.from("user_roles").delete().eq("user_id", userId); } catch (e) { console.error("rb user_roles:", e); }
      if (membreId) {
        try { await supaAdmin.from("membres_roles").delete().eq("membre_id", membreId); } catch (e) { console.error("rb membres_roles:", e); }
        try { await supaAdmin.from("membres").update({ user_id: null }).eq("id", membreId); } catch (e) { console.error("rb membres link:", e); }
      }
      try { await supaAdmin.auth.admin.deleteUser(userId); } catch (e) { console.error("rb deleteUser:", e); }
    };

    // Step B: profile
    const { error: profErr } = await supaAdmin.from("profiles").update({
      nom, prenom, email, telephone,
      must_change_password: true, password_changed: false,
    }).eq("id", userId);
    if (profErr) {
      await rollback("profile update", profErr);
      throw new InternalError("Erreur lors de la création du profil");
    }

    // Step C: roles
    let finalRoleIds = roleIds;
    if (finalRoleIds.length === 0) {
      const { data: defRole } = await supaAdmin
        .from("roles").select("id").ilike("name", "membre").maybeSingle();
      if (defRole?.id) finalRoleIds = [defRole.id];
    }
    if (finalRoleIds.length > 0) {
      const { error: urErr } = await supaAdmin.from("user_roles").insert(
        finalRoleIds.map((rid) => ({ user_id: userId, role_id: rid }))
      );
      if (urErr) {
        await rollback("user_roles insert", urErr);
        throw new InternalError("Erreur lors de l'attribution des rôles");
      }
    }

    // Step D: link membre
    if (membreId) {
      const { error: linkErr } = await supaAdmin.from("membres")
        .update({ user_id: userId }).eq("id", membreId);
      if (linkErr) {
        await rollback("membre link", linkErr);
        throw new InternalError("Erreur lors de la liaison au membre");
      }
      if (finalRoleIds.length > 0) {
        const { error: mrErr } = await supaAdmin.from("membres_roles").insert(
          finalRoleIds.map((rid) => ({ membre_id: membreId, role_id: rid }))
        );
        if (mrErr) console.error("[create-user-account] membres_roles warn:", mrErr);
      }
    }

    console.log("[create-user-account] ✅ created", { userId, email, membreId });
    return successResponse({ userId, email, tempPassword: password }, corsHeaders);
  } catch (error: unknown) {
    if (!(error instanceof AppError)) {
      console.error("[create-user-account] FATAL:", error);
    }
    return errorResponse(error, corsHeaders, "create-user-account");
  }
});
