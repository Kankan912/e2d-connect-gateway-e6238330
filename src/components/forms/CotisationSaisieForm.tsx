import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Plus, Coins, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface CotisationSaisieFormProps {
  reunionId: string;
  exerciceId?: string;
  onSuccess?: () => void;
}

export default function CotisationSaisieForm({ reunionId, exerciceId, onSuccess }: CotisationSaisieFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedMembre, setSelectedMembre] = useState<string>("");
  const [selectedType, setSelectedType] = useState<string>("");
  const [montant, setMontant] = useState<string>("");
  const [selectedExercice, setSelectedExercice] = useState<string>(exerciceId || "");

  // Charger les membres E2D actifs
  const { data: membres } = useQuery({
    queryKey: ['membres-e2d-saisie'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('membres')
        .select('id, nom, prenom')
        .eq('statut', 'actif')
        .eq('est_membre_e2d', true)
        .order('nom');
      
      if (error) throw error;
      return data;
    }
  });

  // Charger les types de cotisations
  const { data: types } = useQuery({
    queryKey: ['types-cotisations-saisie'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cotisations_types')
        .select('id, nom, montant_defaut, obligatoire')
        .order('obligatoire', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  // Charger les montants personnalisés
  const { data: cotisationsMembres } = useQuery({
    queryKey: ['cotisations-membres-saisie'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cotisations_membres')
        .select('membre_id, type_cotisation_id, montant_personnalise')
        .eq('actif', true);
      
      if (error) throw error;
      return data;
    }
  });

  // Charger les exercices
  const { data: exercices } = useQuery({
    queryKey: ['exercices-saisie'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('exercices')
        .select('id, nom, statut')
        .order('date_debut', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  // Pré-sélectionner l'exercice actif par défaut
  useEffect(() => {
    if (!selectedExercice && exercices) {
      const actif = exercices.find(e => e.statut === 'actif');
      if (actif) setSelectedExercice(actif.id);
    }
  }, [exercices, selectedExercice]);

  // Mutation pour créer la cotisation
  const createCotisation = useMutation({
    mutationFn: async (data: { membre_id: string; type_cotisation_id: string; montant: number; reunion_id: string; exercice_id?: string }) => {
      const { error } = await supabase
        .from('cotisations')
        .insert({
          membre_id: data.membre_id,
          type_cotisation_id: data.type_cotisation_id,
          montant: data.montant,
          reunion_id: data.reunion_id,
          exercice_id: data.exercice_id,
          statut: 'paye',
          date_paiement: new Date().toISOString().split('T')[0]
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Succès", description: "Cotisation enregistrée" });
      queryClient.invalidateQueries({ queryKey: ['cotisations-reunion', reunionId] });
      setSelectedMembre("");
      setSelectedType("");
      setMontant("");
      onSuccess?.();
    },
    onError: (error: any) => {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    }
  });

  // Mettre à jour le montant quand le membre ou type change
  const handleTypeChange = (typeId: string) => {
    setSelectedType(typeId);
    
    if (!selectedMembre || !typeId) return;
    
    // Chercher montant personnalisé
    const configPerso = cotisationsMembres?.find(
      cm => cm.membre_id === selectedMembre && cm.type_cotisation_id === typeId
    );
    
    if (configPerso) {
      setMontant(configPerso.montant_personnalise.toString());
    } else {
      const type = types?.find(t => t.id === typeId);
      setMontant(type?.montant_defaut?.toString() || "0");
    }
  };

  const handleSubmit = () => {
    if (!selectedMembre || !selectedType || !montant || !selectedExercice) {
      toast({ title: "Erreur", description: "Veuillez remplir tous les champs (y compris l'exercice)", variant: "destructive" });
      return;
    }

    createCotisation.mutate({
      membre_id: selectedMembre,
      type_cotisation_id: selectedType,
      montant: parseFloat(montant),
      reunion_id: reunionId,
      exercice_id: selectedExercice
    });
  };

  return (
    <Card className="border-dashed border-2 border-primary/30 bg-primary/5">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Enregistrer une cotisation
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
          <div className="space-y-1">
            <Label className="text-xs">Membre</Label>
            <Select value={selectedMembre} onValueChange={setSelectedMembre}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Sélectionner..." />
              </SelectTrigger>
              <SelectContent>
                {membres?.map(m => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.prenom} {m.nom}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Type</Label>
            <Select value={selectedType} onValueChange={handleTypeChange}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Type..." />
              </SelectTrigger>
              <SelectContent>
                {types?.map(t => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.nom} {t.obligatoire && "(Oblig.)"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label className="text-xs flex items-center gap-1">
              Exercice
              {exercices?.find(e => e.id === selectedExercice)?.statut === 'actif' && (
                <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 bg-green-500/10 text-green-600 border-green-500/30">
                  Actif
                </Badge>
              )}
            </Label>
            <Select value={selectedExercice} onValueChange={setSelectedExercice}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Exercice..." />
              </SelectTrigger>
              <SelectContent>
                {exercices?.map(e => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.nom}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Montant (€)</Label>
            <Input
              type="number"
              value={montant}
              onChange={(e) => setMontant(e.target.value)}
              placeholder="0"
              className="h-9"
            />
          </div>

          <Button 
            onClick={handleSubmit} 
            disabled={createCotisation.isPending || !selectedMembre || !selectedType || !montant || !selectedExercice}
            size="sm"
            className="h-9"
          >
            {createCotisation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Coins className="h-4 w-4 mr-1" />
                Enregistrer
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
