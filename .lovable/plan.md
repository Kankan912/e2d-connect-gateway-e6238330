
# Phase 2.4 — Refonte RLS tenant-aware

Objectif : rendre toutes les policies RLS **tenant-aware** en utilisant les helpers créés en Phase 2.2 (`is_super_admin`, `has_association_access`, `is_admin_of`, `get_user_associations`), sans casser l'accès actuel des utilisateurs E2D.

## Principes

1. **Règle universelle tenant** : `has_association_access(association_id) OR is_super_admin()` sur toutes les tables métier.
2. **Règle admin** : `is_admin_of(association_id) OR is_super_admin()` pour INSERT/UPDATE/DELETE sensibles.
3. **Compatibilité** : le `default_association_id()` continue de fournir E2D pour les inserts frontend non encore modifiés.
4. **Public/CMS** : les tables site publiques (`site_*`, `cms_*`) gardent une SELECT publique mais filtrée par `association_id` visible.
5. **Plateforme** : `platform_settings`, `roles` scope=platform, `associations`, `audit_logs` (NULL) → réservés `is_super_admin()`.
6. **Audit trail** : chaque migration crée un backup des policies existantes (nom archivé, non actives) avant remplacement.

## Découpage en lots (7 migrations)

| Lot | Portée | Tables |
|---|---|---|
| **2.4.1** | Cœur membres & auth | `membres`, `profiles`, `user_roles`, `membres_roles`, `role_permissions`, `roles` |
| **2.4.2** | Finance & caisse | `cotisations_*`, `prets*`, `aides*`, `donations`, `recurring_donations`, `caisse_config`, `fond_caisse_*`, `beneficiaires_*`, `calendrier_beneficiaires`, `epargnes`, `tontine_*` |
| **2.4.3** | Adhésions & réunions | `adhesions`, `demandes_adhesion`, `reunions*`, `sanctions*`, `types_sanctions`, `activites_membres`, `rapports_seances` |
| **2.4.4** | Sport (E2D + Phoenix) | `sport_e2d_*`, `sport_phoenix_*`, `match_*`, `phoenix_*` |
| **2.4.5** | Configuration & exercices | `association_settings`, `platform_settings`, `configurations`, `exercices*`, `session_config`, `payment_configs`, `smtp_config`, `notifications_config`, `*_validation_config`, `sanctions_tarifs` |
| **2.4.6** | CMS & site public | `site_*`, `cms_*`, `messages_contact` |
| **2.4.7** | Audit, notifications, logs | `audit_logs`, `notifications*`, `historique_connexion`, `utilisateurs_actions_log`, `*_audit`, `fichiers_joint`, `email_logs` |

## Patron de migration

Pour chaque table `T` avec colonne `association_id` :

```sql
-- 1. Retirer les anciennes policies
DROP POLICY IF EXISTS "<ancien_nom>" ON public.T;

-- 2. SELECT : accès tenant
CREATE POLICY "tenant_select_T" ON public.T FOR SELECT
  USING (has_association_access(association_id) OR is_super_admin());

-- 3. INSERT : membre du tenant, association_id forcé
CREATE POLICY "tenant_insert_T" ON public.T FOR INSERT
  WITH CHECK (has_association_access(association_id) OR is_super_admin());

-- 4. UPDATE/DELETE : admin du tenant
CREATE POLICY "tenant_admin_update_T" ON public.T FOR UPDATE
  USING (is_admin_of(association_id) OR is_super_admin())
  WITH CHECK (is_admin_of(association_id) OR is_super_admin());

CREATE POLICY "tenant_admin_delete_T" ON public.T FOR DELETE
  USING (is_admin_of(association_id) OR is_super_admin());
```

Cas spéciaux :
- **CMS public** : SELECT public gardé (`USING (true)` ou filtré par `publie=true`), écritures = admin du tenant.
- **audit / logs nullable** : SELECT = admin du tenant OU super_admin si NULL ; pas d'UPDATE/DELETE utilisateur.
- **profiles** : SELECT = même association OU soi-même OU super_admin ; UPDATE = soi-même OU admin.
- **user_roles / roles** : jamais accessible à `anon`.

## Sécurité & compatibilité

- Les fonctions `is_admin()` et `has_permission()` existantes sont **conservées** (elles pointent vers l'association courante de l'utilisateur) pour ne pas casser le code frontend.
- Nouveau helper `current_association_id()` (défaut = première association de l'utilisateur, fallback = `default_association_id()`) utilisé par `is_admin()` legacy.
- Aucune suppression de fonction dans cette phase — seulement des `CREATE OR REPLACE`.

## Vérification après chaque lot

1. Linter Supabase (attendu : pas de nouvelle erreur, disparition progressive des warnings "Policy always true").
2. Requête de contrôle : compter les policies par table, vérifier qu'il n'en reste pas d'orphelines "true/true".
3. Test manuel utilisateur E2D : dashboard doit rester fonctionnel après **chaque** lot.

## Livrables

- 7 migrations SQL (une par lot), chacune soumise pour approbation.
- Mise à jour `docs/CHANGELOG.md` et `.lovable/plan.md` après chaque lot.
- Rapport final `docs/PHASE2_4_RLS_REPORT.md` avec matrice tables × policies.

## Hors périmètre

- Modification du code frontend (Phase 2.5).
- Provisioning de nouvelles associations (Phase 2.6).
- Suppression de `configurations_deprecated` (Phase 4).

## Ordre d'exécution proposé

`2.4.1 → 2.4.5 → 2.4.2 → 2.4.3 → 2.4.4 → 2.4.6 → 2.4.7`

(config d'abord pour que les tests de non-régression aient un exercice actif ; sport et CMS en dernier car moins critiques).
