import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Adhesion {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string | null;
  type_adhesion: string;
  motivation: string | null;
  statut: string;
  created_at: string;
}

export const useAdhesions = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: adhesions, isLoading, error } = useQuery({
    queryKey: ["adhesions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("demandes_adhesion")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Adhesion[];
    },
  });

  const updateAdhesionStatus = useMutation({
    mutationFn: async ({ id, statut }: { id: string; statut: string }) => {
      const { error } = await supabase
        .from("demandes_adhesion")
        .update({ statut })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adhesions"] });
      toast({
        title: "Statut mis à jour",
        description: "Le statut de la demande a été modifié",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de mettre à jour le statut",
        variant: "destructive",
      });
    },
  });

  return {
    adhesions,
    isLoading,
    error,
    updateAdhesionStatus,
  };
};
