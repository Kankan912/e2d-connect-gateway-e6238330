# Audit du module « Associations » et plan de correction

## Ce qui a été vérifié en base et dans le code

- Table `associations` : colonnes existantes = `id, nom, description, slug, logo_url, theme_tokens, email_config, caisse_config, locale, feature_flags, statut, created_at, updated_at`. 5 règles d'accès en place (lecture, modification, création, suppression, service). 2 associations : `e2d` et `phoenix`, toutes deux avec `theme_tokens` **vide**.
- 1 seul compte super administrateur existe.
- Écran « Associations (Plateforme) » : formulaire de **création uniquement** (slug, nom, description, URL de logo, locale, admin initial). Aucun bouton d'édition, aucune suppression, aucun assistant multi-étapes.
- Écran « Identité & Thème » : modifie seulement `logo_url` et 6 jetons de thème (primary, secondary, accent, radius, currency_code, locale) de l'association courante. Pas de nom, sigle, adresse, contacts, modèle, langue.
- Les tables de contenu (`site_config`, `site_hero`, `site_events`, `site_gallery`, `site_about`, `site_activities`, `site_partners`, `cms_pages`, `cms_sections`, `membres`, `profiles`, `user_roles`, `smtp_config`) possèdent bien `association_id` — l'isolation base de données est en place.
- **Le site public n'est pas multi-tenant** : les routes (`/`, `/don`, `/adhesion`, `/evenements/:id`…) n'ont ni slug ni sous-domaine, et `useSiteContent` interroge `site_hero` sans filtre d'association. Un visiteur anonyme n'a donc aucun tenant résolu.
- i18n : 2 langues seulement (fr, en), langue détectée par navigateur/localStorage, **jamais** initialisée depuis `associations.locale`.
- Aucun champ ni écran pour : sigle, adresse, coordonnées, sous-domaine, modèle de site. Aucun modèle de site n'existe dans le code. Aucune extraction de couleurs depuis le logo. Aucun envoi de fichier logo (URL saisie à la main).

## Tableau d'état

| Module | Fonctionnalité | État | Manquement constaté | Correction attendue | Priorité |
|---|---|---|---|---|---|
| Associations | Création (assistant 7 étapes) | Partiel | Formulaire unique en modale, pas d'étapes, pas de récapitulatif | Assistant multi-étapes avec récapitulatif et validation finale | P1 |
| Associations | Modification après création | Absent | Aucun écran d'édition côté plateforme | Écran d'édition complet (nom, sigle, description, contacts, adresse, logo, langue, couleurs, modèle, sous-domaine, responsables) | P0 |
| Associations | Champs d'identité (sigle, adresse, coordonnées, responsables) | Absent | Colonnes inexistantes en base | Ajout des colonnes + formulaires | P0 |
| Associations | Suppression / désactivation | Absent | Aucune action de statut dans l'écran plateforme | Activation / désactivation avec confirmation | P2 |
| Identité visuelle | Import du logo | Absent | Seule une URL peut être saisie | Envoi de fichier vers un espace de stockage dédié, avec aperçu | P0 |
| Identité visuelle | Charte générée depuis le logo | Absent | Aucune extraction de couleurs | Extraction des couleurs dominantes et proposition primaire/secondaire/accent/boutons/menus/titres/fonds + contrôle de lisibilité | P1 |
| Identité visuelle | Application de la charte partout | Partiel | Les jetons sont posés en variables `--tenant-*` mais non consommés par les composants ni par les pages publiques et de connexion | Brancher les jetons sur le thème global (admin, portail, site, page de connexion, documents) | P1 |
| Identité visuelle | Édition manuelle des couleurs | Partiel | 3 couleurs seulement, sans aperçu | Palette complète éditable avec aperçu en direct | P2 |
| Site public | Isolation par association | Absent | Requêtes publiques sans filtre d'association, pas de résolution de tenant | Résolution par sous-domaine ou slug d'URL + filtre `association_id` sur toutes les requêtes publiques | P0 |
| Site public | Sous-domaine configurable | Absent | Aucune colonne, aucune logique de routage | Colonne dédiée, contrôle de disponibilité, routage `/s/:slug` puis sous-domaine | P0 |
| Site public | Modèles de site (10) | Absent | Aucun modèle | 10 modèles sélectionnables, aperçu, changement après création sans perte de contenu | P1 |
| Portail privé | Espace propre par association | Partiel | Le portail existe mais dépend du sélecteur manuel d'association | Résolution automatique du tenant à la connexion, conservation après reconnexion | P1 |
| Langue | Langue principale de l'association | Partiel | `locale` stocké mais jamais appliqué ; espagnol absent | Initialiser i18n depuis `associations.locale`, ajouter l'espagnol, modification post-création | P1 |
| Provisioning | Création automatique des espaces | Partiel | Crée association, rôles, admin, membre — mais aucun contenu de site ni configuration de portail | Créer les enregistrements de site et de portail par défaut lors du provisioning | P0 |
| Sécurité | Journal d'audit des actions sensibles | Partiel | Le provisioning et les modifications d'association ne sont pas journalisés | Journaliser création, modification, changement de modèle, changement de statut | P2 |
| Régressions | Écran « Identité & Thème » | OK | Corrigé au tour précédent (erreur réelle remontée, rafraîchissement sans rechargement) | — | — |
| Régressions | Association Phoenix | À surveiller | Créée sans contenu de site ni thème : le site public affiche toujours E2D | Couvert par le lot d'isolation publique | P0 |

## Plan de correction priorisé

### Lot 1 — Socle base de données (P0)
Ajouter à `associations` : `sigle`, `email_contact`, `telephone`, `adresse`, `ville`, `pays`, `site_template`, `subdomain` (unique), `langue_principale`. Créer un espace de stockage `association-logos` avec règles d'accès (lecture publique, écriture administrateurs). Journalisation d'audit sur les modifications d'association.

### Lot 2 — Édition complète des associations (P0)
Nouvel écran d'édition accessible depuis la liste plateforme et depuis l'espace de chaque association : onglets Informations générales / Identité visuelle / Langue / Modèle & site / Portail & adresse web / Responsables. Enregistrement vérifié (retour des lignes) et rafraîchissement du contexte.

### Lot 3 — Import du logo et charte générée (P0/P1)
Composant d'envoi de logo (fichier + aperçu). Extraction des couleurs dominantes côté navigateur, génération d'une palette complète (principale, secondaire, accentuation, boutons, menus, titres, fonds, textes) avec ajustement automatique du contraste. Application des jetons au thème global.

### Lot 4 — Isolation du site public et du portail (P0)
Résolution du tenant : sous-domaine si présent, sinon `/s/:slug`, sinon association par défaut. Contexte public d'association, puis filtrage `association_id` de toutes les requêtes de `useSiteContent` et des pages publiques. Provisioning : création des enregistrements de site par défaut pour chaque nouvelle association.

### Lot 5 — Modèles de site (P1)
10 modèles (institutionnel, moderne, communautaire, sportif, professionnel, associatif classique, événementiel, minimaliste, dynamique, premium) sous forme de dispositions réutilisant les mêmes données de contenu, donc changeables sans perte. Galerie d'aperçu avec logo et couleurs de l'association.

### Lot 6 — Assistant de création en 7 étapes (P1)
Reprise des étapes demandées, navigation avant/arrière, récapitulatif, puis appel du provisioning enrichi (site, portail, modèle, charte, langue, sous-domaine, droits du premier administrateur).

### Lot 7 — Langue principale (P1)
Ajout de l'espagnol, initialisation d'i18n depuis la langue de l'association, changement post-création sans perte de données.

### Lot 8 — Tests et vérification (P1)
Parcours des 15 scénarios demandés dans l'aperçu (création, logo, couleurs, modèle, langue, isolation entre deux associations, affichage mobile/tablette/ordinateur, persistance après reconnexion), plus tests unitaires sur la génération de palette et la résolution de tenant.

## Détails techniques

- Migrations : nouvelles colonnes sur `associations` (toutes nullables sauf valeurs par défaut pour `site_template`, `langue_principale`, `subdomain` = slug), index unique sur `subdomain`, déclencheur d'audit.
- Stockage : espace `association-logos`, règles d'écriture basées sur `is_admin_of()` / `is_super_admin()`.
- Front : `PublicAssociationContext` pour le tenant anonyme, `src/lib/paletteFromLogo.ts` (canvas + quantification simple, aucune dépendance lourde), `src/templates/site/` avec 10 dispositions et un registre typé.
- Le sous-domaine réel dépend de la configuration du domaine chez l'hébergeur : la plateforme stockera et validera le sous-domaine, et le routage par slug servira de repli tant que le domaine générique n'est pas branché.
