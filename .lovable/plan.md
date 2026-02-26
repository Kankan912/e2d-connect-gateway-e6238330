

# Correction urgente : Onglet "Caisse" invisible dans le sidebar

## Cause

La ressource `caisse` n'existe pas dans la table `role_permissions`. Le sidebar filtre les liens par permission (`hasPermission('caisse', 'read')`), et comme aucun role n'a cette permission, le lien est masque pour tous les utilisateurs.

Les ressources existantes sont : `adhesions`, `aides`, `config`, `cotisations`, `donations`, `epargnes`, `membres`, `presences`, `prets`, `reunions`, `roles`, `sanctions`, `site`, `sport_e2d`, `sport_entrainements`, `sport_phoenix`, `stats`.

## Deux options

**Option A (recommandee)** : Ajouter les permissions `caisse` dans `role_permissions` pour les roles concernes (administrateur, tresorier, commissaire_comptes au minimum). C'est la solution propre qui respecte le systeme de permissions existant.

**Option B (rapide)** : Changer le `resource` du lien Caisse dans le sidebar et la route de `"caisse"` vers `"epargnes"` (puisque la Caisse est dans la meme section que les Epargnes/Tontine et les memes roles y ont acces). Cela evite toute modification en base de donnees.

## Plan retenu : Option A

### Etape 1 — Ajouter les permissions en base

Inserer dans `role_permissions` les lignes pour la ressource `caisse` avec les 4 operations (read, create, update, delete) pour les roles qui doivent y avoir acces :
- `administrateur` : read, create, update, delete
- `tresorier` : read, create, update, delete
- `commissaire_comptes` : read
- `censeur` : read

### Etape 2 — Aucun changement de code

Le sidebar et la route utilisent deja `resource: "caisse"`. Une fois les permissions inserees, le lien apparaitra automatiquement pour les roles concernes.

## Impact

- Le lien "Caisse" reapparait immediatement dans le sidebar pour les roles autorises
- La route `/dashboard/admin/caisse` reste protegee par `PermissionRoute`
- Zero modification de fichier TypeScript

