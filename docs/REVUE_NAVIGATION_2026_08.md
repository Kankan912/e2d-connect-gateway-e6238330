# Revue de navigation et cycle de vie des associations — Août 2026

## 1. Objet

Revue complète du code visant à supprimer les causes de rechargements non désirés,
pages blanches, boutons inactifs ou mal câblés, soumissions de formulaires non
contrôlées et redirections incorrectes ; et à couvrir intégralement le cycle de
vie des associations (modification, désactivation, réactivation, suspension,
archivage, suppression logique et physique).

## 2. Tableau de revue

| # | Anomalie détectée | Localisation | Correction appliquée | Statut |
|---|---|---|---|---|
| 1 | Rechargement complet de la page au clic (perte d'état SPA) | `Contact.tsx` (3 boutons), `PretsAdmin.tsx` | Remplacement de `window.location.href` par `<Link>` via `Button asChild` | Corrigé |
| 2 | Bouton « Réessayer » rechargeant tout le navigateur | `NotificationsAdmin.tsx` | `refetch()` de la requête React Query concernée | Corrigé |
| 3 | Boutons d'action sans `type` dans un formulaire → soumission implicite | 55 boutons dans 20 fichiers (CMS, config, caisse, épargnes, comptes rendus…) | Ajout systématique de `type="button"` | Corrigé |
| 4 | `window.confirm` natif (bloquant, non thématisé, non testable) | 10 occurrences (CMS site, tontine, épargnes, comptes rendus, réunions) | Hook `useConfirm()` promisifié + `ConfirmDialog` (AlertDialog) | Corrigé |
| 5 | Page blanche possible en cas d'erreur de rendu d'une route | `App.tsx` | `ErrorBoundary` de second niveau par route (public, auth, portail) | Corrigé |
| 6 | Redirection silencieuse vers `/dashboard` en cas de droits insuffisants (bouton « sans effet » perçu) | `PermissionRoute`, `SuperAdminRoute` | Page `AccesRefuse` explicite ; redirection vers `/auth` uniquement si non authentifié | Corrigé |
| 7 | Association désactivée toujours accessible via URL directe (site public) | `App.tsx` | Garde `PublicSiteGuard` → page `AssociationIndisponible` | Corrigé |
| 8 | Association désactivée toujours accessible via le portail / l'administration | `Dashboard.tsx` | Garde de statut (hors super_admin) → `AssociationIndisponible` | Corrigé |
| 9 | Cycle de vie des associations incomplet en base | Migration SQL | Statuts `actif / desactive / suspendu / archive / supprime`, colonnes `statut_change_le/par`, RPC `set_association_statut`, `hard_delete_association`, `count_association_dependencies` (audit systématique) | Corrigé |
| 10 | Aucune interface de gestion du cycle de vie | `AssociationsPlatformAdmin.tsx` | Recherche, filtres par statut, badges de statut, menu d'actions (`AssociationStatusActions`) avec confirmation et comptage des dépendances | Corrigé |
| 11 | Contenu public d'un tenant non actif encore résolu | `current_association_id()`, `get_public_association()` | Filtrage par statut ; identité minimale seulement pour la page « indisponible » | Corrigé |
| 12 | `ErrorBoundary` forçant un rechargement complet pour revenir au tableau de bord | `ErrorBoundary.tsx` | Option `insideRouter` utilisant la navigation client | Corrigé |

## 3. Composants et hooks introduits

- `src/components/ui/confirm-dialog.tsx` — dialogue de confirmation unifié.
- `src/hooks/useConfirm.tsx` — API promisifiée `await confirm({...})`.
- `src/components/associations/AssociationStatusBadge.tsx` — badge de statut.
- `src/components/associations/AssociationStatusActions.tsx` — menu d'actions du cycle de vie.
- `src/hooks/useAssociationLifecycle.ts` — mutations RPC (statut, suppression, dépendances).
- `src/pages/AccesRefuse.tsx` — accès refusé explicite.
- `src/pages/AssociationIndisponible.tsx` — association non active.

## 4. Règles de cycle de vie

```text
actif ──désactiver──> desactive ──réactiver──> actif
actif ──suspendre───> suspendu  ──réactiver──> actif
desactive/suspendu ──archiver──> archive ──réactiver──> actif
tout statut ──suppression logique──> supprime  (données conservées, accès bloqué)
supprime ──suppression physique──> purge définitive (super_admin, dépendances vérifiées)
```

Toute transition est journalisée (`audit_logs`) avec l'auteur, l'ancien et le
nouveau statut. Les associations non actives sont invisibles côté site public et
côté portail ; seul un super administrateur conserve l'accès à la console.

## 5. Vérifications

- Typage : `tsgo --noEmit` — aucune erreur.
- Tests unitaires : 124 tests passés (41 tests RLS ignorés, nécessitent des identifiants).
- Navigateur : rendu du site public sans erreur console ni page blanche.
- Non vérifié : parcours authentifiés bout en bout (aucune session Supabase
  injectable dans l'environnement de test — projet Supabase externe).

## 6. Suite

Les tests E2E Playwright et le tableau d'états complet de la plateforme se trouvent dans `docs/REVUE_PLATEFORME_2026_08.md`.
