# Phase 3 — RBAC granulaire par tenant & audit unifié

Objectif : rendre les permissions et l'audit conscients du tenant courant, sans casser le fonctionnement d'E2D. Poursuit ce qui a été amorcé en Phase 2.6 (rôles clonés au scope association).

## 3.1 — `has_permission` tenant-aware (migration)

Réécrire `public.has_permission(_resource, _permission)` pour :

1. accepter le tenant courant via un nouveau helper `public.current_tenant_id()` qui lit dans l'ordre :
   - GUC de session `app.current_association_id` (posé par un futur hook côté client via `supabase.rpc('set_current_association')`),
   - à défaut : `default_association_id()` (déjà existant, fallback E2D + `membres.association_id`).
2. Court-circuit : `is_super_admin()` → true.
3. Court-circuit : rôle plateforme `administrateur` (scope platform) → true (rétro-compat E2D).
4. Sinon : chercher `role_permissions` via `user_roles` filtré sur `association_id = current_tenant_id()`.

Ajouter aussi une variante `public.has_permission_in(_association_id, _resource, _permission)` pour usages explicites.

**Rétro-compatibilité** : les 130+ policies existantes qui utilisent `has_permission(x, y)` continuent de marcher (aucune signature cassée), elles deviennent simplement tenant-aware transparent.

## 3.2 — Provisioning des permissions par tenant (migration + edge function)

**Migration** :
- Backfill : pour chaque association-scope role existant (créés en Phase 2.6 pour Phoenix), copier les `role_permissions` du rôle plateforme homonyme (`administrateur`, `membre`, `tresorier`, `secretaire_general`).

**Edge function `provision-association`** :
- Après clonage des rôles, cloner aussi leurs permissions depuis la template plateforme (`role_permissions.role_id` du rôle template → `role_permissions.role_id` du rôle association).
- L'admin d'un nouveau tenant a immédiatement le même set de permissions qu'un `administrateur` E2D.

## 3.3 — Audit log unifié (migration + hook edge)

- `audit_logs.association_id` existe déjà (Phase 2.4) mais peut être NULL. Ajouter un trigger BEFORE INSERT qui applique `default_association_id()` si NULL et si `user_id` renseigné.
- Créer `public.log_audit(_action text, _table text, _row_id uuid, _details jsonb)` : SECURITY DEFINER, insère dans `audit_logs` avec `auth.uid()` + `current_tenant_id()`.
- Documenter l'usage : remplacer progressivement les inserts manuels dans `audit_logs` par ce helper (pas de refactor massif ici, juste le helper + docs).

## 3.4 — Frontend : sélection tenant persistée côté DB (léger)

- Ajouter une RPC `public.set_current_association(_association_id uuid)` : vérifie que l'utilisateur y a accès (`is_super_admin()` OR `has_association_access(_id)`), puis `SET LOCAL app.current_association_id = ...`. Note : SET LOCAL n'a d'effet que dans la transaction courante, donc pour PostgREST on utilisera `set_config('app.current_association_id', ..., false)` avec `is_local=false` pour la durée de la session.
- Côté `AssociationContext.tsx` : appeler cette RPC après `switchAssociation()`, avant l'`invalidateQueries`.

Cela permet aux 130+ policies existantes de devenir *réellement* tenant-scoped dès qu'un super-admin bascule d'association.

## 3.5 — Page Permissions Admin (déjà existante) — adaptation minimale

`PermissionsAdmin.tsx` liste actuellement les permissions par rôle. Ajouter un filtre "Association" (visible si `availableAssociations.length > 1`) qui scope l'affichage aux rôles de l'association sélectionnée (rôles scope=platform toujours visibles en lecture seule).

Pas de refonte UI complète — juste un filtre `<Select>` qui filtre la query existante.

## 3.6 — Documentation & plan

- `.lovable/plan.md` : cocher Phase 3, définir 3.1→3.6 comme sous-phases.
- `docs/CHANGELOG.md` : nouvelle entrée « Phase 3 — RBAC granulaire par tenant ».
- Mémoire `mem://` : nouvelle entrée `mem://architecture/security/rbac-tenant-aware` documentant le fonctionnement `current_tenant_id()` + `has_permission()`.

## Détails techniques (résumé)

| Élément | Type | Fichier |
|---|---|---|
| `current_tenant_id()` | Function SQL | migration |
| `has_permission()` (v2 tenant-aware) | Function SQL | migration |
| `has_permission_in()` | Function SQL | migration |
| Backfill `role_permissions` Phoenix | DO block | migration |
| Trigger `audit_logs.association_id` fallback | Trigger | migration |
| `log_audit()` helper | Function SQL | migration |
| `set_current_association()` | RPC | migration |
| Provisioning des perms | Edge function | `supabase/functions/provision-association/index.ts` |
| Sélection tenant DB | React | `src/contexts/AssociationContext.tsx` |
| Filtre association | React | `src/pages/admin/PermissionsAdmin.tsx` |
| Docs | Markdown | `.lovable/plan.md`, `docs/CHANGELOG.md`, `mem://` |

## Hors périmètre (Phase ultérieure)

- Refonte UI complète de la matrice permissions (Phase 6 — thèmes & personnalisation).
- Migration en masse des inserts `audit_logs` existants vers `log_audit()` (Phase 8 — industrialisation).
- Séparation `platform_admin` vs `super_admin` (déjà couvert par `scope='platform'` + `is_super_admin()`).

## Livrables

- 1 migration SQL (helpers + trigger + backfill)
- 1 modification edge function `provision-association`
- 1 modification `AssociationContext.tsx`
- 1 modification `PermissionsAdmin.tsx`
- Mise à jour plan, changelog, mémoire
