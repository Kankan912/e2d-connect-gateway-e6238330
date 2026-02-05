 import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
 * Pour Outlook port 587: utilise STARTTLS
 * Pour port 465: utilise SSL/TLS direct
 */
async function sendViaSMTP(config: FullEmailConfig, params: EmailParams): Promise<EmailResult> {
  if (!config.smtpHost || !config.smtpUser || !config.smtpPassword) {
    return { 
      success: false, 
      error: "Configuration SMTP incomplète. Veuillez vérifier les paramètres dans Configuration → Email." 
    };
  }

  try {
    const port = config.smtpPort || 587;
     const isSecure = port === 465 || config.smtpEncryption === "ssl";
     
     console.log(`[SMTP] Connexion à ${config.smtpHost}:${port} (secure: ${isSecure})...`);
     
     // Résoudre le hostname manuellement (dns.lookup non supporté dans Deno)
     let resolvedHost = config.smtpHost;
     try {
       const addresses = await Deno.resolveDns(config.smtpHost, "A");
       if (addresses && addresses.length > 0) {
         resolvedHost = addresses[0];
         console.log(`[SMTP] DNS résolu: ${config.smtpHost} -> ${resolvedHost}`);
       }
     } catch (dnsErr) {
       console.warn(`[SMTP] DNS lookup échoué, utilisation directe du hostname`);
     }
     
     // Établir la connexion
     let conn: Deno.TcpConn | Deno.TlsConn;
     if (isSecure) {
       conn = await Deno.connectTls({ hostname: resolvedHost, port });
     } else {
       conn = await Deno.connect({ hostname: resolvedHost, port });
     }
     
     const encoder = new TextEncoder();
     const decoder = new TextDecoder();
     
     // Helper: lire réponse SMTP (peut être multi-lignes)
     async function readResponse(): Promise<string> {
       const buffer = new Uint8Array(4096);
       let fullResponse = "";
       while (true) {
         const n = await conn.read(buffer);
         if (n === null) break;
         const chunk = decoder.decode(buffer.subarray(0, n));
         fullResponse += chunk;
         // Réponse complète si ligne se termine par "code " (espace après code = dernière ligne)
         const lines = fullResponse.split("\r\n").filter(l => l.length > 0);
         const lastLine = lines[lines.length - 1];
         if (lastLine && lastLine.length >= 4 && lastLine[3] === " ") break;
       }
       return fullResponse;
     }
     
     // Helper: envoyer commande
     async function sendCmd(cmd: string): Promise<string> {
       await conn.write(encoder.encode(cmd + "\r\n"));
       return await readResponse();
     }
     
     // Lire le banner
     let resp = await readResponse();
     console.log(`[SMTP] Banner: ${resp.substring(0, 50)}...`);
     if (!resp.startsWith("220")) throw new Error(`Serveur non prêt: ${resp}`);
     
     // EHLO
     resp = await sendCmd(`EHLO localhost`);
     if (!resp.includes("250")) throw new Error(`EHLO échoué: ${resp}`);
     console.log(`[SMTP] EHLO OK`);
     
     // STARTTLS si nécessaire (port 587)
     if (!isSecure && config.smtpEncryption === "tls") {
       resp = await sendCmd("STARTTLS");
       if (!resp.startsWith("220")) throw new Error(`STARTTLS échoué: ${resp}`);
       
       // Upgrade vers TLS
       conn = await Deno.startTls(conn as Deno.TcpConn, { hostname: config.smtpHost });
       console.log(`[SMTP] TLS établi`);
       
       // Re-EHLO après STARTTLS
       resp = await sendCmd(`EHLO localhost`);
       if (!resp.includes("250")) throw new Error(`EHLO post-TLS échoué: ${resp}`);
     }
     
     // Parser les capacités EHLO pour détecter les méthodes AUTH supportées
     const ehloLines = resp.split("\r\n");
     const authLine = ehloLines.find(l => l.toUpperCase().includes("AUTH"));
     const supportsPlain = authLine?.toUpperCase().includes("PLAIN") ?? false;
     const supportsLogin = authLine?.toUpperCase().includes("LOGIN") ?? false;
     console.log(`[SMTP] Méthodes AUTH supportées: ${authLine || "non détectées"}`);
     
     let authSuccess = false;
     
     // Essayer AUTH PLAIN en priorité (meilleure compatibilité Outlook moderne)
     if (supportsPlain && !authSuccess) {
       try {
         // AUTH PLAIN format: base64(\0username\0password)
         const plainCredentials = btoa(`\x00${config.smtpUser}\x00${config.smtpPassword}`);
         resp = await sendCmd(`AUTH PLAIN ${plainCredentials}`);
         if (resp.startsWith("235")) {
           authSuccess = true;
           console.log(`[SMTP] AUTH PLAIN réussi`);
         } else {
           console.log(`[SMTP] AUTH PLAIN échoué: ${resp.substring(0, 100)}`);
         }
       } catch (plainErr: any) {
         console.log(`[SMTP] AUTH PLAIN erreur: ${plainErr.message}`);
       }
     }
     
     // Fallback vers AUTH LOGIN si PLAIN échoue ou n'est pas supporté
     if (!authSuccess && supportsLogin) {
       try {
         resp = await sendCmd("AUTH LOGIN");
         if (resp.startsWith("334")) {
           // Username (base64)
           resp = await sendCmd(btoa(config.smtpUser));
           if (resp.startsWith("334")) {
             // Password (base64)
             resp = await sendCmd(btoa(config.smtpPassword));
             if (resp.startsWith("235")) {
               authSuccess = true;
               console.log(`[SMTP] AUTH LOGIN réussi`);
             } else {
               console.log(`[SMTP] AUTH LOGIN mot de passe rejeté: ${resp.substring(0, 100)}`);
             }
           } else {
             console.log(`[SMTP] AUTH LOGIN username rejeté: ${resp.substring(0, 100)}`);
           }
         } else {
           console.log(`[SMTP] AUTH LOGIN non accepté: ${resp.substring(0, 100)}`);
         }
       } catch (loginErr: any) {
         console.log(`[SMTP] AUTH LOGIN erreur: ${loginErr.message}`);
       }
     }
     
     // Si aucune méthode n'a fonctionné
     if (!authSuccess) {
       throw new Error(
         `Authentification échouée. Méthodes supportées: ${authLine || "inconnues"}. ` +
         `Pour Outlook, vérifiez que SMTP AUTH est activé: Paramètres > Courrier > Synchroniser le courrier > Activer POP/IMAP.`
       );
     }
     console.log(`[SMTP] Authentification réussie`);
     
     // MAIL FROM
     resp = await sendCmd(`MAIL FROM:<${config.smtpUser}>`);
     if (!resp.startsWith("250")) throw new Error(`MAIL FROM échoué: ${resp}`);
     
     // RCPT TO
     resp = await sendCmd(`RCPT TO:<${params.to}>`);
     if (!resp.startsWith("250")) throw new Error(`RCPT TO échoué: ${resp}`);
     
     // DATA
     resp = await sendCmd("DATA");
     if (!resp.startsWith("354")) throw new Error(`DATA échoué: ${resp}`);
     
     // Construire le message
     const messageId = `<${crypto.randomUUID()}@e2d.local>`;
     const date = new Date().toUTCString();
     const boundary = `----=_Part_${Date.now()}`;
     
     const emailData = [
       `Date: ${date}`,
       `From: "${config.fromName}" <${config.smtpUser}>`,
       `To: ${params.to}`,
       `Subject: =?UTF-8?B?${btoa(unescape(encodeURIComponent(params.subject)))}?=`,
       `Message-ID: ${messageId}`,
       `MIME-Version: 1.0`,
       `Content-Type: multipart/alternative; boundary="${boundary}"`,
       ``,
       `--${boundary}`,
       `Content-Type: text/plain; charset=utf-8`,
       `Content-Transfer-Encoding: base64`,
       ``,
       btoa(unescape(encodeURIComponent(params.text || ""))),
       ``,
       `--${boundary}`,
       `Content-Type: text/html; charset=utf-8`,
       `Content-Transfer-Encoding: base64`,
       ``,
       btoa(unescape(encodeURIComponent(params.html))),
       ``,
       `--${boundary}--`,
       `.`
     ].join("\r\n");
     
     await conn.write(encoder.encode(emailData + "\r\n"));
     resp = await readResponse();
     if (!resp.startsWith("250")) throw new Error(`Envoi DATA échoué: ${resp}`);
     
     // QUIT
     try { await sendCmd("QUIT"); } catch { /* ignore */ }
     try { conn.close(); } catch { /* ignore */ }
     
     console.log(`[SMTP] Email envoyé à ${params.to}, messageId: ${messageId}`);
     return { success: true, data: { messageId } };
  } catch (error: any) {
    console.error("[SMTP] Erreur d'envoi:", error);
    return { 
      success: false, 
       error: `Erreur SMTP: ${error.message}`
    };
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
