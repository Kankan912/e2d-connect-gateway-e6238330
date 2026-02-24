

# Plan : Corriger le filtre d'etat et la colonne Reste des prets

## Problemes identifies

### 1. Colonne "Reste" incorrecte
Ligne 540 : `const totalDu = pret.montant_total_du || calculerTotalDu(pret)` — priorite donnee a `montant_total_du` (valeur DB potentiellement obsolete) au lieu d'utiliser systematiquement le service centralise. Meme probleme ligne 554 pour "Total du".

De plus, la requete principale (lignes 59-74) ne charge ni `prets_paiements` ni `prets_reconductions`, donc `calculerResumePret` utilise le fallback compose au lieu des donnees reelles. C'est la source de l'ecart.

### 2. Filtre d'etat defaillant
`getEffectiveStatus` (lignes 259-270) a un probleme de priorite :
- Ligne 266 : `paye > 0 && paye < totalDu` retourne `partiel` **avant** de verifier `en_retard`
- Un pret en retard avec un paiement partiel est affiche comme "Partiel" au lieu de "En retard"
- Un pret reconduit avec un paiement partiel est affiche comme "Partiel" au lieu de "Reconduit"
- Le filtre "En retard" ne trouve donc aucun pret (0 resultats dans la capture)

## Corrections

### Fichier : `src/pages/admin/PretsAdmin.tsx`

**Action 1 — Charger paiements et reconductions dans la requete principale**

Ajouter au `.select()` (ligne 64) :
```
prets_paiements(*),
prets_reconductions(*)
```

Cela permet a `calculerResumePret` d'utiliser les donnees reelles au lieu du fallback.

**Action 2 — Supprimer toute reference a `montant_total_du` pour l'affichage**

Lignes 540-541 et 554 : remplacer par un appel direct a `calculerResumePret` avec les paiements et reconductions charges. Ne plus utiliser `pret.montant_total_du` pour le calcul d'affichage.

**Action 3 — Corriger l'ordre de priorite dans `getEffectiveStatus`**

Nouvel ordre :
1. `rembourse` si paye >= totalDu
2. `en_retard` si echeance depassee et pas rembourse (que ce soit partiel ou non)
3. `reconduit` si reconductions > 0
4. `partiel` si paye > 0
5. `en_cours` par defaut

```typescript
const getEffectiveStatus = (pret: any) => {
  const calculs = calculerResumePret(pret, pret.prets_paiements, pret.prets_reconductions);
  const echeance = new Date(pret.echeance);
  const now = new Date();

  if (calculs.totalPaye >= calculs.totalDu && calculs.totalDu > 0) return 'rembourse';
  if (echeance < now) return 'en_retard';
  if (pret.reconductions > 0) return 'reconduit';
  if (calculs.totalPaye > 0) return 'partiel';
  return 'en_cours';
};
```

**Action 4 — Uniformiser le rendu de la colonne "Reste" et "Total du"**

Dans le `map` du tableau (ligne 537+), utiliser un seul appel a `calculerResumePret` avec les donnees jointes :
```typescript
const calculs = calculerResumePret(
  pret,
  pret.prets_paiements || [],
  pret.prets_reconductions || []
);
```

Puis utiliser `calculs.totalDu` et `calculs.resteAPayer` directement.

**Action 5 — Mettre a jour les statistiques du dashboard**

Les lignes 339-350 (stats) utilisent `getEffectiveStatus` et `calculerTotalDu` — elles beneficieront automatiquement des corrections ci-dessus car elles appellent les memes fonctions. Verifier que `montantRestant` (ligne 345) utilise aussi `calculerResumePret` au lieu de `calculerTotalDu`.

## Fichiers modifies

| Fichier | Modification |
|---|---|
| `src/pages/admin/PretsAdmin.tsx` | Requete enrichie + getEffectiveStatus corrige + colonne Reste via service centralise |

## Impact
- Le filtre "En retard" affichera correctement les prets en retard (meme partiellement payes)
- La colonne "Reste" utilisera les reconductions reelles au lieu du fallback compose
- Coherence garantie entre liste, detail et PDF

