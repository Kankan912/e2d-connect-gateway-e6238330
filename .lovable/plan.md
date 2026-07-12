# Suivi du plan directeur — E2D → Plateforme SaaS Multi-Associations

## Tableau récapitulatif

| # | Phase | Effort | État |
|---|---|---|---|
| 1 | Stabilisation & correctifs bloquants | 3-5 j | ✅ Terminée |
| 2 | Fondations Multi-Tenant | 8-12 j | ✅ Terminée |
| 3 | RBAC granulaire & audit complet | 4-6 j | ✅ Terminée |
| 4 | Domain Services & FinancialEngine | 10-15 j | ✅ Terminée |
| **5** | **Prêts, Aides & Bénéficiaires — cohérence métier** | **6-8 j** | ✅ **Terminée** |
| 6 | i18n, thèmes & personnalisation par association | 5-7 j | ⏳ À faire |
| 7 | Observabilité, sauvegardes, tests | 4-6 j | ⏳ À faire |
| 8 | Industrialisation & documentation | 3-4 j | ⏳ À faire |

## Phase 5 — Sous-phases

| # | Sous-phase | État |
|---|---|---|
| 5.1 | Audit croisé (`docs/AUDIT_PHASE5_METIER.md`) | ✅ Terminée |
| 5.2 | Statuts prêts unifiés via `LoanService.resolveStatus` + `<StatutBadge>` + `useLoanStatus` | ✅ Terminée |
| 5.3 | Workflow Aides verrouillé (`AideService.advanceWorkflow` + `useAdvanceAideWorkflow`) | ✅ Terminée |
| 5.4 | Bénéficiaires — source unique confirmée (`BeneficiaireService.computeMontantAnnuelNet`) | ✅ Terminée |
| 5.5 | Reconductions — preview + `AlertDialog` de confirmation | ✅ Terminée |
| 5.6 | Nettoyage `calcSoldeEmpruntable` client (déjà éliminé, documenté) | ✅ Terminée |
| 5.7 | Tests Vitest + `mem://modules/phase5-coherence-metier` + changelog | ✅ Terminée |

## Livrables Phase 5

- `docs/AUDIT_PHASE5_METIER.md` — cartographie des divergences résolues.
- `src/components/prets/StatutBadge.tsx` — badge de statut unifié.
- `src/hooks/useLoanStatus.ts` — résolution mémoïsée.
- `src/domain/finance/AideService.ts` — méthode `advanceWorkflow` + garde-fous.
- `src/domain/finance/AideService.test.ts` — 6 tests transitions.
- `src/hooks/useAides.ts` — hook `useAdvanceAideWorkflow`.
- `src/pages/admin/_components/ReconductionsAttenteList.tsx` — UX enrichie.
- `src/pages/admin/PretsAdmin.tsx` — délégation à `LoanService`.

## Prochaine action

Démarrer la **Phase 6** — i18n, thèmes et personnalisation par association.
