/**
 * ClotureReunionModal — orchestrateur de la clôture de réunion.
 * Lot Q3 : logique dans `reunions/cloture/useClotureReunion`, UI découpée
 * en carte de vérifications, résumé financier et avertissements.
 */
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Send, Lock } from 'lucide-react';
import { useClotureReunion } from './reunions/cloture/useClotureReunion';
import { ClotureChecksCard } from './reunions/cloture/ClotureChecksCard';
import { ClotureFinancialSummary } from './reunions/cloture/ClotureFinancialSummary';
import { ClotureWarnings } from './reunions/cloture/ClotureWarnings';

interface ClotureReunionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reunionId: string;
  reunionData: {
    sujet?: string;
    date_reunion: string;
  };
  onSuccess?: () => void;
}

export default function ClotureReunionModal({
  open,
  onOpenChange,
  reunionId,
  reunionData,
  onSuccess,
}: ClotureReunionModalProps) {
  const c = useClotureReunion({ open, reunionId, reunionData, onOpenChange, onSuccess });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Clôturer la Réunion
          </DialogTitle>
          <DialogDescription>
            La clôture est définitive : elle bloque les modifications, applique les sanctions et envoie le
            compte-rendu.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Résumé</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Réunion</span>
                <Badge>{reunionData.sujet || 'Sans titre'}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Date</span>
                <span className="text-sm font-medium">
                  {new Date(reunionData.date_reunion).toLocaleDateString('fr-FR')}
                </span>
              </div>
            </CardContent>
          </Card>

          <ClotureChecksCard c={c} />
          <ClotureFinancialSummary c={c} />
          <ClotureWarnings c={c} />

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button onClick={c.handleCloturer} disabled={!c.canClose || c.processing}>
              {c.processing ? (
                <>Traitement en cours...</>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Clôturer et Envoyer
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
