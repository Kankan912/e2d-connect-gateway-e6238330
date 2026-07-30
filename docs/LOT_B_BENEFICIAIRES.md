# Lot B — Calendrier bénéficiaires & paiements en réunion

## Objectifs
1. Pré-remplir automatiquement les bénéficiaires d'une réunion à partir du calendrier annuel (relation 1 réunion ↔ N bénéficiaires).
2. Fiabiliser la validation du paiement (montant réel, date, mode, référence) et sa répercussion en caisse.

## Backend
- **RPC `auto_fill_reunion_beneficiaires(p_reunion_id uuid) returns integer`** — `SECURITY DEFINER`. Insère dans `reunion_beneficiaires` les membres du calendrier (`calendrier_beneficiaires`) dont `mois_benefice` correspond au mois de la réunion, en ignorant ceux déjà assignés. Retourne le nombre de lignes créées.
- **Trigger `trg_reunion_auto_fill_beneficiaires`** (AFTER INSERT sur `reunions`) — appelle la RPC ci-dessus pour chaque nouvelle réunion.
- **RPC `valider_paiement_beneficiaire(p_id, p_montant, p_date_paiement, p_mode, p_reference, p_notes)`** — met à jour la ligne `reunion_beneficiaires` (statut `paye`/`partiel`) et délègue l'écriture caisse au FinancialEngine (`record_caisse_movement`, catégorie `distribution_beneficiaire`).
- **RPC `calculer_montant_beneficiaire(p_membre_id, p_exercice_id)`** — retourne `montant_mensuel`, `montant_brut`, `sanctions_impayees`, `montant_net`.
- **Trigger `trg_calendrier_beneficiaires_compute_total`** — recalcule `montant_total` sur le calendrier.

## Frontend
| Fichier | Rôle |
|---|---|
| `src/components/BeneficiairesReunionWidget.tsx` | Liste des bénéficiaires de la réunion, statuts (Payé / Partiel / En retard > 7 jours / Impayé), totaux, orchestration des modales |
| `src/components/beneficiaires/AssignerBeneficiaireModal.tsx` | Sélection d'un bénéficiaire prévu, calcul du net avant confirmation |
| `src/components/beneficiaires/ValiderPaiementBeneficiaireModal.tsx` | Formulaire de paiement (montant, date, mode, référence, notes) → RPC `valider_paiement_beneficiaire` |
| `src/pages/reunions/components/BeneficiairesTab.tsx` | Onglet réunion + sous-onglet « Calendrier annuel » en lecture seule |
| `src/hooks/useCalendrierBeneficiaires.ts` | Accès calendrier, `calculerMontant`, mutations d'assignation |

Après validation, les caches `['beneficiaires-reunion', reunionId]` et `['caisse-solde']` sont invalidés.

## Sécurité
- Les deux RPC sont `SECURITY DEFINER` avec contrôle d'accès (`is_admin()` / permissions `beneficiaires`), l'isolation multi-tenant reposant sur `current_association_id()`.
- Aucune écriture directe dans `fond_caisse_operations` : tout passe par `record_caisse_movement`.

## Vérification manuelle
1. Créer une réunion sur un mois ayant des bénéficiaires au calendrier → ils apparaissent automatiquement dans l'onglet Bénéficiaires.
2. Cliquer « Assigner » sur un bénéficiaire restant → le montant net (brut − sanctions impayées) s'affiche avant confirmation.
3. Cliquer « Marquer payé », saisir un montant partiel → statut `partiel`, opération de caisse créée, solde mis à jour.
4. Saisir le solde restant → statut `paye`.
5. Onglet « Calendrier annuel » → lecture seule, cohérent avec les montants affichés.

## Historique
- Juillet 2026 (Lot B-bis) : extraction des modales `AssignerBeneficiaireModal`
  et `ValiderPaiementBeneficiaireModal`, widget réduit à l'affichage et à
  l'orchestration.
