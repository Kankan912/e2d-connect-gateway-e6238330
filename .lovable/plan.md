
# Corrections ciblées - Problèmes réels confirmés

Après lecture de tous les fichiers mentionnés dans l'audit, voici l'état réel :

## Ce qui est DEJA correct (faux positifs de l'audit)

- MyAides, MyCotisations, MyDonations, MyEpargnes, MyPresences, MyPrets, MySanctions : tous les fichiers contiennent bien leur bon composant.
- StatCard, PermissionsMatrix, CreateUserDialog, DataTable, DonationsTable : tous corrects.
- PaymentMethodTabs, PermissionRoute : corrects.
- Les composants de caisse, config, formulaires, notifications : corrects.

## Vrais problèmes confirmés a corriger

---

### 1. NotFound.tsx - Lien avec rechargement complet

Fichier : `src/pages/NotFound.tsx` (ligne 16)

Actuellement : `<a href="/">Return to Home</a>`

Correction : Remplacer par `<Link to="/">` de react-router-dom. Egalement franciser le message.

---

### 2. useAdhesions.ts - Mauvaise table

Fichier : `src/hooks/useAdhesions.ts`

La table utilisee est `demandes_adhesion` alors que la table reelle du projet est `adhesions`. Il faut verifier laquelle existe vraiment dans la base.

D'apres l'audit Supabase et les autres hooks du projet : la table s'appelle `adhesions`. Le hook doit pointer vers `adhesions`.

---

### 3. Adhesion.tsx - Devise € au lieu de FCFA

Fichier : `src/pages/Adhesion.tsx`

Les montants sont affiches en euros. Correction : remplacer les occurrences de `€` et `EUR` par `FCFA`.

---

### 4. Don.tsx - Devise € au lieu de FCFA

Fichier : `src/pages/Don.tsx`

Meme probleme de devise sur la page publique des dons.

---

## Plan d'execution

### Etape 1 - NotFound.tsx

Remplacer `<a href="/">` par `<Link to="/">` et importer `Link` depuis react-router-dom. Traduire le message en francais.

### Etape 2 - useAdhesions.ts

Pointer la table vers `adhesions` (la bonne table confirmee dans d'autres parties du projet comme `AdhesionsAdmin.tsx`).

### Etape 3 - Verifier et corriger les devises

Corriger les occurrences de `€` dans `Adhesion.tsx` et `Don.tsx`.

---

## Fichiers modifies

| Fichier | Correction |
|---------|-----------|
| `src/pages/NotFound.tsx` | `<Link>` au lieu de `<a>` + traduction FR |
| `src/hooks/useAdhesions.ts` | Table `demandes_adhesion` -> `adhesions` |
| `src/pages/Adhesion.tsx` | Devise € -> FCFA |
| `src/pages/Don.tsx` | Devise € -> FCFA |

---

## Note importante

L'audit contenait de nombreux faux positifs : les fichiers ont en realite les bons contenus. Les "corruptions" et "mauvais nommages" mentionnes ne correspondent pas a l'etat reel du code. Seuls les 4 problemes ci-dessus sont confirmes comme reels apres lecture directe des fichiers.
