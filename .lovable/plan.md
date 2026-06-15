## Lot 1 — Enrichir Cotisations admin : filtres + export CSV/PDF

### Objectif
Ajouter des filtres (statut, équipe, recherche par nom) et l'export CSV/PDF au tableau de cumul annuel des cotisations.

### Modifications

**1. `src/components/CotisationsCumulAnnuel.tsx`**
- Récupérer `equipe_jaune_rouge` dans la requête `membres-e2d-cumul`.
- Ajouter des états React :
  - `search` (texte) — recherche par prénom/nom.
  - `filtreStatut` — `tous | complet | a_jour | en_cours | en_retard`.
  - `filtreEquipe` — `toutes | jaune | rouge`.
- Appliquer les filtres sur `membresStats` (avant rendu et avant export).
- Ajouter une barre de filtres au-dessus du tableau :
  - `Input` recherche (icône Search).
  - `Select` statut (4 options + Tous).
  - `Select` équipe (Toutes / Jaune / Rouge).
  - 2 boutons : `Export CSV`, `Export PDF`.
- Afficher la colonne **Équipe** (badge couleur) dans le tableau.
- Compteur "X membres affichés / Y total" sous les filtres.

**2. Export CSV**
- Fonction locale `exportCSV()` qui :
  - Génère l'en-tête : `Membre;Équipe;Attendu (FCFA);Payé (FCFA);Reste (FCFA);Progression (%);Statut`.
  - Sérialise les lignes filtrées (séparateur `;`, BOM UTF-8 pour Excel).
  - Déclenche un téléchargement via `Blob` + `URL.createObjectURL`.
  - Nom du fichier : `cotisations_cumul_<exercice.nom>_<YYYY-MM-DD>.csv`.

**3. Export PDF**
- Utilise `jspdf` + `jspdf-autotable` (déjà installés, `jspdf ^3.0.3` selon mémoire).
- Fonction `exportPDF()` :
  - Format A4 paysage.
  - En-tête : titre `Cotisations - Cumul annuel`, sous-titre `Exercice <nom>`, date d'édition.
  - Encadré stats globales (Total attendu, Total payé, Progression).
  - `autoTable` avec mêmes colonnes que CSV, couleurs alternées, en-tête primary.
  - Pied de page : numéro de page.
  - Nom du fichier identique au CSV en `.pdf`.

**4. Petits ajustements UX**
- Désactiver les boutons d'export si `membresStats` est vide.
- Mémoïser la liste filtrée avec `useMemo` pour éviter recalculs inutiles.
- Pas de changement de RLS, de schéma DB, ni de logique business.

### Hors périmètre
- Aucune nouvelle table ou migration.
- Pas de modification des hooks `useCotisations` ni des autres pages.
- Filtre par type de cotisation laissé pour plus tard (le tableau actuel agrège tous les types).

### Détails techniques
- Réutilise `Input`, `Select`, `Button`, `Badge` shadcn.
- Couleurs équipe : `jaune` → `bg-yellow-500/20 text-yellow-700`, `rouge` → `bg-red-500/20 text-red-700`.
- Formatage des montants : `toLocaleString('fr-FR')` + suffixe `FCFA`.
- Imports lazy non nécessaires (composant déjà dans page lazy).

Une fois validé, passage automatique au Lot 2 demandé via message séparé.