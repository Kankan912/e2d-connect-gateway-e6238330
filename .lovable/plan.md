Je vais remplacer les instructions floues par une action guidée dans l’interface admin.

## Ce qui sera fait

1. **Créer une Edge Function sécurisée `seed-test-users`**
   - Accessible uniquement depuis un compte connecté ayant le rôle `administrateur`.
   - Utilise `SUPABASE_SERVICE_ROLE_KEY` côté serveur pour créer ou mettre à jour les 3 comptes de test Supabase.
   - Génère automatiquement des mots de passe forts.
   - Ne stocke pas les mots de passe en base et ne les écrit pas dans GitHub.

2. **Créer les 3 comptes de test CI**
   - `anon` : compte de test public/non privilégié.
   - `membre` : compte membre simple.
   - `administrateur` : compte administrateur, avec le rôle officiel `administrateur`.
   - Les emails seront du type `ci-anon@e2d-test.local`, `ci-membre@e2d-test.local`, `ci-administrateur@e2d-test.local`.

3. **Ajouter un bouton clair dans `MonitoringAdmin`**
   - Bouton : `Générer les comptes de test CI`.
   - Après clic, l’écran affichera directement les 8 valeurs à copier dans GitHub Secrets :
     - `VITE_SUPABASE_URL`
     - `VITE_SUPABASE_PUBLISHABLE_KEY`
     - `VITE_TEST_ANON_EMAIL`
     - `VITE_TEST_ANON_PASSWORD`
     - `VITE_TEST_MEMBER_EMAIL`
     - `VITE_TEST_MEMBER_PASSWORD`
     - `VITE_TEST_ADMIN_EMAIL`
     - `VITE_TEST_ADMIN_PASSWORD`
   - Ajout d’un bouton de copie pour faciliter l’ajout dans GitHub.

4. **Créer une checklist simple**
   - Fichier : `docs/CI_SETUP_CHECKLIST.md`.
   - Instructions simplifiées, étape par étape, sans jargon.
   - Explication claire : je peux créer les comptes Supabase automatiquement, mais les GitHub Secrets doivent être collés dans GitHub par une personne ayant accès au dépôt, sauf si un accès GitHub automatisé est explicitement configuré.

## Point important

Je ne mettrai pas les mots de passe dans le code ni dans un fichier GitHub. Ils seront affichés une seule fois dans l’interface admin après génération, afin que tu puisses les copier en sécurité.

## Validation prévue

Après implémentation, je vérifierai que :
- la fonction est bien déployable ;
- le bouton admin appelle correctement la fonction ;
- les valeurs nécessaires au workflow `security-rls.yml` correspondent bien aux noms attendus ;
- la documentation explique précisément quoi copier et où le coller.