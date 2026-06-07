# Vérification Lot G1 ✅

Contrôles effectués sur `src/pages/admin/site/*.tsx` :
- **7/7 pages migrées** : Hero, Partners, Activities, Events, Gallery (item + album), Config, About utilisent `zodResolver` ou `aboutSchema.safeParse`.
- **Schémas centralisés** dans `src/lib/validation/site-schemas.ts` (7 schémas + `validateConfigValue`).
- **Aucun `console.*`** introduit dans les pages migrées.
- **Layouts conservés**, messages d'erreur FR inline via `<FieldError>`.

→ Lot G1 considéré terminé.

---

# Lot G4 — Audit Realtime & nettoyage async (~1 h)

## Objectif
Sécuriser la stabilité runtime en :
1. Garantissant le **désabonnement** systématique des canaux Supabase Realtime (évite fuites mémoire + doubles événements lors des navigations).
2. Corrigeant 2 patterns `array.map(async ...)` orphelins → `Promise.all(...)` (évite promesses non-attendues, erreurs silencieuses).

## Périmètre

### A. Audit Realtime
Recenser tous les `supabase.channel(...)` du frontend et vérifier :
- Chaque `channel(...).subscribe()` a un `removeChannel(channel)` dans le cleanup d'`useEffect`.
- Pas de canal créé hors d'un `useEffect` (donc jamais cleané).
- Noms de canaux uniques (suffixe avec id/uuid si dépendant d'une route, pour éviter collisions).

Fichiers candidats prioritaires (à confirmer par `rg`) :
- `src/hooks/useRealtimeUpdates.ts`
- `src/hooks/generic/useSupabaseRealtime.ts`
- `src/hooks/useNotificationsTemplates.ts`, `useReunions.ts`, `useCotisations.ts`, `useCaisse.ts`, `useDonations.ts`, `useLoanRequests.ts`, `useSiteContent.ts`
- `src/components/notifications/NotificationCenter.tsx`
- `src/pages/reunions/hooks/useReunionsData.ts`

### B. Patterns async incorrects
Rechercher `\.map\(\s*async` dans `src/` et remplacer par `await Promise.all(items.map(async ...))` lorsque le résultat doit être attendu (ex. enchaînement de mutations, agrégation de données).

## Méthode
1. **Recensement** via `rg -n "supabase\.channel\(|\.map\(\s*async" src` → liste exhaustive.
2. **Classement** des occurrences :
   - Realtime OK (cleanup présent) — aucun changement.
   - Realtime KO — ajouter cleanup `() => supabase.removeChannel(channel)`.
   - `.map(async)` orphelin — wrapper dans `Promise.all`.
3. **Application** des correctifs minimaux, fichier par fichier.
4. **Tests** :
   - `bunx vitest run` pour vérifier non-régression unitaire.
   - Vérification preview sur une page Realtime sensible (NotificationCenter, Réunions) : pas d'avertissement console, pas de double toast.

## Hors périmètre
- Pas de refonte de `useSupabaseRealtime` (hook générique conservé).
- Pas de changement de logique métier (just lifecycle + await).
- Pas de modification DB/RLS/Edge Functions.

## Livrables
- Fichiers `src/hooks/*` et `src/components/*` corrigés (liste finale après recensement).
- Mise à jour `.lovable/plan.md` et `docs/CODE_REVIEW.md` (Lot G4 = ✅).

## Risques
- **Faible** : changements localisés au cycle de vie React + wrapping `Promise.all`.
- Risque résiduel : si un canal était volontairement persistant (rare), à valider au cas par cas avant cleanup.
