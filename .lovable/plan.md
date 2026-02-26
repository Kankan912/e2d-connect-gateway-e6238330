

# Plan : Cotisations individuelles — Affichage du montant attendu par membre et correction du modal États

## Analyse du code actuel

Apres analyse exhaustive de tout le code (`CotisationsGridView`, `CotisationCellModal`, `CotisationsEtatsModal`, `CotisationsReunionView`), **aucune logique de "partage", "répartition" ou "montant global" n'existe dans le code**. La recherche textuelle dans les 8 fichiers contenant ces mots confirme qu'ils n'apparaissent que dans des contextes sans rapport (statistiques sportives, bénéficiaires, donations).

Le systeme utilise deja des montants individuels via `cotisations_mensuelles_exercice`. Cependant, **deux problemes concrets provoquent la confusion** :

### Probleme 1 : Le montant individuel attendu est INVISIBLE dans la grille

Dans `CotisationsGridView.tsx`, chaque cellule non payee affiche uniquement un bouton "+" sans aucune indication du montant attendu pour ce membre. L'en-tete de colonne affiche le `montant_defaut` generique (ex: 20 000 FCFA), ce qui donne l'impression que tous les membres paient le meme montant. L'utilisateur ne peut pas savoir combien chaque membre doit individuellement.

### Probleme 2 : Le modal "Etats" ignore les montants mensuels individuels

Dans `CotisationsEtatsModal.tsx` (ligne 118), le calcul du montant attendu utilise uniquement `cotisationsMembres` (table `cotisations_membres`). Il ne consulte jamais `cotisations_mensuelles_exercice` pour les types "Cotisation mensuelle". Resultat : tous les membres s'affichent avec le `montant_defaut` au lieu de leur montant individuel configure.

## Corrections prevues

### Fichier 1 : `src/components/CotisationsGridView.tsx`

**1a — Afficher le montant attendu individuel dans chaque cellule non payee**

Lignes 413-422 : Remplacer le simple bouton "+" par l'affichage du montant attendu + le bouton de saisie :

```
Avant :  [  +  ]
Apres :  20 000 F   (montant individuel de CE membre)
         [  +  ]
```

**1b — Signaler les anomalies dans les cellules payees**

Lignes 394-412 : Quand un paiement a ete effectue, comparer le montant paye au montant attendu individuel. Si different, afficher un indicateur visuel (badge orange "Ecart") dans la cellule de ce membre uniquement.

**1c — Remplacer le montant generique dans l'en-tete de colonne**

Lignes 347-349 : Remplacer `formatFCFA(type.montant_defaut || 0)` par "Individuel" pour les types dont les montants varient par membre, afin de ne pas laisser croire que le montant est unique pour tous.

### Fichier 2 : `src/components/CotisationsEtatsModal.tsx`

**2a — Charger `cotisations_mensuelles_exercice` dans le modal**

Ajouter un `useQuery` pour recuperer les montants mensuels individuels filtres par `exerciceId` (meme pattern que dans `CotisationsGridView` et `CotisationsReunionView`).

**2b — Utiliser les montants individuels dans le calcul `etats`**

Lignes 116-129 : Pour les types "cotisation mensuelle", utiliser `cotisations_mensuelles_exercice` au lieu du fallback `montant_defaut`. Pattern :

```typescript
if (isCotisationMensuelle) {
  const configMensuelle = cotisationsMensuelles?.find(cm => cm.membre_id === membre.id);
  expected = (configMensuelle?.montant ?? type.montant_defaut ?? 0) * multiplier;
} else {
  // Garder la logique existante avec cotisationsMembres
}
```

## Resume

| Fichier | Modification | Impact |
|---|---|---|
| `CotisationsGridView.tsx` | Afficher montant individuel dans chaque cellule + badge anomalie + header "Individuel" | Transparence totale par membre |
| `CotisationsEtatsModal.tsx` | Charger et utiliser `cotisations_mensuelles_exercice` dans le calcul | Montants attendus corrects dans le modal |

## Impact

- Chaque cellule du tableau affiche le montant individuel attendu pour ce membre specifique
- Les ecarts sont signales par membre uniquement, sans aucune notion de repartition
- Le modal "Etats" reflète les montants individuels configures
- Aucune modification de la base de donnees necessaire (la table `cotisations_mensuelles_exercice` existe deja et est deja utilisee par la logique `getMontant`)

