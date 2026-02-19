import { useState } from "react";
import { Copy, Check, Smartphone, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { PaymentConfig } from "@/types/donations";

interface MobileMoneyInfoProps {
  config: PaymentConfig;
  donorName: string;
  donorEmail: string;
  amount: number;
  currency: string;
  onConfirm: (reference: string) => void;
  loading?: boolean;
}

const MobileMoneyInfo = ({
  config,
  donorName,
  donorEmail,
  amount,
  currency,
  onConfirm,
  loading = false,
}: MobileMoneyInfoProps) => {
  const [copied, setCopied] = useState(false);
  const [reference, setReference] = useState("");
  const [sending, setSending] = useState(false);
  const { toast } = useToast();

  const isOrangeMoney = config.provider === 'orange_money';
  const providerName = isOrangeMoney ? 'Orange Money' : 'MTN Mobile Money';
  const dialCode = isOrangeMoney ? '*150#' : '*126#';
  const bgColor = isOrangeMoney
    ? 'bg-orange-50 border-orange-200'
    : 'bg-yellow-50 border-yellow-200';
  const iconBg = isOrangeMoney ? 'bg-orange-100' : 'bg-yellow-100';
  const iconColor = isOrangeMoney ? 'text-orange-600' : 'text-yellow-600';
  const emoji = isOrangeMoney ? '🟠' : '🟡';

  const mobileData = config.config_data;

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast({ title: "Copié !", description: "Numéro copié dans le presse-papier" });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: "Erreur", description: "Impossible de copier", variant: "destructive" });
    }
  };

  const handleConfirm = async () => {
    if (!reference.trim()) {
      toast({
        title: "Référence manquante",
        description: "Veuillez saisir la référence de transaction reçue par SMS",
        variant: "destructive",
      });
      return;
    }

    setSending(true);
    try {
      // Send email notification
      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #2563eb;">Confirmation de don ${providerName} - E2D</h1>
          <p>Merci <strong>${donorName}</strong> pour votre don !</p>
          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Méthode :</strong> ${providerName}</p>
            <p><strong>Montant :</strong> ${amount.toLocaleString('fr-FR')} ${currency}</p>
            <p><strong>Référence transaction :</strong> <code>${reference}</code></p>
            <p><strong>Numéro destinataire :</strong> ${mobileData.mobile_number || 'Non configuré'}</p>
          </div>
          <p style="color: #6b7280; font-size: 13px;">
            Votre don sera validé après vérification de la transaction par notre équipe.<br/>
            Référence à conserver : <strong>${reference}</strong>
          </p>
        </div>
      `;

      if (donorEmail) {
        await supabase.functions.invoke('send-email', {
          body: { to: donorEmail, subject: `Confirmation don ${providerName} - E2D`, html: emailHtml }
        });
      }

      onConfirm(reference);
    } catch (error) {
      console.error('Error confirming mobile money donation:', error);
      // Still confirm even if email fails
      onConfirm(reference);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Provider info */}
      <div className={`rounded-lg p-6 space-y-4 border ${bgColor}`}>
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-lg ${iconBg} flex items-center justify-center text-2xl`}>
            {emoji}
          </div>
          <div>
            <h3 className="font-semibold">{providerName}</h3>
            <p className={`text-sm ${iconColor} font-medium`}>
              Composez {dialCode} sur votre téléphone
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <Label className="text-xs text-muted-foreground">Numéro à créditer</Label>
            <div className="flex gap-2 items-center mt-1">
              <code className="flex-1 px-3 py-2 bg-background rounded border text-sm font-mono font-semibold">
                {mobileData.mobile_number || '+237 6XX XXX XXX'}
              </code>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => copyToClipboard(mobileData.mobile_number || '')}
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          {mobileData.account_name && (
            <div>
              <Label className="text-xs text-muted-foreground">Nom du titulaire</Label>
              <p className="font-medium">{mobileData.account_name}</p>
            </div>
          )}

          <div>
            <Label className="text-xs text-muted-foreground">Montant à envoyer</Label>
            <p className="font-bold text-lg">
              {amount.toLocaleString('fr-FR')} {currency}
            </p>
          </div>
        </div>
      </div>

      {/* Instructions */}
      {mobileData.instructions ? (
        <div className="bg-muted/50 rounded-lg p-4 border">
          <p className="text-sm text-foreground whitespace-pre-line">{mobileData.instructions}</p>
        </div>
      ) : (
        <div className="bg-muted/50 rounded-lg p-4 border text-sm space-y-1">
          <p className="font-medium mb-2">Comment procéder :</p>
          <p>1. Composez <strong>{dialCode}</strong> sur votre téléphone</p>
          <p>2. Sélectionnez "Envoyer de l'argent"</p>
          <p>3. Entrez le numéro <strong>{mobileData.mobile_number || 'ci-dessus'}</strong></p>
          <p>4. Entrez le montant : <strong>{amount.toLocaleString('fr-FR')} {currency}</strong></p>
          <p>5. Confirmez et notez la référence de transaction reçue par SMS</p>
        </div>
      )}

      {/* Transaction reference input */}
      <div className="space-y-3">
        <Label htmlFor="momo-reference">
          Référence de transaction (reçue par SMS) *
        </Label>
        <Input
          id="momo-reference"
          value={reference}
          onChange={(e) => setReference(e.target.value)}
          placeholder="Ex: TXN2024XXXXXXXXX"
          className="font-mono"
        />
        <Button
          onClick={handleConfirm}
          className="w-full"
          disabled={loading || sending || !reference.trim()}
        >
          {sending || loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Traitement en cours...
            </>
          ) : (
            <>
              <Smartphone className="w-4 h-4 mr-2" />
              Confirmer le paiement {providerName}
            </>
          )}
        </Button>
      </div>

      <div className="text-xs text-muted-foreground space-y-1">
        <p>• Votre don sera validé après vérification de la transaction</p>
        <p>• Conservez votre référence SMS comme preuve de paiement</p>
        <p>• En cas de problème, contactez-nous avec votre référence</p>
      </div>
    </div>
  );
};

export default MobileMoneyInfo;
