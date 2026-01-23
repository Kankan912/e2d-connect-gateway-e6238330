import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export interface EmailConfig {
  apiKey: string;
  fromEmail: string;
  fromName: string;
  appUrl: string;
}

/**
 * Récupère la configuration email depuis la base de données
 * Charge dynamiquement RESEND_API_KEY depuis la table configurations
 */
export async function getEmailConfig(): Promise<EmailConfig> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Charger toutes les configurations email
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

  // Priorité : DB > Env variable > Default
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
 * Vérifie si la clé API email est configurée
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
