/**
 * @module AssignerBeneficiaireModal
 * Modale d'assignation d'un bénéficiaire prévu au calendrier à une réunion.
 * Calcule le montant net (brut - sanctions impayées) avant confirmation.
 */
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { formatFCFA } from "@/lib/utils";
import { logger } from "@/lib/logger";

export interface CalendrierOption {
  id: string;
  membre_id: string;
  montant_total: number | null;
  membres?: { nom?: string | null; prenom?: string | null } | null;
}

export interface CalculMontantResult {
  montant_mensuel: number;
  montant_brut: number;
  sanctions_impayees: number;
  montant_net: number;
}

export interface AssignerBeneficiaireModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Lignes du calendrier encore assignables pour le mois de la réunion */
  disponibles: CalendrierOption[];
  exerciceId?: string;
  isPending?: boolean;
  calculerMontant: (membreId: string, exerciceId: string) => Promise<CalculMontantResult>;
  onConfirm: (payload: {
    calendrierId: string;
    membreId: string;
    montantBrut: number;
    sanctionsImpayees: number;
    montantNet: number;
  }) => Promise<void> | void;
}

export default function AssignerBeneficiaireModal({
  open,
  onOpenChange,
  disponibles,
  exerciceId,
  isPending = false,
  calculerMontant,
  onConfirm,
}: AssignerBeneficiaireModalProps) {
  const [selectedCalendrierId, setSelectedCalendrierId] = useState<string>("");
  const [isCalculating, setIsCalculating] = useState(false);
  const [calcul, setCalcul] = useState<(CalculMontantResult & { membreId: string; membreNom: string }) | null>(null);

  const reset = () => {
    setSelectedCalendrierId("");
    setCalcul(null);
  };

  const handleSelect = async (calendrierId: string) => {
    setSelectedCalendrierId(calendrierId);
    const item = disponibles.find((c) => c.id === calendrierId);
    if (!item || !exerciceId) return;
    setIsCalculating(true);
    try {
      const result = await calculerMontant(item.membre_id, exerciceId);
      setCalcul({
        ...result,
        membreId: item.membre_id,
        membreNom: `${item.membres?.prenom ?? ""} ${item.membres?.nom ?? ""}`.trim(),
      });
    } catch (error: unknown) {
      logger.error("Erreur calcul montant bénéficiaire:", error);
      setCalcul(null);
    } finally {
      setIsCalculating(false);
    }
  };

  const handleConfirm = async () => {
    if (!calcul || !selectedCalendrierId) return;
    await onConfirm({
      calendrierId: selectedCalendrierId,
      membreId: calcul.membreId,
      montantBrut: calcul.montant_brut,
      sanctionsImpayees: calcul.sanctions_impayees,
      montantNet: calcul.montant_net,
    });
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset();
        onOpenChange(next);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assigner un bénéficiaire</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Bénéficiaire prévu</Label>
            <Select value={selectedCalendrierId} onValueChange={handleSelect}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner le bénéficiaire" />
              </SelectTrigger>
              <SelectContent>
                {disponibles.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.membres?.prenom} {c.membres?.nom} - {formatFCFA(c.montant_total ?? 0)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isCalculating && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              Calcul du montant en cours...
            </div>
          )}

          {calcul && (
            <div className="p-4 bg-muted/50 rounded-lg space-y-2">
              <p className="font-semibold">{calcul.membreNom}</p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span className="text-muted-foreground">Montant mensuel:</span>
                <span>{formatFCFA(calcul.montant_mensuel)}</span>

                <span className="text-muted-foreground">Montant brut (×12):</span>
                <span>{formatFCFA(calcul.montant_brut)}</span>

                <span className="text-muted-foreground">Sanctions impayées:</span>
                <span className="text-destructive">-{formatFCFA(calcul.sanctions_impayees)}</span>

                <span className="font-semibold">Montant net à payer:</span>
                <span className="font-bold text-primary">{formatFCFA(calcul.montant_net)}</span>
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
          <Button onClick={handleConfirm} disabled={!calcul || isPending}>
            {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Assigner
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
