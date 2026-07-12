/**
 * useLoanStatus — résout le statut effectif d'un prêt via LoanService (Phase 5.2).
 *
 * Le calcul est pur (aucun appel réseau) ; les données proviennent déjà
 * des queries React Query en amont (`prets_paiements`, `prets_reconductions`).
 */
import { useMemo } from "react";
import { LoanService } from "@/domain/finance";
import { calculerResumePret, type PretPaiement, type PretReconduction } from "@/lib/pretCalculsService";
import type { LoanStatut } from "@/domain/finance/types";

export interface LoanStatusPret {
  montant: number;
  taux_interet: number;
  interet_initial?: number | null;
  reconductions?: number | null;
  montant_paye?: number | null;
  echeance?: string | null;
  statut?: string | null;
}

export function useLoanStatus(
  pret: LoanStatusPret | null | undefined,
  paiements?: PretPaiement[],
  reconductions?: PretReconduction[],
): LoanStatut {
  return useMemo(() => {
    if (!pret) return "en_cours";
    // Statut brut prioritaire (annulation manuelle)
    if (pret.statut === "annule") return "annule";

    const resume = calculerResumePret(
      {
        montant: pret.montant,
        taux_interet: pret.taux_interet,
        interet_initial: pret.interet_initial ?? undefined,
        reconductions: pret.reconductions ?? 0,
        montant_paye: pret.montant_paye ?? 0,
      },
      paiements ?? [],
      reconductions ?? [],
    );

    return LoanService.resolveStatus({
      montant: resume.totalDu,
      montantPaye: resume.totalPaye,
      echeance: pret.echeance ?? null,
      reconductions: pret.reconductions ?? 0,
      annule: pret.statut === "annule",
    });
  }, [pret, paiements, reconductions]);
}
