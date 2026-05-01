## Contexte

Sur `https://e2d-connect.vercel.app`, le Hero reste figé sur les squelettes de chargement bleus (capture utilisateur). Les vérifications confirment que ce n'est PAS un bug de code :

- Le HTML servi par Vercel est correct (bundle JS référencé).
- L'API Supabase répond en 200 (testé en direct, RLS OK, 1 ligne `actif=true`).
- Dans un navigateur de test, le Hero s'affiche parfaitement (titre, sous-titre, image, boutons, stats).

Le problème est donc **local au navigateur de l'utilisateur** : cache obsolète, extension bloquante, ou requête Supabase qui n'aboutit jamais sans timeout.

## Volet A — Tests immédiats côté utilisateur (à faire avant tout)

1. **Vider le cache du navigateur problématique** (Ctrl+Shift+Suppr → Images et fichiers en cache + Cookies du site `vercel.app`) puis recharger en `Ctrl+F5`.
2. **Tester en navigation privée** dans le même navigateur. Si ça marche → c'est une extension ou un cookie corrompu.
3. **Désactiver les extensions** une par une (notamment bloqueurs de pub, antivirus web, VPN). Vérifier qu'aucune ne filtre `*.supabase.co`.
4. **Ouvrir la console** (F12) sur la page bloquée et rapporter les éventuelles erreurs réseau (onglet Network → filtrer `supabase`) ou JS (onglet Console).

## Volet B — Durcissement du code (préventif)

Pour que ce type de panne silencieuse ne puisse plus arriver, modifier le hook et le composant :

### 1. `src/hooks/useSiteContent.ts` — `useSiteHero`
- Remplacer `.single()` par `.maybeSingle()` (consigne projet).
- Ajouter un **timeout de 10 s** sur la requête (Promise.race) pour ne pas rester pending indéfiniment.
- Limiter `retry` à 2 et désactiver `refetchOnWindowFocus` pour éviter un blocage permanent en cas d'erreur réseau transitoire.

### 2. `src/components/Hero.tsx`
- Récupérer `error` depuis `useSiteHero` en plus de `isLoading`.
- Si `error` ou si `hero` est `null` après chargement → afficher quand même le Hero avec les **valeurs par défaut** (titre, sous-titre, image fallback déjà présents en `||`) au lieu de rester sur les squelettes.
- Concrètement : sortir du bloc `if (isLoading)` également quand `error` est défini, pour basculer sur le rendu fallback.

### 3. (Optionnel) Bouton « Forcer le rechargement »
- Ajouter dans la console un message d'erreur explicite via `logger.error` quand la requête Hero échoue, pour faciliter le support futur.

## Résultat attendu

Même si Supabase est inaccessible (extension, panne réseau, RLS cassée), la page d'accueil affiche le Hero avec son contenu par défaut au lieu de rester bloquée sur des squelettes bleus — l'utilisateur voit toujours quelque chose.

## Note

Aucun changement de DB ni de migration n'est nécessaire. Le code est correct ; on le rend juste plus tolérant aux pannes côté client.

Confirme avec **« go »** pour appliquer le volet B.
