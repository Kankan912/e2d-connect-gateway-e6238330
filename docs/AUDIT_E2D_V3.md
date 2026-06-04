# Audit E2D V3 — Stabilisation

Document central de l'audit V3 (cf. `.lovable/plan.md`). Chaque lot ajoute son tableau.

Légende statut : 🔴 critique · 🟠 majeur · 🟡 mineur · 🔵 info · ✅ corrigé · ⏳ à faire

---

## Lot A — Finances (Phases 4 / 5 / 6 / 7)

### Audit

| Réf | Module | Fonctionnalité | Attendu | Observé | Anomalie | Impact | Correction |
|-----|--------|----------------|---------|---------|----------|--------|------------|
| A1 | Réunions / Cotisations | Ouverture d'une réunion (`statut → en_cours`) | Trigger `reunions_projeter_cotisations` projette une cotisation mensuelle par membre actif | La fonction `projeter_cotisations_reunion` interroge `exercices_cotisations` (table inexistante — la vraie est `exercices`) | 🔴 Exception SQL → l'ouverture de réunion échoue OU les cotisations ne sont pas projetées | Bloque la collecte de cotisations en séance | ✅ Migration : renommer la cible en `exercices` |
| A2 | Bénéficiaires / Caisse | Marquer un bénéficiaire `paye` dans `reunion_beneficiaires` | Doit créer automatiquement une opération sortie `categorie='beneficiaire'` dans `fond_caisse_operations` | Aucun trigger : les 8 lignes existantes ont été créées manuellement | 🟠 Désynchronisation Bénéficiaires ↔ Caisse. Le solde de caisse peut être faux si l'opération manuelle est oubliée | Incohérence dashboard / synthèse | ✅ Migration : trigger `sync_reunion_beneficiaire_to_caisse` (INSERT/UPDATE/DELETE) |
| A3 | Bénéficiaires (code) | Calcul du solde net | Formule règle métier : `cotisation_mensuelle × nb_mois_exercice` (RPC `calculer_montant_beneficiaire`) | Fichier `src/lib/beneficiairesCalculs.ts` calcule encore le brut à partir des **cotisations payées** et compte deux fois les sanctions sport (`sanctions_impayees` + `fondsSport` filtré `contexte_sanction='sport'` qui est inclus dans le premier) | 🟡 Code mort (aucun import) mais piège pour le futur, viole la règle métier | Risque de régression | ✅ Fichier supprimé |
| A4 | Cotisations | Montants individuels par membre / exercice | `cotisations_mensuelles_exercice` consulté en priorité, fallback `cotisations_types.montant_defaut` | RPC `get_cotisation_mensuelle_membre` et `calculer_montant_beneficiaire` respectent cette priorité | Aucune anomalie | — | — |
| A5 | Cotisations | Verrouillage à l'activation d'exercice | Trigger `verrouiller_cotisations_mensuelles_on_exercice_actif` sur `exercices` | Présent et fonctionnel (statut `planifie → actif`) | Aucune anomalie | — | — |
| A6 | Caisse | Source unique des soldes | RPC `get_solde_caisse` + `get_caisse_synthese` | Présent, agrégat correct, % empruntable configurable | Aucune anomalie | — | — |
| A7 | Caisse | Solde empruntable | 80 % × fond total − prêts en cours | `get_caisse_synthese` calcule `FLOOR((fondTotal × pourcentage / 100) - prets_en_cours)` | Conforme | — | — |
| A8 | Prêts | Décaissement | `disburse_loan` crée la ligne `prets` + déclenche `create_caisse_operation_from_source` (catégorie `pret_decaissement`) | Conforme | — | — | — |
| A9 | Prêts | Remboursement partiel | Réduit `capital` uniquement, n'altère pas l'intérêt initial | `update_pret_amounts` recalcule `montant_paye` sans toucher au taux | Conforme | — | — |
| A10 | Prêts | Reconduction multi-valideurs | Workflow configurable via `pret_reconduction_validation_config` | SQL livré, **frontend absent** : aucun composant ne consomme `validate_pret_reconduction_step` / `reject_pret_reconduction_step` / `upsert_pret_reconduction_validation_step` | 🟡 Workflow théoriquement opérationnel via mode legacy (auto-validation admin), mais l'admin ne peut pas configurer les étapes en UI | Fonctionnalité partielle (déjà documentée dans `AUDIT_FINANCES.md`) | ⏳ Reporté — frontend à livrer (voir reste à faire) |
| A11 | Bénéficiaires | Calendrier — durée exercice | `nb_mois` dynamique via `get_exercice_nb_mois` | Trigger `calendrier_beneficiaires_compute_total` + RPC actualisés (C13) | Conforme | — | — |
| A12 | Bénéficiaires | Permissions calendrier | Admin + Trésorier uniquement | `can_manage_beneficiaires` exclut désormais `secretaire_general` (C8) | Conforme | — | — |
| A13 | Bénéficiaires | Regroupement par mois | Plusieurs bénéficiaires par mois, montants individuels | `CalendrierBeneficiairesManager` regroupe via `groupedByMonth` (C6/C7) | Conforme | — | — |

### Corrections livrées (Lot A)

Migration `20260604_lot_a_finances` :

1. **A1** : `CREATE OR REPLACE FUNCTION public.projeter_cotisations_reunion` — substitue `exercices_cotisations` par `exercices`.
2. **A2** : Trigger `sync_reunion_beneficiaire_to_caisse` (BEFORE INSERT OR UPDATE OR DELETE) qui maintient une opération `categorie='beneficiaire'`, `type_operation='sortie'`, dans `fond_caisse_operations` quand `statut='paye'`. Idempotent (delete + insert).
3. **A3** : Suppression de `src/lib/beneficiairesCalculs.ts` (code mort, formule obsolète).

### Reste à faire (Lot A)

- **A10** : Frontend reconduction (4-5 fichiers déjà spécifiés dans `AUDIT_FINANCES.md`). Sera attaqué dans un lot dédié à la demande explicite de l'utilisateur, car aucune anomalie de fonctionnement n'est observée sur le mode legacy actuel.

### Tests réalisés

- Lecture des fonctions DB (`pg_proc`) — confirmé la référence cassée `exercices_cotisations` dans `projeter_cotisations_reunion`.
- Lecture des triggers (`pg_trigger`) — confirmé l'absence de sync `reunion_beneficiaires → fond_caisse_operations`.
- Vérification : 8 opérations caisse `categorie='beneficiaire'` (680 000 FCFA) déjà présentes, insérées manuellement.
- `rg` : `beneficiairesCalculs.ts` sans import dans le code (dead code).
- `get_caisse_synthese`, `get_solde_caisse`, `calculer_montant_beneficiaire` : conformes aux règles métier V3.

### Tests post-migration (à réaliser par l'utilisateur)

1. Ouvrir une réunion existante (`statut → en_cours`) → vérifier qu'une cotisation `en_attente` apparaît pour chaque membre actif.
2. Sur une réunion avec bénéficiaires assignés, marquer un bénéficiaire `paye` → vérifier qu'une ligne `fond_caisse_operations` apparaît avec `categorie='beneficiaire'`, et que le solde caisse diminue du montant correspondant.
3. Repasser le bénéficiaire à un autre statut → la ligne caisse correspondante doit être supprimée.

---

## Lot B — Réunions & dépendances

Audit du cycle de vie des réunions (ouverture, clôture, réouverture) et de leurs interactions avec cotisations, sanctions, bénéficiaires, caisse, notifications.

### Anomalies confirmées et corrigées

| ID | Sévérité | Constat | Correctif |
|---|---|---|---|
| **B1** | Majeur | `ClotureReunionModal` : si aucun membre présent n'avait d'email valide, la fonction **annulait la clôture** (`return` après toast). Contraire à la règle métier « la clôture ne doit pas dépendre de l'envoi email ». | La clôture se poursuit même sans destinataires. L'appel à l'edge function `send-reunion-cr` est conditionnel ; un toast informe l'utilisateur (CR envoyé / CR non envoyé / envoi échoué) sans bloquer le verrouillage et la génération de sanctions. |
| **B2** | Majeur | `ReouvrirReunionModal` : la suppression des sanctions auto-générées filtrait par `motif IN ('Absence non excusée', 'Huile & Savon non validé')` alors que la clôture insère les motifs `'Absence non excusée à la réunion'` et `'Huile & Savon non apporté'`. **Aucune sanction n'était donc jamais supprimée**, même quand l'utilisateur cochait l'option. | Filtrage désormais par `type_sanction IN ('absence', 'huile_savon')` (valeurs stables) et restreint à `statut = 'impaye'` pour préserver les sanctions déjà payées. |

### Constats conformes (aucune correction nécessaire)

- **Ouverture de réunion** : déclenche `projeter_cotisations_reunion` corrigée en Lot A (A1). Les cotisations sont projetées sur tous les membres E2D actifs avec montant individuel `cotisations_mensuelles_exercice`.
- **Clôture** : marque non-présents en `absent_non_excuse`, génère sanctions `absence` (config `sanction_absence_montant`, défaut 500 FCFA) et `huile_savon` (config `sanction_huile_savon_montant`, défaut 2000 FCFA), calcule `taux_presence` sur la base des membres E2D, met `statut = 'terminee'`.
- **Réouverture** : repasse `statut = 'en_cours'`, déverrouille les cotisations (`verrouille = false`), purge les opérations caisse auto-générées (`fond_caisse_operations` filtré par `reunion_id` — couvre les flux du trigger A2 du Lot A), enregistre un `audit_logs` dédié.
- **Synchronisation bénéficiaires ↔ caisse** : trigger `trg_sync_reunion_beneficiaire_to_caisse` (Lot A — A2) opère sur INSERT/UPDATE/DELETE. La purge `fond_caisse_operations` par `reunion_id` lors de la réouverture suffit à éviter la double-comptabilisation.
- **Présences ↔ sanctions** : les sanctions s'appuient uniquement sur les enregistrements `reunions_presences` (statut `absent_non_excuse`) et `reunions_huile_savon.valide`. Aucune duplication détectée.
- **Notifications partielles** : `send-reunion-cr` est invoquée best-effort, n'engage pas le statut de la réunion.

### Tests utilisateur à effectuer

1. **B1 — Clôture sans emails** : clôturer une réunion où aucun membre présent n'a d'email renseigné → la réunion doit passer à `terminee`, les sanctions doivent être créées, un toast doit indiquer « CR non envoyé ».
2. **B2 — Réouverture avec suppression sanctions** : clôturer une réunion (sanctions générées), la rouvrir en cochant « Supprimer les sanctions automatiques » → les sanctions `absence` et `huile_savon` impayées doivent disparaître ; les sanctions payées ou manuelles restent.
3. **Réouverture sans suppression** : même scénario sans cocher l'option → les sanctions doivent être conservées.
4. **Synchronisation caisse** : marquer un bénéficiaire comme `paye`, clôturer, vérifier la ligne dans `fond_caisse_operations`. Rouvrir la réunion → la ligne doit disparaître.

### Anomalies restantes / différées

Aucune anomalie résiduelle identifiée sur le périmètre Lot B. Prochain lot : **Lot C — Utilisateurs / Permissions / Email**.

---

## Lots C – F

Non démarrés. Cf. plan dans `.lovable/plan.md`.

