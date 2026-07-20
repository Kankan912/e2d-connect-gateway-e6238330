# Plan — Corrections Classeur_IA-4.xlsx

Le fichier joint contient **2 pages** :
- **Page 1** — 16 corrections métier (Cotisations, Réunions, Dashboard, Événements, Aides, Multi-tenant) avec priorités Critique/Haute/Moyenne.
- **Page 2** — 23 exigences de plateforme SaaS multi-tenant white-label (branding auto, thèmes, domaines, licences, i18n IA, CMS, quotas).

L'ensemble représente **~4 à 6 semaines de dev** si tout est mené de front. Je propose une exécution en **6 lots séquentiels** avec livraisons validables. Chaque lot passe par le pipeline CI existant (lint / typecheck / vitest / SAST / Gitleaks).

---

## Lot A — Cotisations par exercice & moteur de paiement (Critique)

Items page 1 : #1 config par exercice, #2 avances/verrouillage, #4 multi-cotisations, #8 calcul bénéficiaire centralisé.

1. Table `exercise_contribution_settings` (association_id, exercice_id, type_cotisation, montant, date_effet, actif, historique via trigger audit).
2. Migration des lectures : tout calcul (`useCotisationsMensuelles`, `CotisationService`, `BeneficiaireService`, réunions, dashboards) passe par cette table via un helper `getExerciseSetting(exerciceId, type)`.
3. Moteur `CotisationPaymentEngine` (dans `src/domain/finance/`) : calcule `montant_du / montant_paye / solde` en temps réel, retourne un statut `unpaid|partial|paid` mappé à un badge Rouge/Orange/Vert.
4. Verrouillage auto quand `solde === 0` : champ `verrouille` + RLS empêchant update sauf via RPC `unlock_cotisation(_id, _reason)` réservée admin (audit log obligatoire).
5. Fiche membre : nouveau flag `autoriser_plusieurs_cotisations_mensuelles` + paramètre global `max_cotisations_mensuelles_par_membre`. Adapter la validation d'ajout et le calcul du montant bénéficiaire (`total_cotisations_mensuelles_membre × nb_mois_exercice`).
6. Refactor `BeneficiaireService.computeMontantAnnuelNet` pour consommer ces settings ; supprimer les recomputes ad hoc.
7. Tests Vitest sur les 4 formules (avance, partiel, plein, multi-cotisation).

## Lot B — Bénéficiaires cotisations mensuelles & Réunions (Critique)

Items page 1 : #5 auto-remplissage bénéficiaire à la création de réunion, #6 plusieurs bénéficiaires/mois, #7 calendrier configurable, #9 validation paiement en clôture, #10 onglet calendrier consultable.

1. Refonte du modèle : table `calendrier_beneficiaires_mensuels` en **1 mois ↔ N bénéficiaires** (aujourd'hui 1↔1). Migration des données existantes.
2. Interface `CalendrierBeneficiairesAdmin` : liste ordonnée avec boutons Ajouter / Monter / Descendre / Retirer (pas de DnD lourd) + sélection multi-bénéficiaires par mois. Audit log.
3. Hook `useReunion.create` : à la création, résoudre le mois → charger tous les bénéficiaires programmés → pré-remplir la section paiement avec le **montant prévisionnel** (formule Lot A).
4. Modal `ValiderPaiementBeneficiaireModal` en clôture réunion : Trésorier saisit montant / date / mode / référence par bénéficiaire → `CaisseService.recordMovement` (sortie caisse) + audit + notification.
5. Nouvel onglet `CalendrierBeneficiairesTab` dans le module Réunions, accessible à tous les membres (lecture seule), avec exports PDF/Excel.
6. Tests : création réunion mars → charge bénéficiaires de mars ; validation paiement génère bien la sortie caisse tracée.

## Lot C — Vues consolidées membre & association (Haute)

Items page 1 : #3 « Mon État Financier », #11 dashboard financier global, #12 budget évènements, #13 commentaire obligatoire aides, #14 pièces justificatives aides.

1. Page `MonEtatFinancier` (`src/pages/dashboard/MonEtatFinancier.tsx`) — agrège cotisations dues/payées/impayées, prêts en cours + intérêts, aides reçues, fonds de caisse, investissements, solde net. Exports PDF (jsPDF) + Excel (SheetJS déjà présent).
2. Widget `DashboardFinancierGlobal` sur `DashboardHome` — cartes (fond caisse, sport, invest, épargne, aides, prêts, impayés) + graphique évolution Recharts + realtime via canal Supabase.
3. Module Événements : bloc « Budget » (prévu, sources, dépenses prévues/réelles, reste) + alerte dépassement > 90 %. Nouvelle table `event_budgets` + `event_budget_lines`.
4. `AideForm` : champ `commentaire` (min 20 car) obligatoire côté schema Zod + RLS + colonne DB.
5. Upload justificatifs aides Maladie/Naissance : bucket `aides-justificatifs` (privé, RLS par association_id + demandeur/admin), formats PDF/JPG/PNG max 5 Mo, listés dans le workflow de validation.

## Lot D — Fondations SaaS multi-tenant white-label (Critique — page 2 #1, #21)

Cœur de la plateforme, prérequis pour les lots E et F.

1. Audit exhaustif des tables et Edge Functions : chaque table métier doit avoir `association_id NOT NULL` avec FK + policy RLS `USING (association_id = current_association_id())`. Rapport dans `docs/PHASE2_TENANT_AUDIT.md` (déjà partiellement existant, à compléter).
2. Buckets Storage : renommer/scinder par association (`{association_id}/...`) + policies. Migration des fichiers existants.
3. Edge Functions : injection systématique de `association_id` (via JWT claim `current_association_id`), refus 403 sinon. Test automatisé par fonction.
4. Wizard `CreationAssociationWizard` (super_admin) — 5 étapes : identité, branding logo+couleurs, thème, domaine/sous-domaine, modules activés + licence. Provisionne via l'Edge Function `provision-association` (déjà existante, à étendre).

## Lot E — Branding & thèmes white-label (page 2 #3→#9, #17, #18)

1. Table `association_branding` : logo_url, couleurs (primary/secondary/accent/bg/text), fonts, radius, dark_mode_default.
2. Extraction auto des couleurs dominantes du logo (bibliothèque `colorthief` côté client, calcul HSL pour dériver secondaire/accent, contraste WCAG AA garanti).
3. Provider React `<BrandingProvider>` en tête d'`App.tsx` : injecte les tokens dans les CSS variables (`--primary`, `--secondary`, …) déjà définies dans `src/index.css`. Zéro couleur hardcodée dans les composants (audit `text-white`, `bg-*-500` — cf. mémoire design).
4. Bibliothèque de thèmes (`Corporate`, `Moderne`, `FinTech`, `Sport`, `ONG`, `Minimaliste`, `Premium`) sous forme de presets JSON de tokens ; sélection en 1 clic dans `AssociationBrandingAdmin`.
5. Toggle dark/light par association + override utilisateur (déjà présent, à connecter aux tokens dynamiques).
6. Menus et widgets configurables : tables `navigation_items` et `dashboard_widgets` scopées par association.

## Lot F — Domaine, i18n IA, licences & CMS (page 2 #10→#20, #22)

1. **Domaines** : table `association_domains` (domain, is_primary, ssl_status). Sous-domaine par défaut `{slug}.e2d.app` + custom domain via CNAME + edge middleware qui résout `Host` → `association_id`.
2. **SEO** : table `association_seo` (title, description, keywords, og_image, favicon) + hook `useSEO()` alimentant `react-helmet-async`.
3. **CMS** : tables `cms_pages`, `cms_sections`, `cms_menus` par association, éditeur riche (tiptap ou existant), publication versionnée.
4. **i18n IA** : audit — retirer tout texte hardcodé restant (script grep sur `>[A-Z][a-zé…]`), extraction vers namespaces i18next. Edge Function `translate-namespace` appelant l'IA Gateway pour générer/mettre à jour les traductions au clic « Traduire ce namespace ».
5. **Emails white-label** : table `association_email_config` (from, reply_to, signature, logo, templates). `send-email` charge la config du tenant.
6. **Licences & quotas** : table `association_subscriptions` (plan, quotas JSONB : members/storage/emails/AI_tokens). Middleware qui bloque les actions dépassant le quota + widget d'usage. Super_admin peut activer/désactiver modules (`association_features`).

---

## Points techniques transverses (tous les lots)

- Chaque nouvelle table publique : `GRANT` explicites + RLS `is_admin_of(association_id)` / `has_association_access` conformément au socle Phase 3.
- Toute écriture caisse passe par `record_caisse_movement` (mémoire projet).
- Toute nouvelle Edge Function utilise `_shared/cors.ts` + `_shared/schemas.ts` (Zod) + auth check.
- Tests : Vitest unitaires par service, tests RLS dans `src/test/security/rls.test.ts`, tests intégration Edge Functions.
- Docs : mettre à jour `docs/CHANGELOG.md`, `docs/DATABASE_SCHEMA.md`, `docs/I18N_THEMING.md`, `docs/ARCHITECTURE.md` à chaque lot.

---

## Ordre & livraison suggérés

```text
Lot A (métier cotisations)      → 3-4 j   [prérequis pour B et C]
Lot B (réunions/bénéficiaires)  → 3-4 j   [dépend A]
Lot C (vues consolidées)        → 2-3 j   [dépend A]
Lot D (fondations tenant)       → 4-5 j   [socle de E et F]
Lot E (branding & thèmes)       → 3-4 j   [dépend D]
Lot F (domaine/i18n/CMS/quotas) → 5-6 j   [dépend D et E]
```

## Question avant de démarrer

Souhaites-tu :
1. **Enchaîner les 6 lots automatiquement** sans revue intermédiaire (comme pour l'audit précédent) ?
2. **Valider chaque lot** avant de passer au suivant ?
3. **Prioriser un sous-ensemble** (ex : Lots A+B+C d'abord — corrections métier — puis D→F ensuite) ?

Par défaut je pars sur l'option 3 (métier d'abord, plateforme ensuite) car les items « Critique » de la page 1 sont les plus urgents et débloquent l'usage courant, tandis que la refonte SaaS de la page 2 est une transformation structurelle qui mérite d'être validée étape par étape.
