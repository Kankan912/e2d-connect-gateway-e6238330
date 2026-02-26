

# Fix: "Aucun exercice actif trouvé" affiché pendant le chargement

## Cause

Le composant `CotisationsCumulAnnuel.tsx` ne distingue pas l'état "en cours de chargement" de l'état "aucune donnée". Pendant que la requête Supabase s'exécute, `exercice` est `undefined`, et le composant affiche immédiatement le message d'erreur "Aucun exercice actif trouvé" au lieu d'un indicateur de chargement.

La requête elle-même (`.eq('statut', 'actif')`) est correcte et correspond bien aux données en base (exercice "2026-2027" avec statut "actif"). Les permissions RLS autorisent la lecture pour tous.

## Correction

### Fichier : `src/components/CotisationsCumulAnnuel.tsx`

1. Extraire `isLoading` et `error` du hook `useQuery` pour la requête exercice (ligne 15)
2. Ajouter un état de chargement avec spinner avant le check `!exercice` (ligne 198)
3. Afficher un message d'erreur explicite si `error` est présent
4. Conserver le message "Aucun exercice actif" uniquement quand `isLoading === false && !exercice`

```typescript
// Ligne 15: ajouter isLoading et error
const { data: exercice, isLoading: loadingExercice, error: errorExercice } = useQuery({ ... });

// Ligne 198: remplacer le check
if (loadingExercice) {
  return (
    <Card>
      <CardContent className="py-8 text-center text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
        Chargement de l'exercice...
      </CardContent>
    </Card>
  );
}

if (errorExercice) {
  return (
    <Card>
      <CardContent className="py-8 text-center text-destructive">
        Erreur lors du chargement de l'exercice. Veuillez rafraîchir la page.
      </CardContent>
    </Card>
  );
}

if (!exercice) {
  return (
    <Card>
      <CardContent className="py-8 text-center text-muted-foreground">
        Aucun exercice actif. Veuillez activer un exercice dans Administration &gt; Configuration E2D &gt; Exercices.
      </CardContent>
    </Card>
  );
}
```

5. Ajouter `Loader2` à l'import lucide-react (ligne 7)

