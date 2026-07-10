# Suivi du plan directeur — E2D → Plateforme SaaS Multi-Associations

## Tableau récapitulatif

| # | Phase | Effort | État |
|---|---|---|---|
| 1 | Stabilisation & correctifs bloquants | 3-5 j | ✅ Terminée |
| 2 | Fondations Multi-Tenant | 8-12 j | ✅ Terminée |
| 3 | RBAC granulaire & audit complet | 4-6 j | ✅ Terminée |
| **4** | **Domain Services & FinancialEngine** | **10-15 j** | ✅ **Terminée** |
| 5 | Prêts, Aides & Bénéficiaires — cohérence métier | 6-8 j | ⏳ À faire |
| 6 | i18n, thèmes & personnalisation par association | 5-7 j | ⏳ À faire |
| 7 | Observabilité, sauvegardes, tests | 4-6 j | ⏳ À faire |
| 8 | Industrialisation & documentation | 3-4 j | ⏳ À faire |

## Phase 4 — Sous-phases

| # | Sous-phase | État |
|---|---|---|
| 4.1 | Cartographie du domaine finance (`docs/FINANCE_DOMAIN_MAP.md`) | ✅ Terminée |
| 4.2 | FinancialEngine SQL : `record_caisse_movement()` + `get_solde_empruntable()` | ✅ Terminée |
| 4.3 | Services TypeScript `src/domain/finance/` (Caisse, Loan, Cotisation, Aide, Epargne, Sanction, Beneficiaire) | ✅ Terminée |
| 4.4 | Triggers SQL réécrits pour déléguer à `record_caisse_movement`, hooks caisse basculés, `useCaisseSoldeSnapshot` disponible | ✅ Terminée |
| 4.5 | Vue matérialisée `caisse_soldes_snapshot` + RPC `get_caisse_solde_snapshot` / `refresh_caisse_soldes_snapshot` | ✅ Terminée |
| 4.6 | Tests Vitest domaine finance + `docs/FINANCIAL_ENGINE.md` + `mem://architecture/finance/financial-engine` | ✅ Terminée |

## Livrables Phase 4.4/4.6

- **Migration SQL** : `record_caisse_movement` étendue avec `p_operateur_id` (auth optionnelle pour triggers). Réécriture de `create_caisse_operation_from_source`, `sync_sanction_to_caisse`, `sync_reunion_beneficiaire_to_caisse` — comportement observable identique, idempotence garantie.
- **Frontend** : `useCreateCaisseOperation` déclenche un `refreshSnapshot()` best-effort ; nouveau hook `useCaisseSoldeSnapshot()` prêt à consommer.
- **Tests** : `src/domain/finance/CaisseService.test.ts` (mapping RPC, validations, snapshot, erreurs).
- **Documentation** : `docs/FINANCIAL_ENGINE.md` (architecture + guide de migration) ; `mem://architecture/finance/financial-engine`.

## Prochaine action

Démarrer la **Phase 5** — cohérence métier Prêts / Aides / Bénéficiaires (validation croisée, workflow unifié, ergonomie des reconductions).
