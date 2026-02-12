import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { formatFCFA } from "@/lib/utils";

export interface CaisseOperation {
  id: string;
  date_operation: string;
  type_operation: 'entree' | 'sortie';
  montant: number;
  libelle: string;
  categorie: string;
  reunion_id?: string | null;
  exercice_id?: string | null;
  source_table?: string | null;
  source_id?: string | null;
  beneficiaire_id?: string | null;
  operateur_id: string;
  notes?: string | null;
  justificatif_url?: string | null;
  created_at: string;
  operateur?: { nom: string; prenom: string };
  beneficiaire?: { nom: string; prenom: string };
  reunion?: { sujet: string; date_reunion: string };
}

export interface CaisseConfig {
  id: string;
  seuil_alerte_solde: number;
  seuil_alerte_empruntable: number;
  pourcentage_empruntable: number;
  created_at: string;
  updated_at: string;
}

export interface CaisseStats {
  solde_global: number;
  solde_empruntable: number;
  total_entrees: number;
  total_sorties: number;
  total_entrees_mois: number;
  total_sorties_mois: number;
  alertes: Array<{ type: 'warning' | 'error'; message: string }>;
}

export type CaisseCategorie = 
  | 'epargne' 
  | 'cotisation' 
  | 'pret_decaissement' 
  | 'pret_remboursement' 
  | 'sanction' 
  | 'aide' 
  | 'beneficiaire' 
  | 'interet'
  | 'sport'
  | 'autre';

export const CAISSE_CATEGORIES: Record<CaisseCategorie, { label: string; color: string }> = {
  epargne: { label: 'Épargne', color: 'bg-emerald-500' },
  cotisation: { label: 'Cotisation', color: 'bg-blue-500' },
  pret_decaissement: { label: 'Décaissement Prêt', color: 'bg-red-500' },
  pret_remboursement: { label: 'Remboursement Prêt', color: 'bg-green-500' },
  sanction: { label: 'Sanction', color: 'bg-orange-500' },
  aide: { label: 'Aide', color: 'bg-purple-500' },
  beneficiaire: { label: 'Bénéficiaire Tontine', color: 'bg-pink-500' },
  interet: { label: 'Intérêts', color: 'bg-yellow-500' },
  sport: { label: 'Sport', color: 'bg-teal-500' },
  autre: { label: 'Autre', color: 'bg-gray-500' },
};

export interface CaisseFilters {
  dateDebut?: string;
  dateFin?: string;
  exerciceId?: string;
  reunionId?: string;
  categorie?: string;
  type?: 'entree' | 'sortie' | 'toutes';
}

// Hook pour récupérer les opérations de caisse
export const useCaisseOperations = (filters?: CaisseFilters) => {
  return useQuery({
    queryKey: ["caisse-operations", filters],
    queryFn: async () => {
      let query = supabase
        .from("fond_caisse_operations")
        .select(`
          *,
          operateur:membres!fk_fond_caisse_operations_operateur(nom, prenom),
          beneficiaire:membres!fk_fond_caisse_operations_beneficiaire(nom, prenom)
        `)
        .order("date_operation", { ascending: false })
        .order("created_at", { ascending: false });

      if (filters?.dateDebut) {
        query = query.gte("date_operation", filters.dateDebut);
      }
      if (filters?.dateFin) {
        query = query.lte("date_operation", filters.dateFin);
      }
      if (filters?.exerciceId) {
        query = query.eq("exercice_id", filters.exerciceId);
      }
      if (filters?.reunionId) {
        query = query.eq("reunion_id", filters.reunionId);
      }
      if (filters?.categorie && filters.categorie !== 'toutes') {
        query = query.eq("categorie", filters.categorie);
      }
      if (filters?.type && filters.type !== 'toutes') {
        query = query.eq("type_operation", filters.type);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as CaisseOperation[];
    },
  });
};

// Hook pour les statistiques de caisse (dérive de useCaisseSynthese pour éviter la duplication)
export const useCaisseStats = () => {
  const { data: config } = useCaisseConfig();

  return useQuery({
    queryKey: ["caisse-stats"],
    queryFn: async (): Promise<CaisseStats> => {
      const now = new Date();
      const debutMois = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];

      // Pagination: récupérer toutes les opérations par blocs de 1000
      const allOperations: Array<{ montant: number; type_operation: string; date_operation: string }> = [];
      let from = 0;
      const PAGE_SIZE = 1000;
      let hasMore = true;

      while (hasMore) {
        const { data, error } = await supabase
          .from("fond_caisse_operations")
          .select("montant, type_operation, date_operation")
          .range(from, from + PAGE_SIZE - 1);

        if (error) throw error;
        if (data) allOperations.push(...data);
        hasMore = (data?.length || 0) === PAGE_SIZE;
        from += PAGE_SIZE;
      }

      const total_entrees = allOperations
        .filter(o => o.type_operation === 'entree')
        .reduce((sum, o) => sum + Number(o.montant), 0);

      const total_sorties = allOperations
        .filter(o => o.type_operation === 'sortie')
        .reduce((sum, o) => sum + Number(o.montant), 0);

      const total_entrees_mois = allOperations
        .filter(o => o.type_operation === 'entree' && o.date_operation >= debutMois)
        .reduce((sum, o) => sum + Number(o.montant), 0);

      const total_sorties_mois = allOperations
        .filter(o => o.type_operation === 'sortie' && o.date_operation >= debutMois)
        .reduce((sum, o) => sum + Number(o.montant), 0);

      const solde_global = total_entrees - total_sorties;
      const pourcentage = config?.pourcentage_empruntable || 80;
      const solde_empruntable = solde_global * (pourcentage / 100);

      const alertes: Array<{ type: 'warning' | 'error'; message: string }> = [];

      if (config) {
        if (solde_global < config.seuil_alerte_solde) {
          alertes.push({
            type: 'warning',
            message: `Solde global bas: ${formatFCFA(solde_global)} (seuil: ${formatFCFA(config.seuil_alerte_solde)})`
          });
        }
        if (solde_empruntable < config.seuil_alerte_empruntable) {
          alertes.push({
            type: 'error',
            message: `Solde empruntable critique: ${formatFCFA(solde_empruntable)} (seuil: ${formatFCFA(config.seuil_alerte_empruntable)})`
          });
        }
      }

      return {
        solde_global,
        solde_empruntable,
        total_entrees,
        total_sorties,
        total_entrees_mois,
        total_sorties_mois,
        alertes
      };
    },
  });
};

// Hook pour la configuration de caisse
export const useCaisseConfig = () => {
  return useQuery({
    queryKey: ["caisse-config"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("caisse_config")
        .select("*")
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data as CaisseConfig | null;
    },
  });
};

// Hook pour mettre à jour la configuration
export const useUpdateCaisseConfig = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updates: Partial<CaisseConfig>) => {
      const { data: existing } = await supabase
        .from("caisse_config")
        .select("id")
        .single();

      if (existing) {
        const { data, error } = await supabase
          .from("caisse_config")
          .update(updates)
          .eq("id", existing.id)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from("caisse_config")
          .insert([updates])
          .select()
          .single();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["caisse-config"] });
      queryClient.invalidateQueries({ queryKey: ["caisse-stats"] });
      toast({ title: "Succès", description: "Configuration mise à jour" });
    },
    onError: (error: Error) => {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    },
  });
};

// Hook pour créer une opération manuelle
export const useCreateCaisseOperation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (operation: Omit<CaisseOperation, 'id' | 'created_at' | 'operateur' | 'beneficiaire' | 'reunion'>) => {
      const { data, error } = await supabase
        .from("fond_caisse_operations")
        .insert([{
          ...operation,
          categorie: operation.categorie || 'autre'
        }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["caisse-operations"] });
      queryClient.invalidateQueries({ queryKey: ["caisse-stats"] });
      toast({ title: "Succès", description: "Opération enregistrée" });
    },
    onError: (error: Error) => {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    },
  });
};

// Hook pour supprimer une opération (uniquement manuelles)
export const useDeleteCaisseOperation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (operationId: string) => {
      // Vérifier si c'est une opération manuelle
      const { data: operation } = await supabase
        .from("fond_caisse_operations")
        .select("source_table")
        .eq("id", operationId)
        .single();

      if (operation?.source_table) {
        throw new Error("Impossible de supprimer une opération automatique. Supprimez l'enregistrement source.");
      }

      const { error } = await supabase
        .from("fond_caisse_operations")
        .delete()
        .eq("id", operationId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["caisse-operations"] });
      queryClient.invalidateQueries({ queryKey: ["caisse-stats"] });
      toast({ title: "Succès", description: "Opération supprimée" });
    },
    onError: (error: Error) => {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    },
  });
};

// Fonction utilitaire pour créer une opération de caisse depuis un autre module
export const createCaisseOperationFromModule = async (
  type_operation: 'entree' | 'sortie',
  montant: number,
  libelle: string,
  categorie: CaisseCategorie,
  operateur_id: string,
  options?: {
    reunion_id?: string;
    exercice_id?: string;
    source_table?: string;
    source_id?: string;
    beneficiaire_id?: string;
    notes?: string;
  }
) => {
  const { error } = await supabase
    .from("fond_caisse_operations")
    .insert([{
      type_operation,
      montant,
      libelle,
      categorie,
      operateur_id,
      date_operation: new Date().toISOString().split('T')[0],
      ...options
    }]);
  
  if (error) {
    console.error("Erreur création opération caisse:", error);
    throw error;
  }
};

// Hook pour la ventilation par catégorie
export const useCaisseVentilation = (type: 'entree' | 'sortie' | 'toutes' = 'toutes') => {
  const { data: operations } = useCaisseOperations();

  return useQuery({
    queryKey: ["caisse-ventilation", type, operations],
    queryFn: async () => {
      if (!operations) return [];

      const filtered = type === 'toutes' 
        ? operations 
        : operations.filter(o => o.type_operation === type);

      const grouped = filtered.reduce((acc, op) => {
        const cat = op.categorie || 'autre';
        if (!acc[cat]) {
          acc[cat] = { categorie: cat, total: 0, count: 0 };
        }
        acc[cat].total += Number(op.montant);
        acc[cat].count += 1;
        return acc;
      }, {} as Record<string, { categorie: string; total: number; count: number }>);

      return Object.values(grouped).sort((a, b) => b.total - a.total);
    },
    enabled: !!operations,
  });
};
