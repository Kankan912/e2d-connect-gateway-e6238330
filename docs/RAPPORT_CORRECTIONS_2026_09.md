# Rapport de correction — demandes du 3 août (module Associations + revue de navigation)

Date : 11 septembre 2026. Vérifié directement en base et dans le code.

## 1. Module « Associations » (audit du 3 août)

| Lot | Objet | État | Preuve / reste à faire |
|---|---|---|---|
| 1 | Colonnes d'identité en base | Fait | `sigle, email_contact, telephone, adresse, ville, pays, site_template, subdomain, langue_principale, motif_statut, statut_change_le/par, supprime_le` présentes |
| 1 | Espace de stockage dédié aux logos | Partiel | L'envoi de logo fonctionne (composant LogoUploader) mais via un espace partagé ; l'espace `association-logos` dédié n'a pas été créé |
| 2 | Écran d'édition complet | Fait | Édition depuis la liste plateforme + « Identité & Thème » |
| 3 | Import du logo + charte générée | Fait | `src/lib/paletteFromLogo.ts`, bouton « Générer la charte depuis le logo » |
| 3 | Application de la charte partout | Fait | Jetons appliqués au thème global (admin, portail, site public) |
| 4 | Isolation du site public par association | Fait | Routes `/s/:slug`, contexte public, filtrage par association ; correction du changement d'association livrée le 11/09 |
| 4 | Provisioning créant le site par défaut | Fait (à surveiller) | Le provisioning crée le site ; **Phoenix**, créée avant, n'a toujours aucun contenu → site vide |
| 5 | 10 modèles de site | Fait | `src/lib/siteTemplates.ts`, sélection et aperçu |
| 6 | Assistant de création en 7 étapes | Fait | `AssociationWizard.tsx` |
| 7 | Langue principale | Partiel | `langue_principale` stockée et appliquée ; **espagnol non ajouté** (fr/en seulement) |
| — | Sous-domaine réel | Partiel | Colonne + contrôle en place ; le routage se fait par `/s/:slug`, le sous-domaine dépend de la configuration du domaine chez l'hébergeur |
| 8 | Tests et vérification | Partiel | Parcours publics et authentifiés joués (75 écrans sur 80 validés) |

## 2. Revue de navigation et cycle de vie (3 août)

| Étape | Objet | État |
|---|---|---|
| 1 | Rechargements de page supprimés | Fait — plus aucun `window.location` de navigation (seul l'`og:url` du référencement l'utilise) |
| 1 | `type="button"` sur les boutons non soumetteurs | Fait sur les modules traités (55 boutons) |
| 2 | Pages blanches : garde-fous par route, écrans « accès refusé » et « association indisponible » | Fait |
| 3 | Statuts d'association + fonctions serveur d'audit | Fait (`set_association_statut`, `hard_delete_association`, `count_association_dependencies`) |
| 4 | Actions par ligne dans l'écran plateforme (voir, modifier, désactiver, réactiver, supprimer) | Fait |
| 5 | Blocage d'une association désactivée (site public et portail) | Fait |
| 6 | Remplacement des confirmations natives | Fait — plus aucune confirmation native, tout passe par le dialogue unifié |
| 7 | Livrable `docs/REVUE_NAVIGATION_2026_08.md` | Fait |

## 3. Ce qui reste à faire

1. **Espagnol** : ajouter la troisième langue et la proposer à la création et à l'édition d'association. (½ journée)
2. **Espace de stockage dédié aux logos** avec droits d'écriture réservés aux administrateurs. (court)
3. **Contenu du site de Phoenix** : générer les enregistrements par défaut manquants pour que son site public ne soit plus vide. (court)
4. **Sous-domaines réels** : à activer une fois le domaine générique configuré chez l'hébergeur (dépend d'une action hors application).
5. **Vérification finale** : rejouer le parcours complet sur les 5 écrans encore non validés lors des tests.
