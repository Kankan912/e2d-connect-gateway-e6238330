# Revue de navigation et cycle de vie des associations

Objectif : supprimer les rechargements involontaires, les pages blanches et les boutons inertes, puis compléter la gestion du cycle de vie des associations (modifier / désactiver / réactiver / archiver / supprimer logiquement) avec contrôles serveur et journal d'audit.

## Constat (vérifié dans le code et la base)

- 4 rechargements complets déclenchés par des boutons : `ErrorBoundary` (Actualiser + `window.location.href`), `NotificationsAdmin` ligne 212, `PretsAdmin` ligne 471, `Contact.tsx` (3 boutons vers /auth, /adhesion, /don).
- 11 `window.confirm` natifs restants (réunions, épargnes, site public : partenaires, hero, galerie, événements, activités, tontine, compte-rendu) alors que la règle projet impose `AlertDialog`.
- Aucun `type="button"` explicite dans le projet (~500 boutons) : tout bouton placé dans un `<form>` sans `type` soumet le formulaire. 32 fichiers contiennent des `<form>`.
- Table `associations` : colonne `statut` (texte, non nul), seule valeur utilisée aujourd'hui `actif` (2 lignes). L'écran plateforme ne propose que l'édition et un badge ; pas d'action désactiver / réactiver / supprimer.
- `AssociationContext` filtre déjà `statut = 'actif'` pour la liste des associations d'un utilisateur, mais rien ne bloque l'accès direct par URL ni le site public d'une association désactivée.
- Aucun garde-fou global : pas de page « accès refusé », pas d'écran « association indisponible », pas d'ErrorBoundary de secours autour des routes publiques.

## Étape 1 — Navigation et rechargements

- Remplacer tous les `window.location` de navigation par `useNavigate` / `<Link>` (Contact, PretsAdmin, ErrorBoundary → bouton Dashboard).
- Conserver `location.reload()` uniquement dans `lazyWithRetry` (récupération de chunk) et dans le bouton « Actualiser » de l'ErrorBoundary, qui est un rechargement voulu.
- Remplacer le bouton « Actualiser » de `NotificationsAdmin` par une invalidation React Query.
- Passer en revue les 32 fichiers contenant un `<form>` : ajouter `type="button"` sur tout bouton non soumetteur (Annuler, Fermer, Ajouter une ligne, Étape suivante/précédente des assistants), `type="submit"` sur le bouton d'envoi, et garantir `onSubmit` avec `preventDefault` (via `handleSubmit` de react-hook-form ou manuel).
- Désactiver les boutons de soumission pendant l'exécution (`disabled={isPending}` + libellé de chargement) là où ce n'est pas déjà fait, pour bloquer les doubles soumissions.

## Étape 2 — Zéro page blanche

- Ajouter des ErrorBoundary de second niveau : autour des routes publiques (`/`, `/s/:slug`, événements, albums) et autour de chaque zone de contenu du Dashboard (déjà partiellement présent) — chaque frontière garde un bouton Retour + Réessayer.
- Créer une page `AccesRefuse` réutilisée par `PermissionRoute`, `SuperAdminRoute` et les routes tenant, au lieu d'une redirection silencieuse vers `/dashboard`.
- Uniformiser les états `chargement / vide / erreur` sur les écrans qui rendent directement `data.map(...)` sans garde.
- Journaliser toute erreur capturée via `logger.error` (déjà branché sur Sentry).

## Étape 3 — Statuts d'association (base de données)

Migration :

- Contrainte de valeurs sur `associations.statut` : `actif`, `desactive`, `suspendu`, `archive`, `supprime`.
- Colonnes `desactive_le`, `desactive_par`, `motif_statut`, `supprime_le`.
- Fonctions `SECURITY DEFINER` réservées au super admin : `set_association_statut(_id, _statut, _motif)` et `soft_delete_association(_id, _motif)`, qui écrivent dans `audit_logs` (action, association, utilisateur, ancien statut, nouveau statut, horodatage, résultat).
- Fonction `assert_association_active()` utilisée par `current_association_id()` / les politiques d'accès afin qu'une association non active ne renvoie aucune donnée, même en forçant l'URL.
- `get_public_association(_slug)` renvoie le statut et l'identité minimale (nom, logo, contact) pour permettre l'affichage de la page d'indisponibilité, sans exposer le contenu du site.
- Suppression définitive : RPC séparée qui refuse l'opération si des enregistrements liés existent (membres, cotisations, réunions, prêts, sanctions, opérations de caisse, contenus site, notifications, journaux) et retourne le décompte des blocages.

## Étape 4 — Écran plateforme des associations

Dans `AssociationsPlatformAdmin` :

- Colonne statut avec badges distincts et filtre par statut + recherche.
- Actions par ligne : Voir, Modifier, Désactiver, Réactiver, Archiver, Supprimer (logique), Supprimer définitivement (super admin uniquement), chacune conditionnée au statut courant et aux droits.
- Chaque action sensible passe par un `AlertDialog` reprenant les messages de confirmation demandés, puis un toast de succès ou d'échec explicite, puis rafraîchissement de la liste sans rechargement de page.
- Le dialogue « Modifier » couvre nom, sigle, description, coordonnées, logo, langue, modèle de site, charte graphique, sous-domaine, statut ; enregistrement en base et application immédiate au thème courant si l'association éditée est celle active.

## Étape 5 — Blocage d'une association désactivée

- Site public : `PublicAssociationContext` charge le statut ; si l'association n'est pas active, rendu d'un écran `AssociationIndisponible` (logo, nom, message officiel, contact si renseigné, bouton retour accueil, bouton contact) au lieu du site.
- Portail / administration : garde de route qui redirige vers le même écran tant que l'association sélectionnée n'est pas active ; l'accès direct à une URL interne est donc impossible.
- Base : les politiques et fonctions de l'étape 3 refusent les données, ce qui ferme le contournement par appel API direct.

## Étape 6 — Remplacement des confirmations natives

Convertir les 11 `window.confirm` restants en `AlertDialog`, avec message de conséquence et état de chargement.

## Étape 7 — Vérification et livrable

- Parcours Playwright : création, modification, désactivation, accès direct par URL à une association désactivée, réactivation, suppression logique, tentative sans droit, navigation dans les principaux modules avec capture des erreurs console.
- Tests unitaires sur les nouvelles gardes de statut et sur les helpers de navigation.
- Livrable `docs/REVUE_NAVIGATION_2026_08.md` contenant le tableau demandé : Module / Page ou composant / Bouton ou action / État / Dysfonctionnement / Cause technique / Correction / Test / Résultat.

## Détails techniques

- Nouveaux fichiers prévus : `src/pages/AccesRefuse.tsx`, `src/pages/AssociationIndisponible.tsx`, `src/components/associations/AssociationStatusActions.tsx`, `src/components/associations/AssociationStatusBadge.tsx`, `src/hooks/useAssociationLifecycle.ts`.
- Les mutations de statut passent exclusivement par les RPC `SECURITY DEFINER` (jamais d'`update` direct depuis le client), ce qui garantit la trace d'audit.
- Aucune donnée n'est supprimée lors d'une désactivation ou d'une suppression logique ; seule la RPC de suppression définitive, réservée au super admin et bloquée en présence de dépendances, détruit des lignes.

## Portée

La revue systématique des ~500 boutons est traitée par vagues de modules (associations et plateforme, finances, réunions, sport, site public, portail membre) plutôt qu'en une passe unique, afin que chaque vague soit vérifiable. Si vous préférez démarrer par un module précis, indiquez-le.
