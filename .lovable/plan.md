# Finalisation des deux points restants

## 1. Logos : dossier réservé aux administrateurs

Aujourd'hui les logos partent dans l'espace de fichiers partagé du site, au même
endroit que les autres images, sans restriction d'écriture particulière.

Ce qui sera fait :

- Tous les logos seront rangés dans un dossier dédié `logos/<association>/…`.
- Seuls les administrateurs (et les responsables ayant le droit d'écrire sur
  l'association concernée) pourront y déposer, remplacer ou supprimer un fichier.
- La lecture reste publique : les logos continuent de s'afficher instantanément
  sur le site public et dans l'administration, sans lien qui expire.
- Les logos déjà envoyés restent accessibles ; ils continueront de fonctionner
  tels quels, les nouveaux envois iront dans le dossier réservé.
- Un envoi refusé affichera un message clair (« droits insuffisants ») au lieu
  d'un échec silencieux.

## 2. Sous-domaines : préparation et mode d'emploi

L'application sait déjà reconnaître une association à partir d'un sous-domaine
(ex. `phoenix.mondomaine.com`), mais rien ne le vérifie ni ne l'explique.

Ce qui sera fait :

- Vérification automatisée que la reconnaissance par sous-domaine fonctionne, y
  compris les cas à ignorer (www, adresses d'aperçu, adresses IP, `localhost`).
- Dans la fiche association, à côté du champ « sous-domaine » : aperçu de
  l'adresse finale, contrôle du format et signalement des doublons.
- Nouvelle aide dans l'administration décrivant, étape par étape, les réglages à
  faire chez l'hébergeur du domaine (enregistrement DNS générique, certificat,
  domaine à déclarer côté hébergement), avec les valeurs à recopier.
- Le point reste « en attente d'action externe » tant que le domaine générique
  n'est pas configuré : une fois fait, aucune modification d'application ne sera
  nécessaire.

## Détails techniques

- `src/components/branding/LogoUploader.tsx` : préfixe de chemin forcé à
  `logos/<association_id>/`, message d'erreur explicite sur refus RLS.
- Migration : politiques `storage.objects` sur le bucket `site-images` limitées
  au préfixe `logos/` — `SELECT` public, `INSERT/UPDATE/DELETE` réservés via
  `is_admin()` / `has_permission('associations','write')`.
- Pas de nouveau bucket : la création de buckets publics est bloquée par la
  politique de l'espace de travail.
- `src/lib/tenantScope.ts` : tests unitaires Vitest sur `slugFromHost` /
  `resolvePublicSlug`.
- Validation du champ `subdomain` (format `[a-z0-9-]`, unicité) dans
  `AssociationWizard.tsx` et `AssociationsPlatformAdmin.tsx`.
- Documentation : `docs/SOUS_DOMAINES.md` + lien depuis l'écran plateforme.
- Mise à jour de `docs/RAPPORT_CORRECTIONS_2026_09.md`.
