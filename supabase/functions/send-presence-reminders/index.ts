import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ReminderRequest {
  joursAvant?: number;
  testMode?: boolean;
}

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      console.error("RESEND_API_KEY non configurée");
      return new Response(
        JSON.stringify({ 
          error: "Configuration manquante", 
          message: "La clé API Resend n'est pas configurée" 
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const resend = new Resend(resendApiKey);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { joursAvant = 2, testMode = false }: ReminderRequest = await req.json().catch(() => ({}));

    console.log(`Envoi de rappels pour les réunions dans ${joursAvant} jours. Mode test: ${testMode}`);

    // Récupérer les réunions à venir dans X jours
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + joursAvant);
    const targetDateStr = targetDate.toISOString().split("T")[0];

    const { data: reunions, error: reunionsError } = await supabase
      .from("reunions")
      .select("id, date_reunion, ordre_du_jour, lieu_description, sujet")
      .eq("statut", "planifie")
      .gte("date_reunion", targetDateStr)
      .lt("date_reunion", targetDateStr + "T23:59:59");

    if (reunionsError) {
      console.error("Erreur récupération réunions:", reunionsError);
      throw reunionsError;
    }

    if (!reunions || reunions.length === 0) {
      console.log("Aucune réunion trouvée pour cette date");
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Aucune réunion prévue",
          emailsSent: 0 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Récupérer les membres actifs avec leur email
    const { data: membres, error: membresError } = await supabase
      .from("membres")
      .select("id, nom, prenom, email")
      .eq("statut", "actif")
      .not("email", "is", null);

    if (membresError) {
      console.error("Erreur récupération membres:", membresError);
      throw membresError;
    }

    if (!membres || membres.length === 0) {
      console.log("Aucun membre avec email trouvé");
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Aucun membre avec email",
          emailsSent: 0 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let emailsSent = 0;
    let emailsErrors = 0;
    const errors: string[] = [];

    for (const reunion of reunions) {
      const dateReunion = new Date(reunion.date_reunion);
      const dateFormatted = dateReunion.toLocaleDateString("fr-FR", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });
      const heureFormatted = dateReunion.toLocaleTimeString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit",
      });

      for (const membre of membres) {
        if (!membre.email) continue;

        const emailHtml = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #3b82f6, #2563eb); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
              .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
              .details { background: white; padding: 15px; border-radius: 8px; margin: 15px 0; }
              .detail-row { display: flex; margin: 10px 0; }
              .detail-label { font-weight: bold; width: 120px; color: #6b7280; }
              .footer { text-align: center; padding: 15px; color: #6b7280; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>📅 Rappel de Réunion E2D</h1>
              </div>
              <div class="content">
                <p>Bonjour ${membre.prenom} ${membre.nom},</p>
                <p>Nous vous rappelons que vous êtes attendu(e) à la prochaine réunion de l'association E2D :</p>
                
                <div class="details">
                  <div class="detail-row">
                    <span class="detail-label">📆 Date :</span>
                    <span>${dateFormatted}</span>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">🕐 Heure :</span>
                    <span>${heureFormatted}</span>
                  </div>
                  ${reunion.lieu_description ? `
                  <div class="detail-row">
                    <span class="detail-label">📍 Lieu :</span>
                    <span>${reunion.lieu_description}</span>
                  </div>
                  ` : ""}
                  ${reunion.ordre_du_jour ? `
                  <div class="detail-row">
                    <span class="detail-label">📋 Ordre du jour :</span>
                    <span>${reunion.ordre_du_jour}</span>
                  </div>
                  ` : ""}
                </div>
                
                <p>Votre présence est importante pour le bon fonctionnement de l'association.</p>
                <p>En cas d'empêchement, merci de prévenir un membre du bureau.</p>
                
                <p>Cordialement,<br>L'équipe E2D</p>
              </div>
              <div class="footer">
                <p>Ce message a été envoyé automatiquement. Merci de ne pas y répondre directement.</p>
              </div>
            </div>
          </body>
          </html>
        `;

        if (testMode) {
          console.log(`[TEST] Email préparé pour ${membre.email}`);
          emailsSent++;
          continue;
        }

        try {
          const { error: emailError } = await resend.emails.send({
            from: "E2D <onboarding@resend.dev>",
            to: [membre.email],
            subject: `Rappel : Réunion E2D le ${dateFormatted}`,
            html: emailHtml,
          });

          if (emailError) {
            console.error(`Erreur envoi email à ${membre.email}:`, emailError);
            errors.push(`${membre.email}: ${emailError.message}`);
            emailsErrors++;
          } else {
            console.log(`Email envoyé à ${membre.email}`);
            emailsSent++;
          }
        } catch (emailErr: any) {
          console.error(`Exception envoi email à ${membre.email}:`, emailErr);
          errors.push(`${membre.email}: ${emailErr.message}`);
          emailsErrors++;
        }
      }
    }

    console.log(`Résumé: ${emailsSent} emails envoyés, ${emailsErrors} erreurs`);

    return new Response(
      JSON.stringify({
        success: true,
        emailsSent,
        emailsErrors,
        reunionsCount: reunions.length,
        membresCount: membres.length,
        errors: errors.length > 0 ? errors : undefined,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Erreur dans send-presence-reminders:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
