
# Configuration Gmail SMTP

## Prérequis côté Google

Gmail nécessite un **mot de passe d'application** pour l'accès SMTP (comme Outlook).

### Étape 1 : Activer la validation en 2 étapes
1. Aller sur [myaccount.google.com/security](https://myaccount.google.com/security)
2. Section "Comment vous connecter à Google"
3. Activer "Validation en 2 étapes"

### Étape 2 : Créer un mot de passe d'application
1. Aller sur [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
2. Sélectionner "Autre (nom personnalisé)" → entrer "E2D SMTP"
3. Cliquer "Générer"
4. **Copier le mot de passe de 16 caractères** affiché

## Configuration dans l'application

Une fois le mot de passe d'application obtenu, configurer dans **Configuration E2D → Email** :

| Paramètre | Valeur |
|-----------|--------|
| Service | SMTP |
| Serveur SMTP | `smtp.gmail.com` |
| Port | `587` |
| Encryption | TLS (STARTTLS) |
| Utilisateur | Votre adresse Gmail complète |
| Mot de passe | Le mot de passe d'application (16 caractères) |

## Pourquoi Gmail devrait fonctionner

Contrairement à Outlook qui a désactivé l'authentification basique pour tous les comptes personnels, Gmail continue de supporter :
- `AUTH PLAIN` via TLS/STARTTLS
- `AUTH LOGIN` comme fallback
- Les mots de passe d'application comme méthode d'authentification sécurisée

Le code actuel dans `email-utils.ts` gère déjà ces deux méthodes d'authentification.

## Actions requises

1. **Vous** : Créer le mot de passe d'application Google (voir étapes ci-dessus)
2. **Vous** : Mettre à jour la configuration SMTP dans l'interface avec les paramètres Gmail
3. **Test** : Utiliser le bouton "Tester la connexion" pour valider

## Section technique

Aucune modification de code n'est nécessaire. L'implémentation SMTP native dans `supabase/functions/_shared/email-utils.ts` :
- Supporte `AUTH PLAIN` (prioritaire) et `AUTH LOGIN` (fallback)
- Gère STARTTLS sur port 587
- Gère SSL direct sur port 465
- Résout les DNS manuellement pour compatibilité Deno

Les paramètres Gmail seront stockés dans la table `smtp_config` existante.
