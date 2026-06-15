## Lot 3 — Workflow demandes de prêt & notifications côté membre

### Constat (déjà en place)
- ✅ RPC `create_loan_request`, `validate_loan_step`, `reject_loan_step`, `disburse_loan`
- ✅ Workflow multi-étapes configurable (`loan_validation_config` + triggers d'avancement)
- ✅ Notifications **email** via edge function `send-loan-notification` (events: `created`, `step_validated`, `rejected`, `final_approved`)
- ✅ `LoanRequestDialog` (création) + `LoanValidationTimeline` (suivi visuel)
- ✅ `MesDemandesPret` avec filtres statut/urgence (Lot 2)

Le Lot 3 ne refait donc PAS le workflow : il **enrichit l'expérience membre** sur 4 axes ciblés.

---

### 1. Simulateur dans `LoanRequestDialog`
Avant soumission, afficher une carte récapitulative live :
- Taux d'intérêt par défaut lu depuis `caisse_config.taux_interet_defaut` (nouvelle requête légère React Query).
- **Montant total à rembourser** = `montant + montant × taux/100` (formule alignée avec `calculate_total_pret_amount` côté SQL, sans reconductions à la création).
- **Mensualité indicative** = `total / duree_mois` (arrondi FCFA).
- **Date d'échéance estimée** = `today + duree_mois` (date-fns `addMonths`).
- Note explicative : « Indicatif — le taux final sera fixé au décaissement ».

### 2. Annulation d'une demande en attente
- Nouvelle RPC `cancel_loan_request(_request_id uuid)` :
  - Vérifie `auth.uid()` propriétaire (`membres.user_id`).
  - Autorisé uniquement si `statut IN ('pending','in_progress')` ET aucune étape déjà `approved`.
  - Passe `loan_requests.statut` à `cancelled`, `motif_rejet = 'Annulée par le membre'`.
  - Marque les étapes restantes `pending` → `cancelled`.
- Ajout du statut `cancelled` dans le type TS `LoanRequestStatus` + badge gris.
- Hook `useCancelLoanRequest` (mutation, invalide `my-loan-requests`).
- Bouton **Annuler ma demande** sur `LoanRequestCard` (AlertDialog de confirmation — pas de `window.confirm`, cf. mémoire UI/UX).
- Le bouton n'est visible que si statut ∈ {pending, in_progress} ET `current_step <= 1`.

### 3. Timeline enrichie pour le membre
Modifications dans `LoanValidationTimeline` (ou wrapper côté membre) :
- Afficher pour chaque étape validée/rejetée :
  - **Nom du validateur** (joindre `profiles` via `validated_by`).
  - **Date** au format `dd/MM/yyyy HH:mm`.
  - **Commentaire** s'il existe (déjà en base, juste à exposer).
- Étendre `useLoanRequestValidations` pour ramener `profiles:validated_by(prenom, nom)`.

### 4. Notifications in-app (cloche du dashboard)
- Étendre `supabase/functions/send-loan-notification/index.ts` pour, en plus de l'email, **insérer une ligne dans `notifications_historique`** côté membre demandeur sur les événements `step_validated`, `rejected`, `final_approved`, et côté validateurs sur `created`.
  - Champs : `user_id`, `type='loan_request'`, `titre`, `message`, `lu=false`, `reference_id=request_id`.
  - Service role utilisé (déjà disponible dans la fonction).
- Aucune modification du `NotificationCenter` : il consomme déjà `notifications_historique` en realtime.
- Vérifier au préalable la structure exacte de `notifications_historique` (11 colonnes — lecture via `supabase--read-query` avant migration éventuelle de policy).

---

### Migration SQL (un seul fichier)
```sql
-- 1) Ajouter le statut 'cancelled' au domaine applicatif (colonne text, pas d'enum → rien à modifier)

-- 2) RPC d'annulation
CREATE OR REPLACE FUNCTION public.cancel_loan_request(_request_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_request record;
  v_membre_user uuid;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentification requise'; END IF;

  SELECT lr.*, m.user_id AS owner_uid
    INTO v_request
    FROM public.loan_requests lr
    JOIN public.membres m ON m.id = lr.membre_id
   WHERE lr.id = _request_id
   FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Demande introuvable'; END IF;

  IF v_request.owner_uid <> auth.uid() AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'Action non autorisée';
  END IF;

  IF v_request.statut NOT IN ('pending','in_progress') THEN
    RAISE EXCEPTION 'Seules les demandes en attente ou en cours peuvent être annulées';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.loan_request_validations
     WHERE loan_request_id = _request_id AND statut = 'approved'
  ) THEN
    RAISE EXCEPTION 'Une validation a déjà été enregistrée — annulation impossible';
  END IF;

  UPDATE public.loan_request_validations
     SET statut = 'cancelled'
   WHERE loan_request_id = _request_id AND statut = 'pending';

  UPDATE public.loan_requests
     SET statut = 'cancelled',
         motif_rejet = COALESCE(motif_rejet, 'Annulée par le membre')
   WHERE id = _request_id;

  RETURN jsonb_build_object('success', true, 'request_id', _request_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.cancel_loan_request(uuid) TO authenticated;
```
*(Pas de nouvelle table — donc pas de bloc GRANT supplémentaire à prévoir.)*

### Edge function — modifications
- Ouvrir `supabase/functions/send-loan-notification/index.ts`, après l'envoi email, insérer dans `notifications_historique` via le client `service_role` (déjà construit dans la fonction). Schéma à confirmer avant écriture (lecture via `supabase--read-query`).
- Aucune nouvelle secret nécessaire.

### Hors périmètre
- Pas de modification du moteur de validation (RPC existantes intactes).
- Pas d'écran d'historique global, pas d'export PDF des demandes (Lot 1/2 couvrent les exports).
- Pas d'ajout au workflow admin (`DemandesPretAdmin` reste tel quel — il affichera juste le nouveau statut `cancelled`).
- Pas de modification des emails existants.

### Validation
- `tsc --noEmit` propre.
- Test fonctionnel : créer une demande → vérifier simulateur, annuler avant validation, valider une étape côté admin et vérifier que le membre reçoit l'in-app notification + voit le validateur + la date dans la timeline.
- Vérifier que le bouton Annuler disparaît après la 1ère validation.

### Détails techniques
- TS : étendre `LoanRequestStatus = "pending" | "in_progress" | "rejected" | "approved" | "disbursed" | "cancelled"`.
- Badge `cancelled` : variant `outline` + texte gris.
- Simulateur : nouveau hook `useDefaultLoanRate()` (query `caisse_config` → `taux_interet_defaut`, stale 5 min).
- AlertDialog shadcn pour la confirmation d'annulation.
