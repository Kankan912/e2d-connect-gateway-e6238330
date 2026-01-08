import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ReminderRequest {
  testMode?: boolean;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      console.error("RESEND_API_KEY non configurée");
      return new Response(
        JSON.stringify({ error: "Configuration manquante", message: "La clé API Resend n'est pas configurée" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const resend = new Resend(resendApiKey);
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { testMode = false }: ReminderRequest = await req.json().catch(() => ({}));

    console.log(`Envoi de rappels pour échéances de prêts. Mode test: ${testMode}`);

    // Récupérer la configuration des notifications
    const { data: config } = await supabase
      .from("notifications_config")
      .select("actif, delai_jours")
      .eq("type_notification", "rappel_pret")
      .single();

    if (!config?.actif) {
      console.log("Rappels de prêts désactivés");
      return new Response(
        JSON.stringify({ success: true, message: "Rappels désactivés", emailsSent: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const delaiJours = config.delai_jours || 7;
    const today = new Date();
    const dateLimit = new Date();
    dateLimit.setDate(dateLimit.getDate() + delaiJours);
    
    const todayStr = today.toISOString().split("T")[0];
    const dateLimitStr = dateLimit.toISOString().split("T")[0];

    // Récupérer les prêts actifs avec échéance proche
    const { data: pretsAEcheance, error: pretsError } = await supabase
      .from("prets")
      .select(`
        id,
        montant,
        montant_paye,
        montant_total_du,
        capital_paye,
        interet_paye,
        interet_initial,
        taux_interet,
        echeance,
        date_pret,
        reconductions,
        membre_id,
        membres!inner(id, nom, prenom, email, statut)
      `)
      .neq("statut", "rembourse")
      .gte("echeance", todayStr)
      .lte("echeance", dateLimitStr)
      .eq("membres.statut", "actif")
      .not("membres.email", "is", null);

    if (pretsError) {
      console.error("Erreur récupération prêts:", pretsError);
      throw pretsError;
    }

    // Récupérer aussi les prêts en retard
    const { data: pretsEnRetard } = await supabase
      .from("prets")
      .select(`
        id,
        montant,
        montant_paye,
        montant_total_du,
        capital_paye,
        interet_paye,
        interet_initial,
        taux_interet,
        echeance,
        date_pret,
        reconductions,
        membre_id,
        membres!inner(id, nom, prenom, email, statut)
      `)
      .neq("statut", "rembourse")
      .lt("echeance", todayStr)
      .eq("membres.statut", "actif")
      .not("membres.email", "is", null);

    const allPrets = [...(pretsAEcheance || []), ...(pretsEnRetard || [])];

    if (allPrets.length === 0) {
      console.log("Aucun prêt à échéance proche ou en retard trouvé");
      return new Response(
        JSON.stringify({ success: true, message: "Aucun prêt concerné", emailsSent: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let emailsSent = 0;
    let emailsErrors = 0;
    const errors: string[] = [];

    for (const pret of allPrets) {
      const membre = (pret as any).membres;
      if (!membre?.email) continue;

      const montantTotal = pret.montant_total_du || (pret.montant + (pret.montant * (pret.taux_interet || 0) / 100) * (1 + (pret.reconductions || 0)));
      const montantPaye = pret.montant_paye || 0;
      const resteAPayer = montantTotal - montantPaye;
      const capitalRestant = pret.montant - (pret.capital_paye || 0);
      const interetsRestants = (pret.interet_initial || 0) - (pret.interet_paye || 0);

      const dateEcheance = new Date(pret.echeance);
      const datePret = new Date(pret.date_pret);
      const isEnRetard = dateEcheance < today;

      const emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: ${isEnRetard ? 'linear-gradient(135deg, #ef4444, #dc2626)' : 'linear-gradient(135deg, #3b82f6, #2563eb)'}; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
            .alert { background: ${isEnRetard ? '#fef2f2' : '#dbeafe'}; border: 1px solid ${isEnRetard ? '#ef4444' : '#3b82f6'}; padding: 15px; border-radius: 8px; margin: 15px 0; }
            .details { background: white; padding: 15px; border-radius: 8px; margin: 15px 0; }
            .detail-row { display: flex; justify-content: space-between; margin: 8px 0; padding: 5px 0; border-bottom: 1px solid #e5e7eb; }
            .total { font-size: 24px; font-weight: bold; color: ${isEnRetard ? '#dc2626' : '#2563eb'}; text-align: center; margin: 15px 0; }
            .footer { text-align: center; padding: 15px; color: #6b7280; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${isEnRetard ? '🚨 Prêt en Retard' : '📅 Rappel Échéance Prêt'}</h1>
            </div>
            <div class="content">
              <p>Bonjour ${membre.prenom} ${membre.nom},</p>
              
              <div class="alert">
                ${isEnRetard 
                  ? `<strong>⚠️ Attention :</strong> Votre prêt a dépassé son échéance depuis le ${dateEcheance.toLocaleDateString("fr-FR")}.`
                  : `<strong>📌 Rappel :</strong> L'échéance de votre prêt approche (${dateEcheance.toLocaleDateString("fr-FR")}).`
                }
              </div>
              
              <div class="details">
                <div class="detail-row">
                  <span><strong>Date du prêt :</strong></span>
                  <span>${datePret.toLocaleDateString("fr-FR")}</span>
                </div>
                <div class="detail-row">
                  <span><strong>Montant initial :</strong></span>
                  <span>${pret.montant.toLocaleString("fr-FR")} FCFA</span>
                </div>
                <div class="detail-row">
                  <span><strong>Taux d'intérêt :</strong></span>
                  <span>${pret.taux_interet || 0}%</span>
                </div>
                ${pret.reconductions && pret.reconductions > 0 ? `
                <div class="detail-row">
                  <span><strong>Reconductions :</strong></span>
                  <span>${pret.reconductions} fois</span>
                </div>
                ` : ''}
                <div class="detail-row">
                  <span><strong>Montant total dû :</strong></span>
                  <span>${montantTotal.toLocaleString("fr-FR")} FCFA</span>
                </div>
                <div class="detail-row">
                  <span><strong>Déjà payé :</strong></span>
                  <span>${montantPaye.toLocaleString("fr-FR")} FCFA</span>
                </div>
                <div class="detail-row">
                  <span><strong>Capital restant :</strong></span>
                  <span>${capitalRestant.toLocaleString("fr-FR")} FCFA</span>
                </div>
                <div class="detail-row">
                  <span><strong>Intérêts restants :</strong></span>
                  <span>${interetsRestants.toLocaleString("fr-FR")} FCFA</span>
                </div>
              </div>
              
              <div class="total">Reste à payer : ${resteAPayer.toLocaleString("fr-FR")} FCFA</div>
              
              <p>${isEnRetard 
                ? 'Nous vous prions de régulariser votre situation dans les plus brefs délais. Des pénalités de retard peuvent s\'appliquer.'
                : 'Merci de prévoir le remboursement de votre prêt avant l\'échéance.'
              }</p>
              
              <p>Pour toute question, contactez le trésorier.</p>
              
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
        console.log(`[TEST] Email préparé pour ${membre.email} - Prêt ${isEnRetard ? 'en retard' : 'à échéance'}`);
        emailsSent++;
        continue;
      }

      try {
        const { error: emailError } = await resend.emails.send({
          from: "E2D <onboarding@resend.dev>",
          to: [membre.email],
          subject: isEnRetard 
            ? `🚨 Prêt en retard - ${resteAPayer.toLocaleString("fr-FR")} FCFA à rembourser`
            : `Rappel : Échéance de prêt le ${dateEcheance.toLocaleDateString("fr-FR")}`,
          html: emailHtml,
        });

        if (emailError) {
          console.error(`Erreur envoi email à ${membre.email}:`, emailError);
          errors.push(`${membre.email}: ${emailError.message}`);
          emailsErrors++;
        } else {
          console.log(`Email envoyé à ${membre.email}`);
          emailsSent++;

          // Enregistrer dans l'historique
          await supabase.from("notifications_historique").insert({
            type_notification: "rappel_pret",
            destinataire_email: membre.email,
            sujet: isEnRetard 
              ? `Prêt en retard - ${resteAPayer.toLocaleString("fr-FR")} FCFA`
              : `Échéance de prêt le ${dateEcheance.toLocaleDateString("fr-FR")}`,
            contenu: emailHtml,
            statut: "envoye",
            variables_utilisees: { pret_id: pret.id, montant_restant: resteAPayer, en_retard: isEnRetard }
          });
        }
      } catch (emailErr: any) {
        console.error(`Exception envoi email à ${membre.email}:`, emailErr);
        errors.push(`${membre.email}: ${emailErr.message}`);
        emailsErrors++;
      }
    }

    console.log(`Résumé: ${emailsSent} emails envoyés, ${emailsErrors} erreurs`);

    return new Response(
      JSON.stringify({
        success: true,
        emailsSent,
        emailsErrors,
        pretsCount: allPrets.length,
        pretsEnRetard: pretsEnRetard?.length || 0,
        pretsAEcheance: pretsAEcheance?.length || 0,
        errors: errors.length > 0 ? errors : undefined,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Erreur dans send-pret-echeance-reminders:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
