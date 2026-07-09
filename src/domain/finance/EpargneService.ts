/**
 * EpargneService — calcul des bénéfices annuels sur l'épargne.
 *
 * Règle simple, alignée sur `useEpargnantsBenefices` :
 *   benefice = totalEpargne × (tauxAnnuel / 100)
 * Le taux est stocké au niveau de l'exercice (`exercices.taux_interet_prets`
 * ou table de config dédiée) — passé en paramètre pour rester pur.
 */

export const EpargneService = {
  computeBenefice(totalEpargne: number, tauxAnnuelPct: number): number {
    if (totalEpargne <= 0 || tauxAnnuelPct <= 0) return 0;
    return Math.floor((totalEpargne * tauxAnnuelPct) / 100);
  },

  /** Ventilation d'un bénéfice global au prorata des épargnes individuelles. */
  distributeProrata(
    beneficeTotal: number,
    parts: { membreId: string; montant: number }[],
  ): { membreId: string; part: number }[] {
    const somme = parts.reduce((s, p) => s + Math.max(0, p.montant), 0);
    if (somme <= 0 || beneficeTotal <= 0) {
      return parts.map((p) => ({ membreId: p.membreId, part: 0 }));
    }
    return parts.map((p) => ({
      membreId: p.membreId,
      part: Math.floor((Math.max(0, p.montant) / somme) * beneficeTotal),
    }));
  },
};
