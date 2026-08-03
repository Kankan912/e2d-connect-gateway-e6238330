/**
 * useEmailConfig — état, chargement, validation, tests et bascule de provider
 * pour l'écran de configuration email. Extrait de `EmailConfigManager.tsx`
 * (Lot Q3) : aucune modification de logique métier.
 */
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CheckCircle, XCircle } from "lucide-react";
import { createElement } from "react";
import { logger } from "@/lib/logger";
import {
  commonSchema,
  smtpFieldsSchema,
  resendKeySchema,
  type EmailService,
  type SmtpEncryption,
  type ValidationScope,
} from "./emailConfigSchemas";

export interface TestResult {
  success: boolean;
  message: string;
  provider?: string;
  fallback?: boolean;
  duration_ms?: number;
}

export function useEmailConfig() {
  const queryClient = useQueryClient();
  const [showPassword, setShowPassword] = useState(false);
  const [showResendKey, setShowResendKey] = useState(false);
  const [testingResend, setTestingResend] = useState(false);
  const [testingSmtp, setTestingSmtp] = useState(false);
  const [savingResendKey, setSavingResendKey] = useState(false);

  // Local state for form
  const [emailService, setEmailService] = useState<EmailService | null>(null);
  const [appUrl, setAppUrl] = useState("");
  const [emailExpediteur, setEmailExpediteur] = useState("");
  const [emailExpediteurNom, setEmailExpediteurNom] = useState("");
  const [resendApiKey, setResendApiKey] = useState("");

  // SMTP config state
  const [smtpHost, setSmtpHost] = useState("");
  const [smtpPort, setSmtpPort] = useState("587");
  const [smtpUser, setSmtpUser] = useState("");
  const [smtpPassword, setSmtpPassword] = useState("");
  const [smtpEncryption, setSmtpEncryption] = useState<SmtpEncryption>("tls");
  const [smtpConfigId, setSmtpConfigId] = useState<string | null>(null);

  // Validation & bascule
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [switchTarget, setSwitchTarget] = useState<EmailService | null>(null);
  const [lastTestResult, setLastTestResult] = useState<TestResult | null>(null);

  const { data: configs, isLoading: configsLoading } = useQuery({
    queryKey: ["email-configurations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("configurations")
        .select("*")
        .in("cle", ["email_service", "app_url", "email_expediteur", "email_expediteur_nom"]);
      if (error) throw error;
      return data;
    },
  });

  const { data: smtpConfig, isLoading: smtpLoading } = useQuery({
    queryKey: ["smtp-config"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("smtp_config")
        .select("*")
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (configs) {
      const emailServiceConfig = configs.find((c) => c.cle === "email_service");
      const appUrlConfig = configs.find((c) => c.cle === "app_url");
      const emailExpConfig = configs.find((c) => c.cle === "email_expediteur");
      const emailExpNomConfig = configs.find((c) => c.cle === "email_expediteur_nom");

      setEmailService((emailServiceConfig?.valeur as EmailService) || "resend");
      setAppUrl(appUrlConfig?.valeur || "");
      setEmailExpediteur(emailExpConfig?.valeur || "");
      setEmailExpediteurNom(emailExpNomConfig?.valeur || "");
    }
  }, [configs]);

  useEffect(() => {
    if (smtpConfig) {
      setSmtpConfigId(smtpConfig.id);
      setSmtpHost(smtpConfig.serveur_smtp || "");
      setSmtpPort(String(smtpConfig.port_smtp || 587));
      setSmtpUser(smtpConfig.utilisateur_smtp || "");
      // Sécurité : ne JAMAIS pré-remplir le mot de passe SMTP côté client.
      setSmtpPassword("");
      setSmtpEncryption((smtpConfig.encryption_type as SmtpEncryption) || "tls");
    }
  }, [smtpConfig]);

  const saveConfigMutation = useMutation({
    mutationFn: async () => {
      const updates = [
        { cle: "email_service", valeur: emailService },
        { cle: "app_url", valeur: appUrl },
        { cle: "email_expediteur", valeur: emailExpediteur },
        { cle: "email_expediteur_nom", valeur: emailExpediteurNom },
      ];

      for (const config of updates) {
        // C4 — Chaîner .select() pour détecter un échec RLS silencieux
        const { data: updated, error } = await supabase
          .from("configurations")
          .update({ valeur: config.valeur, updated_at: new Date().toISOString() })
          .eq("cle", config.cle)
          .select();
        if (error) throw error;
        if (!updated || updated.length === 0) {
          throw new Error(
            `Échec de la mise à jour de "${config.cle}" : permissions insuffisantes ou clé introuvable`
          );
        }
      }

      if (emailService === "smtp") {
        const baseSmtpData: Record<string, unknown> = {
          serveur_smtp: smtpHost,
          port_smtp: parseInt(smtpPort),
          utilisateur_smtp: smtpUser,
          encryption_type: smtpEncryption,
          actif: true,
        };
        if (smtpPassword && smtpPassword.length > 0) {
          baseSmtpData.mot_de_passe_smtp = smtpPassword;
        }

        if (smtpConfigId) {
          const { data: updatedSmtp, error } = await supabase
            .from("smtp_config")
            .update(baseSmtpData)
            .eq("id", smtpConfigId)
            .select();
          if (error) throw error;
          if (!updatedSmtp || updatedSmtp.length === 0) {
            throw new Error("Échec de la mise à jour SMTP : permissions insuffisantes ou session expirée");
          }
        } else {
          if (!smtpPassword) {
            throw new Error("Mot de passe SMTP requis pour la première configuration");
          }
          const { error } = await supabase
            .from("smtp_config")
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .insert(baseSmtpData as any);
          if (error) throw error;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-configurations"], refetchType: "all" });
      queryClient.invalidateQueries({ queryKey: ["smtp-config"], refetchType: "all" });
      setSmtpPassword("");
      setShowPassword(false);
      setFieldErrors({});
      toast.success("Configuration email sauvegardée");
    },
    onError: (error) => {
      logger.error("Error saving config:", error);
      toast.error("Erreur lors de la sauvegarde");
    },
  });

  /** Valide les champs demandés. Renvoie true si OK, sinon met à jour fieldErrors + toast. */
  const validate = (scope: ValidationScope): boolean => {
    const errors: Record<string, string> = {};
    const commonPayload = { emailExpediteur, emailExpediteurNom, appUrl };
    const smtpPayload = { smtpHost, smtpPort, smtpUser, smtpEncryption };

    if (scope === "common" || scope === "smtp" || scope === "all") {
      const r = commonSchema.safeParse(commonPayload);
      if (!r.success) for (const iss of r.error.issues) errors[String(iss.path[0])] = iss.message;
    }
    if (scope === "smtp" || (scope === "all" && emailService === "smtp")) {
      const r = smtpFieldsSchema.safeParse(smtpPayload);
      if (!r.success) for (const iss of r.error.issues) errors[String(iss.path[0])] = iss.message;
      if (!smtpConfigId && !smtpPassword) errors.smtpPassword = "Mot de passe requis (première configuration)";
    }
    if (scope === "resend-key") {
      const r = resendKeySchema.safeParse(resendApiKey);
      if (!r.success) errors.resendApiKey = r.error.issues[0]?.message || "Clé Resend invalide";
    }

    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      toast.error(Object.values(errors)[0]);
      return false;
    }
    return true;
  };

  const runConfigurationTest = async (provider: "auto" | "resend" | "smtp", enableFallback = false) => {
    const needsSmtp = provider === "smtp" || (provider === "auto" && emailService === "smtp");
    if (!validate(needsSmtp ? "smtp" : "common")) return;

    if (provider === "resend" || provider === "auto") setTestingResend(true);
    if (provider === "smtp") setTestingSmtp(true);

    try {
      if (provider === "smtp" || (provider === "auto" && emailService === "smtp")) {
        if (!smtpHost || !smtpUser) {
          throw new Error("Configuration SMTP incomplète — Renseignez serveur et utilisateur");
        }
        if (smtpPassword) {
          const smtpData: Record<string, unknown> = {
            serveur_smtp: smtpHost.trim(),
            port_smtp: parseInt(smtpPort),
            utilisateur_smtp: smtpUser.trim(),
            mot_de_passe_smtp: smtpPassword,
            encryption_type: smtpEncryption,
            actif: true,
          };
          if (smtpConfigId) {
            await supabase.from("smtp_config").update(smtpData).eq("id", smtpConfigId);
          } else {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await supabase.from("smtp_config").insert(smtpData as any);
          }
          queryClient.invalidateQueries({ queryKey: ["smtp-config"] });
        }
      }

      const to = emailExpediteur || smtpUser;
      if (!to) throw new Error("Aucun destinataire de test : configurez l'email expéditeur");

      const { data, error } = await supabase.functions.invoke("test-email-configuration", {
        body: { to, provider, enableFallback },
      });

      let payload = (data ?? {}) as Partial<TestResult> & { success?: boolean };

      if (error && (!payload || !payload.message)) {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const resp = (error as any)?.context?.response;
          if (resp && typeof resp.json === "function") {
            const body = await resp.clone().json();
            payload = { ...payload, ...body };
          }
        } catch {
          /* ignore */
        }
      }

      if (error || !payload.success) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const msg = payload.message || (error as any)?.message || "Échec du test";
        setLastTestResult({ success: false, message: msg, provider: payload.provider });
        toast.error(msg, { icon: createElement(XCircle, { className: "h-4 w-4 text-red-500" }) });
        return;
      }

      setLastTestResult({
        success: true,
        message: payload.message || "Test réussi",
        provider: payload.provider,
        fallback: payload.fallback,
        duration_ms: payload.duration_ms,
      });
      const label = payload.fallback
        ? `Fallback ${payload.provider} utilisé — email envoyé à ${to}`
        : `Test ${payload.provider} réussi — email envoyé à ${to}${payload.duration_ms ? ` (${payload.duration_ms} ms)` : ""}`;
      toast.success(label, { icon: createElement(CheckCircle, { className: "h-4 w-4 text-green-500" }) });
      if (needsSmtp && smtpPassword) {
        setSmtpPassword("");
        setShowPassword(false);
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Erreur inconnue";
      setLastTestResult({ success: false, message: msg });
      toast.error("Test échoué : " + msg, { icon: createElement(XCircle, { className: "h-4 w-4 text-red-500" }) });
    } finally {
      setTestingResend(false);
      setTestingSmtp(false);
    }
  };

  const saveResendKey = async () => {
    if (!validate("resend-key")) return;
    setSavingResendKey(true);
    try {
      const { error } = await supabase.functions.invoke("update-email-config", {
        body: { resend_api_key: resendApiKey, email_mode: "resend", email_service: "resend" },
      });
      if (error) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        throw new Error((error as any)?.message || "Impossible d'enregistrer la clé");
      }
      toast.success("Clé API Resend enregistrée");
      setResendApiKey("");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Impossible d'enregistrer la clé";
      toast.error("Erreur: " + msg);
    } finally {
      setSavingResendKey(false);
    }
  };

  const smtpReady = Boolean(smtpHost && smtpUser && (smtpConfigId || smtpPassword));

  /** Demande de bascule : valide puis ouvre la dialog de confirmation. */
  const requestSwitchProvider = (target: EmailService) => {
    if (target === emailService) return;
    if (target === "smtp") {
      if (!validate("smtp")) return;
      if (!smtpReady) {
        toast.error("Complétez la configuration SMTP avant de basculer");
        return;
      }
    }
    if (target === "resend") {
      if (resendApiKey && !resendApiKey.trim().startsWith("re_")) {
        setFieldErrors((prev) => ({ ...prev, resendApiKey: "La clé doit commencer par 're_'" }));
        toast.error("Clé API Resend invalide (doit commencer par 're_')");
        return;
      }
    }
    setSwitchTarget(target);
  };

  const handleSwitchProvider = async (target: EmailService) => {
    setEmailService(target);
    try {
      const { error } = await supabase
        .from("configurations")
        .update({ valeur: target, updated_at: new Date().toISOString() })
        .eq("cle", "email_service")
        .select();
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["email-configurations"] });
      toast.success(`Provider actif : ${target === "smtp" ? "SMTP" : "Resend"}`);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Erreur inconnue";
      toast.error("Bascule échouée : " + msg);
    } finally {
      setSwitchTarget(null);
    }
  };

  const configStatus = (() => {
    if (!emailService) return { valid: false, message: "Chargement..." };
    if (!emailExpediteur) return { valid: false, message: "Email expéditeur manquant" };
    if (emailService === "resend") {
      return { valid: true, message: "Resend configuré — testez pour vérifier la clé API" };
    }
    if (emailService === "smtp") {
      if (!smtpHost || !smtpUser) return { valid: false, message: "Serveur ou utilisateur SMTP manquant" };
      if (!smtpConfigId && !smtpPassword) return { valid: false, message: "Mot de passe SMTP requis" };
      return { valid: true, message: "SMTP configuré — testez pour vérifier la connexion" };
    }
    return { valid: false, message: "Service email non sélectionné" };
  })();

  return {
    // état
    emailService,
    appUrl, setAppUrl,
    emailExpediteur, setEmailExpediteur,
    emailExpediteurNom, setEmailExpediteurNom,
    resendApiKey, setResendApiKey,
    smtpHost, setSmtpHost,
    smtpPort, setSmtpPort,
    smtpUser, setSmtpUser,
    smtpPassword, setSmtpPassword,
    smtpEncryption, setSmtpEncryption,
    smtpConfigId,
    showPassword, setShowPassword,
    showResendKey, setShowResendKey,
    fieldErrors,
    switchTarget, setSwitchTarget,
    lastTestResult,
    configStatus,
    smtpReady,
    // chargement
    isLoading: configsLoading || smtpLoading || emailService === null,
    // actions
    validate,
    saveConfigMutation,
    runConfigurationTest,
    saveResendKey,
    requestSwitchProvider,
    handleSwitchProvider,
    testingResend,
    testingSmtp,
    savingResendKey,
    sendingTestEmail: testingResend || testingSmtp,
  };
}
