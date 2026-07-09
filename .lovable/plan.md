# Suivi du plan directeur — E2D → Plateforme SaaS Multi-Associations

## Tableau récapitulatif

| # | Phase | Effort | État |
|---|---|---|---|
| 1 | Stabilisation & correctifs bloquants | 3-5 j | ✅ Terminée |
| 2 | Fondations Multi-Tenant | 8-12 j | ✅ Terminée |
| **3** | **RBAC granulaire & audit complet** | **4-6 j** | ✅ **Terminée** |
| 4 | Domain Services & FinancialEngine | 10-15 j | 🚧 En cours (4.1 & 4.2 ✅) |
| 5 | Prêts, Aides & Bénéficiaires — cohérence métier | 6-8 j | ⏳ À faire |
| 6 | i18n, thèmes & personnalisation par association | 5-7 j | ⏳ À faire |
| 7 | Observabilité, sauvegardes, tests | 4-6 j | ⏳ À faire |
| 8 | Industrialisation & documentation | 3-4 j | ⏳ À faire |

## Phase 3 — Sous-phases

| # | Sous-phase | État |
|---|---|---|
| 3.1 | `current_tenant_id()` + `has_permission()` tenant-aware + `has_permission_in()` | ✅ Terminée |
| 3.2 | Backfill `role_permissions` scope=association + clonage dans `provision-association` | ✅ Terminée |
| 3.3 | Trigger `audit_logs.association_id` fallback + helper `log_audit()` | ✅ Terminée |
| 3.4 | RPC `set_current_association()` + intégration `AssociationContext` | ✅ Terminée |
| 3.5 | Filtre association dans `PermissionsAdmin` | ✅ Terminée |
| 3.6 | Documentation (plan, changelog, mémoire) | ✅ Terminée |

## Phase 4 — Sous-phases

| # | Sous-phase | État |
|---|---|---|
| 4.1 | Cartographie du domaine finance (`docs/FINANCE_DOMAIN_MAP.md`) | ✅ Terminée |
| 4.2 | FinancialEngine SQL : `record_caisse_movement()` + `get_solde_empruntable()` | ✅ Terminée |
| 4.3 | Services TypeScript `src/domain/finance/` (LoanService, CotisationService, AideService, EpargneService, SanctionService, BeneficiaireService) | ⏳ À faire |
| 4.4 | Migration progressive des hooks + réécriture interne des triggers pour appeler la RPC | ⏳ À faire |
| 4.5 | Vue matérialisée `caisse_soldes_snapshot` | ⏳ À faire |
| 4.6 | Tests Vitest domaine finance + `docs/FINANCIAL_ENGINE.md` + `mem://` | ⏳ À faire |

## Prochaine action

Démarrer la **sous-phase 4.3** : création des services TypeScript sous `src/domain/finance/`, en commençant par `LoanService` (règles d'intérêts, statuts, seuil empruntable via la nouvelle RPC).

