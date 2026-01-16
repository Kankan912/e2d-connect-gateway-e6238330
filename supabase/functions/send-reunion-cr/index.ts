import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PresenceInfo {
  presents: string[];
  excuses: string[];
  absentsNonExcuses: string[];
  retards: string[];
  tauxPresence: number;
}

interface FinancialSummary {
  cotisations?: { count: number; total: number };
  epargnes?: { count: number; total: number };
  sanctions?: { count: number; total: number };
  beneficiaires?: { count: number; total: number; details?: Array<{ nom: string; montant: number; statut: string }> };
}

interface SendReunionCRRequest {
  reunionId: string;
  destinataires: Array<{ email: string; nom: string; prenom: string }>;
  sujet: string;
  contenu: string;
  dateReunion: string;
  lieu?: string;
  presences?: PresenceInfo;
  financials?: FinancialSummary;
  isPreview?: boolean; // Si true, ajoute [APERÇU] au sujet
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { reunionId, destinataires, sujet, contenu, dateReunion, lieu, presences, financials, isPreview }: SendReunionCRRequest = await req.json();

    const previewLabel = isPreview ? "[APERÇU] " : "";
    console.log(`Sending reunion CR for reunion ${reunionId} to ${destinataires.length} recipients (preview: ${isPreview})`);

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
        // Build presences section HTML if available
        const presencesHtml = presences ? `
          <div class="presences-section">
            <h2>Présences - Taux: ${presences.tauxPresence}%</h2>
            <p><strong>Présents (${presences.presents.length}):</strong> ${presences.presents.length > 0 ? presences.presents.join(', ') : 'Aucun'}</p>
            ${presences.excuses.length > 0 ? `<p><em>Excusés (${presences.excuses.length}):</em> ${presences.excuses.join(', ')}</p>` : ''}
            ${presences.retards.length > 0 ? `<p><em>Retards (${presences.retards.length}):</em> ${presences.retards.join(', ')}</p>` : ''}
            ${presences.absentsNonExcuses.length > 0 ? `<p style="color: #dc2626;"><strong>Absents non excusés (${presences.absentsNonExcuses.length}):</strong> ${presences.absentsNonExcuses.join(', ')}</p>` : ''}
          </div>
        ` : '';

        // Build financials section HTML if available
        let financialsHtml = '';
        if (financials) {
          const items: string[] = [];
          
          if (financials.cotisations && financials.cotisations.count > 0) {
            items.push(`<div class="financial-item">
              <span class="label">💰 Cotisations collectées:</span>
              <span class="value">${financials.cotisations.total.toLocaleString('fr-FR')} FCFA (${financials.cotisations.count} paiement(s))</span>
            </div>`);
          }
          
          if (financials.epargnes && financials.epargnes.count > 0) {
            items.push(`<div class="financial-item">
              <span class="label">🏦 Épargnes déposées:</span>
              <span class="value">${financials.epargnes.total.toLocaleString('fr-FR')} FCFA (${financials.epargnes.count} dépôt(s))</span>
            </div>`);
          }
          
          if (financials.sanctions && financials.sanctions.count > 0) {
            items.push(`<div class="financial-item">
              <span class="label">⚠️ Sanctions:</span>
              <span class="value">${financials.sanctions.total.toLocaleString('fr-FR')} FCFA (${financials.sanctions.count} sanction(s))</span>
            </div>`);
          }
          
          if (financials.beneficiaires && financials.beneficiaires.count > 0) {
            let benefHtml = `<div class="financial-item">
              <span class="label">🎁 Bénéficiaires du mois:</span>
              <span class="value">${financials.beneficiaires.total.toLocaleString('fr-FR')} FCFA</span>
            </div>`;
            
            if (financials.beneficiaires.details && financials.beneficiaires.details.length > 0) {
              benefHtml += `<ul style="margin: 5px 0 0 20px; padding: 0;">`;
              for (const b of financials.beneficiaires.details) {
                const statutIcon = b.statut === 'paye' ? '✅' : '⏳';
                benefHtml += `<li>${statutIcon} ${b.nom}: ${b.montant.toLocaleString('fr-FR')} FCFA</li>`;
              }
              benefHtml += `</ul>`;
            }
            items.push(benefHtml);
          }
          
          if (items.length > 0) {
            financialsHtml = `
              <div class="financials-section">
                <h2>Résumé Financier</h2>
                ${items.join('')}
              </div>
            `;
          }
        }

        const htmlContent = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .header { background: #0B6B7C; color: white; padding: 20px; text-align: center; }
              .content { padding: 20px; }
              .footer { background: #f3f4f6; padding: 15px; text-align: center; font-size: 12px; color: #666; }
              h1 { margin: 0; font-size: 24px; }
              h2 { color: #0B6B7C; border-bottom: 2px solid #0B6B7C; padding-bottom: 5px; margin-top: 20px; }
              .info-box { background: #e6f4f6; border-left: 4px solid #0B6B7C; padding: 15px; margin: 15px 0; }
              .presences-section { background: #f9fafb; padding: 15px; border-radius: 8px; margin: 15px 0; }
              .presences-section h2 { margin-top: 0; }
              .financials-section { background: #f0fdf4; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #22c55e; }
              .financials-section h2 { margin-top: 0; color: #166534; }
              .financial-item { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
              .financial-item:last-child { border-bottom: none; }
              .financial-item .label { font-weight: 500; }
              .financial-item .value { font-weight: bold; color: #0B6B7C; }
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
                ${lieu ? `<br/><strong>Lieu :</strong> ${lieu}` : ''}
              </div>
              
              ${presencesHtml}
              
              ${financialsHtml}
              
              <h2>${sujet}</h2>
              
              <div style="white-space: pre-wrap;">
${contenu}
              </div>
            </div>
            <div class="footer">
              <p>Ce message a été envoyé automatiquement par l'application E2D Connect.</p>
              <p>© ${new Date().getFullYear()} Ensemble pour le Développement de la Diaspora</p>
            </div>
          </body>
          </html>
        `;

        const emailResponse = await resend.emails.send({
          from: "E2D <onboarding@resend.dev>",
          to: [destinataire.email],
          subject: `[E2D] ${previewLabel}Compte-Rendu: ${sujet}`,
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