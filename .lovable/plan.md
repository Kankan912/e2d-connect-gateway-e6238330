## Lot E — UX globale & gestion des erreurs

Objectif: stabiliser l'expérience utilisateur transverse et l'observabilité des erreurs, sans refonte visuelle ni changement de logique métier.

### Périmètre (Phases 11 & 12 de l'audit E2D V3)

**Phase 11 — UX globale**
- Cohérence des états de chargement (skeletons vs spinners) sur les pages principales (Dashboard, Membres, Cotisations, Prêts, Caisse, Réunions, Sport, Galerie).
- Cohérence des messages toast (succès/erreur/info) — vocabulaire, durée, position.
- Boutons retour: vérifier `navigate(-1)` partout (rappel Lot D7).
- Responsivité mobile: padding `p-3 sm:p-6` sur les conteneurs principaux (Core rule).
- Confirmations destructives: `AlertDialog` partout, jamais `window.confirm` (Core rule).
- Accessibilité minimale: `aria-label` sur icônes cliquables, contrastes via tokens sémantiques.

**Phase 12 — Gestion des erreurs**
- Vérifier que `src/lib/logger.ts` est utilisé partout (pas de `console.log` résiduel hors logger).
- `catch (error: unknown)` + extraction `data?.error` des Edge Functions (Core rule).
- ErrorBoundaries 2 niveaux (App/Dashboard) — vérifier présence et retry.
- `lazyWithRetry` sur les imports de routes dynamiques (Core rule).
- Toasts d'erreur explicites (pas de "Une erreur est survenue" générique sans contexte).
- Validation côté client cohérente (zod / react-hook-form) sur formulaires critiques.

### Méthode

1. **Audit code** (lecture seule)
   - `rg "console\.(log|warn|error)"` hors `src/lib/logger.ts` et tests.
   - `rg "window\.confirm"` — doit retourner 0.
   - `rg "catch \(error\)"` (sans `: unknown`) — à corriger.
   - `rg "lazy\("` vs `lazyWithRetry` dans `App.tsx` / routes.
   - `rg "ErrorBoundary"` — vérifier wrappers.
   - Inspection des pages principales pour cohérence skeletons/toasts.

2. **Audit DB** (via `supabase--read_query`)
   - Pas de requête DB nécessaire pour ce lot (UX uniquement). Sauf si un point révèle un besoin (ex: logs d'erreurs Edge Functions via `supabase--edge_function_logs`).

3. **Corrections ciblées**
   - Remplacements `console.*` → `logger.*` si trouvés.
   - Ajout `: unknown` aux catches manquants.
   - Conversion `window.confirm` → `AlertDialog` si trouvés.
   - Wrapping `lazyWithRetry` si imports `lazy()` directs trouvés sur routes.
   - Ajout `aria-label` manquants sur icônes cliquables critiques.

4. **Documentation**
   - Section Lot E dans `docs/AUDIT_E2D_V3.md` avec findings, corrections, anomalies restantes.
   - Mise à jour `.lovable/plan.md`.

### Points de vigilance

- **E1** — Ne PAS toucher au design system / tokens / palette (hors scope).
- **E2** — Ne PAS refondre les composants UI existants, uniquement corriger les écarts aux règles.
- **E3** — Toute correction `console.*` → `logger.*` doit respecter le standard (`logger.debug/info/warn/error`).
- **E4** — Si `window.confirm` trouvé dans un flow critique (suppression, validation financière), prioriser la correction.
- **E5** — Ne PAS introduire de nouveau ErrorBoundary sans nécessité avérée (les 2 niveaux App/Dashboard suffisent).
- **E6** — Reporter sans corriger toute anomalie qui dépasserait le scope UX/erreurs (ex: bug logique métier découvert en passant → noter dans audit, ne pas patcher).

### Hors scope

- Refonte visuelle / nouveau design system.
- Internationalisation (i18n).
- Tests E2E nouveaux (vitest existant suffit).
- Optimisations performance (lazy loading additionnel, memoization).

### Livrables

- Fichiers corrigés (liste précise selon findings).
- Section Lot E dans `docs/AUDIT_E2D_V3.md`.
- Liste d'anomalies restantes nécessitant décision utilisateur (s'il y en a).

### Suite

Après validation Lot E → **Lot F** (dernier lot): synthèse finale, recommandations long terme, plan de maintenance.

Confirme pour lancer l'audit Lot E.