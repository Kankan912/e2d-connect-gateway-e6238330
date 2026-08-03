# Audit multi-association + plan de correction

## Ce qui a été vérifié en base et dans le code

- La table `associations` ne contient aujourd'hui que : nom, slug, description, logo, thème, locale, statut, config email/caisse, feature_flags. **Il n'y a aucun champ pour le sigle, les coordonnées, les informations administratives, les responsables ni le domaine / sous-domaine.**
- L'écran « Associations (Plateforme) » permet **uniquement de créer** une association : aucune action de modification n'existe (pas de formulaire d'édition, aucune écriture de mise à jour).
- L'écran « Identité & Thème » ne modifie que deux champs : le logo et les couleurs du thème.
- L'isolation des données est déjà en place sur 102 des 123 tables (colonne d'association + règles d'accès). Les 21 tables restantes sont soit des tables filles (isolées via leur parent), soit des tables de plateforme, soit liées à un utilisateur — sauf `configurations`, `loan_validation_config` et `platform_settings` qui restent à trancher.
- Le site public **ne sait pas quelle association afficher** : aucune résolution par sous-domaine ni par URL, et les écrans de contenu public ne filtrent pas par association. Un seul site est donc servi pour toute la plateforme.
- Aucune extraction de couleurs depuis le logo n'existe dans le projet.

## Tableau de suivi (état réel)

| Module | Fonctionnalité | Problème constaté | État | Correction attendue | Priorité | Dépendances |
|---|---|---|---|---|---|---|
| Plateforme | Modification d'une association | Aucun écran d'édition, création seulement | Non corrigé | Formulaire d'édition complet + enregistrement vérifié | P0 | Champs à ajouter en base |
| Plateforme | Champs d'identité (sigle, coordonnées, infos administratives, responsables) | Champs inexistants en base | Non corrigé | Ajout des colonnes + saisie dans l'écran | P0 | Migration |
| Plateforme | Domaine / sous-domaine | Champ inexistant, aucune résolution | Non corrigé | Champ dédié + résolution du site public | P0 | Migration |
| Portail | Identité & Thème | Ne gère que logo + couleurs, enregistrement désormais contrôlé | Partiellement corrigé | Étendre aux autres informations, portée admin d'association | P1 | Édition association |
| Site public | Isolation par association | Le site public ne filtre pas par association | Non corrigé | Résolution de l'association (sous-domaine ou chemin) + filtrage des contenus | P0 | Champ domaine |
| Création | Environnement automatique (site + portail) | Provisioning crée association, rôles, admin ; ni contenus de site, ni paramètres de portail | Partiellement corrigé | Générer le contenu de site initial et les paramètres du portail | P1 | Migration |
| Création | Logo obligatoire | Logo facultatif à la création | Non corrigé | Logo requis dans le formulaire et côté serveur | P1 | — |
| Charte | Génération des couleurs depuis le logo | Inexistante | Non corrigé | Extraction des couleurs dominantes + proposition modifiable | P1 | Logo obligatoire |
| Charte | Changement de logo ultérieur | Aucune protection | Non corrigé | Demander confirmation avant de régénérer la charte | P2 | Extraction couleurs |
| Modules | Modules activés par association | `feature_flags` existe mais n'est ni éditable ni utilisé pour masquer les menus | Partiellement corrigé | Écran de gestion des modules + application au menu et aux routes | P1 | Édition association |
| Données | Isolation des tables métier | 102/123 tables isolées | Partiellement corrigé | Trancher et isoler `configurations`, `loan_validation_config`, `platform_settings` | P1 | Migration |
| Rôles | Admin d'association limité à son environnement | Règles en place, mais l'édition d'association reste à cadrer | Partiellement corrigé | Droits d'édition limités à la propre association (hors champs plateforme) | P0 | Édition association |

## Plan d'exécution

### Étape 1 — Base de données (P0)
Ajouter à `associations` : sigle, email, téléphone, adresse, ville, pays, site web, numéro d'enregistrement / récépissé, date de création officielle, responsables (liste structurée), sous-domaine et domaine personnalisé, paramètres de portail. Règles d'accès : les administrateurs d'une association peuvent modifier leur propre fiche (hors slug, statut, domaine, modules), le super administrateur modifie tout.

### Étape 2 — Écran de modification (P0)
Ajout d'une action « Modifier » dans la console Plateforme ouvrant un formulaire à onglets : Identité, Coordonnées, Informations administratives, Responsables, Charte graphique, Domaine, Modules. Enregistrement contrôlé (erreur explicite si aucune ligne modifiée) et rafraîchissement immédiat du contexte, du portail et du thème.

### Étape 3 — Isolation du site public (P0)
Résolution de l'association côté site public : sous-domaine (`asso.domaine.tld`), domaine personnalisé, sinon chemin `/a/{slug}`, avec repli sur l'association par défaut. Tous les écrans publics (accueil, activités, galerie, événements, contact, dons, adhésion) filtrent alors sur l'association résolue et appliquent son thème.

### Étape 4 — Provisioning complet (P1)
À la création : logo obligatoire, création automatique du contenu initial du site public (page d'accueil, à-propos, section contact) et des paramètres du portail, en plus des rôles et de l'administrateur déjà créés.

### Étape 5 — Charte graphique depuis le logo (P1)
Extraction des couleurs dominantes du logo dans le navigateur, proposition d'une palette complète (primaire, secondaire, accent, fond, texte, boutons, liens, menus) modifiable avant et après création. Au changement de logo ultérieur, une confirmation est demandée avant de régénérer la palette.

### Étape 6 — Modules activés (P1)
Écran de sélection des modules par association, appliqué au menu du portail et aux routes.

### Étape 7 — Finition isolation (P1)
Traitement des trois tables restantes et vérification finale par contrôle croisé entre deux associations.

## Détails techniques
- Migration SQL sur `public.associations` (nouvelles colonnes, index unique sur sous-domaine et domaine) + politiques de modification pour les administrateurs d'association.
- Fonctions serveur : mise à jour de `provision-association` (logo requis, contenus initiaux, paramètres portail).
- Front : nouveau composant d'édition d'association, hook de résolution de l'association publique, utilitaire d'extraction de couleurs (canvas), extension de `AssociationContext` et du thème.
- Aucune modification de la logique financière.
