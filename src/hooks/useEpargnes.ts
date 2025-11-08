import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

export interface Epargne {
  id: string;
  membre_id: string;
  montant: number;
  date_depot: string;
  exercice_id: string | null;
  reunion_id: string | null;
  statut: string;
  notes: string | null;
  created_at: string;
  membre?: {
    nom: string;
    prenom: string;
  };
}

export type EpargneInsert = Omit<Epargne, "id" | "created_at" | "updated_at" | "membre">;

export const useUserEpargnes = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["user-epargnes", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data: membre } = await supabase
        .from("membres")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!membre) return [];

      const { data, error } = await supabase
        .from("epargnes")
        .select(`
          *,
          membre:membres(nom, prenom)
        `)
        .eq("membre_id", membre.id)
        .order("date_depot", { ascending: false });

      if (error) throw error;
      return data as Epargne[];
    },
    enabled: !!user?.id,
  });
};

export const useAllEpargnes = () => {
  return useQuery({
    queryKey: ["all-epargnes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("epargnes")
        .select(`
          *,
          membre:membres(nom, prenom)
        `)
        .order("date_depot", { ascending: false });

      if (error) throw error;
      return data as Epargne[];
    },
  });
};

export const useCreateEpargne = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (epargne: Omit<EpargneInsert, "created_at" | "updated_at" | "statut">) => {
      const { data, error } = await supabase
        .from("epargnes")
        .insert([epargne])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-epargnes"] });
      queryClient.invalidateQueries({ queryKey: ["user-epargnes"] });
      toast({
        title: "Succès",
        description: "Épargne créée avec succès",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

export const useUpdateEpargne = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Epargne> & { id: string }) => {
      const { data, error } = await supabase
        .from("epargnes")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-epargnes"] });
      queryClient.invalidateQueries({ queryKey: ["user-epargnes"] });
      toast({
        title: "Succès",
        description: "Épargne mise à jour",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

export const useDeleteEpargne = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("epargnes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-epargnes"] });
      queryClient.invalidateQueries({ queryKey: ["user-epargnes"] });
      toast({
        title: "Succès",
        description: "Épargne supprimée",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};
