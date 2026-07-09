# Phase 2 — Audit préparatoire multi-tenant

**Statut :** brouillon en attente de validation utilisateur.
**Portée :** inventaire de toutes les tables du schéma `public` pour classer leur besoin en isolation par association.
**Source :** requête `information_schema` du 09/07/2026 sur la base de production (voir historique tool calls).

## Légende catégories

| Catégorie | Définition | Action Phase 2.2 |
|---|---|---|
| `tenant` | Données métier propres à une association (membres, prêts, cotisations, comptabilité, site public d'une asso). | Colonne `association_id NOT NULL` + RLS `has_association_access`. |
| `platform` | Configuration partagée à la plateforme (rôles catalogue, security scans, associations elles-mêmes). | Réservé `super_admin`. Pas de colonne tenant. |
| `user-scoped` | Isolation naturelle par `user_id` uniquement (logs individuels, historique connexion). | Pas de colonne tenant. RLS par `auth.uid()`. |
| `child` | Table fille dont l'isolation passe via la FK vers la table parente déjà scopée. | Pas de colonne tenant nécessaire, RLS via jointure. |
| `à trancher` | Cas ambigu — décision utilisateur requise. | Voir section « Décisions requises ». |

## Tableau détaillé

Colonnes : `A?` = colonne `association_id` déjà présente. `Rows` = nombre de lignes actuelles (toutes appartiennent à E2D).

### Déjà scopées (`association_id` présent) — 26 tables

Ces tables ont déjà la colonne. Restera en 2.2 à : (a) vérifier `NOT NULL`, (b) backfill si nullable, (c) créer un index si absent, (d) refondre les policies RLS en 2.4.

| Table | Rows | Catégorie |
|---|---|---|
| adhesions | 0 | tenant |
| aides | 2 | tenant |
| aides_types | 5 | tenant |
| aides_validation_history | 0 | tenant |
| audit_logs | 0 | tenant (nullable OK pour actions plateforme) |
| beneficiaires_paiements_audit | 0 | tenant |
| calendrier_beneficiaires | 15 | tenant |
| cotisations | 31 | tenant |
| cotisations_mensuelles_exercice | 15 | tenant |
| demandes_adhesion | 0 | tenant |
| donations | 3 | tenant |
| epargnes | 6 | tenant |
| exercices | 3 | tenant |
| fond_caisse_operations | 70 | tenant |
| loan_requests | 4 | tenant |
| match_statistics | 12 | tenant |
| membres | 9 | tenant |
| notifications | 4 | tenant |
| prets | 8 | tenant |
| prets_paiements | 14 | tenant |
| prets_reconductions | 6 | tenant |
| profiles | 9 | tenant (via membres) |
| reunion_beneficiaires | 0 | tenant |
| reunions | 3 | tenant |
| reunions_presences | 19 | tenant |
| reunions_sanctions | 2 | tenant |
| role_permissions | 186 | **à trancher** (voir décisions) |
| roles | 13 | **à trancher** (voir décisions) |
| sanctions | 7 | tenant |
| user_roles | 8 | **à trancher** (voir décisions) |

### Tables sans `association_id` à classer — 78 tables

#### Catégorie `child` (héritent d'une table parente déjà scopée) — 15 tables

Aucune colonne à ajouter ; RLS via jointure sur la table parente.

| Table | Parent | Colonne de lien |
|---|---|---|
| activites_membres | membres | membre_id |
| cotisations_membres | membres / cotisations | membre_id |
| cotisations_mensuelles_audit | membres | membre_id |
| cotisations_minimales | membres | membre_id |
| loan_request_validations | loan_requests | loan_request_id |
| match_joueurs | matchs (sport_e2d / phoenix) | match_id |
| match_presences | matchs | match_id |
| membres_cotisations_config | membres | membre_id |
| membres_roles | membres | membre_id |
| phoenix_presences_entrainement | phoenix_entrainements | entrainement_id |
| phoenix_statistiques_joueur | membres | membre_id |
| pret_reconduction_validations | prets_reconductions | reconduction_id |
| reunions_huile_savon | reunions | reunion_id |
| sport_e2d_presences | sport_e2d_matchs | match_id |
| tontine_attributions | tontine_configurations | tontine_id |

#### Catégorie `tenant` à ajouter (colonne manquante) — 40 tables

| Table | Rows | Note backfill |
|---|---|---|
| alertes_budgetaires | 0 | trivial |
| beneficiaires_config | 2 | backfill vers E2D |
| caisse_config | 1 | backfill vers E2D |
| cms_events | 2 | backfill vers E2D |
| cms_gallery | 0 | trivial |
| cms_hero_slides | 0 | trivial |
| cms_pages | 3 | backfill vers E2D |
| cms_partners | 0 | trivial |
| cms_sections | 4 | backfill vers E2D |
| cms_settings | 9 | backfill vers E2D |
| configurations | 38 | backfill vers E2D (attention : certaines clés peuvent devenir « platform ») |
| cotisations_types | 10 | backfill vers E2D |
| email_logs | 58 | backfill vers E2D |
| exercices_cotisations_types | 19 | backfill vers E2D |
| exports_programmes | 0 | trivial |
| fichiers_joint | 0 | trivial |
| fond_caisse_clotures | 0 | trivial |
| match_compte_rendus | 3 | backfill vers E2D |
| match_gala_config | 1 | backfill vers E2D |
| match_medias | 15 | backfill vers E2D |
| messages_contact | 8 | backfill vers E2D |
| notifications_campagnes | 2 | backfill vers E2D |
| notifications_config | 6 | backfill vers E2D |
| notifications_envois | 28 | backfill vers E2D |
| notifications_historique | 6 | backfill vers E2D |
| notifications_logs | 0 | trivial |
| notifications_templates | 9 | backfill vers E2D |
| payment_configs | 1 | backfill vers E2D |
| phoenix_adherents | 1 | backfill vers **Phoenix** (à créer) — voir décisions |
| phoenix_* (13 tables Phoenix) | — | backfill vers **Phoenix** |
| pret_reconduction_validation_config | 0 | trivial |
| prets_config | 1 | backfill vers E2D |
| rapports_seances | 4 | backfill vers E2D |
| recurring_donations | 0 | trivial |
| sanctions_tarifs | 4 | backfill vers E2D |
| sanctions_types | 6 | backfill vers E2D |
| session_config | 3 | backfill vers E2D |
| site_about | 1 | backfill vers E2D |
| site_activities | 3 | backfill vers E2D |
| site_config | 12 | backfill vers E2D |
| site_events | 6 | backfill vers E2D |
| site_events_carousel_config | 1 | backfill vers E2D |
| site_gallery | 1 | backfill vers E2D |
| site_gallery_albums | 1 | backfill vers E2D |
| site_hero | 1 | backfill vers E2D |
| site_hero_images | 0 | trivial |
| site_partners | 2 | backfill vers E2D |
| smtp_config | 1 | backfill vers E2D |
| sport_e2d_* (6 tables) | — | backfill vers E2D |
| sport_phoenix_* (4 tables) | — | backfill vers **Phoenix** |
| tontine_configurations | 5 | backfill vers E2D |
| types_sanctions | 4 | backfill vers E2D |

#### Catégorie `user-scoped` — 4 tables

Isolation par `auth.uid()` uniquement. Aucune colonne tenant.

| Table | Rows |
|---|---|
| historique_connexion | 12 |
| permissions_audit | 537 |
| site_pageviews | 638 |
| utilisateurs_actions_log | 0 |

#### Catégorie `platform` — 2 tables

Réservé `super_admin`.

| Table | Rows |
|---|---|
| associations | 1 |
| security_scans | 0 |

## Décisions requises avant 2.2

1. **`roles` / `role_permissions` / `user_roles`** — la colonne `association_id` existe déjà. On les traite comme :
   - **Option A (recommandée)** : `tenant`. Chaque association gère son propre catalogue de rôles + permissions. Un utilisateur peut avoir un rôle différent par asso. → Nécessite d'unifier avec `is_admin()` en `is_admin_of(asso)`.
   - **Option B** : `platform` pour `roles` (catalogue global), `tenant` pour `user_roles`. Plus rigide.

2. **`configurations`** (38 lignes) — certaines clés sont réellement globales à la plateforme (`multi_tenant_enforced`, versions de schéma, feature flags système). Proposition : ajouter `association_id nullable`, où `NULL = plateforme`. Sinon dupliquer 38 lignes par asso.

3. **Tables Phoenix** (~13 tables) — le module Phoenix est-il :
   - une **2ème association** (à créer, slug `phoenix`) — cohérent avec la roadmap SaaS,
   - ou un **sous-module de E2D** (backfill vers E2D) ?
   Selon la réponse, le backfill diffère.

4. **`email_logs` / `notifications_*`** — historique. On backfill tout vers E2D ou on garde nullable pour les envois plateforme ?

5. **`audit_logs`** — colonne déjà nullable. Confirmer qu'on la garde nullable (actions super_admin sans asso cible).

## Volumétrie totale

- **Tables tenant à faire migrer** : ~65 (26 déjà OK + ~40 à compléter).
- **Tables child** : 15 (RLS jointure seulement).
- **Tables user-scoped** : 4.
- **Tables platform** : 2.
- **Lignes à backfiller** : ~1500 (dominées par `permissions_audit` 537 et `site_pageviews` 638 qui sont user-scoped, hors backfill tenant).

## Prochaine étape

Attendre les réponses aux 5 décisions ci-dessus, puis lancer la sous-phase 2.2 (migrations schéma).
