/**
 * CotisationService — règles métier cotisations (pures).
 *
 * Encapsule la résolution du montant mensuel selon la mémoire projet :
 *   1. Priorité à `cotisations_mensuelles_exercice` (actif && montant > 0)
 *   2. Fallback sur `cotisations_types.montant_defaut` (obligatoire)
 *   3. Défaut 0
 *
 * Et le filtrage des types disponibles pour un exercice via
 * `exercices_cotisations_types.actif = true`.
 */

export interface CotisationMensuelleExerciceEntry {
  montant: number;
  actif: boolean;
}

export interface CotisationTypeEntry {
  id: string;
  nom: string;
  actif: boolean;
  montantDefaut?: number | null;
}

export const CotisationService = {
  /** Résout le montant de cotisation mensuelle pour un membre/exercice. */
  resolveMontantMensuel(params: {
    override?: CotisationMensuelleExerciceEntry | null;
    typeDefault?: number | null;
  }): number {
    const { override, typeDefault } = params;
    if (override?.actif && override.montant > 0) return override.montant;
    return typeDefault ?? 0;
  },

  /** Ne conserve que les types marqués actifs pour l'exercice courant. */
  filterActiveTypes(types: CotisationTypeEntry[]): CotisationTypeEntry[] {
    return types.filter((t) => t.actif);
  },

  /** Montant brut annuel projeté : 12 × mensuel. */
  projectAnnualBrut(mensuel: number): number {
    return Math.max(0, mensuel) * 12;
  },
};
