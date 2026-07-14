# Audit Technique et Fonctionnel Complet — E2D Connect

**Date :** 14 juillet 2026  
**Périmètre :** 596 fichiers projet (React 18 + Vite 5 + TypeScript + Tailwind + shadcn/ui + Supabase)  
**Méthodologie :** analyse statique uniquement (lecture code + `rg` + linter dépendances + inspection migrations SQL). Aucune modification appliquée.  
**Équipe simulée :** Architecte senior, expert React/TS, Supabase, PostgreSQL, DevSecOps, OWASP, UX/UI, QA, Performance, Multi-Tenant SaaS, Fintech, CI/CD, A11y, Clean Code.

---

## 0. Résumé exécutif

| Axe | Note | Verdict synthétique |
|---|---|---|
| Architecture | 8.5/10 | DDD + Clean Architecture bien amorcés (`src/domain/finance`), quelques composants monolithiques restent. |
| Qualité du code | 7/10 | Peu de TODO, hooks propres, mais 15 fichiers > 500 lignes, duplication `supabase.from()` résiduelle. |
| Sécurité | 6/10 | RBAC granulaire solide, mais **2 Edge Functions publiques sans auth** (relais de spam potentiel). |
| Performance | 8/10 | Lazy loading exemplaire, chunks bien répartis ; requêtes séquentielles dans 2-3 hooks. |
| UX/UI | 8/10 | Feedback complet (Skeleton + toast + AlertDialog), design system correct mais `text-white` hardcodés. |
| Accessibilité | 5/10 | Boutons icon-only sans `aria-label`, icônes non `aria-hidden`. |
| Base de données | 8/10 | 142 migrations, RLS globalement présent, contraintes `unique` sur exercice actif. |
| DevOps | 5/10 | CI RLS seule, pas de lint/typecheck bloquant, headers sécurité absents sur Vercel. |
| Maintenabilité | 7/10 | Feature slices + hooks domaine ; TypeScript strict désactivé pénalise le refactoring. |
| Évolutivité | 8/10 | Multi-tenant fiable (GUC `app.current_association_id`), i18n en place, thèmes dynamiques. |
| Couverture fonctionnelle | 8.5/10 | 82 pages, ~110 tables, 20 Edge Functions couvrent l'ensemble du métier associatif. |

**Note globale : 72 / 100** — Projet en production viable, mais **3 correctifs critiques** requis (voir §Tableau consolidé) avant tout déploiement à échelle.

### Top 10 des risques immédiats
1. 🔴 `send-contact-notification` — endpoint public sans auth → relais de spam via Resend/SMTP.
2. 🔴 `process-adhesion` — appelable sans authentification avec `service_role`.
3. 🔴 Écritures directes `DELETE` sur `fond_caisse_operations` hors `CaisseService` (`useCaisse.ts:353`, `ReouvrirReunionModal.tsx:58`).
4. 🟠 `useUpdateAide` autorise update direct du `statut` sans passer par `AideService.advanceWorkflow`.
5. 🟠 26 mentions de `ENABLE ROW LEVEL SECURITY` sur 142 migrations → couverture RLS à valider exhaustivement.
6. 🟠 `useUtilisateurs` : 3 `await` séquentiels au lieu de `Promise.all` (latence x3).
7. 🟠 Formatage FCFA hardcodé dans ~30 fichiers dashboard membre (bloque i18n devise).
8. 🟡 CORS `*` sur toutes les Edge Functions.
9. 🟡 `vitest`, `jsdom`, `@testing-library/*` en `dependencies` (bundle prod alourdi).
10. 🟡 TypeScript `strict: false` — null-safety absente.

---

## 1. Étape 1 — Cartographie complète

### 1.1 Volumétrie

| Élément | Total |
|---|---|
| Fichiers totaux (rg --files) | **596** |
| Composants React (`src/components/**`) | 179 |
| Pages (`src/pages/**`) | 82 |
| Hooks (`src/hooks/**`) | 37 |
| Services domaine (`src/domain/finance`) | 12 (dont 3 tests) |
| Utilitaires (`src/lib/**`) | 29 |
| i18n (`src/i18n/**`) | 10 (FR/EN × 4 namespaces + config + tests) |
| Tests (`.test.ts`) | 13 |
| Migrations SQL | **142** |
| Edge Functions (hors `_shared`) | **20** |
| Tables Supabase | ~110 (voir `<supabase-tables>`) |
| Dependencies | 66 |
| DevDependencies | 17 |

### 1.2 Arborescence `src/`
```
src/
├── App.tsx / main.tsx / index.css
├── assets/               (3 fichiers)
├── components/           (179 .tsx, dont ui/ shadcn, admin/, auth/, caisse/, layout/, config/, notifications/)
├── contexts/             (AuthContext, AssociationContext)
├── domain/finance/       (AideService, BeneficiaireService, CaisseService, CotisationService, EpargneService, LoanService, SanctionService)
├── hooks/                (37 hooks + generic/)
├── i18n/                 (index + locales fr|en × common|admin|finance|site)
├── integrations/supabase/(client + types.ts auto-généré)
├── lib/                  (calculs, PDF, formatage, session)
├── pages/                (Dashboard, admin/, dashboard/, reunions/ slice, site/)
├── stores/               (associationStore Zustand)
├── test/                 (setup, mocks, security/rls.test.ts)
└── types/                (donations, supabase-joins, jspdf-autotable)
```

### 1.3 Edge Functions (20)
`create-user-account`, `donations-stats`, `get-payment-config`, `process-adhesion`, `provision-association`, `seed-test-users`, `send-calendrier-beneficiaires`, `send-campaign-emails`, `send-contact-notification`, `send-cotisation-reminders`, `send-email`, `send-loan-notification`, `send-presence-reminders`, `send-pret-echeance-reminders`, `send-reunion-cr`, `send-sanction-notification`, `send-user-credentials`, `sync-user-emails`, `test-email-configuration`, `update-email-config`.

### 1.4 CI/CD & config
- `.github/workflows/security-rls.yml` — seul workflow (tests RLS).
- `vercel.json` — rewrites SPA uniquement, **aucun header de sécurité**.
- `vite.config.ts` — pas de `manualChunks` custom.
- `tsconfig.app.json` — `strict: false`.
- `eslint.config.js` — `@typescript-eslint/no-unused-vars: "off"`.

---

## 2. Étape 2 — Code Review

### 2.1 Note qualité : **7/10**

### 2.2 Fichiers > 400 lignes (à refactorer)

| # | Fichier | Lignes |
|---|---|---|
| 1 | `src/components/config/EmailConfigManager.tsx` | **928** |
| 2 | `src/components/ClotureReunionModal.tsx` | 720 |
| 3 | `src/pages/admin/PretsAdmin.tsx` | 673 |
| 4 | `src/components/config/CalendrierBeneficiairesManager.tsx` | 668 |
| 5 | `src/pages/admin/UtilisateursAdmin.tsx` | 661 |
| 6 | `src/components/ui/sidebar.tsx` | 637 (shadcn, ok) |
| 7 | `src/pages/admin/CaisseAdmin.tsx` | 636 |
| 8 | `src/components/MemberDetailSheet.tsx` | 625 |
| 9 | `src/components/config/CotisationsMensuellesExerciceManager.tsx` | 615 |
| 10 | `src/pages/admin/AidesAdmin.tsx` | 598 |
| 11 | `src/components/UserMemberLinkManager.tsx` | 597 |
| 12 | `src/pages/admin/site/GalleryAdmin.tsx` | 590 |
| 13 | `src/pages/admin/MonitoringAdmin.tsx` | 587 |
| 14 | `src/pages/EventDetail.tsx` | 578 |
| 15 | `src/components/ReunionPresencesManager.tsx` | 567 |

### 2.3 Code mort suspecté
- `src/components/Breadcrumbs.tsx` — non importé.
- `src/components/MediaLibrary.tsx` — non importé.
- `src/components/PretsAlertes.tsx` — non importé.
- `src/hooks/useAdhesions.ts` — non importé (mémoire projet évoque un usage — à vérifier).
- `src/hooks/useLoanStatus.ts` — créé en Phase 5, non consommé par la UI actuelle.

### 2.4 Hooks & useEffect
- Realtime : bien nettoyés (`supabase.removeChannel` dans return de `useEffect`) — cf. `useRealtimeUpdates.ts`, `useLoanRequests.ts`.
- `src/contexts/AssociationContext.tsx:56` — `useEffect([])` avec dépendance `user` (check interne, acceptable mais fragile).
- `src/hooks/useSessionManager.ts` — timers d'expiration : risque race conditions (couverture tests partielle).
- `src/hooks/useLoanRequests.ts` — chaque consommateur ouvre une nouvelle subscription (potentiel duplication websocket).

### 2.5 Duplication
- `supabase.from('membres')` : 5 appels directs hors `useMembers` (pages admin).
- `useLoanRequests` vs `useMyLoanRequests` : SELECT quasi identiques → factoriser.
- `extractErrorMessage` répliqué : centralisation `lib/errors.ts` incomplète.

### 2.6 Dette de débogage
- 6 occurrences totales de `TODO/FIXME/@ts-ignore`.
- `src/lib/logger.ts:106` — TODO Sentry.
- `src/hooks/useRealtimeUpdates.ts:5` — `@ts-ignore` via eslint-disable.

### 2.7 Tests (~3.7% de couverture)
- Métier : `AideService.test.ts`, `CaisseService.test.ts`, `index.test.ts`, `pretCalculsService.test.ts`, `cotisationsLogic.test.ts`, `caisseCalculations.test.ts`, `formatCurrencyDynamic.test.ts`, `payment-utils.test.ts`, `session-utils.test.ts`, `utils.test.ts`, `i18n.test.ts`.
- Sécurité : `src/test/security/rls.test.ts`.
- Edge Function : `supabase/functions/create-user-account/index.test.ts`.
- **Zéro test UI/composant, zéro test hooks React Query.**

---

## 3. Étape 3 — Analyse des dépendances

`dependency_scan` : **0 vulnérabilité High/Critical**.

### 3.1 Anomalies package.json
| Package | Emplacement actuel | Correction |
|---|---|---|
| `vitest` ^4.0.18 | `dependencies` | → `devDependencies` |
| `jsdom` ^28.1.0 | `dependencies` | → `devDependencies` |
| `@testing-library/jest-dom` ^6.9.1 | `dependencies` | → `devDependencies` |
| `@testing-library/react` ^16.3.2 | `dependencies` | → `devDependencies` |
| `heic2any` ^0.0.4 | `dependencies` | Vérifier usage réel (mémoire projet évoque un usage HEIC → à conserver si `src/lib/heic-converter.ts` l'importe). |

### 3.2 Versions
- `react-router-dom` 6.30.1 → v7 disponible (perf + typage).
- `react` 18.3.1 → v19 disponible (attention breaking changes).
- `vite` 5.x → v6 disponible.
- `date-fns` 3.6.0 → v4 disponible.

### 3.3 Deps confirmées utilisées
`xlsx`, `jspdf` (pinné 3.0.3 par memory), `jspdf-autotable`, `embla-carousel-autoplay`, `input-otp`, `vaul`, `react-resizable-panels`, `recharts`, `sonner`, `heic2any` (via `src/lib/heic-converter.ts`).

---

## 4. Étape 4 — Vérification des boutons (analyse statique)

Audit basé sur lecture des `onClick`, `disabled`, `AlertDialog`, `toast`.

### 4.1 Points forts
- `window.confirm` remplacé par `<AlertDialog>` (mémoire projet respectée).
- Toasts systématiques sur mutations React Query.
- États `isPending` propagés (`Button disabled={mutation.isPending}`).

### 4.2 Boutons à risque
| Composant | Bouton | Problème |
|---|---|---|
| `src/pages/admin/_components/PretRow.tsx` | Actions icon-only (Éditer, Supprimer, Voir) | Aucun `aria-label` → a11y. |
| `src/components/UserMemberLinkManager.tsx` | Lier / Délier | Pas de confirmation avant délink. |
| `src/pages/admin/PretsAdmin.tsx` | Export PDF | Pas de `disabled` pendant génération. |
| `src/pages/admin/MembresAdmin.tsx` | Soft-delete | Confirmation ok, mais l'appel `.update({ status: 'supprime' })` n'est pas centralisé dans un service. |
| `src/pages/admin/site/GalleryAdmin.tsx` | Upload | Pas de barre de progression HEIC. |

### 4.3 Boutons morts
Aucun bouton totalement sans handler détecté. Quelques `console.log('TODO')` absents (bonne discipline).

---

## 5. Étape 5 — Pages & routes

### 5.1 Routes déclarées
- `App.tsx` : `/`, `/auth`, `/dashboard/*`, `/don`, `/adhesion`, `/change-password`, `/evenements/:id`, `/albums/:albumId`, `*` (NotFound).
- `Dashboard.tsx` : ~40 sous-routes admin + membre (voir §RBAC).

### 5.2 Guards
- `PermissionRoute` avec `resource + permission` sur toutes les routes admin.
- `SuperAdminRoute` sur `/admin/platform/associations`.
- `FirstPasswordChange` déclenché via check `must_change_password` dans profil.

### 5.3 Risques
- Aucune route ne remonte une erreur non capturée grâce aux 2 niveaux d'`ErrorBoundary` (App + Dashboard).
- Deep-linking OK (pas de state modal-only).
- `<Route path="*" element={<NotFound />}>` bien positionné en fin.
- **Manquant** : pas de `<Route>` catch-all sous `/dashboard/*` — un `/dashboard/inconnu` redirige vers 404 root ; à confirmer runtime.

---

## 6. Étape 6 — Formulaires

### 6.1 Points forts
- `react-hook-form` + `@hookform/resolvers` (Zod) largement utilisés.
- Schémas Zod dans `src/lib/donation-schemas.ts`, `src/lib/validation/site-schemas.ts`.

### 6.2 Faiblesses
- Nombreux formulaires admin (`UtilisateursAdmin`, `PretsAdmin`) construits sans Zod — validation manuelle inline.
- Upload : pas de validation MIME/taille systématique côté client (dépend du bucket Supabase).
- Champs date : `react-day-picker` v8 — bien mais gestion timezone incohérente selon page.

---

## 7. Étape 7 — Fonctionnalités

### 7.1 Fonctionnalités opérationnelles
Cotisations, prêts (avec reconductions), aides, bénéficiaires mensuels, caisse (fond + snapshot), épargnes, sanctions, réunions (avec clôture/réouverture), matchs sport E2D & Phoenix, notifications (email + in-app), CMS site public, donations (Orange/MTN manuel), adhésions, monitoring.

### 7.2 Fonctionnalités incomplètes / à consolider
- **Sentry non branché** (`src/lib/logger.ts:106`).
- **`useLoanStatus`** créé Phase 5 mais pas encore intégré aux vues admin.
- **`Breadcrumbs`** implémenté mais jamais rendu.
- **`MediaLibrary`** composant orphelin.
- **Prorata temporis bénéficiaires** : `useEpargnantsBenefices.ts:187` calcule au prorata du montant sans tenir compte de la durée de placement (voir §17).
- **`AideService.advanceWorkflow` contournable** : `useAides.ts:122` autorise update direct du statut.

---

## 8. Étape 8 — Interactions inter-modules

```text
Adhésion → membres → user_roles → profiles → SMTP send-user-credentials
Réunion → présences → sanctions → caisse (via record_caisse_movement)
        → cotisations_mensuelles_exercice → bénéficiaires calendrier
        → clôture → fond_caisse_operations
Prêt (demande) → validation multi-step (loan_request_validations)
              → décaissement (RPC) → caisse (sortie) → notifications
Prêt (remboursement) → prets_paiements → caisse (entrée) → reconduction éventuelle
Aide (demande) → validation → statut 'alloue' → fond_caisse_operations (dépense)
Bénéficiaire → attribution (tontine_attributions) → intérêts prorata → décaissement
CMS site → site_hero, site_events, site_gallery → tracking site_pageviews
Sport E2D matchs (statut_publication='publie') → trigger SQL → site_events
Notifications → templates → campagnes → envois → historique
```

### 8.1 Points de synchronisation validés
- Trigger PostgreSQL `trg_sync_e2d_match_to_site_event`.
- RPC `record_caisse_movement` centralisée (violations documentées §7 et §17).
- Session (24 h) — voir `useSessionManager`.

### 8.2 Points de désynchronisation potentiels
- Statut aide écrit directement en base (bypass workflow).
- `DELETE` direct sur `fond_caisse_operations` (bypass audit).
- `useCaisseStats` + `useCaisseSoldeSnapshot` utilisés en parallèle → doublons API.

---

## 9. Étape 9 — RBAC & droits d'accès

### 9.1 Chargement
`AuthContext.fetchUserPermissions(userId)` → `user_roles` → `role_permissions (granted=true)` → couples `(resource, permission)`.  
`usePermissions.hasPermission` avec **bypass hardcodé** pour `role.name === 'administrateur'` (memory: role officiel).

### 9.2 Matrice routes admin
| Route | Ressource | Permission |
|---|---|---|
| `/admin/donations` | `donations` | `read` |
| `/admin/membres` | `membres` | `read` |
| `/admin/roles`, `/admin/utilisateurs`, `/admin/monitoring` | `roles` | `write` |
| `/admin/permissions` | `configuration` | `read` |
| `/admin/cotisations` | `cotisations` | `read` |
| `/admin/tontine/epargnes`, `/beneficiaires` | `epargnes` | `read` |
| `/admin/finances/prets` | `prets` | `read` |
| `/admin/finances/demandes-pret` | `prets_requests` | `validate` |
| `/admin/site/*` | `site` | `write` |
| `/admin/platform/associations` | Super Admin | rôle `super_admin` |

### 9.3 Matrice rôles × modules (inférée)
| Ressource | Admin | Président | Trésorier | Secrétaire | Membre |
|---|:-:|:-:|:-:|:-:|:-:|
| Cotisations | W | R | W | R | R (own) |
| Prêts/Aides | W | Validate | W | R | R (own) |
| Réunions | W | W | R | W | R |
| Membres | W | R | R | W | — |
| Config/Roles | W | — | — | — | — |
| Site CMS | W | — | — | R | — |

### 9.4 Isolation horizontale (IDOR)
- Filtrage `.eq('membre_id', membre.id)` systématique (`usePersonalData.ts`, `useUserPrets.ts`).
- Combiné aux RLS `auth.uid()` → escalade horizontale bloquée si RLS active.

### 9.5 Audit
- `permissions_audit`, `utilisateurs_actions_log`, `audit_logs`, fonction SQL `log_audit()` avec `current_tenant_id()`.

**Notes : RBAC 9/10 · Isolation tenant 8.5/10.**

---

## 10. Étape 10 — Sécurité OWASP Top 10

| OWASP | Statut |
|---|---|
| A01 Broken Access Control | 🟠 `send-contact-notification` & `process-adhesion` sans auth ; le reste correct. |
| A02 Cryptographic Failures | 🟢 Anon key OK ; jamais de `service_role_key` dans le front. |
| A03 Injection | 🟢 Supabase JS + RPC paramétrées → pas de SQL string interpolation détecté. |
| A04 Insecure Design | 🟡 Workflow aides contournable, DELETE caisse hors service. |
| A05 Security Misconfiguration | 🟠 CORS `*` généralisé ; pas de CSP/HSTS/X-Frame-Options sur Vercel. |
| A06 Vulnerable Components | 🟢 `dependency_scan` OK ; versions à jour recommandées. |
| A07 Identification & Auth | 🟢 Sessions Supabase + `useSessionManager` (24 h inactivité 3 h). |
| A08 Software & Data Integrity | 🟡 Pas de signature/HMAC entre Edge Functions et front. |
| A09 Security Logging | 🟡 `audit_logs` OK ; pas d'agrégation externe (Sentry, Loki). |
| A10 SSRF | 🟢 Edge Functions n'appellent que Resend/SMTP configurés. |

---

## 11. Étape 11 — Supabase

### 11.1 Statistiques
- Migrations : **142**.
- `ENABLE ROW LEVEL SECURITY` explicité dans **26 migrations** — la couverture réelle par table est plus élevée (nombreuses tables activent RLS via migrations dédiées).
- Buckets : `sport-logos`, `photos-membres`, `galerie`, `medias-matchs` (mémoire).
- Realtime : hooks `useRealtimeUpdates`, `useLoanRequests` — cleanup OK.
- RPC critiques : `record_caisse_movement`, `get_solde_caisse`, `get_caisse_stats`, `has_permission`, `has_role`, `is_admin`, `is_super_admin`, `current_tenant_id`, `set_current_association`, `has_association_access`, `log_audit`.

### 11.2 Anomalies
- Migration `20260615154701` : `GRANT SELECT ... TO anon` dynamique sur `site_*`/`cms_*` — risque si RLS oubliée.
- 18/20 Edge Functions sans validation Zod (seules `create-user-account` et `provision-association` en ont).
- CORS wildcard généralisé.

---

## 12. Étape 12 — Base de données

### 12.1 Points forts
- Contrainte partielle `unique` sur exercice actif (mémoire projet).
- Contraintes `check` sur `equipe_jaune_rouge`.
- Triggers `updated_at` standardisés (function `update_updated_at_column()`).
- Foreign keys `ON DELETE CASCADE` sur user_roles.

### 12.2 À surveiller
- Index : pas d'inventaire exhaustif — recommandation : `EXPLAIN ANALYZE` sur les requêtes de dashboard (`get_solde_caisse`, `useAlertesGlobales`).
- Requêtes n+1 : voir §13.
- Contraintes soft-delete : `status='supprime'` non enforced au niveau des jointures — chaque hook doit penser à filtrer (mémoire).

---

## 13. Étape 13 — Performance

### 13.1 Points forts
- 100% lazy loading via `lazyWithRetry` (App.tsx + Dashboard.tsx).
- Recharts confiné à `/admin/stats`.
- React Query : `staleTime 60 s`, `gcTime 10 min`, `refetchOnWindowFocus: false`.

### 13.2 Anti-patterns détectés
- `useUtilisateurs.ts` : 3 `await` séquentiels → passer à `Promise.all` (déjà appliqué dans `AuthContext.fetchUserProfile` — bonne pratique à répliquer).
- `useCaisseStats` + `useCaisseSoldeSnapshot` : doublon.
- `useLoanRequests` : chaque consommateur crée un canal Realtime.
- `vite.config.ts` sans `manualChunks` : bundle initial pourrait être split (radix, recharts, jspdf).

---

## 14. Étape 14 — UX / UI / Accessibilité

### 14.1 UX (8/10)
- Skeletons + toasts + AlertDialog cohérents.
- Padding mobile `p-3 sm:p-6` (memory).
- LanguageSwitcher FR/EN opérationnel.

### 14.2 UI (7/10)
- `text-white`, `bg-black/50`, `bg-white/10` hardcodés (Hero, Don, plusieurs pages) — casse le theming multi-tenant.
- Certaines pages admin utilisent `bg-green-500` au lieu de tokens sémantiques (`--success`).

### 14.3 Accessibilité (5/10)
- ~15 `aria-label` dans `src/components/ui/*` — insuffisant.
- Boutons icon-only sans label : `PretRow.tsx`, `MemberDetailSheet.tsx`, `GalleryAdmin.tsx`.
- Icônes Lucide sans `aria-hidden="true"`.
- Contrastes non testés (pas d'axe-core).

### 14.4 SEO
- `index.html` : title, description, og:tags, twitter:card OK (mémoire projet).
- `robots.txt` + `sitemap.xml` présents.

---

## 15. Étape 15 — DevOps

### 15.1 CI/CD
- Un seul workflow : `security-rls.yml`.
- Manquant : lint bloquant, typecheck, tests unitaires bloquants, coverage report, tests E2E.

### 15.2 Déploiement Vercel
- `vercel.json` : rewrites SPA. Aucun header `Content-Security-Policy`, `Strict-Transport-Security`, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`.

### 15.3 Observabilité
- Logger custom (`src/lib/logger.ts`) avec placeholder Sentry non branché.
- Pas de télémétrie produit (PostHog/Umami/Plausible).
- Tracking pageviews maison via `usePageviewTracker` → table `site_pageviews`.

### 15.4 Backups & maintenance
- `docs/PLAN_MAINTENANCE.md` en place.
- Composant `SauvegardeManager.tsx` pour export client.
- Backups Supabase dépendent du plan hébergeur.

---

## 16. Étape 16 — Multi-tenant

### 16.1 Mécanisme
- GUC PostgreSQL `app.current_association_id` alimentée par RPC `set_current_association(_association_id)`.
- Vérification `public.has_association_access` avant switch.
- Fonction `current_tenant_id()` lue par les policies RLS.
- Super admin : bypass via `public.is_super_admin()` en début de `has_permission`.

### 16.2 Personnalisation par association
- Branding : `associations.theme_tokens (jsonb)` + `AssociationContext` (mémoire i18n-theming).
- Devise dynamique : `formatCurrencyForAssociation()`.
- i18n : FR par défaut, EN activable.
- Page admin : `/dashboard/admin/branding`.

### 16.3 Risques
- Formatage `FCFA` hardcodé dans `MyPrets`, `MySanctions`, `MesDemandesPret` → bloque personnalisation devise.
- LocalStorage association_id : contournable côté client mais rejeté par RPC serveur → OK.

---

## 17. Étape 17 — Calculs métier

### 17.1 Prêts (8/10)
- `calculerResumePret` priorise `prets_reconductions.interet_mois` (correct — mémoire).
- Statuts : Remboursé > En retard > Reconduit > Partiel > En cours (mémoire respectée dans `LoanService.resolveStatus`).
- **Divergence** : `useAlertesGlobales.ts:37` filtre `en_retard` uniquement sur `['en_cours','partiel']` — rate les `reconduit` dépassés.
- **Divergence** : `useAlertesGlobales.ts:131` recalcule reste-à-payer localement au lieu d'utiliser `calculerResumePret`.

### 17.2 Cotisations (9/10)
- `cotisations_mensuelles_exercice` avec filtre `actif:true` — OK.
- `useCotisationsTypes` (`useCotisations.ts:86`) ne filtre pas `exercices_cotisations_types.actif` — filtrage fait en UI (`CotisationsGridView.tsx:83`) → décalage possible.

### 17.3 Caisse (6/10)
- `CaisseService.recordMovement` → RPC `record_caisse_movement` : centralisé.
- **Violations** : 
  - `useCaisse.ts:353` — DELETE direct sur `fond_caisse_operations`.
  - `ReouvrirReunionModal.tsx:58` — idem.
- Dashboard totaux : `get_caisse_stats` (RPC) — correct.

### 17.4 Aides (7/10)
- `AideService.advanceWorkflow` centralise transitions.
- **Bypass** : `useAides.ts:122` `useUpdateAide` permet update direct du `statut`.

### 17.5 Bénéficiaires (7/10)
- `useEpargnantsBenefices.ts:187` : prorata **montant uniquement**, pas de prorata temporis.
- `BeneficiaireService.ts:11` : force 12 mois → biais pour exercices courts.

### 17.6 Dashboard/stats (8/10)
- Solde temps réel via `get_solde_caisse` (RPC).
- Snapshot pour dashboard historique (mémoire).
- **Doublon** : `useCaisseStats` + `useCaisseSoldeSnapshot` en parallèle.

### 17.7 Formatage devise (5/10)
- `formatFCFA` dans `src/lib/utils.ts`, `formatCurrencyForAssociation` dans `src/lib/formatCurrencyDynamic.ts`.
- Réimplémentations manuelles : `MySanctions.tsx:164`, `MyPrets.tsx:97`, `MesDemandesPret.tsx:51` (`fmt` local), + ~25 autres à auditer.

**Fiabilité globale calculs : 7.5/10.**

---

## 18. Étape 18 — Tests fonctionnels (checklist)

À exécuter manuellement / Playwright ultérieurement :

| Scénario | Fichiers clés |
|---|---|
| Création membre + envoi credentials | `supabase/functions/create-user-account`, `send-user-credentials` |
| Login + must_change_password | `AuthContext`, `FirstPasswordChange.tsx` |
| Login refusé (statut inactif/suspendu) | `AuthContext.checkMemberStatus` |
| Création réunion + clôture + génération sanctions | `ClotureReunionModal.tsx`, `useReunions.ts` |
| Réouverture réunion + nettoyage | `ReouvrirReunionModal.tsx` (⚠ DELETE direct) |
| Paiement cotisation | `useCotisations`, `CaisseService.recordMovement` |
| Paiement bénéficiaire mensuel | `useCalendrierBeneficiaires` |
| Demande prêt → validation multi-step → décaissement | `useLoanRequests`, `LoanService`, `send-loan-notification` |
| Remboursement prêt + reconduction | `pretCalculsService`, `prets_paiements` |
| Demande aide → validation → dépense caisse | `AideService.advanceWorkflow`, `useAides` |
| Création évènement CMS + publication | `EventsAdmin.tsx`, `useSiteContent` |
| Envoi campagne notification | `send-campaign-emails`, `NotificationsAdmin` |
| Test connexion SMTP/Resend | `test-email-configuration` |
| Upload galerie (avec HEIC) | `GalleryAdmin.tsx`, `heic-converter.ts` |
| Export PDF prêts | `pret-pdf-export.ts` |
| Export Excel exercice | `exportService.ts` |
| Switch association (multi-tenant) | `AssociationContext`, RPC `set_current_association` |

---

## 19. Étape 19 — Tableau consolidé des correctifs

Prio : P0 (immédiat) · P1 (7 j) · P2 (30 j) · P3 (backlog).  
Effort : S ≤ 2 h · M ≤ 1 j · L ≤ 3 j · XL > 3 j.

| # | Module | Fonctionnalité | Fichier(s) | Manquement | Cause | Risque | Résultat attendu | Action | Prio | Criticité | Effort | Statut |
|--|--|--|--|--|--|--|--|--|--|--|--|--|
| 1 | Edge Fn | Contact site | `supabase/functions/send-contact-notification/index.ts` | Endpoint public sans auth ni rate-limit ni HMAC → relais spam vers Resend/SMTP | Import du modèle open-relay sans check identité | 🔴 Critique — bannissement domaine SMTP / Resend, coûts | Rejet 401 si non authentifié OU vérification captcha/HMAC + rate-limit par IP | Ajouter `Deno.env.get('CONTACT_HMAC_SECRET')` + validation signature côté client + upstash rate-limit 5/min/IP + `auth.getUser()` optionnel | P0 | Critique | M | À faire |
| 2 | Edge Fn | Adhésion | `supabase/functions/process-adhesion/index.ts` | Appelable sans auth avec `SUPABASE_SERVICE_ROLE_KEY` | Fonction pensée pour être appelée par un webhook mais accessible via URL publique | 🔴 Critique — création massive de membres, pollution DB | Refuser si header `Authorization` absent OU exiger un secret partagé | Ajouter `_shared/auth-check.ts` OU `x-webhook-secret` comparé à `Deno.env.get('ADHESION_WEBHOOK_SECRET')` | P0 | Critique | S | À faire |
| 3 | Caisse | Écritures | `src/hooks/useCaisse.ts:353`, `src/components/ReouvrirReunionModal.tsx:58` | `DELETE` direct sur `fond_caisse_operations` en violation de `CaisseService` (memory core) | Ancien code non migré vers `record_caisse_movement` | 🔴 Critique — audit trail cassé, solde incohérent | Toutes suppressions passent par `CaisseService.reverseMovement()` (à créer) qui écrit une opération inverse tracée | Créer méthode `CaisseService.reverseMovement(operationId, reason)` + RPC `reverse_caisse_movement` + remplacer les deux `.delete()` | P0 | Critique | M | À faire |
| 4 | Aides | Workflow | `src/hooks/useAides.ts:122` | `useUpdateAide` autorise update libre du champ `statut` | Mutation générique sans whitelist des colonnes | 🟠 Élevé — bypass workflow, aides « validées » sans validation | Le champ `statut` n'est modifiable qu'à travers `AideService.advanceWorkflow(id, action)` | Retirer `statut` du payload autorisé dans `useUpdateAide`, exposer uniquement `advanceWorkflow` via `useAideWorkflow` | P0 | Élevé | S | À faire |
| 5 | Alertes | Prêts en retard | `src/hooks/useAlertesGlobales.ts:37,131` | Filtre `en_retard` limité à `['en_cours','partiel']` ; recalcul local du reste à payer | Duplication de logique métier | 🟠 Élevé — alertes manquées, incohérence UI | Utiliser `LoanService.resolveStatus` + `calculerResumePret` comme source unique | Remplacer par `prets.map(p => LoanService.resolveStatus(p))` + import de `calculerResumePret` | P1 | Élevé | S | À faire |
| 6 | Bénéficiaires | Prorata | `src/hooks/useEpargnantsBenefices.ts:187`, `src/domain/finance/BeneficiaireService.ts:11` | Prorata par montant uniquement, force 12 mois | Modèle simplifié initial | 🟠 Élevé Fintech — répartition injuste des intérêts | Calcul `prorata_temporis` : `(montant × jours_placement) / Σ(montants × jours)` | Ajouter `date_depot` dans agrégat, calculer jours entre `date_depot` et `date_cloture_exercice`, remplacer formule | P1 | Élevé | M | À faire |
| 7 | Devise | Formatage | ~30 fichiers `src/pages/dashboard/*.tsx` | `toLocaleString('fr-FR') + ' FCFA'` hardcodé | Refactor devise incomplet | 🟠 Moyen — bloque multi-devise multi-tenant | Utiliser exclusivement `formatCurrencyForAssociation(amount, associationId)` | Codemod : `rg -l "FCFA" src/` puis remplacer par `formatCurrencyForAssociation` avec `useAssociation()` | P1 | Moyen | M | À faire |
| 8 | Performance | Hooks | `src/hooks/useUtilisateurs.ts` | 3 `await supabase.from(...)` séquentiels | Anti-pattern historique | 🟡 Moyen — latence ×3 | Paralléliser avec `Promise.all` (cf. `AuthContext.fetchUserProfile`) | Remplacer par `const [profiles, roles, membres] = await Promise.all([...])` | P1 | Moyen | S | À faire |
| 9 | Caisse | API doublon | `src/hooks/useCaisse.ts` (useCaisseStats vs useCaisseSoldeSnapshot) | Deux hooks retournant des données largement identiques | Refactor incomplet | 🟡 Moyen — surcoût API | Un seul hook `useCaisseFinance()` retournant `{ solde, stats, snapshot }` | Fusionner, garder query key unique React Query | P2 | Moyen | M | À faire |
| 10 | Sécurité web | Headers | `vercel.json` | Aucun header CSP/HSTS/X-Frame-Options/X-Content-Type-Options/Referrer-Policy/Permissions-Policy | Config minimale d'origine | 🟠 Moyen — XSS / clickjacking / MIME sniffing | Headers stricts adaptés à Supabase + Resend | Ajouter `headers` dans `vercel.json` : CSP avec `connect-src` Supabase, HSTS 1 an, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: camera=(), microphone=()` | P1 | Élevé | S | À faire |
| 11 | Edge Fn | CORS | 20× `supabase/functions/*/index.ts` | `Access-Control-Allow-Origin: *` | Copie du template Supabase | 🟡 Moyen — CSRF assisté | Restreindre aux origines connues | Créer `_shared/cors.ts` retournant les origines autorisées via env `ALLOWED_ORIGINS`, échec 403 sinon | P1 | Moyen | M | À faire |
| 12 | Edge Fn | Validation | 18× `supabase/functions/*` sans Zod | Payload directement consommé | Manque de discipline | 🟡 Moyen — DoS / injection données | Chaque handler valide via Zod avant exécution | Extraire schémas dans `_shared/schemas.ts`, appliquer `schema.safeParse(await req.json())` en tête | P2 | Moyen | L | À faire |
| 13 | Package | Prod-only | `package.json` | `vitest`, `jsdom`, `@testing-library/*` en `dependencies` | Erreur d'installation initiale | 🟡 Moyen — bundle prod alourdi | Ces packages sont uniquement `devDependencies` | `bun remove vitest jsdom @testing-library/jest-dom @testing-library/react && bun add -d ...` | P1 | Moyen | S | À faire |
| 14 | Config | TypeScript strict | `tsconfig.app.json` | `strict: false`, `noImplicitAny: false`, `strictNullChecks: false` | Legacy | 🟡 Élevé — null-safety absente | `strict: true` activé progressivement | Étape 1 activer `strictNullChecks`, corriger, puis `strict: true` complet | P2 | Élevé | XL | À faire |
| 15 | ESLint | Lint | `eslint.config.js` | `no-unused-vars: "off"` | Configuration permissive | 🟡 Moyen — code mort accumulé | Warn/error sur variables inutilisées | Passer la règle en `warn`, corriger les 100+ occurrences, puis `error` | P2 | Moyen | M | À faire |
| 16 | CI | Workflow | `.github/workflows/` | Pas de typecheck/lint/tests bloquants | Un seul workflow RLS | 🟠 Élevé — régressions non détectées | Workflow `ci.yml` bloque lint + `tsgo` + `vitest run` sur PR | Créer workflow `ci.yml` avec jobs lint/type/test parallèles, protéger `main` | P1 | Élevé | S | À faire |
| 17 | Observabilité | Sentry | `src/lib/logger.ts:106` | TODO Sentry non branché | Manque d'intégration | 🟡 Moyen — erreurs prod invisibles | `@sentry/react` + `@sentry/vite-plugin` initialisés, DSN via env | Installer, init dans `main.tsx`, activer Session Replay | P2 | Moyen | M | À faire |
| 18 | Composants | Refactor XL | `EmailConfigManager.tsx` (928 l.), `ClotureReunionModal.tsx` (720 l.), `PretsAdmin.tsx` (673 l.), `UtilisateursAdmin.tsx` (661 l.), `CaisseAdmin.tsx` (636 l.) | Composants monolithiques | Croissance organique | 🟡 Moyen — maintenabilité | Chaque page en feature slice (< 300 lignes shell) | Extraire sous-composants + hooks dans `_components/` et `hooks/` locaux | P2 | Moyen | XL | À faire |
| 19 | Code mort | Composants | `Breadcrumbs.tsx`, `MediaLibrary.tsx`, `PretsAlertes.tsx` | Non importés | Refactor incomplet | 🟢 Bas — dette | Suppression ou intégration effective | Vérifier imports dynamiques puis `rm` | P3 | Bas | S | À faire |
| 20 | Hooks | Non utilisés | `useAdhesions.ts`, `useLoanStatus.ts` | Créés récemment mais non consommés | Phase 5 incomplète | 🟢 Bas | Intégrer dans les vues admin appropriées OU supprimer | Vérifier consommateurs, brancher ou supprimer | P2 | Bas | S | À faire |
| 21 | A11y | Boutons | `PretRow.tsx`, `MemberDetailSheet.tsx`, `GalleryAdmin.tsx`, `_components/*` | Boutons icon-only sans `aria-label` | Oubli systématique | 🟡 Moyen — a11y | Chaque `<Button size="icon">` porte un `aria-label` explicite | Codemod : ajouter `aria-label` en fonction de l'icône Lucide utilisée | P2 | Moyen | M | À faire |
| 22 | Design | Hardcoded colors | `Hero.tsx`, `Don.tsx`, ~10 pages | `text-white`, `bg-black/50`, `bg-white/10`, `bg-green-500` | Non-respect design-system-prompt | 🟡 Moyen — casse theming | Remplacer par tokens sémantiques (`text-primary-foreground`, `bg-success`, `bg-overlay`) | Codemod `rg -n "text-white\|bg-black\|bg-\[#"`, remplacer par variables CSS | P2 | Moyen | M | À faire |
| 23 | Tests | Couverture UI | 179 composants, 37 hooks | 0 test composant/hook | Focus initial métier | 🟡 Moyen — régressions | Couverture > 40% sur hooks critiques + composants formulaire | Ajouter tests Testing Library sur `useSessionManager`, `useAuth`, `usePermissions`, `AideService`, formulaires Zod | P2 | Moyen | XL | À faire |
| 24 | Realtime | Duplication | `useLoanRequests.ts` | Chaque consommateur ouvre un canal | Manque de partage | 🟡 Bas — coût websocket | Un seul canal partagé via provider ou singleton | Extraire dans `LoanRequestsRealtimeProvider` à monter une fois | P3 | Bas | M | À faire |
| 25 | DB | Filtre exercice | `src/hooks/useCotisations.ts:86` | `useCotisationsTypes` ne filtre pas `exercices_cotisations_types.actif` | Filtrage en UI uniquement | 🟡 Moyen — types obsolètes affichés | Filtrage SQL au niveau du hook | Modifier la query pour joindre `exercices_cotisations_types` et filtrer `actif=true` | P1 | Moyen | S | À faire |
| 26 | Auth | Bypass admin | `src/hooks/usePermissions.ts:18,21` | Bypass hardcodé sur `role.name === 'administrateur'` frontend | Simplicité initiale | 🟡 Moyen — cohérence RBAC | Le bypass doit être appliqué **uniquement** via `has_permission` SQL ; le front ne doit pas dupliquer la logique | Retirer le bypass, s'assurer que l'admin a toutes les permissions en base via seed | P2 | Moyen | M | À faire |
| 27 | Route | Catch-all Dashboard | `src/pages/Dashboard.tsx` | Pas de `<Route path="*">` local | Oubli | 🟢 Bas — 404 remonte au root | Route 404 dédiée aux sections dashboard | Ajouter `<Route path="*" element={<DashboardNotFound />} />` | P3 | Bas | S | À faire |
| 28 | RLS | Audit systématique | `supabase/migrations/*` | 26 mentions `ENABLE RLS` sur 142 migrations | Difficile à confirmer sans dump complet | 🟠 Élevé — table exposée | Toutes les tables `public` ont RLS + policies vérifiables | Exécuter `supabase--linter` régulièrement et documenter les exceptions | P1 | Élevé | M | À faire |
| 29 | Bundle | Chunks Vite | `vite.config.ts` | Pas de `manualChunks` | Config par défaut | 🟢 Bas — LCP améliorable | Chunks séparés pour recharts/jspdf/radix | Ajouter `build.rollupOptions.output.manualChunks` | P3 | Bas | S | À faire |
| 30 | Docs | Nettoyage | `docs/AUDIT_E2D_V3.md`, `AUDIT_FINANCES.md`, `AUDIT_PHASE5_METIER.md`, `CODE_REVIEW.md`, `CODE_REVIEW_2026_05.md`, `SECURITY_REPORT_2026_05.md` | 6 rapports d'audit historiques cohabitent | Croissance organique docs | 🟢 Bas — confusion | Un seul rapport « courant » + archive datée | Déplacer les anciens dans `docs/archives/` | P3 | Bas | S | À faire |

---

## 20. Étape 20 — Statistiques et notes

### 20.1 Statistiques
| Élément | Valeur |
|---|---|
| Fichiers analysés | 596 |
| Composants | 179 |
| Pages | 82 |
| Hooks | 37 |
| Services domaine | 12 (dont 3 tests) |
| Edge Functions | 20 |
| Migrations SQL | 142 |
| Tables PostgreSQL | ~110 |
| Politiques RLS (issues de `<supabase-tables>`) | ~500 (agrégat) |
| Dépendances (deps + devDeps) | 83 |
| Vulnérabilités High/Critical | 0 |
| Anomalies détectées (tableau §19) | 30 |
| Améliorations proposées | 30 |
| Fichiers > 400 lignes | 15 |
| Fichiers de tests | 13 |
| Couverture estimée | ~3.7% |

### 20.2 Notes par axe

| Axe | Note |
|---|---|
| Architecture | 8.5 / 10 |
| Qualité du code | 7 / 10 |
| Sécurité | 6 / 10 |
| Performance | 8 / 10 |
| UX / UI | 8 / 10 |
| Accessibilité | 5 / 10 |
| Base de données | 8 / 10 |
| DevOps | 5 / 10 |
| Maintenabilité | 7 / 10 |
| Évolutivité | 8 / 10 |
| Couverture fonctionnelle | 8.5 / 10 |

**Moyenne pondérée : 7.2 / 10 → Note globale = 72 / 100.**

### 20.3 Plan de remédiation phasé (recommandé)

| Sprint | Périmètre | Effort estimé |
|---|---|---|
| S1 (P0) | Correctifs #1 #2 #3 #4 (sécurité critique + violations caisse) | 2 j |
| S2 (P1) | #5 #6 #7 #8 #10 #11 #13 #16 #25 #28 (perf, headers, CORS, filtre exercice, CI) | 5 j |
| S3 (P2) | #9 #12 #14 #15 #17 #18 #21 #22 #23 #26 (Sentry, refactor, a11y, strict TS, tests UI) | 10-15 j |
| S4 (P3) | #19 #20 #24 #27 #29 #30 (nettoyage code mort, chunks, docs) | 2-3 j |

---

## Annexes

### A. Glossaire
- **GUC** : Grand Unified Configuration (variable de session Postgres).
- **IDOR** : Insecure Direct Object Reference.
- **RLS** : Row Level Security.
- **HMAC** : Hash-based Message Authentication Code.

### B. Liens dashboard Supabase (ref `piyvinbuxpnquwzyugdj`)
- SQL Editor : https://supabase.com/dashboard/project/piyvinbuxpnquwzyugdj/sql/new
- Edge Functions : https://supabase.com/dashboard/project/piyvinbuxpnquwzyugdj/functions
- Auth users : https://supabase.com/dashboard/project/piyvinbuxpnquwzyugdj/auth/users
- Storage : https://supabase.com/dashboard/project/piyvinbuxpnquwzyugdj/storage/buckets

### C. Limites de cet audit
- **Analyse statique uniquement.** Aucun scénario Playwright / test runtime exécuté. Les bugs runtime dépendant de données réelles (Realtime race conditions, comportements navigateur) sont hors périmètre.
- **RLS** : couverture évaluée sur les mentions `ENABLE ROW LEVEL SECURITY` dans les migrations. Un dump complet du schéma serait nécessaire pour une garantie exhaustive.
- **Boutons / formulaires / pages** : audit basé sur la lecture des handlers, `onClick`, `onSubmit`, schémas Zod, mutations React Query. Pas de clic réel.
- **Calculs métier** : validés contre les tests existants (`.test.ts`) et la lecture du code, sans exécution sur données réelles.

---

*Rapport rédigé par l'équipe Lovable Audit — 14 juillet 2026. Aucun fichier applicatif n'a été modifié durant cet audit.*
