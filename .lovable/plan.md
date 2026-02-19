
# Mobile Money Cameroun — Alertes Admin, Page de Réconciliation & Sandbox de Test

## Vue d'ensemble

Les trois fonctionnalités demandées s'articulent autour du même flux : un donateur envoie de l'argent via Orange Money ou MTN MoMo, soumet une référence de transaction, et le don reste en statut `pending` jusqu'à validation manuelle. L'objectif est de :

1. Alerter les admins sur les transactions en attente ou échouées avec possibilité de retenter
2. Offrir une page de suivi/réconciliation dédiée aux paiements Mobile Money
3. Fournir des données de test (sandbox) pour valider le flux de bout en bout

---

## Fonctionnalité 1 — Alertes Admin pour transactions Mobile Money

### Problème constaté

La page `DonationsAdmin.tsx` ne met pas en évidence les dons Mobile Money en attente (`payment_status = 'pending'`) ni n'offre d'actions spécifiques (valider, marquer comme échoué, relancer une notification au donateur).

La table `DonationsTable` dans `src/components/admin/DonationsTable.tsx` :
- N'affiche pas `orange_money` ni `mtn_money` avec un badge coloré distinctif
- N'a pas de bouton "Valider" ou "Rejeter" pour les paiements manuels
- N'a pas de colonne "Référence de transaction" (pourtant stockée dans `bank_transfer_reference`)

### Fichiers à modifier

**`src/components/admin/DonationsTable.tsx`**
- Ajouter `orange_money` et `mtn_money` dans `getPaymentMethodBadge()` avec couleurs distinctives (orange/jaune)
- Ajouter une colonne "Référence" affichant `bank_transfer_reference` en code mono tronqué
- Ajouter deux boutons d'action pour les dons `pending` : "Valider" (passe à `completed`) et "Rejeter" (passe à `failed`)
- Passer `onValidate` et `onReject` comme props callbacks depuis le parent

**`src/pages/admin/DonationsAdmin.tsx`**
- Ajouter un `StatCard` d'alerte "Mobile Money en attente" avec count des `pending` sur `orange_money` + `mtn_money`
- Ajouter les filtres "Orange Money" et "MTN MoMo" dans le `<Select>` de méthode de paiement
- Ajouter les mutations `validateMobileMoney` et `rejectMobileMoney` via `useMutation`
- Câbler ces mutations aux callbacks `onValidate` / `onReject` du tableau

---

## Fonctionnalité 2 — Page de réconciliation Mobile Money

### Problème constaté

Il n'existe pas de vue dédiée pour l'état des paiements Mobile Money. Les admins doivent filtrer manuellement dans la liste générale. Il n'y a pas de vue de synthèse montrant :
- Total en attente de validation
- Historique des validations du jour/mois
- Références de transaction pour rapprochement manuel avec les relevés Orange/MTN

### Fichiers à créer / modifier

**Nouveau fichier : `src/pages/admin/MobileMoneyAdmin.tsx`**
Un tableau de bord dédié avec :
- 3 `StatCard` : "En attente de validation", "Validés ce mois", "Rejetés ce mois"
- Tableau "Transactions à vérifier" filtré sur `payment_method IN (orange_money, mtn_money)` et `payment_status = pending`
  - Colonnes : Date, Nom donateur, Téléphone, Montant, Opérateur (🟠/🟡), Référence SMS, Actions (Valider / Rejeter)
- Tableau "Historique récent" : 30 derniers jours, tous statuts confondus pour Mobile Money
- Export CSV des transactions Mobile Money (bouton simple `window.open` sur un filtre Supabase)

**`src/pages/Dashboard.tsx`**
- Ajouter `lazy(() => import("./admin/MobileMoneyAdmin"))` 
- Ajouter la route `/admin/donations/mobile-money`
- L'entourer d'un `PermissionRoute resource="donations" permission="read"`

**`src/components/layout/DashboardSidebar.tsx`**
- Ajouter "Réconciliation MoMo" dans la section `adminPublicItems` avec l'icône `Smartphone`
- URL : `/dashboard/admin/donations/mobile-money`

---

## Fonctionnalité 3 — Sandbox / données de test

### Approche choisie

Il n'y a pas de vrai sandbox Orange Money / MTN MoMo accessible sans agrégateur. La sandbox ici est un **générateur de données de test** côté admin qui insère des donations fictives dans la table `donations` avec des références de transaction réalistes, pour permettre de tester le workflow complet (alerte → validation → réconciliation).

Cela est cohérent avec l'approche manuelle déjà choisie pour ces paiements.

### Fichiers à modifier

**`src/pages/admin/MobileMoneyAdmin.tsx`** (même fichier que ci-dessus)
- Ajouter un onglet "Sandbox / Tests" visible uniquement en développement (`import.meta.env.DEV`) ou via un toggle admin
- Ce panneau permet d'insérer N donations de test avec :
  - Opérateur : Orange Money ou MTN MoMo (sélectionnable)
  - Montant aléatoire parmi les presets FCFA
  - Référence générée automatiquement au format `TXN{timestamp}{random}`
  - Nom/email de donateur fictif ("Test Donateur", "test@e2d.test")
- Un bouton "Nettoyer les données de test" supprime les donations `donor_email = 'test@e2d.test'`

**`src/hooks/useDonations.ts`**
- Ajouter un hook `useMobileMoneyDonations()` qui filtre directement sur les deux providers Mobile Money — réutilisé par la page de réconciliation et par les alertes du dashboard

---

## Résumé des fichiers touchés

| Fichier | Action | Fonctionnalité |
|---|---|---|
| `src/components/admin/DonationsTable.tsx` | Modifier | 1 — Alertes |
| `src/pages/admin/DonationsAdmin.tsx` | Modifier | 1 — Alertes |
| `src/pages/admin/MobileMoneyAdmin.tsx` | Créer | 2 + 3 |
| `src/pages/Dashboard.tsx` | Modifier | 2 — Route |
| `src/components/layout/DashboardSidebar.tsx` | Modifier | 2 — Nav |
| `src/hooks/useDonations.ts` | Modifier | 1 + 2 |

## Note technique

Aucune migration SQL n'est nécessaire. La table `donations` existante contient toutes les colonnes requises :
- `payment_method` (text) pour filtrer orange_money / mtn_money
- `payment_status` (text) pour les transitions pending → completed / failed
- `bank_transfer_reference` (text) pour stocker la référence SMS Mobile Money

Les mutations de validation/rejet utilisent simplement `supabase.from('donations').update(...)`.
