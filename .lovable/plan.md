# Tests E2E Playwright + tableau de revue complet

## Point de départ (vérifié)

- L'environnement d'authentification est `external_unmanaged` : Lovable ne peut pas injecter automatiquement une session Supabase. Les parcours authentifiés exigent donc des identifiants de test réels.
- Aucun compte de test n'est présent dans `.env` : `setup-personae.ts` attend `VITE_TEST_MEMBER_EMAIL/PASSWORD` et `VITE_TEST_ADMIN_EMAIL/PASSWORD`, absents aujourd'hui (c'est pour cela que 41 tests RLS sont ignorés).
- Playwright n'est pas installé dans le projet ; il est disponible dans l'environnement d'exécution (Python) pour lancer les parcours.
- `docs/REVUE_NAVIGATION_2026_08.md` contient déjà un tableau de corrections, mais pas le tableau demandé (module / bouton / état / test / résultat) couvrant toute la plateforme.

## Étape 0 — Identifiants de test (prérequis bloquant)

Deux options, à trancher avant lancement :

1. Vous fournissez un couple admin + membre existants (stockés en secrets, jamais écrits en clair dans le code).
2. On crée des comptes de test dédiés via la fonction `seed-test-users` / `docs/TEST_USERS_SETUP.sql` sur une association de test, puis on les utilise.

Sans l'une des deux, seuls les parcours publics et l'écran de connexion seront réellement testés ; le reste sera marqué « Non vérifié » dans le tableau.

## Étape 1 — Harnais Playwright

- Dossier `e2e/` : configuration (base URL locale, viewport 1280x1800, capture console + erreurs réseau, screenshots par étape).
- Utilitaire de connexion réutilisable (login via l'écran `/auth`, puis réutilisation de l'état de session entre scénarios).
- Détecteur de rechargement : marqueur posé sur `window` après le premier rendu ; sa disparition signale un rechargement complet non voulu.
- Détecteur de page blanche : vérification que le conteneur racine contient du contenu visible après chaque navigation.
- Collecte systématique des erreurs console et des requêtes en échec ; toute erreur fait échouer le scénario.

## Étape 2 — Scénarios couverts

Public : accueil, don, adhésion, événement, album, site par slug, page 404, association désactivée.

Authentifié (selon droits disponibles) :

- Connexion, redirection post-login, changement de mot de passe initial, déconnexion.
- Portail membre : tableau de bord, ma situation, mes cotisations, prêts, épargnes, aides, sanctions, présences, profil.
- Administration : membres, utilisateurs, rôles et permissions, cotisations et exercices, caisse, prêts et demandes, aides, bénéficiaires, réunions, sport, notifications, rapports, exports, CMS du site, configuration.
- Plateforme (super admin) : liste des associations, création (assistant), modification, désactivation, réactivation, archivage, suppression logique, tentative d'accès à une association non active par URL directe.
- Contrôle d'accès : accès à une route interdite → page « Accès refusé » et non page blanche.

Pour chaque écran : ouverture, clic sur les actions principales, ouverture/fermeture des dialogues, soumission d'au moins un formulaire non destructif, vérification qu'aucun bouton ne reste sans effet.

## Étape 3 — Correction des anomalies trouvées

Les défauts détectés (bouton inerte, rechargement, page blanche, erreur console, mauvaise redirection) sont corrigés au fil de l'eau, puis le scénario concerné est relancé jusqu'au vert.

## Étape 4 — Livrables

- `e2e/` : scénarios + README de lancement.
- `docs/REVUE_PLATEFORME_2026_08.md` : tableau complet

  | Module | Page / composant | Bouton ou action | État | Dysfonctionnement | Cause technique | Correction | Test | Résultat |

  États utilisés : Fonctionnel / Partiellement fonctionnel / Non fonctionnel / Non vérifié (avec motif).
- Synthèse en tête : nombre d'actions testées, répartition par état, anomalies corrigées, points restants.
- Mise à jour de `docs/REVUE_NAVIGATION_2026_08.md` pour renvoyer vers ce nouveau document.

## Détails techniques

- Les scénarios s'exécutent contre le serveur de développement local ; aucune donnée de production n'est modifiée hors association de test.
- Les identifiants sont lus depuis des variables d'environnement, jamais journalisés ni capturés en screenshot.
- Les actions destructives (suppression définitive, clôture d'exercice) sont testées uniquement sur des données de test créées par le scénario lui-même.
