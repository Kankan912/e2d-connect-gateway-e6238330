# Tests E2E Playwright

Harnais de vérification de navigation de la plateforme : détection des
rechargements de page, pages blanches, boutons inertes, erreurs console et
requêtes réseau en échec.

## Prérequis

- Serveur de développement démarré (`http://localhost:8080` par défaut,
  surchargeable via `E2E_BASE_URL`).
- Python avec Playwright installé (`python -m pip install playwright && python -m playwright install chromium`).

## Parcours publics

```bash
python e2e/run_public.py
```

Couvre : accueil, don, adhésion, site par slug, association inconnue,
page 404, écran de connexion et navigation interne sans rechargement.

## Parcours authentifiés

Les identifiants sont lus dans l'environnement et ne sont jamais journalisés.

```bash
E2E_EMAIL="..." E2E_PASSWORD="..." E2E_ROLE=administrateur python e2e/run_authenticated.py
```

`E2E_ROLE` vaut `membre`, `administrateur` ou `super_admin` et détermine
l'étendue des routes visitées (portail, administration, console plateforme).

## Sorties

- Résultats JSON : `/tmp/browser/e2e/*.json` (surchargeable via `E2E_OUT_DIR`).
- Captures d'écran : `/tmp/browser/e2e/screenshots/`.

Chaque entrée porte un état : `Fonctionnel`, `Partiellement fonctionnel`,
`Non fonctionnel` ou `Non vérifié`.
