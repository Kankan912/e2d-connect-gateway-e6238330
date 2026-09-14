import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getFullEmailConfig, sendEmail, validateFullEmailConfig } from "../_shared/email-utils.ts";
import { buildCorsHeaders, handleCorsPreflight } from "../_shared/cors.ts";
import { requirePrivilegedUser } from "../_shared/auth-check.ts";
import { escapeHtml, escapeList } from "../_shared/html.ts";

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
  beneficiaires?: {
    count: number;
    total: number;
    details?: Array<{ nom: string; montant: number; statut: string }>;
  };
}

interface SendReunionCRRequest {
  reunionId: string;
  sujet?: string;
  contenu?: string;
  dateReunion?: string;
  lieu?: string;
  heure?: string;
  ordreDuJour?: string;
  presences?: PresenceInfo;
  financials?: FinancialSummary;
  isPreview?: boolean;
  /**
   * Périmètre des destinataires, résolu côté serveur :
   * `tous` (défaut), `presents` ou `absents` — jamais une liste d'adresses.
   */
  cible?: "tous" | "presents" | "absents";
}

const fmt = (n: number) => Math.floor(Number(n) || 0).toLocaleString("fr-FR");

serve(async (req: Request): Promise<Response> => {
  const corsHeaders = buildCorsHeaders(req);
  const preflight = handleCorsPreflight(req);
  if (preflight) return preflight;

  try {
    const body: SendReunionCRRequest = await req.json();
    if (!body?.reunionId) {
      return new Response(JSON.stringify({ error: "reunionId requis" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // 1. Résoudre la réunion et SON association (jamais fournie par le client)
    const { data: reunion, error: reunionError } = await admin
      .from("reunions")
      .select("id, association_id, sujet, date_reunion, lieu_description, ordre_du_jour")
      .eq("id", body.reunionId)
      .maybeSingle();

    if (reunionError || !reunion) {
      return new Response(JSON.stringify({ error: "Réunion introuvable" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Autorisation : rôle privilégié DANS l'association de la réunion
    const authError = await requirePrivilegedUser(req, corsHeaders, reunion.association_id);
    if (authError) return authError;

    // 3. Configuration email
    const emailConfig = await getFullEmailConfig();
    const validation = validateFullEmailConfig(emailConfig);
    if (!validation.valid) {
      return new Response(
        JSON.stringify({ error: "Configuration manquante", message: validation.error }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // 4. Destinataires calculés côté serveur : tous les membres actifs de l'association
    const { data: membres, error: membresError } = await admin
      .from("membres")
      .select("id, nom, prenom, email")
      .eq("association_id", reunion.association_id)
      .eq("statut", "actif")
      .not("email", "is", null);

    if (membresError) throw membresError;

    let destinataires = (membres ?? []).filter((m) => !!m.email);

    // Périmètre optionnel : présents / absents, calculé depuis les présences en base
    const cible = body.cible === "presents" || body.cible === "absents" ? body.cible : "tous";
    if (cible !== "tous") {
      const { data: presencesRows } = await admin
        .from("reunions_presences")
        .select("membre_id, statut_presence")
        .eq("reunion_id", reunion.id);
      const presentIds = new Set(
        (presencesRows ?? [])
          .filter((p) => p.statut_presence === "present")
          .map((p) => p.membre_id),
      );
      destinataires = destinataires.filter((m) =>
        cible === "presents" ? presentIds.has(m.id) : !presentIds.has(m.id)
      );
    }

    if (destinataires.length === 0) {
      return new Response(
        JSON.stringify({ success: true, sentCount: 0, errorCount: 0, message: "Aucun membre avec email" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const dateObj = new Date(reunion.date_reunion);
    const dateReunion = body.dateReunion ??
      dateObj.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
    const heure = body.heure ??
      dateObj.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
    const lieu = body.lieu ?? reunion.lieu_description ?? "";
    const ordreDuJour = body.ordreDuJour ?? reunion.ordre_du_jour ?? "";
    const sujet = body.sujet ?? reunion.sujet ?? "Réunion";
    const contenu = body.contenu ?? "";
    const previewLabel = body.isPreview ? "[APERÇU] " : "";

    const presences = body.presences;
    const presencesHtml = presences
      ? `
      <div class="presences-section">
        <h2>Présences — Taux : ${escapeHtml(presences.tauxPresence)}%</h2>
        <p><strong>Présents (${presences.presents.length}) :</strong> ${presences.presents.length > 0 ? escapeList(presences.presents) : "Aucun"}</p>
        ${presences.excuses.length > 0 ? `<p><em>Excusés (${presences.excuses.length}) :</em> ${escapeList(presences.excuses)}</p>` : ""}
        ${presences.retards.length > 0 ? `<p><em>Retards (${presences.retards.length}) :</em> ${escapeList(presences.retards)}</p>` : ""}
        ${presences.absentsNonExcuses.length > 0 ? `<p style="color:#dc2626;"><strong>Absents non excusés (${presences.absentsNonExcuses.length}) :</strong> ${escapeList(presences.absentsNonExcuses)}</p>` : ""}
      </div>`
      : "";

    let financialsHtml = "";
    const f = body.financials;
    if (f) {
      const items: string[] = [];
      const line = (label: string, value: string) =>
        `<div class="financial-item"><span class="label">${label}</span><span class="value">${value}</span></div>`;
      if (f.cotisations?.count) {
        items.push(line("Cotisations collectées", `${fmt(f.cotisations.total)} FCFA (${f.cotisations.count})`));
      }
      if (f.epargnes?.count) {
        items.push(line("Épargnes déposées", `${fmt(f.epargnes.total)} FCFA (${f.epargnes.count})`));
      }
      if (f.sanctions?.count) {
        items.push(line("Sanctions", `${fmt(f.sanctions.total)} FCFA (${f.sanctions.count})`));
      }
      if (f.beneficiaires?.count) {
        let benef = line("Bénéficiaires du mois", `${fmt(f.beneficiaires.total)} FCFA`);
        if (f.beneficiaires.details?.length) {
          benef += "<ul style=\"margin:5px 0 0 20px;padding:0;\">" +
            f.beneficiaires.details
              .map((b) =>
                `<li>${b.statut === "paye" ? "✅" : "⏳"} ${escapeHtml(b.nom)} : ${fmt(b.montant)} FCFA</li>`
              )
              .join("") +
            "</ul>";
        }
        items.push(benef);
      }
      if (items.length > 0) {
        financialsHtml = `<div class="financials-section"><h2>Résumé financier</h2>${items.join("")}</div>`;
      }
    }

    let sentCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    for (const destinataire of destinataires) {
      try {
        const htmlContent = `
          <!DOCTYPE html>
          <html><head><meta charset="utf-8"><style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .header { background: #0B6B7C; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; }
            .footer { background: #f3f4f6; padding: 15px; text-align: center; font-size: 12px; color: #666; }
            h1 { margin: 0; font-size: 24px; }
            h2 { color: #0B6B7C; border-bottom: 2px solid #0B6B7C; padding-bottom: 5px; margin-top: 20px; }
            .info-box { background: #e6f4f6; border-left: 4px solid #0B6B7C; padding: 15px; margin: 15px 0; }
            .presences-section { background: #f9fafb; padding: 15px; border-radius: 8px; margin: 15px 0; }
            .financials-section { background: #f0fdf4; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #22c55e; }
            .financial-item { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
            .financial-item .value { font-weight: bold; color: #0B6B7C; }
          </style></head>
          <body>
            <div class="header"><h1>Compte-rendu de réunion</h1></div>
            <div class="content">
              <p>Bonjour ${escapeHtml(destinataire.prenom)} ${escapeHtml(destinataire.nom)},</p>
              <div class="info-box">
                <strong>Date de la réunion :</strong> ${escapeHtml(dateReunion)}
                <br/><strong>Heure :</strong> ${escapeHtml(heure)}
                <br/><strong>Lieu :</strong> ${escapeHtml(lieu) || "non précisé"}
                <br/><strong>Ordre du jour :</strong> ${escapeHtml(ordreDuJour) || "non précisé"}
              </div>
              ${presencesHtml}
              ${financialsHtml}
              <h2>${escapeHtml(sujet)}</h2>
              <div style="white-space: pre-wrap;">${escapeHtml(contenu)}</div>
            </div>
            <div class="footer">
              <p>Message envoyé automatiquement — merci de ne pas y répondre.</p>
              <p>© ${new Date().getFullYear()}</p>
            </div>
          </body></html>`;

        const result = await sendEmail(emailConfig, {
          to: destinataire.email!,
          subject: `${previewLabel}Compte-rendu : ${sujet}`,
          html: htmlContent,
        });
        if (!result.success) throw new Error(result.error || "Failed to send email");
        sentCount++;
        await new Promise((r) => setTimeout(r, 600));
      } catch (emailError: unknown) {
        errorCount++;
        errors.push(`${destinataire.email}: ${emailError instanceof Error ? emailError.message : String(emailError)}`);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        sentCount,
        errorCount,
        recipients: destinataires.length,
        service: emailConfig.service,
        errors: errors.length > 0 ? errors : undefined,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[send-reunion-cr]", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
