
# Batch 8 (étendu) : Revue complète Batches 1-8 + corrections — TERMINÉ

## Problèmes identifiés lors de la revue globale

| # | Fichier | Problème | Sévérité |
|---|---------|----------|----------|
| 1 | `src/lib/sync-events.ts` L21,107,145 | 3 `console.error` restants alors que L180 avait été migré vers `logger.error` — incohérence interne | Mineur |
| 2 | `src/contexts/AuthContext.tsx` L80,95,115,123,236,249 | 6 `console.error` bruts avec emojis alors que le fichier utilise `logger.info/success` pour le reste | Mineur |
| 3 | `src/lib/logger.ts` L124 | `sendToSentry` placeholder utilise `console.error` en production → bruit inutile | Mineur |

## Corrections appliquées

| # | Fichier | Action | Statut |
|---|---------|--------|--------|
| 1 | `src/lib/sync-events.ts` | 3 `console.error` → `logger.error` | ✅ |
| 2 | `src/contexts/AuthContext.tsx` | 6 `console.error` → `logger.error` | ✅ |
| 3 | `src/lib/logger.ts` | `sendToSentry` placeholder conditionné à `isDevelopment` | ✅ |
| 4 | `src/hooks/useSportEventSync.ts` | `as any` → `as { id?: string }` (Batch 8 initial) | ✅ |
| 5 | `src/pages/admin/RolesAdmin.tsx` | `as any` → type explicite (Batch 8 initial) | ✅ |

## État post-revue

- **sync-events.ts** : 100% logger, zéro console.error
- **AuthContext.tsx** : 100% logger pour toutes les erreurs
- **logger.ts** : placeholder Sentry ne pollue plus la console en production
- **useRealtimeUpdates.ts** : `as any` sur `postgres_changes` conservé (limitation SDK documentée)
- Aucun changement fonctionnel
