import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface CalendrierBeneficiaire {
  id: string;
  exercice_id: string;
  membre_id: string;
  rang: number;
  mois_benefice: number | null;
  montant_mensuel: number;
  montant_total: number;
  date_prevue: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  membres?: {
    id: string;
    nom: string;
    prenom: string;
  };
}

export interface CalendrierFormData {
  exercice_id: string;
  membre_id: string;
  rang: number;
  mois_benefice?: number | null;
  montant_mensuel: number;
  date_prevue?: string | null;
  notes?: string | null;
}

export function useCalendrierBeneficiaires(exerciceId?: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Récupérer le calendrier des bénéficiaires pour un exercice
  const { data: calendrier = [], isLoading, refetch } = useQuery({
    queryKey: ['calendrier-beneficiaires', exerciceId],
    queryFn: async () => {
      if (!exerciceId) return [];
      
      const { data, error } = await supabase
        .from('calendrier_beneficiaires')
        .select(`
          *,
          membres:membre_id(id, nom, prenom)
        `)
        .eq('exercice_id', exerciceId)
        .order('rang', { ascending: true });
      
      if (error) throw error;
      return data as CalendrierBeneficiaire[];
    },
    enabled: !!exerciceId
  });

  // Créer un bénéficiaire dans le calendrier
  const createBeneficiaire = useMutation({
    mutationFn: async (data: CalendrierFormData) => {
      const { data: result, error } = await supabase
        .from('calendrier_beneficiaires')
        .insert(data)
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      toast({ title: "Bénéficiaire ajouté au calendrier" });
      queryClient.invalidateQueries({ queryKey: ['calendrier-beneficiaires', exerciceId] });
    },
    onError: (error: any) => {
      toast({ 
        title: "Erreur", 
        description: error.message || "Impossible d'ajouter le bénéficiaire",
        variant: "destructive" 
      });
    }
  });

  // Mettre à jour un bénéficiaire
  const updateBeneficiaire = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CalendrierFormData> }) => {
      const { data: result, error } = await supabase
        .from('calendrier_beneficiaires')
        .update(data)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      toast({ title: "Calendrier mis à jour" });
      queryClient.invalidateQueries({ queryKey: ['calendrier-beneficiaires', exerciceId] });
    },
    onError: (error: any) => {
      toast({ 
        title: "Erreur", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  // Supprimer un bénéficiaire du calendrier
  const deleteBeneficiaire = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('calendrier_beneficiaires')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Bénéficiaire retiré du calendrier" });
      queryClient.invalidateQueries({ queryKey: ['calendrier-beneficiaires', exerciceId] });
    },
    onError: (error: any) => {
      toast({ 
        title: "Erreur", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  // Réorganiser les rangs (mise à jour en masse)
  const reorderBeneficiaires = useMutation({
    mutationFn: async (items: { id: string; rang: number }[]) => {
      // Mettre à jour chaque item séquentiellement pour éviter les conflits de contrainte unique
      for (const item of items) {
        const { error } = await supabase
          .from('calendrier_beneficiaires')
          .update({ rang: item.rang + 1000 }) // Rang temporaire
          .eq('id', item.id);
        if (error) throw error;
      }
      
      // Puis appliquer les vrais rangs
      for (const item of items) {
        const { error } = await supabase
          .from('calendrier_beneficiaires')
          .update({ rang: item.rang })
          .eq('id', item.id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast({ title: "Ordre mis à jour" });
      queryClient.invalidateQueries({ queryKey: ['calendrier-beneficiaires', exerciceId] });
    },
    onError: (error: any) => {
      toast({ 
        title: "Erreur lors de la réorganisation", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  // Initialiser le calendrier avec tous les membres E2D
  const initializeCalendrier = useMutation({
    mutationFn: async ({ exerciceId, membres }: { exerciceId: string; membres: { id: string; montant_mensuel: number }[] }) => {
      const items = membres.map((m, index) => ({
        exercice_id: exerciceId,
        membre_id: m.id,
        rang: index + 1,
        mois_benefice: index + 1 <= 12 ? index + 1 : null,
        montant_mensuel: m.montant_mensuel
      }));

      const { data, error } = await supabase
        .from('calendrier_beneficiaires')
        .insert(items)
        .select();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({ title: "Calendrier initialisé" });
      queryClient.invalidateQueries({ queryKey: ['calendrier-beneficiaires', exerciceId] });
    },
    onError: (error: any) => {
      toast({ 
        title: "Erreur d'initialisation", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  // Calculer le montant net d'un bénéficiaire avec déductions
  const calculerMontant = async (membreId: string, exerciceId: string) => {
    const { data, error } = await supabase.rpc('calculer_montant_beneficiaire', {
      p_membre_id: membreId,
      p_exercice_id: exerciceId
    });
    
    if (error) throw error;
    return data as {
      montant_mensuel: number;
      montant_brut: number;
      sanctions_impayees: number;
      total_deductions: number;
      montant_net: number;
    };
  };

  return {
    calendrier,
    isLoading,
    refetch,
    createBeneficiaire,
    updateBeneficiaire,
    deleteBeneficiaire,
    reorderBeneficiaires,
    initializeCalendrier,
    calculerMontant
  };
}

// Hook pour récupérer le bénéficiaire d'une réunion
export function useBeneficiairesReunion(reunionId?: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: beneficiaires = [], isLoading } = useQuery({
    queryKey: ['reunion-beneficiaires-details', reunionId],
    queryFn: async () => {
      if (!reunionId) return [];
      
      const { data, error } = await supabase
        .from('reunion_beneficiaires')
        .select(`
          *,
          membres:membre_id(id, nom, prenom),
          calendrier:calendrier_id(rang, mois_benefice, montant_mensuel, montant_total)
        `)
        .eq('reunion_id', reunionId);
      
      if (error) throw error;
      return data;
    },
    enabled: !!reunionId
  });

  // Assigner un bénéficiaire à une réunion avec calcul automatique du montant
  const assignerBeneficiaire = useMutation({
    mutationFn: async ({ 
      reunionId, 
      membreId, 
      calendrierId,
      exerciceId,
      montantBrut,
      deductions,
      montantFinal
    }: { 
      reunionId: string; 
      membreId: string;
      calendrierId?: string;
      exerciceId: string;
      montantBrut: number;
      deductions: Record<string, number>;
      montantFinal: number;
    }) => {
      const { data, error } = await supabase
        .from('reunion_beneficiaires')
        .insert({
          reunion_id: reunionId,
          membre_id: membreId,
          calendrier_id: calendrierId,
          montant_benefice: montantFinal,
          montant_brut: montantBrut,
          deductions: deductions,
          montant_final: montantFinal,
          statut: 'prevu',
          date_benefice_prevue: new Date().toISOString()
        })
        .select()
        .single();
      
      if (error) throw error;

      // Enregistrer dans l'audit
      await supabase.from('beneficiaires_paiements_audit').insert({
        reunion_beneficiaire_id: data.id,
        membre_id: membreId,
        exercice_id: exerciceId,
        reunion_id: reunionId,
        action: 'creation',
        montant_brut: montantBrut,
        deductions: deductions,
        montant_final: montantFinal,
        statut_apres: 'prevu'
      });

      return data;
    },
    onSuccess: () => {
      toast({ title: "Bénéficiaire assigné" });
      queryClient.invalidateQueries({ queryKey: ['reunion-beneficiaires-details', reunionId] });
      queryClient.invalidateQueries({ queryKey: ['reunion-beneficiaires'] });
    },
    onError: (error: any) => {
      toast({ 
        title: "Erreur", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  // Marquer comme payé
  const marquerPaye = useMutation({
    mutationFn: async ({ id, payePar, notes }: { id: string; payePar?: string; notes?: string }) => {
      // Récupérer les données actuelles
      const { data: current } = await supabase
        .from('reunion_beneficiaires')
        .select('*, membre_id, montant_brut, deductions, montant_final')
        .eq('id', id)
        .single();

      const { error } = await supabase
        .from('reunion_beneficiaires')
        .update({ 
          statut: 'paye', 
          date_paiement: new Date().toISOString(),
          paye_par: payePar,
          notes_paiement: notes
        })
        .eq('id', id);
      
      if (error) throw error;

      // Enregistrer dans l'audit
      if (current) {
        await supabase.from('beneficiaires_paiements_audit').insert({
          reunion_beneficiaire_id: id,
          membre_id: current.membre_id,
          reunion_id: reunionId,
          action: 'paiement',
          montant_brut: current.montant_brut,
          deductions: current.deductions,
          montant_final: current.montant_final,
          statut_avant: current.statut,
          statut_apres: 'paye',
          notes: notes
        });
      }
    },
    onSuccess: () => {
      toast({ title: "Paiement enregistré" });
      queryClient.invalidateQueries({ queryKey: ['reunion-beneficiaires-details', reunionId] });
      queryClient.invalidateQueries({ queryKey: ['reunion-beneficiaires'] });
    },
    onError: (error: any) => {
      toast({ 
        title: "Erreur", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  return {
    beneficiaires,
    isLoading,
    assignerBeneficiaire,
    marquerPaye
  };
}
