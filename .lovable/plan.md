# Suivi du plan directeur — E2D → Plateforme SaaS Multi-Associations

## Tableau récapitulatif

| # | Phase | Effort | État |
|---|---|---|---|
| 1 | Stabilisation & correctifs bloquants | 3-5 j | ✅ Terminée |
| 2 | Fondations Multi-Tenant | 8-12 j | ✅ Terminée |
| **3** | **RBAC granulaire & audit complet** | **4-6 j** | ✅ **Terminée** |
| 4 | Domain Services & FinancialEngine | 10-15 j | ⏳ À faire |
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

## Prochaine action

Démarrer la **Phase 4** : Domain Services & FinancialEngine (extraction des règles métier finance dans des services testables, orchestration centralisée des mouvements de caisse, matérialisation des soldes).
