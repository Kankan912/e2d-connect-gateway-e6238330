# Correction de l'erreur "Edge Function returned a non-2xx status code" lors du test SMTP

## Diagnostic

1. **Cause de l'affichage générique** : la fonction `test-email-configuration` renvoie des statuts HTTP `400` (validation) ou `502` (échec d'envoi) avec le vrai motif dans `data.message`. Or `supabase.functions.invoke()` considère tout statut non-2xx comme une `FunctionsHttpError` et **ne renseigne pas `data`** — le frontend tombe donc dans le `catch` générique et affiche le message technique du SDK.

2. **Cause probable côté Gmail** (config visible : `smtp.gmail.com` / `zpekinho@gmail.com` / TLS 587) : Google a désactivé l'accès par mot de passe simple. Il faut un **mot de passe d'application** (16 caractères, sans espaces) généré via [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords), avec la validation en 2 étapes activée. Un mot de passe de compte standard renvoie systématiquement `535-5.7.8 Username and Password not accepted`.

## Modifications

### 1. `supabase/functions/test-email-configuration/index.ts`
- Toujours renvoyer **HTTP 200** (le succès/échec est porté par `success: boolean` dans le corps JSON). Conserver 401/403 uniquement pour les rejets d'auth.
- Inclure dans la réponse un champ `details` avec le diagnostic SMTP brut (banner, étape échouée) déjà loggé, pour faciliter le débogage.

### 2. `src/components/config/EmailConfigManager.tsx`
- Dans `runConfigurationTest`, quand `supabase.functions.invoke` renvoie une `error`, lire le corps via `error.context?.response?.json()` (fallback `error.context?.text()`) pour récupérer le `message` réel et l'afficher dans le toast au lieu de « Edge Function returned a non-2xx status code ».
- Ajouter une **note d'aide contextuelle** sous le bouton « Tester la connexion SMTP » quand `smtpHost` contient `gmail.com` : « Gmail requiert un mot de passe d'application (16 caractères) — activez la validation 2 étapes puis générez-en un sur myaccount.google.com/apppasswords ».
- Garder le comportement existant de sauvegarde préalable du mot de passe avant le test.

### 3. (Optionnel) `supabase/functions/_shared/email-utils.ts`
- Dans `sendViaSMTP`, en cas d'échec d'authentification, enrichir le message d'erreur retourné avec une mention explicite quand `smtpHost.includes("gmail")` : suggérer un mot de passe d'application.

## Validation
- Tester avec mot de passe vide → toast affiche « Configuration SMTP incomplète… ».
- Tester avec mauvais mot de passe Gmail → toast affiche le 535 + suggestion mot de passe d'application.
- Tester avec mot de passe d'application valide → succès vert.

Aucune migration SQL, aucun changement de schéma.
