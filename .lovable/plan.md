
# Phase 2.5 — Frontend Multi-Tenant

Objectif : rendre le frontend conscient du tenant (association) sans casser l'expérience E2D actuelle. Trois briques :

## 1. `AssociationContext` (nouveau)

- **Fichier** : `src/contexts/AssociationContext.tsx`
- **État exposé** :
  - `currentAssociation` (`{ id, slug, nom, logo_url, theme_tokens, ... }`)
  - `availableAssociations` (liste)
  - `isSuperAdmin` (bool)
  - `switchAssociation(id)` (super_admin uniquement)
  - `loading`
- **Logique** :
  - Au montage, si `user` connecté :
    - super_admin → charge toutes les `associations` actives
    - sinon → charge les associations liées via `membres.association_id` (via `get_user_associations()`)
  - `currentAssociation` = valeur persistée dans `localStorage` (`lovable_current_association`), fallback = première dispo, fallback = E2D via `default_association_id()`.
  - Émis après `AuthProvider`, dépend de `useAuth`.

## 2. Sélecteur d'association (UI)

- **Fichier** : `src/components/AssociationSwitcher.tsx`
- Affiché uniquement pour :
  - super_admin (toujours)
  - utilisateur multi-tenant (>1 association)
- Placé dans le header du dashboard (`src/components/Layout.tsx` ou équivalent) à côté du menu utilisateur.
- Composant : `Select` shadcn avec logo + nom association.
- Sur change → appelle `switchAssociation()` puis `queryClient.invalidateQueries()`.

## 3. Helper `tenantQuery` + injection `association_id`

- **Fichier** : `src/lib/tenantQuery.ts`
- Expose :
  - `withCurrentAssociation<T>(payload: T): T & { association_id: string }` : ajoute automatiquement `association_id` sur INSERT.
  - `getCurrentAssociationId(): string` : lecture synchrone depuis un singleton mis à jour par `AssociationContext`.
- Sync via petit event bus / `zustand` store léger (`src/stores/associationStore.ts`) pour permettre l'usage hors composant React.
- Aucun refactor massif : on **n'oblige pas** encore les hooks à utiliser le helper (RLS `default_association_id()` couvre les inserts existants). Seuls les nouveaux inserts + module Phoenix devront l'employer.

## 4. Intégration dans `AuthContext`

- Après `fetchUserProfile`, exposer aussi `userAssociationId` (première `membres.association_id` du user) — utile pour hooks legacy.
- Ajouter `isSuperAdmin` calculé à partir de `userRole === 'super_admin'` OU présence dans `user_roles` avec role plateforme super_admin.

## 5. Provider hierarchy (`src/App.tsx`)

```
<QueryClientProvider>
  <AuthProvider>
    <AssociationProvider>
      <RouterProvider ...>
    </AssociationProvider>
  </AuthProvider>
</QueryClientProvider>
```

## 6. Style & thème

- `AssociationProvider` applique les `theme_tokens` de l'association courante en injectant des variables CSS sur `<html>` (`--tenant-primary`, `--tenant-accent`, etc.).
- Fallback : tokens actuels E2D si aucune valeur.
- La refonte visuelle par tenant (Phase 6) réutilisera ce mécanisme.

## 7. Livrables

- 4 nouveaux fichiers : `AssociationContext.tsx`, `AssociationSwitcher.tsx`, `tenantQuery.ts`, `associationStore.ts`.
- Modifications légères : `App.tsx`, `AuthContext.tsx` (expose `isSuperAdmin`), header du dashboard (intégration switcher).
- Aucune modification de hook métier existant (compatibilité garantie par `default_association_id()`).
- Test manuel : login E2D → dashboard doit rester identique (aucun sélecteur visible car 1 seule asso).

## Hors périmètre

- Refactor des ~50 hooks pour utiliser `tenantQuery` (fait progressivement en Phase 5/6).
- Provisioning d'une nouvelle association (Phase 2.6).
- Thème réel par tenant (Phase 6 — cette phase pose juste la mécanique).
