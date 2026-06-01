## Phase 1 — Corrections Bloc Finances

Application des corrections identifiées dans `docs/AUDIT_FINANCES.md` après clarifications utilisateur.

### 1. Mise à jour audit (`docs/AUDIT_FINANCES.md`)
- C5 reclassé ✅ Conforme (formule `cotisation_mensuelle × nb_mois_exercice` = épargne individuelle annuelle, pas une redistribution)
- Ajout C13 : durée d'exercice à lire dynamiquement, jamais en dur
- Confirmation C6, C7, C8, C11, C12

### 2. C13 — Durée d'exercice dynamique (calculs bénéficiaires)
**SQL** — `calculer_montant_beneficiaire(membre_id, exercice_id)` :
- Calculer `v_nb_mois := GREATEST(1, (EXTRACT(YEAR FROM age(date_fin, date_debut))*12 + EXTRACT(MONTH FROM age(date_fin, date_debut)))::int)` depuis `exercices_cotisations`
- Remplacer `v_montant_mensuel * 12` par `v_montant_mensuel * v_nb_mois`
- Retourner `nb_mois` dans le JSON pour traçabilité

**Frontend** — `src/lib/beneficiairesCalculs.ts`, `useCalendrierBeneficiaires.ts` :
- Récupérer `date_debut`/`date_fin` de l'exercice et calculer `nbMois`
- Utiliser `montantMensuel × nbMois` partout, supprimer toute constante `12`
- Afficher `nbMois` dans la fiche bénéficiaire (ex. "Épargne sur 12 mois")

### 3. C8 — Restriction permissions calendrier bénéficiaires
**Frontend** — `CalendrierBeneficiaires.tsx`, `Beneficiaires.tsx`, hooks d'écriture :
- Remplacer les checks basés sur `is_admin()` (qui inclut `secretaire_general`) par un nouveau helper `canManageBeneficiaires()` = `administrateur` OU `tresorier` OU (`secretaire_general` AVEC rôle `administrateur` explicitement attribué)
- Boutons Ajouter / Modifier / Supprimer / Réorganiser masqués sinon

**SQL** — nouvelle fonction `public.can_manage_beneficiaires()` (SECURITY DEFINER) utilisée dans les policies RLS de `beneficiaires_mensuels` (UPDATE/INSERT/DELETE)

### 4. C6 + C7 — UI calendrier : regroupement mensuel + ajout manuel
- Vue calendrier groupée par mois (header mois + liste bénéficiaires sous le mois)
- Plusieurs bénéficiaires/mois affichés côte à côte, chacun garde son montant individuel (aucune division)
- Bouton "Ajouter un bénéficiaire" par mois → modal de sélection membre
- Bouton "Modifier" / "Retirer" par ligne
- Drag-and-drop ou flèches pour réordonner manuellement (champ `ordre` ou `mois_position`)

### 5. C11 + C12 — Workflow reconduction prêt (séquentiel configurable)
**Architecture identique aux `loan_requests`** :

**SQL** — nouvelles tables :
- `pret_reconduction_validation_config(id, role, label, ordre, actif)` — éditable par admin, mêmes RPC que `loan_validation_config` (`upsert_*`, `delete_*`, `reorder_*`)
- `prets_reconductions_validations(id, reconduction_id, role, label, ordre, statut, validated_by, validated_at, commentaire)`
- Ajout colonnes sur `prets_reconductions` : `statut` enum (`en_attente`, `in_progress`, `approved`, `rejected`), `current_step`, `motif_rejet`
- RPC `validate_reconduction_step(reconduction_id, commentaire)` et `reject_reconduction_step(reconduction_id, motif)` (calque exact de `validate_loan_step` / `reject_loan_step`)
- Trigger init des étapes à l'insertion + trigger d'avancement séquentiel
- Remplacer trigger existant `enforce_reconduction_validation` par le nouveau workflow

**Frontend** :
- Page admin `PretsReconductionConfig` (calquée sur `LoanWorkflowConfig`)
- `ReconduireModal` : soumission crée la reconduction en `in_progress`, plus de validation immédiate
- Nouveau composant `ReconductionValidationTimeline` (calque de `LoanValidationTimeline`)
- Emails de notification aux validateurs (réutilisation de `send-loan-notification` ou nouvelle fonction `send-reconduction-notification`)

### 6. Tests + mémoire
- Mise à jour `pretCalculsService.test.ts` (workflow reconduction)
- Nouveau test `beneficiairesCalculs.test.ts` (formule dynamique `× nb_mois`)
- Mise à jour `mem://modules/beneficiaries/calendar-management-logic-v2`
- Nouvelle mémoire `mem://modules/loans/reconduction-workflow`

### Détails techniques

```text
Ordre d'exécution :
1. docs/AUDIT_FINANCES.md (mise à jour)
2. Migration SQL : calculer_montant_beneficiaire (nb_mois dynamique)
                 + can_manage_beneficiaires() + RLS beneficiaires_mensuels
                 + tables/RPC/triggers reconduction workflow
3. Code frontend bénéficiaires (C13, C8, C6, C7)
4. Code frontend reconduction (C11, C12) + page config admin
5. Edge function notification reconduction
6. Tests + mémoires
```

**Hors scope** (autres blocs) : Réunions, Email+Notifications+Users+Logs, Matchs+Site+Galerie, UX globale — traités dans les phases suivantes après validation de ce bloc.

**Livraison** : un commit par sous-module (bénéficiaires / reconduction), rapport final mis à jour dans `docs/AUDIT_FINANCES.md`, pause pour validation avant Bloc 2 (Réunions).
