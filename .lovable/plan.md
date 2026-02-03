
# Integration du Lightbox Facebook sur la Page Evenement/Match

## Probleme Identifie

Sur la page de detail d'un evenement (`/evenements/:id`), les photos et videos du match utilisent actuellement des liens `<a href target="_blank">` qui ouvrent les medias dans un nouvel onglet du navigateur.

**Code actuel (lignes 466-478):**
```html
<a href={media.url} target="_blank" rel="noopener noreferrer">
  <LazyImage ... />
</a>
```

## Solution

Integrer le composant `ImageLightbox` deja existant pour afficher les photos/videos dans une modale Facebook-like avec navigation fleches gauche/droite.

## Fichier a Modifier

| Fichier | Modification |
|---------|--------------|
| `src/pages/EventDetail.tsx` | Ajouter le lightbox + remplacer les liens par des clics |

## Changements Techniques

### 1. Imports a Ajouter
```typescript
import { useState } from "react";
import { ImageLightbox, LightboxImage } from "@/components/ui/image-lightbox";
```

### 2. Nouveaux States
```typescript
const [lightboxOpen, setLightboxOpen] = useState(false);
const [lightboxIndex, setLightboxIndex] = useState(0);
```

### 3. Preparation des Images pour le Lightbox
```typescript
const lightboxImages: LightboxImage[] = matchMedias.map((media) => ({
  url: media.url,
  title: media.legende || undefined,
  isVideo: media.type === "video",
}));
```

### 4. Fonction d'Ouverture
```typescript
const openLightbox = (index: number) => {
  setLightboxIndex(index);
  setLightboxOpen(true);
};
```

### 5. Remplacement des Liens
**Avant (ouvre nouvel onglet):**
```html
<a href={media.url} target="_blank">
  <LazyImage ... />
</a>
```

**Apres (ouvre lightbox):**
```html
<div onClick={() => openLightbox(index)} className="cursor-pointer">
  <LazyImage ... />
</div>
```

### 6. Ajout du Composant Lightbox
```html
<ImageLightbox
  images={lightboxImages}
  initialIndex={lightboxIndex}
  open={lightboxOpen}
  onOpenChange={setLightboxOpen}
/>
```

## Comportement Final

1. **Clic sur une image** → Ouvre le lightbox plein ecran
2. **Navigation fleches** → Passe a l'image precedente/suivante
3. **Compteur** → Affiche "3/12" en haut
4. **Legende** → Affichee en bas de l'image
5. **Videos** → Lecteur video integre dans le lightbox
6. **Clavier** → Fleches gauche/droite + Echap pour fermer
7. **Mobile** → Swipe gauche/droite fonctionne

## Resume des Modifications

- Ajouter import de `useState` (si pas deja present)
- Ajouter import de `ImageLightbox`
- Ajouter les states `lightboxOpen` et `lightboxIndex`
- Creer la liste `lightboxImages` a partir de `matchMedias`
- Remplacer les balises `<a>` par des `<div>` cliquables
- Ajouter le composant `<ImageLightbox>` en fin de page
