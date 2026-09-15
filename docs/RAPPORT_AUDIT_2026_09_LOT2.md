# Rapport de preuve — Lot 2 (cohérence, secrets, durcissement)

Date : 14 septembre 2026. Suite du Lot 1 (contrôles d'accès des fonctions serveur + RLS tenant-aware).

| ID | Fichiers modifiés | Migration SQL | Tests exécutés | Résultat | Statut | Risque résiduel |
|---|---|---|---|---|---|---|
| A08 | `src/integrations/supabase/client.ts` | — | `tsgo`, `bun run build` | URL et clé publiable lues depuis `VITE_SUPABASE_URL` / `VITE_SUPABASE_PUBLISHABLE_KEY` ; erreur explicite si absente | Corrigé | Repli sur l'URL publique conservé pour les aperçus |
| A09 | `.gitignore`, `.env.example` | — | `git status` | `.env`, `.env.*`, `*.pem` exclus du dépôt ; modèle `.env.example` ajouté | Corrigé | `.env` déjà historisé doit être purgé côté dépôt distant |
| A12 | 18 fonctions `supabase/functions/*/index.ts`, `_shared/cors.ts` | — | `deno check` (20 fonctions, 0 erreur) | CORS wildcard remplacé par la liste blanche `ALLOWED_ORIGINS` sur toutes les fonctions sensibles | Corrigé | `donations-stats` et `send-contact-notification` restent ouverts (endpoints du site public, aucune donnée sensible) |
| A13 | `src/lib/lazyWithRetry.ts` | — | `bun run build` | Plus de `window.location.reload()` : 3 tentatives d'import espacées, puis remontée à l'ErrorBoundary | Corrigé | — |
| A14 | `src/components/ErrorBoundary.tsx` | — | `tsgo` | Lien `<a href>` hors Router supprimé ; hors Router seuls « Réessayer » / « Actualiser » sont proposés | Corrigé | — |
| A15 | `vercel.json` | — | `bun run build` | `unsafe-eval` retiré de la CSP | Corrigé | `unsafe-inline` conservé (styles Tailwind runtime) |
| A23 | `bun.lockb`, `package-lock.json` supprimés | — | `bun install --frozen-lockfile` | Un seul verrou : `bun.lock` | Corrigé | — |
| A24 | `.github/workflows/ci.yml` | — | CI | `bun audit --audit-level=high` devient bloquant | Corrigé | L'audit bun peut renvoyer 404 hors GitHub ; à surveiller au premier run |
| A26 | `null`, `e2e/__pycache__/` supprimés | — | — | Fichiers parasites retirés et ignorés | Corrigé | — |
| A28 | `src/lib/sentry.ts` | — | `tsgo`, `bun run build` | `new Function` supprimé ; import dynamique `@vite-ignore` conditionné à `VITE_SENTRY_DSN` | Corrigé | Sentry reste inactif tant que le paquet n'est pas installé (A27) |
| A02+ | `supabase/config.toml` | — | `deno check` | `verify_jwt = true` sur les 16 fonctions sensibles ; `false` uniquement sur les 4 endpoints publics | Corrigé | — |
| divers | `_shared/auth-check.ts`, `provision-association`, `send-cotisation-reminders` | — | `deno check` | Erreurs de typage résiduelles corrigées | Corrigé | — |

## Vérifications globales

- `deno check supabase/functions/*/index.ts` : 20 fonctions, 0 erreur.
- `bunx tsgo --noEmit -p tsconfig.app.json` : 0 erreur.
- `bunx vitest run` : 134 tests passés, 41 tests RLS ignorés (nécessitent des identifiants externes — A25).
- `bun run build` : succès.

## Reste ouvert

| ID | Objet | Raison |
|---|---|---|
| A18 | Suivi annuel basé sur l'année de `date_debut` au lieu de `exercice_id` | Refonte métier, lot suivant |
| A19/A20 | Clôture et réouverture de réunion transactionnelles côté base | Nécessite deux RPC dédiées, lot suivant |
| A21 | ~284 `any` signalés par ESLint | Chantier de typage progressif |
| A22 | `types.ts` > 214 Ko | Fichier généré par Supabase, non modifiable |
| A25 | Tests RLS dépendants de secrets externes | Nécessite des comptes de test dédiés en CI |
| A27 | Sentry non installé | Décision produit : installer `@sentry/react` et définir `VITE_SENTRY_DSN` |
