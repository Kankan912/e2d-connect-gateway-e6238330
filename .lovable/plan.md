# Phase 6 — i18n, thèmes & personnalisation par association

Objectif : permettre à chaque association d'avoir sa propre identité (nom, logo, couleurs, devise, langue) et préparer le multilingue (FR / EN, extensible).

## Périmètre

### 6.1 — Infrastructure i18n (FR / EN)
- Ajout de `i18next` + `react-i18next` + `i18next-browser-languagedetector`.
- Structure `src/i18n/` :
  - `index.ts` (init, détection langue, fallback FR)
  - `locales/fr/common.json`, `locales/fr/finance.json`, `locales/fr/admin.json`, `locales/fr/site.json`
  - `locales/en/` (mêmes namespaces, traduits)
- Composant `<LanguageSwitcher />` (header dashboard + site public).
- Persistance langue : `localStorage` + colonne `preferred_language` dans `profiles`.
- Migration progressive : `useTranslation()` posé sur `App.tsx`, layouts, pages critiques (Auth, Dashboard, PretsAdmin, AidesAdmin, DonationsAdmin, site public Index).
- Les libellés métier (statuts prêts, catégories caisse) passent par des clés i18n dans `StatutBadge` et badges équivalents.

### 6.2 — Thèmes par association (branding)
- Nouvelle table `association_theme` (une ligne par association) :
  - `primary_color`, `secondary_color`, `accent_color` (HSL text)
  - `logo_url`, `favicon_url`
  - `font_heading`, `font_body` (presets)
  - `radius` (sm/md/lg)
- Chargement au boot via `AssociationContext` : injection de CSS vars sur `<html>` (`--primary`, `--secondary`, `--accent`, `--radius`) — respect strict des tokens sémantiques existants dans `index.css`.
- Page admin `src/pages/admin/AssociationBrandingAdmin.tsx` :
  - Sélecteur couleurs (color picker HSL)
  - Upload logo/favicon dans bucket Storage `association-branding`
  - Choix presets typo (liste blanche : Inter, DM Sans, Space Grotesk, Manrope, Sora)
  - Aperçu en direct
- Le site public (`Index.tsx`, `Header`, `Footer`) lit le thème et affiche le logo/couleurs de l'association courante.

### 6.3 — Personnalisation par association
- Extension `association_settings` (déjà existante) :
  - `default_language` (fr / en)
  - `currency_code` (FCFA par défaut, extensible XOF/EUR/USD pour affichage)
  - `date_format` (dd/MM/yyyy, MM/dd/yyyy)
- Helper `formatCurrency(amount, association)` remplace `formatFCFA` progressivement (fallback FCFA garanti — respect mémoire projet).
- Helper `formatDate(date, association)`.

### 6.4 — Tests & documentation
- Vitest : `src/i18n/i18n.test.ts` (chargement namespaces, fallback), `src/lib/formatCurrency.test.ts`.
- `docs/I18N_THEMING.md` — guide contributeur : ajouter une clé, une langue, un thème.
- Mise à jour `docs/CHANGELOG.md`, `.lovable/plan.md`, mémoire `mem://architecture/i18n-theming`.

## Hors périmètre (renvoyé en Phase 7/8)
- Traduction complète EN de toutes les pages métier (on livre l'infra + FR/EN sur pages clés).
- Éditeur de traductions in-app.
- Thèmes dark/light multiples par association (une seule variante par asso pour l'instant, dark mode global conservé).

## Détails techniques

- **CSS variables** : aucun `text-white` / `bg-[#hex]` ajouté. Les surcharges de thème vont dans `--primary`, `--secondary`, `--accent`, `--radius` sur `:root` via un `<style>` injecté par `AssociationThemeProvider`.
- **FCFA** : reste devise par défaut ; `currency_code = 'XOF'` mappe sur `formatFCFA` existant. Aucun changement pour l'utilisateur actuel.
- **Rôles** : la page branding est réservée à `has_permission('association_settings','update')` (RBAC Phase 3).
- **Migration SQL** : une seule migration ajoute `association_theme` (avec GRANTs authenticated + service_role, RLS `has_permission`) et étend `association_settings` (colonnes nullables avec défauts).
- **Storage** : bucket `association-branding` public en lecture, écriture restreinte via policy `has_permission`.

## Livrables

- `src/i18n/**` (setup + 8 fichiers de traduction FR/EN)
- `src/components/LanguageSwitcher.tsx`
- `src/contexts/AssociationThemeProvider.tsx`
- `src/pages/admin/AssociationBrandingAdmin.tsx`
- `src/lib/formatCurrency.ts` + `src/lib/formatDate.ts`
- Migration `association_theme` + extensions `association_settings`
- Route `/admin/branding` + entrée sidebar admin
- Docs + tests

## Question design

Une question visuelle sera posée en début d'implémentation pour valider la **palette par défaut** proposée aux nouvelles associations (les associations existantes conservent leurs couleurs actuelles).