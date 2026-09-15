import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { AlertTriangle, Unlock, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { getErrorMessage } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";


import { logger } from "@/lib/logger";
interface ReouvrirReunionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reunionId: string;
  reunionData: { sujet?: string; date_reunion: string };
  onSuccess?: () => void;
}

export default function ReouvrirReunionModal({
  open,
  onOpenChange,
  reunionId,
  reunionData,
  onSuccess,
}: ReouvrirReunionModalProps) {
  const [supprimerSanctions, setSupprimerSanctions] = useState(false);
  const [processing, setProcessing] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  

  const handleReouvrir = async () => {
    setProcessing(true);
    try {
      // Réouverture transactionnelle côté base : statut, déverrouillage des
      // cotisations, annulation des écritures de caisse, retrait éventuel des
      // sanctions automatiques et journal d'audit sont appliqués d'un bloc.
      const { data, error } = await supabase.rpc("rouvrir_reunion", {
        _reunion_id: reunionId,
        _supprimer_sanctions: supprimerSanctions,
        _motif: `Réouverture réunion ${new Date(reunionData.date_reunion).toLocaleDateString("fr-FR")}`,
      });

      if (error) throw error;
      const resume = (data ?? {}) as { deja_ouverte?: boolean; sanctions_supprimees?: number };


      // 5. Invalider TOUS les caches liés à cette réunion (FIX CRITIQUE)
      queryClient.invalidateQueries({ queryKey: ["reunions"] });
      queryClient.invalidateQueries({ queryKey: ["presences"] });
      queryClient.invalidateQueries({ queryKey: ["reunions-sanctions"] });
      queryClient.invalidateQueries({ queryKey: ["cotisations-reunion-grid", reunionId] });
      queryClient.invalidateQueries({ queryKey: ["huile-savon-reunion", reunionId] });
      queryClient.invalidateQueries({ queryKey: ["reunions-presences", reunionId] });
      queryClient.invalidateQueries({ queryKey: ["reunion-presences-cloture", reunionId] });
      queryClient.invalidateQueries({ queryKey: ["reunion-beneficiaires", reunionId] });
      queryClient.invalidateQueries({ queryKey: ["reunion-beneficiaires-details", reunionId] });
      queryClient.invalidateQueries({ queryKey: ["cotisations-reunion", reunionId] });
      queryClient.invalidateQueries({ queryKey: ["cotisations"] });
      queryClient.invalidateQueries({ queryKey: ["epargnes"] });

      toast({
        title: resume.deja_ouverte ? "Réunion déjà ouverte" : "Réunion rouverte",
        description: `La réunion du ${new Date(reunionData.date_reunion).toLocaleDateString('fr-FR')} est maintenant modifiable.${
          resume.sanctions_supprimees ? ` ${resume.sanctions_supprimees} sanction(s) supprimée(s).` : ""
        }`,
      });


      onOpenChange(false);
      onSuccess?.();
    } catch (error: unknown) {
      logger.error("Erreur réouverture:", error);
      toast({
        title: "Erreur",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Unlock className="h-5 w-5 text-warning" />
            Rouvrir la réunion
          </DialogTitle>
          <DialogDescription>
            Réunion du {new Date(reunionData.date_reunion).toLocaleDateString('fr-FR')}
            {reunionData.sujet && ` - ${reunionData.sujet}`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Avertissement */}
          <div className="flex items-start gap-3 p-4 bg-warning/10 border border-warning/30 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-warning">Attention</p>
              <p className="text-muted-foreground mt-1">
                Cette action rouvrira la réunion pour permettre les modifications. 
                Le taux de présence sera recalculé lors de la prochaine clôture.
              </p>
            </div>
          </div>

          {/* Option suppression sanctions */}
          <div className="flex items-start space-x-3 p-3 border rounded-lg">
            <Checkbox
              id="supprimer-sanctions"
              checked={supprimerSanctions}
              onCheckedChange={(checked) => setSupprimerSanctions(checked === true)}
            />
            <div className="grid gap-1.5 leading-none">
              <Label htmlFor="supprimer-sanctions" className="font-medium cursor-pointer">
                Supprimer les sanctions automatiques
              </Label>
              <p className="text-xs text-muted-foreground">
                Supprime les sanctions créées lors de la clôture (absences, huile & savon)
              </p>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={processing}>
            Annuler
          </Button>
          <Button 
            onClick={handleReouvrir} 
            disabled={processing}
            className="bg-warning text-warning-foreground hover:bg-warning/90"
          >
            {processing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Réouverture...
              </>
            ) : (
              <>
                <Unlock className="w-4 h-4 mr-2" />
                Rouvrir la réunion
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
