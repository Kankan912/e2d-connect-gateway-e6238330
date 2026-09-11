# Finalisation des points restants (associations)

Quatre points restent ouverts après les corrections du 3 août. Trois sont réalisables ici ; le quatrième dépend d'une action chez votre hébergeur.

## 1. Ajouter l'espagnol

Aujourd'hui l'application propose seulement le français et l'anglais (fichiers de traduction `fr` et `en`, quatre thèmes : général, finances, administration, site public).

- Créer les quatre fichiers de traduction espagnols en reprenant toutes les clés existantes.
- Déclarer `es` dans la liste des langues prises en charge et l'ajouter au sélecteur de langue.
- Le proposer à la création d'association (assistant) et dans l'édition ; la langue principale de l'association est déjà appliquée automatiquement à l'ouverture, elle fonctionnera donc aussitôt.

## 2. Espace de stockage dédié aux logos

Les logos partent actuellement dans l'espace partagé `site-images`.

- Créer un espace `association-logos` en lecture publique.
- Écriture et suppression réservées aux administrateurs de l'association et aux super administrateurs.
- Faire pointer l'envoi de logo vers ce nouvel espace ; les logos déjà en place restent valides (aucune migration de fichiers, les anciennes adresses continuent de fonctionner).

## 3. Site de l'association Phoenix

Vérifié : Phoenix n'a aucune ligne de contenu (configuration, bandeau d'accueil, présentation, activités), son site public est donc vide.

- Créer pour Phoenix le jeu de contenus par défaut identique à celui qu'un nouveau tenant reçoit aujourd'hui : configuration du site, bandeau d'accueil, bloc de présentation, section activités.
- Textes neutres reprenant le nom de l'association, modifiables ensuite depuis l'administration du site.

## 4. Sous-domaines réels — hors application

La colonne, le contrôle de disponibilité et le repli par `/s/:slug` existent déjà. Faire répondre `phoenix.mondomaine.com` demande de déclarer un domaine générique (`*.mondomaine.com`) chez votre hébergeur et de le rattacher au projet. Une fois cela fait, aucun développement supplémentaire n'est nécessaire : la résolution par sous-domaine est déjà codée. Ce point reste donc ouvert de votre côté.

## Détails techniques

- i18n : `src/i18n/index.ts` (`SUPPORTED_LANGS`), nouveaux `src/i18n/locales/es/{common,finance,admin,site}.json`, `LanguageSwitcher`, listes de langues de `AssociationWizard.tsx` et de l'écran d'édition plateforme.
- Stockage : création du bucket via l'outil dédié + politiques sur `storage.objects` basées sur `is_admin_of()` / `is_super_admin()` ; `src/components/branding/LogoUploader.tsx` change de bucket (`site-images` → `association-logos`).
- Phoenix (`77b0273a-1772-4fb7-bcdc-ac8405ea6752`) : insertion de données dans `site_config`, `site_hero`, `site_about`, `site_activities` (opération de données, pas de changement de structure).
- Vérification finale : contrôle de types, ouverture de `/s/phoenix` et bascule vers `/s/e2d`, envoi d'un logo, bascule de langue en espagnol.
