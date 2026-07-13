# i18n & Thèmes par association — Guide (Phase 6)

## Vue d'ensemble

Phase 6 apporte trois briques :

1. **i18n FR/EN** via `i18next` + `react-i18next` (`src/i18n/`).
2. **Thème par association** — édité dans **Paramètres → Identité & Thème** (`/dashboard/admin/branding`), stocké dans `associations.theme_tokens` (jsonb) et appliqué comme CSS vars `--tenant-*` par `AssociationContext`.
3. **Devise dynamique** — `formatCurrencyForAssociation()` lit `currency_code` depuis `theme_tokens` (fallback FCFA).

## Ajouter une clé de traduction

1. Éditer `src/i18n/locales/fr/<namespace>.json` puis `src/i18n/locales/en/<namespace>.json`.
2. Utiliser dans un composant :

```tsx
import { useTranslation } from "react-i18next";
const { t } = useTranslation("finance");
<Badge>{t("loan.status.rembourse")}</Badge>
```

## Ajouter une langue

1. Créer `src/i18n/locales/<lang>/*.json`.
2. Ajouter le code dans `SUPPORTED_LANGS` (`src/i18n/index.ts`).
3. Le `LanguageSwitcher` liste automatiquement la nouvelle langue.

## Personnaliser le thème d'une association

Depuis l'admin (`/dashboard/admin/branding`) — nécessite la permission `config:write`.

Le format HSL est requis pour les couleurs : `220 90% 56%` (sans `hsl()` autour). Ces valeurs sont écrites dans les CSS vars `--tenant-primary`, `--tenant-secondary`, etc.

## Devise

- Par défaut : **FCFA** (mémoire projet).
- `XOF` est traité comme `FCFA` pour l'affichage.
- `EUR` et `USD` utilisent `Intl.NumberFormat` avec la locale choisie.

## Contraintes respectées

- Aucun `text-white` / `bg-[#hex]` ajouté ; toutes les couleurs restent sémantiques.
- Aucune nouvelle table SQL : réutilisation de `associations.theme_tokens` (jsonb) et `associations.logo_url` existants.
- Le dark mode global reste inchangé.
