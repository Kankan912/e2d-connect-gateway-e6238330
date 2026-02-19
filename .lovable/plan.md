
# Ajout du FCFA comme devise de don

## Contexte

Le module de dons supporte plusieurs devises (EUR, USD, GBP, CAD, CHF). L'objectif est d'ajouter le FCFA et d'en faire la devise par défaut, tout en conservant les autres devises pour les donateurs internationaux.

## Fichiers à modifier

---

### 1. `src/types/donations.ts`

**Problème** : Le type `DonationCurrency` ne contient pas `'FCFA'`. La constante `CURRENCIES` non plus.

**Correction** :
- Ajouter `'FCFA'` au type union `DonationCurrency`
- Ajouter `{ value: 'FCFA', label: 'Franc CFA', symbol: 'FCFA' }` dans le tableau `CURRENCIES`, en première position

---

### 2. `src/lib/payment-utils.ts`

**Problème** : La constante `CURRENCIES` est dupliquée ici avec les mêmes entrées sans FCFA. La fonction `formatAmount` utilise `€` comme symbole de fallback. Les labels de `PRESET_AMOUNTS` affichent `€`.

**Correction** :
- Ajouter `{ value: 'FCFA', label: 'Franc CFA', symbol: 'FCFA' }` en première position dans `CURRENCIES`
- Changer le fallback de `formatAmount` de `'€'` vers `'FCFA'`
- Mettre à jour les labels de `PRESET_AMOUNTS` pour afficher des montants en FCFA cohérents (ex : 1 000, 5 000, 10 000, 25 000, 50 000 FCFA)

---

### 3. `src/pages/Don.tsx`

**Problème** : La devise par défaut est `'EUR'`.

**Correction** :
- Changer `useState<DonationCurrency>('EUR')` en `useState<DonationCurrency>('FCFA')`

---

## Résultat attendu

| Élément | Avant | Après |
|---|---|---|
| Devise par défaut | EUR | FCFA |
| Liste des devises | EUR, USD, GBP, CAD, CHF | FCFA (1er), EUR, USD, GBP, CAD, CHF |
| Montants prédéfinis | 10€, 25€... | 1 000 FCFA, 5 000 FCFA... |
| Fallback formatAmount | € | FCFA |

## Note technique

La colonne `currency` de la table `donations` en base de données est de type `text`, pas un enum SQL — l'ajout de `'FCFA'` ne nécessite donc **aucune migration SQL**.
