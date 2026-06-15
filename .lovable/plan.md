## Objectif

Permettre aux personnes autorisées (administrateurs et utilisateurs avec la permission `cotisations.update`) de modifier librement le montant de cotisation mensuelle par membre, avec enregistrement systématique dans le journal d'audit.

## Constat actuel

Le composant `src/components/config/CotisationsMensuellesExerciceManager.tsx` existe déjà et gère les montants par exercice, mais :

1. **Détection d'admin par chaîne brute** (ligne 135) : `['admin','administrateur','tresorier','super_admin','secretaire_general'].includes(userRole.toLowerCase())`. Or `userRole` est déjà normalisé à `'administrateur'` dans `AuthContext`, et les autres rôles (trésorier…) devraient passer par `usePermissions`, pas par une liste codée en dur.
2. **Audit conditionnel** : un log n'est inséré dans `cotisations_mensuelles_audit` que si la ligne est `verrouille = true` ET que l'utilisateur est admin (ligne 175). Toute autre modification (création, ligne non verrouillée) passe sous le radar.
3. **UX trompeuse** : le cadenas et le badge "Verrouillé" restent affichés même pour un admin qui peut modifier, ce qui laisse croire que le champ est bloqué (cf. capture utilisateur).
4. **Pas d'historique visible** des modifications dans l'interface admin.

## Plan d'implémentation

### 1. Autorisation centralisée

Dans `CotisationsMensuellesExerciceManager.tsx` :

- Remplacer la liste codée en dur par `usePermissions().hasPermission('cotisations','update')`. Conserver le bypass admin déjà géré par le hook.
- Variable `canEdit = hasPermission('cotisations','update')` (l'admin reçoit `true` automatiquement).
- Désactiver l'input seulement si `!canEdit` (le verrou n'est plus un blocage pour les autorisés).

### 2. Audit systématique

- Insérer une ligne dans `cotisations_mensuelles_audit` à **chaque** UPDATE de montant (verrouillé ou non), avec :
  - `montant_avant`, `montant_apres`, `modifie_par = profile?.id`, `raison`
- À l'INSERT initial : également logger (montant_avant = 0, raison = "Initialisation").
- Toujours demander une raison via `showAuditDialog` quand l'exercice est `actif` ou `cloture` (modification sensible). Pour un exercice `brouillon`, raison optionnelle.

### 3. Sécurité base (migration)

Vérifier/ajuster la RLS `cotisations_mensuelles_exercice` :

- UPDATE/INSERT : autorisé si `has_permission(auth.uid(),'cotisations','update')` OU `is_admin()`.
- `cotisations_mensuelles_audit` INSERT : autorisé pour le même périmètre, avec `modifie_par = auth.uid()` forcé côté trigger pour empêcher l'usurpation.
- Ajouter un trigger `BEFORE INSERT` sur `cotisations_mensuelles_audit` qui force `modifie_par = auth.uid()`.

### 4. UX

- Si `canEdit`, masquer l'icône cadenas dans l'input et remplacer le badge "Verrouillé" par "Modifiable (audité)".
- Garder le cadenas + badge "Verrouillé" pour les utilisateurs non autorisés.
- Bandeau d'information clair : « Vous pouvez modifier les montants. Chaque modification est enregistrée dans l'historique. »

### 5. Historique consultable

Ajouter un bouton "Historique des modifications" qui ouvre un dialog listant les 50 derniers changements pour l'exercice sélectionné (membre, ancien → nouveau, auteur, raison, date), basé sur `cotisations_mensuelles_audit`.

## Fichiers impactés

- `src/components/config/CotisationsMensuellesExerciceManager.tsx` (refactor autorisation + UX + dialog historique)
- Nouvelle migration SQL : politiques RLS + trigger `modifie_par`
- (Optionnel) extraction du dialog historique dans `src/components/config/CotisationsMensuellesAuditDialog.tsx`

## Hors périmètre

- Pas de changement sur la table `cotisations` (paiements réels en réunion).
- Pas de refonte du calcul des attendus mensuels.
