import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

export interface Cotisation {
  id: string;
  membre_id: string;
  type_cotisation_id: string;
  exercice_id: string;
  montant: number;
  date_paiement: string;
  statut: 'paye' | 'en_attente' | 'annule';
  justificatif_url?: string;
  created_at: string;
  type?: {
    nom: string;
    description?: string;
  };
  membre?: {
    nom: string;
    prenom: string;
  };
}

export type CotisationInsert = Omit<Cotisation, 'id' | 'created_at' | 'type' | 'membre'>;

export const useUserCotisations = () => {
  const { profile } = useAuth();

  return useQuery({
    queryKey: ['user-cotisations', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];

      const { data: membre } = await supabase
        .from('membres')
        .select('id')
        .eq('user_id', profile.id)
        .single();

      if (!membre) return [];

      const { data, error } = await supabase
        .from('cotisations')
        .select(`
          *,
          type:cotisations_types(nom, description),
          membre:membres(nom, prenom)
        `)
        .eq('membre_id', membre.id)
        .order('date_paiement', { ascending: false });

      if (error) throw error;
      return data as Cotisation[];
    },
    enabled: !!profile?.id,
  });
};

export const useAllCotisations = () => {
  return useQuery({
    queryKey: ['all-cotisations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cotisations')
        .select(`
          *,
          type:cotisations_types(nom, description),
          membre:membres(nom, prenom)
        `)
        .order('date_paiement', { ascending: false });

      if (error) throw error;
      return data as Cotisation[];
    },
  });
};

export const useCotisationsTypes = () => {
  return useQuery({
    queryKey: ['cotisations-types'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cotisations_types')
        .select('*')
        .order('nom');

      if (error) throw error;
      return data;
    },
  });
};

export const useCreateCotisation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newCotisation: CotisationInsert) => {
      const { data, error } = await supabase
        .from('cotisations')
        .insert([newCotisation])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-cotisations'] });
      queryClient.invalidateQueries({ queryKey: ['all-cotisations'] });
      queryClient.invalidateQueries({ queryKey: ['cotisations-reunion'] });
      queryClient.invalidateQueries({ queryKey: ['caisse-operations'] });
      queryClient.invalidateQueries({ queryKey: ['caisse-stats'] });
      queryClient.invalidateQueries({ queryKey: ['caisse-synthese'] });
      toast({ title: "Succès", description: "Cotisation créée avec succès" });
    },
    onError: (error) => {
      toast({ title: "Erreur", description: "Erreur lors de la création de la cotisation", variant: "destructive" });
      console.error(error);
    },
  });
};

export const useUpdateCotisation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Cotisation> & { id: string }) => {
      const { data, error } = await supabase
        .from('cotisations')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-cotisations'] });
      queryClient.invalidateQueries({ queryKey: ['all-cotisations'] });
      queryClient.invalidateQueries({ queryKey: ['cotisations-reunion'] });
      queryClient.invalidateQueries({ queryKey: ['caisse-operations'] });
      queryClient.invalidateQueries({ queryKey: ['caisse-stats'] });
      queryClient.invalidateQueries({ queryKey: ['caisse-synthese'] });
      toast({ title: "Succès", description: "Cotisation mise à jour avec succès" });
    },
    onError: (error) => {
      toast({ title: "Erreur", description: "Erreur lors de la mise à jour de la cotisation", variant: "destructive" });
      console.error(error);
    },
  });
};

export const useDeleteCotisation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('cotisations')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-cotisations'] });
      queryClient.invalidateQueries({ queryKey: ['all-cotisations'] });
      queryClient.invalidateQueries({ queryKey: ['caisse-operations'] });
      queryClient.invalidateQueries({ queryKey: ['caisse-stats'] });
      queryClient.invalidateQueries({ queryKey: ['caisse-synthese'] });
      toast({ title: "Succès", description: "Cotisation supprimée avec succès" });
    },
    onError: (error) => {
      toast({ title: "Erreur", description: "Erreur lors de la suppression de la cotisation", variant: "destructive" });
      console.error(error);
    },
  });
};

// Hook pour récupérer les cotisations par réunion
export const useCotisationsParReunion = (reunionId: string | null) => {
  return useQuery({
    queryKey: ['cotisations-reunion', reunionId],
    queryFn: async () => {
      if (!reunionId) return [];
      
      const { data, error } = await supabase
        .from('cotisations')
        .select(`
          *,
          type:cotisations_types(nom, description, montant_defaut),
          membre:membres(nom, prenom)
        `)
        .eq('reunion_id', reunionId)
        .order('date_paiement', { ascending: false });

      if (error) throw error;
      return data as Cotisation[];
    },
    enabled: !!reunionId,
  });
};
