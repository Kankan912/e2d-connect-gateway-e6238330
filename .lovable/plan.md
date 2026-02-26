

# Plan : Filtrer les types de cotisations par exercice dans tous les composants

## Constat

La table `exercices_cotisations_types` et le composant de configuration `ExercicesCotisationsTypesManager` **existent deja**. `CotisationsGridView` et `CotisationSaisieForm` filtrent deja correctement via cette table.

Cependant, **3 composants** ignorent cette table et affichent tous les types obligatoires sans filtrage par exercice :

| Composant | Requete actuelle | Impact |
|---|---|---|
| `CotisationsReunionView.tsx` (l.61-71) | `cotisations_types` WHERE `obligatoire=true` | Bilan reunion affiche des types inactifs |
| `CotisationsCumulAnnuel.tsx` (l.56-66) | `cotisations_types` WHERE `obligatoire=true` | Suivi annuel affiche des types inactifs |
| `CotisationsClotureExerciceCheck.tsx` (l.44-54) | `cotisations_types` WHERE `obligatoire=true` | Cloture verifie des types inactifs |

## Corrections

Pour chacun des 3 fichiers, remplacer la requete directe sur `cotisations_types` par une requete sur `exercices_cotisations_types` filtree par `exercice_id` et `actif=true`, avec JOIN sur `cotisations_types`. Pattern identique a celui deja utilise dans `CotisationsGridView` (lignes 78-95) :

```typescript
const { data, error } = await supabase
  .from('exercices_cotisations_types')
  .select('cotisations_types(id, nom, montant_defaut, obligatoire, type_saisie)')
  .eq('exercice_id', exerciceId)
  .eq('actif', true);
// Extraire les types imbriques
const types = data?.map(d => d.cotisations_types).filter(Boolean);
```

Avec fallback sur la requete directe `cotisations_types` si aucun exercice n'est fourni.

### Fichier 1 : `CotisationsReunionView.tsx`
- Lignes 60-71 : Remplacer la requete `cotisations_types` par `exercices_cotisations_types` filtree par `exerciceId` (deja disponible en prop)
- Ajouter `exerciceId` a la `queryKey`

### Fichier 2 : `CotisationsCumulAnnuel.tsx`
- Lignes 55-66 : Meme remplacement, en utilisant `exercice?.id` (deja disponible)
- Ajouter `exercice?.id` a la `queryKey`

### Fichier 3 : `CotisationsClotureExerciceCheck.tsx`
- Lignes 43-54 : Meme remplacement, en utilisant `exerciceId` (deja disponible en prop)
- Ajouter `exerciceId` a la `queryKey`

## Impact

- Seuls les types actives pour l'exercice concerne apparaissent dans les bilans, suivis et verifications de cloture
- Coherence totale avec la grille de saisie et le formulaire
- Aucune modification de base de donnees necessaire

