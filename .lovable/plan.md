
# Batch 2 : Corrections moyennes

## Points deja OK (pas de modification necessaire)

| # | Point | Raison |
|---|-------|--------|
| 8 | Beneficiaires logique montant individuel | `calculerMontant` est individuel, aucune division par nombre de beneficiaires |
| 9 | Multi-beneficiaires meme mois | DB supporte, UI affiche badge position "1/2" |
| 10 | Drag & drop rang | `reorderBeneficiaires` persiste les rangs correctement |

## Corrections a implementer

### 1. Enrichir messages erreur creation/update membre (#5)
**Fichier** : `src/hooks/useMembers.ts`

- Dans `updateMember`, ajouter un try/catch pour le code SQL `23505` (email duplique) avec message UX clair
- Ajouter un catch generique pour code `23503` (violation FK) avec message explicatif

### 2. Bloquer saisie cotisation si montant non configure (#6)
**Fichier** : `src/components/forms/CotisationSaisieForm.tsx`

- Apres selection du type, verifier si le montant resulte a 0 ou n'existe pas
- Si montant = 0 et type obligatoire : afficher un avertissement "Montant individuel non configure pour ce membre. Veuillez configurer les montants dans la gestion des cotisations mensuelles."
- Desactiver le bouton "Enregistrer" si montant = 0 sur un type obligatoire

### 3. Verification types actives par exercice (#7)
**Fichier** : `src/components/forms/CotisationSaisieForm.tsx`

- Charger les types actives pour l'exercice selectionne via `exercices_cotisations_types`
- Filtrer la liste des types dans le Select pour n'afficher que ceux lies a l'exercice
- Si aucun type lie : afficher un message "Aucun type de cotisation configure pour cet exercice"

### 4. Deverrouiller cotisations a la reouverture de reunion (#11)
**Fichier** : `src/components/ReouvrirReunionModal.tsx`

- Apres le changement de statut (etape 1), ajouter :
  ```
  UPDATE cotisations SET verrouille = false WHERE reunion_id = reunionId
  ```
- Invalider le cache des cotisations apres la mise a jour

### 5. Check coherence presences/cotisations a la cloture (#12)
**Fichier** : `src/components/ClotureReunionModal.tsx`

- Avant la cloture, charger les cotisations enregistrees pour la reunion
- Comparer avec les membres "presents" : si un membre present n'a aucune cotisation, afficher un avertissement (non bloquant) dans le recapitulatif de cloture
- L'avertissement listera les membres concernes avec un badge "Aucune cotisation"

## Section technique - Resume des modifications

| Fichier | Modifications |
|---------|--------------|
| `src/hooks/useMembers.ts` | Catch erreur 23505 dans updateMember, catch 23503 generique |
| `src/components/forms/CotisationSaisieForm.tsx` | Filtrer types par exercice, bloquer si montant = 0 |
| `src/components/ReouvrirReunionModal.tsx` | Ajouter UPDATE cotisations SET verrouille = false |
| `src/components/ClotureReunionModal.tsx` | Avertissement presences sans cotisations |
