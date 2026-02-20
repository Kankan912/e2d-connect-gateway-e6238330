
# Refonte Site Public — Galerie Albums, Événements & Navigation

## Audit de l'état actuel

### Ce qui existe déjà (à ne pas recréer)
- Table `site_gallery_albums` : id, titre, description, cover_image_url, ordre, actif — complète
- Table `site_gallery` : id, titre, categorie, image_url, video_url, album_id (nullable), ordre, actif — complète
- Hooks `useSiteGalleryAlbums`, `useCreateGalleryAlbum`, etc. — tous opérationnels
- Interface admin `GalleryAdmin.tsx` avec onglets Photos / Vidéos / Albums — complète
- `ImageLightbox` — intégrée dans Gallery.tsx et EventDetail.tsx

### Problèmes confirmés

**1. Galerie publique — Médias orphelins affichés**
`Gallery.tsx` (lignes 140–200) affiche une section "Tous les médias" pour les items sans `album_id`. La spec veut que seuls les albums soient visibles.

**2. EventDetail — Pas de scroll to top**
`EventDetail.tsx` n'a aucun `useEffect` avec `window.scrollTo(0,0)` au mount.

**3. EventDetail — Bouton retour hardcodé**
Ligne 170 : `<Link to="/#evenements">` — redirige toujours vers la home au lieu de `navigate(-1)`.

**4. Footer — Liens non fonctionnels pour navigation SPA**
`Footer.tsx` lignes 24–40 : les liens internes de la section "Navigation" (`#accueil`, `#apropos`, etc.) sont des ancres `href` classiques dans des balises `<a>`. Sur une page autre que `/` (ex: `/evenements/:id`), ces ancres ne ramèneront pas à la section de la home page. Le lien "Portail Membre" pointe vers `/portal` inexistant (devrait être `/dashboard`). Il faut remplacer par des `<Link to="/#section">` pour navigation SPA complète.

**5. Galerie — Pas de page dédiée par album**
Le clic sur un album ouvre directement le lightbox (ligne 100 de Gallery.tsx). La spec demande une navigation vers une vue détaillée de l'album avant le lightbox.

---

## Plan d'implémentation

### Priorité 1 — Corrections critiques rapides (sans DB)

#### A. EventDetail — scroll to top + bouton retour
**Fichier : `src/pages/EventDetail.tsx`**
- Ajouter `useEffect(() => { window.scrollTo(0, 0); }, []);` au mount
- Remplacer `<Link to="/#evenements">` par un bouton avec `navigate(-1)` pour retour intelligent
- Si pas d'historique précédent : fallback vers `/#evenements`

#### B. Footer — liens de navigation SPA
**Fichier : `src/components/Footer.tsx`**
- Importer `Link` depuis `react-router-dom`
- Remplacer les `<a href="#section">` de la colonne "Navigation" par `<Link to="/#section">` (navigue vers home puis scroll)
- Corriger "Portail Membre" : `href="/portal"` → `<Link to="/dashboard">`
- Garder les liens externes (Facebook, mailto) en `<a>` avec `target="_blank"`

### Priorité 2 — Galerie publique restructurée

#### C. Page dédiée par album (nouvelle route)
**Nouveau fichier : `src/pages/AlbumDetail.tsx`**
- Récupère `albumId` depuis `useParams`
- Charge les données de l'album via `useSiteGalleryAlbums` + filtrage
- Charge les médias via `useSiteGalleryByAlbum(albumId)`
- Affiche : header album (titre + description + date), grille responsive des médias
- Clic sur une photo → `ImageLightbox` avec navigation ← →
- Bouton retour → `navigate(-1)` ou `/#galerie`

**Fichier : `src/App.tsx`** (ou fichier de routes)
- Ajouter route `/albums/:albumId`

#### D. Gallery.tsx — Vue albums uniquement
**Fichier : `src/components/Gallery.tsx`**
- Supprimer toute la section "Tous les médias" (lignes 141–200)
- Changer `onClick={() => openAlbumLightbox(album)}` → navigation vers `/albums/${album.id}`
- Utiliser `<Link to={/albums/${album.id}}>` sur chaque carte d'album
- Ajouter état vide si aucun album : message "Galerie en cours de préparation"
- Garder le CTA Facebook en bas

#### E. Liaison Événement → Album (proposition auto)
**Fichier : `src/pages/admin/site/EventsAdmin.tsx`** (vérification)
- Ajouter dans le formulaire d'édition d'événement un champ "Lier à un album galerie" (Select optionnel)
- Nécessite ajout colonne `album_id` nullable dans `site_events` — **1 migration SQL légère**

**Fichier : `src/pages/EventDetail.tsx`**
- Si l'événement a un `album_id`, afficher une section "Album Photos" avec miniatures et lien vers `/albums/:albumId`

### Priorité 3 — Cohérence navigation SPA globale

#### F. Audit liens `target="_blank"` internes
**Fichier : `src/components/Gallery.tsx`** : le bouton Facebook ouvre `_blank` — correct car lien externe, à conserver.
Vérifier `src/components/Navbar.tsx` pour tout lien interne mal configuré.

---

## Migrations SQL nécessaires

### Migration unique : ajouter `album_id` sur `site_events`
```sql
ALTER TABLE public.site_events
  ADD COLUMN IF NOT EXISTS album_id uuid REFERENCES public.site_gallery_albums(id) ON DELETE SET NULL;
```
Petite migration non destructive. Permet de lier un événement publié à un album galerie existant pour affichage automatique sur la page détail.

---

## Résumé des fichiers

| Fichier | Action | Priorité |
|---|---|---|
| `src/pages/EventDetail.tsx` | Scroll to top + navigate(-1) + section album | Critique |
| `src/components/Footer.tsx` | Liens SPA + correction /portal | Critique |
| `src/components/Gallery.tsx` | Suppression section orphelins + navigation albums | Critique |
| `src/pages/AlbumDetail.tsx` | Création page album | Haute |
| `src/App.tsx` | Route /albums/:albumId | Haute |
| `src/pages/admin/site/EventsAdmin.tsx` | Champ album_id optionnel | Haute |
| Migration SQL | ADD COLUMN album_id sur site_events | Haute |

## Ce qui n'est PAS modifié
- Table `site_gallery` — aucune contrainte NOT NULL ajoutée sur `album_id` (médias existants sans album seraient perdus)
- Interface admin `GalleryAdmin.tsx` — déjà complète et fonctionnelle
- Hooks `useSiteGalleryAlbums`, `useSiteGalleryByAlbum` — déjà corrects
- `ImageLightbox` — déjà intégrée et opérationnelle
