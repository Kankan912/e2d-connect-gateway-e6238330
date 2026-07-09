/**
 * LoanService — règles métier prêts (pures).
 *
 * Réutilise `pretCalculsService` (déjà éprouvé) et ajoute la résolution
 * de statut selon la mémoire projet :
 *   Remboursé > En retard > Reconduit > Partiel > En cours
 */
import { calculerResumePret, PretPaiement, PretReconduction } from "@/lib/pretCalculsService";
import { LoanStatut } from "./types";

export interface LoanStatusInput {
  montant: number;
  montantPaye: number;
  echeance?: string | Date | null;
  reconductions?: number;
  annule?: boolean;
  today?: Date;
}

export const LoanService = {
  /** Calcul complet du résumé (capital, intérêts, reste à payer, progression). */
  computeSummary(
    pret: Parameters<typeof calculerResumePret>[0],
    paiements?: PretPaiement[],
    historiqueReconductions?: PretReconduction[],
  ) {
    return calculerResumePret(pret, paiements, historiqueReconductions);
  },

  /**
   * Statut normalisé, ordre de priorité (mémoire projet) :
   *   annule → 'annule'
   *   totalPaye ≥ totalDu → 'rembourse'
   *   echeance dépassée & reste > 0 → 'en_retard'
   *   reconductions > 0 → 'reconduit'
   *   totalPaye > 0 & reste > 0 → 'partiel'
   *   sinon → 'en_cours'
   */
  resolveStatus(input: LoanStatusInput): LoanStatut {
    const today = input.today ?? new Date();
    if (input.annule) return "annule";

    const reste = Math.max(0, input.montant - input.montantPaye);
    if (reste <= 0 && input.montant > 0) return "rembourse";

    if (input.echeance) {
      const dueDate = input.echeance instanceof Date
        ? input.echeance
        : new Date(input.echeance);
      if (dueDate.getTime() < today.getTime() && reste > 0) return "en_retard";
    }

    if ((input.reconductions ?? 0) > 0) return "reconduit";
    if (input.montantPaye > 0 && reste > 0) return "partiel";
    return "en_cours";
  },

  /**
   * Vérifie si un nouveau prêt tient dans le solde empruntable.
   * @param montantDemande montant du prêt sollicité
   * @param soldeEmpruntable retour de CaisseService.getSoldeEmpruntable()
   */
  canDisburse(montantDemande: number, soldeEmpruntable: number): boolean {
    return montantDemande > 0 && montantDemande <= soldeEmpruntable;
  },
};
