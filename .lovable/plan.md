# Lot 1.4 — LoadingButton + centralisation formatFCFA + audit liens

## Constat de l'audit préalable

| Item | État | Décision |
|---|---|---|
| Liens internes `<a href="/…">` (au lieu de `<Link>` react-router) | **0 occurrence** dans `src/` | Rien à corriger ⇒ hors périmètre |
| Composant `LoadingButton` mutualisé | **N'existe pas**. ~40 fichiers répètent `<Button disabled={mutation.isPending}>{isPending ? "…" : "…"}</Button>` | À créer + migration ciblée |
| Formatage `FCFA` manuel (`toLocaleString() + " FCFA"`, `${n} FCFA`, etc.) | **>30 fichiers** avec formatage inline alors que `formatFCFA` existe déjà dans `src/lib/utils.ts` | Migration ciblée |

## Livrables

### 1. Nouveau composant `src/components/ui/loading-button.tsx`

Wrapper autour du `Button` shadcn existant :

```tsx
<LoadingButton
  loading={mutation.isPending}
  loadingText="Enregistrement..."
  // ...props Button standard
>
  Enregistrer
</LoadingButton>
```

- Affiche `Loader2` animé (`animate-spin`) + `loadingText` (facultatif, sinon garde le children).
- Force `disabled` si `loading || props.disabled`.
- Forwarding complet de `ButtonProps` via `React.forwardRef` (pour `asChild`, `variant`, `size`).
- **Zéro classe hardcodée** : hérite du design system via `Button`.

### 2. Migration ciblée `LoadingButton` (périmètre restreint)

Uniquement les formulaires admin/actions critiques déjà repérés :

- `src/components/forms/CompteRenduForm.tsx`
- `src/components/forms/CotisationSaisieForm.tsx`
- `src/components/forms/E2DMatchForm.tsx`
- `src/components/forms/E2DMatchEditForm.tsx`
- `src/components/forms/ReunionForm.tsx`
- `src/components/forms/MemberForm.tsx` (bouton submit final)
- `src/components/admin/CreateUserDialog.tsx` (les 2 boutons : créer + envoyer identifiants, cohérence avec Lot 1.3)

Pas de migration en masse sur les 40+ occurrences — on privilégie les surfaces à forte fréquence de clic. Les autres suivront au fil des touches ultérieures.

### 3. Centralisation `formatFCFA`

Remplacer les patterns inline dans les fichiers à plus forte densité :

- `src/pages/admin/_components/RapportsTabsContent.tsx` (17 occ.)
- `src/lib/compte-rendu-pdf.ts` (10)
- `src/components/CompteRenduViewer.tsx` (10)
- `src/lib/rapports-export.ts` (6)
- `src/components/CotisationsCumulAnnuel.tsx` (6)
- `src/pages/admin/AidesAdmin.tsx` (5)
- `src/components/ClotureReunionModal.tsx` (5)

Import : `import { formatFCFA } from "@/lib/utils"`.

Règle appliquée (déjà dans `formatFCFA` — memory Core : *FCFA n'admet aucune décimale*) : `Math.floor(n)` + espace insécable géré par `toLocaleString("fr-FR")`.

### 4. Rien à modifier pour les liens internes

L'audit ne remonte aucune ancre `<a href="/route">` interne. Les composants utilisent déjà `useNavigate()` / `<Link>` de `react-router-dom`. On documente l'audit dans le CHANGELOG mais on ne touche pas au code.

## Fichiers touchés

| Fichier | Action |
|---|---|
| `src/components/ui/loading-button.tsx` | **création** |
| 7 fichiers de formulaires listés ci-dessus | migration `<Button>` → `<LoadingButton>` |
| 7 fichiers listés ci-dessus | migration inline → `formatFCFA()` |
| `docs/CHANGELOG.md` | entrée Lot 1.4 |

## Hors périmètre

- Migration exhaustive des ~40 `<Button disabled={isPending}>` restants (pattern OK tant qu'il fonctionne, on migre à la demande).
- Refactor des composants `PDF` non listés ci-dessus (`pret-pdf-export.ts`, `membre-pdf.ts` : formats déjà normalisés).
- Support d'autres devises (EUR/USD déjà géré par `formatCurrency`).

## Validation

- `tsgo` (typecheck) propre.
- `bunx vitest run src/lib/utils.test.ts` (déjà couvert : formatFCFA + décimales).
- Test visuel : ouvrir un formulaire migré, cliquer Submit → loader + texte "…", bouton disabled.

## Rollback

`git restore` sur les 14 fichiers + `rm src/components/ui/loading-button.tsx`. Aucune migration DB, aucune edge function touchée.
