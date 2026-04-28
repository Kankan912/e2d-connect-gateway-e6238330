import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendEmailAuto } from "../_shared/email-utils.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

type EventType = "created" | "step_validated" | "rejected" | "final_approved";

interface Payload {
  request_id: string;
  event: EventType;
  step_label?: string;
  validator_name?: string;
  motif?: string;
}

const APP_URL = Deno.env.get("APP_URL") ?? "";

function fmtMontant(n: number) {
  return new Intl.NumberFormat("fr-FR").format(Math.floor(n)) + " FCFA";
}

function htmlShell(title: string, body: string) {
  return `<!doctype html><html><body style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:24px;color:#222;">
    <h2 style="color:#1a56db;margin:0 0 16px;">${title}</h2>
    ${body}
    <hr style="margin:24px 0;border:none;border-top:1px solid #eee;"/>
    <p style="font-size:12px;color:#888;">Email automatique — Ne pas répondre.</p>
  </body></html>`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const payload: Payload = await req.json();
    if (!payload?.request_id || !payload?.event) {
      return new Response(JSON.stringify({ error: "Payload invalide" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Charge la demande complète
    const { data: request, error: errReq } = await supabase
      .from("loan_requests")
      .select("id, montant, description, urgence, duree_mois, statut, motif_rejet, membre_id, membres(nom, prenom)")
      .eq("id", payload.request_id)
      .single();

    if (errReq || !request) {
      return new Response(JSON.stringify({ error: "Demande introuvable" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const membreNom = `${(request as any).membres?.prenom ?? ""} ${(request as any).membres?.nom ?? ""}`.trim() || "Membre";
    const recap = `
      <p><strong>Demandeur :</strong> ${membreNom}</p>
      <p><strong>Montant :</strong> ${fmtMontant(Number(request.montant))}</p>
      <p><strong>Durée :</strong> ${request.duree_mois} mois</p>
      <p><strong>Urgence :</strong> ${request.urgence}</p>
      <p><strong>Description :</strong> ${request.description}</p>
    `;

    const link = APP_URL ? `<p><a href="${APP_URL}/dashboard" style="background:#1a56db;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;">Ouvrir l'application</a></p>` : "";

    const sent: string[] = [];
    const failed: string[] = [];

    if (payload.event === "created") {
      // Notifier tous les validateurs
      const { data: validators } = await supabase.rpc("get_loan_request_validators_emails", {
        _request_id: payload.request_id,
      });
      const recipients: string[] = Array.from(
        new Set(((validators ?? []) as Array<{ email: string }>).map((v) => v.email).filter(Boolean))
      );
      const subject = `Nouvelle demande de prêt — ${membreNom}`;
      const html = htmlShell(
        "Nouvelle demande de prêt",
        `<p>Une nouvelle demande de prêt a été soumise et requiert validation.</p>${recap}${link}`
      );

      for (const to of recipients) {
        const r = await sendEmailAuto({ to, subject, html });
        (r.success ? sent : failed).push(to);
      }
    } else {
      // Notifier le demandeur
      const { data: rows } = await supabase.rpc("get_loan_request_member_email", {
        _request_id: payload.request_id,
      });
      const member = (rows ?? [])[0] as { email: string; nom: string; prenom: string } | undefined;
      if (member?.email) {
        let subject = "";
        let body = "";
        if (payload.event === "step_validated") {
          subject = `Votre demande de prêt a été validée par ${payload.step_label ?? "un validateur"}`;
          body = `<p>Bonjour ${member.prenom},</p>
            <p>Votre demande de prêt a été <strong>validée</strong> par <em>${payload.step_label ?? ""}</em>${payload.validator_name ? ` (${payload.validator_name})` : ""}.</p>
            ${recap}
            <p>Le processus de validation se poursuit.</p>${link}`;
        } else if (payload.event === "rejected") {
          subject = `Votre demande de prêt a été rejetée`;
          body = `<p>Bonjour ${member.prenom},</p>
            <p>Votre demande de prêt a été <strong>rejetée</strong> à l'étape <em>${payload.step_label ?? ""}</em>${payload.validator_name ? ` par ${payload.validator_name}` : ""}.</p>
            <p><strong>Motif :</strong> ${payload.motif ?? request.motif_rejet ?? "—"}</p>
            ${recap}${link}`;
        } else if (payload.event === "final_approved") {
          subject = `Votre prêt est approuvé`;
          body = `<p>Bonjour ${member.prenom},</p>
            <p>Bonne nouvelle : votre demande de prêt a été <strong>entièrement approuvée</strong>.</p>
            ${recap}
            <p>Veuillez vous rapprocher du <strong>trésorier</strong> pour le décaissement.</p>${link}`;
        }
        const r = await sendEmailAuto({ to: member.email, subject, html: htmlShell(subject, body) });
        (r.success ? sent : failed).push(member.email);
      }
    }

    return new Response(
      JSON.stringify({ success: true, sent, failed, event: payload.event }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[send-loan-notification] error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
