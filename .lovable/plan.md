

# Phase Mobile UX : Amelioration de l'experience sur smartphone

## Constats apres audit

Le site public (page d'accueil) est deja bien adapte au mobile : navbar hamburger, hero responsive, sections empilees. Les principaux problemes se concentrent sur le **portail membre (dashboard)** et certaines pages admin.

### Problemes identifies

1. **Padding du contenu dashboard trop large sur mobile** : `p-6` (24px) dans `DashboardLayout` et `px-6` dans le header -- prend trop de place sur un ecran 390px
2. **Titres trop grands sur mobile** : `text-3xl` (30px) pour les titres de toutes les pages dashboard (9 pages)
3. **Header dashboard non adapte** : le texte "Tableau de bord" prend de la place inutilement sur mobile, pas de bouton sidebar trigger visible
4. **Tableaux admin sans scroll horizontal** : certains tableaux (PretsAdmin, MembresAdmin, CaisseAdmin, etc.) ont `overflow-x-auto` mais les colonnes ne sont pas priorisees
5. **Grilles de stats qui s'empilent sans adaptation** : les cards de stats (4 colonnes desktop) passent directement a 1 colonne sans etape intermediaire sur certaines pages
6. **Actions rapides du DashboardHome** : grille `md:grid-cols-2 lg:grid-cols-4` correcte mais les cards pourraient etre plus compactes
7. **Sidebar trigger difficile a trouver** : positionne en absolu dans la sidebar elle-meme, pas dans le header principal

---

## Plan de modifications

### Batch 14A : Layout Dashboard Mobile (3 fichiers)

**Fichier 1 : `src/components/layout/DashboardLayout.tsx`**
- Changer `p-6` en `p-3 sm:p-6` pour le main content
- Le contenu aura 12px de padding sur mobile au lieu de 24px

**Fichier 2 : `src/components/layout/DashboardHeader.tsx`**
- Changer `px-6` en `px-3 sm:px-6`
- Masquer le texte "Tableau de bord" sur mobile (`hidden sm:block`)
- Ajouter un `SidebarTrigger` visible sur mobile dans le header (a gauche)
- Import de `SidebarTrigger` depuis le composant sidebar

**Fichier 3 : `src/components/layout/DashboardSidebar.tsx`**
- Deplacer le `SidebarTrigger` de la sidebar vers le header (supprimer l'absolu L249)
- Le sidebar utilise deja un Sheet sur mobile via le composant `sidebar.tsx` -- pas de changement necessaire

### Batch 14B : Titres et textes responsive (9 fichiers dashboard)

Appliquer `text-2xl sm:text-3xl` sur tous les `h1` des pages dashboard :
- `DashboardHome.tsx` (L33)
- `MyDonations.tsx` (L76)
- `MyCotisations.tsx`
- `MyEpargnes.tsx` (L35)
- `MyPresences.tsx` (L29)
- `MySanctions.tsx` (L55)
- `MyPrets.tsx` (L68)
- `MyAides.tsx` (L55)
- `Profile.tsx`

Reduire aussi les valeurs stat : `text-2xl sm:text-3xl` sur les chiffres principaux dans ces pages.

### Batch 14C : Sous-titres et sections (2 fichiers)

**`DashboardHome.tsx`**
- "Actions rapides" : `text-xl sm:text-2xl`
- Cards d'actions rapides : ajouter `grid-cols-2` par defaut pour 2 colonnes meme sur petit ecran (au lieu de 1 colonne)

### Batch 14D : Header admin responsive

Appliquer le meme pattern `text-2xl sm:text-3xl` sur les pages admin principales qui utilisent des titres en `text-3xl`.

---

## Resume des modifications

| # | Fichier | Changement |
|---|---------|------------|
| 1 | `DashboardLayout.tsx` | `p-3 sm:p-6` |
| 2 | `DashboardHeader.tsx` | `px-3 sm:px-6`, SidebarTrigger mobile, titre masque |
| 3 | `DashboardSidebar.tsx` | Supprimer SidebarTrigger absolu |
| 4-12 | 9 pages dashboard | Titres et stats responsive |
| 13 | `DashboardHome.tsx` | Grille actions `grid-cols-2` |

## Impact

- Meilleure lisibilite sur ecrans < 400px
- Navigation sidebar accessible depuis le header sur mobile
- Padding optimise pour maximiser l'espace utile
- Aucun changement fonctionnel
- Aucun impact sur desktop

## Section technique

Les modifications sont purement CSS via les classes Tailwind responsive :
- `p-3 sm:p-6` : 12px mobile, 24px a partir de 640px
- `text-2xl sm:text-3xl` : 24px mobile, 30px desktop
- `hidden sm:block` : masque sur mobile, visible a partir de 640px
- `grid-cols-2 md:grid-cols-2 lg:grid-cols-4` : 2 colonnes par defaut

