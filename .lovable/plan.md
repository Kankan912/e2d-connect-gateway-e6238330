## Évolution du workflow de demande de prêt — Avaliste & ordre configurable

### 1. Base de données (migration)

**`loan_requests` — nouvelles colonnes**
- `avaliste_id uuid REFERENCES membres(id)` — obligatoire à la création
- `avaliste_self boolean DEFAULT false` — auto-avalisation
- `avaliste_statut text DEFAULT 'pending'` (`pending` / `approved` / `rejected`)
- `avaliste_motif_refus text`
- `avaliste_validated_at timestamptz`
- Rendre `capacite_remboursement` **nullable** (champ facultatif)
- Nouveau statut autorisé : `rejected_by_avaliste`

**Fonction `public.can_self_avaliser(_membre_id uuid) RETURNS boolean`** (SECURITY DEFINER) — true si le membre n'a **pas encore** bénéficié de sa cotisation sur l'exercice actif :
```sql
NOT EXISTS (
  SELECT 1 FROM reunion_beneficiaires rb
  JOIN calendrier_beneficiaires cb ON cb.id = rb.calendrier_id
  JOIN exercices e ON e.id = cb.exercice_id
  WHERE cb.membre_id = _membre_id
    AND e.statut = 'actif'
    AND rb.date_paiement IS NOT NULL
)
```

**Mise à jour `create_loan_request(...)`** — nouvelle signature avec `_avaliste_id`, `_avaliste_self` :
- `_capacite_remboursement` devient optionnel (suppression de la validation min length)
- Si `_avaliste_self = true` → vérifier que `_avaliste_id = membre courant` ET appeler `can_self_avaliser`. Sinon lever `Vous avez déjà bénéficié...`
- Si avaliste ≠ demandeur → vérifier que l'avaliste est actif (`statut NOT IN supprime/suspendu/inactif`)
- Stocker `avaliste_id`, `avaliste_self`
- Si `avaliste_self` : pré-remplir `avaliste_statut='approved'`, `avaliste_validated_at=now()`

**Trigger `trg_loan_request_init_steps()` adapté** :
- Si `avaliste_self = true` OU `avaliste_id IS NULL` (auto-validé) → demande directement en `in_progress` sur la 1ʳᵉ étape config
- Sinon → statut `awaiting_avaliste` (nouveau statut autorisé), aucune étape config créée tant que l'avaliste n'a pas approuvé
- Ajouter `awaiting_avaliste` et `rejected_by_avaliste` au CHECK statut

**Nouvelles RPC** :
- `avaliste_approve_loan_request(_request_id uuid)` — vérifie `auth.uid()` correspond à `avaliste_id`, met `avaliste_statut='approved'`, déclenche la création des étapes config (passage en `in_progress`)
- `avaliste_reject_loan_request(_request_id uuid, _motif text)` — motif obligatoire (min 5), met `statut='rejected_by_avaliste'`, `avaliste_statut='rejected'`, `avaliste_motif_refus=_motif`

**RLS** : l'avaliste doit pouvoir SELECT la demande qui le désigne (ajouter `avaliste_id = (current_membre_id())` aux policies de `loan_requests` et `loan_request_validations`).

**`get_loan_request_validators_emails`** : ajouter une ligne pour l'email de l'avaliste lorsque `avaliste_statut='pending'`.

### 2. Edge function `send-loan-notification`
- Nouveau type `avaliste_request` → email à l'avaliste + notif in-app
- Nouveau type `avaliste_approved` → email au demandeur
- Nouveau type `avaliste_rejected` → email au demandeur avec motif
- Déclenchés depuis le frontend après création / approve / reject

### 3. Frontend

**`LoanRequestDialog.tsx`**
- Ajouter sélecteur `avaliste_id` (liste des membres actifs via `useMembers`) avec option « Moi-même (auto-avalisation) »
- Si auto-sélection : appel RPC `can_self_avaliser` ; afficher message d'erreur explicite si refusé
- Rendre `capacite_remboursement` **facultatif** (retirer le `.min(3)` du schéma zod, retirer l'astérisque)
- Passer `avaliste_id` + `avaliste_self` à `useCreateLoanRequest`

**`useLoanRequests.ts`**
- Étendre la mutation `useCreateLoanRequest` (avec nouveaux params)
- Nouveaux hooks : `useAvalisteApprove`, `useAvalisteReject`, `useCanSelfAvaliser`
- Nouveau hook `useAvalisteRequests` (liste des demandes en attente où je suis avaliste)

**`LoanValidationTimeline.tsx`**
- Insérer en tête une étape virtuelle « Avaliste » avec :
  - Nom + fonction de l'avaliste (ou « Auto-avalisation » si self)
  - Statut (✅ validé / 🟡 en attente / 🔴 refusé avec motif / ⚪ non démarrée)
  - Date de validation, commentaire
- Conserver le code couleur demandé

**`MesDemandesPret.tsx`** — afficher le nouvel état `awaiting_avaliste` et `rejected_by_avaliste` (badge + motif).

**Nouvelle page / section `MesValidationsAvaliste`** dans le dashboard pour qu'un membre voie les demandes où il est avaliste, avec boutons Approuver / Refuser (refus ouvre `LoanRejectDialog` avec motif obligatoire — réutiliser le composant existant).

**`DemandesPretAdmin.tsx`** : afficher colonne « Avaliste » + filtrer/lister les demandes bloquées par avaliste.

### 4. Configuration (admin)
L'écran `LoanWorkflowConfig.tsx` reste inchangé — l'étape Avaliste est **implicite** (toujours en position 0, non éditable). Ajouter en haut de l'écran un bandeau d'info :
> « Étape 0 — Avaliste (obligatoire, non configurable). Les étapes ci-dessous démarrent après validation de l'avaliste. »

### Détails techniques

**Statuts `loan_requests`** : `awaiting_avaliste`, `in_progress`, `rejected`, `rejected_by_avaliste`, `approved`, `disbursed`.

**Migration `cancel_loan_request`** : autoriser l'annulation aussi en `awaiting_avaliste`.

**Tests à effectuer après build** :
1. Création avec avaliste tiers → statut `awaiting_avaliste`, aucun `loan_request_validations` créé
2. Approbation avaliste → bascule en `in_progress`, étapes config créées
3. Refus avaliste avec motif → `rejected_by_avaliste`, workflow arrêté
4. Auto-avalisation membre non bénéficiaire → étapes config créées immédiatement
5. Auto-avalisation membre déjà bénéficiaire → erreur RPC explicite
6. Soumission sans `capacite_remboursement` → accepté
