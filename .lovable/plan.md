
# Corrections Batch 4 + Preparation Batch 5

## Corrections a appliquer (2 points)

### 1. useEpargnes.ts - Invalidations cache manquantes

Ajouter dans `useUpdateEpargne` et `useDeleteEpargne` les 3 invalidations presentes dans `useCreateEpargne` :
- `caisse-operations`
- `caisse-stats`
- `caisse-synthese`

### 2. useCaisseSynthese.ts - Select optimise

Remplacer `.select("*")` par `.select("montant, type_operation, categorie, libelle")` dans la boucle de pagination (ligne 36).

---

## Batch 5 : Prochaine phase a definir

Apres application des corrections, analyser le code pour identifier les axes du Batch 5 parmi :
- Securite RLS (tables sans policies ou policies trop permissives)
- Edge functions non testees ou fragiles
- Coherence des routes protegees (PermissionRoute vs AdminRoute)
- UX / accessibilite (formulaires, messages d'erreur)
- Performance (requetes N+1, composants lourds)

---

## Section technique

| Fichier | Modification |
|---------|-------------|
| `src/hooks/useEpargnes.ts` | Ajouter `queryClient.invalidateQueries({ queryKey: ["caisse-operations"] })`, `caisse-stats`, `caisse-synthese` dans `onSuccess` de `useUpdateEpargne` (ligne 124) et `useDeleteEpargne` (ligne 150) |
| `src/hooks/useCaisseSynthese.ts` | Ligne 36 : `.select("*")` devient `.select("montant, type_operation, categorie, libelle")` |
