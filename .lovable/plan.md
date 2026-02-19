
# Remplacement du favicon par le logo E2D

## Contexte

Le projet contient déjà le logo officiel de l'association à `src/assets/logo-e2d.png`. Il suffit de le copier dans le dossier `public/` et de mettre à jour `index.html` pour le référencer correctement.

## Actions

### 1. Copier le logo dans `public/`

Copier `src/assets/logo-e2d.png` vers `public/logo-e2d.png` pour le rendre accessible à la racine du site.

### 2. Mettre à jour `index.html`

Remplacer la ligne du favicon actuel (absente dans le HTML — le favicon.ico est chargé par défaut par le navigateur) par une balise `<link>` explicite pointant vers le logo PNG :

```html
<link rel="icon" type="image/png" href="/logo-e2d.png" />
<link rel="apple-touch-icon" href="/logo-e2d.png" />
```

La balise `apple-touch-icon` assure également que le logo s'affiche correctement sur les appareils Apple (iPhone, iPad) quand on ajoute le site à l'écran d'accueil.

## Résultat attendu

- Le favicon visible dans l'onglet du navigateur sera le logo E2D
- Le logo s'affichera également comme icône sur mobile
- Aucune autre modification nécessaire
