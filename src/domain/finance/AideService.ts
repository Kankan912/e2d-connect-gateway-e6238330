/**
 * AideService — workflow métier des aides financières (Phase 5.3).
 *
 * Transitions autorisées :
 *   demandee → validee | rejetee
 *   validee  → allouee | rejetee
 *   allouee  → payee   (déclenche l'écriture caisse via trigger existant)
 *   payee    → (terminal)
 *   rejetee  → (terminal)
 *
 * `advanceWorkflow` centralise l'appel serveur — plus aucune page ne doit
 * faire `.update({ statut })` directement sur `aides`. La cascade caisse à
 * `allouee` reste portée côté serveur par le trigger
 * `trg_create_caisse_on_aide_payee` (idempotent via `record_caisse_movement`).
 */
import { supabase } from "@/integrations/supabase/client";
import { AideStatut, DomainError } from "./types";

const TRANSITIONS: Record<AideStatut, AideStatut[]> = {
  demandee: ["validee", "rejetee"],
  validee: ["allouee", "rejetee"],
  allouee: ["payee"],
  payee: [],
  rejetee: [],
};

export interface AdvanceWorkflowInput {
  aideId: string;
  from: AideStatut | string;
  to: AideStatut;
  notes?: string;
}

export const AideService = {
  canTransition(from: AideStatut | string, to: AideStatut): boolean {
    return TRANSITIONS[from as AideStatut]?.includes(to) ?? false;
  },

  nextStatuts(from: AideStatut | string): AideStatut[] {
    return TRANSITIONS[from as AideStatut] ?? [];
  },

  isTerminal(statut: AideStatut | string): boolean {
    return (TRANSITIONS[statut as AideStatut]?.length ?? 0) === 0;
  },

  /**
   * Applique une transition de statut sur une aide.
   * Refuse toute transition non autorisée avec un `DomainError` remontable en toast.
   */
  async advanceWorkflow(input: AdvanceWorkflowInput): Promise<void> {
    if (!AideService.canTransition(input.from, input.to)) {
      throw new DomainError(
        `Transition interdite : ${input.from} → ${input.to}`,
        [{ field: "statut", message: `Transitions autorisées: ${AideService.nextStatuts(input.from).join(", ") || "aucune"}` }],
      );
    }

    // Best-effort via RPC serveur (source de vérité workflow métier).
    // Fallback update direct si la RPC n'est pas exposée pour le rôle appelant.
    const rpcClient = supabase as unknown as {
      rpc: (name: string, args: Record<string, unknown>) => Promise<{ error: { message: string } | null }>;
    };
    const { error: rpcError } = await rpcClient.rpc("avancer_workflow_aide", {
      p_aide_id: input.aideId,
      p_nouveau_statut: input.to,
      p_notes: input.notes ?? null,
    });

    if (rpcError) {
      // Fallback update direct — la cascade caisse est portée par les triggers.
      const { error } = await supabase
        .from("aides")
        .update({ statut: input.to, notes: input.notes ?? undefined })
        .eq("id", input.aideId);
      if (error) throw new DomainError(error.message);
    }
  },
};
