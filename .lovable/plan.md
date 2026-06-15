## Problème

Le bouton « Annuler ma demande » échoue avec un toast « Erreur inconnue ». Deux causes :

1. **Violation de contrainte côté base** : la table `loan_request_validations` a un `CHECK (statut IN ('pending','approved','rejected'))`. La RPC `cancel_loan_request` essaie d'écrire `'cancelled'` dans les étapes en attente → la mise à jour échoue dès qu'il existe au moins une ligne de validation (cas d'une demande `in_progress`, comme la demande auto‑avalisée du haut de la capture).
2. **Message d'erreur masqué côté front** : dans `useCancelLoanRequest`, l'erreur renvoyée par `supabase.rpc` est un `PostgrestError` (objet simple), pas une instance de `Error`. Le test `e instanceof Error ? e.message : "Erreur inconnue"` retombe systématiquement sur le message générique, ce qui cache la vraie raison.

## Correctifs

### 1. Migration SQL

- Élargir le `CHECK` de `public.loan_request_validations.statut` pour inclure `'cancelled'` (et conserver `pending/approved/rejected`).
  - `ALTER TABLE ... DROP CONSTRAINT loan_request_validations_statut_check`
  - `ALTER TABLE ... ADD CONSTRAINT loan_request_validations_statut_check CHECK (statut IN ('pending','approved','rejected','cancelled'))`
- Aucune autre modification de schéma : la RPC `cancel_loan_request` actuelle est déjà correcte (statuts autorisés, vérification owner/admin, blocage si une étape est `approved`).

### 2. `src/hooks/useLoanRequests.ts` — `useCancelLoanRequest.onError`

Remplacer l'extraction du message par une lecture défensive qui couvre :
- `Error` standard (`e.message`)
- `PostgrestError` (`e.message` même si non‑Error)
- Objet inattendu (fallback final `"Erreur inconnue"`)

Implémentation : tester `typeof e === "object" && e && "message" in e && typeof e.message === "string"` avant le fallback. Appliquer le même utilitaire (petite fonction locale `extractErrorMessage`) aux autres `onError` du fichier qui souffrent du même biais : `useCreateLoanRequest`, `useAvalisteApprove`, `useAvalisteReject`, `useValidateLoanStep`, `useRejectLoanStep`, `useDisburseLoanRequest` (si présents et concernés). Aucune modification UI.

## Validation

- Cliquer « Annuler ma demande » sur la demande auto‑avalisée (`in_progress`) → toast « Demande annulée », statut passe à `cancelled`, lignes `loan_request_validations` en `pending` deviennent `cancelled`.
- Cliquer « Annuler ma demande » sur la demande `awaiting_avaliste` → toast « Demande annulée » (cas déjà fonctionnel, simplement vérifié).
- Tenter d'annuler une demande dont une étape est déjà `approved` → toast affichant le vrai message « Au moins une étape déjà validée — annulation impossible » (au lieu de « Erreur inconnue »).

## Hors périmètre

- Pas de changement du workflow avaliste, des emails, ni de l'UI des cartes de demande.
