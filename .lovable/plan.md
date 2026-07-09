# Fix RLS — `cotisations_mensuelles_exercice`

## Diagnostic

L'UI affiche `new row violates row-level security policy for table "cotisations_mensuelles_exercice"` lors de la sauvegarde de montants verrouillés.

Vérification base : `pg_policies` retourne **0 politique** pour `cotisations_mensuelles_exercice` (et 0 pour `cotisations_mensuelles_audit`), alors que RLS est **activé**. Résultat : tout INSERT/UPDATE/DELETE est refusé, même pour un admin.

La migration `20260615170818` avait pourtant créé les politiques `cme_insert_authorized` / `cme_update_authorized` / `cme_delete_authorized` + `cma_select_authorized` / `cma_insert_authorized`. Elles ont été supprimées côté base (probablement via SQL editor). Il faut les recréer.

## Correction

Nouvelle migration qui **recrée à l'identique** les politiques de `20260615170818` :

- `cotisations_mensuelles_exercice`
  - `SELECT` : admin OU propre membre (déjà normalement en place — on la recrée par sécurité avec `DROP IF EXISTS`)
  - `INSERT` : admin OU `has_permission('cotisations','update')`
  - `UPDATE` : idem
  - `DELETE` : admin OU `has_permission('cotisations','delete')`
- `cotisations_mensuelles_audit`
  - `SELECT` / `INSERT` : admin OU `has_permission('cotisations','update')`
  - Trigger `cma_force_modifie_par` conservé (déjà en base normalement, recréé si absent)

GRANTs déjà en place (`SELECT/INSERT/UPDATE/DELETE` pour `authenticated`, `ALL` pour `service_role`) — pas de modification nécessaire côté GRANT.

## Hors périmètre

- Pas de changement UI ni de code applicatif.
- Pas de modification des fonctions `is_admin()` / `has_permission()`.

## Vérification

- Après migration : `SELECT count(*) FROM pg_policies WHERE tablename='cotisations_mensuelles_exercice'` retourne 4.
- Test manuel : rouvrir la modale "Modification de montants verrouillés" → confirmer → sauvegarde OK, entrée créée dans `cotisations_mensuelles_audit`.
