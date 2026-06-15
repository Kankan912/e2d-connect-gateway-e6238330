## Diagnostic confirmé

Le problème touche aussi la prod Vercel parce que la cause est **côté base de données Supabase**, pas côté hébergement.

Vérification effectuée à l'instant :

- Requête `information_schema.role_table_grants` sur `profiles`, `user_roles`, `role_permissions`, `membres`, `roles` pour les rôles `authenticated` / `anon` / `service_role` → **0 ligne**.
- Table `supabase_migrations.schema_migrations` : la dernière migration appliquée est `20260615145318`. La migration GRANT préparée précédemment (`20260615145321_...sql`) est présente dans le dépôt mais **n'a jamais été approuvée**, donc jamais exécutée sur la base.

Conséquence : PostgREST refuse toujours les requêtes de `fetchUserProfile`, d'où le timeout de 8 s identique en preview Lovable et sur Vercel (les deux frontends tapent la même base).

## Plan

1. **Re-soumettre la migration GRANT** (identique à celle du fichier `20260615145321`) via l'outil `supabase--migration` afin qu'elle apparaisse à nouveau dans le panneau d'approbation.
   - `GRANT SELECT, INSERT, UPDATE, DELETE` sur toutes les tables `public` à `authenticated`
   - `GRANT ALL` à `service_role`
   - `GRANT SELECT` à `anon` uniquement sur les tables du site public (`site_*`, `cms_*`)
   - `GRANT INSERT` à `anon` sur les tables de soumission publique (`messages_contact`, `demandes_adhesion`, `adhesions`, `donations`, `recurring_donations`, `site_pageviews`)
   - `GRANT USAGE, SELECT` sur toutes les séquences `public`
   - Aucune modification des politiques RLS

2. **Attendre votre clic « Approuver »** dans la fenêtre de migration. Tant que ce bouton n'est pas cliqué, rien ne change en base — ni en preview, ni sur Vercel.

3. **Vérification** : relancer la requête `role_table_grants` pour confirmer que les lignes apparaissent, puis vous demander de recharger `/dashboard` sur Vercel (Ctrl+Shift+R) pour confirmer la disparition du « Chargement… » infini.

## Pourquoi rien n'a changé jusque-là

Le fichier SQL existe dans `supabase/migrations/`, mais sur Lovable une migration n'est appliquée qu'**après votre approbation explicite** dans le panneau dédié. Le fichier seul ne touche pas la base distante.

## À confirmer

Souhaitez-vous que je re-soumette cette migration maintenant pour que vous puissiez l'approuver ?