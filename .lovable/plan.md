## Lot 3.1 — Synchronisation E2E du workflow de prêts

Audit du workflow `demande → validation → décaissement → caisse → notifications`. 6 défauts de synchronisation détectés. Aucune nouvelle fonctionnalité — uniquement des correctifs ciblés.

---

### Défauts identifiés

| # | Symptôme | Cause | Fix |
|---|---|---|---|
| 1 | Nom du validateur jamais affiché dans la timeline | `useLoanRequestValidations` joint `profiles!loan_request_validations_validated_by_fkey` — cette FK n'existe pas → fallback sans join | Ajouter la FK `validated_by → profiles(id)` via migration, OU faire un fetch séparé des profils. Choix : **fetch séparé** (moins intrusif, pas de changement de schéma) |
| 2 | Solde caisse / synthèse / opérations ne se rafraîchissent pas après un décaissement | `useDisburseLoan` invalide `["caisse"]` (clé inexistante) au lieu de `["caisse-operations"]`, `["caisse-stats"]`, `["caisse-synthese"]`, `["caisse-config-alertes"]` | Aligner les invalidations sur les vraies clés |
| 3 | `MyPrets` du membre reste vide après décaissement | `useDisburseLoan` n'invalide pas `["user-prets"]` ni `["prets-en-retard"]` / `["prets-en-retard-count"]` | Ajouter ces invalidations |
| 4 | Badge admin vide pour une demande annulée | `statusBadge` dans `DemandesPretAdmin` n'a pas de case `cancelled` (switch non exhaustif → `undefined`) | Ajouter le case `cancelled` + un onglet "Annulées" |
| 5 | Validateurs non notifiés quand un membre annule sa demande | `useCancelLoanRequest` ne déclenche aucun email | Étendre `send-loan-notification` avec event `cancelled` (notifie les validateurs) + appeler depuis le hook |
| 6 | Realtime côté membre rate les avancées de validation | Channel `loan_requests_self` invalide bien `my-loan-requests` mais pas `loan-request-validations` par requestId (alors que l'admin le fait) | Aligner sur l'admin : invalider aussi `["loan-request-validations"]` |

---

### Implémentation

#### A. `src/hooks/useLoanRequests.ts`
- **`useLoanRequestValidations`** : retirer le join cassé, faire un second fetch sur `profiles` (`in: validated_by IN (...)`) et fusionner côté client en `validator`. Conserve le type existant.
- **`useDisburseLoan.onSuccess`** : remplacer `["caisse"]` par `["caisse-operations"]`, `["caisse-stats"]`, `["caisse-synthese"]`, `["caisse-config-alertes"]`. Ajouter `["user-prets"]`, `["prets-en-retard"]`, `["prets-en-retard-count"]`.
- **`useMyLoanRequests`** channel : ajouter `qc.invalidateQueries({ queryKey: ["loan-request-validations"] })` dans le handler `loan_request_validations` (déjà présent côté admin).
- **`useCancelLoanRequest`** : après succès, appeler `notifyEvent({ request_id, event: "cancelled" })` (non bloquant).
- Étendre le type union `EventType` côté hook (`notifyEvent`) pour inclure `"cancelled"`.

#### B. `supabase/functions/send-loan-notification/index.ts`
- Ajouter `"cancelled"` au type `EventType`.
- Branche `cancelled` : récupérer les validateurs via `get_loan_request_validators_emails`, envoyer un email "Demande de prêt annulée par le membre" (sujet + body court avec recap). Pas de notification au membre lui-même (action initiée par lui).
- Aucun secret ni paramètre nouveau.

#### C. `src/pages/admin/DemandesPretAdmin.tsx`
- `statusBadge` : ajouter `case "cancelled": return <Badge variant="outline" className="text-muted-foreground">Annulée</Badge>;`.
- `byStatus` : ajouter `cancelled: filtered.filter(r => r.statut === "cancelled")`.
- Ajouter un onglet `<TabsTrigger value="cancelled">Annulées ({byStatus.cancelled.length})</TabsTrigger>` + son `TabsContent`.
- Étendre `type` du `useState` du tab pour inclure `"cancelled"`.

### Hors périmètre
- Pas de modification des RPC `validate_loan_step`, `reject_loan_step`, `disburse_loan`, `cancel_loan_request`, `create_loan_request` (déjà conformes).
- Pas de changement de schéma (pas de FK ajoutée).
- Pas de modification du trigger `create_caisse_operation_from_source` (déjà câblé sur INSERT prets).
- Pas de notification in-app cloche (toujours hors scope, cf. Lot 3).
- Pas de bouton "Annuler" côté admin (la RPC l'autorise déjà pour `is_admin()`, mais l'usage UI n'a pas été demandé).

### Validation
- `tsc --noEmit` propre.
- Scénario E2E manuel à dérouler par l'utilisateur :
  1. Créer une demande → vérifier email validateurs.
  2. Annuler avant validation → vérifier email "annulée" reçu côté validateurs.
  3. Créer une nouvelle demande, valider toutes les étapes côté admin → vérifier que la timeline membre affiche nom + date du validateur en temps réel sans rechargement.
  4. Décaisser → vérifier que la caisse (solde, opérations, synthèse) ET la page `MyPrets` se rafraîchissent immédiatement, et que le badge "Décaissée" remonte.
  5. Vérifier l'onglet "Annulées" dans l'admin.

### Détails techniques
- Le fetch profils séparé reste léger (≤ N étapes par demande). Utilisé uniquement quand des `validated_by` non nuls existent.
- Les invalidations ajoutées sont idempotentes côté React Query.
- L'event `cancelled` réutilise `get_loan_request_validators_emails` (déjà accessible service_role dans la fonction Edge).
