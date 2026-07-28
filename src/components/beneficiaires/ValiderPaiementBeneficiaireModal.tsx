/**
 * @module ValiderPaiementBeneficiaireModal
 * Modale de validation du paiement d'un bénéficiaire de réunion.
 * Appelle la RPC `valider_paiement_beneficiaire` (Lot B) qui écrit
 * l'opération de caisse via le FinancialEngine.
 */
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export interface ValiderPaiementBeneficiaireModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Id de la ligne `reunion_beneficiaires` à régler */
  beneficiaireId: string | null;
  /** Montant pré-rempli (montant net calculé) */
  montantParDefaut?: number | null;
  /** Id de la réunion — utilisé pour invalider les caches */
  reunionId?: string;
  onSuccess?: () => void;
}

export default function ValiderPaiementBeneficiaireModal({
  open,
  onOpenChange,
  beneficiaireId,
  montantParDefaut,
  reunionId,
  onSuccess,
}: ValiderPaiementBeneficiaireModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [montant, setMontant] = useState<string>("");
  const [datePaiement, setDatePaiement] = useState<string>(new Date().toISOString().slice(0, 10));
  const [mode, setMode] = useState<string>("especes");
  const [reference, setReference] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Réinitialise le formulaire à chaque ouverture
  useEffect(() => {
    if (!open) return;
    setMontant(montantParDefaut != null ? String(montantParDefaut) : "");
    setDatePaiement(new Date().toISOString().slice(0, 10));
    setMode("especes");
    setReference("");
    setNotes("");
  }, [open, montantParDefaut]);

  const handleSubmit = async () => {
    if (!beneficiaireId) return;
    const value = Number(montant);
    if (!value || value <= 0) {
      toast({ title: "Montant invalide", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    try {
      const { error } = await supabase.rpc("valider_paiement_beneficiaire" as never, {
        p_id: beneficiaireId,
        p_montant: value,
        p_date_paiement: new Date(datePaiement).toISOString(),
        p_mode: mode || null,
        p_reference: reference || null,
        p_notes: notes || null,
      } as never);
      if (error) throw error;
      toast({ title: "Paiement enregistré" });
      if (reunionId) {
        queryClient.invalidateQueries({ queryKey: ["beneficiaires-reunion", reunionId] });
      }
      queryClient.invalidateQueries({ queryKey: ["caisse-solde"] });
      onSuccess?.();
      onOpenChange(false);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      toast({ title: "Erreur", description: message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Valider le paiement bénéficiaire</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Montant réel (FCFA)</Label>
              <Input type="number" min={0} value={montant} onChange={(e) => setMontant(e.target.value)} />
            </div>
            <div>
              <Label>Date de paiement</Label>
              <Input type="date" value={datePaiement} onChange={(e) => setDatePaiement(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Mode</Label>
              <Select value={mode} onValueChange={setMode}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="especes">Espèces</SelectItem>
                  <SelectItem value="virement">Virement</SelectItem>
                  <SelectItem value="mobile_money">Mobile Money</SelectItem>
                  <SelectItem value="cheque">Chèque</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Référence</Label>
              <Input value={reference} onChange={(e) => setReference(e.target.value)} placeholder="N° transaction" />
            </div>
          </div>
          <div>
            <Label>Notes (optionnel)</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || !beneficiaireId}>
            {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Valider le paiement
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
