# Suivi du plan directeur — État des phases

## Réponse directe

**7 phases restantes** sur 8 au total. La Phase 1 est terminée ; nous sommes à l'entrée de la **Phase 2**.

## Tableau récapitulatif

| # | Phase | Effort | État |
|---|---|---|---|
| 1 | Stabilisation & correctifs bloquants | 3-5 j | ✅ Terminée |
| 2 | Fondations Multi-Tenant (association_id, RLS tenant, provisioning) | 8-12 j | 🎯 **À démarrer (prochaine)** |
| 3 | RBAC granulaire & audit complet | 4-6 j | ⏳ À faire |
| 4 | Domain Services & FinancialEngine | 10-15 j | ⏳ À faire |
| 5 | Prêts, Aides & Bénéficiaires — cohérence métier | 6-8 j | ⏳ À faire |
| 6 | i18n, thèmes & personnalisation par association | 5-7 j | ⏳ À faire |
| 7 | Observabilité, sauvegardes, tests | 4-6 j | ⏳ À faire |
| 8 | Industrialisation & documentation | 3-4 j | ⏳ À faire |

## Phase en cours

**Phase 2 — Fondations Multi-Tenant.** À livrer :

- Migration `association_id uuid` sur toutes les tables métier (nullable → backfill vers `associations.e2d` → NOT NULL).
- Enrichissement de la table `associations` (logo, thème, config email, config caisse, locale, feature flags).
- Refonte RLS avec `has_association_access(association_id)` en remplacement / complément de `is_admin()`.
- `AuthContext` : exposition de `currentAssociationId` + sélecteur si l'utilisateur appartient à plusieurs associations.
- Helper `tenantQuery()` injectant automatiquement le filtre tenant.
- Edge function `provision-association` (super_admin uniquement).

Risque régression : **élevé** (backfill + réécriture RLS). Snapshot DB + tests RLS obligatoires avant merge.

## Phases restantes après la 2

- **Phase 3** — RBAC granulaire (`role_permissions.scope`, `super_admin` vs `administrateur`), triggers d'audit sur tables sensibles, page « Journal d'audit », tests RLS cross-tenant.
- **Phase 4** — Réorganisation `src/domains/**`, `FinancialEngine` RPC unique (solde, intérêts, reste à payer, bénéficiaires), `NotificationProvider` unifié.
- **Phase 5** — Workflows prêts/aides/bénéficiaires complets, reconductions, avaliste multi-niveaux, PDF de décision, prorata intérêt.
- **Phase 6** — `react-i18next` (fr/en), thème par association via CSS variables HSL injectées, éditeur admin avec preview.
- **Phase 7** — Logger shipping vers `audit_logs` + Sentry optionnel, dashboard monitoring, sauvegarde SQL quotidienne (30j retention), Vitest ≥60% sur services.
- **Phase 8** — Landing SaaS multi-associations, onboarding self-service, doc opérateur/association, runbook incidents, CI (lint + typecheck + vitest + RLS).

## Convention de suivi

À chaque fin de phase je mettrai ce tableau à jour dans `.lovable/plan.md` et `docs/CHANGELOG.md`, avec la phase suivante marquée « 🎯 » et la phase courante passée à « ✅ ».

## Prochaine action attendue

Valider que la **Phase 2** est bien la prochaine à traiter. Sur ton feu vert, je produis le plan d'implémentation détaillé de la Phase 2 (fichiers touchés, migrations SQL, stratégie de backfill, tests RLS) — pas de code avant ce sous-plan.
