# Confirmation de bascule + validations client email

## 1. Dialog de confirmation avant bascule SMTP ↔ Resend

Le bouton « Basculer sur SMTP / Resend » ne persiste plus le changement immédiatement. Il ouvre d'abord un `AlertDialog` (shadcn) qui explique l'impact :

- Le titre nomme le provider cible (`Basculer les envois d'emails sur Resend ?`).
- La description liste concrètement :
  - **Tous les emails applicatifs** (invitations, réinitialisations, notifications, compte-rendus, rappels de cotisation) partiront désormais via ce provider.
  - Les envois en cours de traitement (non encore consommés dans la file) utiliseront le nouveau provider.
  - Le provider précédent reste configuré et sert de **fallback automatique** en cas d'échec.
  - Pour Resend sans domaine vérifié : rappel que seuls les envois vers l'email du propriétaire du compte aboutiront.
  - Pour SMTP : rappel qu'il faut avoir testé la connexion au moins une fois.
- Deux actions : `Annuler` / `Confirmer la bascule`. Confirmation exécute l'`handleSwitchProvider` actuel.

Toast succès inchangé (« Provider actif : … »).

## 2. Validation client des champs

Introduction d'un schéma `zod` local (`emailConfigSchema`) validé au moment de :
- clic sur **Sauvegarder les modifications** (bouton global)
- clic sur **Tester …** (SMTP ou Resend) — validation partielle du provider concerné
- clic sur **Basculer sur …** (avant d'ouvrir le dialog)

Règles :

| Champ | Règle |
|---|---|
| `emailExpediteur` | requis, email valide (`z.string().trim().email()`), ≤ 255 car. |
| `emailExpediteurNom` | requis, non vide, ≤ 100 car. |
| `appUrl` | requis, URL valide http/https (`z.string().url().regex(/^https?:\/\//)`), ≤ 500 car. |
| `smtpHost` (si SMTP actif ou test SMTP) | requis, non vide, ≤ 255 car., pas d'espaces |
| `smtpPort` | entier `1..65535` (`z.coerce.number().int().min(1).max(65535)`) |
| `smtpUser` | requis, email valide, ≤ 255 car. |
| `smtpPassword` | requis uniquement si **nouvelle** config (pas de `smtpConfigId`) ; sinon optionnel (garde l'existant) |
| `smtpEncryption` | `tls` \| `ssl` \| `none` |
| `resendApiKey` (bouton Enregistrer la clé) | doit commencer par `re_`, ≥ 20 car. |

En cas d'échec :
- Toast erreur avec le premier message d'erreur explicite.
- Le champ fautif reçoit une bordure `border-destructive` et un texte d'aide `<p className="text-xs text-destructive">…</p>` sous l'input.
- État local `fieldErrors: Record<string, string>` remis à zéro à chaque nouvelle tentative de sauvegarde/test.

## 3. Masquage & rechargement du mot de passe SMTP

Actuellement le mot de passe SMTP :
- n'est jamais préchargé depuis la base (ok, déjà en place).
- reste en mémoire après sauvegarde et le champ garde la valeur en clair (masquée seulement par `type=password`).

Modifications :
- **Après succès** de `saveConfigMutation` ou de `runConfigurationTest('smtp'|'auto')` avec mot de passe fraîchement saisi : `setSmtpPassword("")` + `setShowPassword(false)` pour re-masquer visuellement.
- Le label du champ affiche déjà « laisser vide pour conserver l'existant » ; renforcer avec un petit indicateur `<Badge variant="outline">Défini</Badge>` à droite du label lorsque `smtpConfigId` existe et que `smtpPassword === ""`, pour indiquer qu'un mot de passe est en base sans le divulguer.
- Ajout d'un lien « Réinitialiser le mot de passe SMTP » à côté du champ : simple `<Button variant="link" size="sm">` qui met le focus dans le champ et affiche un toast d'aide (« Saisissez le nouveau mot de passe puis Sauvegarder ») — pas d'appel API.

## Fichier touché

- `src/components/config/EmailConfigManager.tsx` (unique).
- Ajout imports : `AlertDialog`, `AlertDialogAction`, `AlertDialogCancel`, `AlertDialogContent`, `AlertDialogDescription`, `AlertDialogFooter`, `AlertDialogHeader`, `AlertDialogTitle`, `AlertDialogTrigger` depuis `@/components/ui/alert-dialog` ; `z` depuis `zod` (déjà dans les deps).

## Vérification

- Typecheck OK.
- Clic sur `Basculer sur Resend` avec provider = SMTP → dialog s'affiche avec impact ; `Annuler` ne change rien ; `Confirmer` bascule et affiche le toast.
- Saisir un port `70000` puis Tester SMTP → erreur inline + toast.
- Saisir `email_expediteur = "pas un email"` puis Sauvegarder → erreur inline + toast, aucune requête envoyée.
- Après Sauvegarder avec nouveau mot de passe SMTP → champ mot de passe revient à vide + `type=password`.
- Le mot de passe existant en base n'est jamais renvoyé au client (déjà le cas).

## Hors périmètre

- Pas de changement des edge functions / RLS / schéma.
- Pas de modification de la logique de fallback ni des tests.
- Pas de renommage des champs base.
- Pas de rotation ni de touche à la clé Resend actuelle en base.
