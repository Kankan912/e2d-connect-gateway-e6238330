
# Plan de correction des 16 anomalies critiques

## Diagnostic des bugs confirmés (lecture du code)

**Caisse — double formule du solde empruntable** :
- `useCaisseStats` (ligne 240 de `useCaisse.ts`) : `solde_global × 80%` → **220 440**
- `useCaisseSynthese` (ligne 626) : `(fondTotal × 80%) − pretsEnCours` → **125 388**
- Aucun n'utilise la RPC `get_solde_caisse()` qui est pourtant la source de vérité.
- Les deux affichent des décimales (pas d'arrondi).

**Prêts — intérêts composés** :
- `pretCalculsService.ts` lignes 65-70 : fallback en intérêts composés (`solde += interetRecon` puis `interetRecon = solde × taux`). À remplacer par intérêt simple.

**Galerie — albums non liés aux événements** :
- Table `site_gallery_albums` existe mais n'a pas de colonne `event_id`.

---

## Découpage en 8 lots

### Lot 1 — Caisse : centralisation et arrondi (Critique, faible/moyen)

**SQL (migration)** :
- Nouvelle RPC `get_caisse_synthese()` (SECURITY DEFINER) qui calcule en SQL pur via `SUM()` sur `fond_caisse_operations` + sous-requêtes sur `prets` et `reunions_sanctions`. Renvoie un JSON avec : `fond_total`, `total_epargnes`, `total_cotisations`, `sanctions_encaissees`, `sanctions_impayees`, `aides_distribuees`, `prets_decaisses`, `prets_rembourses`, `prets_en_cours`, `taux_recouvrement`, `solde_empruntable`, `pourcentage_empruntable`.
- Nouvelle RPC `get_solde_empruntable()` : `FLOOR(get_solde_caisse() × pourcentage / 100) − prets_en_cours`, retourne un `bigint` (entier).
- Toutes les valeurs retournées : `FLOOR()` ou cast `::bigint` côté SQL.

**Front (`src/hooks/useCaisse.ts`)** :
- `useCaisseStats` et `useCaisseSynthese` réécrits pour appeler **uniquement** `supabase.rpc('get_caisse_synthese')` (suppression complète des boucles de pagination et calculs JS).
- `useAlertesGlobales` : déjà sur RPC, vérifier qu'il utilise la même.
- Helper `formatFCFA` : forcer `Math.floor()` en entrée pour garantir aucun décimal affiché.

**Documentation** : ajouter une ligne dans `docs/ARCHITECTURE.md` interdisant tout calcul financier côté client.

---

### Lot 2 — Prêts : intérêt simple + workflow reconduction (Critique, élevé)

**`src/lib/pretCalculsService.ts`** :
- Réécrire le bloc fallback (lignes 63-72) en intérêt **simple** : `interetMensuel = capital × taux` (pas de cumul sur `solde`). `reconductionsInterets[i] = capital × taux` constant.
- Ajouter test unitaire dans `src/lib/pret-calculs.test.ts` couvrant : 0/1/3 reconductions, présence/absence d'historique réel, vérification que `interetMensuel` reste constant.

**SQL** :
- Ajouter colonne `prets_reconductions.statut` (`en_attente`, `validee`, `refusee`, défaut `validee` pour les enregistrements existants) et `validee_par uuid REFERENCES profiles(id)`, `validee_le timestamptz`.
- Trigger : empêcher INSERT direct dans `prets_reconductions` avec `statut='validee'` sauf si `is_admin()` ou rôle `tresorier`.

**Front (`src/components/ReconduireModal.tsx`)** :
- Au submit : créer la reconduction avec `statut='en_attente'`.
- Nouvelle UI dans `PretsAdmin.tsx` : onglet "Reconductions à valider" listant les `en_attente`, avec boutons Valider / Refuser (réservés via `usePermissions`).
- L'incrément de `prets.reconductions` et le recalcul des intérêts ne se déclenchent **que** lors de la validation.

---

### Lot 3 — Cotisations : projection automatique + activation par exercice (Critique, moyen/élevé)

**Projection auto** :
- Vérifier `useReunionsData.ts` / `CotisationsTab.tsx` : à l'ouverture d'une réunion (statut `ouverte` ou `en_cours`), appeler une RPC `projeter_cotisations_reunion(reunion_id)` qui INSERT en lot dans `cotisations` (statut `en_attente`, montant attendu via `get_cotisation_mensuelle_membre`) pour chaque membre actif × chaque type actif sur l'exercice.
- Trigger DB sur `INSERT reunions` (statut ouverte) : exécute la projection automatiquement.
- Front : au montage de `CotisationsTab`, si le tableau est vide pour une réunion ouverte, déclencher manuellement la projection avec bouton "Initialiser".

**Activation par exercice** :
- `ExercicesCotisationsTypesManager` existe déjà ; vérifier que le bouton `Initialiser types obligatoires` fonctionne et étendre l'UI pour activer/désactiver chaque type avec un toggle. Confirmer que `CotisationsGridView` lit bien `exercices_cotisations_types.actif` (mémoire `exercise-type-filtering` indique que oui).
- Si un type est désactivé après projection, marquer les lignes correspondantes comme `archive` (pas suppression).

---

### Lot 4 — Bénéficiaires : suppression du partage + groupement par mois (Critique, faible/moyen)

**`src/lib/beneficiairesCalculs.ts` + `BeneficiairesTab.tsx`** :
- Retirer toute logique "partage" (chercher `partage`, `repartition`, `quote_part`).
- Le montant net = `calculer_montant_beneficiaire()` (RPC existante) — chaque bénéficiaire reçoit son montant individuel.
- Mettre à jour les libellés UI : remplacer "Partage" par "Distribution individuelle".

**Multi-bénéficiaires / mois** :
- `CalendrierBeneficiaires.tsx` : refondre la vue pour grouper par mois. Chaque cellule mois = un bloc unique listant tous les bénéficiaires du mois (Card avec liste de membres, montants individuels, total mois).
- Côté hook (`useCalendrierBeneficiaires`) : grouper le résultat par `mois` (yyyy-mm) avant retour : `{ mois, beneficiaires: [...] }[]`.

---

### Lot 5 — Notifications : envoi email Resend (Critique, moyen/élevé)

**Diagnostic** :
- `RESEND_API_KEY` est déjà dans les secrets — donc le problème est code, pas config.
- Vérifier `supabase/functions/send-email/index.ts` et `_shared/email-utils.ts` :
  1. Logs détaillés à chaque étape (sélection service, sanitization `from`, statut Resend).
  2. Tester avec `supabase--curl_edge_functions` pour reproduire l'erreur.
  3. Confirmer que `EmailConfigManager` envoie bien `forceService: "resend"` lors du test (mémoire `infrastructure/email/delivery-logic`).

**Front** :
- `NotificationCampagneForm` / page d'envoi : afficher le résultat précis renvoyé par l'edge function (extraire `data.error` selon mémoire `edge-functions-logic`). Toast succès = nombre réel d'emails envoyés ; toast erreur = message complet.
- Bouton "Test email" dans `EmailConfigManager` : doit afficher l'erreur Resend brute si échec.

**Logs** : vérifier que `notifications_logs` reçoit bien une ligne par destinataire (insertion dans l'edge function).

---

### Lot 6 — Architecture : crash notifications + ErrorBoundary (Critique, faible)

- ErrorBoundary global déjà en place dans `App.tsx` et par groupe dans `Dashboard.tsx` (mémoire `error-boundary-strategy`).
- Identifier la cause précise du crash sur la page Notifications : reproduire avec le browser tool sur `/admin/notifications`, lire `read_runtime_errors`, corriger la cause racine (probablement valeur `null` non gérée dans un `select` Radix → utiliser sentinel `'none'` selon mémoire `notifications/admin-ui-robustness`).
- Vérifier que toutes les routes admin sont enveloppées d'un `ErrorBoundary` dans `Dashboard.tsx`.

---

### Lot 7 — Navigation SPA + sync matchs site (Critique, faible/moyen)

**Navigation** :
- `rg "target=\"_blank\"" src/` et `rg "<a href=\"/" src/` pour identifier les liens internes ouvrant un nouvel onglet ou faisant un full reload.
- Remplacer par `<Link to="...">` (`react-router-dom`) ou `useNavigate()`.
- Vérifier le bouton retour des pages publiques : déjà OK selon la mémoire `architecture-navigation-et-site-public`.

**Sync matchs** :
- `src/lib/sync-events.ts` existe et persiste `match_id` (mémoire). Vérifier qu'un trigger DB (ou hook front sur succès de mutation match) appelle automatiquement `syncMatchToSiteEvent` quand `statut_publication = 'publie'`.
- Ajouter un trigger SQL `AFTER INSERT OR UPDATE OF statut_publication ON sport_e2d_matchs` qui appelle une fonction `sync_match_to_site_event()` côté DB (insert/update dans `site_events` selon le statut). Cela évite de dépendre de l'appel front.

---

### Lot 8 — Galerie : albums liés aux événements (Critique, moyen)

**SQL** :
- `ALTER TABLE site_gallery_albums ADD COLUMN event_id uuid REFERENCES site_events(id) ON DELETE SET NULL`.
- Index sur `event_id`.

**Front** :
- `GalleryAdmin.tsx` : ajouter un select "Événement lié" lors de la création/édition d'un album (chargé via `useSiteEvents`).
- Page publique `EventDetail.tsx` : si un album est lié à l'événement courant, afficher une section "Galerie photo" listant les images de l'album.
- Page publique `Gallery.tsx` : grouper les albums par événement quand `event_id` est présent.

---

## Ordre d'exécution

1. **Lot 1** (Caisse) — fondamental, débloquera la cohérence.
2. **Lot 2** (Prêts) — formule simple + workflow.
3. **Lot 4** (Bénéficiaires) — dépend de la logique cotisations clarifiée.
4. **Lot 3** (Cotisations) — projection auto.
5. **Lot 5** (Notifications) — diagnostic + correctif Resend.
6. **Lot 6** (Architecture/Notifications crash) — fix bug runtime.
7. **Lot 7** (Navigation + sync matchs).
8. **Lot 8** (Galerie albums liés).

## Effort total estimé

~12-15 fichiers modifiés, ~5 migrations SQL, 2 nouvelles RPC, 1 nouvel onglet admin (validation reconductions), refonte de 2 vues UI (calendrier bénéficiaires, gallery admin).

## Périmètre exclu (à confirmer si besoin)

- Pas de refonte visuelle au-delà des points listés.
- Pas de migration de données existantes (les calculs corrigés s'appliquent automatiquement aux données en base).
- Tests unitaires uniquement pour `pretCalculsService` (le reste reste couvert par les tests existants).

Veux-tu que je procède dans cet ordre, ou préfères-tu prioriser certains lots (ex. Caisse + Notifications d'abord pour débloquer les usages immédiats) ?
