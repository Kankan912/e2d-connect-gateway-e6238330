

# Code Review Phase 1 + Plan Phase 2

## Phase 1 — Verdict : CONFORME

Tous les 4 points du plan ont ete correctement implementes :

**A. ErrorBoundary par route** — `Dashboard.tsx` enveloppe individuellement chacune des ~40 routes avec `<ErrorBoundary fallbackTitle="...">`. Un crash dans un module (ex: Caisse) n'affecte plus le reste du dashboard. Conforme.

**B. ErrorBoundary reset** — `ErrorBoundary.tsx` dispose de `handleReset` qui fait `setState({ hasError: false })` + appelle `onReset?.()`. Les 3 boutons (Reessayer, Actualiser, Dashboard) sont presents. Conforme.

**C. Cotisations exercice actif** — `Reunions.tsx` ligne 299 initialise avec `"__init__"`, et le `useEffect` (lignes 315-320) pre-selectionne automatiquement l'exercice ou `statut === 'actif'`. Fallback vers `"all"` si aucun actif. Conforme.

**D. Auth token expire** — `AuthContext.tsx` lignes 135-147 intercepte `TOKEN_REFRESHED` sans session, appelle `signOut()` avec toast "Session expiree". Le flag `isSigningOut` empeche les boucles. Conforme.

**Aucun bug detecte. Phase 1 validee. Passage a la Phase 2.**

---

## Phase 2 — Site Public & Evenements

D'apres le fichier de remarques, les points Phase 2 restants sont :

### Deja corriges (audit confirme dans le code actuel)

| Point | Statut | Preuve |
|---|---|---|
| Galerie : albums uniquement | OK | `Gallery.tsx` n'affiche que les albums, zero section "tous les medias" |
| Galerie : page album dediee | OK | `AlbumDetail.tsx` existe avec lightbox + grid |
| Galerie : route `/albums/:albumId` | OK | Presente dans `App.tsx` |
| EventDetail : scroll to top | OK | `useEffect` ligne 26-28 avec `window.scrollTo(0,0)` |
| EventDetail : bouton retour `navigate(-1)` | OK | Ligne 182-188 utilise `navigate(-1)` |
| Footer : liens SPA `<Link>` | OK | Lignes 27-41 utilisent toutes `<Link to="...">` |
| Footer : Portail Membre → `/dashboard` | OK | Ligne 36 |
| EventDetail : album lie | OK | Lignes 518-547 affichent la section album |
| Reunions `target="_blank"` | NON EXISTANT | Aucun `target="_blank"` dans `DashboardSidebar.tsx` — pas un bug |

### Points restants a corriger (Phase 2)

**1. EventDetail — Ordre chronologique des sections**
Le fichier de remarques indique que les "dernieres informations apparaissent en haut". Actuellement `EventDetail.tsx` affiche dans cet ordre : Score → Match Info → Compte Rendu → Stats → Medias du match → Album lie. La section "Album lie" (lignes 518-547) est rendue **apres** la section Medias (lignes 473-517), mais elle est positionnee avec `className="mb-6"` tandis que la Card Medias n'a pas de margin-bottom, ce qui cree un probleme de layout. Plus important : l'album lie est rendu apres le footer du container parce qu'il est place apres la derniere `Card` des medias sans marge. L'ordre logique devrait etre : Info evenement → Match → CR → Stats → Album → Medias match (ou fusionner).

**Action** : Reordonner les sections JSX pour suivre la chronologie naturelle : Info evenement → Infos match → Score → CR → Stats individuelles → Album photos → Medias match. Deplacer le bloc album lie (lignes 518-547) avant le bloc medias match (lignes 473-517).

**2. EventDetail — CR des matchs E2D non visibles si pas de `match_id`**
Le CR est charge uniquement si `event?.match_id` existe (ligne 59). Si un evenement E2D n'a pas ete lie via `match_id` dans la table `site_events`, le CR ne s'affiche jamais sur le site public, meme s'il est publie dans le back-office. Ce n'est pas un bug de code mais un probleme de flux admin : il faut s'assurer que la synchronisation automatique `useSportEventSync` ecrit bien le `match_id`.

**Action** : Verifier `useSportEventSync.ts` pour confirmer que lors de la creation d'un evenement depuis un match E2D, le `match_id` est bien persiste dans `site_events`. Si ce n'est pas le cas, corriger la mutation d'insertion.

**3. AlbumDetail — Amelioration mineure**
La page `AlbumDetail.tsx` est fonctionnelle mais le bouton retour utilise `navigate(-1)` sans fallback. Si l'utilisateur arrive par lien direct (pas d'historique), il n'a aucune destination de retour.

**Action** : Ajouter un fallback : `if (window.history.length <= 1) navigate('/#galerie'); else navigate(-1);`

---

## Fichiers a modifier (Phase 2)

| Fichier | Modification | Impact |
|---|---|---|
| `src/pages/EventDetail.tsx` | Reordonner JSX : album lie avant medias match | Chronologie naturelle |
| `src/hooks/useSportEventSync.ts` | Verifier/corriger persistance `match_id` | CR visibles sur site public |
| `src/pages/AlbumDetail.tsx` | Fallback navigation si pas d'historique | UX acces direct |

## Ce qui n'est PAS modifie
- `Gallery.tsx` — deja conforme (albums uniquement + navigation)
- `Footer.tsx` — deja conforme (tous liens SPA)
- `DashboardSidebar.tsx` — aucun `target="_blank"` a supprimer
- `Events.tsx` — liste publique correcte avec `<Link to>` sur chaque carte
- `AlbumDetail.tsx` — lightbox et grid fonctionnels

