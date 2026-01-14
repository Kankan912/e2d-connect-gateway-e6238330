import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

// Hook pour récupérer le membre_id de l'utilisateur connecté
export const useUserMemberId = () => {
  const { profile } = useAuth();

  return useQuery({
    queryKey: ['user-membre-id', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return null;

      const { data, error } = await supabase
        .from('membres')
        .select('id, nom, prenom, statut, email, telephone')
        .eq('user_id', profile.id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!profile?.id,
  });
};

// Types pour les données personnelles
interface UserSanction {
  id: string;
  membre_id: string;
  type_sanction_id: string;
  contexte_sanction: string;
  date_sanction: string;
  montant: number;
  montant_paye: number;
  motif: string;
  statut: string;
  created_at: string;
}

interface UserPret {
  id: string;
  membre_id: string;
  montant: number;
  montant_paye: number;
  capital_paye: number;
  interet_paye: number;
  statut: string;
  date_pret: string;
  echeance: string;
  notes: string | null;
  created_at: string;
}

interface UserEpargne {
  id: string;
  membre_id: string;
  montant: number;
  date_depot: string;
  statut: string;
  notes: string | null;
  reunion_id: string | null;
  created_at: string;
}

interface UserPresence {
  id: string;
  membre_id: string;
  reunion_id: string;
  present: boolean;
  statut_presence: string | null;
  notes: string | null;
  created_at: string;
  reunion?: {
    id: string;
    date_reunion: string;
    lieu_description: string | null;
    statut: string;
    type_reunion: string | null;
  };
}

interface UserAide {
  id: string;
  beneficiaire_id: string;
  type_aide_id: string;
  montant: number;
  date_allocation: string;
  contexte_aide: string;
  statut: string;
  notes: string | null;
  type?: {
    nom: string;
    description: string | null;
  };
}

// Hook pour récupérer les sanctions de l'utilisateur
export const useUserSanctions = () => {
  const { data: membre } = useUserMemberId();

  return useQuery({
    queryKey: ['user-sanctions', membre?.id],
    queryFn: async (): Promise<UserSanction[]> => {
      if (!membre?.id) return [];

      const { data, error } = await supabase
        .from('sanctions')
        .select('*')
        .eq('membre_id', membre.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as UserSanction[];
    },
    enabled: !!membre?.id,
  });
};

// Hook pour récupérer les prêts de l'utilisateur
export const useUserPrets = () => {
  const { data: membre } = useUserMemberId();

  return useQuery({
    queryKey: ['user-prets', membre?.id],
    queryFn: async (): Promise<UserPret[]> => {
      if (!membre?.id) return [];

      const { data, error } = await supabase
        .from('prets')
        .select('*')
        .eq('membre_id', membre.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as UserPret[];
    },
    enabled: !!membre?.id,
  });
};

// Hook pour récupérer les épargnes de l'utilisateur
export const useUserEpargnes = () => {
  const { data: membre } = useUserMemberId();

  return useQuery({
    queryKey: ['user-epargnes', membre?.id],
    queryFn: async (): Promise<UserEpargne[]> => {
      if (!membre?.id) return [];

      const { data, error } = await supabase
        .from('epargnes')
        .select('*')
        .eq('membre_id', membre.id)
        .order('date_depot', { ascending: false });

      if (error) throw error;
      return (data || []) as UserEpargne[];
    },
    enabled: !!membre?.id,
  });
};

// Hook pour récupérer l'historique des présences de l'utilisateur
export const useUserPresences = () => {
  const { data: membre } = useUserMemberId();

  return useQuery({
    queryKey: ['user-presences', membre?.id],
    queryFn: async (): Promise<UserPresence[]> => {
      if (!membre?.id) return [];

      const { data, error } = await supabase
        .from('reunions_presences')
        .select(`
          id,
          membre_id,
          reunion_id,
          present,
          statut_presence,
          notes,
          created_at,
          reunion:reunions(id, date_reunion, lieu_description, statut, type_reunion)
        `)
        .eq('membre_id', membre.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as unknown as UserPresence[];
    },
    enabled: !!membre?.id,
  });
};

// Hook pour récupérer les aides reçues par l'utilisateur
export const useUserAides = () => {
  const { data: membre } = useUserMemberId();

  return useQuery({
    queryKey: ['user-aides', membre?.id],
    queryFn: async (): Promise<UserAide[]> => {
      if (!membre?.id) return [];

      const { data, error } = await supabase
        .from('aides')
        .select(`
          id,
          beneficiaire_id,
          type_aide_id,
          montant,
          date_allocation,
          contexte_aide,
          statut,
          notes,
          type:aides_types(nom, description)
        `)
        .eq('beneficiaire_id', membre.id)
        .order('date_allocation', { ascending: false });

      if (error) throw error;
      return (data || []) as unknown as UserAide[];
    },
    enabled: !!membre?.id,
  });
};

// Hook pour récupérer un résumé personnel complet
export const usePersonalSummary = () => {
  const { data: membre, isLoading: membreLoading } = useUserMemberId();
  const { data: epargnes = [], isLoading: epargnesLoading } = useUserEpargnes();
  const { data: sanctions = [], isLoading: sanctionsLoading } = useUserSanctions();
  const { data: prets = [], isLoading: pretsLoading } = useUserPrets();
  const { data: presences = [], isLoading: presencesLoading } = useUserPresences();
  const { data: aides = [], isLoading: aidesLoading } = useUserAides();

  const isLoading = membreLoading || epargnesLoading || sanctionsLoading || pretsLoading || presencesLoading || aidesLoading;

  // Calculs
  const totalEpargnes = epargnes.reduce((sum, e) => sum + (e.montant || 0), 0);
  const sanctionsImpayees = sanctions.filter(s => s.statut !== 'payee').length;
  const totalSanctionsImpayees = sanctions
    .filter(s => s.statut !== 'payee')
    .reduce((sum, s) => sum + ((s.montant || 0) - (s.montant_paye || 0)), 0);
  const pretsEnCours = prets.filter(p => p.statut === 'en_cours' || p.statut === 'approuve').length;
  const totalPretsEnCours = prets
    .filter(p => p.statut === 'en_cours' || p.statut === 'approuve')
    .reduce((sum, p) => sum + ((p.montant || 0) - (p.montant_paye || 0)), 0);
  const presentsCount = presences.filter(p => p.present).length;
  const tauxPresence = presences.length > 0 ? Math.round((presentsCount / presences.length) * 100) : 0;
  const totalAidesRecues = aides.reduce((sum, a) => sum + (a.montant || 0), 0);

  return {
    membre,
    isLoading,
    summary: {
      totalEpargnes,
      sanctionsImpayees,
      totalSanctionsImpayees,
      pretsEnCours,
      totalPretsEnCours,
      presentsCount,
      totalPresences: presences.length,
      tauxPresence,
      totalAidesRecues,
      aidesCount: aides.length,
    }
  };
};
