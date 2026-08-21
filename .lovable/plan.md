# Notifications de réunion : variables manquantes et diffusion du compte-rendu

## Constat vérifié

- `supabase/functions/send-campaign-emails/index.ts` ne remplace que `{prenom}`, `{nom}`, `{email}`, `{app_url}`. Les modèles contenant `{date_reunion}`, `{lieu}`, `{ordre_du_jour}` partent donc tels quels — c'est exactement ce que montre l'email reçu.
- La table `notifications_campagnes` n'a aucun lien vers une réunion : la fonction n'a aujourd'hui aucun moyen de connaître la réunion concernée.
- Le compte-rendu est envoyé aux seuls présents dans les trois chemins :
  - `useClotureReunion.ts` : requête `reunions_presences` filtrée sur `statut_presence = 'present'`.
  - `CompteRenduActions.tsx` : présélection = membres présents.
  - `NotifierReunionModal.tsx` : destinataires construits à partir des lignes de présence uniquement (même l'option « tous » ne couvre que les membres ayant une ligne de présence), et option par défaut « présents ».

## Correctifs prévus

### 1. Variables de réunion dans les emails de campagne
- Migration : ajout d'une colonne optionnelle `reunion_id` sur `notifications_campagnes`.
- Interface campagnes : sélecteur « Réunion concernée » (liste des réunions planifiées/récentes), facultatif.
- `send-campaign-emails` : si une réunion est liée — sinon repli sur la prochaine réunion planifiée de l'association — charger `date_reunion`, `lieu_description`, `ordre_du_jour`, `sujet` et résoudre les variables `{date_reunion}`, `{heure_reunion}`, `{lieu}`, `{ordre_du_jour}`, `{sujet_reunion}` (et leurs formes `{{...}}`), avec dates formatées en français.
- Les variables non résolues sont remplacées par un texte neutre (« à préciser ») plutôt que laissées visibles.
- Mise à jour de `variables_disponibles` des modèles de catégorie réunion pour refléter la liste exacte.

### 2. Rappels de réunion
`send-presence-reminders` inclut déjà date, heure, lieu et ordre du jour : ajout du sujet de la réunion et affichage explicite « non précisé » quand lieu ou ordre du jour manquent.

### 3. Compte-rendu envoyé à toute l'association
- `useClotureReunion.ts` : destinataires = tous les membres actifs de l'association avec email (au lieu des présents).
- `CompteRenduActions.tsx` : présélection de tous les membres actifs avec email ; les présents restent signalés visuellement.
- `NotifierReunionModal.tsx` : chargement des membres actifs en plus des présences ; l'option « Tous les membres » couvre réellement toute l'association et devient l'option par défaut ; les filtres « présents » / « absents » restent disponibles.
- L'email de compte-rendu affiche en plus l'heure et l'ordre du jour de la réunion dans son encart d'informations.

## Détails techniques

- Fichiers touchés : `supabase/functions/send-campaign-emails/index.ts`, `supabase/functions/send-reunion-cr/index.ts`, `supabase/functions/send-presence-reminders/index.ts`, `src/components/NotifierReunionModal.tsx`, `src/components/CompteRenduActions.tsx`, `src/components/reunions/cloture/useClotureReunion.ts`, écran d'administration des campagnes.
- Une migration ajoute `reunion_id uuid references public.reunions(id) on delete set null` sur `notifications_campagnes`.
- Toutes les requêtes membres restent filtrées par association et `statut = 'actif'`, en excluant les emails vides.
