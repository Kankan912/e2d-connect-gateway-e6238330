
# Correction du chargement infini + restauration de l'onglet Cotisations admin

## Causes identifiées

1. **AuthContext refetch en boucle (cause principale)**
   Les logs montrent `Fetching profile for user` exécuté **4 fois** d'affilée au login pour le même utilisateur. Chaque événement `onAuthStateChange` (`INITIAL_SESSION`, `SIGNED_IN`, `TOKEN_REFRESHED`, `USER_UPDATED`) déclenche `fetchUserProfile`, qui :
   - exécute 3 requêtes séquentielles (profile, role, permissions),
   - appelle `queryClient.invalidateQueries(['user-permissions'])`.
   Cette invalidation cascade vers `usePermissions` qui re-déclenche toutes les pages, d'où les chargements qui « tournent en rond ».

2. **`useUserCotisations` utilise `.single()`**
   Sur le lookup membre, `.single()` lève une exception si zéro ligne (ce qui peut arriver pendant la transition de session). Doit être `.maybeSingle()` comme partout ailleurs.

3. **Doublons de lookup membre**
   Chaque page personnelle (Cotisations, Prêts, Épargnes, Sanctions, Présences, Aides) déclenche **2 requêtes séquentielles** : une pour récupérer le `membre_id` à partir du `user_id`, puis la requête data. Or `useUserMemberId` existe déjà dans `usePersonalData` — `useCotisations` le réimplémente. À centraliser.

4. **Realtime channels en multiple**
   `useLoanRequests` / `useMyLoanRequests` créent un nouveau channel `crypto.randomUUID()` à chaque montage de composant. Sur les pages Demandes de prêt, ceci multiplie les abonnements Postgres-changes inutilement.

5. **Onglet « Cotisations admin » absent**
   La sidebar contient `Mes Cotisations` (membre) mais pas de vue admin globale. La grille existe pourtant : `src/components/CotisationsGridView.tsx` + `src/components/CotisationsCumulAnnuel.tsx`. Aucune route ni entrée sidebar ne les expose en standalone (uniquement via Réunions).

## Modifications

### 1. Stabiliser `AuthContext` (priorité 1)

`src/contexts/AuthContext.tsx`
- Ajouter un `useRef<string | null>(loadedUserId)` pour mémoriser le dernier `user.id` chargé.
- Dans `onAuthStateChange`, **ne déclencher `fetchUserProfile` que si** :
  - événement ∈ `['SIGNED_IN', 'INITIAL_SESSION']`,
  - ET `session.user.id !== loadedUserId.current`.
- Ignorer `TOKEN_REFRESHED` et `USER_UPDATED` (ils n'ont pas besoin de recharger profile/role/permissions).
- Retirer `queryClient.invalidateQueries(['user-permissions'])` dans `fetchUserProfile` (la première fetch n'a rien à invalider).
- Paralléliser les 3 requêtes via `Promise.all([profile, role, permissions])` pour passer de ~900 ms à ~300 ms.

### 2. Corriger `useUserCotisations`

`src/hooks/useCotisations.ts`
- Remplacer le `.single()` interne par un appel à `useUserMemberId()` (déjà exporté par `usePersonalData`), avec `enabled: !!membre?.id`.
- Bénéfice : un seul lookup membre partagé en cache pour toutes les pages personnelles.

### 3. Centraliser le lookup membre

`src/hooks/usePersonalData.ts`
- Augmenter le `staleTime` du `useUserMemberId` à `Infinity` (le `membre_id` ne change jamais pour un user donné).
- Aucun autre changement (les autres hooks `useUser*` consomment déjà `useUserMemberId`).

### 4. Réduire les channels Realtime

`src/hooks/useLoanRequests.ts`
- Remplacer `supabase.channel(`loan_requests_admin_${crypto.randomUUID()}`)` par des noms stables (`loan_requests_admin`, `loan_requests_self`).
- Supabase gère le déduplication ; cela empêche aussi les fuites si un montage rapide ne déclenche pas le cleanup.

### 5. Restaurer l'onglet Cotisations admin

**Nouvelle page** `src/pages/admin/CotisationsAdmin.tsx`
- Conteneur simple qui affiche :
  - sélecteur d'exercice,
  - `<CotisationsCumulAnnuel />` (cumul annuel par membre),
  - `<CotisationsGridView />` (grille mensuelle).
- Pas de logique nouvelle, juste composer l'existant.

**Route** dans `src/pages/Dashboard.tsx`
- Ajouter `<Route path="/admin/cotisations" element={<PermissionRoute resource="cotisations" permission="read"><ErrorBoundary><CotisationsAdmin /></ErrorBoundary></PermissionRoute>} />`.
- Lazy-load via `lazyWithRetry`.

**Sidebar** dans `src/components/layout/DashboardSidebar.tsx`
- Ajouter dans `e2dCotisationsItems` :
  ```ts
  { title: "Cotisations", url: "/dashboard/admin/cotisations", icon: Receipt, resource: "cotisations" }
  ```
  en première position.

## Hors périmètre

- Aucune migration SQL.
- Aucun changement de RLS.
- Aucune modification métier (calculs, validations).
- Aucune nouvelle dépendance.

## Vérification

1. Recharger `/dashboard` → un seul `Fetching profile` dans la console.
2. Ouvrir `/dashboard/my-cotisations` → contenu affiché en < 1 s.
3. Ouvrir `/dashboard/mes-demandes-pret` → contenu ou message « Aucune demande » en < 1 s.
4. Ouvrir `/dashboard/admin/cotisations` → grille annuelle visible.
5. `npx tsc --noEmit` → 0 erreur.
