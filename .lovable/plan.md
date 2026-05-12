## Objectif

Mettre en place une chaîne complète de vérification sécurité :
1. Tests automatisés RLS exécutés à chaque déploiement
2. Re-scan complet de sécurité (déjà déclenché — résultats inclus ci-dessous)
3. Rapport téléchargeable Markdown + PDF dans `/mnt/documents/`

---

## 1. Re-scan de sécurité (déjà exécuté)

Résultat du scan complet relancé pendant la planification :

- **supabase_lov (scanner Lovable)** : 0 findings actionnables
- **supabase (linter natif)** : 0 findings critiques
- **agent_security** : 0 findings
- **Linter brut** : 103 warnings dont :
  - 10 × "Public Bucket Allows Listing" → **intentionnel** (vitrine `site-*`, photos membres, logos sport)
  - ~80 × "Public Can Execute SECURITY DEFINER Function" → **intentionnel** (RPCs métier `get_caisse_*`, `has_role`, `is_admin`, etc. — protégées en interne)
  - 1 × "RLS Policy Always True" → SELECT public sur tables CMS (vitrine, intentionnel)

Aucune nouvelle vulnérabilité masquée.

---

## 2. Tests automatisés RLS

Créer une suite Vitest dédiée qui simule 3 personae et vérifie l'accès aux tables sensibles via le client `@supabase/supabase-js` avec la clé anon.

### Fichier : `src/test/security/rls.test.ts`

Personae testés (créés à la volée puis nettoyés) :
- **anonyme** : non authentifié
- **membre** : utilisateur sans rôle privilégié
- **admin** : utilisateur avec rôle `administrateur`

### Tables couvertes (et opérations testées)

| Table | Anonyme | Membre | Admin |
|---|---|---|---|
| `messages_contact` | INSERT ✅ / SELECT ❌ | SELECT ❌ | SELECT ✅ |
| `demandes_adhesion` | INSERT ✅ / SELECT ❌ | SELECT ❌ | SELECT ✅ |
| `cms_events`, `cms_pages`, `cms_sections`, `cms_settings`, `cms_hero_slides`, `cms_gallery`, `cms_partners` | SELECT ✅ / INSERT ❌ | INSERT ❌ | INSERT ✅ |
| `fichiers_joint` | SELECT ❌ | SELECT ✅ | SELECT ✅ |
| `sport_e2d_depenses`, `sport_e2d_recettes`, `sport_phoenix_depenses`, `sport_phoenix_recettes` | SELECT ❌ | SELECT ✅ | SELECT ✅ |
| `prets`, `cotisations`, `epargnes` | SELECT ❌ | SELECT (own only) ✅ | SELECT ✅ |
| `audit_logs`, `payment_configs`, `fond_caisse_clotures`, `adhesions` | SELECT ❌ | SELECT ❌ | SELECT ✅ |
| `user_roles`, `roles`, `role_permissions` | SELECT ❌ | SELECT (own) ✅ | SELECT ✅ |

### Fichier : `src/test/security/setup-personae.ts`

Helpers : `signInAsAnon()`, `signInAsMember()`, `signInAsAdmin()` — utilisent des comptes de test (variables d'env `TEST_MEMBER_EMAIL/PASSWORD`, `TEST_ADMIN_EMAIL/PASSWORD`). Si ces variables manquent, les tests sont marqués `skip` avec un message clair (pas de faux positif en CI).

### Intégration CI

- Ajout d'un script `npm run test:rls` dans `package.json` : `vitest run src/test/security`
- Ajout d'un fichier `.github/workflows/security-rls.yml` (si CI GitHub) qui :
  - Exécute `npm run test:rls` à chaque push sur `main`
  - Upload du rapport JUnit en artefact
- Documentation dans `docs/SECURITY_TESTS.md` : comment configurer les comptes de test, comment exécuter en local

---

## 3. Rapport de sécurité téléchargeable

### Fichier source : `docs/SECURITY_REPORT_2026_05.md`

Structure :
1. **Résumé exécutif** — état général, nombre d'issues, statut
2. **Findings résolus** (5 issues) avec pour chacune :
   - ID, sévérité, table/scope
   - Description du risque
   - Correctif appliqué (extrait SQL)
   - Statut : ✅ Vérifié
3. **Warnings acceptés** (linter brut) avec justification métier
4. **Tests automatisés** — liste des assertions, mode d'exécution
5. **Recommandations futures** — rotation tokens, audit trimestriel, etc.
6. **Annexes** — log scan complet, migrations exécutées

### Génération PDF : `scripts/generate-security-report.py`

Script Python utilisant `reportlab` qui :
- Lit le `.md` ci-dessus
- Génère `/mnt/documents/SECURITY_REPORT_2026_05.pdf` avec mise en page propre (titres, tableaux, code blocks)
- QA visuelle obligatoire (pdftoppm + inspection) avant livraison

Livrables téléchargeables :
- `<presentation-artifact path="SECURITY_REPORT_2026_05.md" mime_type="text/markdown">`
- `<presentation-artifact path="SECURITY_REPORT_2026_05.pdf" mime_type="application/pdf">`

---

## Détails techniques

- **Vitest** est déjà configuré (`vitest.config.ts`, `src/test/setup.ts`) — la suite RLS sera isolée dans un sous-dossier `security/` avec son propre setup pour ne pas mocker Supabase (contrairement aux tests unitaires existants)
- **Sécurité des comptes test** : ne JAMAIS hardcoder de mots de passe — uniquement via env vars
- **Idempotence** : les tests utilisent `cleanup()` après chaque cas pour ne laisser aucune donnée de test
- **Coût** : ~30-40 assertions, exécution < 30s
- **Pas de modification du code applicatif** ni des migrations existantes
