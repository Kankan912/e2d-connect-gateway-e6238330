import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SendCampaignRequest {
  campaignId: string;
}

// Fonction pour récupérer la clé API depuis la DB
async function getResendApiKey(supabase: any): Promise<string> {
  const { data } = await supabase
    .from("configurations")
    .select("valeur")
    .eq("cle", "resend_api_key")
    .single();

  return data?.valeur || Deno.env.get("RESEND_API_KEY") || "";
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("🔵 [send-campaign-emails] Starting campaign send");

    // Verify authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      console.error("❌ Unauthorized:", authError);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
      );
    }

    console.log("✅ Authenticated user:", user.email);

    // Use service role for operations
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { campaignId }: SendCampaignRequest = await req.json();

    if (!campaignId) {
      return new Response(
        JSON.stringify({ error: "campaignId is required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Fetch campaign details
    const { data: campaign, error: campaignError } = await supabaseAdmin
      .from("notifications_campagnes")
      .select("*")
      .eq("id", campaignId)
      .single();

    if (campaignError || !campaign) {
      console.error("❌ Campaign not found:", campaignError);
      return new Response(
        JSON.stringify({ error: "Campaign not found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 }
      );
    }

    console.log("📧 Campaign found:", campaign.nom);

    // Fetch email configuration including API key from DB
    const { data: configs } = await supabaseAdmin
      .from("configurations")
      .select("cle, valeur")
      .in("cle", ["email_service", "app_url", "email_expediteur", "email_expediteur_nom", "resend_api_key"]);

    const configMap = new Map(configs?.map(c => [c.cle, c.valeur]) || []);
    const emailService = configMap.get("email_service") || "resend";
    const appUrl = configMap.get("app_url") || "https://e2d-connect.lovable.app";
    const fromEmail = configMap.get("email_expediteur") || "E2D <onboarding@resend.dev>";

    // Charger la clé API depuis la DB
    const RESEND_API_KEY = configMap.get("resend_api_key") || Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY && emailService === "resend") {
      return new Response(
        JSON.stringify({ error: "Clé API Resend non configurée. Veuillez la configurer dans Configuration → Email." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    // Get recipients based on campaign destinataires
    let recipients: { id: string; email: string; nom: string; prenom: string }[] = [];
    const destinatairesRaw = campaign.destinataires;

    // Gestion des deux formats : tableau direct d'IDs ou objet { type, ids }
    if (Array.isArray(destinatairesRaw)) {
      // Format: ["uuid1", "uuid2", ...] - tableau direct d'IDs membres
      console.log(`📋 Destinataires format: array with ${destinatairesRaw.length} IDs`);
      if (destinatairesRaw.length > 0) {
        const { data: membres } = await supabaseAdmin
          .from("membres")
          .select("id, email, nom, prenom")
          .in("id", destinatairesRaw)
          .not("email", "is", null);
        recipients = membres || [];
      } else {
        // Tableau vide = tous les membres actifs
        const { data: membres } = await supabaseAdmin
          .from("membres")
          .select("id, email, nom, prenom")
          .not("email", "is", null)
          .eq("statut", "actif");
        recipients = membres || [];
      }
    } else if (typeof destinatairesRaw === "object" && destinatairesRaw !== null) {
      // Format objet: { type: "all" | "selected", ids?: [] }
      const destinataires = destinatairesRaw as { type?: string; ids?: string[] };
      console.log(`📋 Destinataires format: object with type=${destinataires.type}`);
      
      if (destinataires.type === "all") {
        const { data: membres } = await supabaseAdmin
          .from("membres")
          .select("id, email, nom, prenom")
          .not("email", "is", null)
          .eq("statut", "actif");
        recipients = membres || [];
      } else if (destinataires.type === "selected" && destinataires.ids?.length) {
        const { data: membres } = await supabaseAdmin
          .from("membres")
          .select("id, email, nom, prenom")
          .in("id", destinataires.ids)
          .not("email", "is", null);
        recipients = membres || [];
      }
    }

    console.log(`📬 Found ${recipients.length} recipients from format: ${Array.isArray(destinatairesRaw) ? "array" : "object"}`);

    if (recipients.length === 0) {
      return new Response(
        JSON.stringify({ error: "No recipients found", sent: 0, errors: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // Update campaign status to "en_cours"
    await supabaseAdmin
      .from("notifications_campagnes")
      .update({ 
        statut: "en_cours",
        nb_destinataires: recipients.length 
      })
      .eq("id", campaignId);

    let sentCount = 0;
    let errorCount = 0;

    // Send emails to each recipient
    for (const recipient of recipients) {
      if (!recipient.email) continue;

      try {
        // Replace template variables
        let subject = campaign.template_sujet;
        let content = campaign.template_contenu;

        const variables: Record<string, string> = {
          "{{prenom}}": recipient.prenom || "",
          "{{nom}}": recipient.nom || "",
          "{{email}}": recipient.email || "",
          "{{app_url}}": appUrl,
          "{prenom}": recipient.prenom || "",
          "{nom}": recipient.nom || "",
          "{email}": recipient.email || "",
          "{app_url}": appUrl,
        };

        for (const [key, value] of Object.entries(variables)) {
          subject = subject.replace(new RegExp(key.replace(/[{}]/g, "\\$&"), "g"), value);
          content = content.replace(new RegExp(key.replace(/[{}]/g, "\\$&"), "g"), value);
        }

        // Send email via Resend API
        const emailRes = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: fromEmail,
            to: [recipient.email],
            subject: subject,
            html: `
              <!DOCTYPE html>
              <html>
              <head>
                <meta charset="utf-8">
                <title>${subject}</title>
              </head>
              <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
                ${content}
                <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                <p style="color: #666; font-size: 12px; text-align: center;">
                  Association E2D - Ensemble pour le Développement Durable
                </p>
              </body>
              </html>
            `,
          }),
        });

        if (!emailRes.ok) {
          const errorData = await emailRes.text();
          throw new Error(`Resend error: ${errorData}`);
        }

        // Log the send in notifications_envois
        await supabaseAdmin
          .from("notifications_envois")
          .insert({
            campagne_id: campaignId,
            membre_id: recipient.id,
            canal: "email",
            statut: "envoye",
            date_envoi: new Date().toISOString(),
          });

        sentCount++;
        console.log(`✅ Email sent to ${recipient.email}`);
      } catch (error: any) {
        console.error(`❌ Error sending to ${recipient.email}:`, error);
        
        // Log the error
        await supabaseAdmin
          .from("notifications_envois")
          .insert({
            campagne_id: campaignId,
            membre_id: recipient.id,
            canal: "email",
            statut: "erreur",
            erreur_message: error.message || "Unknown error",
          });

        errorCount++;
      }
    }

    // Update campaign with final stats
    await supabaseAdmin
      .from("notifications_campagnes")
      .update({
        statut: "envoyee",
        nb_envoyes: sentCount,
        nb_erreurs: errorCount,
        date_envoi_reelle: new Date().toISOString(),
      })
      .eq("id", campaignId);

    console.log(`📊 Campaign completed: ${sentCount} sent, ${errorCount} errors`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        sent: sentCount, 
        errors: errorCount,
        message: `${sentCount} emails envoyés, ${errorCount} erreurs`
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );

  } catch (error: any) {
    console.error("❌ Error in send-campaign-emails:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
