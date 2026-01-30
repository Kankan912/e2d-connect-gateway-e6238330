
# Plan d'Implémentation - Gestion des Medias Avancee

## Resume des 3 Fonctionnalites Demandees

1. **Support HEIC** : Permettre l'upload d'images au format HEIC dans la bibliotheque media
2. **Lecteur d'images Facebook-like** : Visualisation en lightbox avec navigation fleches gauche/droite (pas de nouvelle page)
3. **Gestion par Albums** : Afficher les legendes sur les albums et permettre l'ajout de plusieurs images par album

---

## I. Support HEIC dans la Bibliotheque Media

### Contexte Technique
Les fichiers HEIC (High Efficiency Image Container) sont utilises par defaut sur les iPhones. Les navigateurs ne supportent pas nativement ce format, il faut donc les convertir cote client avant l'upload.

### Solution
Utiliser la bibliotheque `heic2any` pour convertir automatiquement les fichiers HEIC en JPEG avant upload.

### Fichiers a Modifier/Creer

| Fichier | Action |
|---------|--------|
| `package.json` | Ajouter dependance `heic2any` |
| `src/lib/heic-converter.ts` | **CREER** - Utilitaire de conversion HEIC vers JPEG |
| `src/lib/storage-utils.ts` | Modifier `uploadFile()` pour detecter et convertir HEIC |
| `src/components/admin/MediaUploader.tsx` | Ajouter `.heic,.heif` dans l'attribut `accept` |
| `src/components/MediaLibrary.tsx` | Ajouter `.heic,.heif` dans l'attribut `accept` |
| `src/components/MatchMediaManager.tsx` | Ajouter `.heic,.heif` dans l'attribut `accept` |

### Logique de Conversion

```text
Fichier selectionne
    |
    v
Est-ce un fichier HEIC/HEIF ?
    |
   OUI -> Conversion via heic2any -> Blob JPEG -> Nouveau File avec extension .jpg
    |
   NON -> Fichier original
    |
    v
Upload normal vers Supabase Storage
```

---

## II. Lecteur d'Images Facebook-Like (Lightbox)

### Comportement Souhaite (base sur la reference utilisateur)
- Clic sur image ouvre une modale plein ecran (pas une nouvelle page)
- Navigation fleches gauche/droite pour passer d'une image a l'autre
- Fermeture via X ou clic en dehors
- Navigation au clavier (Fleche gauche/droite, Echap)
- Affichage du compteur (ex: 3/12)
- Titre et legende de l'image en overlay
- Support tactile (swipe) sur mobile

### Fichiers a Creer/Modifier

| Fichier | Action |
|---------|--------|
| `src/components/ui/image-lightbox.tsx` | **CREER** - Composant lightbox reutilisable |
| `src/components/Gallery.tsx` | Remplacer le Dialog par le lightbox |
| `src/components/MediaLibrary.tsx` | Integrer le lightbox pour la previsualisation |
| `src/components/MatchMediaManager.tsx` | Remplacer le Dialog par le lightbox |

### Structure du Composant ImageLightbox

```text
Props:
- images: Array<{ url: string, title?: string, description?: string }>
- initialIndex: number (image de depart)
- open: boolean
- onOpenChange: (open: boolean) => void

Features:
- Overlay sombre avec animation fade
- Boutons Precedent/Suivant (ChevronLeft/ChevronRight)
- Bouton Fermer (X) en haut a droite
- Compteur d'images (3/12)
- Titre et description en bas de l'image
- Navigation clavier (ArrowLeft, ArrowRight, Escape)
- Support swipe tactile pour mobile
- Prechargement des images adjacentes
```

---

## III. Gestion des Albums avec Legendes Visibles

### Probleme Actuel (visible dans la capture d'ecran)
- Les albums s'affichent mais la legende/description n'est pas visible sur la page publique
- L'album montre juste une icone dossier quand pas d'image de couverture
- Le clic sur album ouvre un Dialog classique, pas un lightbox

### Ameliorations a Apporter

| Element | Amelioration |
|---------|--------------|
| Affichage Album | Ajouter la legende/description visible sur la carte album |
| Ouverture Album | Utiliser le lightbox Facebook-like au lieu du Dialog actuel |
| Navigation interne | Fleches gauche/droite dans l'album |
| Multi-upload | Permettre l'upload de plusieurs images a la fois dans un album |

### Fichiers a Modifier

| Fichier | Action |
|---------|--------|
| `src/components/Gallery.tsx` | Refactorer pour utiliser ImageLightbox + afficher legendes |
| `src/pages/admin/site/GalleryAdmin.tsx` | Ajouter bouton "Ajouter plusieurs images" par album |

### Nouveau Flux Galerie Publique

```text
1. Affichage des albums avec:
   - Titre de l'album
   - Legende/description visible sous le titre
   - Image de couverture ou premiere image

2. Clic sur un album:
   - Ouvre le lightbox avec toutes les images de l'album
   - Navigation fleches gauche/droite
   - Compteur (3/12 photos)
   - Affichage titre + legende de chaque image

3. Clic sur une image hors album:
   - Ouvre le lightbox avec les images sans album
   - Meme navigation
```

---

## IV. Detail des Implementations

### 1. Nouveau fichier: `src/lib/heic-converter.ts`

```typescript
// Fonctions a implementer:

// isHeicFile(file: File): boolean
// - Detecte si le fichier est HEIC/HEIF via extension ou mimetype

// convertHeicToJpeg(file: File): Promise<File>
// - Utilise heic2any pour convertir
// - Retourne un nouveau File avec extension .jpg
// - Gere les erreurs de conversion
// - Affiche un toast de conversion en cours
```

### 2. Nouveau fichier: `src/components/ui/image-lightbox.tsx`

```typescript
// Structure du composant:

interface LightboxImage {
  url: string;
  title?: string;
  description?: string;
}

interface ImageLightboxProps {
  images: LightboxImage[];
  initialIndex?: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Implementation:
// - Dialog plein ecran avec overlay sombre (bg-black/90)
// - Image centree avec object-contain
// - Boutons ChevronLeft/ChevronRight sur les cotes
// - Bouton X en haut a droite
// - Compteur en haut au centre
// - Titre/description en bas
// - useEffect pour navigation clavier
// - Touch events pour swipe mobile
```

### 3. Modification: `src/components/Gallery.tsx`

```typescript
// Changements principaux:

// 1. Ajouter import du lightbox
import { ImageLightbox } from '@/components/ui/image-lightbox';

// 2. Nouveaux states
const [lightboxOpen, setLightboxOpen] = useState(false);
const [lightboxImages, setLightboxImages] = useState<LightboxImage[]>([]);
const [lightboxIndex, setLightboxIndex] = useState(0);

// 3. Fonction pour ouvrir le lightbox
const openAlbumLightbox = (album, startIndex = 0) => {
  const albumItems = galleryItems.filter(item => item.album_id === album.id);
  const images = albumItems.map(item => ({
    url: item.image_url || item.video_url,
    title: item.titre,
    description: album.description
  }));
  setLightboxImages(images);
  setLightboxIndex(startIndex);
  setLightboxOpen(true);
};

// 4. Afficher la legende sur chaque album
// Dans le rendu des albums, ajouter:
{album.description && (
  <p className="text-sm text-muted-foreground line-clamp-2">
    {album.description}
  </p>
)}

// 5. Remplacer le Dialog par ImageLightbox
<ImageLightbox
  images={lightboxImages}
  initialIndex={lightboxIndex}
  open={lightboxOpen}
  onOpenChange={setLightboxOpen}
/>
```

### 4. Modification: `src/pages/admin/site/GalleryAdmin.tsx`

```typescript
// Ajouter un bouton "Ajouter plusieurs images" par album

// Nouveau state pour multi-upload
const [multiUploadAlbumId, setMultiUploadAlbumId] = useState<string | null>(null);

// Nouveau Dialog pour multi-upload
<Dialog open={!!multiUploadAlbumId} onOpenChange={() => setMultiUploadAlbumId(null)}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Ajouter plusieurs images a l'album</DialogTitle>
    </DialogHeader>
    <input
      type="file"
      multiple
      accept="image/*,.heic,.heif"
      onChange={handleMultiUpload}
    />
  </DialogContent>
</Dialog>

// Fonction handleMultiUpload
// - Boucle sur les fichiers selectionnes
// - Pour chaque fichier: upload vers storage + creation entree site_gallery
// - Associe a l'album_id
```

---

## V. Dependance a Installer

```json
{
  "heic2any": "^0.0.4"
}
```

Note : heic2any est un package leger (~100KB) qui utilise libheif pour la conversion cote client.

---

## VI. Resume des Fichiers

### Fichiers a CREER (2)
1. `src/lib/heic-converter.ts` - Utilitaire de conversion HEIC
2. `src/components/ui/image-lightbox.tsx` - Composant lightbox reutilisable

### Fichiers a MODIFIER (6)
1. `src/lib/storage-utils.ts` - Integrer conversion HEIC avant upload
2. `src/components/admin/MediaUploader.tsx` - Accepter HEIC dans input file
3. `src/components/MediaLibrary.tsx` - Accepter HEIC + utiliser lightbox
4. `src/components/MatchMediaManager.tsx` - Accepter HEIC + utiliser lightbox
5. `src/components/Gallery.tsx` - Lightbox + legendes visibles sur albums
6. `src/pages/admin/site/GalleryAdmin.tsx` - Multi-upload par album

---

## VII. Tests a Effectuer

1. **Upload HEIC** : Uploader une image .heic depuis un iPhone, verifier la conversion en JPEG
2. **Lightbox Navigation** : Tester les fleches, le clavier, le swipe sur mobile
3. **Albums avec legendes** : Verifier l'affichage des descriptions sur le site public
4. **Multi-upload** : Ajouter plusieurs images a un album en une fois
5. **Compatibilite** : Tester sur Chrome, Firefox, Safari, Mobile
