/**
 * CaisseService — adaptateur Supabase du FinancialEngine (Phase 4.2).
 *
 * Point d'entrée unique côté frontend pour :
 *   - enregistrer un mouvement caisse (`recordMovement`)
 *   - lire le solde empruntable serveur (`getSoldeEmpruntable`)
 *
 * Toute nouvelle écriture doit passer par ce service plutôt que par un INSERT
 * direct dans `fond_caisse_operations`. La RPC serveur garantit :
 *   - validation stricte du type et du montant
 *   - `association_id` = tenant courant (Phase 3)
 *   - idempotence sur (source_table, source_id, type, categorie)
 */
import { supabase } from "@/integrations/supabase/client";
import { CaisseMovementInput, DomainError } from "./types";

export const CaisseService = {
  /**
   * Enregistre un mouvement caisse via la RPC `record_caisse_movement`.
   * @returns UUID de l'opération créée (ou existante si idempotent).
   */
  async recordMovement(input: CaisseMovementInput): Promise<string> {
    if (!input.montant || input.montant <= 0) {
      throw new DomainError("Montant invalide", [
        { field: "montant", message: "Doit être strictement positif" },
      ]);
    }
    if (input.type !== "entree" && input.type !== "sortie") {
      throw new DomainError("Type invalide", [
        { field: "type", message: "Doit être 'entree' ou 'sortie'" },
      ]);
    }

    const { data, error } = await supabase.rpc("record_caisse_movement", {
      p_type: input.type,
      p_montant: input.montant,
      p_categorie: input.categorie,
      p_libelle: input.libelle,
      p_source_table: input.sourceTable ?? null,
      p_source_id: input.sourceId ?? null,
      p_beneficiaire_id: input.beneficiaireId ?? null,
      p_reunion_id: input.reunionId ?? null,
      p_exercice_id: input.exerciceId ?? null,
      p_date_operation: input.dateOperation ?? null,
      p_notes: input.notes ?? null,
      p_justificatif_url: input.justificatifUrl ?? null,
    });

    if (error) {
      throw new DomainError(error.message);
    }
    return data as unknown as string;
  },

  /**
   * Solde empruntable serveur (règle 80 % portée par `get_solde_empruntable`).
   */
  async getSoldeEmpruntable(
    associationId?: string,
    pourcentage = 80,
  ): Promise<number> {
    const { data, error } = await supabase.rpc("get_solde_empruntable", {
      p_association_id: associationId ?? null,
      p_pourcentage: pourcentage,
    });
    if (error) throw new DomainError(error.message);
    return Number(data ?? 0);
  },

  /**
   * Instantané précalculé (vue matérialisée `caisse_soldes_snapshot`).
   * Lecture rapide destinée aux dashboards ; à rafraîchir via
   * `CaisseService.refreshSnapshot()` après un lot de mouvements.
   */
  async getSoldeSnapshot(associationId?: string): Promise<{
    association_id: string;
    total_entrees: number;
    total_sorties: number;
    solde_net: number;
    nb_operations: number;
    derniere_operation: string | null;
    refreshed_at: string;
  } | null> {
    const { data, error } = await supabase.rpc("get_caisse_solde_snapshot", {
      p_association_id: associationId ?? null,
    });
    if (error) throw new DomainError(error.message);
    const row = Array.isArray(data) ? data[0] : data;
    return (row ?? null) as never;
  },

  /**
   * Rafraîchit l'instantané des soldes caisse (CONCURRENTLY quand possible).
   */
  async refreshSnapshot(): Promise<void> {
    const { error } = await supabase.rpc("refresh_caisse_soldes_snapshot");
    if (error) throw new DomainError(error.message);
  },
};

