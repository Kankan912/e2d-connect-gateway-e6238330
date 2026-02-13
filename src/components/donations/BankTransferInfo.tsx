import { useState } from "react";
import { Copy, Check, Building2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { getErrorMessage } from "@/lib/utils";
import type { PaymentConfig } from "@/types/donations";

interface BankTransferInfoProps {
  config: PaymentConfig;
  donorEmail: string;
  onNotificationSent: () => void;
}

const BankTransferInfo = ({ config, donorEmail, onNotificationSent }: BankTransferInfoProps) => {
  const [copied, setCopied] = useState(false);
  const [email, setEmail] = useState(donorEmail);
  const [sending, setSending] = useState(false);
  const { toast } = useToast();

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast({
        title: "Copié !",
        description: "L'IBAN a été copié dans le presse-papier",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: "Erreur",
        description: "Impossible de copier l'IBAN",
        variant: "destructive",
      });
    }
  };

  const handleSendNotification = async () => {
    if (!email) {
      toast({ title: "Erreur", description: "Veuillez saisir un email", variant: "destructive" });
      return;
    }

    setSending(true);
    try {
      const bankData = config.config_data;
      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #2563eb;">Récapitulatif de virement - E2D</h1>
          <p>Merci pour votre don ! Voici les informations pour effectuer votre virement bancaire :</p>
          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Banque :</strong> ${bankData.bank_name || 'Banque E2D'}</p>
            <p><strong>Titulaire :</strong> ${bankData.account_holder || 'Association E2D'}</p>
            <p><strong>IBAN :</strong> <code>${bankData.iban || 'Non configuré'}</code></p>
            <p><strong>BIC/SWIFT :</strong> ${bankData.bic || 'Non configuré'}</p>
          </div>
          ${bankData.instructions ? `<p style="color: #6b7280;">${bankData.instructions}</p>` : ''}
          <hr style="border: 1px solid #e5e7eb; margin: 20px 0;" />
          <p style="font-size: 12px; color: #9ca3af;">
            Veuillez indiquer votre nom complet comme référence du virement.<br/>
            Le traitement peut prendre 2-3 jours ouvrés.
          </p>
        </div>
      `;

      const { error } = await supabase.functions.invoke('send-email', {
        body: { to: email, subject: 'Récapitulatif virement - E2D', html: emailHtml }
      });

      if (error) throw error;

      toast({
        title: "Email envoyé",
        description: `Le récapitulatif a été envoyé à ${email}`,
      });
      onNotificationSent();
    } catch (error: unknown) {
      toast({
        title: "Erreur",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const bankData = config.config_data;

  return (
    <div className="space-y-6">
      <div className="bg-muted/50 rounded-lg p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
            <Building2 className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold">{bankData.bank_name || 'Banque E2D'}</h3>
            <p className="text-sm text-muted-foreground">Virement bancaire</p>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <Label className="text-xs text-muted-foreground">Titulaire du compte</Label>
            <p className="font-medium">{bankData.account_holder || 'Association E2D'}</p>
          </div>

          <div>
            <Label className="text-xs text-muted-foreground">IBAN</Label>
            <div className="flex gap-2 items-center mt-1">
              <code className="flex-1 px-3 py-2 bg-background rounded border text-sm font-mono">
                {bankData.iban || 'FR76 XXXX XXXX XXXX XXXX XXXX XXX'}
              </code>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => copyToClipboard(bankData.iban || '')}
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          <div>
            <Label className="text-xs text-muted-foreground">BIC/SWIFT</Label>
            <p className="font-medium font-mono">{bankData.bic || 'XXXXXXXX'}</p>
          </div>
        </div>
      </div>

      {bankData.instructions && (
        <div className="bg-secondary/10 rounded-lg p-4 border border-secondary/20">
          <p className="text-sm text-foreground whitespace-pre-line">{bankData.instructions}</p>
        </div>
      )}

      <div className="space-y-3">
        <Label htmlFor="email">Email pour confirmation</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="votre@email.com"
        />
        <Button 
          onClick={handleSendNotification}
          className="w-full"
          disabled={sending}
        >
          {sending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Envoi en cours...
            </>
          ) : (
            "Envoyer un récapitulatif par email"
          )}
        </Button>
      </div>

      <div className="text-xs text-muted-foreground space-y-1">
        <p>• Veuillez indiquer votre nom complet comme référence du virement</p>
        <p>• Le traitement peut prendre 2-3 jours ouvrés</p>
        <p>• Vous recevrez un reçu une fois le virement reçu</p>
      </div>
    </div>
  );
};

export default BankTransferInfo;
