
# Ajout du Mobile Money camerounais (Orange Money, MTN MoMo)

## Contexte et état actuel

La page de don affiche "Aucune méthode de paiement configurée" car la table `payment_configs` est vide. Le système est construit autour d'un provider `payment_configs` en base (colonne `provider: text`), ce qui permet d'ajouter de nouveaux prestataires sans migration de schéma.

Orange Money et MTN Mobile Money sont les modes de paiement dominants au Cameroun. Ils fonctionnent via un numéro de compte (MSISDN) et non via une API REST complexe, similaire au virement bancaire.

## Stratégie choisie : Mobile Money manuel (sans API tierce)

Orange Money et MTN MoMo ne disposent pas d'API publiques accessibles directement depuis le front sans agrégateur de paiement (comme CinetPay, Monetbil, Kkiapay, etc.). Pour ne pas introduire de dépendances coûteuses et rester cohérent avec l'architecture existante (le virement bancaire est aussi "manuel"), on adopte le même modele : l'utilisateur effectue le paiement depuis son téléphone, puis enregistre le don avec la référence de transaction.

Si l'association souhaite plus tard une intégration automatisée (CinetPay, Monetbil), cela pourra être ajouté en tant que provider séparé.

## Fichiers à modifier

---

### 1. `src/types/donations.ts`

Ajouter `'orange_money'` et `'mtn_money'` au type `PaymentMethod` :

```ts
export type PaymentMethod = 'stripe' | 'paypal' | 'helloasso' | 'bank_transfer' | 'orange_money' | 'mtn_money';
```

Etendre `PaymentConfig.config_data` pour les champs Mobile Money :

```ts
// Mobile Money
mobile_number?: string;       // Ex: +237 6XX XXX XXX
account_name?: string;        // Nom du titulaire du compte
payment_code?: string;        // Code court si applicable
instructions?: string;        // Instructions de paiement
```

---

### 2. `src/lib/payment-utils.ts`

Ajouter les labels et icônes pour les deux nouveaux providers dans `getPaymentMethodLabel` et `getPaymentMethodIcon`.

---

### 3. `src/components/donations/PaymentMethodTabs.tsx`

Ajouter les icônes et labels pour `orange_money` et `mtn_money` dans `getIcon()` et `getLabel()`.

---

### 4. `src/components/donations/MobileMoneyInfo.tsx` (nouveau fichier)

Creer un composant similaire a `BankTransferInfo.tsx` pour afficher :
- Le logo/icône Orange Money ou MTN MoMo
- Le numéro de compte Mobile Money
- Le nom du titulaire
- Instructions de paiement (ex: "Composez *150# et suivez les instructions")
- Un champ pour saisir la référence de transaction reçue par SMS
- Un bouton "Confirmer le paiement" qui enregistre le don

---

### 5. `src/pages/Don.tsx`

Dans le bloc `{activeConfigs.map(...)}`, ajouter un `case` pour `orange_money` et `mtn_money` qui affiche le composant `MobileMoneyInfo`.

---

### 6. `src/pages/admin/PaymentConfigAdmin.tsx`

Ajouter deux nouveaux onglets "Orange Money" et "MTN MoMo" avec :
- Champ "Numéro de compte" (format +237 6XX XXX XXX)
- Champ "Nom du titulaire"
- Champ "Instructions" (textarea)
- Switch "Activer"
- Bouton "Enregistrer"

Passer les onglets de 4 à 6 (`grid-cols-6`).

---

## Résultat attendu

| Element | Detail |
|---|---|
| Nouveau type PaymentMethod | `orange_money`, `mtn_money` |
| Page admin | 2 nouveaux onglets de configuration |
| Page don | 2 nouvelles méthodes si activées |
| Flux utilisateur | Saisir la référence de transaction après paiement |
| Migration SQL | Aucune (colonne `provider` est `text`, pas un enum) |

## Flux utilisateur Mobile Money

```text
1. Donateur choisit "Orange Money" ou "MTN MoMo"
2. Il voit le numéro de compte et les instructions
3. Il effectue le paiement sur son téléphone
4. Il saisit la référence de transaction reçue par SMS
5. Il clique "Confirmer" -> don enregistré avec statut "pending"
6. L'admin valide manuellement la transaction
```

## Note importante

La colonne `provider` de `payment_configs` est de type `text` : aucune migration SQL n'est nécessaire pour ajouter les nouveaux providers. La colonne `config_data` est de type `jsonb` : les nouveaux champs (numéro, instructions) sont stockés librement.
