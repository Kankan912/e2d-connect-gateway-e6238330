
# Plan de Renforcement des Politiques RLS

## Analyse des 7 Politiques Permissives Identifiées

Le linter Supabase a détecté 7 politiques RLS avec `WITH CHECK (true)` qui permettent des insertions sans restriction. Voici l'analyse de chaque cas :

### Tables Concernées et Analyse de Risque

| # | Table | Politique | Risque Actuel | Justification Métier |
|---|-------|-----------|---------------|---------------------|
| 1 | `adhesions` | Public can insert | MODÉRÉ | Formulaire public de paiement adhésion |
| 2 | `demandes_adhesion` | Anyone can submit | MODÉRÉ | Formulaire public de demande |
| 3 | `donations` | Public peut insérer | MODÉRÉ | Dons publics via site |
| 4 | `messages_contact` | Anyone can submit | MODÉRÉ | Formulaire contact public |
| 5 | `messages_contact` | Public can insert | DUPLIQUÉ | À supprimer (doublon) |
| 6 | `beneficiaires_paiements_audit` | Insert policy | FAIBLE | Audit interne (authenticated) |
| 7 | `utilisateurs_actions_log` | Insert logs | FAIBLE | Logs internes (authenticated) |

---

## Stratégie de Renforcement

### Approche par Type de Table

**Tables Publiques (adhesions, demandes_adhesion, donations, messages_contact)**
- Ces tables DOIVENT rester accessibles publiquement (formulaires du site)
- Renforcement via **validation des données** plutôt que restriction d'accès
- Ajout de contraintes sur les valeurs autorisées

**Tables d'Audit (beneficiaires_paiements_audit, utilisateurs_actions_log)**
- Restreindre l'insertion à l'utilisateur authentifié lui-même
- Valider que `user_id` ou `effectue_par` = `auth.uid()`

---

## Modifications à Appliquer

### 1. Table `adhesions`
**Action** : Renforcer WITH CHECK pour valider les données

```sql
-- Supprimer l'ancienne politique
DROP POLICY IF EXISTS "Public can insert adhesions" ON adhesions;

-- Nouvelle politique avec validation
CREATE POLICY "Public can insert adhesions with validation" ON adhesions
FOR INSERT TO public
WITH CHECK (
  payment_status = 'pending'  -- Statut initial obligatoire
  AND processed = false       -- Non traité initialement
  AND montant_paye > 0        -- Montant positif requis
  AND type_adhesion IN ('e2d', 'phoenix', 'e2d_phoenix')  -- Types valides
);
```

### 2. Table `demandes_adhesion`
**Action** : Valider le statut initial

```sql
DROP POLICY IF EXISTS "Anyone can submit adhesion request" ON demandes_adhesion;

CREATE POLICY "Anyone can submit adhesion request with validation" ON demandes_adhesion
FOR INSERT TO public
WITH CHECK (
  statut = 'en_attente'  -- Statut initial obligatoire
  AND type_adhesion IN ('e2d', 'phoenix', 'e2d_phoenix')
);
```

### 3. Table `donations`
**Action** : Valider les données de don

```sql
DROP POLICY IF EXISTS "Public peut insérer des donations" ON donations;

CREATE POLICY "Public peut insérer des donations validées" ON donations
FOR INSERT TO public
WITH CHECK (
  payment_status = 'pending'
  AND amount > 0
  AND currency = 'EUR'
  AND payment_method IN ('stripe', 'paypal', 'bank_transfer', 'helloasso')
);
```

### 4. Table `messages_contact`
**Action** : Supprimer le doublon et renforcer

```sql
-- Supprimer les politiques dupliquées
DROP POLICY IF EXISTS "Anyone can submit contact message" ON messages_contact;
DROP POLICY IF EXISTS "Public can insert messages" ON messages_contact;

-- Une seule politique renforcée
CREATE POLICY "Public can submit contact message validated" ON messages_contact
FOR INSERT TO public
WITH CHECK (
  statut = 'nouveau'  -- Statut initial
  AND length(message) >= 10  -- Message minimum 10 caractères
);
```

### 5. Table `beneficiaires_paiements_audit`
**Action** : Restreindre à l'utilisateur authentifié

```sql
DROP POLICY IF EXISTS "beneficiaires_audit_insert_policy" ON beneficiaires_paiements_audit;

CREATE POLICY "beneficiaires_audit_insert_authenticated" ON beneficiaires_paiements_audit
FOR INSERT TO authenticated
WITH CHECK (
  effectue_par = auth.uid()  -- Seul l'utilisateur peut logger ses actions
);
```

### 6. Table `utilisateurs_actions_log`
**Action** : Restreindre à l'utilisateur lui-même

```sql
DROP POLICY IF EXISTS "Authenticated users can insert logs" ON utilisateurs_actions_log;

CREATE POLICY "Users can insert their own action logs" ON utilisateurs_actions_log
FOR INSERT TO authenticated
WITH CHECK (
  user_id = auth.uid()  -- L'utilisateur logge ses propres actions
);
```

---

## Nettoyage des Politiques Dupliquées

En plus des 7 politiques permissives, 2 tables ont des politiques SELECT dupliquées à nettoyer :

### Table `messages_contact`
```sql
-- 2 politiques SELECT identiques
DROP POLICY IF EXISTS "Authenticated can view messages" ON messages_contact;
-- Garder: "Authenticated users can view contact messages"
```

---

## Résumé des Changements

| Table | Action | Impact |
|-------|--------|--------|
| `adhesions` | Validation payment_status, processed, montant | Formulaire intact, données validées |
| `demandes_adhesion` | Validation statut, type_adhesion | Formulaire intact, données validées |
| `donations` | Validation payment_status, amount, currency | Dons intacts, données validées |
| `messages_contact` | Suppression doublon, validation statut | Contact intact, nettoyage |
| `beneficiaires_paiements_audit` | Restriction à effectue_par = auth.uid() | Audit sécurisé |
| `utilisateurs_actions_log` | Restriction à user_id = auth.uid() | Logs sécurisés |

---

## Politique Alternative pour Edge Functions

**Note importante** : Si les Edge Functions utilisent le `service_role` pour insérer dans les tables d'audit, les politiques de restriction ne s'appliqueront pas (service_role bypass RLS). C'est le comportement attendu et sécurisé.

---

## Résultat Attendu

Après application :
- **0 warning** pour les politiques RLS trop permissives
- Tables publiques : Insertion validée mais toujours possible
- Tables d'audit : Insertion restreinte à l'utilisateur authentifié
- Politiques dupliquées : Nettoyées
