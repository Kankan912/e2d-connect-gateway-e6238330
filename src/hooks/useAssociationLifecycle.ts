import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";
import type { AssociationStatut } from "@/components/associations/AssociationStatusBadge";

type RpcClient = {
  rpc: (fn: string, args?: Record<string, unknown>) => Promise<{ data: unknown; error: unknown }>;
};

const rpc = supabase as unknown as RpcClient;

const errorMessage = (error: unknown, fallback: string) =>
  error instanceof Error && error.message ? error.message : fallback;

export interface StatutMutationInput {
  id: string;
  statut: AssociationStatut;
  motif?: string | null;
  successMessage: string;
}

/**
 * Actions de cycle de vie d'une association.
 * Toutes les écritures passent par des RPC `SECURITY DEFINER` : contrôle des
 * droits côté serveur + journalisation d'audit garantie.
 */
export function useAssociationLifecycle(queryKey: unknown[] = ["platform-associations"]) {
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey });
    qc.invalidateQueries({ queryKey: ["associations"] });
  };

  const setStatut = useMutation({
    mutationFn: async ({ id, statut, motif }: StatutMutationInput) => {
      const { data, error } = await rpc.rpc("set_association_statut", {
        _association_id: id,
        _statut: statut,
        _motif: motif ?? null,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (_data, variables) => {
      toast.success(variables.successMessage);
      invalidate();
    },
    onError: (error: unknown) => {
      logger.error("[Association] changement de statut échoué:", error);
      toast.error(
        errorMessage(error, "Une erreur est survenue. Veuillez réessayer ou contacter l'administrateur.")
      );
    },
  });

  const hardDelete = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await rpc.rpc("hard_delete_association", { _association_id: id });
      if (error) throw error;
      return data as { success: boolean; dependances?: Record<string, number> };
    },
    onSuccess: (result) => {
      if (result?.success) {
        toast.success("Association supprimée définitivement");
      } else {
        const deps = Object.entries(result?.dependances ?? {})
          .map(([table, count]) => `${table} (${count})`)
          .join(", ");
        toast.error(`Suppression définitive impossible : données liées existantes — ${deps}`);
      }
      invalidate();
    },
    onError: (error: unknown) => {
      logger.error("[Association] suppression définitive échouée:", error);
      toast.error(
        errorMessage(error, "Une erreur est survenue. Veuillez réessayer ou contacter l'administrateur.")
      );
    },
  });

  const loadDependencies = async (id: string) => {
    const { data, error } = await rpc.rpc("count_association_dependencies", { _association_id: id });
    if (error) throw error;
    return (data ?? {}) as Record<string, number>;
  };

  return { setStatut, hardDelete, loadDependencies };
}
