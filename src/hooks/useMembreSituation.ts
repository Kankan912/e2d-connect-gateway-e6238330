/**
 * @module useMembreSituation
 * Récupère la situation consolidée d'un membre (cotisations, prêts, aides,
 * épargnes, sanctions, paiements bénéficiaires) via la RPC
 * `get_membre_situation`. Lot C.
 */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface MembreSituationTotaux {
  cotisations_payees: number;
  prets_en_cours: number;
  aides_recues: number;
  epargnes_totales: number;
  sanctions_dues: number;
}

export interface MembreSituation {
  membre: {
    id: string;
    nom: string;
    prenom: string;
    email: string | null;
    telephone: string | null;
    statut: string | null;
    fonction: string | null;
  };
  exercice_id: string | null;
  cotisations: Array<Record<string, unknown>>;
  prets: Array<Record<string, unknown>>;
  aides: Array<Record<string, unknown>>;
  epargnes: Array<Record<string, unknown>>;
  sanctions: Array<Record<string, unknown>>;
  beneficiaires_paiements: Array<Record<string, unknown>>;
  totaux: MembreSituationTotaux;
}

export function useMembreSituation(membreId: string | null | undefined, exerciceId?: string | null) {
  return useQuery({
    queryKey: ["membre-situation", membreId, exerciceId ?? null],
    enabled: !!membreId,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_membre_situation" as never, {
        p_membre_id: membreId,
        p_exercice_id: exerciceId ?? null,
      } as never);
      if (error) throw error;
      return data as unknown as MembreSituation;
    },
  });
}
