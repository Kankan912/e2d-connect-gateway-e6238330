# Refonte UI — Configuration email (SMTP ⇄ Resend)

## Objectif

Rebâtir l'UI de `EmailConfigManager.tsx` (onglet **Email** dans `/dashboard/admin/e2d-config`) en un layout deux colonnes qui affiche **SMTP et Resend côte à côte en permanence**, avec un badge « Actif » sur le provider en cours et un bouton **Basculer sur ce provider** explicite dans la colonne inactive.

Aucun changement backend, aucune migration, aucun renommage de champ en base. Toute la logique existante (lecture `configurations`, `smtp_config`, mutations, tests, fallback) est réutilisée telle quelle.

## Design cible

```text
┌──────────────────────────────────────────────────────────────────────┐
│ Bandeau statut : ✔ Configuration valide — Provider actif : SMTP     │
│                                              [ Tester + fallback ]   │
└──────────────────────────────────────────────────────────────────────┘

┌─────────────────── SMTP ─────────────┐  ┌────────────── Resend ────────┐
│ [Badge vert : ACTIF]                 │  │ [Badge gris : En réserve]    │
│                                      │  │                              │
│ Serveur SMTP     [smtp.gmail.com  ]  │  │ Clé API   [re_xxxxx… 👁]     │
│ Port             [587             ]  │  │           Enregistrer la clé │
│ Utilisateur      [zpekinho@…      ]  │  │                              │
│ Mot de passe     [•••••••• 👁     ]  │  │ Info : mode test = envoi     │
│ Chiffrement      [ TLS ▼          ]  │  │ vers propriétaire uniquement │
│                                      │  │ tant qu'aucun domaine n'est  │
│ [ Tester SMTP ]                      │  │ vérifié.                     │
│                                      │  │                              │
│                                      │  │ [ Tester Resend ]            │
│                                      │  │ [ Basculer sur Resend ]      │
└──────────────────────────────────────┘  └──────────────────────────────┘

┌──────────────── Paramètres communs ──────────────────────────────────┐
│ URL de l'application  [https://…]                                    │
│ Nom expéditeur [E2D]      Email expéditeur [contact@…]               │
└──────────────────────────────────────────────────────────────────────┘

                                       [ Envoyer email de test ]  [ Sauvegarder ]
```

## Comportements

1. **Toujours afficher les deux colonnes** — les champs de chaque provider restent modifiables même quand il est inactif, pour permettre de préparer la bascule.
2. **Badge d'état par colonne** :
   - Provider actif → badge vert `Actif` + bordure `border-primary`.
   - Provider inactif → badge gris `En réserve` + bordure neutre.
3. **Bouton « Basculer sur ce provider »** :
   - Visible uniquement dans la colonne inactive.
   - Action : `setEmailService(...)` + appel immédiat de `saveConfigMutation` (persiste dans `configurations.email_service`) + toast confirmant la bascule.
   - Désactivé tant que les champs minimaux du provider cible ne sont pas remplis (SMTP : host/user, Resend : clé commençant par `re_`).
4. **Boutons de test conservés** dans chaque colonne (`Tester SMTP`, `Tester Resend`) + le bouton global `Tester la configuration` (auto + fallback) reste dans le bandeau supérieur.
5. **Ordre visuel** : SMTP à gauche, Resend à droite (SMTP est actuellement le provider actif ; on met en avant la config qui compte au quotidien).
6. **Responsive** : sur mobile (`< md`), les deux colonnes s'empilent, badge en haut de chaque carte, boutons pleine largeur.

## Détails techniques

- Un seul fichier touché : `src/components/config/EmailConfigManager.tsx`.
- Retirer le `RadioGroup` du bloc « Service d'envoi » et le remplacer par les cartes SMTP/Resend affichées en permanence dans `grid gap-6 lg:grid-cols-2`.
- Nouveau composant local `ProviderCard` (dans le même fichier) qui encapsule : badge, contenu spécifique (children), boutons de test / bascule. Isole la duplication badge + bouton bascule.
- Utiliser `Badge` de `@/components/ui/badge` (déjà présent dans le design system).
- La logique métier existante (`saveConfigMutation`, `testSmtpConnection`, `testResendConnection`, `runConfigurationTest`, chargement, fallback, gestion `email_mode`) est **conservée à l'identique** — c'est une refonte de présentation.
- Nouveau helper local `handleSwitchProvider(target: "smtp" | "resend")` qui met à jour l'état + lance `saveConfigMutation.mutate()` puis toast.
- Aucun changement à `email-utils.ts`, aux edge functions, ni aux tables.

## Vérification

- Typecheck OK (`tsgo`).
- Sur `/dashboard/admin/e2d-config` → onglet Email :
  - Les deux colonnes s'affichent en même temps.
  - Badge « Actif » sur SMTP (car `email_service = 'smtp'` en base).
  - Bouton « Basculer sur Resend » visible dans la colonne Resend, désactivé si le champ clé est vide.
  - Les 3 boutons de test fonctionnent comme avant.
  - Sauvegarde globale conserve tous les champs.

## Hors périmètre

- Pas de nouvelle route ni d'entrée sidebar (décision utilisateur : refonte in-place).
- Pas de touche à la clé Resend en base (décision utilisateur du Lot 1.5).
- Pas de modification schéma / RLS / edge functions.
- Pas de changement du logo, du thème ou des composants globaux.
