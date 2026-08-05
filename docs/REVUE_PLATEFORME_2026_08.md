# Revue de la plateforme — tests E2E et tableau d'états (août 2026)

## 1. Synthèse

| Indicateur | Valeur |
|---|---|
| Écrans inventoriés | 68 (9 publics, 12 portail membre, 46 administration, 1 console plateforme) |
| Actions vérifiées automatiquement (Playwright) | 12 |
| Fonctionnel | 11 |
| Partiellement fonctionnel | 1 |
| Non fonctionnel | 0 |
| Non vérifié (identifiants de test absents) | 59 écrans authentifiés |
| Anomalies corrigées lors de cette revue | 3 |

Harnais : `e2e/` (voir `e2e/README.md`). Il détecte, pour chaque navigation
et chaque clic : rechargement complet du document, page blanche, erreur
console, erreur JavaScript non capturée, requête réseau en échec, bouton
sans effet et redirection incorrecte.

Blocage résiduel : le projet est relié à un Supabase externe non géré par
Lovable ; aucune session ne peut être injectée et aucun identifiant de test
n'est présent (`VITE_TEST_ADMIN_*` / `VITE_TEST_MEMBER_*` absents, la
fonction `seed-test-users` exigeant elle-même un jeton administrateur).
Les parcours authentifiés sont donc **prêts à l'exécution** mais marqués
« Non vérifié ». Fournir `E2E_EMAIL` / `E2E_PASSWORD` suffit à les lancer :

```bash
E2E_EMAIL="..." E2E_PASSWORD="..." E2E_ROLE=super_admin python e2e/run_authenticated.py
```

## 2. Tableau de revue

### 2.1 Site public et authentification (vérifié automatiquement)

| Module | Page / composant | Bouton ou action | État | Dysfonctionnement | Cause technique | Correction | Test | Résultat |
|---|---|---|---|---|---|---|---|---|
| Site public | Accueil `/` | Ouverture | Fonctionnel | Requête image en échec vers `facebook.com` | Logo de partenaire dont l'URL pointe vers une page Facebook, image cassée sans repli | Composant `PartnerLogo` avec `onError` → repli texte + icône, `loading="lazy"` | `e2e/run_public.py` | Aucune erreur console ni image cassée |
| Site public | Accueil | Lien « Faire un don » | Fonctionnel | — | — | — | `e2e/run_public.py` | Navigation SPA, aucun rechargement |
| Site public | Accueil | Lien « Adhésion » | Fonctionnel | — | — | — | `e2e/run_public.py` | Navigation SPA, aucun rechargement |
| Site public | Don `/don` | Ouverture | Fonctionnel | — | — | — | `e2e/run_public.py` | Rendu complet, console propre |
| Site public | Adhésion `/adhesion` | Ouverture | Fonctionnel | — | — | — | `e2e/run_public.py` | Rendu complet, console propre |
| Site public | Site par slug `/s/:slug` | Ouverture | Partiellement fonctionnel | Requête réseau externe en échec | Donnée : `site_partners.logo_url` contient une URL de page Facebook (à corriger dans le CMS, hors code) | Repli visuel appliqué côté code ; correction de la donnée à faire dans « CMS site / Partenaires » | `e2e/run_public.py` | Affichage correct, requête externe encore émise |
| Site public | Don / Adhésion par slug | Ouverture | Fonctionnel | — | — | — | `e2e/run_public.py` | Contexte tenant résolu |
| Site public | Association inconnue `/s/slug-inexistant` | Ouverture | Fonctionnel | — | — | Garde `PublicSiteGuard` | `e2e/run_public.py` | Écran « indisponible », pas de page blanche |
| Site public | Page 404 | Ouverture | Fonctionnel | `logger.error` émis pour une 404 attendue (fausse alerte Sentry) + couleurs codées en dur | Journalisation au mauvais niveau | Passage en `logger.warn`, couleurs remplacées par les jetons du design system | `e2e/run_public.py` | Console propre, page thématisée |
| Authentification | `/auth` | Ouverture | Fonctionnel | — | — | — | `e2e/run_public.py` | Formulaire rendu |
| Authentification | `/auth` | Soumission formulaire vide | Fonctionnel | — | Validation native (`required`) | — | `e2e/run_public.py` | Soumission bloquée, aucun rechargement |
| Authentification | `/auth` | Soumission identifiants invalides | Fonctionnel | — | Rejet 400 attendu de l'API | — | `e2e/run_public.py` | Message d'erreur affiché, aucun rechargement |

### 2.2 Portail membre (scénarios prêts, exécution en attente d'identifiants)

| Module | Page | Action couverte par le scénario | État | Motif |
|---|---|---|---|---|
| Portail membre | Tableau de bord | Ouverture, contrôle page blanche / console | Non vérifié | Identifiants de test absents |
| Portail membre | Profil | Ouverture, ouverture de dialogue | Non vérifié | Identifiants de test absents |
| Portail membre | Ma situation | Ouverture, export PDF | Non vérifié | Identifiants de test absents |
| Portail membre | Mes cotisations | Ouverture | Non vérifié | Identifiants de test absents |
| Portail membre | Mes épargnes | Ouverture | Non vérifié | Identifiants de test absents |
| Portail membre | Mes prêts | Ouverture | Non vérifié | Identifiants de test absents |
| Portail membre | Mes demandes de prêt | Ouverture, bouton « Nouvelle demande » | Non vérifié | Identifiants de test absents |
| Portail membre | Mes avalisations | Ouverture | Non vérifié | Identifiants de test absents |
| Portail membre | Mes aides | Ouverture | Non vérifié | Identifiants de test absents |
| Portail membre | Mes sanctions | Ouverture | Non vérifié | Identifiants de test absents |
| Portail membre | Mes présences | Ouverture | Non vérifié | Identifiants de test absents |
| Portail membre | Mes dons | Ouverture | Non vérifié | Identifiants de test absents |

### 2.3 Administration (scénarios prêts, exécution en attente d'identifiants)

| Module | Écrans couverts | Actions couvertes | État | Motif |
|---|---|---|---|---|
| Membres | Membres, Utilisateurs, Rôles, Permissions | Ouverture, bouton de création, fermeture de dialogue | Non vérifié | Identifiants de test absents |
| Cotisations | Cotisations, Paramètres d'exercice | Ouverture, création | Non vérifié | Identifiants de test absents |
| Tontine | Épargnes, Bénéficiaires, Configuration | Ouverture, création | Non vérifié | Identifiants de test absents |
| Finances | Caisse, Prêts, Config prêts, Demandes de prêt, Workflow, Aides, Dons, Mobile Money, Adhésions, Config paiement | Ouverture, création | Non vérifié | Identifiants de test absents |
| Réunions | Réunions, Présences | Ouverture, création | Non vérifié | Identifiants de test absents |
| Sport | Sport, E2D, Phoenix, Équipes, Entraînements, Sanctions, Match gala | Ouverture, création | Non vérifié | Identifiants de test absents |
| Communication | Notifications, Modèles | Ouverture, création | Non vérifié | Identifiants de test absents |
| Pilotage | Statistiques, Rapports, Exports, Monitoring, Suivi du programme | Ouverture | Non vérifié | Identifiants de test absents |
| CMS site | Hero, Activités, Événements, Galerie, Partenaires, À propos, Messages, Images, Configuration | Ouverture, création | Non vérifié | Identifiants de test absents |
| Associations | Identité & thème, Configuration E2D | Ouverture, enregistrement | Non vérifié | Identifiants de test absents |
| Plateforme | Associations (console super admin) | Ouverture, création, changement de statut | Non vérifié | Identifiants super admin absents |
| Contrôle d'accès | Route réservée, route inconnue du portail | Page « Accès refusé », page 404 du portail | Non vérifié | Identifiants de test absents |

## 3. Corrections apportées pendant cette revue

1. `src/components/Partners.tsx` — logo de partenaire tolérant aux URL invalides (repli texte, chargement différé).
2. `src/pages/NotFound.tsx` — 404 journalisée en `warn` au lieu de `error`, page passée aux jetons du design system.
3. `e2e/` — harnais de test réutilisable : détection de rechargement (marqueur SPA), page blanche, erreurs console et réseau, boutons inertes, redirections incorrectes.

## 4. Points restants

- Fournir un compte de test membre et un compte administrateur / super admin
  pour exécuter les 59 écrans authentifiés du tableau.
- Corriger dans le CMS l'URL du logo partenaire pointant vers une page
  Facebook (donnée, pas code).

Voir aussi `docs/REVUE_NAVIGATION_2026_08.md` pour la revue statique
précédente (rechargements, `window.confirm`, `type="button"`, ErrorBoundary,
cycle de vie des associations).
