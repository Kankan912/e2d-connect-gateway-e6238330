
# Correction : Orange Money & MTN MoMo — Contraintes SQL bloquantes

## Cause racine identifiée

La migration SQL originale (`20251031170843`) a défini deux contraintes `CHECK` qui bloquent l'insertion des nouveaux providers Mobile Money :

**Contrainte 1 — table `payment_configs` (ligne 4) :**
```sql
provider TEXT NOT NULL CHECK (provider IN ('stripe', 'paypal', 'helloasso', 'bank_transfer'))
```
→ C'est la cause directe de l'erreur `23514` dans les logs console.

**Contrainte 2 — table `donations` (ligne 22) :**
```sql
payment_method TEXT NOT NULL CHECK (payment_method IN ('stripe', 'paypal', 'helloasso', 'bank_transfer'))
```
→ Cette contrainte bloquerait également l'enregistrement d'un don avec `orange_money` ou `mtn_money`.

**Effet de bord — bouton "Activer" grisé :**
Le `Switch` est désactivé (`disabled={!getConfigId('orange_money')}`) tant qu'il n'y a aucune ligne en base pour ce provider. Puisque l'enregistrement échoue à cause de la contrainte, le toggle reste toujours désactivé.

---

## Solution : Une migration SQL + aucun changement de code React

Le code React (`PaymentConfigAdmin.tsx`) est **correct** — il envoie bien les bons providers. Seules les contraintes SQL côté base de données doivent être modifiées.

---

## Fichier à créer

### `supabase/migrations/[timestamp]_fix_payment_providers_check.sql`

Cette migration :

1. **Supprime** la contrainte `payment_configs_provider_check` existante
2. **Recrée** la contrainte en ajoutant `orange_money` et `mtn_money`
3. **Supprime** la contrainte `donations_payment_method_check` existante
4. **Recrée** la contrainte en ajoutant `orange_money` et `mtn_money`

```sql
-- Étape 1 : Modifier la contrainte sur payment_configs.provider
ALTER TABLE public.payment_configs
  DROP CONSTRAINT IF EXISTS payment_configs_provider_check;

ALTER TABLE public.payment_configs
  ADD CONSTRAINT payment_configs_provider_check
  CHECK (provider IN ('stripe', 'paypal', 'helloasso', 'bank_transfer', 'orange_money', 'mtn_money'));

-- Étape 2 : Modifier la contrainte sur donations.payment_method
ALTER TABLE public.donations
  DROP CONSTRAINT IF EXISTS donations_payment_method_check;

ALTER TABLE public.donations
  ADD CONSTRAINT donations_payment_method_check
  CHECK (payment_method IN ('stripe', 'paypal', 'helloasso', 'bank_transfer', 'orange_money', 'mtn_money'));
```

---

## Résultat attendu après la migration

| Problème | Cause | Après correction |
|---|---|---|
| Erreur rouge "Impossible d'enregistrer" | Contrainte `payment_configs_provider_check` | Enregistrement réussi |
| Bouton "Activer" grisé | Pas de ligne en base (échec d'insertion) | Toggle cliquable après 1er enregistrement |
| Don Orange/MTN bloqué | Contrainte `donations_payment_method_check` | Don enregistré avec statut `pending` |

## Aucun changement de code React

Le composant `PaymentConfigAdmin.tsx` est déjà correctement implémenté. La logique de sauvegarde (`handleSaveMobileMoney`) et le toggle (`toggleActive`) fonctionneront dès que la contrainte SQL sera levée.
