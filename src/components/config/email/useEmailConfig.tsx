/**
 * useEmailConfig — état, chargement, validation et actions de la configuration email.
 * Extrait de `EmailConfigManager` (Lot Q3) pour séparer logique et présentation.
 */
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CheckCircle, XCircle } from "lucide-react";
import { logger } from "@/lib/logger";
import { getErrorMessage } from "@/lib/utils";
import {
  commonSchema,
  smtpFieldsSchema,
  resendKeySchema,
  type EmailProvider,
  type SmtpEncryption,
  type ValidationScope,
} from "./emailConfigSchemas";

interface TestResult {
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

  const [emailService, setEmailService] = useState<EmailProvider | null>(null);
  const [appUrl, setAppUrl] = useState("");
  const [emailExpediteur, setEmailExpediteur] = useState("");
  const [emailExpediteurNom, setEmailExpediteurNom] = useState("");
  const [resendApiKey, setResendApiKey] = useState("");

  const [smtpHost, setSmtpHost] = useState("");
  const [smtpPort, setSmtpPort] = useState("587");
  const [smtpUser, setSmtpUser] = useState("");
  const [smtpPassword, setSmtpPassword] = useState("");
  const [smtpEncryption, setSmtpEncryption] = useState<SmtpEncryption>("tls");
  const [smtpConfigId, setSmtpConfigId] = useState<string | null>(null);

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [switchTarget, setSwitchTarget] = useState<EmailProvider | null>(null);
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
    if (!configs) return;
    const get = (cle: string) => configs.find((c) => c.cle === cle)?.valeur ?? "";
    setEmailService((get("email_service") as EmailProvider) || "resend");
    setAppUrl(get("app_url"));
    setEmailExpediteur(get("email_expediteur"));
    setEmailExpediteurNom(get("email_expediteur_nom"));
  }, [configs]);

  useEffect(() => {
    if (!smtpConfig) return;
    setSmtpConfigId(smtpConfig.id);
    setSmtpHost(smtpConfig.serveur_smtp || "");
    setSmtpPort(String(smtpConfig.port_smtp || 587));
    setSmtpUser(smtpConfig.utilisateur_smtp || "");
    // Sécurité : ne JAMAIS pré-remplir le mot de passe SMTP côté client.
    setSmtpPassword("");
    setSmtpEncryption((smtpConfig.encryption_type as SmtpEncryption) || "tls");
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
        // Chaîner .select() pour détecter un échec RLS silencieux.
        const { data: updated, error } = await supabase
          .from("configurations")
          .update({ valeur: config.valeur, updated_at: new Date().toISOString() })
          .eq("cle", config.cle)
          .select();
        if (error) throw error;
        if (!updated || updated.length === 0) {
          throw new Error(
            `Échec de la mise à jour de "${config.cle}" : permissions insuffisantes ou clé introuvable`,
          );
        }
      }

      if (emailService !== "smtp") return;

      const baseSmtpData: Record<string, unknown> = {
        serveur_smtp: smtpHost,
        port_smtp: parseInt(smtpPort),
        utilisateur_smtp: smtpUser,
        encryption_type: smtpEncryption,
        actif: true,
      };
      // N'écrire le mot de passe QUE si l'admin en a saisi un nouveau
      if (smtpPassword) baseSmtpData.mot_de_passe_smtp = smtpPassword;

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
        if (!smtpPassword) throw new Error("Mot de passe SMTP requis pour la première configuration");
        const { error } = await supabase
          .from("smtp_config")
          .insert(baseSmtpData as never);
        if (error) throw error;
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
    onError: (error: unknown) => {
      logger.error("Error saving config:", error);
      toast.error("Erreur lors de la sauvegarde");
    },
  });

  /** Valide les champs demandés. Renvoie true si OK, sinon met à jour fieldErrors + toast. */
  const validate = (scope: ValidationScope): boolean => {
    const errors: Record<string, string> = {};

    if (scope === "common" || scope === "smtp" || scope === "all") {
      const r = commonSchema.safeParse({ emailExpediteur, emailExpediteurNom, appUrl });
      if (!r.success) for (const iss of r.error.issues) errors[String(iss.path[0])] = iss.message;
    }
    if (scope === "smtp" || (scope === "all" && emailService === "smtp")) {
      const r = smtpFieldsSchema.safeParse({ smtpHost, smtpPort, smtpUser, smtpEncryption });
      if (!r.success) for (const iss of r.error.issues) errors[String(iss.path[0])] = iss.message;
      if (!smtpConfigId && !smtpPassword) {
        errors.smtpPassword = "Mot de passe requis (première configuration)";
      }
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

  const runConfigurationTest = async (
    provider: "auto" | "resend" | "smtp",
    enableFallback = false,
  ) => {
    const needsSmtp = provider === "smtp" || (provider === "auto" && emailService === "smtp");
    if (!validate(needsSmtp ? "smtp" : "common")) return;

    if (provider === "resend" || provider === "auto") setTestingResend(true);
    if (provider === "smtp") setTestingSmtp(true);

    try {
      // Si on teste SMTP et qu'un nouveau mot de passe est saisi, on le persiste d'abord.
      if (needsSmtp) {
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
            await supabase.from("smtp_config").insert(smtpData as never);
          }
          queryClient.invalidateQueries({ queryKey: ["smtp-config"] });
        }
      }

      const to = emailExpediteur || smtpUser;
      if (!to) throw new Error("Aucun destinataire de test : configurez l'email expéditeur");

      const { data, error } = await supabase.functions.invoke("test-email-configuration", {
        body: { to, provider, enableFallback },
      });

      let payload = (data ?? {}) as Partial<TestResult>;

      // Erreur non-2xx : lire le vrai message dans le corps de la réponse.
      if (error && !payload.message) {
        try {
          const resp = (error as { context?: { response?: Response } })?.context?.response;
          if (resp && typeof resp.json === "function") {
            payload = { ...payload, ...(await resp.clone().json()) };
          }
        } catch {
          /* ignore */
        }
      }

      if (error || !payload.success) {
        const msg = payload.message || getErrorMessage(error) || "Échec du test";
        setLastTestResult({ success: false, message: msg, provider: payload.provider });
        toast.error(msg, { icon: <XCircle className="h-4 w-4 text-destructive" /> });
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
      toast.success(label, { icon: <CheckCircle className="h-4 w-4 text-primary" /> });

      if (needsSmtp && smtpPassword) {
        setSmtpPassword("");
        setShowPassword(false);
      }
    } catch (e: unknown) {
      const msg = getErrorMessage(e);
      setLastTestResult({ success: false, message: msg });
      toast.error("Test échoué : " + msg, { icon: <XCircle className="h-4 w-4 text-destructive" /> });
    } finally {
      setTestingResend(false);
      setTestingSmtp(false);
    }
  };

  const saveResendKey = async () => {
    if (!validate("resend-key")) return;
    setSavingResendKey(true);
    try {
      const { data, error } = await supabase.functions.invoke("update-email-config", {
        body: { resend_api_key: resendApiKey, email_mode: "resend", email_service: "resend" },
      });
      const fnError = (data as { error?: string } | null)?.error;
      if (error || fnError) throw new Error(fnError || getErrorMessage(error));
      toast.success("Clé API Resend enregistrée");
      setResendApiKey("");
    } catch (err: unknown) {
      toast.error("Erreur : " + getErrorMessage(err));
    } finally {
      setSavingResendKey(false);
    }
  };

  const smtpReady = Boolean(smtpHost && smtpUser && (smtpConfigId || smtpPassword));

  /** Demande de bascule : valide puis ouvre la dialog de confirmation. */
  const requestSwitchProvider = (target: EmailProvider) => {
    if (target === emailService) return;
    if (target === "smtp") {
      if (!validate("smtp")) return;
      if (!smtpReady) {
        toast.error("Complétez la configuration SMTP avant de basculer");
        return;
      }
    }
    if (target === "resend" && resendApiKey && !resendApiKey.trim().startsWith("re_")) {
      setFieldErrors((prev) => ({ ...prev, resendApiKey: "La clé doit commencer par 're_'" }));
      toast.error("Clé API Resend invalide (doit commencer par 're_')");
      return;
    }
    setSwitchTarget(target);
  };

  /** Exécution effective (déclenchée depuis la dialog). */
  const confirmSwitchProvider = async (target: EmailProvider) => {
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
      toast.error("Bascule échouée : " + getErrorMessage(e));
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
    if (!smtpHost || !smtpUser) return { valid: false, message: "Serveur ou utilisateur SMTP manquant" };
    if (!smtpConfigId && !smtpPassword) return { valid: false, message: "Mot de passe SMTP requis" };
    return { valid: true, message: "SMTP configuré — testez pour vérifier la connexion" };
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
    // dérivés
    isLoading: configsLoading || smtpLoading || emailService === null,
    smtpReady,
    configStatus,
    testingResend,
    testingSmtp,
    savingResendKey,
    sendingTestEmail: testingResend || testingSmtp,
    isSaving: saveConfigMutation.isPending,
    // actions
    validate,
    runConfigurationTest,
    saveResendKey,
    requestSwitchProvider,
    confirmSwitchProvider,
    saveAll: () => {
      if (!validate("all")) return;
      saveConfigMutation.mutate();
    },
  };
}

export type EmailConfigController = ReturnType<typeof useEmailConfig>;
