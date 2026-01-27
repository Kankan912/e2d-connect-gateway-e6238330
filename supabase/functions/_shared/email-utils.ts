import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

// ============================================================
// Types
// ============================================================

export interface EmailConfig {
  apiKey: string;
  fromEmail: string;
  fromName: string;
  appUrl: string;
}

export interface FullEmailConfig {
  service: "resend" | "smtp";
  // Resend
  resendApiKey?: string;
  // SMTP
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpPassword?: string;
  smtpEncryption?: "tls" | "ssl" | "none";
  // Commun
  fromEmail: string;
  fromName: string;
  appUrl: string;
}

export interface EmailParams {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface EmailResult {
  success: boolean;
  error?: string;
  data?: any;
}

// ============================================================
// Configuration Loaders
// ============================================================

/**
 * Récupère la configuration email simple (ancien format - rétrocompatibilité)
 */
export async function getEmailConfig(): Promise<EmailConfig> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const { data: configs } = await supabase
    .from("configurations")
    .select("cle, valeur")
    .in("cle", [
      "resend_api_key",
      "email_expediteur", 
      "email_expediteur_nom",
      "app_url"
    ]);

  const configMap = new Map(configs?.map(c => [c.cle, c.valeur]) || []);

  const apiKey = configMap.get("resend_api_key") || Deno.env.get("RESEND_API_KEY") || "";
  const fromEmail = configMap.get("email_expediteur") || "E2D <onboarding@resend.dev>";
  const fromName = configMap.get("email_expediteur_nom") || "E2D";
  const appUrl = configMap.get("app_url") || "https://e2d-connect.lovable.app";

  return {
    apiKey,
    fromEmail,
    fromName,
    appUrl
  };
}

/**
 * Récupère la configuration email complète (multi-services)
 */
export async function getFullEmailConfig(): Promise<FullEmailConfig> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Charger toutes les configurations
  const { data: configs } = await supabase
    .from("configurations")
    .select("cle, valeur")
    .in("cle", [
      "email_service",
      "resend_api_key",
      "email_expediteur", 
      "email_expediteur_nom",
      "app_url"
    ]);

  const configMap = new Map(configs?.map(c => [c.cle, c.valeur]) || []);

  const service = (configMap.get("email_service") || "resend") as "resend" | "smtp";
  const resendApiKey = configMap.get("resend_api_key") || Deno.env.get("RESEND_API_KEY") || "";
  const fromEmail = configMap.get("email_expediteur") || "onboarding@resend.dev";
  const fromName = configMap.get("email_expediteur_nom") || "E2D";
  const appUrl = configMap.get("app_url") || "https://e2d-connect.lovable.app";

  // Charger la configuration SMTP si le service est SMTP
  let smtpConfig = {
    smtpHost: "",
    smtpPort: 587,
    smtpUser: "",
    smtpPassword: "",
    smtpEncryption: "tls" as "tls" | "ssl" | "none",
  };

  if (service === "smtp") {
    const { data: smtp } = await supabase
      .from("smtp_config")
      .select("*")
      .eq("actif", true)
      .limit(1)
      .maybeSingle();

    if (smtp) {
      smtpConfig = {
        smtpHost: smtp.serveur_smtp || "",
        smtpPort: smtp.port_smtp || 587,
        smtpUser: smtp.utilisateur_smtp || "",
        smtpPassword: smtp.mot_de_passe_smtp || "",
        smtpEncryption: (smtp.encryption_type as "tls" | "ssl" | "none") || "tls",
      };
    }
  }

  return {
    service,
    resendApiKey,
    ...smtpConfig,
    fromEmail,
    fromName,
    appUrl
  };
}

// ============================================================
// Email Sending Functions
// ============================================================

/**
 * Envoie un email via Resend API
 */
async function sendViaResend(config: FullEmailConfig, params: EmailParams): Promise<EmailResult> {
  if (!config.resendApiKey) {
    return { 
      success: false, 
      error: "Clé API Resend non configurée. Veuillez la configurer dans Configuration → Email." 
    };
  }

  try {
    const fromAddress = `${config.fromName} <${config.fromEmail}>`;
    
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${config.resendApiKey}`,
      },
      body: JSON.stringify({
        from: fromAddress,
        to: [params.to],
        subject: params.subject,
        html: params.html,
        text: params.text || "",
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Resend API error:", data);
      return { success: false, error: JSON.stringify(data) };
    }

    console.log(`[Resend] Email envoyé à ${params.to}`);
    return { success: true, data };
  } catch (error: any) {
    console.error("Resend send error:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Envoie un email via SMTP (denomailer)
 */
async function sendViaSMTP(config: FullEmailConfig, params: EmailParams): Promise<EmailResult> {
  if (!config.smtpHost || !config.smtpUser || !config.smtpPassword) {
    return { 
      success: false, 
      error: "Configuration SMTP incomplète. Veuillez vérifier les paramètres dans Configuration → Email." 
    };
  }

  let client: SMTPClient | null = null;
  
  try {
    console.log(`[SMTP] Connexion à ${config.smtpHost}:${config.smtpPort}...`);
    
    client = new SMTPClient({
      connection: {
        hostname: config.smtpHost,
        port: config.smtpPort || 587,
        tls: config.smtpEncryption === "tls" || config.smtpEncryption === "ssl",
        auth: {
          username: config.smtpUser,
          password: config.smtpPassword,
        },
      },
    });

    const fromAddress = `${config.fromName} <${config.smtpUser}>`;

    await client.send({
      from: fromAddress,
      to: params.to,
      subject: params.subject,
      html: params.html,
      content: params.text || "",
    });

    console.log(`[SMTP] Email envoyé à ${params.to}`);
    return { success: true };
  } catch (error: any) {
    console.error("[SMTP] Erreur d'envoi:", error);
    return { 
      success: false, 
      error: `Erreur SMTP: ${error.message || "Connexion échouée"}` 
    };
  } finally {
    if (client) {
      try {
        await client.close();
      } catch (e) {
        console.warn("[SMTP] Erreur fermeture connexion:", e);
      }
    }
  }
}

/**
 * Fonction principale d'envoi d'email - choisit automatiquement le service configuré
 */
export async function sendEmail(
  config: FullEmailConfig, 
  params: EmailParams
): Promise<EmailResult> {
  console.log(`[Email] Envoi via ${config.service} à ${params.to}...`);
  
  if (config.service === "smtp") {
    return sendViaSMTP(config, params);
  } else {
    return sendViaResend(config, params);
  }
}

/**
 * Fonction utilitaire pour envoyer un email avec configuration automatique
 * (charge la config et envoie en une seule opération)
 */
export async function sendEmailAuto(params: EmailParams): Promise<EmailResult> {
  const config = await getFullEmailConfig();
  return sendEmail(config, params);
}

// ============================================================
// Validation
// ============================================================

/**
 * Vérifie si la configuration email est valide
 */
export function validateEmailConfig(config: EmailConfig): { valid: boolean; error?: string } {
  if (!config.apiKey) {
    return { 
      valid: false, 
      error: "Clé API Resend non configurée. Veuillez la configurer dans Configuration → Email." 
    };
  }
  return { valid: true };
}

/**
 * Vérifie si la configuration complète est valide
 */
export function validateFullEmailConfig(config: FullEmailConfig): { valid: boolean; error?: string } {
  if (config.service === "resend") {
    if (!config.resendApiKey) {
      return { 
        valid: false, 
        error: "Clé API Resend non configurée. Veuillez la configurer dans Configuration → Email." 
      };
    }
  } else if (config.service === "smtp") {
    if (!config.smtpHost || !config.smtpUser || !config.smtpPassword) {
      return { 
        valid: false, 
        error: "Configuration SMTP incomplète. Veuillez vérifier les paramètres." 
      };
    }
  }
  return { valid: true };
}
