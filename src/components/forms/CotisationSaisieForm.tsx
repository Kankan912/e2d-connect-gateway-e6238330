import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Plus, Coins, Loader2, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatFCFA } from "@/lib/utils";

interface CotisationSaisieFormProps {
  reunionId: string;
  exerciceId?: string;
  onSuccess?: () => void;
}

export default function CotisationSaisieForm({ reunionId, exerciceId, onSuccess }: CotisationSaisieFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedExercice, setSelectedExercice] = useState<string>(exerciceId || "");
  const [selectedMembre, setSelectedMembre] = useState<string>("");
  const [selectedType, setSelectedType] = useState<string>("");
  const [montant, setMontant] = useState<string>("");

  // Étape actuelle du formulaire (1: Exercice, 2: Membre, 3: Type, 4: Montant)
  const currentStep = !selectedExercice ? 1 : !selectedMembre ? 2 : !selectedType ? 3 : 4;

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
    queryKey: ['cotisations-membres-saisie', selectedExercice],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cotisations_membres')
        .select('membre_id, type_cotisation_id, montant_personnalise')
        .eq('actif', true)
        .eq('exercice_id', selectedExercice);
      
      if (error) throw error;
      return data;
    },
    enabled: !!selectedExercice
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
      // Reset pour nouvelle saisie (garder exercice sélectionné)
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

  // Reset membre et suivants quand exercice change
  const handleExerciceChange = (value: string) => {
    setSelectedExercice(value);
    setSelectedMembre("");
    setSelectedType("");
    setMontant("");
  };

  // Reset type et montant quand membre change
  const handleMembreChange = (value: string) => {
    setSelectedMembre(value);
    setSelectedType("");
    setMontant("");
  };

  const handleSubmit = () => {
    if (!selectedMembre || !selectedType || !montant || !selectedExercice) {
      toast({ title: "Erreur", description: "Veuillez remplir tous les champs", variant: "destructive" });
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

  // Indicateur de progression
  const StepIndicator = ({ step, label, active, completed }: { step: number; label: string; active: boolean; completed: boolean }) => (
    <div className="flex items-center gap-1">
      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
        completed ? 'bg-success text-success-foreground' : 
        active ? 'bg-primary text-primary-foreground' : 
        'bg-muted text-muted-foreground'
      }`}>
        {completed ? <CheckCircle2 className="w-4 h-4" /> : step}
      </div>
      <span className={`text-xs ${active ? 'font-medium' : 'text-muted-foreground'}`}>{label}</span>
    </div>
  );

  return (
    <Card className="border-dashed border-2 border-primary/30 bg-primary/5">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Enregistrer une cotisation
          </div>
          {/* Progression */}
          <div className="flex items-center gap-4">
            <StepIndicator step={1} label="Exercice" active={currentStep === 1} completed={!!selectedExercice} />
            <StepIndicator step={2} label="Membre" active={currentStep === 2} completed={!!selectedMembre} />
            <StepIndicator step={3} label="Type" active={currentStep === 3} completed={!!selectedType} />
            <StepIndicator step={4} label="Montant" active={currentStep === 4} completed={!!montant} />
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
          {/* Étape 1: Exercice */}
          <div className="space-y-1">
            <Label className="text-xs flex items-center gap-1">
              1. Exercice
              {exercices?.find(e => e.id === selectedExercice)?.statut === 'actif' && (
                <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 bg-green-500/10 text-green-600 border-green-500/30">
                  Actif
                </Badge>
              )}
            </Label>
            <Select value={selectedExercice} onValueChange={handleExerciceChange}>
              <SelectTrigger className={`h-9 ${!selectedExercice ? 'ring-2 ring-primary' : ''}`}>
                <SelectValue placeholder="Sélectionner..." />
              </SelectTrigger>
              <SelectContent>
                {exercices?.map(e => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.nom} {e.statut === 'actif' && '✓'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Étape 2: Membre */}
          <div className="space-y-1">
            <Label className="text-xs">2. Membre</Label>
            <Select 
              value={selectedMembre} 
              onValueChange={handleMembreChange}
              disabled={!selectedExercice}
            >
              <SelectTrigger className={`h-9 ${selectedExercice && !selectedMembre ? 'ring-2 ring-primary' : ''}`}>
                <SelectValue placeholder={!selectedExercice ? "Choisir exercice d'abord" : "Sélectionner..."} />
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

          {/* Étape 3: Type */}
          <div className="space-y-1">
            <Label className="text-xs">3. Type</Label>
            <Select 
              value={selectedType} 
              onValueChange={handleTypeChange}
              disabled={!selectedMembre}
            >
              <SelectTrigger className={`h-9 ${selectedMembre && !selectedType ? 'ring-2 ring-primary' : ''}`}>
                <SelectValue placeholder={!selectedMembre ? "Choisir membre d'abord" : "Type..."} />
              </SelectTrigger>
              <SelectContent>
                {types?.map(t => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.nom} {t.obligatoire && "(Oblig.)"} - {formatFCFA(t.montant_defaut || 0)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Étape 4: Montant */}
          <div className="space-y-1">
            <Label className="text-xs">4. Montant (FCFA)</Label>
            <Input
              type="number"
              value={montant}
              onChange={(e) => setMontant(e.target.value)}
              placeholder="0"
              className={`h-9 ${selectedType && !montant ? 'ring-2 ring-primary' : ''}`}
              disabled={!selectedType}
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
