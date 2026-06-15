import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

import { logger } from "@/lib/logger";
export type LoanRequestStatus =
  | "pending"
  | "in_progress"
  | "rejected"
  | "approved"
  | "disbursed"
  | "cancelled";

export interface LoanRequest {
  id: string;
  membre_id: string;
  montant: number;
  description: string;
  urgence: "normal" | "urgent";
  duree_mois: number;
  capacite_remboursement: string;
  garantie: string | null;
  statut: LoanRequestStatus;
  current_step: number;
  motif_rejet: string | null;
  pret_id: string | null;
  created_at: string;
  membres?: { nom: string; prenom: string };
}

export interface LoanRequestValidation {
  id: string;
  loan_request_id: string;
  role: string;
  label: string;
  ordre: number;
  statut: "pending" | "approved" | "rejected" | "cancelled";
  commentaire: string | null;
  validated_by: string | null;
  validated_at: string | null;
  validator?: { prenom: string | null; nom: string | null } | null;
}

export interface LoanValidationConfigItem {
  id: string;
  role: string;
  label: string;
  ordre: number;
  actif: boolean;
}

// ---------- LIST hooks ----------

export function useLoanRequests() {
  const qc = useQueryClient();

  useEffect(() => {
    const ch = supabase
      .channel("loan_requests_admin")
      .on("postgres_changes", { event: "*", schema: "public", table: "loan_requests" }, () => {
        qc.invalidateQueries({ queryKey: ["loan-requests"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "loan_request_validations" }, () => {
        qc.invalidateQueries({ queryKey: ["loan-requests"] });
        qc.invalidateQueries({ queryKey: ["loan-request"] });
      })
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [qc]);

  return useQuery({
    queryKey: ["loan-requests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("loan_requests" as never)
        .select("id, membre_id, montant, description, urgence, duree_mois, capacite_remboursement, garantie, statut, current_step, motif_rejet, pret_id, created_at, membres:membre_id(nom, prenom)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as LoanRequest[];
    },
  });
}

export function useMyLoanRequests() {
  const qc = useQueryClient();

  useEffect(() => {
    const ch = supabase
      .channel("loan_requests_self")
      .on("postgres_changes", { event: "*", schema: "public", table: "loan_requests" }, () => {
        qc.invalidateQueries({ queryKey: ["my-loan-requests"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "loan_request_validations" }, () => {
        qc.invalidateQueries({ queryKey: ["my-loan-requests"] });
        qc.invalidateQueries({ queryKey: ["loan-request-validations"] });
      })
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [qc]);

  return useQuery({
    queryKey: ["my-loan-requests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("loan_requests" as never)
        .select("id, membre_id, montant, description, urgence, duree_mois, capacite_remboursement, garantie, statut, current_step, motif_rejet, pret_id, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as LoanRequest[];
    },
  });
}

export function useLoanRequestValidations(requestId: string | undefined) {
  return useQuery({
    queryKey: ["loan-request-validations", requestId],
    enabled: !!requestId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("loan_request_validations" as never)
        .select("id, loan_request_id, role, label, ordre, statut, commentaire, validated_by, validated_at")
        .eq("loan_request_id", requestId!)
        .order("ordre", { ascending: true });
      if (error) throw error;
      const rows = (data ?? []) as unknown as LoanRequestValidation[];

      // Pas de FK déclarée vers profiles → fetch séparé puis fusion côté client
      const ids = Array.from(
        new Set(rows.map((r) => r.validated_by).filter((v): v is string => !!v))
      );
      if (ids.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, prenom, nom")
          .in("id", ids);
        const byId = new Map(
          ((profiles ?? []) as Array<{ id: string; prenom: string | null; nom: string | null }>)
            .map((p) => [p.id, { prenom: p.prenom, nom: p.nom }])
        );
        for (const r of rows) {
          r.validator = r.validated_by ? byId.get(r.validated_by) ?? null : null;
        }
      }
      return rows;
    },
  });
}

export function useDefaultLoanRate() {
  return useQuery({
    queryKey: ["caisse-config-taux-defaut"],
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("caisse_config")
        .select("taux_interet_defaut")
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return Number((data as { taux_interet_defaut?: number } | null)?.taux_interet_defaut ?? 5);
    },
  });
}

export function useCancelLoanRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (requestId: string) => {
      const { data, error } = await supabase.rpc("cancel_loan_request" as never, {
        _request_id: requestId,
      } as never);
      if (error) throw error;
      await notifyEvent({ request_id: requestId, event: "cancelled" });
      return data as unknown as { success: boolean; request_id: string };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["loan-requests"] });
      qc.invalidateQueries({ queryKey: ["my-loan-requests"] });
      qc.invalidateQueries({ queryKey: ["loan-request-validations"] });
      toast.success("Demande annulée");
    },
    onError: (e: unknown) => {
      const msg = e instanceof Error ? e.message : "Erreur inconnue";
      toast.error(msg);
    },
  });
}

export function useLoanValidationConfig() {
  return useQuery({
    queryKey: ["loan-validation-config"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("loan_validation_config" as never)
        .select("id, role, label, ordre, actif")
        .order("ordre", { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as LoanValidationConfigItem[];
    },
  });
}

// ---------- MUTATIONS ----------

export interface CreateLoanRequestInput {
  montant: number;
  description: string;
  urgence: "normal" | "urgent";
  duree_mois: number;
  capacite_remboursement: string;
  garantie?: string | null;
  conditions_acceptees: boolean;
}

async function notifyEvent(payload: {
  request_id: string;
  event: "created" | "step_validated" | "rejected" | "final_approved" | "cancelled" | "disbursed";
  step_label?: string;
  validator_name?: string;
  motif?: string;
}) {
  try {
    await supabase.functions.invoke("send-loan-notification", { body: payload });
  } catch (e: unknown) {
    logger.warn("Notification email échouée (non bloquant):", e);
  }
}

export function useCreateLoanRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateLoanRequestInput) => {
      const { data, error } = await supabase.rpc("create_loan_request" as never, {
        _montant: input.montant,
        _description: input.description,
        _urgence: input.urgence,
        _duree_mois: input.duree_mois,
        _capacite_remboursement: input.capacite_remboursement,
        _garantie: input.garantie ?? null,
        _conditions_acceptees: input.conditions_acceptees,
      } as never);
      if (error) throw error;
      const requestId = data as unknown as string;
      await notifyEvent({ request_id: requestId, event: "created" });
      return requestId;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["loan-requests"] });
      qc.invalidateQueries({ queryKey: ["my-loan-requests"] });
      toast.success("Demande de prêt envoyée");
    },
    onError: (e: unknown) => {
      const msg = e instanceof Error ? e.message : "Erreur inconnue";
      toast.error(msg);
    },
  });
}

export function useValidateLoanStep() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ requestId, commentaire }: { requestId: string; commentaire?: string }) => {
      const { data, error } = await supabase.rpc("validate_loan_step" as never, {
        _request_id: requestId,
        _commentaire: commentaire ?? null,
      } as never);
      if (error) throw error;
      const result = data as unknown as { success: boolean; step_label: string; is_final: boolean };
      await notifyEvent({
        request_id: requestId,
        event: result.is_final ? "final_approved" : "step_validated",
        step_label: result.step_label,
      });
      return result;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["loan-requests"] });
      qc.invalidateQueries({ queryKey: ["my-loan-requests"] });
      qc.invalidateQueries({ queryKey: ["loan-request-validations"] });
      toast.success("Étape validée");
    },
    onError: (e: unknown) => {
      const msg = e instanceof Error ? e.message : "Erreur inconnue";
      toast.error(msg);
    },
  });
}

export function useRejectLoanStep() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ requestId, motif }: { requestId: string; motif: string }) => {
      const { data, error } = await supabase.rpc("reject_loan_step" as never, {
        _request_id: requestId,
        _motif: motif,
      } as never);
      if (error) throw error;
      const result = data as unknown as { success: boolean; step_label: string; motif: string };
      await notifyEvent({
        request_id: requestId,
        event: "rejected",
        step_label: result.step_label,
        motif: result.motif,
      });
      return result;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["loan-requests"] });
      qc.invalidateQueries({ queryKey: ["my-loan-requests"] });
      qc.invalidateQueries({ queryKey: ["loan-request-validations"] });
      toast.success("Demande rejetée");
    },
    onError: (e: unknown) => {
      const msg = e instanceof Error ? e.message : "Erreur inconnue";
      toast.error(msg);
    },
  });
}

export function useDisburseLoan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (requestId: string) => {
      const { data, error } = await supabase.rpc("disburse_loan" as never, {
        _request_id: requestId,
      } as never);
      if (error) throw error;
      await notifyEvent({ request_id: requestId, event: "disbursed" });
      return data as unknown as { success: boolean; pret_id: string };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["loan-requests"] });
      qc.invalidateQueries({ queryKey: ["my-loan-requests"] });
      qc.invalidateQueries({ queryKey: ["prets"] });
      qc.invalidateQueries({ queryKey: ["user-prets"] });
      qc.invalidateQueries({ queryKey: ["prets-en-retard"] });
      qc.invalidateQueries({ queryKey: ["prets-en-retard-count"] });
      qc.invalidateQueries({ queryKey: ["caisse-operations"] });
      qc.invalidateQueries({ queryKey: ["caisse-stats"] });
      qc.invalidateQueries({ queryKey: ["caisse-synthese"] });
      qc.invalidateQueries({ queryKey: ["caisse-config-alertes"] });
      toast.success("Prêt décaissé et créé");
    },
    onError: (e: unknown) => {
      const msg = e instanceof Error ? e.message : "Erreur inconnue";
      toast.error(msg);
    },
  });
}

export function useUpdateLoanValidationConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (items: Array<{ id: string; ordre: number; actif: boolean; label?: string }>) => {
      // Update each item individually
      for (const item of items) {
        const patch: Record<string, unknown> = { ordre: item.ordre, actif: item.actif };
        if (item.label !== undefined) patch.label = item.label;
        const { error } = await supabase
          .from("loan_validation_config" as never)
          .update(patch as never)
          .eq("id", item.id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["loan-validation-config"] });
      toast.success("Configuration mise à jour");
    },
    onError: (e: unknown) => {
      const msg = e instanceof Error ? e.message : "Erreur inconnue";
      toast.error(msg);
    },
  });
}
