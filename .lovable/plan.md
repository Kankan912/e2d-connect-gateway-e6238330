# Exécution Lots 3-5 (restants) — Audit 2026-07

Références : `.lovable/plan.md`, `docs/AUDIT_CORRECTIONS_2026_07.md` §« Suite (planifié) ».
Objectif : finaliser les items non encore livrés des Lots 3, 4 et 5 pour atteindre ≥ 90/100.

---

## Lot 3 — Cohérence métier (restants)

1. **Codemod formatage devise multi-tenant**
   - Remplacer `formatFCFA(x)` et `x.toLocaleString(...) + ' FCFA'` par `useCurrencyFormatter().format(x)` dans ~30 pages/composants consommateurs.
   - Adapter les 4 exports PDF (`pret-pdf-export.ts`, `compte-rendu-pdf.ts`, `membre-pdf.ts`, `rapports-export.ts`) pour recevoir le formatter en paramètre (les modules non-React ne peuvent pas appeler le hook).
   - Conserver `formatFCFA` deprecated + JSDoc pointant vers le hook.

2. **Filtre `exercices_cotisations_types.actif = true`**
   - Nouveau hook `useCotisationsTypesForExercice(exerciceId)` dans `src/hooks/useCotisations.ts` avec jointure filtrée.
   - Migration des appelants (`CotisationsAdmin.tsx`, `CotisationsTab.tsx`, `MyCotisations.tsx`).

## Lot 4 — Qualité (restants)

3. **Bascule CORS + Zod sur les ~20 Edge Functions restantes**
   - Remplacer l'import `corsHeaders` legacy par `buildCorsHeaders(req)` + `handleCorsPreflight(req)` (`_shared/cors.ts`).
   - Valider les payloads via `parseBody(schema, body, corsHeaders)` (`_shared/schemas.ts`), avec schémas dédiés par fonction quand le payload dépasse `SendEmailPayload`/`WebhookPayload`.
   - Périmètre : `send-email`, `send-campaign-emails`, `send-cotisation-reminders`, `send-presence-reminders`, `send-pret-echeance-reminders`, `send-reunion-cr`, `send-calendrier-beneficiaires`, `send-loan-notification`, `send-sanction-notification`, `send-user-credentials`, `test-email-configuration`, `update-email-config`, `sync-user-emails`, `create-user-account`, `seed-test-users`, `donations-stats`, `get-payment-config`, `provision-association`.

4. **`strictNullChecks: true`**
   - Activer dans `tsconfig.json`, corriger le fallout par patchs ciblés (hooks + composants) — pas de refonte, juste ajouts de guards.

5. **Sentry conditionnel**
   - `@sentry/react` + `@sentry/vite-plugin` initialisés dans `src/main.tsx` uniquement si `import.meta.env.VITE_SENTRY_DSN` est défini (donc no-op par défaut).
   - Nouveau secret optionnel `SENTRY_DSN` documenté dans `docs/AUDIT_CORRECTIONS_2026_07.md`.

6. **Refactor composants > 400 lignes**
   - `EmailConfigManager` (928 l.) → sous-composants `_components/EmailProviderForm.tsx`, `EmailTestPanel.tsx`, `EmailTemplatesList.tsx` + hook `useEmailConfig`.
   - `ClotureReunionModal` (720 l.) → `_components/ClotureSanctionsStep.tsx`, `ClotureRecapStep.tsx`, `ClotureConfirmStep.tsx`.
   - `PretsAdmin` (673 l.) → sortir `PretsFilters`, `PretsTable`, `PretDetailsSheet`.

7. **Retrait bypass admin front**
   - Supprimer le fallback rôle=admin dans `src/hooks/usePermissions.ts` (lignes 18 & 21) — s'appuyer sur `has_permission()`.
   - Migration seed : garantir que le rôle `administrateur` possède toutes les permissions actives (idempotent).

8. **A11y & design tokens**
   - Ajouter `aria-label` sur les boutons icon-only recensés (audit §12) et `aria-hidden` sur les icônes Lucide décoratives.
   - Remplacer `text-white`, `bg-black/50`, `bg-green-500`, hex hardcodés par tokens sémantiques ; ajouter `--overlay` et `--success` dans `src/index.css` si absents.

## Lot 5 — Nettoyage / perf (restants)

9. **Suppression code mort** : `Breadcrumbs.tsx`, `MediaLibrary.tsx`, `PretsAlertes.tsx` (après vérif imports via `rg`).
10. **`useAdhesions` / `useLoanStatus`** : brancher réellement ou supprimer selon consommateurs.
11. **`LoanRequestsRealtimeProvider` singleton** : nouveau provider global monté une fois dans `App.tsx`, remplace les `supabase.channel()` locaux dupliqués.
12. **Fusion `useCaisseStats` + `useCaisseSoldeSnapshot` → `useCaisseFinance()`** avec sélecteurs mémoïsés.

---

## Contrôles anti-régression après chaque lot

- `bun run build`
- `bunx vitest run`
- `supabase--linter`
- Vérification manuelle rapide : login super_admin + administrateur, switch tenant, page finance.
- MAJ `docs/CHANGELOG.md` + `docs/AUDIT_CORRECTIONS_2026_07.md` + `mem://audits/complete-2026-07`.

## Nouveaux fichiers attendus

- `src/hooks/useCaisseFinance.ts`
- `src/providers/LoanRequestsRealtimeProvider.tsx`
- Sous-composants `_components/` pour les 3 gros écrans refactorés.
- Migration SQL seed permissions `administrateur`.

## Nouveaux secrets

- `SENTRY_DSN` (optionnel — Sentry no-op sans DSN).

## Hors périmètre

- Upgrades majeures (React 19, Vite 6, RRD 7, date-fns 4).
- Refonte `useSessionManager`.
- Toute nouvelle feature métier non listée dans l'audit.

**Estimation : 3-4 jours d'exécution consolidée, sans revue intermédiaire (comme précédemment demandé).**
