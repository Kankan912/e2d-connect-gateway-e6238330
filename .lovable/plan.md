# Finalisation Phase 4 — FinancialEngine

Objectif : clôturer les sous-phases **4.4** (migration des producteurs vers `record_caisse_movement`) et **4.6** (tests + documentation + mémoire), pour marquer la Phase 4 comme terminée dans `.lovable/plan.md`.

## 1. Sous-phase 4.4 — Migration des producteurs restants

### 1.1 Réécriture interne des triggers SQL
Migration unique qui remplace les `INSERT` directs dans `fond_caisse_operations` par des appels à `record_caisse_movement(...)` dans :
- `create_caisse_operation_from_source` (cotisations, épargnes, prêts, aides, paiements de prêts)
- `update_caisse_operation_on_status_change`
- `sync_sanction_to_caisse`
- `sync_reunion_beneficiaire_to_caisse`
- `trg_create_caisse_on_aide_payee` (workflow aides)

Conservation stricte du comportement observable (mêmes catégories, `source_table`/`source_id`, `association_id` désormais résolu via `current_tenant_id()` avec fallback `default_association_id()`). L'idempotence de la RPC neutralise les doublons éventuels sur `UPDATE` répétés.

### 1.2 Migration des écritures frontend restantes
Bascule vers `CaisseService.recordMovement()` (aucun changement UI) :
- `useDonations` — insertion post-validation de don (catégorie `don`)
- `supabase/functions/process-adhesion/index.ts` — écriture post-paiement adhésion (catégorie `adhesion`)

Les hooks purement lecteurs (`useAides`, `useEpargnes`, `usePrets`, `useCotisations`) restent inchangés : leurs écritures caisse transitent déjà via les triggers réécrits en 1.1.

### 1.3 Branchement des dashboards sur le snapshot
Ajout d'un hook `useCaisseSoldeSnapshot()` (wrapping `CaisseService.getSoldeSnapshot()`) et consommation dans :
- `CaisseAdmin` (bloc synthèse)
- `DashboardHome` (KPI caisse)

`get_solde_caisse()` reste utilisée pour les vues temps-réel critiques (formulaires de dépôt/retrait). Rafraîchissement de la MV déclenché après chaque `recordMovement` réussi via `CaisseService.refreshSnapshot()` (best-effort, silencieux en cas d'échec de concurrence).

## 2. Sous-phase 4.6 — Tests et documentation

### 2.1 Tests
- Tests Vitest supplémentaires ciblés sur `CaisseService` (mock Supabase) : validation des erreurs `DomainError`, mapping des paramètres RPC, gestion du snapshot vide.
- Test d'intégration léger sur `useCaisse` (validation que l'écriture passe bien par la RPC).

### 2.2 Documentation
- **Nouveau** : `docs/FINANCIAL_ENGINE.md` — architecture cible, signatures RPC, contrats d'idempotence, matrice producteurs → catégorie, guide de migration pour futurs modules.
- **Mise à jour** : `docs/CHANGELOG.md`, `.lovable/plan.md` (marquer 4.4 ✅, 4.6 ✅, Phase 4 ✅).
- **Mémoire projet** : nouvelle entrée `mem://architecture/finance/financial-engine` référencée dans `mem://index.md` (règle : toute nouvelle écriture caisse passe par `CaisseService.recordMovement`).

## Détails techniques

```text
Producteurs → record_caisse_movement(...) → fond_caisse_operations
                                          ↘ (async) refresh MV
Dashboards ← get_caisse_solde_snapshot ← caisse_soldes_snapshot
Formulaires temps-réel ← get_solde_caisse()
```

Contraintes respectées :
- Aucun changement de schéma sur `fond_caisse_operations`.
- Aucune modification UI/UX.
- Rétro-compatibilité totale des signatures de hooks existants.
- GRANTs déjà en place (RPC créées en 4.2).
