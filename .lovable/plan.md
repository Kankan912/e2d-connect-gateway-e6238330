
# Plan de correction - Audit global des 25 manquements

## Analyse de l'etat actuel

Apres examen approfondi du code, voici le bilan : **11 points sont deja corriges ou partiellement en place**, **14 points necessitent des corrections**.

---

## Classement par priorite d'implementation

### BATCH 1 : Corrections rapides (deja partiellement en place)

#### 1. Navigation SPA - target=_blank (UX Globale)
**Etat** : 1 seul lien problematique reste dans `Reunions.tsx` (ligne 923). Les autres `target="_blank"` sont legitimes (liens externes: Resend, partenaires, justificatifs).
**Action** : Remplacer le lien `<a href={reunion.compte_rendu_url} target="_blank">` par une navigation SPA ou un telechargement inline.

#### 2. Reconduction prets - verrou role (Prets)
**Etat** : Le bouton "Reconduire" dans `PretsAdmin.tsx` (ligne 655) n'a **aucun controle de permission** contrairement aux boutons Edit/Delete.
**Action** : Envelopper le bouton reconduction avec `hasPermission('prets', 'update')`.

#### 3. Gestion erreurs - ErrorBoundary par module (UX Globale)
**Etat** : Un seul ErrorBoundary global dans `App.tsx`. Si un module crash, toute l'app affiche le fallback.
**Action** : Ajouter des ErrorBoundary locaux autour de chaque route critique dans `Dashboard.tsx` (Reunions, Caisse, Cotisations, Notifications, Sport).

#### 4. Exercice actif unique (Cotisations)
**Etat** : Le code utilise `.limit(1)` + tri par date comme contournement. Pas de contrainte DB.
**Action** : Ajouter une contrainte d'unicite partielle en DB : `CREATE UNIQUE INDEX idx_exercice_actif_unique ON exercices (statut) WHERE statut = 'actif'`.

---

### BATCH 2 : Corrections moyennes

#### 5. Creation membre - email unique (Membres)
**Etat** : Deja partiellement gere dans `useMembers.ts` (verification pre-INSERT + catch code 23505). Cependant le message d'erreur SQL brute peut encore apparaitre si la race condition passe.
**Action** : Renforcer le try/catch dans `createMember` avec un message UX plus clair pour tous les codes d'erreur SQL.

#### 6. Montants individuels cotisations (Cotisations)
**Etat** : La table `cotisations_mensuelles_exercice` existe avec verrouillage. Mais le formulaire de saisie ne bloque pas si aucun montant n'est configure pour un membre.
**Action** : Ajouter une verification dans `CotisationSaisieForm.tsx` : si montant = 0 ou absent pour le membre/exercice, afficher un avertissement et bloquer la saisie.

#### 7. Activation types par exercice (Cotisations)
**Etat** : La table pivot `exercices_cotisations_types` existe. Le filtrage est fait cote UI mais pas systematiquement securise cote backend.
**Action** : Ajouter une verification dans la mutation de creation de cotisation pour s'assurer que le type est bien active pour l'exercice selectionne.

#### 8. Beneficiaires - logique montant individuel (Beneficiaires)
**Etat** : La fonction SQL `calculer_montant_beneficiaire` calcule correctement `montant_mensuel * 12` par membre individuel. Le calcul dans `beneficiairesCalculs.ts` est aussi individuel.
**Action** : Verifier qu'aucun composant UI ne divise par le nombre de beneficiaires. S'assurer que le widget `BeneficiairesReunionWidget` utilise bien le calcul individuel.

#### 9. Multi-beneficiaires meme mois (Beneficiaires)
**Etat** : Supporte en DB (pas de contrainte unique mois). UI partiellement groupee.
**Action** : Regrouper visuellement par mois dans `CalendrierBeneficiairesManager` avec un accordeon/liste interne.

#### 10. Modification rang drag & drop (Beneficiaires)
**Etat** : Implementation dnd-kit existe dans `CalendrierBeneficiairesManager` avec `SortableBeneficiaireRow`.
**Action** : Verifier la stabilite du drag & drop et la persistance du champ `rang`. Corriger si la sauvegarde echoue silencieusement.

---

### BATCH 3 : Corrections significatives

#### 11. Reunion - Reouverture complete (Reunions)
**Etat** : `ReouvrirReunionModal` change le statut a "en_cours", supprime les operations caisse, et optionnellement les sanctions. **Mais ne deverrouille pas les cotisations** (manque `UPDATE cotisations SET verrouille = false WHERE reunion_id = ?`).
**Action** : Ajouter le deverrouillage des cotisations liees dans le processus de reouverture.

#### 12. Presences - Coherence avec sanctions (Presences)
**Etat** : La cloture de reunion (`ClotureReunionModal`) cree des sanctions pour absences. Mais pas de validation croisee cotisations.
**Action** : Ajouter dans la cloture un check de coherence : les membres marques "presents" doivent avoir au moins une cotisation enregistree pour cette reunion.

#### 13. Prets - Paiement partiel logique interet/capital (Prets)
**Etat** : `PretsPaiementsManager` gere les types "interet", "capital" et "mixte". La logique semble correcte (interet d'abord puis capital).
**Action** : Verifier que le recalcul du capital restant apres paiement partiel ne genere pas de nouveaux interets automatiques. Ajouter un test de non-regression.

#### 14. Notifications - Tracabilite campagnes (Notifications)
**Etat** : Table `notifications_campagnes` et `notifications_logs` existent. Le formulaire de campagne est present.
**Action** : Enrichir l'affichage des campagnes envoyees avec statuts detailles (envoyes, echecs, en attente) depuis `notifications_logs`.

---

### BATCH 4 : Travaux structurels (effort important)

#### 15. Architecture - Separation logique metier / UI
**Etat** : Logique metier dans les hooks React et composants.
**Action** : Creer un dossier `src/services/` avec des modules :
- `services/cotisations.ts` - calculs, validations
- `services/prets.ts` - calculs interet, reconduction
- `services/beneficiaires.ts` - calculs montants nets
- `services/caisse.ts` - synthese, ventilation
Extraire progressivement la logique des hooks/composants vers ces services.

#### 16. Coherence referentielle DB (Base de donnees)
**Etat** : Relations FK existent pour la plupart. Manque ON DELETE CASCADE/RESTRICT sur certaines tables.
**Action** : Migration SQL pour ajouter des contraintes FK avec ON DELETE appropries et l'index d'unicite exercice actif.

#### 17. Liaison user / member (Utilisateurs)
**Etat** : Liaison via `membres.user_id` + table `user_roles` separee. Architecture correcte.
**Action** : Documenter le workflow et s'assurer que la suppression d'un user ne laisse pas de membre orphelin (ON DELETE SET NULL sur `membres.user_id`).

#### 18. Matchs E2D - Publication site (Sport)
**Etat** : Sync realtime via `useSportEventSync` + fonctions dans `sync-events.ts`. Fonctionne pour les matchs avec `statut_publication = 'publie'`.
**Action** : Verifier que le CR et les medias sont bien inclus dans l'evenement CMS cree. Ajouter le lien vers les photos du match dans `site_events`.

#### 19. Matchs E2D - CR + medias publics (Sport)
**Etat** : Composants `MatchMediaManager` et `CompteRenduViewer` existent.
**Action** : S'assurer que les URLs des medias dans le bucket `match-medias` sont accessibles publiquement et lies a l'evenement site.

#### 20. Notifications - Config Resend securisee (Notifications)
**Etat** : Cle API stockee en DB dans table `configurations` (pas en secret Supabase). Le test utilise l'email du proprietaire.
**Action** : Migrer le stockage de la cle API Resend vers les secrets Supabase (deja configure comme secret `RESEND_API_KEY`). S'assurer que les edge functions l'utilisent depuis `Deno.env.get('RESEND_API_KEY')` et non depuis la DB.

#### 21. Permissions - Double controle frontend + backend (Securite)
**Etat** : Frontend utilise `hasPermission`. Backend utilise RLS avec `has_permission()`. Couverture partielle.
**Action** : Auditer toutes les mutations critiques (creation pret, allocation aide, cloture reunion) pour s'assurer que les RLS policies bloquent bien les operations non autorisees.

#### 22. Performance - Lazy loading analytics (Performance)
**Etat** : Les dashboards analytics (`E2DDashboardAnalytics`, `SportAnalyticsAvancees`, `PhoenixDashboardAnnuel`) sont lazy-loaded dans les pages parentes.
**Action** : Ajouter de la pagination sur les requetes lourdes (classements, historiques) et verifier que les composants Recharts ne bloquent pas le rendu.

#### 23. Sauvegarde - Strategie backup (Sauvegarde)
**Etat** : `SauvegardeManager` existe mais pas de planification automatique.
**Action** : Ajouter un cron Edge Function pour export automatique hebdomadaire + journal des sauvegardes dans une table dediee.

#### 24. Notification calendrier beneficiaires (Beneficiaires)
**Etat** : Le bouton "Notifier" appelle l'edge function `send-calendrier-beneficiaires` qui utilise Resend. Fonctionne en mode test (email proprietaire uniquement).
**Action** : Verifier que la fonction envoie bien a tous les membres une fois le domaine verifie. Ajouter un log dans `notifications_logs`.

#### 25. Caisse - Synthese financiere (Caisse)
**Etat** : **DEJA CORRIGE** - `useCaisseSynthese.ts` calcule tout depuis `fond_caisse_operations` via SUM cote client.
**Action** : Aucune - fonctionnel.

---

## Ordre d'implementation recommande

| Phase | Points | Effort | Duree estimee |
|-------|--------|--------|---------------|
| Batch 1 | #1, #2, #3, #4 | Petit | 1 session |
| Batch 2 | #5, #6, #7, #8, #9, #10 | Moyen | 1-2 sessions |
| Batch 3 | #11, #12, #13, #14 | Moyen-Large | 1-2 sessions |
| Batch 4 | #15-#25 | Large | 3-5 sessions |

---

## Section technique - Modifications par fichier

| Fichier | Corrections |
|---------|-------------|
| `src/pages/Reunions.tsx` | Supprimer `target="_blank"` (point 1) |
| `src/pages/admin/PretsAdmin.tsx` | Permission reconduction (point 2) |
| `src/pages/Dashboard.tsx` | ErrorBoundary par route (point 3) |
| Migration SQL | Unicite exercice actif (point 4), FK ON DELETE (point 16) |
| `src/hooks/useMembers.ts` | Messages erreur enrichis (point 5) |
| `src/components/forms/CotisationSaisieForm.tsx` | Blocage si montant non configure (point 6) |
| `src/components/ReouvrirReunionModal.tsx` | Deverrouillage cotisations (point 11) |
| `src/components/ClotureReunionModal.tsx` | Check coherence presences/cotisations (point 12) |
| `src/pages/admin/NotificationsAdmin.tsx` | Tracabilite campagnes (point 14) |
| Nouveau: `src/services/*.ts` | Separation logique metier (point 15) |
