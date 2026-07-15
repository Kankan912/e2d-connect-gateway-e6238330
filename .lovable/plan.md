
# Plan de remédiation — Audit complet 2026-07

Référence : `docs/AUDIT_COMPLET_2026_07.md` (30 correctifs, note 72/100 → objectif ≥ 90/100).

Livraison en **5 lots successifs** : chaque lot est autonome, testé, et validé avant le suivant pour éviter les régressions. Après chaque lot : `bun run build` + `vitest run` + `supabase--linter` + mise à jour `docs/CHANGELOG.md` et `mem://audits/complete-2026-07`.

---

## Lot 1 — P0 Sécurité critique (immédiat, ~1 j)

**Objectif** : neutraliser les 3 risques rouges qui bloquent la mise en production.

1. **`send-contact-notification`** (`supabase/functions/send-contact-notification/index.ts`)
   - Ajout HMAC signature client + rate-limit mémoire (5/min/IP) + validation Zod du payload.
   - Nouveau secret `CONTACT_HMAC_SECRET` (via `secrets--add_secret`).
   - Nettoyage CORS via `_shared/cors.ts` (voir Lot 2).
   - Impact : `src/pages/Index.tsx` (formulaire contact) → envoi de la signature HMAC calculée côté front avec clé publique dérivée.

2. **`process-adhesion`** (`supabase/functions/process-adhesion/index.ts`)
   - Exiger header `x-webhook-secret` = `ADHESION_WEBHOOK_SECRET` OU JWT authentifié via `_shared/auth-check.ts`.
   - Validation Zod stricte du payload adhésion.
   - Impact : `src/pages/Adhesion.tsx` (front public) → transmettre le secret partagé ou passer par un flow authentifié.

3. **Violations `CaisseService`** (audit item #3)
   - Migration : nouvelle RPC `reverse_caisse_movement(_operation_id uuid, _reason text)` qui insère une opération inverse tracée (jamais de `DELETE`).
   - `src/domain/finance/CaisseService.ts` : nouvelle méthode `reverseMovement()`.
   - `src/hooks/useCaisse.ts:353` + `src/components/ReouvrirReunionModal.tsx:58` → remplacer les `.delete()` directs par `CaisseService.reverseMovement()`.
   - Contrôle : audit trail conservé, solde recalculé identique.

4. **Aide workflow bypass** (`src/hooks/useAides.ts:122`, audit item #4)
   - Whitelist des colonnes modifiables dans `useUpdateAide` (exclure `statut`, `montant_alloue`, `date_validation`, `validateur_id`).
   - Nouveau hook `useAideWorkflow` exposant uniquement `AideService.advanceWorkflow()`.
   - Impact : `src/pages/admin/AidesAdmin.tsx` → migrer les appels de changement de statut.

**Tests** : `AideService.test.ts`, `CaisseService.test.ts` étendus. Nouveau `supabase/functions/send-contact-notification/index.test.ts` (rejet signature invalide). Vérifier RLS via `supabase--linter`.

---

## Lot 2 — P1 Sécurité web & CI (~1 j)

5. **Headers Vercel** (`vercel.json`) — CSP (Supabase + Resend + self), HSTS 1 an, X-Frame-Options DENY, X-Content-Type-Options nosniff, Referrer-Policy strict-origin-when-cross-origin, Permissions-Policy caméra/micro OFF.
6. **CORS restrictif** — nouveau `supabase/functions/_shared/cors.ts` lisant `ALLOWED_ORIGINS` (env). Appliqué aux 20 fonctions. Fallback 403 sur origine inconnue.
7. **RLS audit** — exécuter `supabase--linter`, corriger toute table `public` sans RLS, documenter les exceptions publiques dans `docs/RLS_PERMISSIONS.md`.
8. **CI workflow** — nouveau `.github/workflows/ci.yml` : jobs `lint`, `typecheck` (`tsgo`), `test` (`vitest run`) sur PR. Non bloquant en premier run, activer branch protection après stabilisation.
9. **Deps mal placées** — déplacer `vitest`, `jsdom`, `@testing-library/*` dans `devDependencies`.

**Tests** : build + typecheck + Playwright manuel sur formulaire contact / adhésion pour vérifier headers.

---

## Lot 3 — P1 Cohérence métier (~1.5 j)

10. **Alertes prêts** (`useAlertesGlobales.ts:37,131`, item #5) — utiliser `LoanService.resolveStatus` + `calculerResumePret`. Vérifier impact sur `DashboardHome`, badges header, page `/admin/finances/prets`.
11. **Bénéficiaires prorata temporis** (item #6) — refactoring `BeneficiaireService.calculerDistribution()` : formule `(montant × jours_placement) / Σ(montants × jours)`, utilisation `date_depot` réelle et `nb_mois` via `get_exercice_nb_mois`. Impact : `useEpargnantsBenefices`, page `/dashboard/admin/tontine/beneficiaires`, exports PDF, calculs interêts affichés dans `MyEpargnes`.
12. **Formatage devise multi-tenant** (item #7) — codemod : remplacer chaque `toLocaleString + ' FCFA'` par `formatCurrencyForAssociation()` via `useAssociation()`. Créer helper `useCurrencyFormatter()` pour éviter la répétition. Impact : ~30 fichiers `src/pages/dashboard/*`, exports PDF (`pret-pdf-export.ts`, `rapports-export.ts`, `compte-rendu-pdf.ts`, `membre-pdf.ts`).
13. **Perf `useUtilisateurs`** (item #8) — 3 `await` → `Promise.all`.
14. **Filtre exercice types cotisations** (item #25) — jointure `exercices_cotisations_types` avec `actif=true` dans le SQL du hook.

**Tests** : compléter `pretCalculsService.test.ts`, `BeneficiaireService.test.ts` (nouveau) sur cas prorata + exercice court. `formatCurrencyDynamic.test.ts` étendu multi-devise.

---

## Lot 4 — P2 Qualité / DX / Refactoring (~2 j)

15. Fusion `useCaisseStats` + `useCaisseSoldeSnapshot` en `useCaisseFinance()` (item #9).
16. Validation Zod sur 18 Edge Functions restantes via `_shared/schemas.ts` (item #12).
17. TypeScript `strictNullChecks: true` → corriger le fallout (item #14, XL — traité en étapes).
18. ESLint `no-unused-vars: warn` puis `error` (item #15).
19. Sentry `@sentry/react` + `@sentry/vite-plugin` avec DSN via env (item #17).
20. Refactor composants > 400 lignes (item #18) — priorité `EmailConfigManager` (928 l.), `ClotureReunionModal` (720 l.), `PretsAdmin` (673 l.). Extraction en `_components/` locaux + hooks dédiés. **Contrôle strict** : test manuel de chaque flow avant/après.
21. Bypass admin frontend (`usePermissions.ts:18,21`, item #26) — retirer, remplacer par seed SQL garantissant que le rôle `administrateur` a toutes les permissions.
22. A11y : `aria-label` sur boutons icon-only + `aria-hidden` sur icônes Lucide (item #21).
23. Design tokens : remplacer `text-white`, `bg-black/50`, `bg-green-500`, hex hardcodés (item #22) — ajouter tokens `--overlay`, `--success` dans `src/index.css` si absents.
24. Tests UI/hook (item #23) — ajouter tests Testing Library sur `useAuth`, `usePermissions`, `useSessionManager`, formulaires Zod critiques.

---

## Lot 5 — P3 Nettoyage / performance fine (~0.5 j)

25. Suppression code mort après vérification imports dynamiques : `Breadcrumbs.tsx`, `MediaLibrary.tsx`, `PretsAlertes.tsx` (item #19).
26. `useAdhesions`, `useLoanStatus` (item #20) — brancher ou supprimer après vérification consommateurs.
27. `LoanRequestsRealtimeProvider` singleton (item #24).
28. `<Route path="*">` local dans `Dashboard.tsx` avec `DashboardNotFound` (item #27).
29. `vite.config.ts` `manualChunks` : `radix`, `recharts`, `jspdf` (item #29).
30. Vérification finale : `supabase--linter`, `bun run build`, `vitest run`, checklist §18 audit (17 scénarios), génération rapport final `docs/AUDIT_CORRECTIONS_2026_07.md`.

---

## Détails techniques transverses

### Nouveaux fichiers
- `supabase/functions/_shared/cors.ts` — CORS whitelist
- `supabase/functions/_shared/schemas.ts` — schémas Zod partagés
- `src/hooks/useAideWorkflow.ts`
- `src/hooks/useCaisseFinance.ts` (fusion)
- `src/hooks/useCurrencyFormatter.ts`
- `src/providers/LoanRequestsRealtimeProvider.tsx`
- `src/pages/dashboard/DashboardNotFound.tsx`
- `.github/workflows/ci.yml`
- `docs/AUDIT_CORRECTIONS_2026_07.md` (rapport final)

### Nouvelles migrations
1. RPC `reverse_caisse_movement(_operation_id uuid, _reason text)`
2. Seed permissions complètes rôle `administrateur` (bypass front supprimé)
3. Corrections RLS des tables détectées par le linter

### Nouveaux secrets
- `CONTACT_HMAC_SECRET`
- `ADHESION_WEBHOOK_SECRET`
- `ALLOWED_ORIGINS` (CSV)
- `SENTRY_DSN` (optionnel, lot 4)

### Contrôles anti-régression après chaque lot
- `bun run build` (types + bundle)
- `vitest run` (tests unitaires)
- `supabase--linter`
- Checklist scénarios §18 audit (17 flows métier clés)
- Vérification rôles : super_admin, administrateur, président, trésorier, commissaire, secrétaire, membre, invité
- Vérification multi-tenant : switch `set_current_association` + isolation lecture

### Anomalies volontairement non traitées
- **React 19 / Vite 6 / RRD 7 / date-fns 4** (audit §3.2) — upgrades majeures hors périmètre correctif, à planifier en projet dédié.
- **`useSessionManager` race conditions** (§2.4) — signal faible, à couvrir par tests dédiés en Lot 4.

---

## Livrables finaux

- 30/30 correctifs marqués `Fait` dans `docs/AUDIT_COMPLET_2026_07.md` §19.
- `docs/AUDIT_CORRECTIONS_2026_07.md` avec : anomalies corrigées, fichiers modifiés, modules impactés, refactorings, tests exécutés, améliorations d'architecture.
- `docs/CHANGELOG.md` mis à jour.
- `mem://audits/complete-2026-07` mémoire mise à jour (note cible ≥ 90/100 post-correction).

**Durée estimée totale : ~6 jours de travail concentrés.**
