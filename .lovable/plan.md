# Suivi du plan directeur — E2D → Plateforme SaaS Multi-Associations

## Tableau récapitulatif

| # | Phase | Effort | État |
|---|---|---|---|
| 1 | Stabilisation & correctifs bloquants | 3-5 j | ✅ Terminée |
| **2** | **Fondations Multi-Tenant** | **8-12 j** | 🚧 **En cours** |
| 3 | RBAC granulaire & audit complet | 4-6 j | ⏳ À faire |
| 4 | Domain Services & FinancialEngine | 10-15 j | ⏳ À faire |
| 5 | Prêts, Aides & Bénéficiaires — cohérence métier | 6-8 j | ⏳ À faire |
| 6 | i18n, thèmes & personnalisation par association | 5-7 j | ⏳ À faire |
| 7 | Observabilité, sauvegardes, tests | 4-6 j | ⏳ À faire |
| 8 | Industrialisation & documentation | 3-4 j | ⏳ À faire |

## Phase 2 — Sous-phases

| # | Sous-phase | État |
|---|---|---|
| 2.1 | Audit préparatoire (`docs/PHASE2_TENANT_AUDIT.md`) | ✅ Terminée |
| 2.2 | Migrations schéma (7 migrations + correctifs) | ✅ Terminée |
| 2.3 | (fusionnée avec 2.2 : helpers RLS créés en Migration 7) | ✅ Terminée |
| 2.4 | Refonte policies RLS tenant-aware (8 migrations, 7 lots) | ✅ Terminée |
| 2.5 | Frontend : `AssociationContext` + `AssociationSwitcher` + `tenantQuery` | ✅ Terminée |
| 2.6 | Edge function `provision-association` + page admin plateforme | 🎯 **Prochaine** |

## Prochaine action

Démarrer la **Phase 2.6** : edge function `provision-association` (création d'un tenant complet avec settings et rôles par défaut) et page admin plateforme réservée aux super-administrateurs pour créer/gérer les associations.
