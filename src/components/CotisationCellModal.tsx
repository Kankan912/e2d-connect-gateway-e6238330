import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Trash2, Save, User, Coins } from 'lucide-react';
import { formatFCFA } from '@/lib/utils';

interface CotisationCellModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reunionId: string;
  exerciceId?: string;
  membre: { id: string; nom: string; prenom: string } | null;
  type: { id: string; nom: string; montant_defaut: number | null; obligatoire: boolean } | null;
  existingCotisation?: { id: string; montant: number; date_paiement: string; statut: string };
  defaultMontant: number;
}

export default function CotisationCellModal({
  open,
  onOpenChange,
  reunionId,
  exerciceId,
  membre,
  type,
  existingCotisation,
  defaultMontant
}: CotisationCellModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [montant, setMontant] = useState<string>('');
  const [datePaiement, setDatePaiement] = useState<string>(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    if (open) {
      if (existingCotisation) {
        setMontant(existingCotisation.montant.toString());
        setDatePaiement(existingCotisation.date_paiement || new Date().toISOString().split('T')[0]);
      } else {
        setMontant(defaultMontant.toString());
        setDatePaiement(new Date().toISOString().split('T')[0]);
      }
    }
  }, [open, existingCotisation, defaultMontant]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!membre || !type) throw new Error('Données manquantes');
      
      const cotisationData = {
        reunion_id: reunionId,
        exercice_id: exerciceId || null,
        membre_id: membre.id,
        type_cotisation_id: type.id,
        montant: parseFloat(montant) || 0,
        date_paiement: datePaiement,
        statut: 'paye'
      };

      if (existingCotisation) {
        const { error } = await supabase
          .from('cotisations')
          .update(cotisationData)
          .eq('id', existingCotisation.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('cotisations')
          .insert(cotisationData);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cotisations-reunion-grid', reunionId] });
      queryClient.invalidateQueries({ queryKey: ['cotisations-reunion', reunionId] });
      toast({
        title: existingCotisation ? "Cotisation modifiée" : "Cotisation enregistrée",
        description: `${type?.nom} pour ${membre?.prenom} ${membre?.nom}`
      });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!existingCotisation) return;
      const { error } = await supabase
        .from('cotisations')
        .delete()
        .eq('id', existingCotisation.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cotisations-reunion-grid', reunionId] });
      queryClient.invalidateQueries({ queryKey: ['cotisations-reunion', reunionId] });
      toast({
        title: "Cotisation supprimée"
      });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const isPending = saveMutation.isPending || deleteMutation.isPending;

  if (!membre || !type) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-primary" />
            {existingCotisation ? "Modifier la cotisation" : "Enregistrer un paiement"}
          </DialogTitle>
          <DialogDescription>
            Saisie rapide de cotisation pour cette réunion
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Membre info */}
          <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
            <User className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="font-medium">{membre.prenom} {membre.nom}</p>
              <p className="text-xs text-muted-foreground">Membre E2D</p>
            </div>
          </div>

          {/* Type de cotisation */}
          <div className="flex items-center justify-between p-3 bg-primary/5 rounded-lg border border-primary/20">
            <div>
              <p className="font-medium">{type.nom}</p>
              <p className="text-xs text-muted-foreground">
                Montant par défaut : {formatFCFA(defaultMontant)}
              </p>
            </div>
            {type.obligatoire && (
              <Badge variant="secondary">Obligatoire</Badge>
            )}
          </div>

          {/* Montant */}
          <div className="space-y-2">
            <Label htmlFor="montant">Montant (FCFA)</Label>
            <Input
              id="montant"
              type="number"
              value={montant}
              onChange={(e) => setMontant(e.target.value)}
              placeholder="0"
              min="0"
              className="text-lg font-semibold"
            />
            {parseFloat(montant) !== defaultMontant && parseFloat(montant) > 0 && (
              <p className="text-xs text-warning">
                ⚠️ Montant différent du montant par défaut ({formatFCFA(defaultMontant)})
              </p>
            )}
          </div>

          {/* Date de paiement */}
          <div className="space-y-2">
            <Label htmlFor="date">Date de paiement</Label>
            <Input
              id="date"
              type="date"
              value={datePaiement}
              onChange={(e) => setDatePaiement(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          {existingCotisation && (
            <Button
              variant="destructive"
              onClick={() => deleteMutation.mutate()}
              disabled={isPending}
            >
              {deleteMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
            </Button>
          )}
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Annuler
          </Button>
          <Button 
            onClick={() => saveMutation.mutate()}
            disabled={isPending || !montant || parseFloat(montant) <= 0}
          >
            {saveMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {existingCotisation ? "Modifier" : "Enregistrer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
