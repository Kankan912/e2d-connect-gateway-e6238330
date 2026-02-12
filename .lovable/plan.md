

# Batch 7 : Nettoyage console.error residuels, type safety, et coherence GestionPresences

## Problemes identifies

### 1. GestionPresences.tsx - console.error residuel + import logger manquant

**Fichier** : `src/pages/GestionPresences.tsx` (ligne 120)

Un `console.error` direct subsiste alors que le fichier n'importe pas `logger`. Pour la coherence avec le Batch 6, migrer vers `logger.error`.

**Action** : Ajouter l'import de `logger` et remplacer `console.error` par `logger.error`.

### 2. sync-events.ts - `as any` pour contourner un type manquant

**Fichier** : `src/lib/sync-events.ts` (lignes 43, 171)

Le champ `statut_publication` est accede via `(match as any).statut_publication`. Cela signifie que le type Supabase genere ne contient pas ce champ, ou bien qu'il a ete ajoute en base sans regenerer les types. Ce cast masque des bugs potentiels si le champ est renomme ou supprime.

**Action** : Verifier si `statut_publication` existe dans la table `sport_e2d_matchs` via les types generes. Si oui, le cast est inutile. Si non, documenter le TODO pour regenerer les types.

### 3. useSport.ts - meme probleme `as any` sur `statut_publication`

**Fichier** : `src/hooks/useSport.ts` (lignes 69-70, 108-110)

Memes casts `as any` pour acceder a `statut_publication` et `id` sur le retour d'un insert/update.

**Action** : Aligner avec la correction du point 2.

### 4. useRealtimeUpdates.ts - cast `as any` sur `postgres_changes`

**Fichier** : `src/hooks/useRealtimeUpdates.ts` (ligne 28)

Le cast `'postgres_changes' as any` peut etre supprime car le SDK Supabase v2 supporte ce type nativement.

**Action** : Retirer le cast `as any`.

---

## Resume des modifications

| # | Fichier | Action |
|---|---------|--------|
| 1 | `src/pages/GestionPresences.tsx` | Ajouter import logger, remplacer console.error L120 par logger.error |
| 2 | `src/lib/sync-events.ts` | Verifier types pour `statut_publication`, retirer `as any` si possible |
| 3 | `src/hooks/useSport.ts` | Idem - retirer `as any` sur statut_publication |
| 4 | `src/hooks/useRealtimeUpdates.ts` | Retirer `'postgres_changes' as any` |

## Impact

- Meilleure securite de type (detection de bugs a la compilation)
- Coherence complete du logging (zero console.error direct dans les pages)
- Aucun changement fonctionnel

## Section technique

Pour les points 2-3, la verification se fait dans `src/integrations/supabase/types.ts` sur la definition de `sport_e2d_matchs.Row`. Si `statut_publication` n'y figure pas, il faudra regenerer les types avec `supabase gen types` apres la prochaine migration, et en attendant documenter le cast avec un commentaire `// TODO: regenerer types Supabase`.

