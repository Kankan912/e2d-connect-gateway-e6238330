/**
 * CORS partagé pour toutes les Edge Functions.
 *
 * Whitelist lue depuis la variable d'environnement `ALLOWED_ORIGINS` (CSV).
 * Si non définie, on autorise uniquement les domaines *.lovable.app par défaut.
 *
 * Usage :
 *   import { buildCorsHeaders, handleCorsPreflight } from '../_shared/cors.ts';
 *   const cors = buildCorsHeaders(req);
 *   const pre = handleCorsPreflight(req);
 *   if (pre) return pre;
 *   ...
 *   return new Response(JSON.stringify(data), { headers: { ...cors, 'Content-Type': 'application/json' } });
 */

const DEFAULT_ALLOWED = [
  "https://*.lovable.app",
  "https://*.lovable.dev",
];

function getAllowedOrigins(): string[] {
  const raw = Deno.env.get("ALLOWED_ORIGINS") ?? "";
  const list = raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return list.length > 0 ? list : DEFAULT_ALLOWED;
}

function matchOrigin(origin: string, pattern: string): boolean {
  if (pattern === origin) return true;
  if (!pattern.includes("*")) return false;
  // Convert glob "https://*.lovable.app" → regex
  const regex = new RegExp(
    "^" +
      pattern
        .replace(/[.+?^${}()|[\]\\]/g, "\\$&")
        .replace(/\*/g, "[^/]*") +
      "$",
  );
  return regex.test(origin);
}

export function isOriginAllowed(origin: string | null): boolean {
  if (!origin) return false;
  const allowed = getAllowedOrigins();
  return allowed.some((pattern) => matchOrigin(origin, pattern));
}

export function buildCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("origin");
  const allowed = origin && isOriginAllowed(origin) ? origin : "";
  return {
    "Access-Control-Allow-Origin": allowed,
    "Vary": "Origin",
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type, x-webhook-secret",
    "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
    "Access-Control-Max-Age": "86400",
  };
}

export function handleCorsPreflight(req: Request): Response | null {
  if (req.method !== "OPTIONS") return null;
  const origin = req.headers.get("origin");
  if (!origin || !isOriginAllowed(origin)) {
    return new Response("Origin not allowed", { status: 403 });
  }
  return new Response("ok", { headers: buildCorsHeaders(req) });
}

/** Backward-compat wildcard CORS — DEPRECATED, ne plus utiliser pour les nouvelles fonctions. */
export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};
