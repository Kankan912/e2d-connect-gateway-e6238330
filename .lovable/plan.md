
# Plan global — Lots restants

Suite à la correction de la déconnexion immédiate (Lot 0 terminé), voici les 4 lots restants, à traiter dans l'ordre.

---

## Lot 1 — Finaliser l'onglet "Cotisations admin" (vue globale)

**Objectif** : page `src/pages/admin/CotisationsAdmin.tsx` pleinement fonctionnelle, accessible depuis la sidebar admin.

- Vérifier le routage dans `src/App.tsx` (ou `src/router.tsx`) et l'entrée dans `DashboardSidebar.tsx`.
- Vue tableau de tous les membres × mois de l'exercice actif :
  - Source : `cotisations_mensuelles_exercice` (filtré sur `exercice.actif = true`, conformément à la règle projet).
  - Colonnes : membre, total dû, total payé, reste, statut (à jour / partiel / en retard).
- Filtres : exercice, type de cotisation (via `exercices_cotisations_types.actif = true`), statut, équipe (`equipe_jaune_rouge`), filtre `est_membre_e2d`.
- Actions : export CSV/PDF (jsPDF ^3.0.3), accès rapide à la fiche cotisation du membre.
- Permissions : `has_permission('cotisations', 'read')` côté UI + RLS `is_admin()` côté DB.
- Critère d'acceptation : un admin voit la grille complète, peut filtrer, exporter, et cliquer sur un membre.

## Lot 2 — Pages membre qui ne chargent pas

**Objectif** : corriger les pages côté membre signalées en panne (Mes cotisations, Demande de prêt, etc.).

- Inventaire à faire en début de lot : parcourir `src/pages/membre/**` + routes `/mes-*` et vérifier chargement (console + network).
- Cibles confirmées :
  - **Mes cotisations** (`usePersonalData` / `useCotisations`) : vérifier que la requête utilise bien `cotisations_mensuelles_exercice` et `est_membre_e2d`.
  - **Demande de prêt** (`useLoanRequests`) : vérifier workflow multi-étapes configurable, RPC de déboursement, et qu'aucun blocage RLS/permission ne casse l'affichage initial.
- Standardiser la gestion d'erreur : `catch (error: unknown)`, extraction via `data?.error`, fallback UI (skeleton / message), wrapping avec `lazyWithRetry` si import dynamique.
- Critère d'acceptation : chaque page membre charge sans écran blanc ; erreurs affichées proprement.

## Lot 3 — Pages admin Finance, Réunions, Sport

**Objectif** : audit + correctifs ciblés des sections admin lourdes.

- **Finance** :
  - Soldes via `get_solde_caisse()` RPC (jamais recalculé côté client).
  - Aides : vérifier que passage en `alloue` déclenche bien la dépense `fond_caisse_operations`.
  - Prêts : "reste à payer" via `prets_reconductions.interet_mois`, priorité de statut respectée (Remboursé > Retard > Reconduit > Partiel > En cours).
  - Prêt prêtable : 80 % du fond − encours.
- **Réunions** :
  - Workflow clôture (génère sanctions, ne bloque pas si email échoue).
  - Réouverture `terminee → en_cours` (déverrouillage + cleanup).
- **Sport** :
  - Matchs E2D : filtrage joueurs sur `est_membre_e2d = true`.
  - Sync `site_events` uniquement si `statut_publication = 'publie'`.
  - Assets `sport-logos` + thumbnail.
- Pour chaque page : vérifier permissions granulaires, états de chargement, gestion d'erreur, et performances (pagination/tri serveur si > 100 lignes).

## Lot 4 — Vérification générale (affichage & performances)

**Objectif** : passe transverse de qualité.

- Parcourir toutes les routes principales en `admin` et `membre`, relever console + network errors.
- Vérifier responsive mobile (containers `p-3 sm:p-6`).
- Vérifier ErrorBoundaries (App + Dashboard) + `lazyWithRetry` sur toutes les routes dynamiques.
- Vérifier logger : `src/lib/logger.ts` partout, pas de `console.log` debug en prod.
- Vérifier i18n / formatage FCFA partout.
- Linter Supabase (`supabase--linter`) + `tsc --noEmit` finaux.
- Livrable : court rapport listant ce qui a été corrigé et ce qui reste éventuellement à traiter dans un lot futur.

---

## Ordre d'exécution proposé

1. Lot 1 (livre rapidement une fonctionnalité visible).
2. Lot 2 (débloque les membres en production).
3. Lot 3 (audit admin, plus volumineux).
4. Lot 4 (passe finale).

Chaque lot fera l'objet d'un message séparé en mode build, avec son propre récap de fichiers modifiés et vérifications.
