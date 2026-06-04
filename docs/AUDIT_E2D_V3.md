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

## Lots B – F

Non démarrés. Cf. plan dans `.lovable/plan.md`. Chaque lot ajoutera sa section à ce document.
