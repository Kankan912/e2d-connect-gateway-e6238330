# Lot G1 — Validation zod (admin/site)

## Objectif
Sécuriser les 7 formulaires d'administration du site public avec validation `zod` + `react-hook-form` (déjà présents dans les dépendances), messages d'erreur en français, limites de longueur et contrôles de format (URL, email, hex, dates).

## Périmètre (7 fichiers)
| Fichier | Schéma à créer | Champs validés |
|---|---|---|
| `HeroAdmin.tsx` | `heroSchema` | `titre` (1–120), `sous_titre` (≤200), `description` (≤500), `cta_label` (≤40), `cta_url` (url), `image_url` (url) |
| `PartnersAdmin.tsx` | `partnerSchema` | `nom` (1–100), `logo_url` (url), `site_url` (url optionnel), `ordre` (int ≥0) |
| `ActivitiesAdmin.tsx` | `activitySchema` | `titre` (1–120), `description` (≤1000), `icone` (≤40), `ordre` (int ≥0), `actif` (bool) |
| `EventsAdmin.tsx` | `eventSchema` | `titre` (1–150), `description` (≤2000), `date_debut`/`date_fin` (ISO, fin≥début), `lieu` (≤150), `image_url` (url) |
| `GalleryAdmin.tsx` | `gallerySchema` | `titre` (≤150), `description` (≤500), `image_url` (url requis), `categorie` (enum), `ordre` (int ≥0) |
| `ConfigAdmin.tsx` | `configSchema` | `email_contact` (email), `telephone` (regex), `adresse` (≤300), `facebook/instagram/youtube` (url), `couleur_primaire` (hex) |
| `AboutAdmin.tsx` | `aboutSchema` | `titre` (1–150), `contenu` (1–5000), `mission` (≤2000), `vision` (≤2000), `valeurs` (≤2000) |

## Approche standardisée
1. Centraliser les schémas dans **`src/lib/validation/site-schemas.ts`** (réutilisables, testables, import unique).
2. Dans chaque page : remplacer le `useState`-form actuel par `useForm<z.infer<typeof X>>({ resolver: zodResolver(X) })` + composants Shadcn `Form/FormField/FormItem/FormLabel/FormControl/FormMessage`.
3. Messages d'erreur en **français** via `.min(n, { message: "..." })`.
4. `handleSubmit` typé, soumission désactivée pendant `isSubmitting`, `toast` succès/erreur conservés.
5. Conserver la logique métier Supabase existante inchangée (insert/update RPC, realtime, RLS).

## Hors périmètre
- Pas de modification de schéma DB ni de RLS.
- Pas de refactor visuel (formulaires gardent leur layout actuel).
- `ImagesAdmin.tsx` (uploader) et `MessagesAdmin.tsx` (boîte de réception lecture) exclus — pas de formulaire de saisie utilisateur structuré.
- Edge Functions non touchées.

## Détails techniques
- **Dépendances :** `zod`, `react-hook-form`, `@hookform/resolvers/zod`, `@/components/ui/form` — tous déjà présents.
- **Tests rapides :** vérification manuelle preview sur chaque page (submit vide → messages FR, submit invalide URL → erreur, submit valide → toast succès).
- **Logger :** `console.*` interdit (Core rule), utiliser `@/lib/logger` si log nécessaire.
- **Devise/rôles :** non concernés par ce lot.

## Livrables
- `src/lib/validation/site-schemas.ts` (nouveau)
- 7 fichiers `src/pages/admin/site/*.tsx` migrés vers `react-hook-form + zod`
- Mise à jour `.lovable/plan.md` (statut Lot G1 = done)
- Note dans `docs/CODE_REVIEW.md` (section G1 marquée complétée)

## Estimation
~1 h. Aucun risque régression DB. Risque UX faible (layouts conservés).

---

## Statut Lot G1 — ✅ Livré

- `src/lib/validation/site-schemas.ts` créé (7 schémas + validateur dynamique config)
- HeroAdmin / PartnersAdmin / ActivitiesAdmin / EventsAdmin / GalleryAdmin (item + album) / ConfigAdmin / AboutAdmin migrés vers `zodResolver` (ou `safeParse` pour AboutAdmin/ConfigAdmin)
- Messages d'erreur FR inline sous chaque champ
- Aucun changement DB / RLS / layout
