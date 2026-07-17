/**
 * BeneficiaireService — calculs bénéficiaires (net annuel + distribution prorata).
 *
 * Règles (mémoire projet) :
 *   - Net annuel : montantBrut = mensuel × 12 ; net = max(0, brut − sanctionsImpayees)
 *   - Distribution prorata temporis :
 *       part(i) = totalDistribuable × (montant(i) × jours(i)) / Σ(montant × jours)
 *     où jours(i) = nombre de jours de présence de l'épargne (i) sur l'exercice.
 */

export interface EpargneProrataInput {
  membreId: string;
  montant: number;
  /** Nombre de jours durant lesquels ce montant a été présent sur l'exercice. */
  jours: number;
}

export interface EpargneProrataResult {
  membreId: string;
  poids: number;
  part: number;
}

export const BeneficiaireService = {
  /** Calcul historique conservé pour compat descendante. */
  computeMontantAnnuelNet(mensuel: number, sanctionsImpayees: number): number {
    const brut = Math.max(0, mensuel) * 12;
    return Math.max(0, brut - Math.max(0, sanctionsImpayees));
  },

  /**
   * Distribution prorata temporis d'un montant total.
   * @param entries    épargnes { membreId, montant, jours }
   * @param totalDistribuable  masse d'intérêts (ou de bénéfices) à répartir
   * @returns tableau { membreId, poids, part } ; somme des `part` ≈ totalDistribuable
   */
  calculerDistribution(
    entries: EpargneProrataInput[],
    totalDistribuable: number,
  ): EpargneProrataResult[] {
    const validated = entries
      .filter((e) => Number(e.montant) > 0 && Number(e.jours) > 0)
      .map((e) => ({
        membreId: e.membreId,
        montant: Number(e.montant),
        jours: Number(e.jours),
      }));

    const totalPoids = validated.reduce(
      (sum, e) => sum + e.montant * e.jours,
      0,
    );

    if (totalPoids <= 0 || totalDistribuable <= 0) {
      return validated.map((e) => ({ membreId: e.membreId, poids: 0, part: 0 }));
    }

    return validated.map((e) => {
      const poids = e.montant * e.jours;
      return {
        membreId: e.membreId,
        poids,
        part: (totalDistribuable * poids) / totalPoids,
      };
    });
  },
};
