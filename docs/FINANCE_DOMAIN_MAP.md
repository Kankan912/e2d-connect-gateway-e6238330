# Finance Domain Map — Phase 4.1

État des lieux exhaustif des sources de mouvements financiers avant l'introduction
du `FinancialEngine`. Ce document sert de **spécification** pour la sous-phase 4.2
(RPC `record_caisse_movement`) et pour la migration progressive des hooks (4.4).

---

## 1. Table de vérité : `fond_caisse_operations`

Journal comptable unique. Colonnes clés :

| Colonne | Rôle |
|---|---|
| `type_operation` | `entree` \| `sortie` |
| `montant` | Toujours positif (le sens est porté par `type_operation`) |
| `categorie` | Taxonomie fonctionnelle (`cotisation`, `epargne`, `pret_emis`, `pret_remboursement`, `aide`, `sanction`, `don`, `beneficiaire`, `autre`) |
| `source_table` / `source_id` | Traçabilité de l'origine (idempotence future) |
| `operateur_id` | Auteur métier (membre / trésorier) |
| `beneficiaire_id` | Membre bénéficiaire (optionnel) |
| `reunion_id` / `exercice_id` | Contexte temporel |
| `association_id` | Multi-tenant (défaut `default_association_id()`) |
| `created_by` | `auth.uid()` — auteur technique |

**Contrat post-Phase 4** : toute écriture doit passer par la RPC
`record_caisse_movement(...)`. Les `INSERT` directs restent tolérés
en compatibilité mais seront marqués `deprecated` dans les hooks.

---

## 2. Inventaire des producteurs de mouvements caisse

### 2.1 Triggers SQL actifs (source actuelle de vérité)

| Table source | Triggers | Fonction cœur | Catégorie caisse |
|---|---|---|---|
| `cotisations` | `trigger_caisse_cotisations_{insert,update,delete}` | `create_caisse_operation_from_source` / `delete_caisse_operation_from_source` / `update_caisse_operation_on_status_change` | `cotisation` (entrée) |
| `epargnes` | `trigger_caisse_epargnes_{insert,update,delete}` | idem | `epargne` (entrée) |
| `prets` | `trigger_caisse_prets_{insert,delete}` | idem | `pret_emis` (sortie) |
| `prets_paiements` | `trigger_caisse_prets_paiements_{insert,delete}` | idem | `pret_remboursement` (entrée) + `update_pret_amounts` recalcule `prets.montant_paye` |
| `aides` | `trigger_caisse_aides_{insert,update,delete}` + `trg_create_caisse_on_aide_payee` | idem + `avancer_workflow_aide` | `aide` (sortie) |
| `reunions_sanctions` | `trigger_caisse_sanctions_{insert,update,delete}` + `trigger_sync_sanction_caisse` (`sync_sanction_to_caisse`) | idem | `sanction` (entrée si `payee`) |
| `reunion_beneficiaires` | `trg_sync_reunion_beneficiaire_to_caisse` (`sync_reunion_beneficiaire_to_caisse`) | dédiée | `beneficiaire` (sortie) |
| `prets_reconductions` | `trg_pret_reconduction_{before,after}_insert` | recalcul intérêts, pas d'impact caisse direct | — |
| `fond_caisse_operations` | `trigger_caisse_operation_audit` (`update_caisse_operation_audit`) | remplit `updated_at`, `updated_by` | — |

### 2.2 Écritures directes depuis le frontend (hors triggers)

Repérées dans le code React (à migrer en 4.4) :

- `useCaisse` — opérations manuelles (dépôts/retraits libres, catégorie `autre`).
- `useDonations` — insertion directe dans `fond_caisse_operations` après validation d'un don (catégorie `don`).
- `process-adhesion` (edge function) — insertion suite à paiement adhésion validé.
- `useLoanRequests` (RPC de disbursement) — création du prêt, cascade via trigger.

### 2.3 Vues / RPC de lecture consommées

| Consommateur | RPC / vue | Rôle |
|---|---|---|
| `useCaisse` (dashboard) | `get_solde_caisse()` | Solde net global |
| `CaisseAdmin` (synthèse) | `get_caisse_synthese()` | Agrégats par catégorie |
| `useCaisse` (stats) | `get_caisse_stats()` | KPI (entrées/sorties par période) |
| `caisseCalculations.ts` (client) | calcul local | Solde empruntable = 80% du fond − prêts en cours |

---

## 3. Règles métier financières à extraire (Phase 4.3)

Répertoire cible : `src/domain/finance/`.

| Service | Règles encapsulées | Sources actuelles |
|---|---|---|
| `LoanService` | Intérêts simples, statut (Remboursé > En retard > Reconduit > Partiel > En cours), reconductions, seuil 80% caisse | `pretCalculsService.ts`, `caisseCalculations.ts`, hooks/composants prêts |
| `CotisationService` | Résolution montant mensuel (override `cotisations_mensuelles_exercice` prioritaire), projection sur réunion, filtrage types actifs | `cotisationsLogic.test.ts`, `get_cotisation_mensuelle_membre` RPC, `projeter_cotisations_reunion` RPC |
| `AideService` | Workflow `demandee → validee → allouee → payee`, cascade caisse à `allouee` | `avancer_workflow_aide` RPC, `useAides` |
| `EpargneService` | Ventilation par exercice, calcul bénéfices annuels | `useEpargnantsBenefices`, hooks épargne |
| `SanctionService` | Barème (`sanctions_tarifs`), génération à la clôture de réunion, statut paiement | `ClotureReunionModal`, `sync_sanction_to_caisse` |
| `BeneficiaireService` | Calcul montant net annuel (12× mensuel − sanctions impayées), calendrier bénéficiaires | `CalendrierBeneficiaires`, `sync_reunion_beneficiaire_to_caisse` |

---

## 4. Gaps & incohérences identifiés

1. **Doubles sources d'écriture caisse** : triggers SQL + inserts directs frontend
   (`useCaisse`, `useDonations`). Risque de contournement des validations.
2. **Absence d'idempotence** : rejouer un trigger sur un `UPDATE` peut créer des doublons
   si la colonne `statut` transite plusieurs fois par la même valeur cible.
3. **`association_id` non forcé côté trigger** : dépend du `default_association_id()`
   au moment de l'insert — incorrect en contexte multi-tenant avec `set_current_association()`.
4. **Solde empruntable calculé côté client** — devrait vivre dans un service serveur
   pour cohérence multi-consommateurs (dashboard, workflow prêts, RPC de décaissement).
5. **Pas de matérialisation** : chaque dashboard recalcule via agrégations lourdes sur
   `fond_caisse_operations` (5000+ lignes et croissant).
6. **Métadonnées éparses** : `notes`, `justificatif_url`, `libelle` remplis de façon
   incohérente selon le producteur. Standardiser via une signature RPC unique.

---

## 5. Décisions pour la Phase 4.2 (FinancialEngine SQL)

- **RPC unique** `record_caisse_movement(p_type, p_montant, p_categorie, p_libelle, p_source_table, p_source_id, p_meta jsonb)` avec :
  - Validation `p_montant > 0`, `p_type IN ('entree','sortie')`.
  - Résolution `association_id` via `current_tenant_id()` (Phase 3).
  - Idempotence : si `(source_table, source_id, type_operation, categorie)` existe déjà, retour de l'opération existante (aucun doublon).
  - Renvoi de l'UUID de l'opération créée / existante.
- **RPC** `get_solde_empruntable(p_association_id uuid DEFAULT NULL)` : porte la règle
  80% côté serveur, remplace le calcul client.
- **Triggers actuels conservés** en compatibilité — ils seront réécrits en 4.4 pour
  appeler `record_caisse_movement` en interne, sans changement de comportement observable.

---

## 6. Suite

- **4.2** : migration SQL `record_caisse_movement` + `get_solde_empruntable` + GRANTs.
- **4.3** : services TypeScript sous `src/domain/finance/`.
- **4.4** : réécriture progressive des hooks (rétro-compatible).
- **4.5** : vue matérialisée `caisse_soldes_snapshot`.
- **4.6** : tests + doc `FINANCIAL_ENGINE.md` + `mem://`.
