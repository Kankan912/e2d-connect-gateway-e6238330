
# Correction : RLS INSERT bloquant les dons Mobile Money (FCFA)

## Cause racine exacte

La politique RLS `"Public peut insérer des donations validées"` sur la table `donations` contient deux filtres trop restrictifs dans son `WITH CHECK` :

```sql
WITH CHECK (
  (payment_status = 'pending')
  AND (amount > 0)
  AND (currency = 'EUR')                                           -- ❌ Bloque FCFA, USD, etc.
  AND (payment_method = ANY (ARRAY[
    'stripe', 'paypal', 'bank_transfer', 'helloasso'              -- ❌ orange_money et mtn_money absents
  ]))
)
```

Quand un donateur soumet un don Orange Money en FCFA :
- `currency` = `'FCFA'` → échoue sur `currency = 'EUR'`
- `payment_method` = `'orange_money'` → absent du tableau autorisé

→ La politique bloque l'insertion → Supabase retourne une erreur RLS → toast "Impossible d'enregistrer le don"

---

## Solution : Une migration SQL unique

### Migration `fix_donations_rls_insert_policy`

Supprimer et recréer la politique RLS d'insertion en :
1. Autorisant toutes les devises supportées (`FCFA`, `EUR`, `USD`, `GBP`, `CAD`, `CHF`)
2. Ajoutant `orange_money` et `mtn_money` dans les méthodes autorisées

```sql
-- Suppression de l'ancienne politique trop restrictive
DROP POLICY IF EXISTS "Public peut insérer des donations validées" ON public.donations;

-- Nouvelle politique corrigée
CREATE POLICY "Public peut insérer des donations validées"
ON public.donations
FOR INSERT
TO public
WITH CHECK (
  payment_status = 'pending'
  AND amount > 0
  AND currency = ANY (ARRAY['EUR', 'USD', 'GBP', 'CAD', 'CHF', 'FCFA'])
  AND payment_method = ANY (ARRAY[
    'stripe', 'paypal', 'bank_transfer', 'helloasso',
    'orange_money', 'mtn_money'
  ])
);
```

---

## Aucun changement de code React

Le code de `Don.tsx` et `MobileMoneyInfo.tsx` est parfaitement correct. L'erreur provient uniquement de la politique RLS en base de données.

---

## Résultat attendu

| Scénario | Avant | Après |
|---|---|---|
| Don Orange Money en FCFA | Erreur RLS → toast rouge | Insertion réussie → modal de succès |
| Don MTN MoMo en FCFA | Erreur RLS → toast rouge | Insertion réussie → modal de succès |
| Don carte bancaire en EUR | ✅ Fonctionne | ✅ Fonctionne toujours |
| Don par virement en FCFA | Erreur RLS → bloqué | ✅ Désormais autorisé |

## Fichier créé

- `supabase/migrations/[timestamp]_fix_donations_rls_insert_currency.sql`
