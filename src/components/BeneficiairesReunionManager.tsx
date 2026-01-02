import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Gift, Check, AlertCircle, Calculator } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { calculateSoldeNetBeneficiaire } from "@/lib/beneficiairesCalculs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatFCFA } from "@/lib/utils";

interface BeneficiairesReunionManagerProps {
  reunionId?: string;
}

export default function BeneficiairesReunionManager({ reunionId }: BeneficiairesReunionManagerProps) {
  const [selectedMembreId, setSelectedMembreId] = useState<string>("");
  const [montantBenefice, setMontantBenefice] = useState<string>("");
  const [calculatedAmount, setCalculatedAmount] = useState<number | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  if (!reunionId) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground text-center">
            Sélectionnez une réunion pour gérer ses bénéficiaires
          </p>
        </CardContent>
      </Card>
    );
  }

  const { data: membres } = useQuery({
    queryKey: ['membres-actifs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('membres')
        .select('*')
        .eq('statut', 'actif')
        .order('nom');
      
      if (error) throw error;
      return data;
    }
  });

  const { data: beneficiaires = [] } = useQuery({
    queryKey: ['reunion-beneficiaires', reunionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reunion_beneficiaires')
        .select(`
          *,
          membres:membre_id(nom, prenom)
        `)
        .eq('reunion_id', reunionId);

      if (error) throw error;
      return data;
    },
    enabled: !!reunionId
  });

  const assignerBeneficiaire = useMutation({
    mutationFn: async ({ membreId, montant }: { membreId: string; montant: number }) => {
      const { data, error } = await supabase
        .from('reunion_beneficiaires')
        .insert({
          reunion_id: reunionId,
          membre_id: membreId,
          montant_benefice: montant,
          statut: 'impaye',
          date_benefice_prevue: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Succès",
        description: "Bénéficiaire assigné avec succès"
      });
      queryClient.invalidateQueries({ queryKey: ['reunion-beneficiaires', reunionId] });
      setSelectedMembreId("");
      setMontantBenefice("");
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Impossible d'assigner le bénéficiaire",
        variant: "destructive"
      });
    }
  });

  const supprimerBeneficiaire = useMutation({
    mutationFn: async (beneficiaireId: string) => {
      const { error } = await supabase
        .from('reunion_beneficiaires')
        .delete()
        .eq('id', beneficiaireId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Bénéficiaire retiré" });
      queryClient.invalidateQueries({ queryKey: ['reunion-beneficiaires', reunionId] });
    }
  });

  const marquerPaye = useMutation({
    mutationFn: async (beneficiaireId: string) => {
      const { error } = await supabase
        .from('reunion_beneficiaires')
        .update({ statut: 'paye', date_paiement: new Date().toISOString() })
        .eq('id', beneficiaireId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Paiement enregistré" });
      queryClient.invalidateQueries({ queryKey: ['reunion-beneficiaires', reunionId] });
    }
  });

  const calculerMontantAuto = async () => {
    if (!selectedMembreId || !reunionId) {
      toast({ title: "Sélectionnez un membre", variant: "destructive" });
      return;
    }

    try {
      // Pour le calcul, on utilise l'exercice actif par défaut
      const { data: exerciceActif } = await supabase
        .from('exercices')
        .select('id')
        .eq('statut', 'actif')
        .single();

      if (!exerciceActif) {
        toast({ title: "Aucun exercice actif trouvé", variant: "destructive" });
        return;
      }

      const soldeNet = await calculateSoldeNetBeneficiaire(selectedMembreId, exerciceActif.id);
      setCalculatedAmount(soldeNet.soldeNet);
      setMontantBenefice(soldeNet.soldeNet.toFixed(2));
      toast({
        title: "Calcul effectué",
        description: `Montant net après déductions: ${formatFCFA(soldeNet.soldeNet)}`
      });
    } catch (error) {
      console.error('Erreur calcul:', error);
      toast({ title: "Erreur lors du calcul", variant: "destructive" });
    }
  };

  const handleAssigner = () => {
    if (!selectedMembreId || !montantBenefice) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner un membre et saisir un montant",
        variant: "destructive"
      });
      return;
    }

    assignerBeneficiaire.mutate({
      membreId: selectedMembreId,
      montant: parseFloat(montantBenefice)
    });
  };

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gift className="h-5 w-5" />
          Gestion des Bénéficiaires
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Formulaire d'ajout */}
          <div className="space-y-4 p-4 border rounded-lg">
            <h3 className="font-semibold">Assigner un nouveau bénéficiaire</h3>
            <div className="space-y-3">
              <div>
                <Label>Membre</Label>
                <Select value={selectedMembreId} onValueChange={setSelectedMembreId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un membre" />
                  </SelectTrigger>
                  <SelectContent>
                    {membres?.map((membre) => (
                      <SelectItem key={membre.id} value={membre.id}>
                        {membre.nom} {membre.prenom}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2">
                <div className="flex-1">
                  <Label>Montant (FCFA)</Label>
                  <Input
                    type="number"
                    placeholder="Montant"
                    value={montantBenefice}
                    onChange={(e) => setMontantBenefice(e.target.value)}
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={calculerMontantAuto}
                    disabled={!selectedMembreId}
                  >
                    <Calculator className="h-4 w-4 mr-2" />
                    Calculer
                  </Button>
                </div>
              </div>

              {calculatedAmount !== null && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Montant calculé après déductions: <strong>{formatFCFA(calculatedAmount)}</strong>
                  </AlertDescription>
                </Alert>
              )}

              <Button
                onClick={handleAssigner}
                disabled={!selectedMembreId || !montantBenefice || assignerBeneficiaire.isPending}
                className="w-full"
              >
                {assignerBeneficiaire.isPending ? 'Assignation...' : 'Assigner le bénéficiaire'}
              </Button>
            </div>
          </div>

          {/* Liste des bénéficiaires */}
          {beneficiaires.length > 0 ? (
            <div className="space-y-3">
              <h3 className="font-semibold">Bénéficiaires assignés ({beneficiaires.length})</h3>
              {beneficiaires.map((benef: any) => (
                <div
                  key={benef.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex-1">
                    <p className="font-medium">
                      {benef.membres?.nom} {benef.membres?.prenom}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Montant: {formatFCFA(benef.montant_benefice)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={benef.statut === 'paye' ? 'default' : 'secondary'}>
                      {benef.statut === 'paye' ? <><Check className="w-3 h-3 mr-1" />Payé</> : 'Impayé'}
                    </Badge>
                    {benef.statut !== 'paye' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => marquerPaye.mutate(benef.id)}
                      >
                        Marquer payé
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => supprimerBeneficiaire.mutate(benef.id)}
                    >
                      Retirer
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Aucun bénéficiaire assigné à cette réunion
              </AlertDescription>
            </Alert>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
