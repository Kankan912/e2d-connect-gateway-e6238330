import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getFullEmailConfig, sendEmail, validateFullEmailConfig } from "../_shared/email-utils.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ContactData {
  nom: string;
  email: string;
  telephone?: string;
  objet: string;
  message?: string;
}

interface NotificationRequest {
  type: "admin_notification" | "visitor_confirmation" | "admin_reply";
  to: string;
  contactData: ContactData;
  replyContent?: string;
}

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Charger la configuration email complète
    const emailConfig = await getFullEmailConfig();
    
    // Valider la configuration
    const validation = validateFullEmailConfig(emailConfig);
    if (!validation.valid) {
      console.error("Configuration email invalide:", validation.error);
      return new Response(
        JSON.stringify({ error: validation.error }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { type, to, contactData, replyContent }: NotificationRequest = await req.json();

    console.log(`Sending ${type} email to ${to} via ${emailConfig.service}`);

    let subject: string;
    let html: string;

    switch (type) {
      case "admin_notification":
        subject = `[E2D] Nouveau message de contact - ${contactData.nom}`;
        html = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #1e3a5f, #2563eb); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
              .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
              .field { margin-bottom: 15px; }
              .label { font-weight: bold; color: #6b7280; font-size: 12px; text-transform: uppercase; }
              .value { margin-top: 5px; padding: 10px; background: white; border-radius: 4px; border: 1px solid #e5e7eb; }
              .message-box { white-space: pre-wrap; }
              .footer { text-align: center; padding: 15px; color: #6b7280; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1 style="margin: 0;">📩 Nouveau Message de Contact</h1>
                <p style="margin: 5px 0 0 0; opacity: 0.9;">Reçu via le formulaire du site E2D</p>
              </div>
              <div class="content">
                <div class="field">
                  <div class="label">Nom</div>
                  <div class="value">${contactData.nom}</div>
                </div>
                <div class="field">
                  <div class="label">Email</div>
                  <div class="value"><a href="mailto:${contactData.email}">${contactData.email}</a></div>
                </div>
                <div class="field">
                  <div class="label">Téléphone</div>
                  <div class="value">${contactData.telephone || "Non renseigné"}</div>
                </div>
                <div class="field">
                  <div class="label">Objet</div>
                  <div class="value">${contactData.objet}</div>
                </div>
                <div class="field">
                  <div class="label">Message</div>
                  <div class="value message-box">${contactData.message}</div>
                </div>
              </div>
              <div class="footer">
                Association E2D - Ensemble pour le Développement Durable<br>
                <a href="mailto:${contactData.email}?subject=Re: ${encodeURIComponent(contactData.objet)}">Répondre directement</a>
              </div>
            </div>
          </body>
          </html>
        `;
        break;

      case "visitor_confirmation":
        subject = `Merci pour votre message - E2D`;
        html = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #1e3a5f, #2563eb); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center; }
              .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
              .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; background: #f3f4f6; border-radius: 0 0 8px 8px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1 style="margin: 0;">✅ Message bien reçu !</h1>
              </div>
              <div class="content">
                <p>Bonjour <strong>${contactData.nom}</strong>,</p>
                <p>Nous avons bien reçu votre message concernant : <strong>"${contactData.objet}"</strong></p>
                <p>Notre équipe vous répondra dans les plus brefs délais, généralement sous 24 à 48 heures ouvrées.</p>
                <p>En attendant, n'hésitez pas à visiter notre site web pour en savoir plus sur nos activités.</p>
                <p>Cordialement,<br><strong>L'équipe E2D</strong></p>
              </div>
              <div class="footer">
                Association E2D - Ensemble pour le Développement Durable<br>
                Ce message est un accusé de réception automatique.
              </div>
            </div>
          </body>
          </html>
        `;
        break;

      case "admin_reply":
        subject = `Re: ${contactData.objet} - E2D`;
        html = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #1e3a5f, #2563eb); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
              .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
              .reply-content { white-space: pre-wrap; padding: 15px; background: white; border-radius: 4px; border-left: 4px solid #2563eb; }
              .footer { text-align: center; padding: 15px; color: #6b7280; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1 style="margin: 0;">📧 Réponse de l'équipe E2D</h1>
              </div>
              <div class="content">
                <p>Bonjour <strong>${contactData.nom}</strong>,</p>
                <p>Voici notre réponse à votre message concernant "<strong>${contactData.objet}</strong>" :</p>
                <div class="reply-content">${replyContent}</div>
                <p style="margin-top: 20px;">N'hésitez pas à nous recontacter si vous avez d'autres questions.</p>
                <p>Cordialement,<br><strong>L'équipe E2D</strong></p>
              </div>
              <div class="footer">
                Association E2D - Ensemble pour le Développement Durable
              </div>
            </div>
          </body>
          </html>
        `;
        break;

      default:
        return new Response(
          JSON.stringify({ error: "Invalid notification type" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }

    // Envoyer l'email via le service configuré
    const result = await sendEmail(emailConfig, { to, subject, html });

    if (!result.success) {
      throw new Error(result.error || "Failed to send email");
    }

    console.log(`Email sent successfully via ${emailConfig.service}:`, result.data);

    return new Response(
      JSON.stringify({ success: true, data: result.data, service: emailConfig.service }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in send-contact-notification:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
