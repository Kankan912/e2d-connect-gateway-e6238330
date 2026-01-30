
# Plan de Mise à Jour du Cahier des Charges Complet

## Contexte

Le cahier des charges actuel (`CAHIER_DES_CHARGES_PROJET_COMPLET.md`) est en version 2.2 (Janvier 2026) mais de nombreuses fonctionnalités ont été implémentées depuis, notamment :
- Module Sport E2D complet avec statistiques et classements
- Module Sport Phoenix avec gestion des équipes Jaune/Rouge
- Synchronisation des matchs vers le site public
- Affichage des Comptes Rendus et Statistiques sur le site public
- Système de Réunions avec présences, sanctions, cotisations
- Système de Prêts avec alertes et paiements
- Système de Caisse avec synthèse et opérations
- Gestion des Bénéficiaires avec calendrier
- Système de Notifications avec templates et campagnes
- Et bien d'autres...

---

## Nouvelles Sections à Ajouter

### Section 13 : MODULE SPORT E2D (NOUVEAU)

**Fonctionnalités implémentées** :
- Gestion des matchs E2D (CRUD complet)
- Synchronisation automatique vers le site web public
- Statistiques individuelles des joueurs :
  - Buts, Passes décisives, Cartons jaunes/rouges
  - Homme du match (MOTM)
- Classements :
  - Buteurs, Passeurs, Général (performance), Discipline
- Compte rendu de match :
  - Résumé, Faits marquants, Score mi-temps
  - Conditions de jeu, Ambiance, Arbitrage
- Galerie médias par match (photos/vidéos)
- Configuration équipe (nom, logo, saison)

**Tables concernées** :
- `sport_e2d_matchs`, `sport_e2d_config`
- `match_statistics`, `match_compte_rendus`, `match_medias`
- Vue `e2d_player_stats_view`

**Pages admin** :
- `/sport-e2d` - Dashboard et liste des matchs
- `/dashboard/admin/sport/e2d-config` - Configuration

---

### Section 14 : MODULE SPORT PHOENIX (NOUVEAU)

**Fonctionnalités implémentées** :
- Gestion des matchs inter-équipes (Jaune vs Rouge)
- Gestion des adhérents Phoenix
- Tableau de bord Jaune/Rouge
- Entraînements internes
- Classements par équipe
- Compositions d'équipe
- Cotisations annuelles Phoenix
- Dashboard annuel avec statistiques
- Gestion des présences aux entraînements

**Tables concernées** :
- `sport_phoenix_matchs`, `sport_phoenix_config`
- `phoenix_adherents`, `phoenix_entrainements_internes`
- `phoenix_presences`, `phoenix_equipes`

**Pages admin** :
- `/sport-phoenix` - Dashboard Phoenix
- `/dashboard/admin/sport/entrainements` - Entraînements
- `/dashboard/admin/sport/sanctions` - Sanctions sportives

---

### Section 15 : SYNCHRONISATION SITE WEB (NOUVEAU)

**Architecture implémentée** :
- Champs ajoutés à `site_events` : `match_id`, `match_type`, `auto_sync`
- Fonction `syncAllSportEventsToWebsite()` dans `sync-events.ts`
- Hook `useSportEventSync()` pour synchronisation automatique
- Page publique `/evenements/:id` (EventDetail.tsx) affichant :
  - Informations du match (date, lieu, adversaire)
  - Score final (si match terminé)
  - Compte rendu complet (résumé, faits marquants, etc.)
  - Statistiques individuelles (buteurs, passeurs, cartons)
  - Galerie médias du match
  - Homme du match

---

### Section 16 : MODULE RÉUNIONS (NOUVEAU)

**Fonctionnalités implémentées** :
- CRUD réunions (type, date, lieu, ordre du jour)
- Gestion des présences par réunion
- Enregistrement des cotisations en réunion
- Gestion des sanctions (amendes)
- Clôture et réouverture de réunion
- Notification par email aux membres
- Compte rendu de réunion (édition et consultation)
- Vues récapitulatives :
  - État des absences
  - Récap mensuel/annuel des présences
  - Historique par membre

**Tables concernées** :
- `reunions`, `reunions_presences`, `reunions_sanctions`
- `cotisations` (avec `reunion_id`)

**Pages** :
- `/reunions` - Gestion complète

---

### Section 17 : MODULE PRÊTS (NOUVEAU)

**Fonctionnalités implémentées** :
- Création de prêts aux membres
- Gestion des échéances et paiements
- Alertes pour échéances proches/dépassées
- Historique complet des remboursements
- Export PDF des prêts
- Dashboard avec KPIs (total prêté, en cours, remboursé)

**Tables concernées** :
- `prets`, `prets_paiements`

**Pages admin** :
- `/dashboard/admin/prets` - Gestion des prêts
- `/dashboard/admin/prets-config` - Configuration

**Pages membre** :
- `/dashboard/my-prets` - Mes prêts

---

### Section 18 : MODULE CAISSE (NOUVEAU)

**Fonctionnalités implémentées** :
- Enregistrement des opérations de caisse
- Types d'opérations (entrée/sortie)
- Catégorisation des opérations
- Panel latéral de détails
- Synthèse avec modal détaillée
- Dashboard avec solde temps réel

**Tables concernées** :
- `caisse_operations`, `caisse_categories`

**Pages admin** :
- `/dashboard/admin/caisse` - Gestion caisse

---

### Section 19 : MODULE BÉNÉFICIAIRES (NOUVEAU)

**Fonctionnalités implémentées** :
- Calendrier des bénéficiaires (tontine)
- Calcul automatique des bénéfices
- Gestion des dates d'attribution
- Widget dans les réunions
- Email de notification automatique

**Tables concernées** :
- `calendrier_beneficiaires`, `epargnants_benefices`

**Edge Functions** :
- `send-calendrier-beneficiaires`

---

### Section 20 : MODULE NOTIFICATIONS (NOUVEAU)

**Fonctionnalités implémentées** :
- Templates d'emails personnalisables
- Campagnes de notification en masse
- Historique des envois
- Centre de notifications en temps réel
- Types de notifications :
  - Rappel cotisations
  - Rappel présences
  - Échéances prêts
  - Compte rendu réunion
  - Sanctions
  - Contact site web

**Edge Functions** :
- `send-cotisation-reminders`
- `send-presence-reminders`
- `send-pret-echeance-reminders`
- `send-reunion-cr`
- `send-sanction-notification`
- `send-campaign-emails`

**Pages admin** :
- `/dashboard/admin/notifications` - Envoi notifications
- `/dashboard/admin/notifications-templates` - Templates

---

### Section 21 : MODULE AIDES (NOUVEAU)

**Fonctionnalités implémentées** :
- Demandes d'aide des membres
- Workflow de validation (admin)
- Suivi des aides accordées

**Pages** :
- `/dashboard/admin/aides` - Gestion des aides
- `/dashboard/my-aides` - Mes aides (membre)

---

### Section 22 : SYSTÈME DE PERMISSIONS AVANCÉ (NOUVEAU)

**Fonctionnalités implémentées** :
- Matrice de permissions granulaire
- 7+ rôles définis (admin, trésorier, secrétaire, responsable sportif, censeur, commissaire, membre)
- Permissions par ressource (finances, réunions, sport, site, etc.)
- Export Excel de la matrice
- Badge dynamique selon rôle
- Sidebar adaptative selon permissions

**Tables concernées** :
- `roles`, `permissions`, `role_permissions`, `user_roles`

**Pages admin** :
- `/dashboard/admin/permissions` - Matrice permissions
- `/dashboard/admin/roles` - Gestion des rôles

---

### Section 23 : ESPACES PERSONNELS MEMBRES (NOUVEAU)

**Pages implémentées** :
- `/dashboard/profile` - Mon profil
- `/dashboard/my-donations` - Mes dons
- `/dashboard/my-cotisations` - Mes cotisations
- `/dashboard/my-epargnes` - Mes épargnes
- `/dashboard/my-prets` - Mes prêts
- `/dashboard/my-aides` - Mes aides
- `/dashboard/my-presences` - Mes présences
- `/dashboard/my-sanctions` - Mes sanctions

---

### Section 24 : CONFIGURATION AVANCÉE (NOUVEAU)

**Fonctionnalités de configuration** :
- Gestion des exercices comptables
- Types de cotisations configurables
- Cotisations mensuelles par exercice
- Tarifs des sanctions
- Configuration email (SMTP)
- Configuration des sessions utilisateur
- Sauvegardes (export/import)
- Gestion générale

**Pages admin** :
- `/dashboard/admin/site/config` - Configuration site
- Composants de configuration dans `/src/components/config/`

---

## Mises à Jour des Sections Existantes

### Section 5.1.4 : Navigation (Navbar) - MISE À JOUR

Ajouter :
- Lien vers `/sport-e2d` et `/sport-phoenix` pour les admins
- Affichage dynamique selon permissions utilisateur

### Section 5.3 : BACKOFFICE ADMIN - MISE À JOUR

**Sidebar complète mise à jour** :
```
📊 Tableau de bord
👤 Mon Espace
  - Mon Profil
  - Mes Dons
  - Mes Cotisations
  - Mes Épargnes
  - Mes Prêts
  - Mes Aides
  - Mes Présences
  - Mes Sanctions
📅 Réunions
  - Gestion Réunions
  - Présences
⚽ Sport
  - E2D
  - Phoenix
  - Équipes
💰 Finances
  - Caisse
  - Dons
  - Adhésions
  - Prêts
  - Épargnes
  - Bénéficiaires
👥 Administration
  - Membres
  - Utilisateurs
  - Rôles
  - Permissions
🌐 Site Web
  - Hero
  - À Propos
  - Activités
  - Événements
  - Galerie
  - Partenaires
  - Configuration
  - Images
  - Messages
📧 Notifications
  - Envoyer
  - Templates
📊 Rapports & Exports
⚙️ Configuration
```

### Section 6.1 : BASE DE DONNÉES - MISE À JOUR

**Nouvelles tables à documenter** (30+ tables ajoutées) :
- Sport : `sport_e2d_matchs`, `sport_e2d_config`, `sport_phoenix_*`, `match_statistics`, `match_compte_rendus`, `match_medias`
- Réunions : `reunions`, `reunions_presences`, `reunions_sanctions`
- Prêts : `prets`, `prets_paiements`
- Caisse : `caisse_operations`, `caisse_categories`
- Bénéficiaires : `calendrier_beneficiaires`, `epargnants_benefices`
- Notifications : `notifications_templates`, `notifications_historique`
- Permissions : `roles`, `permissions`, `role_permissions`
- Aides : `aides`
- Configuration : `exercices_cotisations_types`, `cotisations_mensuelles`

### Section 6.3 : EDGE FUNCTIONS - MISE À JOUR

**Nouvelles fonctions déployées** (17 fonctions) :
- `create-platform-user` - Création utilisateur plateforme
- `create-user-account` - Création compte utilisateur
- `donations-stats` - Statistiques dons
- `get-payment-config` - Configuration paiements
- `process-adhesion` - Traitement adhésion
- `send-calendrier-beneficiaires` - Notification calendrier
- `send-campaign-emails` - Campagnes email
- `send-contact-notification` - Notification contact
- `send-cotisation-reminders` - Rappels cotisations
- `send-email` - Envoi email générique
- `send-presence-reminders` - Rappels présences
- `send-pret-echeance-reminders` - Rappels échéances prêts
- `send-reunion-cr` - Compte rendu réunion
- `send-sanction-notification` - Notification sanction
- `sync-user-emails` - Synchronisation emails
- `update-email-config` - MAJ config email

---

## Structure du Fichier Mis à Jour

Le fichier `CAHIER_DES_CHARGES_PROJET_COMPLET.md` sera restructuré :

1. **Version** : Passer de 2.2 à 3.0
2. **Date** : Janvier 2026 (mise à jour)
3. **Nouvelles sections** : 13 à 24 (12 nouvelles sections)
4. **Mise à jour** : Sections 5, 6, 10, 11
5. **État d'avancement** : Mettre à jour le pourcentage de complétion (~95%)

---

## Livrables

### Fichier Principal
- `CAHIER_DES_CHARGES_PROJET_COMPLET.md` - Version 3.0 complète (~3000 lignes)

### Fichiers Secondaires à Mettre à Jour
- `CAHIER_DES_CHARGES_SITE_WEB.md` - Ajouter section Sport/Événements
- `CMS_IMPLEMENTATION.md` - Ajouter synchronisation Sport
- `docs/IMPLEMENTATION_CHECKLIST.md` - Ajouter modules implémentés

---

## Temps Estimé

| Tâche | Durée |
|-------|-------|
| Rédaction sections 13-24 (Sport, Réunions, Prêts, etc.) | 2h |
| Mise à jour sections existantes (5, 6, 10, 11) | 1h |
| Mise à jour diagrammes et schémas | 30min |
| Mise à jour fichiers secondaires | 30min |
| Relecture et corrections | 30min |
| **Total** | **4h30** |

---

## Note Technique

Le cahier des charges mis à jour reflétera fidèlement l'état actuel de l'application E2D Connect, incluant :
- **33+ hooks personnalisés** pour la gestion des données
- **70+ composants React** (UI + métier)
- **50+ tables Supabase** avec RLS
- **17 Edge Functions** déployées
- **23+ pages admin** fonctionnelles
- **9 espaces personnels** pour les membres
