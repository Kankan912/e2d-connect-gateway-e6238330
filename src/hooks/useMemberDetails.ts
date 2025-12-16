import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface MemberCotisation {
  id: string;
  montant: number;
  date_paiement: string | null;
  statut: string | null;
  type_cotisation?: {
    nom: string;
  } | null;
  reunion?: {
    sujet: string;
    date_reunion: string;
  } | null;
}

export interface MemberEpargne {
  id: string;
  montant: number;
  date_depot: string;
  statut: string;
  notes: string | null;
  reunion?: {
    sujet: string;
    date_reunion: string;
  } | null;
}

export interface MemberPret {
  id: string;
  montant: number;
  montant_paye: number;
  capital_paye: number;
  interet_paye: number;
  taux_interet: number;
  date_pret: string;
  echeance: string;
  statut: string;
  notes: string | null;
}

export interface MemberSanction {
  id: string;
  motif: string;
  montant_amende: number;
  statut: string;
  created_at: string;
  reunion?: {
    sujet: string;
    date_reunion: string;
  } | null;
}

export interface MemberOperation {
  id: string;
  type_operation: string;
  montant: number;
  libelle: string;
  categorie: string | null;
  date_operation: string;
  notes: string | null;
}

export interface MemberStats {
  totalEpargne: number;
  totalEmprunte: number;
  totalRembourse: number;
  cotisationsPayees: number;
  cotisationsTotal: number;
  pourcentageCotisation: number;
  derniereCotisation: string | null;
  sanctionsEnCours: number;
  pretsEnCours: number;
}

export const useMemberDetails = (membreId: string | null) => {
  // Cotisations du membre
  const cotisationsQuery = useQuery({
    queryKey: ["member-cotisations", membreId],
    queryFn: async () => {
      if (!membreId) return [];
      const { data, error } = await supabase
        .from("cotisations")
        .select(`
          id, montant, date_paiement, statut,
          cotisations_types:type_cotisation_id (nom),
          reunions:reunion_id (sujet, date_reunion)
        `)
        .eq("membre_id", membreId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as MemberCotisation[];
    },
    enabled: !!membreId,
  });

  // Épargnes du membre
  const epargnesQuery = useQuery({
    queryKey: ["member-epargnes", membreId],
    queryFn: async () => {
      if (!membreId) return [];
      const { data, error } = await supabase
        .from("epargnes")
        .select(`
          id, montant, date_depot, statut, notes,
          reunions:reunion_id (sujet, date_reunion)
        `)
        .eq("membre_id", membreId)
        .order("date_depot", { ascending: false });
      if (error) throw error;
      return data as MemberEpargne[];
    },
    enabled: !!membreId,
  });

  // Prêts du membre
  const pretsQuery = useQuery({
    queryKey: ["member-prets", membreId],
    queryFn: async () => {
      if (!membreId) return [];
      const { data, error } = await supabase
        .from("prets")
        .select("id, montant, montant_paye, capital_paye, interet_paye, taux_interet, date_pret, echeance, statut, notes")
        .eq("membre_id", membreId)
        .order("date_pret", { ascending: false });
      if (error) throw error;
      return data as MemberPret[];
    },
    enabled: !!membreId,
  });

  // Sanctions du membre
  const sanctionsQuery = useQuery({
    queryKey: ["member-sanctions", membreId],
    queryFn: async () => {
      if (!membreId) return [];
      const { data, error } = await supabase
        .from("reunions_sanctions")
        .select(`
          id, motif, montant_amende, statut, created_at,
          reunions:reunion_id (sujet, date_reunion)
        `)
        .eq("membre_id", membreId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as MemberSanction[];
    },
    enabled: !!membreId,
  });

  // Opérations fond caisse liées au membre
  const operationsQuery = useQuery({
    queryKey: ["member-operations", membreId],
    queryFn: async () => {
      if (!membreId) return [];
      const { data, error } = await supabase
        .from("fond_caisse_operations")
        .select("id, type_operation, montant, libelle, categorie, date_operation, notes")
        .or(`operateur_id.eq.${membreId},beneficiaire_id.eq.${membreId}`)
        .order("date_operation", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data as MemberOperation[];
    },
    enabled: !!membreId,
  });

  // Calcul des statistiques
  const stats: MemberStats = {
    totalEpargne: epargnesQuery.data?.reduce((sum, e) => sum + e.montant, 0) || 0,
    totalEmprunte: pretsQuery.data?.reduce((sum, p) => sum + p.montant, 0) || 0,
    totalRembourse: pretsQuery.data?.reduce((sum, p) => sum + (p.montant_paye || 0), 0) || 0,
    cotisationsPayees: cotisationsQuery.data?.filter(c => c.statut === 'paye').length || 0,
    cotisationsTotal: cotisationsQuery.data?.length || 0,
    pourcentageCotisation: cotisationsQuery.data?.length 
      ? Math.round((cotisationsQuery.data.filter(c => c.statut === 'paye').length / cotisationsQuery.data.length) * 100)
      : 100,
    derniereCotisation: cotisationsQuery.data?.find(c => c.statut === 'paye')?.date_paiement || null,
    sanctionsEnCours: sanctionsQuery.data?.filter(s => s.statut === 'en_attente').length || 0,
    pretsEnCours: pretsQuery.data?.filter(p => p.statut === 'en_cours').length || 0,
  };

  return {
    cotisations: cotisationsQuery.data || [],
    epargnes: epargnesQuery.data || [],
    prets: pretsQuery.data || [],
    sanctions: sanctionsQuery.data || [],
    operations: operationsQuery.data || [],
    stats,
    isLoading: cotisationsQuery.isLoading || epargnesQuery.isLoading || pretsQuery.isLoading || sanctionsQuery.isLoading || operationsQuery.isLoading,
    error: cotisationsQuery.error || epargnesQuery.error || pretsQuery.error || sanctionsQuery.error || operationsQuery.error,
  };
};

// Hook pour les stats de cotisations d'un membre (utilisé dans la liste)
export const useMemberCotisationStats = (membreId: string) => {
  return useQuery({
    queryKey: ["member-cotisation-stats", membreId],
    queryFn: async () => {
      const { data: cotisations, error } = await supabase
        .from("cotisations")
        .select("id, statut, date_paiement")
        .eq("membre_id", membreId);
      
      if (error) throw error;
      
      const payees = cotisations?.filter(c => c.statut === 'paye').length || 0;
      const total = cotisations?.length || 0;
      const pourcentage = total > 0 ? Math.round((payees / total) * 100) : 100;
      const dernierPaiement = cotisations
        ?.filter(c => c.date_paiement)
        .sort((a, b) => new Date(b.date_paiement!).getTime() - new Date(a.date_paiement!).getTime())[0]?.date_paiement || null;
      
      return {
        payees,
        total,
        pourcentage,
        dernierPaiement,
        enRetard: pourcentage < 100,
      };
    },
    enabled: !!membreId,
  });
};
