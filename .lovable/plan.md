# Optimisation de l'espace dans le module Cotisations

## Problèmes identifiés (image)
1. **Onglets dupliqués** : "Par Réunion / Cumul annuel" (parent) + "Par Réunion / Suivi Annuel" (enfant) — redondance.
2. **Réunions empilées verticalement par mois** — gaspille beaucoup d'espace vertical avant d'arriver au tableau des cotisations.
3. **Bandeau "Sélectionner une réunion + Exercice"** prend une ligne entière en plus.

## Modifications

### 1. `src/pages/admin/CotisationsAdmin.tsx`
Retirer le `Tabs` parent qui fait doublon avec celui de `CotisationsTab`. Rendre directement `<CotisationsTab>` — il contient déjà les onglets "Par Réunion / Suivi Annuel".

### 2. `src/pages/reunions/components/CotisationsTab.tsx` — onglet "Par Réunion"
Compacter le sélecteur de réunions pour qu'il tienne sur **une seule ligne horizontale scrollable** :

- Remplacer la grille `grid-cols-2 md:grid-cols-3 lg:grid-cols-4` par une **liste horizontale** : `flex gap-2 overflow-x-auto pb-2` avec puces `flex-shrink-0`.
- Fusionner toutes les réunions filtrées dans une seule rangée triée par date (plus de regroupement vertical par mois). Le mois apparaît en petit au-dessus de chaque puce (`text-[10px] uppercase text-muted-foreground`) uniquement quand il change par rapport à la précédente — séparateur visuel léger.
- Réduire la taille des puces : `py-1 px-2`, date sur une ligne (`08 nov.`), statut sous forme d'icône uniquement (Lock / Clock / Users) — supprimer le texte "En cours / Planifiée / Clôturée" sous la date.
- Compactage de l'en-tête : titre "Sélectionner une réunion" et sélecteur d'exercice restent sur une seule ligne, mais réduire `pt-6` → `pt-4` et marges.
- Bandeau de statut sous la sélection : réduire de `p-3` → `p-2 text-xs` et icône `w-3 h-3`.

Résultat : ~150 px gagnés en hauteur avant le tableau des cotisations.

### Fichiers impactés
- `src/pages/admin/CotisationsAdmin.tsx`
- `src/pages/reunions/components/CotisationsTab.tsx`

Aucune autre page n'est touchée — `CotisationsTab` n'est utilisé qu'ici et dans le module Réunions (où le gain de place sera aussi bénéfique).
