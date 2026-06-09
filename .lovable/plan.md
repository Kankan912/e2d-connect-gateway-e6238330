## Lot G6 — Accessibilité : `aria-label` sur boutons icon-only (admin)

### Objectif
Ajouter `aria-label` descriptifs sur tous les boutons "icon-only" (Pencil, Trash2, Eye, Plus seul, ExternalLink, X) des pages admin afin de respecter WCAG 2.5.2 / 4.1.2 et améliorer la lecture par lecteurs d'écran.

### Périmètre — fichiers ciblés
Pages `src/pages/admin/site/*` :
- `AboutAdmin.tsx`
- `ActivitiesAdmin.tsx` (Pencil/Trash2 lignes ~178-194)
- `ConfigAdmin.tsx`
- `EventsAdmin.tsx`
- `GalleryAdmin.tsx`
- `HeroAdmin.tsx`
- `PartnersAdmin.tsx` (Pencil/Trash2 lignes ~196-212)
- `ImagesAdmin.tsx`
- `MessagesAdmin.tsx`

Extension possible (si temps) : `src/pages/admin/UtilisateursAdmin.tsx`, `MembresAdmin.tsx`, `PretsAdmin.tsx` — à confirmer.

### Méthode
1. `rg -n "<Button[^>]*size=\"(sm|icon)\"" src/pages/admin` pour recenser les boutons icon-only sans texte.
2. Pour chaque match : ajouter `aria-label="Modifier <entité>"`, `aria-label="Supprimer <entité>"`, etc. en français cohérent avec l'UI.
3. Vérifier qu'aucun bouton avec texte visible ne reçoit `aria-label` redondant.
4. Vérifier les `DialogTrigger` et `Dialog` (titre déjà présent → pas de doublon).

### Hors périmètre
- Pas de refonte UI/CSS
- Pas de modification de logique métier, hooks, RLS ou edge functions
- Pas d'ajout de tests a11y automatisés (axe-core) — proposable en lot séparé
- Pas de validation Zod, ni nettoyage `console.*`

### Vérification
- `rg "size=\"(sm|icon)\".*>\s*<[A-Z]\w+ " src/pages/admin/site` doit retourner 0 résultat sans `aria-label` à proximité.
- `bunx vitest run` : pas de régression.
- Preview manuel sur 1-2 pages admin.

### Documentation
- Mise à jour `.lovable/plan.md` et `docs/CODE_REVIEW.md` : G6 ✅ TERMINÉ.

### Prochain lot suggéré
- **G2** — Refactor des `any` résiduels dans les hooks
- **G3** — Standardisation des messages d'erreur (`catch (error: unknown)` + `getErrorMessage`)
- **G5** — Extraction composants > 300 lignes
