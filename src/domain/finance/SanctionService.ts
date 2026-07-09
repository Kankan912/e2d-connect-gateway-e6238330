/**
 * SanctionService — utilitaires purs pour le barème de sanctions.
 * Le barème réel vient de `sanctions_tarifs` ; ce service fournit les helpers
 * de recherche et de calcul du total pour une réunion.
 */

export interface SanctionTarif {
  typeId: string;
  montant: number;
  actif?: boolean;
}

export interface SanctionApplied {
  typeId: string;
  quantite?: number;
}

export const SanctionService = {
  /** Récupère le montant du tarif actif pour un type de sanction. */
  findMontant(tarifs: SanctionTarif[], typeId: string): number {
    const t = tarifs.find((x) => x.typeId === typeId && (x.actif ?? true));
    return t?.montant ?? 0;
  },

  /** Total dû pour une liste de sanctions appliquées. */
  totalReunion(tarifs: SanctionTarif[], appliquees: SanctionApplied[]): number {
    return appliquees.reduce((sum, s) => {
      const qty = s.quantite ?? 1;
      return sum + this.findMontant(tarifs, s.typeId) * qty;
    }, 0);
  },
};
