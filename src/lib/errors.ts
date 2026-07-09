/**
 * Frontend error utilities — extracts, translates and displays edge function
 * errors consistently across the app.
 *
 * Edge functions return: { success: false, code, message, details? }
 * (see supabase/functions/_shared/errors.ts).
 */

export type AppErrorPayload = {
  code: string;
  message: string;
  details?: unknown;
};

/**
 * Legacy helper: extract a human-readable message from any thrown value.
 * Kept for backward-compatibility with existing `catch (error: unknown)` blocks.
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  if (error && typeof error === "object") {
    const obj = error as { message?: unknown; error?: unknown };
    if (typeof obj.message === "string") return obj.message;
    if (typeof obj.error === "string") return obj.error;
    try {
      return JSON.stringify(error);
    } catch {
      return String(error);
    }
  }
  return String(error);
}

/**
 * French translations for stable error codes. Fallback = raw message.
 */
const CODE_MESSAGES_FR: Record<string, string> = {
  VALIDATION_ERROR: "Données invalides",
  UNAUTHORIZED: "Vous devez être connecté",
  FORBIDDEN: "Accès non autorisé",
  NOT_FOUND: "Ressource introuvable",
  CONFLICT: "Conflit avec l'état actuel",
  EMAIL_ALREADY_EXISTS: "Cet email est déjà utilisé",
  EMAIL_SEND_FAILED: "L'email n'a pas pu être envoyé",
  EXTERNAL_SERVICE_ERROR: "Service externe indisponible, réessayez plus tard",
  RATE_LIMITED: "Trop de tentatives, patientez quelques instants",
  SERVER_ERROR: "Erreur serveur, veuillez réessayer",
  // Legacy codes still emitted by non-migrated edge functions
  EMAIL_EXISTS: "Cet email est déjà utilisé",
  INVALID_DATA: "Données invalides",
  UNAUTHENTICATED: "Vous devez être connecté",
  USER_NOT_FOUND: "Utilisateur introuvable",
};

export function translateErrorCode(code: string | undefined | null, fallback?: string): string {
  if (!code) return fallback ?? "Une erreur est survenue";
  return CODE_MESSAGES_FR[code] ?? fallback ?? "Une erreur est survenue";
}

/**
 * Extract a standardized error payload from a Supabase functions.invoke response.
 *
 * Supabase edge functions returning non-2xx set `error` (a FunctionsHttpError)
 * but the response body is still parsed into `data`. We check `data` first so
 * we can read `code` / `message` from our standard error shape.
 *
 * Compatible with:
 *   - New shape:  { success: false, code, message, details? }
 *   - Legacy:     { success: false, code, message }  (identical, kept for clarity)
 *   - Very old:   { error: "some message" }
 *   - Raw Error   (network / parse failures)
 */
export function extractEdgeError(
  error: unknown,
  data: unknown = null,
): AppErrorPayload {
  // Standardized response body (present even on non-2xx from our edge functions)
  if (data && typeof data === "object") {
    const d = data as Record<string, unknown>;
    if (d.success === false || typeof d.code === "string") {
      return {
        code: (typeof d.code === "string" ? d.code : "SERVER_ERROR"),
        message: (typeof d.message === "string" ? d.message : "Erreur inconnue"),
        details: d.details,
      };
    }
    if (typeof d.error === "string") {
      return { code: "SERVER_ERROR", message: d.error };
    }
    if (d.error && typeof d.error === "object") {
      const inner = d.error as Record<string, unknown>;
      return {
        code: typeof inner.code === "string" ? inner.code : "SERVER_ERROR",
        message: typeof inner.message === "string" ? inner.message : "Erreur inconnue",
        details: inner.details,
      };
    }
  }

  // Fallback: use the thrown error itself
  const message = getErrorMessage(error);
  return { code: "SERVER_ERROR", message: message || "Erreur réseau" };
}

/**
 * Convenience wrapper that produces a { title, description } pair suitable for
 * a toast. `title` is the French translation of the code, `description` is the
 * server-provided message when it differs from the translation.
 */
export function toToastError(
  error: unknown,
  data: unknown = null,
  defaultTitle = "Une erreur est survenue",
): { title: string; description?: string } {
  const payload = extractEdgeError(error, data);
  const title = translateErrorCode(payload.code, defaultTitle);
  const description = payload.message && payload.message !== title ? payload.message : undefined;
  return { title, description };
}
