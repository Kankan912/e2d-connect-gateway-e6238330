# FinancialEngine — Architecture cible (Phase 4)

Référence unique pour toute écriture financière dans la plateforme.
Résultat des sous-phases 4.1 → 4.6.

## 1. Principe

Toute écriture dans `public.fond_caisse_operations` **doit** passer par la RPC
`record_caisse_movement(...)`. C'est vrai pour :

- le frontend (via `CaisseService.recordMovement` dans `src/domain/finance/`),
- les edge functions (`supabase.rpc('record_caisse_movement', ...)`),
- les triggers SQL internes (`PERFORM public.record_caisse_movement(...)`).

Les `INSERT` directs sont considérés comme *legacy* et sont interdits pour les
nouveaux modules.

## 2. Contrats

### `record_caisse_movement(...) → uuid`
- **Validation stricte** : `type ∈ {entree, sortie}`, `montant > 0`.
- **Multi-tenant** : `association_id = current_tenant_id()` (fallback
  `default_association_id()`).
- **Idempotence** : rejeu inoffensif — si une ligne existe pour la même
  `(source_table, source_id, type, categorie, association)`, l'UUID existant
  est renvoyé sans nouvelle écriture.
- **Opérateur** : `p_operateur_id` explicite (utilisé par les triggers) ou
  `auth.uid()`. Fallback historique : premier `membres` disponible.

### `get_solde_empruntable(p_association_id, p_pourcentage) → numeric`
Règle unique côté serveur : `max(0, floor(fond_total × p% / 100) − prêts_en_cours)`.

### `caisse_soldes_snapshot` (vue matérialisée + `get_caisse_solde_snapshot`)
Instantané pour dashboards. Rafraîchi par `refresh_caisse_soldes_snapshot()`
(déclenché best-effort après chaque `recordMovement` côté frontend).

## 3. Matrice producteurs → catégorie

| Source                        | Déclencheur                                | Catégorie             | Type    |
|-------------------------------|--------------------------------------------|-----------------------|---------|
| `epargnes`                    | trigger `create_caisse_operation_from_source` | `epargne`            | entree  |
| `cotisations` (statut=`paye`) | idem                                       | `cotisation`          | entree  |
| `prets` (INSERT)              | idem                                       | `pret_decaissement`   | sortie  |
| `prets_paiements`             | idem                                       | `pret_remboursement`  | entree  |
| `aides` (statut=`alloue`)     | idem                                       | `aide`                | sortie  |
| `reunions_sanctions` (statut=`paye`) | `sync_sanction_to_caisse`         | `sanction`            | entree  |
| `reunion_beneficiaires` (statut=`paye`) | `sync_reunion_beneficiaire_to_caisse` | `beneficiaire`  | sortie  |
| Opérations manuelles          | `useCreateCaisseOperation` → CaisseService | libre (`autre`, ...)  | libre   |

## 4. Guide de migration pour un nouveau module

1. **N'insérez jamais** directement dans `fond_caisse_operations`.
2. Depuis un composant/hook React :

   ```ts
   import { CaisseService } from "@/domain/finance";
   await CaisseService.recordMovement({
     type: "entree",
     montant,
     categorie: "don",
     libelle: `Don - ${nom}`,
     sourceTable: "donations",
     sourceId: donation.id,
   });
   ```

3. Depuis une edge function : appelez la RPC via
   `supabase.rpc('record_caisse_movement', { p_type, p_montant, ... })`.
4. Depuis un trigger SQL : `PERFORM public.record_caisse_movement(...);`
5. Pour lire un solde de dashboard, préférez `CaisseService.getSoldeSnapshot()`
   à un `SELECT SUM(...)` maison.
6. Après un lot d'écritures serveur, pensez à
   `CaisseService.refreshSnapshot()`.

## 5. Rétro-compatibilité

- `get_solde_caisse()` reste utilisée pour les vues temps-réel critiques
  (formulaires de dépôt/retrait). Ne pas la remplacer par le snapshot.
- `get_caisse_stats()` et `get_caisse_synthese()` inchangés — sources de
  vérité des dashboards de synthèse.
- Le calcul client `calcSoldeEmpruntable` (`src/lib/caisseCalculations.ts`)
  reste comme fallback historique ; les nouveaux appels doivent utiliser
  `CaisseService.getSoldeEmpruntable()`.

## 6. Tests

- `src/domain/finance/index.test.ts` — règles pures (24 tests).
- `src/domain/finance/CaisseService.test.ts` — mapping RPC, validations,
  snapshot.
- `src/lib/caisseCalculations.test.ts` — règle 80 % côté client (fallback).
