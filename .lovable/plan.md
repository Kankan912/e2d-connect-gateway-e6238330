# Revue Lot 1.2 — Régression détectée

## Contexte

Lot 1.2 a refactoré `supabase/functions/create-user-account` avec :
- Schéma Zod strict : `{ email, nom, prenom, telephone, password, roleIds, membreId }`
- Réponse standardisée : `{ success, code, message, ... }` via `_shared/errors.ts`
- Provision atomique via RPC `provision_user_account` (SECURITY DEFINER, service_role)

**Deux appelants front** invoquent cette fonction :

| Fichier | État |
|---|---|
| `src/components/admin/CreateUserDialog.tsx` | ✅ Migré (payload + gestion `ApiResponse`) |
| `src/components/UserMemberLinkManager.tsx` | ❌ **Oublié** — payload legacy, incompatible |

## Bug

`UserMemberLinkManager.tsx` (l.191-209) envoie encore l'ancien payload :

```ts
body: {
  email: newAccountEmail,
  memberId: selectedMember.id,          // ❌ rejeté (schema attend membreId)
  memberNom: selectedMember.nom,        // ❌ inconnu (schema attend nom au top-level)
  memberPrenom: selectedMember.prenom,  // ❌ inconnu (schema attend prenom)
  memberTelephone: selectedMember.telephone, // ❌ inconnu (schema attend telephone)
  tempPassword: tempPassword || undefined,   // ❌ inconnu (schema attend password)
}
```

Conséquence : **toute création de compte depuis l'écran "Membres → Créer un compte" retourne 400 `VALIDATION_ERROR`** ("nom obligatoire", "prenom obligatoire").

De plus la gestion d'erreur lit `data.error` (ancienne forme), alors que la nouvelle réponse expose `data.message` / `data.code`. Le message d'erreur affiché à l'utilisateur est donc `undefined` → fallback générique inutile.

## Correction

### Fichier : `src/components/UserMemberLinkManager.tsx`

1. **Remapper le payload** au contrat Zod actuel :
   ```ts
   body: {
     email: newAccountEmail.trim().toLowerCase(),
     nom: selectedMember.nom,
     prenom: selectedMember.prenom,
     telephone: selectedMember.telephone ?? null,
     password: tempPassword || undefined,   // laisse l'edge générer si vide
     membreId: selectedMember.id,           // liaison membre ↔ compte
   }
   ```

2. **Gérer la nouvelle réponse** `ApiResponse` via l'utilitaire commun :
   - Utiliser `showError(resp, "…", error)` de `@/lib/errors` (déjà employé dans `CreateUserDialog`), ou à défaut lire `resp?.message` / `resp?.code` puis passer par `translateErrorCode`.
   - Traiter le cas `error && !resp` (erreur réseau pure) séparément.
   - Ne conserver un `toast success` que si `resp.success === true`.

3. **Invalider les caches concernés** après succès :
   - `['members-with-accounts']` (déjà présent)
   - Ajouter `['utilisateurs']` et `['membres']` pour cohérence avec `CreateUserDialog`.

4. **(Nice-to-have)** Extraire le mot de passe retourné (`resp.tempPassword`) et l'afficher/copier pour l'admin, comme le fait déjà `CreateUserDialog`. Sinon garder le comportement actuel (email d'identifiants envoyé séparément).

### Hors périmètre

- Pas de changement à l'edge function ni à la migration RPC (déjà corrects).
- Pas de refactor visuel de `UserMemberLinkManager` — uniquement le handler `handleCreateAccount`.
- Pas de migration DB.

## Vérification

- `tsgo` (typecheck) propre.
- Test manuel : depuis l'admin, sur un membre sans compte, cliquer "Créer un compte" → succès + membre lié dans `membres.user_id`.
- Vérifier dans `audit_logs` la présence de l'entrée `user_provisioned`.

## Fichiers touchés

| Fichier | Action |
|---|---|
| `src/components/UserMemberLinkManager.tsx` | correction du handler `handleCreateAccount` |
| `docs/CHANGELOG.md` | ajout d'une entrée "Lot 1.2 — correctif régression" |

## Rollback

`git restore` sur les 2 fichiers. Aucun changement DB.
