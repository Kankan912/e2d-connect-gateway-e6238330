

# Batch 5 : Nettoyage code mort, bug useEnsureAdmin, coherence securite

## Problemes identifies

### 1. BUG CRITIQUE : `useEnsureAdmin.ts` - role "admin" inexistant

**Fichier** : `src/hooks/useEnsureAdmin.ts`

Le hook compare `userRole === "admin"` mais le systeme utilise `"administrateur"` comme nom de role. Resultat : `isAdmin` est toujours `false` et `withEnsureAdmin()` bloque TOUTES les operations dans `GestionPresences.tsx`, meme pour les vrais admins.

**Impact** : Les toggles de presence E2D et Phoenix sont silencieusement bloques pour tout le monde.

**Correction** : Aligner sur les roles reels du systeme. Remplacer `"admin"` par une verification coherente avec `is_admin()` SQL :
```
const adminRoles = ["administrateur", "tresorier", "super_admin", "secretaire_general"];
const isAdmin = adminRoles.includes(userRole || "");
```

### 2. Code mort : `AdminRoute.tsx`

**Fichier** : `src/components/auth/AdminRoute.tsx`

Ce composant n'est importe nulle part dans l'application. Toutes les routes admin utilisent deja `PermissionRoute`. C'est du code mort qui peut induire en erreur les developpeurs.

**Action** : Supprimer le fichier.

### 3. Code mort : `useEnsureAdmin.ts` apres correction

Apres correction du bug, evaluer si ce hook est encore necessaire. La page `GestionPresences.tsx` est deja protegee par `PermissionRoute` au niveau route (`resource="presences" permission="read"`). Le `withEnsureAdmin` est donc une double verification redondante.

**Action** : Supprimer `useEnsureAdmin` et retirer son usage de `GestionPresences.tsx`. La protection RLS + PermissionRoute est suffisante.

---

## Resume des modifications

| # | Fichier | Action |
|---|---------|--------|
| 1 | `src/hooks/useEnsureAdmin.ts` | Supprimer (code mort avec bug) |
| 2 | `src/components/auth/AdminRoute.tsx` | Supprimer (code mort, jamais utilise) |
| 3 | `src/pages/GestionPresences.tsx` | Retirer l'import et l'usage de `withEnsureAdmin`, appeler directement les operations |

## Impact

- Les toggles de presence dans GestionPresences fonctionneront enfin pour les utilisateurs autorises
- Moins de code mort dans le projet
- La securite reste assuree par PermissionRoute (frontend) + RLS (backend)

