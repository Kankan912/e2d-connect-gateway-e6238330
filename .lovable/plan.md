## Lot G3 — Standardisation de la gestion d'erreurs (`catch (error: unknown)`)

### Objectif
Uniformiser tous les blocs `catch` du frontend pour respecter la règle Core mémoire :
> Use `catch (error: unknown)`. Extract Edge Function errors via `data?.error`.

Éliminer les `catch (e)`, `catch (err)`, `catch (error)` sans typage, et remplacer les accès `error.message` non sûrs par un utilitaire `getErrorMessage(error)` centralisé.

### Périmètre
**Création** : `src/lib/errors.ts` contient déjà des helpers — vérifier et ajouter si besoin :
- `getErrorMessage(error: unknown): string` — gère `Error`, `{ message }`, `string`, fallback "Erreur inconnue"
- `getEdgeFunctionError(data: unknown, fallback?: string): string | null` — extrait `data?.error`

**Refactor** : recenser via `rg -n "catch \((e|err|error)\)" src` (sans `: unknown`) et corriger fichier par fichier.

Cibles principales attendues (à confirmer après recensement) :
- `src/hooks/use*.ts` (Caisse, Cotisations, Donations, Loans, Reunions, Sport, etc.)
- `src/components/**/*.tsx` (formulaires, modales)
- `src/pages/**/*.tsx` (Adhesion, Don, Auth, Dashboard)

Pour chaque bloc :
```ts
// Avant
} catch (error) {
  toast.error(error.message);
}
// Après
} catch (error: unknown) {
  toast.error(getErrorMessage(error));
}
```

Pour les appels Edge Functions :
```ts
const { data, error } = await supabase.functions.invoke(...);
if (error) throw error;
const edgeErr = getEdgeFunctionError(data);
if (edgeErr) throw new Error(edgeErr);
```

### Hors périmètre
- Pas de changement de logique métier
- Pas de refonte des toasts ou UI
- Pas d'ajout de logging supplémentaire (déjà standardisé via `src/lib/logger.ts`)
- Pas de migration SQL / RLS / Edge Functions
- Pas de tests nouveaux (les tests existants doivent continuer à passer)

### Méthode
1. `rg -n "catch \((e|err|error)\)" src --type ts --type tsx -c` → comptage par fichier, prioriser les 10-15 fichiers les plus impactés.
2. Vérifier l'export de `getErrorMessage` dans `src/lib/errors.ts`, compléter si manquant.
3. Édition par lots de 5-6 fichiers, vérification visuelle (preview) après chaque batch sensible (Auth, Adhesion, Don).
4. `bunx vitest run` final.

### Vérification
- `rg -n "catch \((e|err|error)\)(?!: unknown)" src` doit retourner 0 (hors fichiers `*.test.*`).
- `rg -n "error\.message" src` audité : tous remplacés par `getErrorMessage(error)`.
- Aucune régression sur les flux critiques (login, adhésion, don, prêt, cotisation).

### Documentation
- Mise à jour `.lovable/plan.md` et `docs/CODE_REVIEW.md` : G3 ✅ TERMINÉ avec liste des fichiers modifiés.

### Prochains lots
- **G2** — Refactor des `any` résiduels (typage strict)
- **G5** — Extraction des composants > 300 lignes

---

## ✅ Lot G3 (catch typing) — TERMINÉ

**Périmètre exécuté :** Ajout de `: unknown` sur tous les `catch (e|err|error)` non typés du frontend — 15 occurrences dans 12 fichiers. Tous les blocs loggent via `logger.*` sans accès `error.message` direct → aucune utilisation de `getErrorMessage` requise.

**Fichiers modifiés :**
- `src/hooks/useLoanRequests.ts`
- `src/hooks/useConnectionTracker.ts`
- `src/hooks/usePageviewTracker.ts`
- `src/lib/logger.ts`
- `src/lib/storage-utils.ts`
- `src/lib/exportService.ts`
- `src/lib/pdf-utils.ts` (×3)
- `src/components/forms/E2DMatchForm.tsx`
- `src/components/forms/E2DMatchEditForm.tsx`
- `src/components/donations/BankTransferInfo.tsx`
- `src/components/admin/CreateUserDialog.tsx` (×2)
- `src/pages/admin/UtilisateursAdmin.tsx`
- `docs/CODE_REVIEW.md`

**Vérification :** `rg --pcre2 'catch \((e|err|error)\)(?!:)' src` → 0 résultat. `bunx vitest run` → 57 passed, échec préexistant `badge.test.tsx` (module manquant, indépendant).

**Note :** Le G3 d'origine (suppression `any`) reste ouvert et fait partie du lot G2 plus large.
