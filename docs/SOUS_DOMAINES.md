# Sous-domaines par association

L'application résout déjà l'association à partir de l'adresse visitée
(`src/lib/tenantScope.ts` → `slugFromHost`). Il ne reste que la configuration DNS
côté hébergeur du domaine.

## 1. Résolution du tenant (déjà en place)

Priorité de résolution :

1. URL explicite : `/s/<slug>` ou `?asso=<slug>`
2. Sous-domaine de l'hôte : `phoenix.mondomaine.com` → `phoenix`
3. Dernier tenant mémorisé (localStorage `lovable_public_association_slug`)
4. Association par défaut (`e2d`)

Préfixes ignorés (jamais considérés comme une association) : `www`, `app`, `api`,
`admin`, `preview`, `id-preview`, `lovable`, `mail`, `static`, `assets`, `cdn`,
`localhost`, ainsi que les hôtes sans sous-domaine, les IP et les URL d'aperçu
(`*--*.lovable.app`).

Tests : `src/lib/tenantScope.test.ts`.

## 2. Champ « Sous-domaine »

Saisi dans l'assistant de création et dans la fiche d'édition
(`AssociationWizard.tsx`, `AssociationsPlatformAdmin.tsx`). Validation via
`src/lib/subdomain.ts` :

- normalisation automatique (minuscules, accents retirés, tirets)
- format `[a-z0-9-]`, 3 à 63 caractères, pas de tiret en début/fin
- refus des préfixes réservés
- refus des doublons entre associations
- aperçu de l'adresse finale sous le champ

Le domaine générique affiché provient de la variable d'environnement
`VITE_BASE_DOMAIN` (sinon `<votre-domaine>`).

## 3. Réglages DNS chez l'hébergeur

| Type | Nom       | Valeur          |
| ---- | --------- | --------------- |
| A    | `phoenix` | `185.158.133.1` |
| A    | `*`       | `185.158.133.1` |

Un enregistrement par association, ou un joker `*` qui les couvre toutes.
Propagation jusqu'à 72 h ; le certificat https est délivré automatiquement.

## 4. Raccordement au projet

Chaque adresse doit être ajoutée dans les paramètres du projet, section Domaines
(un domaine joker n'est pas accepté : une entrée par association). Tant que ce
n'est pas fait, chaque site public reste accessible via `/s/<slug>`.

## 5. Aide intégrée

Écran d'aide accessible depuis Administration → Associations (Plateforme) →
bouton « Aide sous-domaines » (`_components/SubdomainHelpDialog.tsx`).
