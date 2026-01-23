import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CalendrierItem {
  rang: number;
  nom: string;
  mois: string;
  montantMensuel: number;
  montantTotal: number;
}

interface RequestBody {
  exerciceId: string;
  exerciceNom: string;
  calendrier: CalendrierItem[];
}

const formatFCFA = (amount: number): string => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount) + ' FCFA';
};

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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Charger la clé API depuis la DB
    const resendApiKey = await getResendApiKey(supabase);
    if (!resendApiKey) {
      throw new Error("Clé API Resend non configurée. Veuillez la configurer dans Configuration → Email.");
    }

    const body: RequestBody = await req.json();
    const { exerciceNom, calendrier } = body;

    console.log("Envoi calendrier bénéficiaires pour:", exerciceNom);

    // Récupérer tous les membres E2D avec email
    const { data: membres, error: membresError } = await supabase
      .from("membres")
      .select("id, nom, prenom, email")
      .eq("statut", "actif")
      .eq("est_membre_e2d", true)
      .not("email", "is", null);

    if (membresError) {
      throw membresError;
    }

    if (!membres || membres.length === 0) {
      return new Response(
        JSON.stringify({ success: true, emailsSent: 0, message: "Aucun membre avec email" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Calculer le total
    const totalAnnuel = calendrier.reduce((sum, c) => sum + c.montantTotal, 0);

    // Générer le tableau HTML avec logo E2D
    const tableRows = calendrier.map(c => `
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${c.rang}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${c.nom}</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${c.mois}</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">${formatFCFA(c.montantMensuel)}</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: right; font-weight: bold;">${formatFCFA(c.montantTotal)}</td>
      </tr>
    `).join('');

    // Template email HTML amélioré avec logo
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 800px; margin: 0 auto; padding: 20px; }
          .header { text-align: center; margin-bottom: 30px; background: linear-gradient(135deg, #006400, #228B22); padding: 30px; border-radius: 8px; }
          .header h1 { color: white; margin: 0; }
          .header p { color: rgba(255,255,255,0.9); margin: 10px 0 0 0; }
          .logo { font-size: 48px; margin-bottom: 10px; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th { background-color: #006400; color: white; padding: 12px 8px; text-align: left; }
          .total { background-color: #f5f5f5; font-weight: bold; }
          .info-box { background: #e8f5e9; border-left: 4px solid #006400; padding: 15px; margin: 20px 0; border-radius: 4px; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">🏆</div>
            <h1>E2D - Calendrier des Bénéficiaires</h1>
            <p>Exercice : ${exerciceNom}</p>
          </div>
          
          <p>Chers membres,</p>
          <p>Veuillez trouver ci-dessous le calendrier officiel des bénéficiaires pour l'exercice <strong>${exerciceNom}</strong>.</p>
          
          <table>
            <thead>
              <tr>
                <th style="text-align: center; width: 60px;">Rang</th>
                <th>Membre</th>
                <th style="text-align: center;">Mois</th>
                <th style="text-align: right;">Mensuel</th>
                <th style="text-align: right;">Total (×12)</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows}
              <tr class="total">
                <td colspan="4" style="padding: 12px 8px; border: 1px solid #ddd; text-align: right; font-size: 16px;">Total Annuel :</td>
                <td style="padding: 12px 8px; border: 1px solid #ddd; text-align: right; color: #006400; font-size: 18px;">${formatFCFA(totalAnnuel)}</td>
              </tr>
            </tbody>
          </table>
          
          <div class="info-box">
            <strong>📌 Information importante :</strong><br>
            Ce calendrier définit l'ordre de passage des bénéficiaires. Chaque bénéficiaire recevra son montant total (mensuel × 12) moins les éventuelles déductions (sanctions impayées, cotisations non réglées, etc.).
          </div>
          
          <div class="footer">
            <p>Cet email a été envoyé automatiquement par le système de gestion E2D.</p>
            <p>© ${new Date().getFullYear()} E2D - Association Ensemble pour le Développement Durable - Tous droits réservés</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Envoyer les emails via fetch à Resend API
    let emailsSent = 0;
    let emailsErrors = 0;

    for (const membre of membres) {
      if (!membre.email) continue;

      try {
        const response = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${resendApiKey}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            from: "E2D <notifications@resend.dev>",
            to: [membre.email],
            subject: `[E2D] 📅 Calendrier des Bénéficiaires - ${exerciceNom}`,
            html: htmlContent
          })
        });
        
        if (response.ok) {
          emailsSent++;
          console.log(`Email envoyé à ${membre.email}`);
        } else {
          throw new Error(await response.text());
        }
      } catch (emailError) {
        console.error(`Erreur envoi à ${membre.email}:`, emailError);
        emailsErrors++;
      }
    }

    console.log(`Résultat: ${emailsSent} envoyés, ${emailsErrors} erreurs`);

    return new Response(
      JSON.stringify({
        success: true,
        emailsSent,
        emailsErrors,
        totalMembres: membres.length
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Erreur:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
