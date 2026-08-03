## Objectif

Ajouter dans l'espace administrateur une page **Suivi du programme** qui affiche, sous forme de tableau, l'état d'exécution de chaque phase (2.4 → 6) et de chaque lot (1→5, A, A-bis, B, B-bis, C, P, Q1, Q2, Q3). Données figées dans le code (aucune base), mises à jour à chaque avancement.

## Contenu affiché

**Bandeau de synthèse** — 4 cartes : avancement global (%), éléments terminés, en cours, non démarrés.

**Tableau 1 — Phases plateforme**
Colonnes : Phase, Objet, Statut, Avancement, Preuve (document ou migration de référence).

**Tableau 2 — Lots d'audit et fonctionnels**
Colonnes : Lot, Périmètre, Statut, Avancement, Reste à faire.

**Statuts** : Terminé / En cours / Non démarré, en pastilles colorées (tokens du thème, pas de couleurs en dur).
**Filtres** : recherche texte + filtre par statut, avec un onglet « Tout / Phases / Lots ».
**Reste à faire** : section finale listant les items priorisés P1/P2/P3 (typage strict, découpage des gros fichiers, généralisation de la devise) avec criticité et ordre recommandé.

## Accès

Route `/dashboard/admin/suivi-programme`, protégée comme les autres écrans d'administration (même contrôle de permission que Monitoring), plus une entrée dans le menu latéral admin.

## Détails techniques

- `src/data/programTracking.ts` : source unique de vérité (typée) contenant phases, lots, statuts, avancements et reste à faire — c'est le seul fichier à modifier lors des mises à jour.
- `src/pages/admin/ProgramTrackingAdmin.tsx` : page composée de petits sous-composants (`StatusPill`, cartes de synthèse, tableaux) pour rester sous le seuil de taille fixé par le Lot Q3.
- Route ajoutée dans `src/pages/Dashboard.tsx` via `lazyWithRetry` + `PermissionRoute` + `ErrorBoundary`, entrée de menu dans `src/components/layout/DashboardSidebar.tsx`.
- Composants shadcn existants (Card, Table, Badge, Tabs, Input) ; contenu en français ; padding mobile `p-3 sm:p-6`.
- Aucune migration SQL, aucun appel réseau.
