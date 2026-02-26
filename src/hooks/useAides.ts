/**
 * @module useAides
 * Hook CRUD pour la gestion des aides aux bénéficiaires (allocations, remboursements).
 *
 * @example
 * const { aides, createAide, updateAide, deleteAide } = useAides();
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Aide {
  id: string;
  type_aide_id: string;
  beneficiaire_id: string;
  reunion_id: string | null;
  exercice_id: string | null;
  montant: number;
  date_allocation: string;
  contexte_aide: string;
  statut: string;
  justificatif_url: string | null;
  notes: string | null;
  created_at: string;
  type_aide?: {
    id: string;
    nom: string;
    montant_defaut: number | null;
    mode_repartition: string;
  };
  beneficiaire?: {
    id: string;
    nom: string;
    prenom: string;
  };
  reunion?: {
    id: string;
    date_reunion: string;
    ordre_du_jour: string | null;
  };
  exercice?: {
    id: string;
    nom: string;
  };
}

export interface AideType {
  id: string;
  nom: string;
  description: string | null;
  montant_defaut: number | null;
  mode_repartition: string;
  delai_remboursement: number | null;
}

export function useAides() {
  return useQuery({
    queryKey: ["aides"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("aides")
        .select(`
          *,
          type_aide:aides_types(id, nom, montant_defaut, mode_repartition),
          beneficiaire:membres!beneficiaire_id(id, nom, prenom),
          reunion:reunions!reunion_id(id, date_reunion, ordre_du_jour),
          exercice:exercices!exercice_id(id, nom)
        `)
        .order("date_allocation", { ascending: false });
      if (error) throw error;
      return data as Aide[];
    },
  });
}

export function useAidesTypes() {
  return useQuery({
    queryKey: ["aides-types"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("aides_types")
        .select("*")
        .order("nom");
      if (error) throw error;
      return data as AideType[];
    },
  });
}

export function useCreateAide() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (aide: Omit<Aide, "id" | "created_at" | "type_aide" | "beneficiaire" | "exercice">) => {
      const { data, error } = await supabase
        .from("aides")
        .insert(aide)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["aides"] });
      queryClient.invalidateQueries({ queryKey: ["caisse-operations"] });
      queryClient.invalidateQueries({ queryKey: ["caisse-synthese"] });
      toast({ title: "Aide créée avec succès" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Erreur", 
        description: error.message, 
        variant: "destructive" 
      });
    },
  });
}

export function useUpdateAide() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...aide }: Partial<Aide> & { id: string }) => {
      const { data, error } = await supabase
        .from("aides")
        .update(aide)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["aides"] });
      queryClient.invalidateQueries({ queryKey: ["caisse-operations"] });
      queryClient.invalidateQueries({ queryKey: ["caisse-synthese"] });
      toast({ title: "Aide modifiée avec succès" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Erreur", 
        description: error.message, 
        variant: "destructive" 
      });
    },
  });
}

export function useDeleteAide() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("aides")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["aides"] });
      queryClient.invalidateQueries({ queryKey: ["caisse-operations"] });
      queryClient.invalidateQueries({ queryKey: ["caisse-synthese"] });
      toast({ title: "Aide supprimée" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Erreur", 
        description: error.message, 
        variant: "destructive" 
      });
    },
  });
}

export function useCreateAideType() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (type: Omit<AideType, "id">) => {
      const { data, error } = await supabase
        .from("aides_types")
        .insert(type)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["aides-types"] });
      toast({ title: "Type d'aide créé avec succès" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Erreur", 
        description: error.message, 
        variant: "destructive" 
      });
    },
  });
}

export function useDeleteAideType() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("aides_types")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["aides-types"] });
      toast({ title: "Type d'aide supprimé" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Erreur", 
        description: error.message, 
        variant: "destructive" 
      });
    },
  });
}
