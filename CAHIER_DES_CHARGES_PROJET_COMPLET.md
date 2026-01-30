# 📋 CAHIER DES CHARGES - PROJET COMPLET
## Plateforme Web E2D Connect - Site Vitrine + Portail Membre + Gestion Association

**Version:** 3.0 - MISE À JOUR MAJEURE ✨  
**Date:** Janvier 2026  
**Type:** Application Web Complète - Site Public + Portail Membre + CMS + Backend  
**Statut:** Production (~95% complété)

> ✨ **MISE À JOUR v3.0** : 
> - Ajout des modules Sport E2D et Phoenix complets
> - Synchronisation des matchs vers le site web public
> - Système de réunions avec présences, sanctions, cotisations
> - Système de prêts avec alertes et paiements
> - Module caisse avec synthèse et opérations
> - Gestion des bénéficiaires avec calendrier tontine
> - Système de notifications avec templates et campagnes
> - Système de permissions granulaire (7+ rôles)
> - Espaces personnels membres (9 pages)
> - 50+ tables Supabase, 17 Edge Functions déployées

---

## 📌 TABLE DES MATIÈRES

### Partie I - Fondamentaux
1. [Contexte et Présentation](#1-contexte-et-présentation)
2. [Objectifs du Projet](#2-objectifs-du-projet)
3. [Public Cible](#3-public-cible)
4. [Architecture Globale](#4-architecture-globale)

### Partie II - Spécifications Fonctionnelles
5. [Site Web Public](#5-site-web-public)
6. [Portail Membre](#6-portail-membre)
7. [Backoffice Admin](#7-backoffice-admin)

### Partie III - Modules Métier
8. [Module Sport E2D](#8-module-sport-e2d)
9. [Module Sport Phoenix](#9-module-sport-phoenix)
10. [Synchronisation Site Web](#10-synchronisation-site-web)
11. [Module Réunions](#11-module-réunions)
12. [Module Prêts](#12-module-prêts)
13. [Module Caisse](#13-module-caisse)
14. [Module Bénéficiaires](#14-module-bénéficiaires)
15. [Module Notifications](#15-module-notifications)
16. [Module Aides](#16-module-aides)

### Partie IV - Infrastructure
17. [Système de Permissions](#17-système-de-permissions)
18. [Espaces Personnels Membres](#18-espaces-personnels-membres)
19. [Configuration Avancée](#19-configuration-avancée)
20. [Architecture Technique](#20-architecture-technique)
21. [Base de Données](#21-base-de-données)
22. [Edge Functions](#22-edge-functions)

### Partie V - Livrables
23. [Livrables et Documentation](#23-livrables-et-documentation)
24. [Planning et État d'Avancement](#24-planning-et-état-davancement)
25. [Contraintes et Prérequis](#25-contraintes-et-prérequis)

---

# PARTIE I - FONDAMENTAUX

---

## 1. CONTEXTE ET PRÉSENTATION

### 1.1 Présentation de l'Association

**E2D Connect** est une association regroupant deux entités complémentaires :
- **E2D** : Association principale axée sur la solidarité et l'entraide communautaire
- **Phoenix** : Club sportif de football affilié à E2D (équipes Jaune et Rouge)

L'association gère :
- Des activités sportives (matchs E2D contre équipes externes, matchs internes Phoenix, entraînements, tournois)
- Un système de tontine/épargne pour les membres avec calendrier des bénéficiaires
- Des réunions mensuelles avec gestion des présences et cotisations
- Un programme de prêts et d'aides entre membres
- Une caisse centrale avec suivi des opérations
- Des partenariats avec des organisations locales

### 1.2 Solution Complète

L'application E2D Connect comprend :

1. **Site Web Public** : Vitrine institutionnelle dynamique
2. **Portail Membre** : Espaces personnels pour chaque adhérent
3. **Backoffice Admin** : Gestion complète de l'association
4. **Modules Métier** : Sport, Réunions, Finances, Notifications
5. **CMS Intégré** : Gestion du contenu sans compétences techniques

### 1.3 Statistiques Techniques

| Catégorie | Nombre |
|-----------|--------|
| Tables Supabase | 50+ |
| Edge Functions | 17 |
| Hooks React | 35+ |
| Composants | 80+ |
| Pages Admin | 25+ |
| Espaces Membres | 9 |
| Rôles Utilisateurs | 7+ |

---

## 2. OBJECTIFS DU PROJET

### 2.1 Objectifs Business

- **Visibilité** : Site public professionnel avec résultats sportifs en temps réel
- **Gestion** : Centralisation de toutes les opérations associatives
- **Transparence** : Suivi en temps réel des contributions, prêts, épargnes
- **Engagement** : Espaces personnels pour chaque membre
- **Communication** : Système de notifications automatisées

### 2.2 Objectifs Techniques

- Application web moderne, rapide et responsive
- Architecture modulaire et évolutive
- Sécurité renforcée (RLS, permissions granulaires)
- Multi-device (desktop, tablette, mobile)
- Temps réel (Supabase Realtime)

### 2.3 Indicateurs de Succès

| KPI | Objectif | Actuel |
|-----|----------|--------|
| Disponibilité | > 99.5% | ✅ |
| Temps de chargement | < 2s | ✅ |
| Couverture fonctionnelle | > 95% | ✅ |
| Satisfaction utilisateurs | > 8/10 | En cours |

---

## 3. PUBLIC CIBLE

### 3.1 Visiteurs Anonymes
- **Profil** : Grand public, prospects
- **Besoins** : Découvrir l'association, voir les résultats, faire un don
- **Pages** : Site public, page don, page adhésion

### 3.2 Membres Authentifiés
- **Profil** : Adhérents E2D et/ou Phoenix
- **Besoins** : Consulter profil, cotisations, prêts, présences
- **Pages** : 9 espaces personnels (/dashboard/my-*)

### 3.3 Administrateurs
- **Rôles** : Admin, Trésorier, Secrétaire, Responsable Sportif, Censeur, Commissaire
- **Besoins** : Gérer selon leurs permissions spécifiques
- **Pages** : 25+ pages d'administration

---

## 4. ARCHITECTURE GLOBALE

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      PLATEFORME E2D CONNECT v3.0                        │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
        ┌───────────────────────────┼───────────────────────────┐
        │                           │                           │
        ▼                           ▼                           ▼
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│   SITE PUBLIC    │     │  PORTAIL MEMBRE  │     │   BACKOFFICE     │
│    (Vitrine)     │     │   (Dashboard)    │     │     ADMIN        │
├──────────────────┤     ├──────────────────┤     ├──────────────────┤
│ • Hero Carousel  │     │ • Profil         │     │ • Membres        │
│ • Événements     │     │ • Mes Cotisations│     │ • Finances       │
│ • Galerie Albums │     │ • Mes Prêts      │     │ • Sport E2D      │
│ • Partenaires    │     │ • Mes Présences  │     │ • Sport Phoenix  │
│ • Page Don       │     │ • Mes Sanctions  │     │ • Réunions       │
│ • Page Adhésion  │     │ • Mes Épargnes   │     │ • Notifications  │
│ • Détail Match   │     │ • Mes Aides      │     │ • CMS Site       │
└──────────────────┘     └──────────────────┘     │ • Permissions    │
                                                  │ • Configuration  │
                                                  └──────────────────┘
                                    │
            ┌───────────────────────┴───────────────────────┐
            │              BACKEND SUPABASE                  │
            ├────────────────────────────────────────────────┤
            │  📊 50+ Tables PostgreSQL avec RLS             │
            │  🔐 17 Edge Functions (Deno)                   │
            │  📁 5 Buckets Storage                          │
            │  🔑 Auth (Email/Password)                      │
            │  ⚡ Realtime Subscriptions                     │
            └────────────────────────────────────────────────┘
```

### 4.1 Modules Principaux

| Module | Description | État |
|--------|-------------|------|
| Site Public | Vitrine + CMS dynamique | ✅ 100% |
| Portail Membre | 9 espaces personnels | ✅ 100% |
| Sport E2D | Matchs externes + stats | ✅ 100% |
| Sport Phoenix | Matchs internes J/R | ✅ 100% |
| Réunions | Présences + cotisations | ✅ 100% |
| Finances | Caisse + prêts + épargnes | ✅ 100% |
| Notifications | Templates + campagnes | ✅ 100% |
| Permissions | Matrice 7+ rôles | ✅ 100% |

---

# PARTIE II - SPÉCIFICATIONS FONCTIONNELLES

---

## 5. SITE WEB PUBLIC

### 5.1 Page d'Accueil (`/`)

**Section Hero (site_hero)**
- Carousel d'images avec défilement automatique configurable
- Badge texte, Titre (H1), Sous-titre
- 2 boutons CTA configurables (texte + lien)
- 3 statistiques avec chiffres + labels
- Overlay gradient, typographie impact

**Section À Propos (site_about)**
- Histoire de l'association (titre + contenu markdown)
- Liste de valeurs avec icônes Lucide
- Grid 2 colonnes responsive

**Section Activités (site_activities)**
- Cards avec icône, titre, description, image
- Ordre configurable, toggle actif/inactif
- Responsive 1-3 colonnes

**Section Événements (site_events)**
- Liste chronologique des événements
- **Intégration matchs E2D** : Score affiché si terminé
- Lien vers `/evenements/:id` pour les détails complets
- Carousel miniatures configurable

**Section Galerie (site_gallery)**
- Organisation par albums
- Support photos et vidéos (YouTube/Vimeo)
- Lightbox avec navigation clavier
- Lazy loading optimisé

**Section Partenaires (site_partners)**
- Grid logos avec hover effect
- Lien vers site partenaire

**Section Contact**
- Formulaire (nom, email, téléphone, message)
- Stockage dans `messages_contact`
- Email notification via Edge Function

**Footer**
- Configuration dynamique via `site_config`
- Réseaux sociaux, coordonnées, liens rapides

### 5.2 Page Détail Événement (`/evenements/:id`)

**Nouveauté v3.0** - Affichage complet des matchs E2D :

- **Informations match** : Date, lieu, adversaire, score
- **Compte rendu** : Résumé, faits marquants, score mi-temps
- **Conditions** : Météo, état du terrain, ambiance, arbitrage
- **Statistiques joueurs** : Buteurs, passeurs, cartons
- **Homme du match** : Mise en avant du MVP
- **Galerie médias** : Photos et vidéos du match

### 5.3 Pages Secondaires

**Page Don (`/don`)**
- 5 montants prédéfinis avec badges
- Montant personnalisé + sélecteur devise
- 4 méthodes de paiement (Stripe, PayPal, HelloAsso, Virement)
- Option don récurrent
- Modal confirmation + email reçu fiscal

**Page Adhésion (`/adhesion`)**
- Choix type (E2D seul, Phoenix seul, E2D+Phoenix)
- Formulaire complet avec validation Zod
- Workflow automatisé : paiement → création membre → email bienvenue

---

## 6. PORTAIL MEMBRE

### 6.1 Authentification (`/auth`)

- Email + Password (Supabase Auth)
- Récupération mot de passe
- Changement mot de passe obligatoire à la première connexion
- Gestion des sessions avec timeout configurable

### 6.2 Dashboard (`/dashboard`)

**Composants Layout** :
- `DashboardLayout` : Structure principale
- `DashboardSidebar` : Navigation adaptative selon rôle/permissions
- `DashboardHeader` : Breadcrumb, avatar, déconnexion
- `NotificationCenter` : Notifications temps réel

**Affichage dynamique** :
- Message de bienvenue personnalisé
- Badge rôle avec emoji (👑 Admin, 💰 Trésorier, etc.)
- Statistiques personnelles
- Alertes et rappels

---

## 7. BACKOFFICE ADMIN

### 7.1 Sidebar Complète

```
📊 Tableau de bord
  └─ Vue d'ensemble

👤 Mon Espace
  ├─ Mon Profil
  ├─ Mes Dons
  ├─ Mes Cotisations
  ├─ Mes Épargnes
  ├─ Mes Prêts
  ├─ Mes Aides
  ├─ Mes Présences
  └─ Mes Sanctions

📅 Réunions
  ├─ Gestion Réunions
  └─ Présences (vue admin)

⚽ Sport
  ├─ E2D (matchs externes)
  ├─ Phoenix (matchs internes)
  ├─ Équipes
  ├─ Entraînements
  └─ Sanctions sportives

💰 Finances
  ├─ Caisse
  ├─ Dons
  ├─ Adhésions
  ├─ Prêts
  ├─ Épargnes
  └─ Bénéficiaires

👥 Administration
  ├─ Membres
  ├─ Utilisateurs
  ├─ Rôles
  └─ Permissions

🌐 Site Web (CMS)
  ├─ Hero
  ├─ À Propos
  ├─ Activités
  ├─ Événements
  ├─ Galerie
  ├─ Partenaires
  ├─ Configuration
  ├─ Images
  └─ Messages

📧 Notifications
  ├─ Envoyer
  └─ Templates

📊 Rapports & Exports

⚙️ Configuration
  ├─ Exercices
  ├─ Types cotisations
  ├─ Tarifs sanctions
  ├─ Email (SMTP)
  ├─ Sessions
  └─ Sauvegarde
```

### 7.2 Pages Admin Principales

| Route | Description | Permissions |
|-------|-------------|-------------|
| `/dashboard/admin/membres` | Gestion membres | membres.read |
| `/dashboard/admin/donations` | Gestion dons | finances.read |
| `/dashboard/admin/adhesions` | Validation adhésions | finances.create |
| `/dashboard/admin/caisse` | Opérations caisse | finances.read |
| `/dashboard/admin/prets` | Gestion prêts | finances.read |
| `/dashboard/admin/permissions` | Matrice permissions | admin |
| `/dashboard/admin/site/*` | CMS site web | site.update |
| `/dashboard/admin/notifications` | Envoi notifications | notifications.create |

---

# PARTIE III - MODULES MÉTIER

---

## 8. MODULE SPORT E2D

### 8.1 Description

Module complet de gestion des matchs E2D (équipe associative contre adversaires externes).

### 8.2 Fonctionnalités

**Gestion des Matchs**
- CRUD complet (création, modification, suppression)
- Types : Championnat, Coupe, Amical, Tournoi, Gala
- Statuts : À venir, En cours, Terminé, Reporté, Annulé
- Publication : Brouillon, Publié, Archivé

**Statistiques Joueurs**
- Buts, Passes décisives
- Cartons jaunes, Cartons rouges
- Homme du match (MOTM)
- Statistiques liées au membre (`membre_id`)

**Classements**
- 🥇 Buteurs : Classement par nombre de buts
- 🎯 Passeurs : Classement par passes décisives
- 📊 Général : Score de performance composite
- ⚠️ Discipline : Tableau des cartons

**Compte Rendu de Match**
- Résumé textuel
- Faits marquants
- Score mi-temps
- Conditions de jeu (météo, terrain)
- Ambiance (supporters, fair-play)
- Commentaire arbitrage

**Galerie Médias**
- Photos du match (bucket `match-medias`)
- Vidéos (liens YouTube/Vimeo)
- Légendes par média

**Configuration**
- Nom de l'équipe E2D
- Logo
- Saison en cours

### 8.3 Tables Concernées

| Table | Description |
|-------|-------------|
| `sport_e2d_matchs` | Matchs E2D |
| `sport_e2d_config` | Configuration équipe |
| `match_statistics` | Stats individuelles |
| `match_compte_rendus` | Comptes rendus |
| `match_medias` | Photos/vidéos |
| `e2d_player_stats_view` | Vue agrégée stats |

### 8.4 Pages

| Route | Description |
|-------|-------------|
| `/sport-e2d` | Dashboard et liste matchs |
| `/dashboard/admin/sport/e2d-config` | Configuration |

---

## 9. MODULE SPORT PHOENIX

### 9.1 Description

Module de gestion du club Phoenix avec équipes internes Jaune et Rouge.

### 9.2 Fonctionnalités

**Gestion des Équipes**
- Équipe Jaune vs Équipe Rouge
- Affectation des joueurs aux équipes
- Compositions de match

**Matchs Internes**
- Matchs Jaune vs Rouge
- Score et statistiques
- Tableau de bord comparatif

**Entraînements**
- Planification des entraînements
- Gestion des présences
- Notes et commentaires

**Adhérents Phoenix**
- Liste des adhérents Phoenix
- Cotisations annuelles Phoenix
- Statut d'adhésion

**Classements**
- Par équipe (Jaune/Rouge)
- Dashboard annuel
- Statistiques globales

### 9.3 Tables Concernées

| Table | Description |
|-------|-------------|
| `sport_phoenix_matchs` | Matchs internes |
| `sport_phoenix_config` | Configuration Phoenix |
| `phoenix_entrainements_internes` | Entraînements |
| `phoenix_presences` | Présences entraînements |
| `phoenix_equipes` | Configuration équipes |

### 9.4 Pages

| Route | Description |
|-------|-------------|
| `/sport-phoenix` | Dashboard Phoenix |
| `/sport-equipes` | Gestion équipes |
| `/dashboard/admin/sport/entrainements` | Entraînements |
| `/dashboard/admin/sport/sanctions` | Sanctions sportives |

---

## 10. SYNCHRONISATION SITE WEB

### 10.1 Architecture

Les matchs E2D publiés sont automatiquement synchronisés vers le site web public.

**Champs ajoutés à `site_events`** :
- `match_id` : ID du match source
- `match_type` : 'e2d' ou 'phoenix'
- `auto_sync` : Synchronisation automatique

**Logique de synchronisation** :
- `statut_publication = 'publie'` → Visible sur le site
- `statut_publication = 'brouillon' ou 'archive'` → Retiré du site
- Score affiché automatiquement si match terminé

### 10.2 Fichiers Clés

| Fichier | Description |
|---------|-------------|
| `src/lib/sync-events.ts` | Fonctions de synchronisation |
| `src/hooks/useSportEventSync.ts` | Hook de synchronisation |

### 10.3 Affichage Public

**Page `/evenements/:id` (EventDetail.tsx)**

Affiche pour chaque match E2D publié :
- ✅ Informations générales (date, lieu, adversaire)
- ✅ Score final (si terminé)
- ✅ Compte rendu complet
- ✅ Statistiques individuelles
- ✅ Galerie médias
- ✅ Homme du match

---

## 11. MODULE RÉUNIONS

### 11.1 Description

Gestion complète des réunions associatives avec présences, cotisations et sanctions.

### 11.2 Fonctionnalités

**Gestion des Réunions**
- Types : Ordinaire, Extraordinaire, AG, Bureau
- Date, lieu, ordre du jour
- Statuts : Planifiée, En cours, Clôturée

**Présences**
- Marquage présent/absent par membre
- Motif d'absence
- Justificatifs (upload)

**Cotisations en Réunion**
- Saisie des cotisations pendant la réunion
- Types multiples par réunion
- Statut : Payé, Impayé, Partiel

**Sanctions**
- Amendes pour retard, absence non justifiée
- Tarifs configurables
- Historique par membre

**Compte Rendu**
- Édition et consultation
- Actions décidées
- Envoi par email aux membres

**Workflow**
1. Création réunion → Notification membres
2. Pendant : Marquage présences + saisie cotisations
3. Clôture : Génération compte rendu + envoi email
4. Réouverture possible si nécessaire

### 11.3 Vues Récapitulatives

| Vue | Description |
|-----|-------------|
| État des absences | Absences non justifiées |
| Récap mensuel | Présences par mois |
| Récap annuel | Présences par exercice |
| Historique membre | Présences d'un membre |

### 11.4 Tables Concernées

| Table | Description |
|-------|-------------|
| `reunions` | Réunions |
| `reunions_presences` | Présences aux réunions |
| `reunions_sanctions` | Sanctions prononcées |
| `cotisations` | Cotisations (avec `reunion_id`) |

### 11.5 Page

| Route | Description |
|-------|-------------|
| `/reunions` | Gestion complète |

---

## 12. MODULE PRÊTS

### 12.1 Description

Système de prêts entre l'association et ses membres avec suivi des remboursements.

### 12.2 Fonctionnalités

**Création de Prêt**
- Membre bénéficiaire
- Montant, taux d'intérêt
- Date de début, durée
- Échéances calculées automatiquement

**Gestion des Paiements**
- Enregistrement des remboursements
- Échéances partielles ou totales
- Historique complet

**Alertes**
- Échéances à venir (J-7)
- Échéances dépassées
- Dashboard avec indicateurs visuels

**Export**
- Export PDF du contrat de prêt
- Export PDF de l'échéancier
- Historique des paiements

**Configuration**
- Taux d'intérêt par défaut
- Durée maximale
- Montant maximum

### 12.3 Tables Concernées

| Table | Description |
|-------|-------------|
| `prets` | Prêts accordés |
| `prets_paiements` | Remboursements |

### 12.4 Pages

| Route | Description |
|-------|-------------|
| `/dashboard/admin/prets` | Gestion des prêts |
| `/dashboard/admin/prets-config` | Configuration |
| `/dashboard/my-prets` | Mes prêts (membre) |

---

## 13. MODULE CAISSE

### 13.1 Description

Gestion de la trésorerie avec suivi des entrées et sorties.

### 13.2 Fonctionnalités

**Opérations**
- Entrées : Cotisations, dons, remboursements prêts
- Sorties : Prêts accordés, aides, dépenses
- Catégorisation des opérations
- Justificatifs (upload)

**Tableau de Bord**
- Solde actuel en temps réel
- Total entrées / sorties (période)
- Graphique d'évolution

**Synthèse**
- Modal détaillée par catégorie
- Filtres par période
- Export des opérations

**Liaison Automatique**
- Les cotisations, prêts, aides créent automatiquement des opérations de caisse
- Traçabilité via `source_table` et `source_id`

### 13.3 Tables Concernées

| Table | Description |
|-------|-------------|
| `fond_caisse_operations` | Opérations |
| `fond_caisse_clotures` | Clôtures périodiques |
| `caisse_config` | Configuration |

### 13.4 Page

| Route | Description |
|-------|-------------|
| `/dashboard/admin/caisse` | Gestion caisse |

---

## 14. MODULE BÉNÉFICIAIRES

### 14.1 Description

Calendrier des bénéficiaires pour le système de tontine.

### 14.2 Fonctionnalités

**Calendrier**
- Attribution des mois aux membres
- Ordre de passage
- Dates prévues de bénéfice

**Calcul des Montants**
- Montant mensuel par membre
- Calcul du total à percevoir
- Déductions éventuelles (prêts, sanctions)

**Widget Réunion**
- Affichage du bénéficiaire du mois
- Montant calculé
- Statut du paiement

**Notification**
- Email automatique au bénéficiaire
- Rappel quelques jours avant

### 14.3 Tables Concernées

| Table | Description |
|-------|-------------|
| `calendrier_beneficiaires` | Calendrier |
| `beneficiaires_config` | Configuration |

### 14.4 Page

| Route | Description |
|-------|-------------|
| `/dashboard/admin/beneficiaires` | Gestion calendrier |

---

## 15. MODULE NOTIFICATIONS

### 15.1 Description

Système complet de notifications par email avec templates et campagnes.

### 15.2 Fonctionnalités

**Templates d'Emails**
- Variables dynamiques ({nom}, {montant}, etc.)
- Sujet et contenu personnalisables
- Types : Cotisation, Présence, Prêt, Réunion, Sanction

**Campagnes**
- Envoi en masse
- Sélection des destinataires
- Programmation (optionnel)
- Suivi des envois

**Historique**
- Log de tous les envois
- Statut : Envoyé, Erreur, Lu
- Détails des erreurs

**Centre de Notifications**
- Notifications temps réel (Realtime)
- Badge de compteur
- Marquage lu/non lu

### 15.3 Types de Notifications Automatiques

| Type | Déclencheur |
|------|-------------|
| Rappel cotisation | Cotisation impayée |
| Rappel présence | Avant réunion |
| Échéance prêt | J-7 avant échéance |
| Compte rendu | Clôture réunion |
| Sanction | Nouvelle sanction |
| Contact | Message site web |

### 15.4 Edge Functions Concernées

| Fonction | Description |
|----------|-------------|
| `send-email` | Envoi générique |
| `send-cotisation-reminders` | Rappels cotisations |
| `send-presence-reminders` | Rappels présences |
| `send-pret-echeance-reminders` | Rappels échéances |
| `send-reunion-cr` | Compte rendu |
| `send-sanction-notification` | Notification sanction |
| `send-campaign-emails` | Campagnes |

### 15.5 Pages

| Route | Description |
|-------|-------------|
| `/dashboard/admin/notifications` | Envoi notifications |
| `/dashboard/admin/notifications-templates` | Gestion templates |

---

## 16. MODULE AIDES

### 16.1 Description

Gestion des demandes d'aide des membres.

### 16.2 Fonctionnalités

**Demande d'Aide**
- Type d'aide (décès, maladie, urgence, etc.)
- Montant demandé
- Justificatifs
- Contexte et notes

**Workflow de Validation**
- Demande en attente → Examen bureau → Approbation/Refus
- Notification au demandeur
- Enregistrement en caisse si approuvée

**Suivi**
- Historique des aides par membre
- Statistiques globales

### 16.3 Tables Concernées

| Table | Description |
|-------|-------------|
| `aides` | Demandes d'aide |
| `aides_types` | Types d'aide |

### 16.4 Pages

| Route | Description |
|-------|-------------|
| `/dashboard/admin/aides` | Gestion des aides |
| `/dashboard/my-aides` | Mes aides (membre) |

---

# PARTIE IV - INFRASTRUCTURE

---

## 17. SYSTÈME DE PERMISSIONS

### 17.1 Architecture

Système de permissions granulaire basé sur une fonction SQL `has_permission()`.

**Principes** :
- Les rôles sont stockés séparément (jamais dans `profiles`)
- Chaque rôle a des permissions par ressource
- 4 actions : `read`, `create`, `update`, `delete`
- Les politiques RLS utilisent `has_permission()`

### 17.2 Rôles Définis

| Rôle | Emoji | Description |
|------|-------|-------------|
| Administrateur | 👑 | Accès complet |
| Trésorier | 💰 | Finances, cotisations, prêts |
| Secrétaire | 📝 | Réunions, présences, CR |
| Responsable Sportif | ⚽ | Sport E2D + Phoenix |
| Censeur | ⚖️ | Contrôle finances (lecture) |
| Commissaire | 🔍 | Audit (lecture tout) |
| Membre | 👤 | Espaces personnels uniquement |

### 17.3 Ressources

| Ressource | Description |
|-----------|-------------|
| `finances` | Caisse, dons, adhésions |
| `membres` | Gestion membres |
| `reunions` | Réunions et présences |
| `sport` | Sport E2D + Phoenix |
| `site` | CMS site web |
| `notifications` | Envoi notifications |
| `configuration` | Paramètres système |

### 17.4 Tables Concernées

| Table | Description |
|-------|-------------|
| `roles` | Définition des rôles |
| `permissions` | Actions disponibles |
| `role_permissions` | Matrice rôle × permission |
| `user_roles` | Attribution rôle aux users |

### 17.5 Fonction SQL

```sql
CREATE FUNCTION public.has_permission(_resource text, _permission text)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM role_permissions rp
    JOIN user_roles ur ON ur.role_id = rp.role_id
    JOIN permissions p ON p.id = rp.permission_id
    WHERE ur.user_id = auth.uid()
      AND p.resource = _resource
      AND p.action = _permission
  )
$$ LANGUAGE sql STABLE SECURITY DEFINER;
```

### 17.6 Pages Admin

| Route | Description |
|-------|-------------|
| `/dashboard/admin/permissions` | Matrice interactive |
| `/dashboard/admin/roles` | Gestion des rôles |

---

## 18. ESPACES PERSONNELS MEMBRES

### 18.1 Pages Disponibles

| Route | Description | Données |
|-------|-------------|---------|
| `/dashboard/profile` | Mon profil | Infos personnelles |
| `/dashboard/my-donations` | Mes dons | Historique dons |
| `/dashboard/my-cotisations` | Mes cotisations | Cotisations par exercice |
| `/dashboard/my-epargnes` | Mes épargnes | Épargnes tontine |
| `/dashboard/my-prets` | Mes prêts | Prêts et échéances |
| `/dashboard/my-aides` | Mes aides | Demandes d'aide |
| `/dashboard/my-presences` | Mes présences | Présences réunions |
| `/dashboard/my-sanctions` | Mes sanctions | Amendes et pénalités |

### 18.2 Sécurité

- Chaque membre ne voit que ses propres données
- RLS : `membre_id IN (SELECT id FROM membres WHERE user_id = auth.uid())`
- Permissions granulaires pour les données sensibles

---

## 19. CONFIGURATION AVANCÉE

### 19.1 Modules de Configuration

**Exercices Comptables**
- Création/clôture d'exercices
- Dates de début et fin
- Paramètres financiers (taux, plafonds)

**Types de Cotisations**
- Définition des types
- Montants par défaut
- Périodicité (mensuel, annuel)
- Obligatoire ou optionnel

**Cotisations par Exercice**
- Activation des types par exercice
- Montants personnalisés par membre

**Tarifs Sanctions**
- Configuration des amendes
- Montants par type d'infraction

**Configuration Email**
- Paramètres SMTP (Resend)
- Adresse d'envoi
- Templates système

**Sessions Utilisateur**
- Timeout de session
- Alerte avant expiration
- Gestion des sessions multiples

**Sauvegarde**
- Export des données
- Import/Restauration

### 19.2 Composants

| Composant | Description |
|-----------|-------------|
| `ExercicesManager` | Gestion exercices |
| `CotisationsTypesManager` | Types cotisations |
| `CotisationsMensuellesExerciceManager` | Cotisations par exercice |
| `SanctionsTarifsManager` | Tarifs sanctions |
| `EmailConfigManager` | Configuration email |
| `SessionsConfigManager` | Sessions |
| `SauvegardeManager` | Sauvegarde |

---

## 20. ARCHITECTURE TECHNIQUE

### 20.1 Stack Frontend

| Technologie | Usage |
|-------------|-------|
| React 18 | Framework UI |
| TypeScript | Typage statique |
| Vite | Build tool |
| React Router v6 | Routing SPA |
| Tailwind CSS | Styling |
| shadcn/ui | Composants UI |
| TanStack Query | State management |
| React Hook Form | Formulaires |
| Zod | Validation |
| Recharts | Graphiques |
| Lucide React | Icônes |

### 20.2 Stack Backend

| Technologie | Usage |
|-------------|-------|
| Supabase | BaaS complet |
| PostgreSQL | Base de données |
| Supabase Auth | Authentification |
| Supabase Storage | Fichiers |
| Edge Functions | Serverless (Deno) |
| Supabase Realtime | Temps réel |

### 20.3 Intégrations

| Service | Usage |
|---------|-------|
| Stripe | Paiements CB |
| PayPal | Paiements alternatifs |
| HelloAsso | Paiements associations |
| Resend | Emails transactionnels |

---

## 21. BASE DE DONNÉES

### 21.1 Liste des Tables (50+)

**Site Web (CMS)**
- `cms_hero_slides`, `cms_sections`, `cms_events`, `cms_gallery`, `cms_partners`, `cms_settings`, `cms_pages`

**Sport E2D**
- `sport_e2d_matchs`, `sport_e2d_config`, `match_statistics`, `match_compte_rendus`, `match_medias`, `match_presences`

**Sport Phoenix**
- `sport_phoenix_matchs`, `sport_phoenix_config`, `phoenix_entrainements_internes`, `phoenix_presences`, `phoenix_equipes`

**Membres**
- `membres`, `profiles`, `activites_membres`

**Réunions**
- `reunions`, `reunions_presences`, `reunions_sanctions`

**Finances**
- `cotisations`, `cotisations_types`, `cotisations_membres`, `cotisations_mensuelles_exercice`
- `donations`, `adhesions`
- `prets`, `prets_paiements`
- `epargnes`
- `aides`, `aides_types`
- `fond_caisse_operations`, `fond_caisse_clotures`, `caisse_config`

**Bénéficiaires**
- `calendrier_beneficiaires`, `beneficiaires_config`, `beneficiaires_paiements_audit`

**Exercices**
- `exercices`, `exercices_cotisations_types`

**Notifications**
- `notifications_config`, `notifications_campagnes`, `notifications_envois`, `notifications_historique`, `notifications_logs`

**Permissions**
- `roles`, `permissions`, `role_permissions`, `user_roles`, `membres_roles`

**Configuration**
- `configurations`, `payment_configs`

**Audit**
- `audit_logs`, `historique_connexion`

**Autres**
- `messages_contact`, `fichiers_joint`, `alertes_budgetaires`, `demandes_adhesion`, `exports_programmes`

### 21.2 Vue Agrégée

| Vue | Description |
|-----|-------------|
| `e2d_player_stats_view` | Statistiques joueurs E2D agrégées |

---

## 22. EDGE FUNCTIONS

### 22.1 Liste des Fonctions (17)

| Fonction | Description |
|----------|-------------|
| `create-platform-user` | Création utilisateur plateforme |
| `create-user-account` | Création compte utilisateur |
| `donations-stats` | Statistiques dons |
| `get-payment-config` | Configuration paiements |
| `process-adhesion` | Traitement adhésion |
| `send-calendrier-beneficiaires` | Notification calendrier |
| `send-campaign-emails` | Campagnes email |
| `send-contact-notification` | Notification contact |
| `send-cotisation-reminders` | Rappels cotisations |
| `send-email` | Envoi email générique |
| `send-presence-reminders` | Rappels présences |
| `send-pret-echeance-reminders` | Rappels échéances prêts |
| `send-reunion-cr` | Compte rendu réunion |
| `send-sanction-notification` | Notification sanction |
| `sync-user-emails` | Synchronisation emails |
| `update-email-config` | MAJ config email |

### 22.2 Configuration

Toutes les Edge Functions utilisent :
- Deno runtime
- Supabase Client (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`)
- Resend pour les emails (`RESEND_API_KEY`)

---

# PARTIE V - LIVRABLES

---

## 23. LIVRABLES ET DOCUMENTATION

### 23.1 Code Source

**Structure `/src`** :
```
src/
├── components/         # 80+ composants React
│   ├── admin/          # Composants admin
│   ├── auth/           # Composants auth
│   ├── caisse/         # Module caisse
│   ├── config/         # Configuration
│   ├── donations/      # Dons
│   ├── forms/          # Formulaires
│   ├── layout/         # Layout dashboard
│   ├── notifications/  # Notifications
│   └── ui/             # shadcn/ui
├── contexts/           # AuthContext
├── hooks/              # 35+ hooks custom
├── lib/                # Utilitaires
├── pages/              # Pages React Router
│   ├── admin/          # Pages admin
│   └── dashboard/      # Pages membre
└── integrations/       # Supabase client
```

**Structure `/supabase`** :
```
supabase/
├── config.toml         # Configuration
├── functions/          # 17 Edge Functions
│   ├── _shared/        # Utilitaires partagés
│   └── */index.ts      # Chaque fonction
└── migrations/         # Migrations SQL
```

### 23.2 Documentation

| Document | Description |
|----------|-------------|
| `README.md` | Présentation projet |
| `CAHIER_DES_CHARGES_PROJET_COMPLET.md` | Ce document |
| `CAHIER_DES_CHARGES_SITE_WEB.md` | Spécifications site web |
| `CMS_IMPLEMENTATION.md` | Documentation CMS |
| `DONATIONS_README.md` | Système de dons |
| `docs/IMPLEMENTATION_CHECKLIST.md` | Checklist permissions |
| `docs/PERMISSIONS_TESTS.md` | Tests permissions |
| `docs/TEST_USERS_SETUP.sql` | Script utilisateurs test |
| `.lovable/plan.md` | Plan de développement |

---

## 24. PLANNING ET ÉTAT D'AVANCEMENT

### 24.1 État Actuel

| Module | Avancement |
|--------|------------|
| Site Web Public | ✅ 100% |
| CMS Admin | ✅ 100% |
| Portail Membre | ✅ 100% |
| Sport E2D | ✅ 100% |
| Sport Phoenix | ✅ 100% |
| Réunions | ✅ 100% |
| Prêts | ✅ 100% |
| Caisse | ✅ 100% |
| Bénéficiaires | ✅ 100% |
| Notifications | ✅ 100% |
| Aides | ✅ 100% |
| Permissions | ✅ 100% |
| **GLOBAL** | **~95%** |

### 24.2 Prochaines Étapes

1. **Tests utilisateurs** : Validation avec les membres
2. **Documentation utilisateur** : Guides d'utilisation
3. **Optimisation performance** : Cache, lazy loading
4. **Amélioration UX mobile** : Responsive design
5. **Audit sécurité** : Revue RLS et permissions

---

## 25. CONTRAINTES ET PRÉREQUIS

### 25.1 Prérequis Techniques

- Node.js 18+
- Compte Supabase (Cloud ou self-hosted)
- Compte Resend (emails)
- Optionnel : Stripe, PayPal, HelloAsso

### 25.2 Coûts Estimés

| Service | Coût Mensuel |
|---------|--------------|
| Supabase Pro | ~25€ |
| Resend | ~20€ (volume) |
| Stripe | % transactions |
| **Total estimé** | 50-100€/mois |

### 25.3 Sécurité

- RLS activé sur toutes les tables
- Permissions granulaires
- HTTPS obligatoire
- Secrets stockés dans Supabase
- Pas de clés privées dans le code

### 25.4 Conformité

- RGPD : Données personnelles protégées
- Droit à l'oubli : Suppression possible
- Portabilité : Export des données

---

## 📊 SYNTHÈSE FINALE

### Métriques Clés

| Métrique | Valeur |
|----------|--------|
| Tables Supabase | 50+ |
| Edge Functions | 17 |
| Hooks React | 35+ |
| Composants | 80+ |
| Pages | 40+ |
| Rôles | 7+ |
| Couverture | ~95% |

### Points Forts

- ✅ Architecture modulaire et évolutive
- ✅ Sécurité renforcée (RLS, permissions)
- ✅ UX moderne et responsive
- ✅ Documentation complète
- ✅ Synchronisation temps réel

### Évolutions Futures

- 📱 Application mobile (React Native)
- 📊 Tableaux de bord avancés (Business Intelligence)
- 🤖 Automatisations supplémentaires
- 🌍 Multi-langue (i18n)

---

**Document créé le** : Novembre 2024  
**Dernière mise à jour** : Janvier 2026  
**Version** : 3.0  
**Auteur** : Équipe E2D Connect
