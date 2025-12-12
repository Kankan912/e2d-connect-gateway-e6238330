import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SendReunionCRRequest {
  reunionId: string;
  destinataires: Array<{ email: string; nom: string; prenom: string }>;
  sujet: string;
  contenu: string;
  dateReunion: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { reunionId, destinataires, sujet, contenu, dateReunion }: SendReunionCRRequest = await req.json();

    console.log(`Sending reunion CR for reunion ${reunionId} to ${destinataires.length} recipients`);

    if (!destinataires || destinataires.length === 0) {
      return new Response(
        JSON.stringify({ error: "Aucun destinataire spécifié" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let sentCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    for (const destinataire of destinataires) {
      if (!destinataire.email) {
        console.log(`Skipping ${destinataire.prenom} ${destinataire.nom} - no email`);
        continue;
      }

      try {
        const htmlContent = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .header { background: #1e40af; color: white; padding: 20px; text-align: center; }
              .content { padding: 20px; }
              .footer { background: #f3f4f6; padding: 15px; text-align: center; font-size: 12px; color: #666; }
              h1 { margin: 0; font-size: 24px; }
              h2 { color: #1e40af; border-bottom: 2px solid #1e40af; padding-bottom: 5px; }
              .info-box { background: #eff6ff; border-left: 4px solid #1e40af; padding: 15px; margin: 15px 0; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>E2D - Compte-Rendu de Réunion</h1>
            </div>
            <div class="content">
              <p>Bonjour ${destinataire.prenom} ${destinataire.nom},</p>
              
              <div class="info-box">
                <strong>Date de la réunion :</strong> ${dateReunion}
              </div>
              
              <h2>${sujet}</h2>
              
              <div style="white-space: pre-wrap;">
${contenu}
              </div>
            </div>
            <div class="footer">
              <p>Ce message a été envoyé automatiquement par l'application E2D.</p>
              <p>© ${new Date().getFullYear()} Ensemble pour le Développement de la Diaspora</p>
            </div>
          </body>
          </html>
        `;

        const emailResponse = await resend.emails.send({
          from: "E2D <onboarding@resend.dev>",
          to: [destinataire.email],
          subject: `[E2D] Compte-Rendu: ${sujet}`,
          html: htmlContent,
        });

        console.log(`Email sent to ${destinataire.email}:`, emailResponse);
        sentCount++;
      } catch (emailError: any) {
        console.error(`Error sending to ${destinataire.email}:`, emailError);
        errorCount++;
        errors.push(`${destinataire.email}: ${emailError.message}`);
      }
    }

    console.log(`Sending complete: ${sentCount} sent, ${errorCount} errors`);

    return new Response(
      JSON.stringify({
        success: true,
        sentCount,
        errorCount,
        errors: errors.length > 0 ? errors : undefined,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in send-reunion-cr function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
};

serve(handler);
