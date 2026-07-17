# Plan — Exécution Lots 3, 4 et 5 (audit 2026-07)

Référence : `docs/AUDIT_COMPLET_2026_07.md`, `.lovable/plan.md`, `docs/AUDIT_CORRECTIONS_2026_07.md`.
Objectif : atteindre ≥ 90/100 en exécutant les 3 lots restants, avec contrôles anti-régression après chaque lot.

---

## Lot 3 — Cohérence métier (P1)

1. **Alertes prêts unifiées** — `src/hooks/useAlertesGlobales.ts` : remplacer les calculs ad hoc de retard/reste par `LoanService.resolveStatus` + `calculerResumePret`.
2. **Prorata bénéficiaires** — refactor `BeneficiaireService.calculerDistribution()` en formule pondérée `(montant × jours) / Σ(montants × jours)` via `get_exercice_nb_mois`. Répercussions : `useEpargnantsBenefices`, `pages/admin/Beneficiaires.tsx`, exports PDF bénéficiaires.
3. **Devise multi-tenant** — nouveau hook `useCurrencyFormatter()` qui expose `formatCurrencyForAssociation` avec les tokens de l'asso courante. Codemod ciblé remplaçant `toLocaleString(...) + ' FCFA'` et `formatFCFA` figé dans ~30 pages + 4 exports PDF.
4. **Perf `useUtilisateurs`** — passer les 3 `await` séquentiels en `Promise.all`.
5. **Filtrage exercice → types cotisations** — jointure `exercices_cotisations_types.actif = true` dans le hook concerné.
6. **Tests** :
   - `src/domain/finance/BeneficiaireService.test.ts` (nouveau)
   - extension `pretCalculsService.test.ts` (retard + reconductions)
   - extension `formatCurrencyDynamic.test.ts` (EUR/USD/FCFA)

## Lot 4 — Qualité / DX / Refactoring (P2)

1. **Hook finance unifié** — fusion `useCaisseStats` + `useCaisseSoldeSnapshot` → `useCaisseFinance()`.
2. **Zod sur Edge Functions** — nouveau `supabase/functions/_shared/schemas.ts`, couverture des 18 fonctions restantes (payloads validés, `400` clair).
3. **Bascule CORS whitelist** — remplacer `Access-Control-Allow-Origin: *` par `buildCorsHeaders(req)` dans les ~20 Edge Functions restantes.
4. **`strictNullChecks: true`** dans `tsconfig.json` + corrections du fallout par petits patchs.
5. **ESLint** — réactiver `@typescript-eslint/no-unused-vars: warn`.
6. **Sentry** — intégration `@sentry/react` + `@sentry/vite-plugin`, DSN via env `SENTRY_DSN` (désactivé si absent).
7. **Refactor composants > 400 lignes** :
   - `EmailConfigManager` (928 l.) → `_components/` + hooks dédiés
   - `ClotureReunionModal` (720 l.)
   - `PretsAdmin` (673 l.)
8. **Retrait bypass admin front** (`usePermissions.ts:18,21`) + migration seed permissions rôle `administrateur`.
9. **A11y** — `aria-label` sur boutons icon-only, `aria-hidden` sur icônes décoratives Lucide.
10. **Design tokens** — remplacer `text-white`, `bg-black/50`, `bg-green-500`, hex hardcodés par tokens sémantiques (`--overlay`, `--success` ajoutés dans `src/index.css` si absents).
11. **Tests UI** — Testing Library sur `useAuth`, `usePermissions`, `useSessionManager`, formulaires Zod critiques.

## Lot 5 — Nettoyage / performance fine (P3)

1. Suppression code mort après vérif imports : `Breadcrumbs.tsx`, `MediaLibrary.tsx`, `PretsAlertes.tsx`.
2. `useAdhesions`, `useLoanStatus` — brancher réellement ou supprimer selon consommateurs.
3. `LoanRequestsRealtimeProvider` singleton (empêche multi-souscriptions).
4. `<Route path="*">` local dans `Dashboard.tsx` + `DashboardNotFound.tsx`.
5. `vite.config.ts` — `manualChunks` pour `radix`, `recharts`, `jspdf`.
6. Vérification finale : `supabase--linter`, `bun run build`, `bunx vitest run`, checklist §18 audit (17 scénarios).

---

## Nouveaux fichiers attendus

- `src/hooks/useCurrencyFormatter.ts`
- `src/hooks/useCaisseFinance.ts`
- `supabase/functions/_shared/schemas.ts`
- `src/providers/LoanRequestsRealtimeProvider.tsx`
- `src/pages/dashboard/DashboardNotFound.tsx`
- Migrations SQL : seed permissions admin (Lot 4)
- Tests : `BeneficiaireService.test.ts`, extensions `pretCalculsService`, `formatCurrencyDynamic`, tests hooks Lot 4

## Nouveaux secrets

- `SENTRY_DSN` (Lot 4, optionnel — activé uniquement si fourni)

## Contrôles anti-régression après CHAQUE lot

- `bun run build`
- `bunx vitest run`
- `supabase--linter` (pas de nouveau finding)
- Vérif rôles (super_admin, administrateur, président, trésorier, commissaire, secrétaire, membre, invité)
- Vérif multi-tenant : switch `set_current_association` + isolation
- MAJ `docs/CHANGELOG.md` + `docs/AUDIT_CORRECTIONS_2026_07.md` + `mem://audits/complete-2026-07`

## Livrables finaux

- `docs/AUDIT_CORRECTIONS_2026_07.md` complété Lots 3-5
- 30/30 correctifs `Fait` dans `docs/AUDIT_COMPLET_2026_07.md` §19
- Note cible ≥ 90/100

## Volontairement hors périmètre

- Upgrades majeures (React 19, Vite 6, RRD 7, date-fns 4) — projet dédié
- Refonte structurelle `useSessionManager` — couverte par tests seulement
- Sentry actif en prod sans DSN fourni

**Durée estimée : 4-5 jours consolidés, exécution continue sans revue intermédiaire (comme demandé pour Lots 2+).**
