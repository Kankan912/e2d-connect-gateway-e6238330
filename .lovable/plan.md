
# Plan directeur — E2D → Plateforme SaaS Multi-Associations

Roadmap séquencée en **8 phases livrables**, chacune indépendamment testable et déployable. Rien ne sera codé avant validation phase par phase.

## Principes transverses (appliqués à toutes les phases)

- **Zéro valeur métier codée en dur** → tout paramètre passe par une table de config lisible depuis l'admin.
- **Une seule source de vérité** pour tout calcul financier → PostgreSQL (`SECURITY DEFINER` + RPC), jamais recalculé côté front.
- **Traçabilité systématique** → chaque écriture financière ou de config produit une ligne `audit_logs`.
- **Feature flags** dans `configurations` pour déployer sans casser E2D en production.
- **Migrations réversibles** (`up` + note de rollback) et testées sur snapshot avant merge.

---

## Phase 1 — Stabilisation & correctifs bloquants (Sprint 1)
Objectif : plus aucune page blanche, plus aucune erreur "non-2xx", emails opérationnels.

- **Diagnostic Resend/SMTP** : lecture logs `send-email`, `test-email-configuration`, vérification `RESEND_API_KEY` (rotation si besoin via connector Resend), audit `smtp_config`. Décision documentée : Resend gateway Lovable **ou** SMTP natif.
- **Erreurs edge functions normalisées** : format `{ code, message, details }`, mapping FR côté UI (`EMAIL_ALREADY_EXISTS`, `SERVER_ERROR`…), suppression des messages techniques bruts.
- **Création utilisateur** : refactor `create-user-account` en transaction atomique `auth.users` + `profiles` + `membres` avec rollback ; découplage envoi email (bouton indépendant "Envoyer identifiants").
- **ErrorBoundary global** déjà présent → audit couverture par route + suppression des `window.confirm` restants.
- **Routing SPA** : remplacer les `<a href>` internes par `<Link>` / `useNavigate`, vérifier `vercel.json`.
- Correction lignes ❌ Critique "Faible effort" du classeur (typage monétaire `Math.floor`, message partage bénéficiaires, feedback loaders).

## Phase 2 — Fondations Multi-Tenant (Sprint 2-3)
Objectif : isolation stricte des données par association, sans casser E2D existant.

- Migration : ajout `association_id uuid` sur **toutes** les tables métier (nullable → backfill vers `associations.e2d` → NOT NULL).
- Table `associations` enrichie (logo, thème, config email, config caisse, locale par défaut, feature flags).
- Refonte RLS : `has_association_access(association_id)` remplace/complète `is_admin()` ; toute policy filtre par tenant.
- `AuthContext` expose `currentAssociationId` + sélecteur si l'utilisateur appartient à plusieurs assos.
- `supabase.from(...)` wrappé dans un helper `tenantQuery()` qui injecte automatiquement le filtre.
- Provisioning : edge function `provision-association` (admin plateforme uniquement) crée asso + config par défaut + admin initial.

## Phase 3 — RBAC granulaire & audit complet (Sprint 3-4)
- Extension `role_permissions` avec scope (`platform` / `association`) et wildcard.
- Rôle `super_admin` (plateforme) vs `administrateur` (association) clairement distingués.
- Table `audit_logs` unifiée (déjà existante) : triggers `AFTER INSERT/UPDATE/DELETE` sur tables sensibles (`prets`, `cotisations`, `aides`, `fond_caisse_operations`, `role_permissions`, `configurations`).
- Page admin "Journal d'audit" avec filtres par asso, utilisateur, ressource, période.
- Tests RLS automatisés étendus (`src/test/security/rls.test.ts`) : chaque nouvelle policy doit avoir son test cross-tenant.

## Phase 4 — Domain Services & FinancialEngine (Sprint 4-5)
Objectif : centraliser toute la logique métier, supprimer les doublons.

- Réorganisation `src/` en domaines : `src/domains/{finance,membres,prets,cotisations,beneficiaires,reunions,sport,notifications,cms}` avec sous-dossiers `hooks/`, `services/`, `types/`, `components/`.
- **FinancialEngine** (RPC PostgreSQL + wrapper TS) : source unique pour solde global, solde empruntable, intérêts, reste à payer, projection cotisations, calcul bénéficiaires. Suppression des `useMemo` de calcul dans les composants.
- **NotificationProvider** unifié : `notify({channel: 'email'|'inapp'|'sms', template, data, recipients, associationId})`. Retire les appels dispersés à `send-email`, `send-loan-notification`, etc. (garde les edge functions comme adapteurs).
- Correction lignes Prêts (intérêt simple, blocage cumul), Cotisations (activation par exercice via `exercices_cotisations_types`), Bénéficiaires (regroupement mois unique).

## Phase 5 — Prêts, Aides & Bénéficiaires — cohérence métier (Sprint 5-6)
- Workflow demande de prêt configurable **déjà partiellement en place** → complétion : avaliste multi-niveaux, notifications à chaque étape, PDF de décision, décaissement lié au FinancialEngine.
- Gestion complète des aides : cycle demande → validation multi-étapes → décaissement → suivi remboursement optionnel → clôture. Synchronisation `fond_caisse_operations`.
- Reconduction prêts : validation obligatoire via `pret_reconduction_validation_config` (déjà existant), UI d'administration du workflow.
- Bénéficiaires : refonte UI mois unique multi-membres, prorata intérêt, alerte auto-avalisation.

## Phase 6 — i18n, thèmes & personnalisation (Sprint 6-7)
- `react-i18next` avec namespaces par domaine ; extraction de **toutes** les chaînes (site public + portail).
- Locales fournies : `fr` (par défaut), `en`. Colonne `locale` sur `profiles` + sélecteur.
- Thème par association : CSS variables HSL surchargées via `<style>` injecté au chargement (`association.theme_tokens jsonb`). Éditeur admin avec preview live.
- Logo, favicon, nom, mentions légales, textes CGU par association.

## Phase 7 — Observabilité, sauvegardes, tests (Sprint 7-8)
- Logger structuré (`src/lib/logger.ts` déjà présent) : shipping vers `audit_logs` table + option Sentry (secret).
- Dashboard monitoring : erreurs edge functions, taux de succès emails, temps de réponse, occupation stockage.
- Sauvegarde automatique quotidienne (edge function scheduled → export SQL vers Storage bucket privé + retention 30j).
- Extension tests : Vitest ≥60% sur `src/domains/**/services`, tests RLS complets, Playwright smoke tests (login, création prêt, paiement cotisation).

## Phase 8 — Industrialisation & documentation (Sprint 8)
- Page marketing multi-associations (landing SaaS) + onboarding self-service.
- Documentation opérateur (super_admin) + guide association.
- Runbook incidents (email KO, DB saturée, tenant compromis).
- Checklist de release et pipeline CI (lint + typecheck + vitest + rls tests).

---

## Détails techniques

**Ordre non négociable** : Phase 1 avant tout (l'app doit être stable), Phase 2 avant Phase 3/4 (multi-tenant conditionne RLS et services), Phase 4 avant Phase 5 (FinancialEngine consommé par prêts/aides).

**Effort estimé** :

| Phase | Effort | Risque régression |
|---|---|---|
| 1 | ~3-5 j | Faible |
| 2 | ~8-12 j | **Élevé** (backfill + RLS) |
| 3 | ~4-6 j | Moyen |
| 4 | ~10-15 j | **Élevé** (refactor massif) |
| 5 | ~6-8 j | Moyen |
| 6 | ~5-7 j | Faible |
| 7 | ~4-6 j | Faible |
| 8 | ~3-4 j | Faible |

Total ordre de grandeur : **8 à 10 semaines** de développement effectif.

**Backlog consolidé** : les 44 lignes du classeur `Classeur_IA-3.xlsx` sont mappées 1-pour-1 sur ces phases (mapping produit en début de Phase 1 sous forme d'issues suivies dans `.lovable/plan.md`), complétées par les findings de `docs/AUDIT_E2D_V3.md` et du dernier security scan.

**Décision Resend/SMTP** : à trancher en Phase 1 après diagnostic ; le rapport listera coût, fiabilité, dépendance connector Lovable, et proposera une reco.

---

## Prochaine action attendue

Valider ce plan directeur, puis je démarre **Phase 1 uniquement** avec un plan d'implémentation détaillé (fichiers touchés, migrations, tests). Chaque phase suivante fera l'objet de son propre plan avant exécution.
