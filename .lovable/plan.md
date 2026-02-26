

# Fix: Tableau des cotisations vide lors de la sélection d'une réunion

## Analyse

Après investigation approfondie, j'ai identifié plusieurs problèmes potentiels :

1. **Filtre d'exercice par défaut masque les réunions** : L'exercice actif est "2026-2027" (dates 2026-07-11 à 2027-06-12), mais toutes les réunions `en_cours` datent de 2025 (exercice 2025-2026, clôturé). Le filtre par défaut ne montre donc aucune réunion.

2. **Pas de gestion d'erreur sur les requêtes membres/types** : `CotisationsGridView` ne capture pas les erreurs de requête — si une requête échoue silencieusement, le tableau apparaît vide sans message.

3. **Pas de message "aucun membre"** : Si la liste membres est vide (RLS, erreur), le tableau affiche juste un corps vide sans explication.

## Corrections prévues

### Fichier 1 : `src/components/CotisationsGridView.tsx`

- Extraire `error` des hooks `useQuery` pour membres et types
- Ajouter un message d'état vide si `membres` est vide après chargement : "Aucun membre actif trouvé"
- Ajouter un message d'erreur si les requêtes échouent
- Afficher le nombre de membres trouvés dans le header pour diagnostic

### Fichier 2 : `src/pages/Reunions.tsx` (CotisationsTabContent)

- Modifier la logique de pré-sélection de l'exercice : au lieu de toujours sélectionner l'exercice actif, détecter l'exercice contenant des réunions `en_cours` et le pré-sélectionner
- Si aucune réunion n'existe dans l'exercice actif, basculer automatiquement sur le dernier exercice contenant des réunions
- Afficher un avertissement si l'exercice sélectionné est clôturé ("Exercice clôturé — saisie en lecture seule")

## Détail technique

### CotisationsGridView — gestion erreurs et états vides

```typescript
// Extraire error des queries
const { data: types, isLoading: loadingTypes, error: errorTypes } = useQuery({ ... });
const { data: membres, isLoading: loadingMembres, error: errorMembres } = useQuery({ ... });

// Après le check isLoading, ajouter :
if (errorTypes || errorMembres) {
  return <Card><CardContent>Erreur lors du chargement des données...</CardContent></Card>;
}

// Dans le TableBody, après le map des membres :
if (!membres || membres.length === 0) {
  return <TableRow><TableCell colSpan={...}>Aucun membre actif trouvé</TableCell></TableRow>;
}
```

### Reunions.tsx — pré-sélection intelligente de l'exercice

Modifier le `useEffect` (lignes 319-324) pour :
1. Chercher d'abord l'exercice actif
2. S'il n'a aucune réunion dans sa plage de dates, chercher l'exercice contenant la réunion `en_cours` la plus récente
3. Utiliser cet exercice comme défaut

```typescript
useEffect(() => {
  if (selectedExercice === "__init__" && exercices?.length) {
    const actif = exercices.find(e => e.statut === 'actif');
    // Vérifier si l'exercice actif contient des réunions
    const actifHasReunions = actif && reunions.some(r => 
      r.date_reunion >= actif.date_debut && r.date_reunion <= actif.date_fin
    );
    if (actifHasReunions) {
      setSelectedExercice(actif.id);
    } else {
      // Trouver l'exercice de la réunion en_cours la plus récente
      const enCoursReunion = reunions.find(r => r.statut === 'en_cours');
      if (enCoursReunion) {
        const matchingExercice = exercices.find(e => 
          enCoursReunion.date_reunion >= e.date_debut && 
          enCoursReunion.date_reunion <= e.date_fin
        );
        setSelectedExercice(matchingExercice?.id || actif?.id || "all");
      } else {
        setSelectedExercice(actif?.id || "all");
      }
    }
  }
}, [exercices, selectedExercice, reunions]);
```

