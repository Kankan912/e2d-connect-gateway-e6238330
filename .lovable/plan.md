# Correction du multi-tenant (Identité & Thème + création d'association)

## Ce que j'ai vérifié

- La table `associations` a la sécurité par ligne **activée mais sans aucune règle d'accès** (0 policy). Résultat : lecture et écriture bloquées pour tous les comptes connectés → la page « Identité & Thème » ne charge rien et l'enregistrement ne modifie rien (la sauvegarde ne remonte même pas d'erreur car aucun contrôle du résultat n'est fait).
- **Aucun utilisateur ne possède le rôle `super_admin`** (rôle existant mais non attribué). Le menu « Plateforme → Associations » est donc masqué et la route est refusée, d'où l'impossibilité de créer une association.
- La fonction serveur `provision-association` vérifie le rôle avec le client d'administration (`is_super_admin()` sans utilisateur) : elle renverra **toujours « Réservé aux super administrateurs »**, même pour un vrai super admin.

## Plan de correction

### 1. Règles d'accès sur `associations` (migration SQL)
- Lecture : membres de l'association concernée + super admin.
- Modification : administrateurs de l'association + super admin (permet l'écran Identité & Thème).
- Création / suppression : super admin uniquement.
- Accès complet pour les traitements serveur.

### 2. Attribution du rôle super administrateur
- Migration attribuant `super_admin` au compte que vous désignez (indiquez l'email ; par défaut je prends le compte administrateur principal existant).
- Cela débloque le menu « Plateforme → Associations » et la création d'associations.

### 3. Correction de la fonction de création d'association
- `supabase/functions/provision-association/index.ts` : contrôler le rôle avec l'identité de l'appelant (`is_super_admin(user.id)`) au lieu du client d'administration anonyme.

### 4. Fiabilisation de l'écran Identité & Thème
- `src/pages/admin/AssociationBrandingAdmin.tsx` : vérifier réellement le résultat de l'enregistrement (retour des lignes modifiées) et afficher une erreur explicite si aucune ligne n'est mise à jour, au lieu d'un faux « enregistré ».
- Rafraîchir l'association courante via le contexte plutôt que par un rechargement complet de la page.

### 5. Vérification finale
- Contrôle des règles d'accès en base, puis test dans l'aperçu : ouverture d'« Identité & Thème », modification d'une couleur/devise, enregistrement, puis création d'une association de test depuis l'écran Plateforme.

## Détails techniques
- Nouvelle migration : `CREATE POLICY` sur `public.associations` en s'appuyant sur les fonctions existantes `has_association_access()`, `is_admin_of()` et `is_super_admin()` (les droits `GRANT` sont déjà en place).
- Insertion dans `public.user_roles` du rôle `super_admin` (scope `platform`) pour l'utilisateur désigné.
- Aucun changement de logique métier financière.
