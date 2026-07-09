import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Mail, Server, Key, Globe, Send, Eye, EyeOff, Loader2, CheckCircle, XCircle, Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { z } from "zod";

import { logger } from "@/lib/logger";

// Validation ciblée — utilisée avant sauvegarde / test / bascule
const nonEmpty = (label: string) =>
  z.string().trim().min(1, { message: `${label} est requis` });

const commonSchema = z.object({
  emailExpediteur: nonEmpty("Email expéditeur")
    .email({ message: "Email expéditeur invalide" })
    .max(255, "Email expéditeur trop long (255 max)"),
  emailExpediteurNom: nonEmpty("Nom expéditeur").max(100, "Nom expéditeur trop long (100 max)"),
  appUrl: nonEmpty("URL de l'application")
    .max(500, "URL trop longue (500 max)")
    .regex(/^https?:\/\/[^\s]+$/i, "URL invalide (http:// ou https://)"),
});

const smtpFieldsSchema = z.object({
  smtpHost: nonEmpty("Serveur SMTP")
    .max(255, "Serveur trop long")
    .regex(/^\S+$/, "Le serveur ne doit pas contenir d'espaces"),
  smtpPort: z.coerce
    .number({ invalid_type_error: "Port invalide" })
    .int("Port doit être un entier")
    .min(1, "Port ≥ 1")
    .max(65535, "Port ≤ 65535"),
  smtpUser: nonEmpty("Utilisateur SMTP")
    .email({ message: "Utilisateur SMTP doit être un email" })
    .max(255, "Utilisateur trop long"),
  smtpEncryption: z.enum(["tls", "ssl", "none"]),
});

const resendKeySchema = z
  .string()
  .trim()
  .min(20, "Clé API Resend trop courte")
  .regex(/^re_/, "La clé doit commencer par 're_'");



export function EmailConfigManager() {
  const queryClient = useQueryClient();
  const [showPassword, setShowPassword] = useState(false);
  const [showResendKey, setShowResendKey] = useState(false);
  const [testingResend, setTestingResend] = useState(false);
  const [testingSmtp, setTestingSmtp] = useState(false);
  const [savingResendKey, setSavingResendKey] = useState(false);
  
  // Local state for form
  const [emailService, setEmailService] = useState<"resend" | "smtp" | null>(null);
  const [appUrl, setAppUrl] = useState("");
  const [emailExpediteur, setEmailExpediteur] = useState("");
  const [emailExpediteurNom, setEmailExpediteurNom] = useState("");
  const [resendApiKey, setResendApiKey] = useState("");
  
  // SMTP config state
  const [smtpHost, setSmtpHost] = useState("");
  const [smtpPort, setSmtpPort] = useState("587");
  const [smtpUser, setSmtpUser] = useState("");
  const [smtpPassword, setSmtpPassword] = useState("");
  const [smtpEncryption, setSmtpEncryption] = useState<"tls" | "ssl" | "none">("tls");
  const [smtpConfigId, setSmtpConfigId] = useState<string | null>(null);

  // Validation & bascule
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [switchTarget, setSwitchTarget] = useState<"smtp" | "resend" | null>(null);


  // Fetch configurations
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

  // Fetch SMTP config
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

  // Initialize form values from fetched data
  useEffect(() => {
    if (configs) {
      const emailServiceConfig = configs.find(c => c.cle === "email_service");
      const appUrlConfig = configs.find(c => c.cle === "app_url");
      const emailExpConfig = configs.find(c => c.cle === "email_expediteur");
      const emailExpNomConfig = configs.find(c => c.cle === "email_expediteur_nom");
      
      setEmailService((emailServiceConfig?.valeur as "resend" | "smtp") || "resend");
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
      // Champ laissé vide ; on ne réécrit la valeur en base que si l'admin saisit quelque chose.
      setSmtpPassword("");
      setSmtpEncryption((smtpConfig.encryption_type as "tls" | "ssl" | "none") || "tls");
    }
  }, [smtpConfig]);

  // Save configurations mutation
  const saveConfigMutation = useMutation({
    mutationFn: async () => {
      // Update configurations table
      const updates = [
        { cle: "email_service", valeur: emailService },
        { cle: "app_url", valeur: appUrl },
        { cle: "email_expediteur", valeur: emailExpediteur },
        { cle: "email_expediteur_nom", valeur: emailExpediteurNom },
      ];

      for (const config of updates) {
        // C4 — Chaîner .select() pour détecter un échec RLS silencieux
        // (les policies de `configurations` exigent administrateur ; sans .select()
        // un non-admin verrait un "succès" sans aucune ligne mise à jour).
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

      // Update or insert SMTP config
      if (emailService === "smtp") {
        const baseSmtpData: Record<string, unknown> = {
          serveur_smtp: smtpHost,
          port_smtp: parseInt(smtpPort),
          utilisateur_smtp: smtpUser,
          encryption_type: smtpEncryption,
          actif: true,
        };
        // N'écrire le mot de passe QUE si l'admin en a saisi un nouveau
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
            .insert(baseSmtpData as any);
          if (error) throw error;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-configurations"], refetchType: "all" });
      queryClient.invalidateQueries({ queryKey: ["smtp-config"], refetchType: "all" });
      // Sécurité : re-masquer et vider le champ mot de passe SMTP après sauvegarde
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

  // ============================================================
  // Test unifié de configuration email — appelle l'Edge Function
  // ============================================================
  const [lastTestResult, setLastTestResult] = useState<{
    success: boolean;
    message: string;
    provider?: string;
    fallback?: boolean;
    duration_ms?: number;
  } | null>(null);

  // ============================================================
  // Validation client (zod)
  // ============================================================
  /** Valide les champs demandés. Renvoie true si OK, sinon met à jour fieldErrors + toast. */
  const validate = (scope: "common" | "smtp" | "resend-key" | "all"): boolean => {
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
      // Mot de passe requis si aucune config n'existe encore en base
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
    // Validation client avant l'appel réseau
    const needsSmtp = provider === "smtp" || (provider === "auto" && emailService === "smtp");
    if (!validate(needsSmtp ? "smtp" : "common")) return;

    if (provider === "resend" || provider === "auto") setTestingResend(true);
    if (provider === "smtp") setTestingSmtp(true);


    try {
      // Si on teste SMTP et que l'admin a saisi un nouveau mot de passe, sauvegarder d'abord
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
            await supabase.from("smtp_config").insert(smtpData as any);
          }
          queryClient.invalidateQueries({ queryKey: ["smtp-config"] });
        }
      }

      // Destinataire de test : email expéditeur configuré, sinon utilisateur SMTP
      const to = emailExpediteur || smtpUser;
      if (!to) throw new Error("Aucun destinataire de test : configurez l'email expéditeur");

      const { data, error } = await supabase.functions.invoke("test-email-configuration", {
        body: { to, provider, enableFallback },
      });

      let payload = (data ?? {}) as {
        success?: boolean;
        message?: string;
        provider?: string;
        fallback?: boolean;
        duration_ms?: number;
      };

      // Si erreur non-2xx, tenter de lire le vrai message dans le corps de la réponse
      if (error && (!payload || !payload.message)) {
        try {
          const resp = (error as any)?.context?.response;
          if (resp && typeof resp.json === "function") {
            const body = await resp.clone().json();
            payload = { ...payload, ...body };
          }
        } catch { /* ignore */ }
      }

      if (error || !payload.success) {
        const msg = payload.message || (error as any)?.message || "Échec du test";
        setLastTestResult({ success: false, message: msg, provider: payload.provider });
        toast.error(msg, { icon: <XCircle className="h-4 w-4 text-red-500" /> });
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
      toast.success(label, { icon: <CheckCircle className="h-4 w-4 text-green-500" /> });
      // Test SMTP OK avec un nouveau mot de passe → vider le champ (déjà persisté en base)
      if (needsSmtp && smtpPassword) {
        setSmtpPassword("");
        setShowPassword(false);
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Erreur inconnue";
      setLastTestResult({ success: false, message: msg });
      toast.error("Test échoué : " + msg, { icon: <XCircle className="h-4 w-4 text-red-500" /> });
    } finally {
      setTestingResend(false);
      setTestingSmtp(false);
    }

  };

  // Wrappers conservés pour compat avec les boutons existants
  const testResendConnection = () => runConfigurationTest("resend");
  const testSmtpConnection = () => runConfigurationTest("smtp");
  const sendTestEmail = () => runConfigurationTest("auto", true);
  const sendingTestEmail = testingResend || testingSmtp;

  // ============================================================
  // Bascule explicite d'un provider à l'autre
  // ============================================================
  const smtpReady = Boolean(smtpHost && smtpUser && (smtpConfigId || smtpPassword));
  const resendReady = resendApiKey.trim().startsWith("re_") || Boolean(smtpConfigId /* clé déjà en base */);
  // Note : on ne peut pas lire resend_api_key côté client (secret). On considère la clé "présente"
  // si l'admin en saisit une nouvelle valide OU si elle est déjà en base (heuristique : email_service peut être resend).
  const resendKeyProbablySaved = !resendApiKey || resendApiKey.trim().length === 0;

  /** Demande de bascule : valide puis ouvre la dialog de confirmation. */
  const requestSwitchProvider = (target: "smtp" | "resend") => {
    if (target === emailService) return;
    if (target === "smtp") {
      if (!validate("smtp")) return;
      if (!smtpReady) {
        toast.error("Complétez la configuration SMTP avant de basculer");
        return;
      }
    }
    if (target === "resend") {
      // Si l'admin a saisi une nouvelle clé, elle doit être valide.
      if (resendApiKey && !resendApiKey.trim().startsWith("re_")) {
        setFieldErrors((prev) => ({ ...prev, resendApiKey: "La clé doit commencer par 're_'" }));
        toast.error("Clé API Resend invalide (doit commencer par 're_')");
        return;
      }
    }
    setSwitchTarget(target);
  };

  /** Exécution effective (déclenchée depuis la dialog). */
  const handleSwitchProvider = async (target: "smtp" | "resend") => {
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



  // ============================================================
  // Statut de la configuration (validité)
  // ============================================================
  const configStatus = (() => {
    if (!emailService) return { valid: false, message: "Chargement..." };
    if (!emailExpediteur) return { valid: false, message: "Email expéditeur manquant" };
    if (emailService === "resend") {
      // On ne peut pas vérifier la clé en base depuis le client (sécurité), mais on peut au moins vérifier la présence locale
      // ou faire confiance au backend. Statut "à tester".
      return { valid: true, message: "Resend configuré — testez pour vérifier la clé API" };
    }
    if (emailService === "smtp") {
      if (!smtpHost || !smtpUser) return { valid: false, message: "Serveur ou utilisateur SMTP manquant" };
      if (!smtpConfigId && !smtpPassword) return { valid: false, message: "Mot de passe SMTP requis" };
      return { valid: true, message: "SMTP configuré — testez pour vérifier la connexion" };
    }
    return { valid: false, message: "Service email non sélectionné" };
  })();

  if (configsLoading || smtpLoading || emailService === null) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Bandeau de statut de la configuration */}
      <Alert className={configStatus.valid ? "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950" : "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950"}>
        {configStatus.valid ? <CheckCircle className="h-4 w-4 text-green-600" /> : <XCircle className="h-4 w-4 text-red-600" />}
        <AlertDescription className={configStatus.valid ? "text-green-800 dark:text-green-200" : "text-red-800 dark:text-red-200"}>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <span>
              <strong>{configStatus.valid ? "✔ Configuration valide" : "❌ Configuration invalide"}</strong>
              {" — "}
              {configStatus.message}
              {lastTestResult?.success && lastTestResult.fallback && (
                <span className="ml-2 inline-block px-2 py-0.5 rounded bg-amber-200 text-amber-900 text-xs">
                  Dernier envoi : fallback {lastTestResult.provider}
                </span>
              )}
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => runConfigurationTest("auto", true)}
              disabled={sendingTestEmail}
            >
              {sendingTestEmail ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Send className="h-4 w-4 mr-1" />}
              Tester la configuration
            </Button>
          </div>
        </AlertDescription>
      </Alert>

      {/* Deux providers côte à côte */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* ============================ SMTP ============================ */}
        <Card className={cn("relative", emailService === "smtp" && "border-primary ring-1 ring-primary/40")}>
          <CardHeader>
            <div className="flex items-start justify-between gap-2">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Server className="h-5 w-5" />
                  SMTP personnalisé
                </CardTitle>
                <CardDescription>Votre propre serveur (Gmail, Outlook, OVH…)</CardDescription>
              </div>
              {emailService === "smtp" ? (
                <Badge className="bg-green-600 hover:bg-green-600 text-white">Actif</Badge>
              ) : (
                <Badge variant="secondary">En réserve</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="smtp-host">Serveur SMTP</Label>
                <Input
                  id="smtp-host"
                  placeholder="smtp.gmail.com"
                  value={smtpHost}
                  onChange={(e) => setSmtpHost(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="smtp-port">Port</Label>
                <Input
                  id="smtp-port"
                  type="number"
                  placeholder="587"
                  value={smtpPort}
                  onChange={(e) => setSmtpPort(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="smtp-user">Utilisateur</Label>
              <Input
                id="smtp-user"
                placeholder="votre@email.com"
                value={smtpUser}
                onChange={(e) => setSmtpUser(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="smtp-password">
                Mot de passe
                {smtpConfigId && (
                  <span className="ml-2 text-xs text-muted-foreground font-normal">
                    (laisser vide pour conserver l'existant)
                  </span>
                )}
              </Label>
              <div className="relative">
                <Input
                  id="smtp-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={smtpPassword}
                  onChange={(e) => setSmtpPassword(e.target.value)}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="smtp-encryption">Chiffrement</Label>
              <Select value={smtpEncryption} onValueChange={(v) => setSmtpEncryption(v as typeof smtpEncryption)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tls">TLS (recommandé)</SelectItem>
                  <SelectItem value="ssl">SSL</SelectItem>
                  <SelectItem value="none">Aucun</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <Button
                variant="outline"
                onClick={testSmtpConnection}
                disabled={testingSmtp}
                className="flex-1"
              >
                {testingSmtp ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                Tester SMTP
              </Button>
              {emailService !== "smtp" && (
                <Button
                  onClick={() => handleSwitchProvider("smtp")}
                  disabled={!smtpReady}
                  className="flex-1"
                >
                  Basculer sur SMTP
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* ============================ Resend ============================ */}
        <Card className={cn("relative", emailService === "resend" && "border-primary ring-1 ring-primary/40")}>
          <CardHeader>
            <div className="flex items-start justify-between gap-2">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  Resend API
                </CardTitle>
                <CardDescription>Service transactionnel, idéal avec un domaine pro</CardDescription>
              </div>
              {emailService === "resend" ? (
                <Badge className="bg-green-600 hover:bg-green-600 text-white">Actif</Badge>
              ) : (
                <Badge variant="secondary">En réserve</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950">
              <Info className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800 dark:text-amber-200 text-xs">
                <strong>Mode test :</strong> sans domaine vérifié, les emails partent uniquement vers l'adresse du
                propriétaire du compte Resend.{" "}
                <a href="https://resend.com/domains" target="_blank" rel="noopener noreferrer" className="underline font-medium">
                  Vérifiez un domaine
                </a>{" "}
                pour envoyer à tous les membres.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label htmlFor="resend-api-key">
                Clé API Resend
                {smtpConfigId /* heuristique : config existante */ && (
                  <span className="ml-2 text-xs text-muted-foreground font-normal">
                    (laisser vide pour conserver l'existante)
                  </span>
                )}
              </Label>
              <div className="relative">
                <Input
                  id="resend-api-key"
                  type={showResendKey ? "text" : "password"}
                  placeholder="re_xxxxxxxx..."
                  value={resendApiKey}
                  onChange={(e) => setResendApiKey(e.target.value)}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowResendKey(!showResendKey)}
                >
                  {showResendKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Obtenez votre clé sur{" "}
                <a href="https://resend.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-primary underline">
                  resend.com/api-keys
                </a>
              </p>
            </div>

            <Button
              variant="secondary"
              className="w-full"
              onClick={async () => {
                if (!resendApiKey || !resendApiKey.startsWith("re_")) {
                  toast.error("Clé API invalide. Elle doit commencer par 're_'");
                  return;
                }
                setSavingResendKey(true);
                try {
                  const { error } = await supabase.functions.invoke("update-email-config", {
                    body: { resend_api_key: resendApiKey, email_mode: "resend", email_service: "resend" },
                  });
                  if (error) {
                    const errorMessage = (error as any)?.message || "Impossible d'enregistrer la clé";
                    throw new Error(errorMessage);
                  }
                  toast.success("Clé API Resend enregistrée");
                  setResendApiKey("");
                } catch (err: any) {
                  toast.error("Erreur: " + (err.message || "Impossible d'enregistrer la clé"));
                } finally {
                  setSavingResendKey(false);
                }
              }}
              disabled={savingResendKey || !resendApiKey}
            >
              {savingResendKey ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Key className="h-4 w-4 mr-2" />
              )}
              Enregistrer la clé API
            </Button>

            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <Button
                variant="outline"
                onClick={testResendConnection}
                disabled={testingResend}
                className="flex-1"
              >
                {testingResend ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                Tester Resend
              </Button>
              {emailService !== "resend" && (
                <Button
                  onClick={() => handleSwitchProvider("resend")}
                  className="flex-1"
                >
                  Basculer sur Resend
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>


      <Separator />

      {/* General Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Configuration Générale
          </CardTitle>
          <CardDescription>
            Paramètres utilisés dans tous les emails
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="app-url">URL de l'application</Label>
            <Input
              id="app-url"
              placeholder="https://votre-domaine.com"
              value={appUrl}
              onChange={(e) => setAppUrl(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Utilisée dans les emails pour les liens de connexion (variable {"{{app_url}}"})
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="from-name">Nom de l'expéditeur</Label>
              <Input
                id="from-name"
                placeholder="E2D"
                value={emailExpediteurNom}
                onChange={(e) => setEmailExpediteurNom(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="from-email">Email expéditeur</Label>
              <Input
                id="from-email"
                placeholder="contact@e2d.org"
                value={emailExpediteur}
                onChange={(e) => setEmailExpediteur(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Test Email Button + Save Button */}
      <div className="flex justify-between items-center">
        <Button 
          variant="outline"
          onClick={sendTestEmail}
          disabled={sendingTestEmail || !emailExpediteur}
        >
          {sendingTestEmail ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Mail className="h-4 w-4 mr-2" />
          )}
          Envoyer un email de test
        </Button>
        
        <Button 
          onClick={() => saveConfigMutation.mutate()}
          disabled={saveConfigMutation.isPending}
          size="lg"
        >
          {saveConfigMutation.isPending ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : null}
          Sauvegarder les modifications
        </Button>
      </div>
    </div>
  );
}
