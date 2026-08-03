## État d'exécution — vérifié dans le code

### Phases (refonte plateforme)
| Phase | Objet | État |
|---|---|---|
| 2.4 | RLS tenant-aware (`current_association_id`, `_apply_tenant_rls`) | Terminé |
| 2.5 | Frontend multi-tenant (`AssociationContext`, `AssociationSwitcher`, `tenantQuery`) | Terminé |
| 2.6 | Provisioning (`provision-association`, `SuperAdminRoute`, admin plateforme) | Terminé |
| 3 | RBAC granulaire + audit (`current_tenant_id`, `has_permission`, `log_audit`) | Terminé |
| 4 | FinancialEngine (`record_caisse_movement`, `reverse_caisse_movement`, services TS, snapshot soldes) | Terminé |
| 5 | Prêts / Aides / Bénéficiaires (statuts unifiés, workflows) | Terminé |
| 6 | i18n & thèmes (i18next FR/EN, theme_tokens, branding) | Terminé côté socle, **non propagé** (devise) |

### Lots (audit 2026-07)
| Lot | Objet | État |
|---|---|---|
| 1 | P0 sécurité (Edge Functions, annulation caisse) | Terminé |
| 2 | CI + CSP/HSTS + CORS partagés | Terminé |
| 3–5 | Perf, chunks, 404, code mort, Sentry | Terminé |
| A / A-bis | Moteur cotisations par exercice, verrouillage, écrans | Terminé |
| B / B-bis | RPC bénéficiaires + modales extraites (`src/components/beneficiaires/`) + doc | Terminé |
| C | `get_membre_situation`, page Ma Situation, justificatifs aides | Terminé |
| Q1 | Permissions granulaires (bypass admin retiré, 105 permissions en base) | Terminé |
| P | Unification devise / realtime | **Partiel** — `useMoney()` existe mais 63 fichiers utilisent encore `formatFCFA` (5 seulement la version tenant) |
| Q3 | Découpage des gros composants | **Non fait** — 9 fichiers > 600 lignes |
| Q2 | `strictNullChecks` / `strict` | **Non fait** — `strict:false`, `strictNullChecks:false` |

Correctifs monitoring/sécurité (CSP vidéos, alertes prêts, statut aides, search_path, vue matérialisée, jsPDF) : appliqués.

---

## Plan de finalisation

### Étape 1 — Lot P : unification de la devise (impact utilisateur)
1. Migrer les 63 fichiers `formatFCFA` vers `useMoney()` par domaine : finance (caisse, prêts, cotisations) → aides/bénéficiaires → pages publiques/dashboard.
2. Conserver `formatFCFA` uniquement comme fonction non-React pour les exports PDF, alimentée par le registre de devise global.
3. Audit realtime : un canal partagé par table, cleanup systématique dans `useRealtimeUpdates` / `useSupabaseRealtime`.
4. Mise à jour `docs/I18N_THEMING.md` + `docs/CHANGELOG.md`.

### Étape 2 — Lot Q3 : découpage des composants > 600 lignes
Un fichier par sous-étape, extraction en sous-composants + hook de données, sans changement fonctionnel :
1. `EmailConfigManager.tsx` (928) → onglets provider / SMTP / test.
2. `ClotureReunionModal.tsx` (720) → étapes sanctions / cotisations / récapitulatif.
3. `useSiteContent.ts` (697) → hooks par section de contenu.
4. `PretsAdmin.tsx` (673), `CaisseAdmin.tsx` (636) → tableau + filtres + modales.
5. `CalendrierBeneficiairesManager.tsx` (668), `UtilisateursAdmin.tsx` (661), `MemberDetailSheet.tsx` (625), `CotisationsMensuellesExerciceManager.tsx` (615).

### Étape 3 — Lot Q2 : typage strict (en dernier)
1. Activer `strictNullChecks`, relever la liste d'erreurs via typecheck.
2. Corriger par vagues : `src/domain/finance/*` → hooks → pages, avec gardes (`?.`, `??`) plutôt que `!`.
3. Puis `strict: true` sur `tsconfig.app.json` si le volume restant est tenable.

### Étape 4 — Clôture
- Relancer tests Vitest + scan de sécurité.
- Mettre à jour `docs/AUDIT_CORRECTIONS_2026_07.md` avec la note recalculée et `docs/CHANGELOG.md`.

## Détails techniques
- Aucune migration SQL nouvelle prévue ; travaux exclusivement frontend/typage/documentation.
- Le Lot P est le seul à effet visible immédiat (affichage des montants) : à contrôler en préview sur les écrans caisse, prêts et Ma Situation.
