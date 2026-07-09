/**
 * BeneficiaireService — calcul du montant net annuel du bénéficiaire.
 *
 * Règle (mémoire projet) :
 *   montantBrut = mensuel × 12
 *   montantNet  = max(0, brut − sanctionsImpayees)
 */

export const BeneficiaireService = {
  computeMontantAnnuelNet(mensuel: number, sanctionsImpayees: number): number {
    const brut = Math.max(0, mensuel) * 12;
    return Math.max(0, brut - Math.max(0, sanctionsImpayees));
  },
};
