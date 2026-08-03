import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://esm.sh/zod@3.23.8";
import {
  ConflictError,
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

const SLUG_RE = /^[a-z][a-z0-9-]{1,30}[a-z0-9]$/;

const BodySchema = z.object({
  slug: z.string().trim().toLowerCase().regex(SLUG_RE, "Slug invalide (a-z, 0-9, -)"),
  nom: z.string().trim().min(2).max(100),
  sigle: z.string().trim().max(30).optional().nullable(),
  description: z.string().trim().max(500).optional().nullable(),
  logo_url: z.string().url().max(500).optional().nullable(),
  locale: z.string().trim().max(10).default("fr"),
  langue_principale: z.string().trim().max(5).default("fr"),
  site_template: z.string().trim().max(40).default("institutionnel"),
  subdomain: z.string().trim().toLowerCase().max(63).optional().nullable(),
  email_contact: z.string().trim().toLowerCase().email().max(255).optional().nullable(),
  telephone: z.string().trim().max(30).optional().nullable(),
  adresse: z.string().trim().max(255).optional().nullable(),
  ville: z.string().trim().max(100).optional().nullable(),
  pays: z.string().trim().max(100).optional().nullable(),
  theme_tokens: z.record(z.string()).optional().default({}),
  feature_flags: z.record(z.any()).optional().default({}),
  admin: z.object({
    email: z.string().trim().toLowerCase().email().max(255),
    nom: z.string().trim().min(1).max(100),
    prenom: z.string().trim().min(1).max(100),
    telephone: z.string().trim().max(30).optional().nullable(),
    password: z.string().min(8).max(128).optional(),
  }),
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
    // ---- 1. Auth : super_admin uniquement ----
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new UnauthorizedError("Header Authorization manquant");

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) throw new UnauthorizedError();

    const admin = createClient(supabaseUrl, serviceKey);

    const { data: isSuper, error: isSuperErr } = await admin.rpc("is_super_admin", {
      _user_id: userData.user.id,
    });
    if (isSuperErr) throw new InternalError("Impossible de vérifier le rôle super_admin", isSuperErr.message);
    if (!isSuper) throw new ForbiddenError("Réservé aux super administrateurs");

    // ---- 2. Validation body ----
    const raw = await req.json().catch(() => ({}));
    const parsed = BodySchema.safeParse(raw);
    if (!parsed.success) throw new ValidationError("Payload invalide", parsed.error.flatten());
    const input = parsed.data;

    // ---- 3. Slug unique ----
    const { data: existing } = await admin
      .from("associations")
      .select("id")
      .eq("slug", input.slug)
      .maybeSingle();
    if (existing) throw new ConflictError(`Le slug "${input.slug}" est déjà utilisé`);

    // ---- 4. Créer l'association ----
    const { data: assoc, error: assocErr } = await admin
      .from("associations")
      .insert({
        slug: input.slug,
        nom: input.nom,
        sigle: input.sigle ?? null,
        description: input.description ?? null,
        logo_url: input.logo_url ?? null,
        locale: input.locale,
        langue_principale: input.langue_principale,
        site_template: input.site_template,
        subdomain: input.subdomain ?? input.slug,
        email_contact: input.email_contact ?? null,
        telephone: input.telephone ?? null,
        adresse: input.adresse ?? null,
        ville: input.ville ?? null,
        pays: input.pays ?? null,
        theme_tokens: input.theme_tokens,
        feature_flags: input.feature_flags,
        statut: "actif",
      })
      .select("id, slug, nom")
      .single();
    if (assocErr || !assoc) {
      throw new InternalError("Création association échouée", assocErr?.message);
    }
    const associationId = assoc.id as string;

    // ---- 5. Cloner les rôles système + leurs permissions au niveau association ----
    const { data: templateRoles } = await admin
      .from("roles")
      .select("id, name, description")
      .eq("scope", "platform")
      .in("name", ["administrateur", "membre", "tresorier", "secretaire_general"]);

    const templates = templateRoles ?? [];
    let adminRoleId: string | null = null;

    if (templates.length) {
      const rolesToCreate = templates.map((r) => ({
        name: r.name,
        description: r.description,
        scope: "association",
        is_system: false,
        association_id: associationId,
      }));

      const { data: createdRoles, error: rolesErr } = await admin
        .from("roles")
        .insert(rolesToCreate)
        .select("id, name");
      if (rolesErr) throw new InternalError("Création rôles association échouée", rolesErr.message);

      adminRoleId = createdRoles?.find((r) => r.name === "administrateur")?.id ?? null;

      // Phase 3.2 — cloner role_permissions depuis les templates
      const templateIds = templates.map((t) => t.id);
      const { data: templatePerms } = await admin
        .from("role_permissions")
        .select("role_id, resource, permission, granted")
        .in("role_id", templateIds);

      const byTemplateId = new Map(templates.map((t) => [t.id, t.name]));
      const createdByName = new Map((createdRoles ?? []).map((r) => [r.name, r.id]));

      const permsToInsert = (templatePerms ?? [])
        .map((p) => {
          const templateName = byTemplateId.get(p.role_id);
          const newRoleId = templateName ? createdByName.get(templateName) : null;
          if (!newRoleId) return null;
          return {
            role_id: newRoleId,
            resource: p.resource,
            permission: p.permission,
            granted: p.granted,
          };
        })
        .filter(Boolean);

      if (permsToInsert.length) {
        const { error: permsErr } = await admin.from("role_permissions").insert(permsToInsert);
        if (permsErr) {
          console.warn("[provision-association] Clone permissions échoué:", permsErr.message);
        }
      }
    }

    // ---- 6. Créer l'utilisateur admin ----
    const password = input.admin.password ?? generatePassword();

    // Vérifier si l'email existe déjà
    const { data: existingUsers } = await admin.auth.admin.listUsers({
      page: 1,
      perPage: 200,
    });
    const alreadyUser = existingUsers?.users?.find(
      (u) => (u.email ?? "").toLowerCase() === input.admin.email
    );

    let authUserId: string;
    let generatedPassword: string | null = null;

    if (alreadyUser) {
      authUserId = alreadyUser.id;
    } else {
      const { data: created, error: createErr } = await admin.auth.admin.createUser({
        email: input.admin.email,
        password,
        email_confirm: true,
        user_metadata: {
          nom: input.admin.nom,
          prenom: input.admin.prenom,
          must_change_password: true,
        },
      });
      if (createErr || !created?.user) {
        throw new InternalError("Création utilisateur admin échouée", createErr?.message);
      }
      authUserId = created.user.id;
      generatedPassword = password;
    }

    // ---- 7. Créer le membre lié à la nouvelle association ----
    const { error: membreErr } = await admin.from("membres").insert({
      user_id: authUserId,
      nom: input.admin.nom,
      prenom: input.admin.prenom,
      email: input.admin.email,
      telephone: input.admin.telephone ?? null,
      association_id: associationId,
      statut: "actif",
    });
    if (membreErr) {
      // pas bloquant : on log mais on continue (l'admin peut recréer le membre)
      console.warn("[provision-association] Insert membre échoué:", membreErr.message);
    }

    // ---- 8. Assigner le rôle administrateur (scope association) ----
    if (adminRoleId) {
      const { error: userRoleErr } = await admin.from("user_roles").insert({
        user_id: authUserId,
        role_id: adminRoleId,
        association_id: associationId,
      });
      if (userRoleErr) {
        console.warn("[provision-association] Assign user_role échoué:", userRoleErr.message);
      }
    }

    // ---- 9. Settings par défaut ----
    const defaultSettings = [
      { cle: "nom_association", valeur: JSON.stringify(input.nom) },
      { cle: "locale", valeur: JSON.stringify(input.locale) },
    ].map((s) => ({ ...s, association_id: associationId }));

    await admin.from("association_settings").insert(defaultSettings);

    // ---- 10. Site public par défaut (portail vitrine du tenant) ----
    const placeholderImage =
      input.logo_url ?? "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=1600";

    const seed = await Promise.allSettled([
      admin.from("site_hero").insert({
        association_id: associationId,
        titre: input.nom,
        sous_titre: input.description ?? `Bienvenue sur le site de ${input.nom}`,
        badge_text: input.sigle ?? input.nom,
        image_url: placeholderImage,
        actif: true,
      }),
      admin.from("site_about").insert({
        association_id: associationId,
        titre: "À propos",
        sous_titre: `Notre mission — ${input.nom}`,
        histoire_titre: "Notre histoire",
        histoire_contenu:
          input.description ?? `${input.nom} est une association engagée auprès de ses membres.`,
        actif: true,
      }),
      admin.from("site_events_carousel_config").insert({ association_id: associationId, actif: true }),
      admin.from("site_config").insert(
        [
          { cle: "site_nom", valeur: input.nom, categorie: "general", type: "text" },
          { cle: "site_email", valeur: input.email_contact ?? "", categorie: "contact", type: "text" },
          { cle: "site_telephone", valeur: input.telephone ?? "", categorie: "contact", type: "text" },
          { cle: "site_adresse", valeur: input.adresse ?? "", categorie: "contact", type: "text" },
          { cle: "site_ville", valeur: input.ville ?? "", categorie: "contact", type: "text" },
          { cle: "site_pays", valeur: input.pays ?? "", categorie: "contact", type: "text" },
          { cle: "site_template", valeur: input.site_template, categorie: "general", type: "text" },
        ].map((c) => ({ ...c, association_id: associationId })),
      ),
    ]);
    seed.forEach((r, i) => {
      if (r.status === "rejected") {
        console.warn(`[provision-association] Seed site #${i} échoué:`, r.reason);
      } else if (r.value?.error) {
        console.warn(`[provision-association] Seed site #${i} erreur:`, r.value.error.message);
      }
    });


    return successResponse(
      {
        association: assoc,
        admin_user_id: authUserId,
        generated_password: generatedPassword,
      },
      corsHeaders,
      201,
    );
  } catch (err) {
    return errorResponse(err, corsHeaders, "provision-association");
  }
});
