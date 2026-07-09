# Phase 2.2 — Migrations schéma multi-tenant

Décisions validées : rôles hybrides, `configurations` scindée en 2 tables, Phoenix = 2ème association (slug `phoenix`), `association_id` nullable sur historique/audit.

Cette sous-phase produit **7 migrations SQL indépendantes** appliquées dans l'ordre. Aucune policy RLS refondue ici (Phase 2.4). Aucun code frontend touché (Phase 2.5).

## Migration 1 — Enrichissement `associations` + création Phoenix

```sql
-- associations : colonnes branding/config/flags
ALTER TABLE public.associations
  ADD COLUMN slug text,
  ADD COLUMN logo_url text,
  ADD COLUMN theme_tokens jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN email_config  jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN caisse_config jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN locale text NOT NULL DEFAULT 'fr',
  ADD COLUMN feature_flags jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN statut text NOT NULL DEFAULT 'actif',
  ADD COLUMN updated_at timestamptz NOT NULL DEFAULT now();

-- Backfill slug pour la ligne E2D existante (unique ligne actuelle)
UPDATE public.associations SET slug = 'e2d' WHERE slug IS NULL;
ALTER TABLE public.associations ADD CONSTRAINT associations_slug_key UNIQUE (slug);
ALTER TABLE public.associations ALTER COLUMN slug SET NOT NULL;

-- Trigger updated_at
CREATE TRIGGER trg_associations_updated_at
  BEFORE UPDATE ON public.associations
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Création Phoenix (2ème tenant)
INSERT INTO public.associations (nom, slug, description, statut)
VALUES ('Phoenix', 'phoenix', 'Section sportive Phoenix', 'actif');
```

Rollback : `DROP CONSTRAINT`, `ALTER TABLE ... DROP COLUMN`, `DELETE FROM associations WHERE slug='phoenix'`.

## Migration 2 — Backfill des `association_id` NOT NULL manquants

Pour les **26 tables déjà porteuses** de `association_id` : forcer le remplissage vers E2D (ou Phoenix pour les tables sport Phoenix qui l'auraient déjà) et passer en `NOT NULL` avec index.

```sql
DO $$
DECLARE
  v_e2d uuid; v_phoenix uuid;
  t text;
  tenant_tables text[] := ARRAY[
    'adhesions','aides','aides_types','aides_validation_history',
    'beneficiaires_paiements_audit','calendrier_beneficiaires','cotisations',
    'cotisations_mensuelles_exercice','demandes_adhesion','donations','epargnes',
    'exercices','fond_caisse_operations','loan_requests','match_statistics',
    'membres','notifications','prets','prets_paiements','prets_reconductions',
    'profiles','reunion_beneficiaires','reunions','reunions_presences',
    'reunions_sanctions','sanctions'
  ];
BEGIN
  SELECT id INTO v_e2d FROM public.associations WHERE slug='e2d';
  FOREACH t IN ARRAY tenant_tables LOOP
    EXECUTE format('UPDATE public.%I SET association_id=$1 WHERE association_id IS NULL', t) USING v_e2d;
    EXECUTE format('ALTER TABLE public.%I ALTER COLUMN association_id SET NOT NULL', t);
    EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON public.%I(association_id)', t||'_association_id_idx', t);
  END LOOP;
END $$;
```

Note : `audit_logs`, `notifications` (envois/logs/historique/etc.) sont traités en Migration 5 (nullable).

## Migration 3 — Ajout `association_id` sur les 40 tables `tenant` manquantes

Backfill par défaut vers E2D. Tables Phoenix (`phoenix_*` et `sport_phoenix_*`) backfill vers Phoenix.

```sql
DO $$
DECLARE
  v_e2d uuid; v_phoenix uuid; t text;
  e2d_tables text[] := ARRAY[
    'alertes_budgetaires','beneficiaires_config','caisse_config',
    'cms_events','cms_gallery','cms_hero_slides','cms_pages','cms_partners',
    'cms_sections','cms_settings','cotisations_types',
    'exercices_cotisations_types','exports_programmes','fichiers_joint',
    'fond_caisse_clotures','match_compte_rendus','match_gala_config',
    'match_medias','messages_contact','payment_configs',
    'pret_reconduction_validation_config','prets_config','rapports_seances',
    'recurring_donations','sanctions_tarifs','sanctions_types','session_config',
    'site_about','site_activities','site_config','site_events',
    'site_events_carousel_config','site_gallery','site_gallery_albums',
    'site_hero','site_hero_images','site_partners','smtp_config',
    'sport_e2d_activites','sport_e2d_config','sport_e2d_depenses',
    'sport_e2d_matchs','sport_e2d_recettes','tontine_configurations','types_sanctions'
  ];
  phoenix_tables text[] := ARRAY[
    'phoenix_adherents','phoenix_compositions','phoenix_cotisations_annuelles',
    'phoenix_entrainements','phoenix_entrainements_internes','phoenix_equipes',
    'phoenix_evenements_match','phoenix_presences','phoenix_presences_entrainement',
    'phoenix_statistiques_annuelles','phoenix_statistiques_joueur','phoenix_stats_jaune_rouge',
    'sport_phoenix_config','sport_phoenix_depenses','sport_phoenix_matchs','sport_phoenix_recettes'
  ];
BEGIN
  SELECT id INTO v_e2d FROM public.associations WHERE slug='e2d';
  SELECT id INTO v_phoenix FROM public.associations WHERE slug='phoenix';

  FOREACH t IN ARRAY e2d_tables LOOP
    EXECUTE format('ALTER TABLE public.%I ADD COLUMN association_id uuid REFERENCES public.associations(id)', t);
    EXECUTE format('UPDATE public.%I SET association_id=$1', t) USING v_e2d;
    EXECUTE format('ALTER TABLE public.%I ALTER COLUMN association_id SET NOT NULL', t);
    EXECUTE format('CREATE INDEX %I ON public.%I(association_id)', t||'_association_id_idx', t);
  END LOOP;

  FOREACH t IN ARRAY phoenix_tables LOOP
    EXECUTE format('ALTER TABLE public.%I ADD COLUMN association_id uuid REFERENCES public.associations(id)', t);
    EXECUTE format('UPDATE public.%I SET association_id=$1', t) USING v_phoenix;
    EXECUTE format('ALTER TABLE public.%I ALTER COLUMN association_id SET NOT NULL', t);
    EXECUTE format('CREATE INDEX %I ON public.%I(association_id)', t||'_association_id_idx', t);
  END LOOP;
END $$;
```

Rollback : boucle inverse `DROP COLUMN association_id`.

## Migration 4 — Scission `configurations` en `platform_settings` + `association_settings`

Choix utilisateur : **deux tables séparées** (option C).

```sql
CREATE TABLE public.platform_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cle text NOT NULL UNIQUE,
  valeur jsonb,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.platform_settings TO authenticated;
GRANT ALL    ON public.platform_settings TO service_role;
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;
-- policies définies en 2.4 (lecture publique authentifiée, écriture super_admin)

CREATE TABLE public.association_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  association_id uuid NOT NULL REFERENCES public.associations(id) ON DELETE CASCADE,
  cle text NOT NULL,
  valeur jsonb,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (association_id, cle)
);
CREATE INDEX association_settings_association_id_idx ON public.association_settings(association_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.association_settings TO authenticated;
GRANT ALL ON public.association_settings TO service_role;
ALTER TABLE public.association_settings ENABLE ROW LEVEL SECURITY;
-- policies définies en 2.4

-- Backfill : reclassement des 38 lignes actuelles de public.configurations
-- Liste des clés considérées "plateforme" (à figer avec l'utilisateur avant exécution) :
--   'schema_version','multi_tenant_enforced','feature_flags_platform',
--   'connector_gateway_url','app_version'
INSERT INTO public.platform_settings (cle, valeur, description)
SELECT cle, valeur, description FROM public.configurations
WHERE cle IN ('schema_version','multi_tenant_enforced','feature_flags_platform',
              'connector_gateway_url','app_version');

INSERT INTO public.association_settings (association_id, cle, valeur, description)
SELECT (SELECT id FROM public.associations WHERE slug='e2d'), cle, valeur, description
FROM public.configurations
WHERE cle NOT IN ('schema_version','multi_tenant_enforced','feature_flags_platform',
                  'connector_gateway_url','app_version');

-- Vue de compatibilité (retro-compat pour hooks non migrés Phase 4)
CREATE OR REPLACE VIEW public.configurations_v_compat AS
  SELECT ps.id, ps.cle, ps.valeur, ps.description, NULL::uuid AS association_id, ps.created_at, ps.updated_at
    FROM public.platform_settings ps
  UNION ALL
  SELECT as_.id, as_.cle, as_.valeur, as_.description, as_.association_id, as_.created_at, as_.updated_at
    FROM public.association_settings as_;

-- L'ancienne table `configurations` est RENOMMÉE (pas supprimée) pour rollback rapide
ALTER TABLE public.configurations RENAME TO configurations_deprecated;
COMMENT ON TABLE public.configurations_deprecated IS 'Déprécié Phase 2.2 — voir platform_settings + association_settings. Supprimer après Phase 4.';
```

**Point de validation utilisateur avant exécution** : liste exacte des clés à classer en `platform_settings` — je te la soumets après un `SELECT DISTINCT cle FROM configurations` en début de migration.

## Migration 5 — Historique/audit `association_id` nullable

```sql
-- audit_logs : déjà nullable, on ajoute juste l'index
CREATE INDEX IF NOT EXISTS audit_logs_association_id_idx ON public.audit_logs(association_id);

-- Tables notifications_* et email_logs : ajout nullable + backfill vers E2D pour les lignes existantes
DO $$
DECLARE
  v_e2d uuid; t text;
  nullable_tables text[] := ARRAY[
    'email_logs','notifications_campagnes','notifications_config',
    'notifications_envois','notifications_historique','notifications_logs',
    'notifications_templates'
  ];
BEGIN
  SELECT id INTO v_e2d FROM public.associations WHERE slug='e2d';
  FOREACH t IN ARRAY nullable_tables LOOP
    EXECUTE format('ALTER TABLE public.%I ADD COLUMN association_id uuid REFERENCES public.associations(id)', t);
    EXECUTE format('UPDATE public.%I SET association_id=$1 WHERE association_id IS NULL', t) USING v_e2d;
    EXECUTE format('CREATE INDEX %I ON public.%I(association_id)', t||'_association_id_idx', t);
  END LOOP;
END $$;
```

Convention : `association_id IS NULL` ⇒ envoi/action plateforme, visible super_admin uniquement (policy Phase 2.4).

## Migration 6 — Rôles hybrides : `roles.scope` + rôles système

```sql
-- roles : ajout d'un scope 'platform' (protégé) vs 'association' (custom par asso)
ALTER TABLE public.roles ADD COLUMN scope text NOT NULL DEFAULT 'association'
  CHECK (scope IN ('platform','association'));
ALTER TABLE public.roles ADD COLUMN is_system boolean NOT NULL DEFAULT false;

-- Marquer les rôles socles comme système/platform
UPDATE public.roles
   SET scope='platform', is_system=true
 WHERE lower(name) IN ('super_admin','administrateur','membre');

-- Rôles system existants dupliqués par asso ? Non : les rôles system restent uniques (association_id NULL autorisé pour scope=platform)
ALTER TABLE public.roles ALTER COLUMN association_id DROP NOT NULL;
UPDATE public.roles SET association_id = NULL WHERE scope='platform';

-- Contrainte : rôles association doivent avoir un association_id
ALTER TABLE public.roles ADD CONSTRAINT roles_scope_association_check
  CHECK ((scope='platform' AND association_id IS NULL) OR (scope='association' AND association_id IS NOT NULL));

-- Créer le rôle super_admin s'il n'existe pas
INSERT INTO public.roles (name, scope, is_system, association_id)
SELECT 'super_admin', 'platform', true, NULL
WHERE NOT EXISTS (SELECT 1 FROM public.roles WHERE lower(name)='super_admin');

-- Trigger anti-modification/suppression des rôles system par non-super_admin (implémenté en 2.4 avec has_role)
```

Note : `user_roles.association_id` reste `NOT NULL` (déjà en place) — chaque affectation est toujours contextualisée à une asso, même pour un `super_admin` (il est super_admin *pour* toutes les assos → gérer via une ligne user_roles(role=super_admin, association_id=NULL)) :

```sql
ALTER TABLE public.user_roles ALTER COLUMN association_id DROP NOT NULL;
ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_super_admin_null_check
  CHECK (
    association_id IS NOT NULL
    OR EXISTS (SELECT 1 FROM public.roles r WHERE r.id = role_id AND r.scope='platform')
  );
```

Rollback documenté ligne par ligne.

## Migration 7 — Fonctions helpers RLS (préparatoires à Phase 2.4)

Fonctions créées ici mais **non utilisées par les policies existantes** — elles seront branchées en Phase 2.4. Cela permet de tester leur logique isolément avant refonte.

```sql
CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id uuid DEFAULT auth.uid())
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.roles r ON r.id = ur.role_id
    WHERE ur.user_id = _user_id AND lower(r.name) = 'super_admin' AND r.scope = 'platform'
  );
$$;

CREATE OR REPLACE FUNCTION public.get_user_associations(_user_id uuid DEFAULT auth.uid())
RETURNS SETOF uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT DISTINCT ur.association_id
    FROM public.user_roles ur
   WHERE ur.user_id = _user_id AND ur.association_id IS NOT NULL
  UNION
  SELECT id FROM public.associations WHERE public.is_super_admin(_user_id);
$$;

CREATE OR REPLACE FUNCTION public.has_association_access(_association_id uuid, _user_id uuid DEFAULT auth.uid())
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT public.is_super_admin(_user_id)
      OR EXISTS (SELECT 1 FROM public.get_user_associations(_user_id) aid WHERE aid = _association_id);
$$;

CREATE OR REPLACE FUNCTION public.is_admin_of(_association_id uuid, _user_id uuid DEFAULT auth.uid())
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT public.is_super_admin(_user_id)
      OR EXISTS (
        SELECT 1 FROM public.user_roles ur
        JOIN public.roles r ON r.id = ur.role_id
        WHERE ur.user_id = _user_id
          AND ur.association_id = _association_id
          AND lower(r.name) IN ('administrateur','admin')
      );
$$;
```

## Ordre d'application

1. Migration 1 (associations + Phoenix)
2. Migration 2 (backfill NOT NULL tables déjà porteuses)
3. Migration 3 (ADD COLUMN sur les 60 tables restantes)
4. Migration 5 (historique nullable)
5. Migration 6 (rôles hybrides)
6. Migration 4 (scission configurations — dernière car nécessite validation de la liste des clés plateforme)
7. Migration 7 (helpers RLS)

Chaque migration est passée séparément à `supabase--migration` et attend approbation utilisateur.

## Vérifications post-migration (avant Phase 2.3)

- `SELECT count(*) FROM associations` → 2 (E2D + Phoenix).
- Aucune ligne `association_id IS NULL` sur les tables `tenant`.
- `SELECT public.is_super_admin('<uid-connu>')` retourne `true` pour toi seulement après qu'on t'ait attribué le rôle super_admin (dernière étape manuelle de la Phase 2.2 — je te demanderai ton user_id).
- Les 38 clés de `configurations_deprecated` sont retrouvables en UNION dans `configurations_v_compat`.
- L'app E2D fonctionne à l'identique (les policies RLS n'ont pas encore été touchées).

## Hors périmètre 2.2 (rappel)

- Refonte des policies RLS : Phase 2.4.
- Contexte tenant frontend : Phase 2.5.
- Edge function provisioning : Phase 2.6.
- Suppression de `configurations_deprecated` : après Phase 4.

## Point bloquant avant exécution

Avant de lancer la Migration 4, je te soumettrai la **liste complète des 38 clés actuelles** de `configurations` et te demanderai de valider lesquelles sont `platform` vs `association`. Toutes les autres migrations peuvent être exécutées séquentiellement sans autre validation.
