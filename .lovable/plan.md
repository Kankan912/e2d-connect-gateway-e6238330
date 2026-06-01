## Étapes restantes pour activer la CI RLS

### 1. Générer les 3 comptes de test Supabase
- Aller sur `/dashboard/admin/monitoring` (vous y êtes déjà)
- Dans la carte **« Comptes de test CI »**, cliquer sur **« Générer les comptes de test CI »**
- L'Edge Function `seed-test-users` crée/met à jour :
  - `ci-anon@e2d-test.local` (aucun rôle)
  - `ci-membre@e2d-test.local` (rôle `membre`)
  - `ci-administrateur@e2d-test.local` (rôle `administrateur`)
- Les mots de passe forts sont générés automatiquement et affichés **une seule fois**

### 2. Vérifier que les secrets GitHub correspondent
Les valeurs affichées doivent **exactement** correspondre aux 8 secrets GitHub que vous venez de créer :
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_TEST_ANON_EMAIL` / `VITE_TEST_ANON_PASSWORD`
- `VITE_TEST_MEMBER_EMAIL` / `VITE_TEST_MEMBER_PASSWORD`
- `VITE_TEST_ADMIN_EMAIL` / `VITE_TEST_ADMIN_PASSWORD`

Si vous avez mis des emails/mots de passe **différents** dans GitHub, il faut soit :
- Mettre à jour les secrets GitHub avec les valeurs affichées par le bouton, OU
- Me dire les emails que vous avez utilisés pour que j'adapte l'Edge Function

### 3. Lancer le workflow manuellement pour valider
- GitHub → onglet **Actions** → workflow **« Security RLS Tests »**
- Cliquer sur **« Run workflow »** → branche `main` → **Run workflow**
- Attendre 1-2 min, vérifier que le job passe au vert ✅

### 4. Vérification finale
Une fois le workflow vert :
- Le job s'exécutera automatiquement à chaque `push` et `pull_request` sur `main`
- Toute violation RLS fera échouer le workflow et bloquera le merge

### Question pour vous
Voulez-vous que je vous guide étape par étape (en attendant que vous cliquiez sur chaque bouton), ou préférez-vous tout faire d'un coup en suivant `docs/CI_SETUP_CHECKLIST.md` ?
