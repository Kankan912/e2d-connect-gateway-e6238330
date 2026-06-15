## Problème

La page `/dashboard/admin/cotisations` n'affiche qu'une seule carte (« Cumul annuel par membre »). Il manque le **tableau de détail mensuel** (membres × mois) qui permet de voir, pour chaque membre et chaque mois de l'exercice actif, le montant attendu, le montant payé et le statut. C'est ce tableau opérationnel que les administrateurs utilisent pour suivre les paiements mois par mois.

## Plan

### 1. Restructurer `src/pages/admin/CotisationsAdmin.tsx` avec des onglets

Ajouter un composant `Tabs` shadcn avec deux onglets :

- **Cumul annuel** — conserve l'actuel `<CotisationsCumulAnnuel exerciceId={...} />`
- **Détail mensuel** — nouveau composant `<CotisationsDetailMensuel exerciceId={...} />`

Le sélecteur d'exercice reste partagé en haut de page.

### 2. Créer `src/components/CotisationsDetailMensuel.tsx`

Tableau matriciel **Membres × Mois** pour l'exercice sélectionné (ou actif).

**Données requises** (toutes filtrées sur `exercice_id`) :
- `membres` (actifs, `est_membre_e2d = true`)
- `cotisations_mensuelles_exercice` (montant mensuel personnalisé par membre, `actif = true`)
- `cotisations_types` via `exercices_cotisations_types` filtré sur le type « Cotisation mensuelle » (`actif = true`)
- `cotisations` (toutes lignes liées à l'exercice, avec `date_paiement`, `montant`, `statut`, `type_cotisation_id`, `membre_id`)
- `exercices` pour récupérer `date_debut` / `date_fin` et générer la liste des mois

**Affichage** :
- Colonne fixe : Membre (nom + prénom + badge équipe)
- Une colonne par mois (libellé court ex. `janv. 26`)
- Cellule : montant payé / montant attendu pour le mois, code couleur :
  - vert : payé ≥ attendu
  - orange : paiement partiel
  - rouge : `en_attente` ou non payé alors que le mois est passé
  - gris : mois futur
- Colonne finale : total annuel attendu / payé + progression
- En-tête avec stats globales (réutiliser le style des cards existantes)

**Filtres** :
- Recherche par nom/prénom
- Filtre équipe (jaune/rouge/toutes)
- Filtre statut mensuel (à jour / en retard / complet)

**Performance** :
- Tableau dans un `ScrollArea` horizontal (`overflow-x-auto`) pour gérer 12 colonnes mois + colonnes fixes
- Cellule « sticky » sur la 1re colonne (nom du membre)
- Agréger les `cotisations` côté client par `membre_id` + mois (`date_paiement`) — c'est ce que fait déjà `CotisationsCumulAnnuel`

**Exports** :
- Bouton CSV et PDF (réutiliser le pattern jsPDF + autoTable de `CotisationsCumulAnnuel`)

### 3. Aucune modification base de données

Toutes les données nécessaires existent déjà. Aucun migration SQL.

## Fichiers impactés

- `src/pages/admin/CotisationsAdmin.tsx` (modifié — onglets)
- `src/components/CotisationsDetailMensuel.tsx` (créé)
