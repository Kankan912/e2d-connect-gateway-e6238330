import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getFullEmailConfig, sendEmail, validateFullEmailConfig } from "../_shared/email-utils.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SendCampaignRequest {
  campaignId: string;
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

    // Charger la configuration email complète (multi-services)
    const emailConfig = await getFullEmailConfig();
    
    // Valider la configuration
    const validation = validateFullEmailConfig(emailConfig);
    if (!validation.valid) {
      return new Response(
        JSON.stringify({ error: validation.error }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    console.log(`📬 Using email service: ${emailConfig.service}`);

    // Get recipients based on campaign destinataires
    let recipients: { id: string; email: string; nom: string; prenom: string }[] = [];
    const destinatairesRaw = campaign.destinataires;

    // Gestion des deux formats : tableau direct d'IDs ou objet { type, ids }
    if (Array.isArray(destinatairesRaw)) {
      console.log(`📋 Destinataires format: array with ${destinatairesRaw.length} IDs`);
      if (destinatairesRaw.length > 0) {
        const { data: membres } = await supabaseAdmin
          .from("membres")
          .select("id, email, nom, prenom")
          .in("id", destinatairesRaw)
          .not("email", "is", null);
        recipients = membres || [];
      } else {
        const { data: membres } = await supabaseAdmin
          .from("membres")
          .select("id, email, nom, prenom")
          .not("email", "is", null)
          .eq("statut", "actif");
        recipients = membres || [];
      }
    } else if (typeof destinatairesRaw === "object" && destinatairesRaw !== null) {
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

    console.log(`📬 Found ${recipients.length} recipients`);

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
          "{{app_url}}": emailConfig.appUrl,
          "{prenom}": recipient.prenom || "",
          "{nom}": recipient.nom || "",
          "{email}": recipient.email || "",
          "{app_url}": emailConfig.appUrl,
        };

        for (const [key, value] of Object.entries(variables)) {
          subject = subject.replace(new RegExp(key.replace(/[{}]/g, "\\$&"), "g"), value);
          content = content.replace(new RegExp(key.replace(/[{}]/g, "\\$&"), "g"), value);
        }

        const htmlContent = `
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
        `;

        // Envoyer via le service configuré
        const result = await sendEmail(emailConfig, {
          to: recipient.email,
          subject: subject,
          html: htmlContent,
        });

        if (!result.success) {
          throw new Error(result.error || "Unknown error");
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
        console.log(`✅ Email sent to ${recipient.email} via ${emailConfig.service}`);
        
        // Rate limiting: pause entre les emails
        await new Promise(resolve => setTimeout(resolve, 600));
      } catch (error: any) {
        console.error(`❌ Error sending to ${recipient.email}:`, error);
        
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

    console.log(`📊 Campaign completed via ${emailConfig.service}: ${sentCount} sent, ${errorCount} errors`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        sent: sentCount, 
        errors: errorCount,
        service: emailConfig.service,
        message: `${sentCount} emails envoyés via ${emailConfig.service}, ${errorCount} erreurs`
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
