import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

import { logger } from "@/lib/logger";

function extractErrorMessage(e: unknown): string {
  if (e instanceof Error && e.message) return e.message;
  if (typeof e === "object" && e !== null && "message" in e) {
    const m = (e as { message?: unknown }).message;
    if (typeof m === "string" && m.length > 0) return m;
  }
  return "Erreur inconnue";
}
export type LoanRequestStatus =
  | "pending"
  | "awaiting_avaliste"
  | "in_progress"
  | "rejected"
  | "rejected_by_avaliste"
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
  capacite_remboursement: string | null;
  garantie: string | null;
  statut: LoanRequestStatus;
  current_step: number;
  motif_rejet: string | null;
  pret_id: string | null;
  created_at: string;
  avaliste_id: string | null;
  avaliste_self: boolean;
  avaliste_statut: "pending" | "approved" | "rejected";
  avaliste_motif_refus: string | null;
  avaliste_validated_at: string | null;
  membres?: { nom: string; prenom: string };
  avaliste?: { nom: string; prenom: string; fonction: string | null } | null;
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
        .select("id, membre_id, montant, description, urgence, duree_mois, capacite_remboursement, garantie, statut, current_step, motif_rejet, pret_id, created_at, avaliste_id, avaliste_self, avaliste_statut, avaliste_motif_refus, avaliste_validated_at, membres:membre_id(nom, prenom), avaliste:membres!avaliste_id(nom, prenom, fonction)")
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
        .select("id, membre_id, montant, description, urgence, duree_mois, capacite_remboursement, garantie, statut, current_step, motif_rejet, pret_id, created_at, avaliste_id, avaliste_self, avaliste_statut, avaliste_motif_refus, avaliste_validated_at, avaliste:membres!avaliste_id(nom, prenom, fonction)")
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
  avaliste_id: string;
  avaliste_self: boolean;
  capacite_remboursement?: string | null;
  garantie?: string | null;
  conditions_acceptees: boolean;
}

async function notifyEvent(payload: {
  request_id: string;
  event:
    | "created"
    | "step_validated"
    | "rejected"
    | "final_approved"
    | "cancelled"
    | "disbursed"
    | "avaliste_request"
    | "avaliste_approved"
    | "avaliste_rejected";
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
        _avaliste_id: input.avaliste_id,
        _avaliste_self: input.avaliste_self,
        _capacite_remboursement: input.capacite_remboursement ?? null,
        _garantie: input.garantie ?? null,
        _conditions_acceptees: input.conditions_acceptees,
      } as never);
      if (error) throw error;
      const requestId = data as unknown as string;
      // If avaliste is a third party, notify them; otherwise notify the workflow steps
      await notifyEvent({
        request_id: requestId,
        event: input.avaliste_self ? "created" : "avaliste_request",
      });
      return requestId;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["loan-requests"] });
      qc.invalidateQueries({ queryKey: ["my-loan-requests"] });
      qc.invalidateQueries({ queryKey: ["avaliste-pending-requests"] });
      toast.success("Demande de prêt envoyée");
    },
    onError: (e: unknown) => {
      const msg = e instanceof Error ? e.message : "Erreur inconnue";
      toast.error(msg);
    },
  });
}

export function useCanSelfAvaliser(membreId: string | null | undefined) {
  return useQuery({
    queryKey: ["can-self-avaliser", membreId],
    enabled: !!membreId,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("can_self_avaliser" as never, {
        _membre_id: membreId,
      } as never);
      if (error) throw error;
      return Boolean(data);
    },
  });
}

export function useAvalistePendingRequests() {
  const qc = useQueryClient();
  useEffect(() => {
    const ch = supabase
      .channel("loan_requests_avaliste")
      .on("postgres_changes", { event: "*", schema: "public", table: "loan_requests" }, () => {
        qc.invalidateQueries({ queryKey: ["avaliste-pending-requests"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [qc]);

  return useQuery({
    queryKey: ["avaliste-pending-requests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("loan_requests" as never)
        .select("id, membre_id, montant, description, urgence, duree_mois, capacite_remboursement, garantie, statut, current_step, motif_rejet, pret_id, created_at, avaliste_id, avaliste_self, avaliste_statut, avaliste_motif_refus, avaliste_validated_at, membres:membre_id(nom, prenom)")
        .eq("statut", "awaiting_avaliste")
        .eq("avaliste_statut", "pending")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as LoanRequest[];
    },
  });
}

export function useAvalisteApprove() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (requestId: string) => {
      const { data, error } = await supabase.rpc("avaliste_approve_loan_request" as never, {
        _request_id: requestId,
      } as never);
      if (error) throw error;
      await notifyEvent({ request_id: requestId, event: "avaliste_approved" });
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["loan-requests"] });
      qc.invalidateQueries({ queryKey: ["my-loan-requests"] });
      qc.invalidateQueries({ queryKey: ["avaliste-pending-requests"] });
      qc.invalidateQueries({ queryKey: ["loan-request-validations"] });
      toast.success("Vous avez validé cette demande en tant qu'avaliste");
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Erreur inconnue"),
  });
}

export function useAvalisteReject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ requestId, motif }: { requestId: string; motif: string }) => {
      const { data, error } = await supabase.rpc("avaliste_reject_loan_request" as never, {
        _request_id: requestId,
        _motif: motif,
      } as never);
      if (error) throw error;
      await notifyEvent({ request_id: requestId, event: "avaliste_rejected", motif });
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["loan-requests"] });
      qc.invalidateQueries({ queryKey: ["my-loan-requests"] });
      qc.invalidateQueries({ queryKey: ["avaliste-pending-requests"] });
      toast.success("Refus enregistré");
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Erreur inconnue"),
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
