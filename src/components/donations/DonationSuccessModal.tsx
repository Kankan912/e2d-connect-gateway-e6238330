import { Check, Download, Share2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatAmount } from "@/lib/payment-utils";
import type { DonationCurrency, PaymentMethod } from "@/types/donations";

interface DonationSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  donationId: string;
  amount: number;
  currency: DonationCurrency;
  method: PaymentMethod;
  isRecurring?: boolean;
}

const DonationSuccessModal = ({
  isOpen,
  onClose,
  donationId,
  amount,
  currency,
  method,
  isRecurring = false,
}: DonationSuccessModalProps) => {
  const handleDownloadReceipt = () => {
    // TODO: Implement receipt download
    console.log("Download receipt for:", donationId);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: "J'ai fait un don à E2D",
        text: `Je viens de soutenir l'Association E2D avec un don de ${formatAmount(amount, currency)}`,
        url: window.location.origin,
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-sm opacity-70 hover:opacity-100 transition-opacity"
        >
          <X className="h-4 w-4" />
        </button>

        <DialogHeader>
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Check className="w-8 h-8 text-primary" />
          </div>
          <DialogTitle className="text-center text-2xl">
            Merci pour votre générosité !
          </DialogTitle>
          <DialogDescription className="text-center text-base">
            Votre don a été enregistré avec succès
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Montant</span>
              <span className="font-semibold">{formatAmount(amount, currency)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Méthode</span>
              <span className="font-medium capitalize">{method}</span>
            </div>
            {isRecurring && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Type</span>
                <span className="font-medium">Don récurrent</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Référence</span>
              <span className="font-mono text-xs">{donationId.slice(0, 8)}</span>
            </div>
          </div>

          <div className="bg-secondary/10 rounded-lg p-4 border border-secondary/20">
            <p className="text-sm text-center">
              Un email de confirmation avec votre reçu fiscal vous a été envoyé.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              onClick={handleDownloadReceipt}
              className="w-full"
            >
              <Download className="w-4 h-4 mr-2" />
              Reçu
            </Button>
            <Button
              variant="outline"
              onClick={handleShare}
              className="w-full"
            >
              <Share2 className="w-4 h-4 mr-2" />
              Partager
            </Button>
          </div>

          <Button onClick={onClose} className="w-full">
            Retour à l'accueil
          </Button>
        </div>

        <div className="text-xs text-center text-muted-foreground">
          Votre soutien nous permet de continuer notre mission. Merci ! 🙏
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DonationSuccessModal;