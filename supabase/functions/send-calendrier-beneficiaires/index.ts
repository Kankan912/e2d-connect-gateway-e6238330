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

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

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

    // Générer le tableau HTML
    const tableRows = calendrier.map(c => `
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${c.rang}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${c.nom}</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${c.mois}</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">${formatFCFA(c.montantMensuel)}</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: right; font-weight: bold;">${formatFCFA(c.montantTotal)}</td>
      </tr>
    `).join('');

    // Template email HTML
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 800px; margin: 0 auto; padding: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .header h1 { color: #006400; margin: 0; }
          .header p { color: #666; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th { background-color: #006400; color: white; padding: 12px 8px; text-align: left; }
          .total { background-color: #f5f5f5; font-weight: bold; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>E2D - Calendrier des Bénéficiaires</h1>
            <p>Exercice: ${exerciceNom}</p>
          </div>
          
          <p>Chers membres,</p>
          <p>Veuillez trouver ci-dessous le calendrier des bénéficiaires pour l'exercice ${exerciceNom}.</p>
          
          <table>
            <thead>
              <tr>
                <th>Rang</th>
                <th>Membre</th>
                <th>Mois</th>
                <th>Mensuel</th>
                <th>Total (×12)</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows}
              <tr class="total">
                <td colspan="4" style="padding: 12px 8px; border: 1px solid #ddd; text-align: right;">Total Annuel:</td>
                <td style="padding: 12px 8px; border: 1px solid #ddd; text-align: right; color: #006400;">${formatFCFA(totalAnnuel)}</td>
              </tr>
            </tbody>
          </table>
          
          <p>Ce calendrier définit l'ordre de passage des bénéficiaires. Chaque bénéficiaire recevra son montant total (mensuel × 12) moins les éventuelles déductions (sanctions impayées, etc.).</p>
          
          <div class="footer">
            <p>Cet email a été envoyé automatiquement par le système de gestion E2D.</p>
            <p>© ${new Date().getFullYear()} E2D - Tous droits réservés</p>
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
            subject: `[E2D] Calendrier des Bénéficiaires - ${exerciceNom}`,
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
