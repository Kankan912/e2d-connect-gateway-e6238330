# Correctifs Portail Membre + Chargement infini

## Diagnostic

Console logs après login admin :
- Premier cycle : `Fetching profile` → `Profile loaded` → `Role data received` → `Permissions loaded: 78` → SessionManager OK ✅
- Ensuite : `[vite] server connection lost. Polling for restart…` puis `Fetching profile…` répété toutes les ~30s sans aucun log de complétion (`Profile loaded`, etc.).

Conséquence : à chaque reconnexion du dev server / rechargement de page, `AuthProvider` se remonte, `loading` repart à `true`, `fetchUserProfile()` est relancé mais ne ressort jamais (requête bloquée sur reconnexion réseau) → le `<PageLoader fullPage>` reste affiché indéfiniment.

Côté image 1, le bouton "Portail Membre" du `Navbar.tsx` :
- Utilise `window.location.href = "/auth"` (full reload, lent et casse la SPA)
- Le `Navbar` n'a pas de `z-index` explicite : la bande bleue du Hero (image 1) passe par-dessus au scroll en haut.

## Plan d'action

### 1. AuthContext — garantir la sortie de l'état `loading`
Fichier : `src/contexts/AuthContext.tsx`

- Ajouter un **timeout de sécurité** (8 s) dans `fetchUserProfile` : si la requête combinée profil + rôle + permissions n'a pas répondu, on force `setLoading(false)` et on log un warning. Ainsi l'utilisateur voit le dashboard même si une requête réseau s'éternise après une reconnexion HMR.
- Encadrer `fetchUserProfile` avec un `AbortController` pour éviter qu'un appel précédent (resté pendant) ne re-déclenche `setLoading(true)` après un nouveau cycle.
- S'assurer que `setLoading(false)` est appelé même quand `checkMemberStatus` déclenche un `signOut` (déjà partiellement géré, à durcir).
- Ne plus relancer `fetchUserProfile` si la session n'a pas changé ET si on a déjà un `profile` chargé en mémoire (déduplication renforcée).

### 2. Navbar — bouton Portail Membre
Fichier : `src/components/Navbar.tsx`

- Remplacer `window.location.href = "/auth"` par `useNavigate()` → `navigate("/auth")` (desktop **et** mobile) pour éviter le full reload qui aggrave le blocage observé.
- Ajouter `z-50` (ou `z-[60]`) + `relative`/`sticky` sur le `<nav>` racine si absent, pour qu'aucune section colorée du Hero ne déborde au-dessus du bouton (image 1).

### 3. Vérification
- Recharger `/`, cliquer "Portail Membre" → la navigation reste SPA.
- Se connecter en tant qu'administrateur → vérifier dans la console les logs `Profile loaded` + `Permissions loaded`, et que `loading` repasse à `false` (DashboardHome s'affiche).
- Simuler une reconnexion (couper/rallumer le réseau) → l'écran "Chargement…" doit disparaître au max après 8 s grâce au timeout.

## Détails techniques

- Le timeout de sécurité utilisera `Promise.race([fetchPromise, timeoutPromise])` et ne touche pas au `signOut` (les requêtes en arrière-plan peuvent quand même se résoudre et hydrater l'UI).
- Aucune modification de migration / RLS nécessaire — les GRANTs et policies sur `profiles`, `user_roles`, `role_permissions`, `membres` sont corrects (vérifié via `pg_class` + `has_table_privilege`).
- Aucun impact sur le flux Lot 4 (notifications in-app).
