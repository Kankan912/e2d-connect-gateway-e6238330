

# Fix: Construction manuelle du calendrier des bénéficiaires

## Constat

Le composant `CalendrierBeneficiairesManager` (accessible dans Administration > Tontine > Calendrier) possède **déjà** toutes les fonctionnalités demandées : ajout manuel, sélection du mois, drag-and-drop, suppression, initialisation automatique, export PDF. Le hook `useCalendrierBeneficiaires.ts` gère toutes les mutations CRUD.

Le problème est double :
1. La page **Réunions** (onglet Bénéficiaires) utilise encore l'ancien composant `CalendrierBeneficiaires.tsx` qui est une vue en lecture seule basée sur `reunion_beneficiaires` (pas sur `calendrier_beneficiaires`).
2. La suppression dans `CalendrierBeneficiairesManager` n'a **pas de confirmation AlertDialog** — elle supprime directement.

## Corrections

### 1. `src/components/config/CalendrierBeneficiairesManager.tsx` — Ajouter confirmation de suppression

- Ajouter un state `deleteTarget` pour stocker l'ID du bénéficiaire à supprimer
- Remplacer l'appel direct `deleteBeneficiaire.mutate(b.id)` par l'ouverture d'un AlertDialog
- Ajouter un AlertDialog de confirmation avec message explicite

### 2. `src/pages/Reunions.tsx` — Remplacer la vue lecture seule par le composant manuel

- Remplacer l'import de `CalendrierBeneficiaires` par `CalendrierBeneficiairesManager`
- Remplacer `<CalendrierBeneficiaires />` par `<CalendrierBeneficiairesManager />` dans l'onglet Bénéficiaires
- L'admin/trésorier verra la version éditable, les autres la version lecture seule (le composant gère déjà les permissions via `isAdmin`)

### 3. Nettoyage optionnel

- L'ancien `CalendrierBeneficiaires.tsx` peut rester en place pour ne pas casser d'éventuelles autres références, mais ne sera plus utilisé dans Reunions.

