# Phase 2 — Fondations Multi-Tenant (plan d'implémentation détaillé)

## Objectif

Isoler strictement les données par association, sans casser E2D en production. À la fin de la phase, chaque requête (lecture ou écriture) est scoppée à l'`association_id` de l'utilisateur, et un super_admin peut provisionner une nouvelle association en 1 clic.

## État des lieux (constaté par exploration)

- Table `associations` existante minimaliste : `id, nom, description, created_at`. Aucune configuration de branding, ni de features flags.
- ~30 tables métier référencent déjà `associations` via une FK — la colonne `association_id` existe donc déjà largement (149 occurrences dans `types.ts`).
- Restent à identifier : les tables sans colonne tenant (probablement `cms_*`, `site_*`, `configurations`, `smtp_config`, `payment_configs`, `sanctions_tarifs`, `role_permissions`, `notifications_*`, quelques `sport_*`).
- RLS actuelle : basée sur `is_admin()` et `has_permission()`. Aucune fonction `has_association_access()` n'existe.
- Frontend : aucune notion de `currentAssociationId` dans `AuthContext`. Les requêtes `supabase.from(...)` ne filtrent jamais par tenant.

## Découpage en 6 sous-phases exécutables

### 2.1 — Audit préparatoire (0.5 j, sans code)

Livrable : un tableau markdown dans `docs/PHASE2_TENANT_AUDIT.md` listant, pour **chaque table `public.*`** :
- `association_id` présent ? (oui/non)
- FK vers `associations` ? (oui/non)
- Nullable ? Backfill nécessaire ?
- Catégorie : `tenant` (données par asso), `platform` (partagé plateforme), `user-scoped` (via `user_id` uniquement).

Sortie : liste explicite des tables à modifier en 2.2. Aucune modification tant que ce tableau n'est pas validé.

### 2.2 — Enrichissement de `associations` + colonnes tenant manquantes

**Migration 1 — `associations`** :
```sql
ALTER TABLE public.associations
  ADD COLUMN slug text UNIQUE,
  ADD COLUMN logo_url text,
  ADD COLUMN theme_tokens jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN email_config jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN caisse_config jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN locale text NOT NULL DEFAULT 'fr',
  ADD COLUMN feature_flags jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN statut text NOT NULL DEFAULT 'actif',
  ADD COLUMN updated_at timestamptz NOT NULL DEFAULT now();
-- Trigger update_updated_at_column
-- Backfill slug = 'e2d' pour la ligne E2D existante
```

**Migration 2 — Ajout `association_id` sur tables identifiées en 2.1** (liste à confirmer) :
```sql
ALTER TABLE public.<table> ADD COLUMN association_id uuid REFERENCES public.associations(id);
UPDATE public.<table> SET association_id = (SELECT id FROM associations WHERE slug='e2d');
ALTER TABLE public.<table> ALTER COLUMN association_id SET NOT NULL;
CREATE INDEX ON public.<table>(association_id);
```

Rollback documenté en tête de chaque migration.

### 2.3 — Fonctions RLS tenant-aware

```sql
-- Retourne toutes les associations auxquelles l'utilisateur appartient
CREATE FUNCTION public.get_user_associations(_user_id uuid)
RETURNS SETOF uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT DISTINCT association_id FROM public.membres_roles mr
  JOIN public.membres m ON m.id = mr.membre_id
  WHERE m.user_id = _user_id AND m.status <> 'supprime'
$$;

CREATE FUNCTION public.has_association_access(_association_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.get_user_associations(auth.uid()) AS aid
    WHERE aid = _association_id
  ) OR public.is_super_admin(auth.uid())
$$;

CREATE FUNCTION public.is_super_admin(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = 'super_admin'
  )
$$;
```

Ajout de la valeur `'super_admin'` à l'enum `app_role`.

### 2.4 — Refonte des policies RLS

Pour chaque table `tenant` identifiée en 2.1 :
- Remplacer/compléter les policies existantes par un `USING (public.has_association_access(association_id))` en plus du contrôle de rôle existant.
- Les policies `is_admin()` deviennent `is_admin() AND has_association_access(association_id)` (admin d'asso), et `is_super_admin()` bypass tout.
- Les tables `platform` (ex. `associations`, `roles`, `role_permissions` sans scope, `security_scans`) restent réservées `super_admin`.

Chaque policy modifiée reçoit son test dans `src/test/security/rls.test.ts` (utilisateur A d'asso X ne voit rien de l'asso Y).

### 2.5 — Frontend : contexte tenant + helper de requête

**`src/contexts/AuthContext.tsx`** :
- Charger `associations` disponibles à la connexion via `get_user_associations`.
- Nouveau state `currentAssociationId` + persistance `localStorage`.
- Composant `<AssociationSwitcher />` dans le header du dashboard (visible seulement si `associations.length > 1` ou `super_admin`).

**`src/lib/tenantQuery.ts`** (nouveau) :
```ts
export function tenantQuery<T extends TableName>(table: T) {
  const aid = useAssociationStore.getState().currentAssociationId;
  return supabase.from(table).select().eq('association_id', aid);
}
```
Wrapper léger pour les requêtes explicites. Les policies RLS restent le garde-fou principal — le helper n'est qu'une optimisation d'index et de clarté.

Sur `INSERT`, un trigger `BEFORE INSERT` sur chaque table tenant remplit `association_id` par défaut depuis `auth.jwt() -> app_metadata -> current_association_id` si non fourni, pour éviter les oublis.

### 2.6 — Edge function `provision-association`

Nouvelle fonction `supabase/functions/provision-association/index.ts` :
- Auth : `verify_jwt = true`, contrôle `is_super_admin` en tête.
- Input : `{ nom, slug, adminEmail, adminNom, theme?, locale? }` (validé zod).
- Actions : `INSERT associations`, seed `configurations`/`caisse_config`/`smtp_config` par défaut, `INSERT profiles + membres + membres_roles(administrateur)`, envoi email d'invitation via le module email existant.
- Trace `audit_logs`.

Page admin plateforme `src/pages/admin/PlatformAssociations.tsx` (route `/admin/platform/associations`) : liste + bouton « Nouvelle association ».

## Fichiers touchés (résumé)

- **Migrations** : 4 fichiers (`associations_enrichie`, `tenant_columns_backfill`, `rls_helpers`, `rls_policies_refonte`).
- **Code SQL** : `src/test/security/rls.test.ts` étendu.
- **Frontend** : `src/contexts/AuthContext.tsx`, `src/lib/tenantQuery.ts` (nouveau), `src/components/layout/AssociationSwitcher.tsx` (nouveau), `src/pages/admin/PlatformAssociations.tsx` (nouveau).
- **Edge function** : `supabase/functions/provision-association/index.ts` (nouveau).
- **Docs** : `docs/PHASE2_TENANT_AUDIT.md`, `docs/CHANGELOG.md`, `.lovable/plan.md`.

## Ordre d'exécution & points de contrôle

1. 2.1 audit → validation utilisateur du tableau des tables tenant.
2. 2.2 migrations schéma → snapshot DB avant, vérification manuelle après (E2D toujours fonctionnel).
3. 2.3 fonctions RLS helpers.
4. 2.4 refonte policies **table par table**, avec test RLS à chaque étape.
5. 2.5 frontend context + switcher (aucune régression si `currentAssociationId = E2D` par défaut).
6. 2.6 provisioning super_admin.

Chaque étape est mergeable indépendamment. Un feature flag `multi_tenant_enforced` dans `configurations` permet de désactiver le filtre `has_association_access` en cas de régression majeure (fallback = `is_admin()` classique).

## Vérifications

- `E2D` continue de fonctionner sans changement visible utilisateur final.
- Un utilisateur test créé dans une 2ème association (via `provision-association`) ne voit **aucune** donnée E2D (test manuel + test RLS automatisé).
- Un super_admin voit tout.
- Tous les triggers `updated_at` en place.
- Aucune policy sans test cross-tenant associé.

## Hors périmètre (renvoyé en Phase 3/4)

- Interface d'édition du thème par association (Phase 6).
- Journal d'audit UI (Phase 3).
- Réorganisation `src/domains/**` (Phase 4).
- Notification unifiée (Phase 4).

## Prochaine action

Sur approbation, je démarre par la **sous-phase 2.1** (audit préparatoire read-only, aucun code) et je te soumets le tableau des tables à migrer avant tout `ALTER TABLE`.
