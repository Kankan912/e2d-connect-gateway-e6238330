/**
 * Standardized error handling for Lovable edge functions.
 *
 * Response shape (both success and error):
 *   Success: { success: true, ...data }
 *   Error:   { success: false, code: string, message: string, details?: unknown }
 *
 * Codes are stable identifiers consumed by the front-end (see src/lib/errors.ts
 * `translateErrorCode`). Never leak raw stack traces or Supabase internal
 * messages to end-users.
 */

export type ErrorCode =
  | "VALIDATION_ERROR"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "EMAIL_ALREADY_EXISTS"
  | "EMAIL_SEND_FAILED"
  | "EXTERNAL_SERVICE_ERROR"
  | "RATE_LIMITED"
  | "SERVER_ERROR";

export class AppError extends Error {
  readonly code: ErrorCode;
  readonly status: number;
  readonly details?: unknown;

  constructor(code: ErrorCode, message: string, status: number, details?: unknown) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export class ValidationError extends AppError {
  constructor(message = "Données invalides", details?: unknown) {
    super("VALIDATION_ERROR", message, 400, details);
    this.name = "ValidationError";
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Authentification requise") {
    super("UNAUTHORIZED", message, 401);
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Accès refusé") {
    super("FORBIDDEN", message, 403);
    this.name = "ForbiddenError";
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Ressource introuvable") {
    super("NOT_FOUND", message, 404);
    this.name = "NotFoundError";
  }
}

export class ConflictError extends AppError {
  constructor(message = "Conflit", code: ErrorCode = "CONFLICT") {
    super(code, message, 409);
    this.name = "ConflictError";
  }
}

export class EmailAlreadyExistsError extends AppError {
  constructor(message = "Cet email est déjà utilisé") {
    super("EMAIL_ALREADY_EXISTS", message, 409);
    this.name = "EmailAlreadyExistsError";
  }
}

export class ExternalServiceError extends AppError {
  constructor(message = "Service externe indisponible", code: ErrorCode = "EXTERNAL_SERVICE_ERROR", details?: unknown) {
    super(code, message, 502, details);
    this.name = "ExternalServiceError";
  }
}

export class InternalError extends AppError {
  constructor(message = "Erreur serveur, veuillez réessayer", details?: unknown) {
    super("SERVER_ERROR", message, 500, details);
    this.name = "InternalError";
  }
}

/**
 * Build a standardized error Response. Accepts any thrown value.
 * - AppError → uses its code / status / details
 * - Any other Error → 500 SERVER_ERROR (message is generic; original goes to logs)
 */
export function errorResponse(
  err: unknown,
  corsHeaders: Record<string, string>,
  context?: string,
): Response {
  const prefix = context ? `[${context}]` : "[edge-error]";

  if (err instanceof AppError) {
    // Log at warn level for 4xx, error for 5xx
    const isServer = err.status >= 500;
    (isServer ? console.error : console.warn)(
      `${prefix} ${err.code} (${err.status}): ${err.message}`,
      err.details ?? "",
    );
    return new Response(
      JSON.stringify({
        success: false,
        code: err.code,
        message: err.message,
        ...(err.details !== undefined ? { details: err.details } : {}),
      }),
      {
        status: err.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  const message = err instanceof Error ? err.message : String(err);
  console.error(`${prefix} UNCAUGHT:`, message, err instanceof Error ? err.stack : "");
  return new Response(
    JSON.stringify({
      success: false,
      code: "SERVER_ERROR",
      message: "Erreur serveur, veuillez réessayer",
    }),
    {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    },
  );
}

/**
 * Build a standardized success Response.
 */
export function successResponse(
  data: Record<string, unknown> = {},
  corsHeaders: Record<string, string>,
  status = 200,
): Response {
  return new Response(
    JSON.stringify({ success: true, ...data }),
    {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    },
  );
}
