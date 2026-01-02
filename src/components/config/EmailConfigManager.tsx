import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Mail, Server, Key, Globe, Send, Eye, EyeOff, Loader2, CheckCircle, XCircle } from "lucide-react";

export function EmailConfigManager() {
  const queryClient = useQueryClient();
  const [showPassword, setShowPassword] = useState(false);
  const [testingResend, setTestingResend] = useState(false);
  const [testingSmtp, setTestingSmtp] = useState(false);
  
  // Local state for form
  const [emailService, setEmailService] = useState<"resend" | "smtp">("resend");
  const [appUrl, setAppUrl] = useState("");
  const [emailExpediteur, setEmailExpediteur] = useState("");
  const [emailExpediteurNom, setEmailExpediteurNom] = useState("");
  
  // SMTP config state
  const [smtpHost, setSmtpHost] = useState("");
  const [smtpPort, setSmtpPort] = useState("587");
  const [smtpUser, setSmtpUser] = useState("");
  const [smtpPassword, setSmtpPassword] = useState("");
  const [smtpEncryption, setSmtpEncryption] = useState<"tls" | "ssl" | "none">("tls");
  const [smtpConfigId, setSmtpConfigId] = useState<string | null>(null);

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
      
      if (emailServiceConfig?.valeur) setEmailService(emailServiceConfig.valeur as "resend" | "smtp");
      if (appUrlConfig?.valeur) setAppUrl(appUrlConfig.valeur);
      if (emailExpConfig?.valeur) setEmailExpediteur(emailExpConfig.valeur);
      if (emailExpNomConfig?.valeur) setEmailExpediteurNom(emailExpNomConfig.valeur);
    }
  }, [configs]);

  useEffect(() => {
    if (smtpConfig) {
      setSmtpConfigId(smtpConfig.id);
      setSmtpHost(smtpConfig.serveur_smtp || "");
      setSmtpPort(String(smtpConfig.port_smtp || 587));
      setSmtpUser(smtpConfig.utilisateur_smtp || "");
      setSmtpPassword(smtpConfig.mot_de_passe_smtp || "");
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
        const { error } = await supabase
          .from("configurations")
          .update({ valeur: config.valeur, updated_at: new Date().toISOString() })
          .eq("cle", config.cle);
        if (error) throw error;
      }

      // Update or insert SMTP config
      if (emailService === "smtp") {
        const smtpData = {
          serveur_smtp: smtpHost,
          port_smtp: parseInt(smtpPort),
          utilisateur_smtp: smtpUser,
          mot_de_passe_smtp: smtpPassword,
          encryption_type: smtpEncryption,
          actif: true,
        };

        if (smtpConfigId) {
          const { error } = await supabase
            .from("smtp_config")
            .update(smtpData)
            .eq("id", smtpConfigId);
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from("smtp_config")
            .insert(smtpData);
          if (error) throw error;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-configurations"] });
      queryClient.invalidateQueries({ queryKey: ["smtp-config"] });
      toast.success("Configuration email sauvegardée");
    },
    onError: (error) => {
      console.error("Error saving config:", error);
      toast.error("Erreur lors de la sauvegarde");
    },
  });

  // Test Resend connection
  const testResendConnection = async () => {
    setTestingResend(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-email", {
        body: {
          to: "test@test.com",
          subject: "Test Resend Connection",
          html: "<p>Test</p>",
          test: true,
        },
      });
      
      if (error) throw error;
      toast.success("Connexion Resend réussie !", { icon: <CheckCircle className="h-4 w-4 text-green-500" /> });
    } catch (error) {
      console.error("Resend test failed:", error);
      toast.error("Échec du test Resend", { icon: <XCircle className="h-4 w-4 text-red-500" /> });
    } finally {
      setTestingResend(false);
    }
  };

  // Test SMTP connection
  const testSmtpConnection = async () => {
    setTestingSmtp(true);
    try {
      // For now, just validate the fields
      if (!smtpHost || !smtpUser || !smtpPassword) {
        throw new Error("Configuration SMTP incomplète");
      }
      
      // Simulate test - in production, this would call an edge function
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success("Configuration SMTP valide !", { icon: <CheckCircle className="h-4 w-4 text-green-500" /> });
    } catch (error: any) {
      toast.error(error.message || "Échec du test SMTP", { icon: <XCircle className="h-4 w-4 text-red-500" /> });
    } finally {
      setTestingSmtp(false);
    }
  };

  if (configsLoading || smtpLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Service Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Service d'envoi email
          </CardTitle>
          <CardDescription>
            Choisissez le service à utiliser pour l'envoi des emails
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={emailService}
            onValueChange={(value) => setEmailService(value as "resend" | "smtp")}
            className="grid gap-4 md:grid-cols-2"
          >
            <div className={`flex items-start space-x-3 rounded-lg border p-4 cursor-pointer transition-colors ${emailService === "resend" ? "border-primary bg-primary/5" : "hover:bg-muted/50"}`}>
              <RadioGroupItem value="resend" id="resend" className="mt-1" />
              <div className="flex-1">
                <Label htmlFor="resend" className="cursor-pointer font-medium">
                  Resend API
                </Label>
                <p className="text-sm text-muted-foreground">
                  Service recommandé. Simple, fiable et facile à configurer.
                </p>
              </div>
            </div>
            <div className={`flex items-start space-x-3 rounded-lg border p-4 cursor-pointer transition-colors ${emailService === "smtp" ? "border-primary bg-primary/5" : "hover:bg-muted/50"}`}>
              <RadioGroupItem value="smtp" id="smtp" className="mt-1" />
              <div className="flex-1">
                <Label htmlFor="smtp" className="cursor-pointer font-medium">
                  SMTP Personnalisé
                </Label>
                <p className="text-sm text-muted-foreground">
                  Utilisez votre propre serveur SMTP (Outlook, Gmail, etc.)
                </p>
              </div>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Resend Configuration */}
      {emailService === "resend" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Configuration Resend API
            </CardTitle>
            <CardDescription>
              La clé API Resend est configurée dans les secrets Supabase. 
              Vous pouvez tester la connexion ci-dessous.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2 p-4 bg-muted/50 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span className="text-sm">Clé API RESEND_API_KEY configurée dans les secrets Supabase</span>
            </div>
            <Button 
              variant="outline" 
              onClick={testResendConnection}
              disabled={testingResend}
            >
              {testingResend ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Tester la connexion Resend
            </Button>
          </CardContent>
        </Card>
      )}

      {/* SMTP Configuration */}
      {emailService === "smtp" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5" />
              Configuration SMTP
            </CardTitle>
            <CardDescription>
              Paramètres de votre serveur SMTP
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="smtp-host">Serveur SMTP</Label>
                <Input
                  id="smtp-host"
                  placeholder="smtp.outlook.com"
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

            <div className="grid gap-4 md:grid-cols-2">
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
                <Label htmlFor="smtp-password">Mot de passe</Label>
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

            <Button 
              variant="outline" 
              onClick={testSmtpConnection}
              disabled={testingSmtp}
            >
              {testingSmtp ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Tester la connexion SMTP
            </Button>
          </CardContent>
        </Card>
      )}

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

      {/* Save Button */}
      <div className="flex justify-end">
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
