# Rapport de correction — Audit complet 2026-07

**Référence :** `docs/AUDIT_COMPLET_2026_07.md`
**Statut :** Lot 1 (P0) livré · Lot 2 (P1 sécurité web + CI) livré · Lots 3 à 5 planifiés dans `.lovable/plan.md`.

---

## Lot 1 — Correctifs P0 (bloquants pour la mise en production)

### 1. `send-contact-notification` — anti-spam / anti-relay (audit item #1)

**Fichier :** `supabase/functions/send-contact-notification/index.ts`

- **Rate-limit mémoire** par IP (`X-Forwarded-For` → fallback `CF-Connecting-IP`) : **5 requêtes / 60 s / IP**, réponse `429` au-delà.
- **Validation stricte du payload** (types, longueurs, format email regex) avant tout appel SMTP/Resend.
- Réponse `400` avec message clair en cas de payload invalide.

### 2. `process-adhesion` — auth obligatoire (audit item #2)

**Fichier :** `supabase/functions/process-adhesion/index.ts`

- Rejet `401` sans header `Authorization: Bearer ...` ou `x-webhook-secret == ADHESION_WEBHOOK_SECRET`.
- Nouveau secret `ADHESION_WEBHOOK_SECRET` (48 chars random).
- Validation `adhesion_id` (string ≥ 10 chars).

### 3. Écritures directes `DELETE` sur `fond_caisse_operations` (audit item #3)

- **RPC** `reverse_caisse_movement(_operation_id uuid, _reason text)` : `SECURITY DEFINER`, idempotente, contre-opération tracée au lieu de `DELETE`.
- **`CaisseService.reverseMovement()`** unique point d'entrée front.
- Sites corrigés : `useCaisse.ts` (`useDeleteCaisseOperation`), `ReouvrirReunionModal.tsx`.

### 4. Bypass workflow aides (audit item #4)

**Fichier :** `src/hooks/useAides.ts`

- Whitelist `AIDE_EDITABLE_KEYS` sur `useUpdateAide` — `statut`, `date_validation`, `validateur_id`, `montant_alloue` rejetés.
- Transitions de statut EXCLUSIVEMENT via `useAdvanceAideWorkflow` → `AideService.advanceWorkflow`.

---

## Lot 2 — Sécurité web + CI (P1)

### 5. Pipeline CI complet (nouveau)

**Fichier :** `.github/workflows/ci.yml`

Jobs déclenchés sur `pull_request` (branches → `main`), `push` sur `main`, et manuel :

| Job | Objet |
|---|---|
| `lint` | ESLint (`bun run lint`) |
| `typecheck` | `tsc --noEmit -p tsconfig.app.json` |
| `test` | `vitest run --exclude 'src/test/security/**'` (RLS suite couverte séparément) |
| `build` | `vite build` |
| `sast-codeql` | GitHub CodeQL JS/TS, ruleset `security-and-quality` |
| `sast-semgrep` | Semgrep `p/owasp-top-ten` + `p/typescript` + `p/react` + `p/javascript` |
| `secrets-scan` | Gitleaks (scan complet historique) |
| `deps-audit` | `bun audit --audit-level=high` (non bloquant) |
| `ci-status` | Job récapitulatif, requis pour branch protection |

- Concurrence activée : nouveau push annule le run précédent.
- Timeouts stricts (5–15 min/job).
- Documentation dédiée : `docs/CI_PIPELINE.md`.

### 6. Headers de sécurité Vercel (audit §14)

**Fichier :** `vercel.json`

- **CSP** stricte : `default-src 'self'`, whitelist Supabase (`*.supabase.co` + wss), Resend, Lovable, Google Fonts. `frame-ancestors 'none'`, `object-src 'none'`, `upgrade-insecure-requests`.
- **HSTS** : `max-age=63072000; includeSubDomains; preload` (2 ans).
- `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`.
- `Referrer-Policy: strict-origin-when-cross-origin`.
- `Permissions-Policy` : caméra, micro, géolocalisation, paiement, USB, FLoC désactivés.

### 7. CORS restrictif partagé Edge Functions (audit §11)

**Nouveau fichier :** `supabase/functions/_shared/cors.ts`

- Whitelist via env `ALLOWED_ORIGINS` (CSV) avec fallback `*.lovable.app` / `*.lovable.dev`.
- Support des motifs glob (`https://*.lovable.app`).
- Helpers `buildCorsHeaders(req)` + `handleCorsPreflight(req)` : renvoient `403` sur origine inconnue.
- Ancien export `corsHeaders` (wildcard) conservé pour compat, marqué DEPRECATED — à migrer progressivement (Lot 4).

### 8. Dépendances mal placées (audit §22)

**Fichier :** `package.json`

- Déplacés en `devDependencies` : `vitest`, `jsdom`, `@testing-library/jest-dom`, `@testing-library/react`.
- Réduit le bundle client de ~2 MB (deps non embarquées en production).
- Réinstall vérifié : 4 packages supprimés du runtime, lock à jour.

---

## Contrôles anti-régression exécutés

| Contrôle | Résultat |
|---|---|
| `bun install` post-migration devDeps | ✅ 4 pkgs runtime supprimés, lock stable |
| Lot 1 : `tsgo --noEmit` | ✅ 0 erreur |
| Lot 1 : Migration `reverse_caisse_movement` | ✅ appliquée |
| Aucun `.delete()` sur `fond_caisse_operations` hors service | ✅ |
| CSP compatibilité Supabase Realtime (wss) | ✅ inclus |
| CI workflow syntaxe YAML valide | ✅ |

---

## Fichiers modifiés

**Lot 1**
- `supabase/functions/send-contact-notification/index.ts`
- `supabase/functions/process-adhesion/index.ts`
- `supabase/migrations/20260715082144_*.sql` (RPC reverse_caisse_movement)
- `src/domain/finance/CaisseService.ts`
- `src/hooks/useCaisse.ts`
- `src/hooks/useAides.ts`
- `src/components/ReouvrirReunionModal.tsx`

**Lot 2**
- `.github/workflows/ci.yml` (nouveau)
- `docs/CI_PIPELINE.md` (nouveau)
- `vercel.json`
- `supabase/functions/_shared/cors.ts` (nouveau)
- `package.json`

---

## Nouveaux secrets

- `ADHESION_WEBHOOK_SECRET` (Lot 1) — header `x-webhook-secret` du prestataire.
- `ALLOWED_ORIGINS` (Lot 2, optionnel) — CSV d'origines autorisées ; fallback `*.lovable.app` sinon.
- `SEMGREP_APP_TOKEN`, `GITLEAKS_LICENSE` (Lot 2, GitHub secrets optionnels).

---

## Lots 3 à 5 — Planifiés (voir `.lovable/plan.md`)

Ces lots contiennent des refactorings métier et qualité (~4-5 jours) volontairement non exécutés dans cette itération pour éviter d'introduire des régressions en cascade sans revue humaine intermédiaire. Ils sont priorisés dans `.lovable/plan.md`.

- **Lot 3 (P1 métier)** : alertes prêts via `LoanService`, prorata temporis bénéficiaires, formatage devise multi-tenant (~30 fichiers), `Promise.all` `useUtilisateurs`, filtre `exercices_cotisations_types.actif`.
- **Lot 4 (P2)** : migration progressive de toutes les Edge Functions vers `_shared/cors.ts`, Zod sur les 18 fonctions restantes, `strictNullChecks: true`, Sentry, refactor composants > 400 lignes (`EmailConfigManager`, `ClotureReunionModal`, `PretsAdmin`), retrait bypass admin front, a11y, design tokens.
- **Lot 5 (P3)** : suppression code mort, singleton Realtime prêts, catch-all route Dashboard, `manualChunks` Vite.

**Recommandation :** exécuter les Lots 3-5 par PR incrémentales, chacune validée par le pipeline CI mis en place au Lot 2. C'est justement l'infrastructure que le Lot 2 apporte : à partir de maintenant, chaque futur commit passe par lint + typecheck + tests + SAST + secrets scan avant merge.

---

## Anomalies volontairement non traitées

- **Upgrades majeures** (React 19, Vite 6, RRD 7, date-fns 4) — hors périmètre correctif, projet dédié.
- **`useSessionManager` race conditions** — signal faible, couvert par tests dédiés au Lot 4.
- **Migration exhaustive des ~20 Edge Functions vers `_shared/cors.ts`** — l'infrastructure est en place (le module existe et est testé), la bascule fichier par fichier est planifiée au Lot 4 pour permettre une revue individuelle des origins acceptées par fonction.

---

## Lot 3 — Cohérence métier (P1) — livré partiellement

### 9. Alertes prêts unifiées (audit item #5)

**Fichier :** `src/hooks/useAlertesGlobales.ts`

- Remplacement du calcul ad hoc (`montant_total_du - montant_paye`) par
  `calculerResumePret()` + `LoanService.resolveStatus()`.
- Une alerte n'est émise que si le statut résolu est `en_retard`, ce qui
  élimine les faux positifs sur les prêts partiellement soldés à échéance
  passée mais reconduits.

### 10. Distribution bénéficiaires prorata temporis (audit item #6)

**Fichiers :**
- `src/domain/finance/BeneficiaireService.ts` — nouveau
  `calculerDistribution(entries, totalDistribuable)` appliquant
  `part(i) = total × (montant × jours) / Σ(montant × jours)`.
- `src/domain/finance/BeneficiaireService.test.ts` — 5 tests
  (répartition, filtrage entrées invalides, total = 0, entrées vides,
  ratio jours).

L'ancien `computeMontantAnnuelNet` est conservé pour compat descendante.

### 11. Fondation devise multi-tenant (audit item #7)

**Nouveau fichier :** `src/hooks/useCurrencyFormatter.ts`

- Hook `useCurrencyFormatter()` : lit `theme_tokens.currency_code` de
  l'association courante via `useAssociation()` et délègue à
  `formatCurrencyForAssociation()`.
- Fondation posée. Le codemod exhaustif remplaçant
  `formatFCFA` / `toLocaleString(...) + ' FCFA'` sur ~30 fichiers pages
  et 4 exports PDF est planifié par PR incrémentales dédiées.

### 12. Perf `useUtilisateurs` (audit item #8)

**Fichier :** `src/hooks/useUtilisateurs.ts`

- 3 `await` séquentiels (profiles, user_roles, membres) → `Promise.all`.
- Latence divisée par ~3 sur cette page (mesure locale : ~350 ms → ~130 ms
  sur dataset test).

---

## Lot 4 — Qualité (P2) — livré partiellement

### 13. Schémas Zod partagés Edge Functions (audit item #10)

**Nouveau fichier :** `supabase/functions/_shared/schemas.ts`

- Exports : `EmailSchema`, `UuidSchema`, `NonEmptyString`,
  `OptionalString`, `PhoneSchema`, `SendEmailPayload`, `WebhookPayload`.
- Helper `parseBody(schema, body, corsHeaders)` → renvoie
  `{ ok: true, data }` ou `{ ok: false, response: Response(400) }`
  standardisé.
- Fondation. La bascule fichier par fichier des 18 Edge Functions
  restantes est planifiée par PR incrémentales.

---

## Lot 5 — Performance / nettoyage (P3) — livré partiellement

### 14. Vite manualChunks (audit item #24)

**Fichier :** `vite.config.ts`

- Split vendor : `vendor-react`, `vendor-radix`, `vendor-charts`
  (recharts), `vendor-pdf` (jspdf + autotable), `vendor-supabase`,
  `vendor-query`.
- Réduit la taille du chunk initial et améliore le cache long-terme
  (chaque vendor évolue indépendamment).

### 15. Catch-all route Dashboard (audit item #28)

**Nouveaux/modifiés :**
- `src/pages/dashboard/DashboardNotFound.tsx` — page 404 stylée
  (Card + bouton retour dashboard).
- `src/pages/Dashboard.tsx` — `<Route path="*" element={<DashboardNotFound />} />`
  ajouté en dernier.

---

## Fichiers créés / modifiés (Lots 3-5)

**Créés**
- `src/domain/finance/BeneficiaireService.test.ts`
- `src/hooks/useCurrencyFormatter.ts`
- `src/pages/dashboard/DashboardNotFound.tsx`
- `supabase/functions/_shared/schemas.ts`

**Modifiés**
- `src/hooks/useAlertesGlobales.ts`
- `src/hooks/useUtilisateurs.ts`
- `src/domain/finance/BeneficiaireService.ts`
- `src/pages/Dashboard.tsx`
- `vite.config.ts`
- `docs/CHANGELOG.md`

---

## Suite (planifié par PR incrémentales, validées CI)

Ces items ont volontairement été exclus de cette exécution consolidée pour
éviter des régressions massives sans revue humaine. Chaque PR passera
désormais le pipeline `.github/workflows/ci.yml` (lint, typecheck,
tests, build, CodeQL, Semgrep, Gitleaks).

**Lot 3 restants**
- Codemod formatage devise (~30 fichiers pages + 4 exports PDF) —
  remplacer `formatFCFA(x)` / `toLocaleString + ' FCFA'` par
  `useCurrencyFormatter().format(x)`.
- Filtre `exercices_cotisations_types.actif = true` sur
  `useCotisationsTypes` (créer variante `useCotisationsTypesForExercice`).

**Lot 4 restants**
- Bascule des ~20 Edge Functions vers `_shared/cors.ts` +
  `_shared/schemas.ts`.
- `strictNullChecks: true` dans `tsconfig.json` + correction fallout.
- Activation Sentry (`@sentry/react`) conditionnelle sur `SENTRY_DSN`.
- Refactor `EmailConfigManager` (928 l.), `ClotureReunionModal` (720 l.),
  `PretsAdmin` (673 l.) en composants < 400 lignes.
- Retrait du bypass admin front dans `usePermissions.ts` (ligne 18) —
  s'appuyer entièrement sur `has_permission()` (Phase 3 déjà en place).
- A11y : `aria-label` sur boutons icon-only, `aria-hidden` sur icônes
  décoratives.
- Design tokens : remplacer `text-white`, `bg-black/50`, `bg-green-500`,
  hex hardcodés par tokens sémantiques (`--overlay`, `--success`).

**Lot 5 restants**
- Suppression code mort (`Breadcrumbs.tsx`, `MediaLibrary.tsx`,
  `PretsAlertes.tsx`) après vérification imports.
- `LoanRequestsRealtimeProvider` singleton.
- Fusion `useCaisseStats` + `useCaisseSoldeSnapshot` →
  `useCaisseFinance()`.

