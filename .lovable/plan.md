

# Batch 8 : Console.error residuel + nettoyage `as any` ciblé

## Revue Batch 7

Batch 7 est propre. Seul résidu : `console.error` ligne 180 de `sync-events.ts` oublié lors du Batch 6.

## Modifications proposées

| # | Fichier | Action |
|---|---------|--------|
| 1 | `src/lib/sync-events.ts` (L180) | Remplacer `console.error('Erreur lors du nettoyage:', error)` par `logger.error(...)` (l'import est deja present) |
| 2 | `src/hooks/useSportEventSync.ts` (L27) | Retirer les `as any` sur `payload.new` et `payload.old` en typant avec une interface minimale `{ id: string }` |
| 3 | `src/pages/admin/RolesAdmin.tsx` (L31) | Retirer le `as any` sur `usersData` en utilisant le type correct du hook `useUtilisateurs` |

## Ce qui n'est PAS traite (et pourquoi)

Les ~150 `as any` restants (dans RapportsAdmin, PretsPaiementsManager, Reunions, etc.) sont des casts sur les **relations jointes Supabase** (`c.membres as any`, `c.cotisations_types as any`). Le SDK Supabase genere un type `unknown` pour les relations `.select('*, membres(*)')`. Corriger cela necessite de creer des interfaces de types pour chaque requete jointe -- c'est un chantier structurel plus large qui ne releve pas du nettoyage courant.

Les ~400 `console.error` dans les blocs `catch` sont **volontairement conserves** : `logger.error` fait exactement la meme chose (`console.error` en interne) mais sans filtrage production, ce qui est le comportement souhaite pour les erreurs.

## Impact

- Derniers residus de logging incoherents corriges
- 3 `as any` supprimes sans risque
- Aucun changement fonctionnel

## Section technique

Pour le point 2, typage du payload realtime :
```typescript
const matchId = (payload.new as { id?: string })?.id || (payload.old as { id?: string })?.id;
```
Cela reste un cast mais avec un type explicite au lieu de `any`, ce qui preserve la securite de type.

Pour le point 3, le hook `useUtilisateurs` retourne deja un type precis -- le cast `as any` est superflu.

