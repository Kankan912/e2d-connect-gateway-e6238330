/**
 * EmailConfigManager — orchestrateur de l'écran de configuration email.
 *
 * Lot Q3 : la logique est dans `email/useEmailConfig`, l'UI est découpée en
 * cartes (`SmtpProviderCard`, `ResendProviderCard`, `GeneralEmailSettingsCard`),
 * bandeau de statut et dialog de bascule.
 */
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Mail, Loader2 } from "lucide-react";
import { useEmailConfig } from "./email/useEmailConfig";
import { EmailConfigStatusBanner } from "./email/EmailConfigStatusBanner";
import { SmtpProviderCard } from "./email/SmtpProviderCard";
import { ResendProviderCard } from "./email/ResendProviderCard";
import { GeneralEmailSettingsCard } from "./email/GeneralEmailSettingsCard";
import { SwitchProviderDialog } from "./email/SwitchProviderDialog";

export function EmailConfigManager() {
  const c = useEmailConfig();

  if (c.isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <EmailConfigStatusBanner c={c} />

      <div className="grid gap-6 lg:grid-cols-2">
        <SmtpProviderCard c={c} />
        <ResendProviderCard c={c} />
      </div>

      <Separator />

      <GeneralEmailSettingsCard c={c} />

      <div className="flex justify-between items-center">
        <Button
          variant="outline"
          onClick={() => c.runConfigurationTest("auto", true)}
          disabled={c.sendingTestEmail || !c.emailExpediteur}
        >
          {c.sendingTestEmail ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Mail className="h-4 w-4 mr-2" />
          )}
          Envoyer un email de test
        </Button>

        <Button onClick={c.saveAll} disabled={c.isSaving} size="lg">
          {c.isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
          Sauvegarder les modifications
        </Button>
      </div>

      <SwitchProviderDialog c={c} />
    </div>
  );
}
