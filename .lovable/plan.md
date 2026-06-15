# Correction : déconnexion immédiate après login

## Cause racine

Dans `src/hooks/useSessionManager.ts`, la fonction `getSessionStart(userId)` lit dans `localStorage` une date de début de session précédente et la réutilise tant qu'elle a moins de **24 h**. Or :

- La durée max de session côté `editor` est 4 h (et 2 h 30 pour `readonly`).
- `signOut()` dans `AuthContext.tsx` **ne nettoie pas** `lovable_session_start_<userId>` (seul `triggerLogout` du SessionManager le fait).

Conséquence : lorsqu'un utilisateur s'est connecté il y a > 4 h puis se reconnecte, le hook restaure l'ancienne date, `calculateRemainingTime` renvoie 0, et `checkSessionValidity` déclenche immédiatement `triggerLogout('session_expired')` → toast "Durée maximale de session atteinte" + redirection `/auth`. Le cycle se reproduit à chaque tentative de connexion tant que `localStorage` n'est pas vidé manuellement.

## Changements (minimaux)

### 1. `src/hooks/useSessionManager.ts`
- Dans `getSessionStart` : **ne plus restaurer** une date stockée si elle dépasse `config.session_duration_minutes`. En pratique, le plus sûr est de **toujours réécrire** une nouvelle date `now()` lors d'un nouvel évènement `SIGNED_IN`. Implémentation : ajouter un paramètre/effet qui détecte le changement d'`session.access_token` (nouveau token = nouvelle connexion) et écrase `localStorage`. Conserver la restauration uniquement sur rafraîchissement de page (même `access_token`).
- Réduire le `maxAge` de garde-fou de `24h` → `Math.min(24h, session_duration_minutes)` une fois la config chargée, sinon laisser 24 h pour le bootstrap.

### 2. `src/contexts/AuthContext.tsx`
- Dans `signOut()` : purger toutes les clés `lovable_session_start_*` du `localStorage` avant `supabase.auth.signOut()`, afin qu'aucune trace d'une session précédente ne soit réutilisée.
- Idem dans la branche `TOKEN_REFRESHED && !session` (refresh token invalide).

## Hors périmètre
- Aucune modification SQL / RLS.
- Pas de changement des durées de session configurées (`session_config`).
- Pas de modification du `SessionWarningModal` ni du tracker d'activité.

## Vérification
1. Se connecter en tant que `admin@e2d.com` → aucun toast "Durée maximale…", on atteint `/dashboard`.
2. Patienter > 4 h (ou modifier temporairement la config), se déconnecter, se reconnecter → toujours connecté sans déconnexion immédiate.
3. Rafraîchir `/dashboard` (F5) → la session est préservée (la date stockée est conservée car même `access_token`).
4. `tsc --noEmit` : 0 erreur.
