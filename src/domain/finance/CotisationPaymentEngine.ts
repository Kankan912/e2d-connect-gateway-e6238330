/**
 * CotisationPaymentEngine — Lot A audit 2026-07.
 *
 * Moteur unique pour calculer le statut d'une cotisation :
 *  - `unpaid`  → rien versé (badge Rouge)
 *  - `partial` → paiement partiel (badge Orange)
 *  - `paid`    → soldée, verrou automatique (badge Vert)
 *
 * Toujours utiliser ce service au lieu de recalculer localement.
 */

export type PaymentStatus = 'unpaid' | 'partial' | 'paid';

export interface PaymentSummary {
  montant_du: number;
  montant_paye: number;
  solde: number;
  status: PaymentStatus;
  verrouille: boolean;
}

export const PAYMENT_STATUS_COLOR: Record<PaymentStatus, 'destructive' | 'warning' | 'success'> = {
  unpaid: 'destructive',
  partial: 'warning',
  paid: 'success',
};

export const PAYMENT_STATUS_LABEL: Record<PaymentStatus, string> = {
  unpaid: 'Non payé',
  partial: 'Paiement partiel',
  paid: 'Soldé',
};

export const CotisationPaymentEngine = {
  compute(montantDu: number, montantPaye: number): PaymentSummary {
    const du = Math.max(0, Number(montantDu) || 0);
    const paye = Math.max(0, Number(montantPaye) || 0);
    const solde = Math.max(0, du - paye);

    let status: PaymentStatus;
    if (paye <= 0) status = 'unpaid';
    else if (paye >= du && du > 0) status = 'paid';
    else status = 'partial';

    return {
      montant_du: du,
      montant_paye: paye,
      solde,
      status,
      verrouille: status === 'paid',
    };
  },

  /**
   * Formule officielle du montant bénéficiaire mensuel :
   *   total_cotisations_mensuelles_membre × nb_mois_exercice
   */
  computeBeneficiaireExpected(totalMensuel: number, nbMoisExercice: number): number {
    const mensuel = Math.max(0, Number(totalMensuel) || 0);
    const mois = Math.max(1, Math.floor(Number(nbMoisExercice) || 12));
    return mensuel * mois;
  },
};
