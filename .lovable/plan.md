# Plan — CI complet + exécution automatique Lots 2 à 5

Objectif : livrer un pipeline CI robuste (build, typecheck, lint, tests, SAST, secrets scan) puis dérouler les Lots 2 → 5 du plan de remédiation sans revue intermédiaire, avec contrôles anti-régression après chaque lot.

Référence : `.lovable/plan.md`, `docs/AUDIT_COMPLET_2026_07.md`.

---

## Étape 0 — Pipeline CI (préalable à tout le reste)

Nouveau fichier : `.github/workflows/ci.yml`.

Jobs (parallélisés autant que possible, Bun + cache) :

1. **install** — `bun install --frozen-lockfile` (job réutilisé via cache `~/.bun/install/cache` + `node_modules`).
2. **lint** — `bun run lint` (ESLint via `eslint.config.js`).
3. **typecheck** — `bunx tsgo --noEmit` (utilise `tsconfig.json`).
4. **test** — `bunx vitest run` (exclut `src/test/security/rls.test.ts` déjà couvert par `security-rls.yml`).
5. **build** — `bun run build` (Vite production).
6. **sast** — `github/codeql-action` (JavaScript/TypeScript) + `semgrep/semgrep-action` avec ruleset `p/owasp-top-ten` + `p/typescript` + `p/react`.
7. **secrets-scan** — `gitleaks/gitleaks-action` avec config par défaut + `trufflesecurity/trufflehog` en mode filesystem sur le diff PR.
8. **deps-audit** — `bun audit` (non bloquant, uniquement warning si vulnérabilité `high`/`critical`).

Contraintes :
- Déclencheurs : `pull_request` (toutes branches) + `push` sur `main`.
- Concurrence : `cancel-in-progress: true` par PR.
- `permissions: read-all` par défaut, élargi seulement pour CodeQL (`security-events: write`).
- Timeout 15 min par job.
- Étape finale `ci-status` (job récapitulatif) requis pour la branch protection.

Documentation : nouveau `docs/CI_PIPELINE.md` décrivant chaque job, comment reproduire localement, et comment activer la branch protection.

## Lot 2 — Sécurité web & CI (P1)

1. **Headers Vercel** — `vercel.json` : CSP stricte (`default-src 'self'`, autorisations Supabase, Resend, images inline, Google Fonts), HSTS 63072000, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` restrictive.
2. **CORS whitelist** — nouveau `supabase/functions/_shared/cors.ts` lisant `ALLOWED_ORIGINS` (CSV env). Application aux ~20 Edge Functions existantes en remplaçant `Access-Control-Allow-Origin: *`.
3. **RLS audit** — exécuter `supabase--linter`, corriger via migration toute table `public` sans RLS ou avec policy trop large, documenter exceptions dans `docs/RLS_PERMISSIONS.md`.
4. **Deps devDeps** — déplacer `vitest`, `jsdom`, `@testing-library/*`, `@types/*` dans `devDependencies` (`package.json`).
5. **Nouveau secret** : `ALLOWED_ORIGINS` (via `set_secret` avec la valeur `https://*.lovable.app,https://<domaine-prod>`).

## Lot 3 — Cohérence métier (P1)

1. **Alertes prêts** (`src/hooks/useAlertesGlobales.ts`) — remplacer les calculs ad hoc par `LoanService.resolveStatus` + `calculerResumePret`.
2. **Prorata bénéficiaires** — refactor `BeneficiaireService.calculerDistribution()` en `(montant × jours) / Σ(montants × jours)` avec `get_exercice_nb_mois`. Impact `useEpargnantsBenefices`, `Beneficiaires.tsx`, exports PDF.
3. **Devise multi-tenant** — codemod remplaçant `toLocaleString + ' FCFA'` par `formatCurrencyForAssociation()`. Nouveau hook `useCurrencyFormatter()`. ~30 fichiers pages + 4 exports PDF.
4. **Perf `useUtilisateurs`** — 3 `await` séquentiels → `Promise.all`.
5. **Filtre exercice types cotisations** — jointure `exercices_cotisations_types.actif = true`.
6. Tests : nouveau `BeneficiaireService.test.ts`, extension `pretCalculsService.test.ts` et `formatCurrencyDynamic.test.ts`.

## Lot 4 — Qualité / DX / Refactoring (P2)

1. Fusion `useCaisseStats` + `useCaisseSoldeSnapshot` → `useCaisseFinance()`.
2. Zod sur 18 Edge Functions restantes via `_shared/schemas.ts`.
3. `tsconfig.json` : `strictNullChecks: true`, correction du fallout par petits patchs.
4. ESLint : réactiver `@typescript-eslint/no-unused-vars: warn`.
5. Sentry (`@sentry/react` + `@sentry/vite-plugin`) avec DSN via env `SENTRY_DSN` (secret optionnel).
6. Refactor composants > 400 lignes : `EmailConfigManager` (928 l.), `ClotureReunionModal` (720 l.), `PretsAdmin` (673 l.) → extraction en `_components/` + hooks dédiés.
7. Retrait bypass admin front (`usePermissions.ts:18,21`) + migration seed permissions rôle `administrateur`.
8. A11y : `aria-label` sur boutons icon-only, `aria-hidden` sur icônes Lucide décoratives.
9. Design tokens : remplacer `text-white`, `bg-black/50`, `bg-green-500`, hex hardcodés par tokens `--overlay`, `--success` (ajout si absents dans `src/index.css`).
10. Tests UI : Testing Library sur `useAuth`, `usePermissions`, `useSessionManager`, formulaires Zod critiques.

## Lot 5 — Nettoyage / performance fine (P3)

1. Suppression code mort (`Breadcrumbs.tsx`, `MediaLibrary.tsx`, `PretsAlertes.tsx`) après vérification imports.
2. `useAdhesions`, `useLoanStatus` — brancher ou supprimer selon consommateurs.
3. `LoanRequestsRealtimeProvider` singleton.
4. `<Route path="*">` local dans `Dashboard.tsx` avec nouveau `DashboardNotFound.tsx`.
5. `vite.config.ts` : `manualChunks` pour `radix`, `recharts`, `jspdf`.
6. Vérification finale : `supabase--linter`, `bun run build`, `bunx vitest run`, checklist §18 de l'audit (17 scénarios).

---

## Contrôles anti-régression après CHAQUE lot

- `bun run build` (types + bundle)
- `bunx vitest run`
- `supabase--linter` (aucun nouveau finding)
- Vérification manuelle des 8 rôles (super_admin, administrateur, président, trésorier, commissaire, secrétaire, membre, invité)
- Vérification multi-tenant : switch `set_current_association` + isolation lecture
- Mise à jour de `docs/CHANGELOG.md` + `docs/AUDIT_CORRECTIONS_2026_07.md` + `mem://audits/complete-2026-07`

## Nouveaux fichiers attendus

- `.github/workflows/ci.yml`
- `docs/CI_PIPELINE.md`
- `supabase/functions/_shared/cors.ts`
- `supabase/functions/_shared/schemas.ts`
- `src/hooks/useCurrencyFormatter.ts`
- `src/hooks/useCaisseFinance.ts`
- `src/hooks/useAideWorkflow.ts` (si pas déjà créé au Lot 1)
- `src/providers/LoanRequestsRealtimeProvider.tsx`
- `src/pages/dashboard/DashboardNotFound.tsx`
- Migrations SQL : RLS corrections (Lot 2), seed permissions admin (Lot 4)
- Tests : `BeneficiaireService.test.ts`, extensions `pretCalculsService`, `formatCurrencyDynamic`, tests UI hooks (Lot 4)

## Nouveaux secrets

- `ALLOWED_ORIGINS` (Lot 2, `set_secret`)
- `SENTRY_DSN` (Lot 4, optionnel via `add_secret` — demandé à l'utilisateur seulement s'il le fournit)

## Livrables finaux

- `docs/AUDIT_CORRECTIONS_2026_07.md` complété (Lots 2 à 5).
- Rapport de fin de mission avec : anomalies corrigées, fichiers modifiés, modules impactés, refactorings, tests, anomalies non corrigeables.
- 30/30 correctifs marqués `Fait` dans `docs/AUDIT_COMPLET_2026_07.md` §19.
- Note cible ≥ 90/100.

## Anomalies volontairement non traitées

- **Upgrades majeures** (React 19, Vite 6, RRD 7, date-fns 4) — hors périmètre correctif, projet dédié requis.
- **`useSessionManager` race conditions** — couvertes par tests dédiés au Lot 4 sans refactor structurel.
- **SENTRY_DSN** — activation Sentry conditionnelle : si l'utilisateur ne fournit pas la clé, le code est prêt mais désactivé par défaut.

**Durée estimée : ~6-7 jours consolidés, livrés en une exécution continue.**
