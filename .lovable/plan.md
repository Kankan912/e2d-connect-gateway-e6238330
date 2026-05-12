## Plan : 4 améliorations sécurité & navigation

### 1. Widget « Statut de sécurité » (admin)

**Emplacement** : `src/pages/admin/MonitoringAdmin.tsx`, en haut du tableau (au-dessus des onglets), visible aussi sur `DashboardHome` pour les administrateurs.

**Composant** : `src/components/admin/SecurityStatusWidget.tsx`
- Card affichant : date du dernier scan, nb findings (critiques / warnings / info), badge couleur (vert/orange/rouge), bouton « Voir le rapport ».
- Source de données : nouvelle table `security_scans` (Supabase) avec colonnes `id, scan_date, critical_count, warning_count, info_count, summary, created_by`.
- Migration : table + RLS (lecture admin uniquement via `is_admin()`, insertion admin).
- Hook `useLatestSecurityScan()` qui récupère la dernière ligne.
- Bouton « Enregistrer un scan » (admin) ouvre un dialog pour saisir manuellement les chiffres après un scan Lovable (puisque les scans Lovable sont déclenchés depuis l'IDE et non automatisables côté app).

### 2. Bouton « Accéder à l'interface E2D Connect » sur la home

**Emplacement** : `src/components/Hero.tsx`, ajouté comme 3ᵉ CTA à côté de « Nous Rejoindre » et « En Savoir Plus ».
- Lien vers `/auth` (si non connecté) ou `/dashboard` (si connecté) — détection via `useAuth()`.
- Style : variant `secondary` ou outline distinct, icône `LogIn` lucide.
- Texte : « Accéder à E2D Connect ».

### 3. Lien de téléchargement du rapport PDF (admin)

**Préparation** :
- Copier `/mnt/documents/SECURITY_REPORT_2026_05.pdf` vers `public/docs/SECURITY_REPORT_2026_05.pdf` (servi statiquement).
- Créer aussi `public/docs/SECURITY_REPORT_2026_05.md` pour version markdown.

**UI** : Dans le widget de l'étape 1 et dans `MonitoringAdmin` (nouvel onglet « Sécurité » ou section dédiée) :
- Boutons « Télécharger PDF » et « Télécharger MD » avec `<a href="/docs/SECURITY_REPORT_2026_05.pdf" download>`.
- Liste les rapports historiques s'il y en a plusieurs.

### 4. Pipeline CI/CD — exécution automatique de `npm run test:rls`

**Fichier** : `.github/workflows/security-rls.yml`
- Trigger : `push` sur `main`, `pull_request`, et `workflow_dispatch`.
- Steps :
  1. Checkout
  2. Setup Node 20 + Bun
  3. `bun install`
  4. `bun run test:rls`
- Variables d'environnement (GitHub Secrets requis, à configurer manuellement par l'utilisateur) :
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_PUBLISHABLE_KEY`
  - `VITE_TEST_ANON_EMAIL` / `VITE_TEST_ANON_PASSWORD`
  - `VITE_TEST_MEMBER_EMAIL` / `VITE_TEST_MEMBER_PASSWORD`
  - `VITE_TEST_ADMIN_EMAIL` / `VITE_TEST_ADMIN_PASSWORD`
- Job échoue si un test RLS casse → bloque le merge.
- Documentation mise à jour dans `docs/SECURITY_TESTS.md` (section CI/CD avec instructions pour ajouter les secrets dans Settings → Secrets and variables → Actions).

**Note hébergement** : Le projet est déployé sur Vercel (présence de `vercel.json`). Vercel ne déclenche pas Vitest nativement → on passe par GitHub Actions qui s'exécute en parallèle des déploiements Vercel. Si l'utilisateur veut bloquer les déploiements Vercel sur échec, on peut activer « Required status checks » sur la branche `main`.

### Détails techniques

```text
Fichiers créés :
  supabase/migrations/<ts>_security_scans.sql
  src/components/admin/SecurityStatusWidget.tsx
  src/hooks/useSecurityScans.ts
  public/docs/SECURITY_REPORT_2026_05.pdf  (copie depuis /mnt/documents)
  public/docs/SECURITY_REPORT_2026_05.md
  .github/workflows/security-rls.yml

Fichiers modifiés :
  src/components/Hero.tsx                 (+ bouton E2D Connect)
  src/pages/admin/MonitoringAdmin.tsx     (+ widget + section rapport)
  src/pages/dashboard/DashboardHome.tsx   (+ widget admin si admin)
  docs/SECURITY_TESTS.md                  (section CI/CD)
```

### Action requise de votre part après implémentation

- Configurer les 8 GitHub Secrets listés ci-dessus dans le repo.
- Créer les 3 comptes de test (anon/membre/admin) dans Supabase pour le job CI.
