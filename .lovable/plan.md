## Finalisation du module "Demande de prêt"

L'infrastructure backend (tables, RPC, triggers, RLS, edge function de notification) et les composants UI de base (dialog, timeline, hooks) sont déjà en place. Il reste à finaliser l'expérience utilisateur côté membre et admin, puis à brancher le routage et les notifications.

### 1. Page membre — "Mes demandes de prêt"
**Fichier** : `src/pages/MesDemandesPret.tsx` (nouveau)
- Liste des demandes du membre connecté avec badges de statut (brouillon, en cours, approuvée, rejetée, décaissée).
- Bouton "Nouvelle demande" → ouvre `LoanRequestDialog`.
- Pour chaque demande : carte cliquable affichant montant, durée, urgence, statut + `LoanValidationTimeline` détaillée (étape courante surlignée, validateurs, commentaires, dates).
- Realtime via le hook `useLoanRequests` déjà créé.

### 2. Page admin — "Demandes à valider"
**Fichier** : `src/pages/admin/DemandesPretAdmin.tsx` (nouveau)
- Tableau filtrable (statut, urgence, membre, période).
- Onglets : `À valider par moi` / `En cours` / `Approuvées` / `Rejetées` / `Décaissées`.
- Pour chaque ligne : actions selon rôle :
  - **Valider l'étape** (si `user_can_validate_loan_role` = true sur l'étape courante)
  - **Rejeter** (avec `LoanRejectDialog`)
  - **Décaisser** (Trésorier/Admin, si statut = `approved`) → appelle `disburse_loan` puis redirige vers la fiche prêt créée
- Détail latéral (Sheet) avec timeline complète + historique.

### 3. Configuration du workflow (admin)
**Fichier** : `src/pages/admin/LoanWorkflowConfig.tsx` (nouveau)
- Édition de la table `loan_validation_config` : ajout/suppression d'étapes, réordonnancement (drag & drop), activation/désactivation, libellé.
- RPC dédiées en migration : `upsert_loan_validation_step`, `delete_loan_validation_step`, `reorder_loan_validation_steps` (admin only via `is_admin()`).
- Avertissement : modifications n'affectent que les nouvelles demandes.

### 4. Routage & navigation
**Fichiers modifiés** : `src/App.tsx`, `src/components/Sidebar.tsx` (ou équivalent)
- Routes `lazyWithRetry` :
  - `/mes-demandes-pret` → `MesDemandesPret` (membre connecté)
  - `/admin/demandes-pret` → `DemandesPretAdmin` (permission `prets:validate` ou rôle de validation)
  - `/admin/configuration/workflow-prets` → `LoanWorkflowConfig` (admin)
- Entrée sidebar "Mes demandes" pour les membres + "Demandes à valider" pour les rôles concernés (badge avec compteur de demandes en attente sur leur étape).
- Suppression des entry points temporaires injectés dans `PretsAdmin.tsx` lors du lot précédent.

### 5. Branchement des notifications email
**Fichier modifié** : `src/hooks/useLoanRequests.ts`
- Vérifier que chaque mutation (`createLoanRequest`, `validateLoanRequest`, `rejectLoanRequest`, `disburseLoan`) appelle bien `send-loan-notification` avec le bon `event_type` :
  - `request_created` → notif aux validateurs de l'étape 1 + accusé au membre
  - `step_validated` → notif aux validateurs de l'étape suivante (ou au membre si dernière étape)
  - `step_rejected` → notif au membre avec motif
  - `loan_disbursed` → notif au membre + résumé
- L'edge function `send-loan-notification` utilise déjà `get_loan_request_validators_emails` et `get_loan_request_member_email`.

### 6. Permissions granulaires
**Migration SQL** : ajouts dans `role_permissions` via insert tool
- `prets_requests:create` → tous les membres actifs
- `prets_requests:validate` → tresorier, commissaire, president, secretaire, administrateur
- `prets_requests:disburse` → tresorier, administrateur
- `prets_requests:configure_workflow` → administrateur
- Helper `usePretRequestPermissions()` dans `src/hooks/` pour conditionner l'affichage UI.

### Points de validation
- Aucun calcul métier côté frontend : tous les changements de statut passent par RPC `SECURITY DEFINER`.
- Realtime sur `loan_requests` + `loan_request_validations` pour mise à jour live des deux pages.
- AlertDialog (jamais `window.confirm`) pour valider/rejeter/décaisser.
- Padding mobile `p-3 sm:p-6` sur les nouvelles pages.
- FCFA partout, formatage cohérent avec le reste de l'app.
- Logger via `src/lib/logger.ts`, gestion d'erreur `catch (error: unknown)` + extraction `data?.error`.

### Livrables
**Créés** : `MesDemandesPret.tsx`, `DemandesPretAdmin.tsx`, `LoanWorkflowConfig.tsx`, `usePretRequestPermissions.ts`, migration SQL (RPC config workflow + seed permissions).
**Modifiés** : `App.tsx`, sidebar, `useLoanRequests.ts`, `PretsAdmin.tsx` (nettoyage), `GUIDE_UTILISATEUR.md` + `CHANGELOG.md`.

Validez ce plan pour que je passe en mode build et exécute l'ensemble.