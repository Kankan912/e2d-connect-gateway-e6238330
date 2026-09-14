import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

const PRIVILEGED_ROLES = [
  "administrateur",
  "admin",
  "tresorier",
  "secretaire_general",
  "super_admin",
];

function jsonResponse(body: unknown, status: number, corsHeaders: Record<string, string>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

export interface Caller {
  userId: string;
  /** Client Supabase agissant AVEC le jeton de l'appelant (donc soumis au RLS). */
  client: SupabaseClient;
}

/** Retourne l'appelant authentifié, ou une réponse 401 à renvoyer telle quelle. */
export async function getCaller(
  req: Request,
  corsHeaders: Record<string, string>,
): Promise<{ caller: Caller } | { response: Response }> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return { response: jsonResponse({ error: "Missing authorization header" }, 401, corsHeaders) };
  }

  const client = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    { global: { headers: { Authorization: authHeader } } },
  );

  const { data: { user }, error } = await client.auth.getUser();
  if (error || !user) {
    return { response: jsonResponse({ error: "Unauthorized" }, 401, corsHeaders) };
  }
  return { caller: { userId: user.id, client } };
}

/**
 * Vérifie que l'appelant est authentifié ET privilégié.
 *
 * - Sans `associationId` : contrôle de rôle global (compatibilité ascendante).
 * - Avec `associationId` : contrôle serveur du rôle **dans cette association**
 *   (RPC `has_privileged_role_in`), ce qui empêche un administrateur d'une
 *   association d'agir sur les données d'une autre.
 *
 * Retourne `null` si autorisé, sinon la `Response` (401/403) à renvoyer.
 */
export async function requirePrivilegedUser(
  req: Request,
  corsHeaders: Record<string, string>,
  associationId?: string | null,
): Promise<Response | null> {
  const result = await getCaller(req, corsHeaders);
  if ("response" in result) return result.response;
  const { caller } = result;

  if (associationId) {
    const { data, error } = await caller.client.rpc("has_privileged_role_in", {
      _association_id: associationId,
      _user_id: caller.userId,
    });
    if (error) {
      console.error("[auth-check] has_privileged_role_in a échoué:", error.message);
      return jsonResponse({ error: "Authorization check failed" }, 403, corsHeaders);
    }
    if (data !== true) {
      return jsonResponse(
        { error: "Insufficient permissions for this association" },
        403,
        corsHeaders,
      );
    }
    return null;
  }

  const { data: roles } = await caller.client
    .from("user_roles")
    .select("roles(name)")
    .eq("user_id", caller.userId);

  const rows = (roles ?? []) as unknown as Array<{
    roles?: { name?: string } | { name?: string }[] | null;
  }>;
  const hasPrivilege = rows.some((r) => {
    const rel = r?.roles;
    const names = Array.isArray(rel) ? rel.map((x) => x?.name) : [rel?.name];
    return names.some((n) => PRIVILEGED_ROLES.includes((n ?? "").toLowerCase()));
  });

  if (!hasPrivilege) {
    return jsonResponse({ error: "Insufficient permissions" }, 403, corsHeaders);
  }
  return null;
}

/**
 * Associations auxquelles l'appelant a réellement accès (vue serveur).
 * Utilisé pour borner les traitements de masse exécutés en service role.
 */
export async function getCallerAssociations(caller: Caller): Promise<string[]> {
  const { data, error } = await caller.client.rpc("get_user_associations", {
    _user_id: caller.userId,
  });
  if (error || !data) return [];
  return (data as Array<string | { get_user_associations: string }>)
    .map((row) => (typeof row === "string" ? row : row.get_user_associations))
    .filter(Boolean);
}
