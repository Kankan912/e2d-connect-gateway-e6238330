

# Plan : Service de Calcul Centralise pour les Prets

## Probleme identifie

L'ecart de "Reste a payer" entre la liste (14 256,25 FCFA) et le detail (35 125 FCFA) provient de **4 formules de calcul differentes** reparties dans le code :

| Composant | Formule actuelle | Resultat (Guillaume Toto) |
|---|---|---|
| `PretHistoriqueComplet` | `capital + interetInitial + SUM(reconductions.interet_mois)` | **55 125** (correct) |
| `PretDetailsModal` | `capital + interetInitial + (montant*taux/100/12) * nbRecon` | **52 708** (faux — divise par 12) |
| `PretsAdmin` (liste) | `montant_total_du` depuis la DB | Depend de la valeur stockee |
| `PretsPaiementsManager` | `montant_total_du` depuis la DB | Idem |
| `pret-pdf-export` | `montant_total_du` depuis la DB | Idem |

Le bug principal est dans `PretDetailsModal.tsx` ligne 81-82 : `interetMensuel = (montant * taux/100) / 12` qui divise l'interet par 12 sans raison valable. Les composants qui lisent `montant_total_du` depuis la DB dependent d'une valeur qui a pu etre mal calculee lors d'un paiement ou d'une reconduction.

## Solution

Creer un service centralise `pretCalculsService.ts` et l'utiliser dans les 5 fichiers concernes.

## Actions

### 1. Creer `src/lib/pretCalculsService.ts`

Service centralise avec :
- `calculerResumePret()` : calcul unique du totalDu, resteAPayer, progression
- Priorite aux donnees reelles de reconductions (`prets_reconductions.interet_mois`) quand disponibles
- Fallback sur la formule composee quand l'historique n'est pas charge
- Interfaces typees `PretCalculs`, `Paiement`, `Reconduction`

### 2. Modifier `PretDetailsModal.tsx`

Remplacer les lignes 78-96 (calcul manuel avec la formule fausse `/12`) par un appel a `calculerResumePret()` avec les donnees `pret`, `paiements`, `reconductions` deja chargees par React Query.

### 3. Modifier `PretHistoriqueComplet.tsx`

Remplacer les lignes 80-84 (calcul local) par un appel a `calculerResumePret()`. Le resultat sera identique (cette formule etait deja correcte), mais cela garantit la coherence.

### 4. Modifier `PretsAdmin.tsx`

Remplacer `calculerTotalDu()` et `calculerSoldeRestant()` (lignes 94-110) par `calculerResumePret()`. Necessitequote de charger les reconductions pour chaque pret (soit via une sous-requete, soit en utilisant les champs `interet_initial` et `reconductions` deja disponibles dans la requete principale).

### 5. Modifier `PretsPaiementsManager.tsx`

Remplacer le calcul `totalDu` (ligne 98) et `montantRestant` (ligne 104) par `calculerResumePret()` au lieu de lire `montant_total_du` directement depuis la DB.

### 6. Modifier `pret-pdf-export.ts`

Remplacer le calcul local (lignes 109-113) par `calculerResumePret()`.

## Details techniques

La formule correcte est :
```
totalInterets = interetInitial + SUM(reconductions[].interet_mois)
totalDu = capital + totalInterets
resteAPayer = totalDu - SUM(paiements[].montant_paye)
```

Quand l'historique des reconductions n'est pas disponible, le fallback utilise les champs de la table `prets` :
```
totalInterets = interet_initial + (dernier_interet - interet_initial) si reconductions > 0
```

Le service ne modifie aucune donnee en base. Il calcule dynamiquement a partir des donnees chargees.

## Fichiers

| Fichier | Action |
|---|---|
| `src/lib/pretCalculsService.ts` | Creer (service centralise) |
| `src/components/PretDetailsModal.tsx` | Remplacer calculs lignes 78-96 |
| `src/components/PretHistoriqueComplet.tsx` | Remplacer calculs lignes 80-84 |
| `src/pages/admin/PretsAdmin.tsx` | Remplacer `calculerTotalDu`/`calculerSoldeRestant` lignes 94-110 |
| `src/components/PretsPaiementsManager.tsx` | Remplacer calculs lignes 76-108 |
| `src/lib/pret-pdf-export.ts` | Remplacer calculs lignes 109-113 |

