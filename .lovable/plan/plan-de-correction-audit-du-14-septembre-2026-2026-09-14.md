# Plan de correction — audit du 14 septembre 2026

Objectif : traiter les 28 actions de l'audit (A01 → A28) et lever tous les critères
de sortie avant production. Quatre lots, exécutés dans l'ordre.

## Ce qui a été vérifié en base et dans le code avant d'écrire ce plan

- **Erreur « varchar(3) » à la création d'une réunion** : cause trouvée. En base,
  la colonne « type de réunion » de la table des réunions n'accepte que
  3 caractères, alors que le formulaire envoie « tontine », « bureau »,
  « generale », « extraordinaire ». Les 3 réunions existantes contiennent « AGO ».
- **Tables lisibles par tout compte connecté** : confirmé pour les 7 tables citées
  (cotisations des membres, historiques de cotisations, cotisations minimales,
  attributions de tontine, historique des paiements bénéficiaires, activités des
  membres, huile & savon).
- **Fonctions serveur sans contrôle d'identité** : confirmé — 18 fonctions sur 20
  sont déclarées sans vérification de jeton ; le contrôle de rôle existant ne
  vérifie pas l'association concernée.
- **Adresse et clé du backend écrites en dur** dans le code client : confirmé.
- **`.env` non exclu du dépôt**, trois fichiers de verrouillage de dépendances
  concurrents et un fichier parasite nommé `null` : confirmés.
- **Rechargement automatique de page** en cas d'échec de chargement d'un écran, et
  chargement de l'outil de supervision par évaluation dynamique de code : confirmés.

## Lot 1 — Sécurité bloquante

1. Toute fonction serveur qui envoie des emails ou lit des données sensibles exige
   désormais une connexion valide, un rôle suffisant **et** l'appartenance à
   l'association concernée. Le contrôle partagé est étendu pour recevoir
   l'association cible.
2. L'envoi du compte rendu et les notifications de prêt ne reçoivent plus la liste
   des destinataires depuis le navigateur : le serveur part de l'identifiant de la
   réunion ou de la demande, en déduit l'association et construit lui-même la liste
   des membres actifs. Réponses claires : 401 sans connexion, 403 sans droit,
   404 si la ressource n'appartient pas à l'association.
3. Les rappels de présence, les rappels de cotisation, les échéances de prêt et les
   notifications de sanction sont filtrés par association, avec une protection
   contre les doublons d'envoi.
4. Les 7 tables lisibles par tous sont reprises par migration : lecture et écriture
   liées à l'association du parent (membre, réunion, exercice).
5. Tests croisés Association A / Association B ajoutés à la suite de tests de
   sécurité existante.

## Lot 2 — Cohérence de la base et de l'environnement

6. Migration corrective de la colonne « type de réunion » (passage en texte libre
   avec liste de valeurs contrôlée), sans perte des données existantes ; la création
   et la modification d'une réunion sont revalidées.
7. Le client backend lit l'adresse et la clé depuis les variables d'environnement,
   avec un message d'erreur explicite au démarrage si elles manquent ;
   ajout d'un `.env.example`.
8. `.env` et ses variantes exclus du dépôt, `.env.example` conservé.
9. Clôture et réouverture d'une réunion déplacées dans une opération unique côté
   base de données : soit tout réussit, soit rien n'est appliqué ; aucune sanction
   en double si l'opération est relancée ; emails envoyés seulement après validation.

## Lot 3 — Règles métier et expérience utilisateur

10. Le compte rendu part à tous les membres actifs de l'association : la règle est
    appliquée par le serveur, et l'écran affiche la liste en lecture seule.
11. Le suivi annuel des présences s'appuie sur l'exercice choisi et ses dates de
    début et de fin, au lieu de la seule année.
12. Suppression du rechargement automatique de page : une seule nouvelle tentative,
    puis un écran d'erreur avec un bouton de rechargement manuel ; les retours vers
    le tableau de bord restent en navigation interne.
13. Toutes les valeurs saisies par les utilisateurs sont neutralisées avant d'être
    insérées dans les emails.
14. Les autorisations d'appel (CORS) passent par la liste de domaines partagée pour
    toutes les fonctions ; plus aucune fonction sensible en accès ouvert.

## Lot 4 — Durcissement et industrialisation

15. Suppression du chargement dynamique par évaluation de code, puis durcissement de
    la politique de sécurité du navigateur (retrait de `unsafe-eval`).
16. Supervision des erreurs en production réellement branchée, ou code inactif retiré.
17. Remplacement des typages permissifs dans les flux sécurité, finance et
    notifications.
18. Un seul gestionnaire de paquets et un seul fichier de verrouillage ; suppression
    du fichier parasite `null` et des caches versionnés.
19. L'audit des dépendances bloque désormais les vulnérabilités élevées et critiques.
20. Les tests d'isolation entre associations deviennent exécutables automatiquement.

## Détails techniques

- Migration A07 : `ALTER TABLE public.reunions ALTER COLUMN type_reunion TYPE text`
  + contrainte de valeurs (`tontine|bureau|generale|extraordinaire|AGO`) et
  normalisation des lignes existantes.
- Migration RLS : suppression des policies `*_select_auth USING (true)` sur
  `cotisations_membres`, `cotisations_mensuelles_audit`, `cotisations_minimales`,
  `tontine_attributions`, `beneficiaires_paiements_audit`, `activites_membres`,
  `reunions_huile_savon` ; remplacement par jointure vers le parent avec
  `has_association_access()` / `current_association_id()`.
- `supabase/functions/_shared/auth-check.ts` : nouvelle signature
  `requirePrivilegedUser(req, cors, { associationId | resolve })` appuyée sur
  `is_admin_of(association_id)`.
- `supabase/config.toml` : `verify_jwt = true` pour `send-reunion-cr`,
  `send-loan-notification`, `send-presence-reminders`, `send-cotisation-reminders`,
  `send-pret-echeance-reminders`, `send-sanction-notification`,
  `send-calendrier-beneficiaires`, `update-email-config`, `sync-user-emails`,
  `test-email-configuration`, `send-user-credentials`, `send-email`.
- Nouvelles RPC transactionnelles `cloturer_reunion(...)` et `rouvrir_reunion(...)`
  remplaçant `useClotureReunion.ts` et `ReouvrirReunionModal.tsx`.
- `src/integrations/supabase/client.ts` : `import.meta.env.VITE_SUPABASE_URL` /
  `VITE_SUPABASE_PUBLISHABLE_KEY` + garde au démarrage.
- `src/lib/lazyWithRetry.ts` : retry borné sans `window.location.reload()`.
- `src/lib/sentry.ts` : import dynamique standard, suppression de `new Function` ;
  `vercel.json` : retrait de `unsafe-eval`.
- Nouvel utilitaire d'échappement HTML partagé dans `supabase/functions/_shared/`.
- Rapport de preuve final au format imposé par l'audit (ID, fichiers, migration,
  tests, statut, risque résiduel) dans `docs/`.

## Hors périmètre de l'application

Le nettoyage de l'historique Git et la rotation d'éventuels secrets déjà publiés
demandent une action de votre côté ; le plan se limite à exclure les fichiers et à
documenter la marche à suivre.
