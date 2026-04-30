# Refactor complet du système d'envoi d'emails

## État actuel (audit)

Bonnes nouvelles — la base existe déjà :
- `supabase/functions/_shared/email-utils.ts` centralise déjà `sendEmail()` avec routing Resend/SMTP, retry exponentiel, et logging dans `notifications_envois`.
- 11 Edge Functions sur 12 passent par ce service.
- Une UI `EmailConfigManager.tsx` permet déjà de configurer + tester.

Problèmes confirmés :
1. **`send-user-credentials/index.ts` (ligne 118)** appelle `fetch("https://api.resend.com/emails", …)` directement → bypass du service central.
2. **Doublon de clé de config** : la table `configurations` contient à la fois `email_mode = resend` et `email_service = smtp`. Le backend lit `email_service`, l'ancien endpoint `update-email-config` écrit `email_mode`. Source de bugs silencieux.
3. **Pas de table dédiée `email_logs`** : tout est mélangé dans `notifications_envois` (qui sert aussi aux campagnes/SMS), avec des colonnes inadaptées (`canal`, `membre_id`, `campagne_id` obligatoires en pratique).
4. **Pas d'endpoint `testEmailConfiguration` dédié** : la logique de test est dupliquée dans le composant React (`testResendConnection`, `testSmtpConnection`, `sendTestEmail` ≈ 200 lignes).
5. **Pas de fallback** Resend → SMTP en cas d'échec.
6. **UX** : pas d'indicateur "Config valide / invalide" en haut de page ; les retours d'erreur sont génériques.

## Architecture cible

```text
Frontend (EmailConfigManager)
        │
        ▼
 Edge Function `test-email-configuration`  ◄── nouveau, endpoint unique
        │
        ▼
 _shared/email-utils.ts  ── sendEmail({ to, subject, html })
        │
        ├── sendViaResend()   ─── api.resend.com
        ├── sendViaSMTP()     ─── TCP/TLS
        └── (option) fallback Resend → SMTP
        │
        ▼
 Table `email_logs`  (nouvelle, dédiée aux emails transactionnels)
```

Règle d'or après refacto : **aucune Edge Function n'appelle Resend ou SMTP directement**, tout passe par `sendEmail()` / `sendEmailAuto()`.

## Plan d'exécution

### 1. Base de données (migration)

- **Créer `public.email_logs`** :
  - `id uuid pk`, `to_email text not null`, `subject text not null`, `status text check in ('success','failed')`, `error_message text`, `provider text`, `attempts int default 1`, `metadata jsonb`, `created_at timestamptz default now()`.
  - RLS : SELECT réservé aux admins (`is_admin()`), INSERT par service role uniquement (pas de policy permissive).
  - Index sur `created_at desc` et `status`.
- **Normaliser `configurations`** : SQL one-shot pour copier `email_mode` → `email_service` si manquant, puis supprimer la clé `email_mode`. Documenter `email_service` comme **seule** source de vérité (`'resend' | 'smtp'`).
- Conserver `smtp_config` (déjà bien structurée et RLS admin-only) — pas besoin d'une nouvelle table `email_config`.

### 2. Refactor `_shared/email-utils.ts`

- Renommer la signature publique vers le contrat demandé : `sendEmail({ to, subject, html, text? })` qui charge la config, route, log, retourne `{ success, message }`. (L'ancienne `sendEmail(config, params)` reste exposée comme `sendEmailWithConfig` pour rétro-compat.)
- Ajouter logging dans la nouvelle table `email_logs` (en plus de `notifications_envois` pour rétro-compat).
- Ajouter une option `enableFallback` (défaut `true`) : si `service=resend` échoue après tous les retries ET que `smtp_config` actif est défini → retenter via SMTP, log les deux tentatives.
- Suppression de la confusion `email_mode` : ne lire que `email_service`.

### 3. Refactor `send-user-credentials`

- Remplacer l'appel `fetch("https://api.resend.com/emails", …)` par `sendEmailAuto({ to, subject, html })`.
- Supprimer l'import / lecture directe de `RESEND_API_KEY`.

### 4. Nouvelle Edge Function `test-email-configuration`

- Endpoint POST `{ provider?: 'resend' | 'smtp' | 'auto', to: string }`.
- Auth admin obligatoire (réutilise le pattern de `update-email-config`).
- Charge la config, force le service demandé (ou utilise actif), envoie un email standardisé "Test de configuration", retourne :
  ```json
  { "success": true|false, "message": "...", "provider": "resend|smtp", "duration_ms": 1234 }
  ```
- Inscrit dans `supabase/config.toml` avec `verify_jwt = false` (auth gérée en code).

### 5. UX — `EmailConfigManager.tsx`

- Ajouter un bandeau de statut en haut : badge vert "✔ Configuration valide" ou rouge "❌ Configuration invalide" + raison, calculé à partir de la config chargée.
- Remplacer les 3 fonctions `testResendConnection / testSmtpConnection / sendTestEmail` par **un seul** bouton "Tester la configuration" → appelle `test-email-configuration`. Conserver une option "tester l'autre provider" pour vérifier le fallback.
- Toasts standardisés : succès vert avec provider utilisé + durée, erreur rouge avec message backend.
- Indiquer visuellement quand le fallback s'est déclenché (badge "envoyé via SMTP suite à échec Resend").

### 6. Sécurité / cohérence

- Supprimer la lecture des secrets SMTP côté frontend : le composant ne lit plus `mot_de_passe_smtp`. Champ password vide à l'affichage avec placeholder "•••••••• (inchangé)" ; n'écrit que si rempli.
- Vérifier RLS sur `smtp_config` : déjà `is_admin()` only — OK.

### 7. Vérifications post-refactor (test runtime)

- Tester via `supabase--curl_edge_functions` : `test-email-configuration` avec provider=resend, smtp, et auto.
- Vérifier qu'une ligne apparaît dans `email_logs` pour chaque tentative.
- Forcer un échec Resend (clé invalide) pour vérifier fallback SMTP.
- Tester `send-user-credentials` après refacto.

## Fichiers touchés

| Fichier | Action |
|---|---|
| `supabase/migrations/<new>.sql` | Créer `email_logs`, nettoyer `email_mode` |
| `supabase/functions/_shared/email-utils.ts` | Ajouter logging `email_logs`, fallback, contrat `sendEmail({to,subject,html})` |
| `supabase/functions/send-user-credentials/index.ts` | Remplacer fetch Resend direct par `sendEmailAuto` |
| `supabase/functions/test-email-configuration/index.ts` | **Nouveau** |
| `supabase/config.toml` | Enregistrer la nouvelle fonction |
| `src/components/config/EmailConfigManager.tsx` | Bandeau statut, bouton test unifié, ne plus lire le mdp SMTP |

## Hors-scope (volontairement)

- Pas de table `email_config` séparée : `configurations` + `smtp_config` couvrent le besoin et ont déjà RLS et UI.
- Pas de migration des données historiques de `notifications_envois` vers `email_logs` (les nouveaux logs vont dans la nouvelle table, l'historique reste lisible où il est).

Confirme avec **"go"** pour exécuter.
