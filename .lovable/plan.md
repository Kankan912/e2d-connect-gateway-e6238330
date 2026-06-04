## Lot F — Synthèse finale & plan de maintenance

Objectif : clôturer l'audit V3 par un document de synthèse exécutif et un plan de maintenance opérationnel, sans modification de code applicatif.

### Livrables (documentation uniquement)

1. **`docs/AUDIT_E2D_V3.md`** — section finale « Synthèse Lot F »
   - Tableau récapitulatif des 6 lots (A→E) : périmètre, violations détectées, corrections appliquées, résiduel.
   - Score global de conformité par axe (Sécurité, Données, UI/UX, Logging, Erreurs, Mobile, Accessibilité).
   - Points forts du projet (RLS robuste, `has_role`, `lazyWithRetry`, ErrorBoundary 2 niveaux, logger centralisé, `catch (error: unknown)` 100%).
   - Risques résiduels classés (faibles/moyens) avec impact estimé.

2. **`docs/PLAN_MAINTENANCE.md`** (nouveau)
   - **Routines hebdo** : revue logs Supabase, `supabase--linter`, vérif emails envoyés, sauvegardes.
   - **Routines mensuelles** : `bun audit` dépendances, revue RLS sur nouvelles tables, purge soft-deleted > 90j, vérif quotas storage.
   - **Routines trimestrielles** : audit permissions granulaires, revue index DB, test restauration sauvegarde, revue ErrorBoundary metrics.
   - **Checklist avant merge** : RLS + GRANT sur nouvelles tables, `catch (error: unknown)`, `logger.*` (pas `console.*`), `AlertDialog` (pas `window.confirm`), `lazyWithRetry` sur routes, mobile `p-3 sm:p-6`.
   - **Procédures d'incident** : email down (fallback Resend), DB lock (kill query), chunk load error (cache bust), perte session admin.
   - **Roadmap technique recommandée** : migration progressive E8 (Edge Function `data?.error`), tests E2E critiques (auth/loan/cotisation), monitoring Sentry-like, i18n future.

3. **`.lovable/plan.md`** — marquage Lot F = terminé, audit V3 clôturé.

### Méthode

- Relecture des sections existantes de `docs/AUDIT_E2D_V3.md` pour extraire métriques par lot.
- Croisement avec `mem://index.md` (règles cœur) pour la checklist merge.
- Aucune commande `rg` ni modification de code applicatif.

### Hors périmètre

- Aucune correction de code (le résiduel E8 est documenté, pas patché).
- Aucun nouveau test ni nouvelle dépendance.
- Aucun refonte visuelle ni i18n.

### Validation finale

Après Lot F : audit V3 clôturé. Prochain audit recommandé : V4 dans 6 mois ou après refonte majeure.
