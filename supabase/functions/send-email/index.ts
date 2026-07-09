import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getFullEmailConfig, sendEmail, validateFullEmailConfig } from "../_shared/email-utils.ts";
import {
  AppError,
  ExternalServiceError,
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

interface EmailRequest {
  to: string;
  subject: string;
  html: string;
  text?: string;
  forceService?: "resend" | "smtp";
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new UnauthorizedError("Header d'autorisation manquant");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) throw new UnauthorizedError("Session invalide");

    let payload: EmailRequest;
    try { payload = await req.json(); }
    catch { throw new ValidationError("Corps de requête invalide"); }

    const { to, subject, html, text, forceService } = payload;

    // Input validation: prevent header injection and oversized payloads
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const hasNewline = (s: string) => /[\r\n]/.test(s);
    if (typeof to !== "string" || to.length === 0 || to.length > 255 || !emailRegex.test(to)) {
      throw new ValidationError("Destinataire invalide");
    }
    if (typeof subject !== "string" || subject.length === 0 || subject.length > 200 || hasNewline(subject)) {
      throw new ValidationError("Sujet invalide (max 200 caractères, sans retour à la ligne)");
    }
    if (typeof html !== "string" || html.length === 0 || html.length > 200000) {
      throw new ValidationError("Contenu HTML invalide (max 200000 caractères)");
    }
    if (text !== undefined && (typeof text !== "string" || text.length > 200000)) {
      throw new ValidationError("Contenu texte invalide (max 200000 caractères)");
    }

    const emailConfig = await getFullEmailConfig();
    if (forceService) emailConfig.service = forceService;

    const validation = validateFullEmailConfig(emailConfig);
    if (!validation.valid) {
      throw new InternalError(validation.error || "Configuration email invalide");
    }

    const result = await sendEmail(emailConfig, { to, subject, html, text });
    if (!result.success) {
      throw new ExternalServiceError(
        result.error || "L'email n'a pas pu être envoyé",
        "EMAIL_SEND_FAILED",
      );
    }

    console.log(`[send-email] ✅ ${emailConfig.service} → ${to}`);
    return successResponse({ data: result.data, service: emailConfig.service }, corsHeaders);
  } catch (error: unknown) {
    if (!(error instanceof AppError)) {
      console.error("[send-email] FATAL:", error);
    }
    return errorResponse(error, corsHeaders, "send-email");
  }
});
