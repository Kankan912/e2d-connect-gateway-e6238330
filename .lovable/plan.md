

# Batch 6 : Nettoyage console.log, bug PhoenixMatchForm, migration vers logger

## Problemes identifies

### 1. BUG : PhoenixMatchForm ne sauvegarde rien

**Fichier** : `src/components/forms/PhoenixMatchForm.tsx` (ligne 33-36)

Le formulaire de creation de match Phoenix ne fait qu'un `console.log` puis appelle `onSuccess()` sans jamais persister les donnees en base. C'est un formulaire factice.

**Action** : Identifier si ce formulaire est utilise et, si oui, implementer la sauvegarde reelle. Sinon, le documenter comme placeholder.

### 2. Console.log en production : 152 occurrences

Le projet dispose d'un `logger.ts` centralise qui supprime les logs en production, mais 152 `console.log` directs existent dans 8 fichiers, dont :

- `src/contexts/AuthContext.tsx` : 8 console.log de debug (profils, roles, permissions)
- `src/hooks/useSessionManager.ts` : 7 console.log de debug session
- `src/lib/sync-events.ts` : 5 console.log de sync
- `src/hooks/useSportEventSync.ts` : 1 console.log
- `src/lib/pdf-utils.ts` / `exportService.ts` : console.log dans les catch

**Action** : Remplacer les `console.log` par `logger.info/debug/error` pour que ces logs soient automatiquement supprimes en production.

### 3. Console.error/warn : conserver mais standardiser

Les `console.error` dans les blocs `catch` (46 fichiers) sont acceptables car `logger.error` les transmet deja. Toutefois, les fichiers critiques (AuthContext, SessionManager) beneficieraient d'une migration vers `logger` pour le contexte structure.

---

## Resume des modifications

| # | Fichier | Action |
|---|---------|--------|
| 1 | `src/components/forms/PhoenixMatchForm.tsx` | Verifier l'usage et soit implementer la sauvegarde, soit marquer comme TODO |
| 2 | `src/contexts/AuthContext.tsx` | Remplacer 8 `console.log` par `logger.info/debug` |
| 3 | `src/hooks/useSessionManager.ts` | Remplacer 7 `console.log` par `logger.debug` |
| 4 | `src/lib/sync-events.ts` | Remplacer 5 `console.log` par `logger.info` |
| 5 | `src/hooks/useSportEventSync.ts` | Remplacer 1 `console.log` par `logger.debug` |
| 6 | `src/lib/pdf-utils.ts` | Remplacer `console.log` dans les catch par `logger.debug` |
| 7 | `src/lib/exportService.ts` | Remplacer `console.log` dans le catch par `logger.debug` |

## Impact

- Zero `console.log` en production (hors ceux du logger lui-meme)
- Le bug PhoenixMatchForm sera documente ou corrige
- Meilleure observabilite avec logs structures
- Aucun changement fonctionnel visible

## Section technique

La migration utilise le `logger` existant (`src/lib/logger.ts`) qui :
- Supprime `info/debug/success` en production (`import.meta.env.DEV`)
- Conserve `error` en toute circonstance
- Supporte les logs structures via `logWithContext`

