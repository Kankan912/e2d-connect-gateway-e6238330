import { Check, Download, Share2, X, Loader2 } from "lucide-react";
import { useState } from "react";
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
import jsPDF from "jspdf";
import { addE2DHeader, addE2DFooter } from "@/lib/pdf-utils";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";

interface DonationSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  donationId: string;
  amount: number;
  currency: DonationCurrency;
  method: PaymentMethod;
  isRecurring?: boolean;
  donorName?: string;
  donorEmail?: string;
}

const DonationSuccessModal = ({
  isOpen,
  onClose,
  donationId,
  amount,
  currency,
  method,
  isRecurring = false,
  donorName = "Donateur anonyme",
  donorEmail = "",
}: DonationSuccessModalProps) => {
  const [downloading, setDownloading] = useState(false);
  const { toast } = useToast();

  const handleDownloadReceipt = async () => {
    setDownloading(true);
    try {
      const doc = new jsPDF();
      
      // En-tête E2D
      const yStart = await addE2DHeader(doc, 'Reçu Fiscal - Don', 'Association E2D');
      
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 14;
      let y = yStart + 5;
      
      // Titre du reçu
      doc.setFontSize(14);
      doc.setTextColor(30, 64, 175);
      doc.text('REÇU AU TITRE DES DONS', pageWidth / 2, y, { align: 'center' });
      y += 6;
      
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text('Article 200 et 238 bis du Code Général des Impôts', pageWidth / 2, y, { align: 'center' });
      y += 12;
      
      // Informations de l'association
      doc.setFontSize(11);
      doc.setTextColor(60, 60, 60);
      doc.text('ORGANISME BÉNÉFICIAIRE', margin, y);
      y += 6;
      
      doc.setFontSize(10);
      doc.setTextColor(80, 80, 80);
      doc.text('Association E2D - Ensemble pour le Développement et le Dynamisme', margin, y);
      y += 5;
      doc.text('Siège social : [Adresse de l\'association]', margin, y);
      y += 5;
      doc.text('Objet : Entraide, développement communautaire et activités sportives', margin, y);
      y += 12;
      
      // Informations du donateur
      doc.setFontSize(11);
      doc.setTextColor(60, 60, 60);
      doc.text('DONATEUR', margin, y);
      y += 6;
      
      doc.setFontSize(10);
      doc.setTextColor(80, 80, 80);
      doc.text(`Nom : ${donorName}`, margin, y);
      y += 5;
      if (donorEmail) {
        doc.text(`Email : ${donorEmail}`, margin, y);
        y += 5;
      }
      y += 7;
      
      // Cadre du don
      doc.setDrawColor(30, 64, 175);
      doc.setLineWidth(0.5);
      doc.roundedRect(margin, y, pageWidth - (margin * 2), 35, 3, 3);
      y += 8;
      
      doc.setFontSize(11);
      doc.setTextColor(30, 64, 175);
      doc.text('DÉTAILS DU DON', margin + 5, y);
      y += 8;
      
      doc.setFontSize(10);
      doc.setTextColor(60, 60, 60);
      doc.text(`Date du don : ${format(new Date(), 'dd MMMM yyyy', { locale: fr })}`, margin + 5, y);
      y += 6;
      
      doc.text(`Montant : ${formatAmount(amount, currency)}`, margin + 5, y);
      y += 6;
      
      doc.text(`Mode de paiement : ${method === 'stripe' ? 'Carte bancaire (Stripe)' : method === 'bank_transfer' ? 'Virement bancaire' : method === 'paypal' ? 'PayPal' : method === 'helloasso' ? 'HelloAsso' : method}`, margin + 5, y);
      y += 6;
      
      doc.text(`Référence : ${donationId.slice(0, 8).toUpperCase()}`, margin + 5, y);
      y += 15;
      
      // Nature du don
      doc.setFontSize(10);
      doc.setTextColor(80, 80, 80);
      doc.text('Nature du don :', margin, y);
      y += 5;
      doc.text('☑ Numéraire (espèces, chèque, virement, carte bancaire)', margin + 5, y);
      y += 5;
      doc.text('☐ Autres (préciser : _______________)', margin + 5, y);
      y += 10;
      
      // Réduction fiscale
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      const reductionText = `Ce don ouvre droit à une réduction d'impôt égale à 66% de son montant dans la limite de 20% du revenu imposable. `;
      const reductionAmount = Math.round(amount * 0.66 * 100) / 100;
      doc.text(reductionText, margin, y, { maxWidth: pageWidth - (margin * 2) });
      y += 10;
      
      doc.setFontSize(10);
      doc.setTextColor(30, 64, 175);
      doc.text(`Réduction fiscale estimée : ${formatAmount(reductionAmount, currency)}`, margin, y);
      y += 15;
      
      // Signature
      doc.setFontSize(10);
      doc.setTextColor(60, 60, 60);
      doc.text('Le Président de l\'Association', pageWidth - 60, y);
      y += 5;
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      doc.text('Signature et cachet', pageWidth - 60, y);
      y += 25;
      
      // Mention légale
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      const legalText = 'L\'association certifie sur l\'honneur que les dons reçus sont utilisés conformément à son objet social. ' +
        'Ce reçu ne peut être utilisé qu\'une seule fois pour bénéficier de la réduction d\'impôt.';
      doc.text(legalText, margin, y, { maxWidth: pageWidth - (margin * 2) });
      
      // Pied de page
      addE2DFooter(doc);
      
      // Télécharger
      const fileName = `recu_fiscal_E2D_${donationId.slice(0, 8)}_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
      doc.save(fileName);
      
      toast({
        title: "✅ Reçu téléchargé",
        description: `Le fichier ${fileName} a été téléchargé`
      });
    } catch (error) {
      console.error('Error generating receipt:', error);
      toast({
        title: "Erreur",
        description: "Impossible de générer le reçu fiscal",
        variant: "destructive"
      });
    } finally {
      setDownloading(false);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: "J'ai fait un don à E2D",
        text: `Je viens de soutenir l'Association E2D avec un don de ${formatAmount(amount, currency)}`,
        url: window.location.origin,
      });
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(
        `Je viens de soutenir l'Association E2D avec un don de ${formatAmount(amount, currency)}. Rejoignez-nous sur ${window.location.origin}`
      );
      toast({
        title: "Lien copié",
        description: "Le message a été copié dans le presse-papiers"
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
              <span className="font-medium capitalize">
                {method === 'stripe' ? 'Carte bancaire' : method === 'bank_transfer' ? 'Virement' : method === 'paypal' ? 'PayPal' : method === 'helloasso' ? 'HelloAsso' : method}
              </span>
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
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Réduction fiscale</span>
              <span className="font-medium text-primary">
                ~{formatAmount(Math.round(amount * 0.66), currency)}
              </span>
            </div>
          </div>

          <div className="bg-secondary/10 rounded-lg p-4 border border-secondary/20">
            <p className="text-sm text-center">
              Téléchargez votre reçu fiscal ci-dessous pour votre déclaration d'impôts.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              onClick={handleDownloadReceipt}
              className="w-full"
              disabled={downloading}
            >
              {downloading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Download className="w-4 h-4 mr-2" />
              )}
              {downloading ? 'Génération...' : 'Reçu fiscal'}
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