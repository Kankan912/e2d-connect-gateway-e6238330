# Fiabiliser l'affichage des pages (erreur « module non chargé »)

## Ce qui se passe

L'écran rouge « Une erreur est survenue sur cette page » vient d'un morceau de page (ici le bloc **Contact** de l'accueil) qui n'a pas pu être téléchargé. Cela arrive quand une nouvelle version du site est publiée pendant qu'un visiteur a encore l'ancienne page ouverte : l'ancien fichier n'existe plus.

Constat dans le code : le chargement robuste avec nouvelles tentatives existe déjà et est utilisé pour toutes les pages du tableau de bord, mais **pas** pour les blocs de la page d'accueil (À propos, Activités, Événements, Galerie, Partenaires, Contact) ni pour les onglets de la page Réunions. En plus, l'échec d'un seul bloc fait tomber la page entière.

## Corrections

1. **Nouvelles tentatives partout** : les blocs de l'accueil et les onglets des réunions utiliseront le même chargement robuste que le reste de l'application (3 tentatives espacées).
2. **Récupération automatique après publication** : si le fichier reste introuvable malgré les tentatives, la page se recharge une seule fois automatiquement pour récupérer la nouvelle version (garde-fou pour éviter toute boucle de rechargement).
3. **Isolation des blocs** : un bloc en échec n'efface plus toute la page ; le reste de l'accueil (et des onglets) reste utilisable, avec un message discret et un bouton « Réessayer » à l'endroit concerné.
4. **Vérification générale** : passage en revue de toutes les pages publiques et du tableau de bord pour confirmer qu'aucune ne reste sans protection, puis contrôle des erreurs visibles dans le navigateur.

## Détails techniques

- `src/pages/Index.tsx` et `src/pages/reunions/index.tsx` : remplacer `lazy(...)` par `lazyWithRetry(...)`.
- `src/lib/lazyWithRetry.ts` : après épuisement des tentatives sur une erreur de chunk, tenter un rechargement unique protégé par une clé `sessionStorage` (`chunk-reload-<hash>`), sinon relayer l'erreur à l'ErrorBoundary.
- `src/pages/Index.tsx` : envelopper chaque section différée dans un `ErrorBoundary insideRouter` local (repli compact) au lieu de laisser remonter au boundary de route.
- Contrôle : `rg` pour vérifier qu'il ne reste aucun `lazy(` direct, `bunx tsgo --noEmit -p tsconfig.app.json`, `bun run build`, puis parcours Playwright de l'accueil et des principales pages du tableau de bord avec relevé de la console.
