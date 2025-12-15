import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RefreshCw, AlertTriangle, Info, CheckCircle } from "lucide-react";
import { formatFCFA } from "@/lib/utils";

interface ReconduireModalProps {
  pret: any;
  maxReconductions: number;
  interetRestant: number;
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isPending?: boolean;
}

export default function ReconduireModal({
  pret,
  maxReconductions,
  interetRestant,
  open,
  onClose,
  onConfirm,
  isPending = false
}: ReconduireModalProps) {
  const [interetPayeConfirme, setInteretPayeConfirme] = useState(false);

  const reconductionsActuelles = pret?.reconductions || 0;
  const prochaineReconduction = reconductionsActuelles + 1;
  const limiteAtteinte = reconductionsActuelles >= maxReconductions;
  
  // Intérêt mensuel pour cette reconduction
  const interetMensuel = pret ? (pret.montant * ((pret.taux_interet || 5) / 100)) / 12 : 0;
  
  // Capital restant
  const capitalRestant = pret ? pret.montant - (pret.capital_paye || 0) : 0;

  // Peut reconduire si l'intérêt est payé et limite non atteinte
  const peutReconduire = interetRestant <= 0 || interetPayeConfirme;

  const handleClose = () => {
    setInteretPayeConfirme(false);
    onClose();
  };

  const handleConfirm = () => {
    setInteretPayeConfirme(false);
    onConfirm();
  };

  if (!pret) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-blue-600" />
            Reconduire le prêt
          </DialogTitle>
          <DialogDescription>
            Reconduction #{prochaineReconduction} sur {maxReconductions} maximum
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Limite atteinte */}
          {limiteAtteinte && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Limite de reconductions atteinte ({maxReconductions} max). Ce prêt ne peut plus être reconduit.
              </AlertDescription>
            </Alert>
          )}

          {/* Récapitulatif */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Emprunteur</span>
              <span className="font-medium">{pret.emprunteur?.nom} {pret.emprunteur?.prenom}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Capital restant</span>
              <span className="font-medium">{formatFCFA(capitalRestant)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Intérêt mensuel</span>
              <span className="font-medium text-amber-600">+{formatFCFA(interetMensuel)}</span>
            </div>
            <div className="border-t pt-2 flex justify-between">
              <span className="text-muted-foreground">Reconductions actuelles</span>
              <span className="font-bold">{reconductionsActuelles} / {maxReconductions}</span>
            </div>
          </div>

          {/* Intérêt restant */}
          {interetRestant > 0 && !limiteAtteinte && (
            <Alert className="bg-amber-50 dark:bg-amber-950/30 border-amber-200">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-700 dark:text-amber-400">
                Il reste <strong>{formatFCFA(interetRestant)}</strong> d'intérêts impayés. 
                Selon les règles, l'intérêt du mois doit être payé avant la reconduction.
              </AlertDescription>
            </Alert>
          )}

          {/* Confirmation du paiement d'intérêt */}
          {interetRestant > 0 && !limiteAtteinte && (
            <div className="flex items-start space-x-3 p-3 border rounded-lg">
              <Checkbox
                id="confirm-interet"
                checked={interetPayeConfirme}
                onCheckedChange={(checked) => setInteretPayeConfirme(checked as boolean)}
              />
              <div className="space-y-1">
                <Label htmlFor="confirm-interet" className="cursor-pointer">
                  Je confirme que l'intérêt du mois a été payé
                </Label>
                <p className="text-xs text-muted-foreground">
                  Un paiement d'intérêt de {formatFCFA(interetMensuel)} sera enregistré automatiquement.
                </p>
              </div>
            </div>
          )}

          {/* Intérêt déjà payé */}
          {interetRestant <= 0 && !limiteAtteinte && (
            <Alert className="bg-green-50 dark:bg-green-950/30 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-700 dark:text-green-400">
                Les intérêts sont à jour. Vous pouvez reconduire ce prêt.
              </AlertDescription>
            </Alert>
          )}

          {/* Ce qui va se passer */}
          {!limiteAtteinte && (
            <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <Info className="h-4 w-4 text-blue-600" />
                <span className="font-medium text-blue-700 dark:text-blue-400">En reconduisant :</span>
              </div>
              <ul className="text-sm text-blue-600 dark:text-blue-300 space-y-1 ml-6">
                <li>• Nouvelle échéance : +1 mois</li>
                <li>• Intérêt mensuel ajouté : {formatFCFA(interetMensuel)}</li>
                <li>• Reconduction #{prochaineReconduction} enregistrée</li>
              </ul>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Annuler
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={limiteAtteinte || !peutReconduire || isPending}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isPending ? 'animate-spin' : ''}`} />
            {isPending ? "Reconduction..." : "Reconduire"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
