import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Member {
  id: string;
  user_id: string | null;
  nom: string;
  prenom: string;
  telephone: string;
  email: string | null;
  photo_url: string | null;
  statut: string;
  date_inscription: string;
  est_membre_e2d: boolean;
  est_adherent_phoenix: boolean;
  equipe_e2d: string | null;
  equipe_phoenix: string | null;
  fonction: string | null;
  created_at: string;
  updated_at: string;
}

export const useMembers = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: members, isLoading, error } = useQuery({
    queryKey: ["members"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("membres")
        .select("*")
        .order("nom", { ascending: true });

      if (error) throw error;
      return data as Member[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - données membres stables
    gcTime: 30 * 60 * 1000, // 30 minutes de cache
  });

  const createMember = useMutation({
    mutationFn: async (memberData: Omit<Member, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from("membres")
        .insert([memberData])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members"] });
      toast({
        title: "Membre créé",
        description: "Le membre a été ajouté avec succès",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de créer le membre",
        variant: "destructive",
      });
    },
  });

  const updateMember = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Member> }) => {
      const { error } = await supabase
        .from("membres")
        .update(data)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members"] });
      toast({
        title: "Membre mis à jour",
        description: "Les informations ont été enregistrées",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de mettre à jour le membre",
        variant: "destructive",
      });
    },
  });

  const deleteMember = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("membres")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members"] });
      toast({
        title: "Membre supprimé",
        description: "Le membre a été supprimé avec succès",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de supprimer le membre",
        variant: "destructive",
      });
    },
  });

  return {
    members,
    isLoading,
    error,
    createMember,
    updateMember,
    deleteMember,
  };
};
