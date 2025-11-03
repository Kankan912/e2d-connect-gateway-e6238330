# 📋 CAHIER DES CHARGES - PROJET COMPLET
## Plateforme Web E2D Connect - Site Vitrine + Intégration Portail Existant

**Version:** 2.1 - MISE À JOUR ✨  
**Date:** Janvier 2025  
**Type:** Application Web - Site Public + CMS Intégré  
**Portail Membre Existant:** https://github.com/Kankan912/e2d-connect.git

> ⚠️ **NOTE IMPORTANTE** : Le portail membre E2D Connect est déjà développé et fonctionnel. Ce cahier des charges se concentre sur la création du **Site Web Public** et son intégration avec le portail existant.

> ✨ **MISE À JOUR v2.1** : Ajout de 3 fonctionnalités avancées pour améliorer l'expérience utilisateur : carousel Hero, albums galerie, et carousel événements.

---

## 📌 TABLE DES MATIÈRES

1. [Contexte et Présentation](#1-contexte-et-présentation)
2. [Objectifs du Projet](#2-objectifs-du-projet)
3. [Public Cible](#3-public-cible)
4. [Architecture Globale](#4-architecture-globale)
5. [Spécifications Fonctionnelles Détaillées](#5-spécifications-fonctionnelles-détaillées)
6. [Architecture Technique](#6-architecture-technique)
7. [Intégrations Tierces](#7-intégrations-tierces)
8. [Parcours Utilisateur](#8-parcours-utilisateur)
9. [Stack Technique](#9-stack-technique)
10. [Livrables](#10-livrables)
11. [Planning et Phases](#11-planning-et-phases)
12. [Contraintes et Prérequis](#12-contraintes-et-prérequis)

---

## 1. CONTEXTE ET PRÉSENTATION

### 1.1 Présentation de l'Association

**E2D Connect** est une association regroupant deux entités complémentaires :
- **E2D** : Association principale axée sur la solidarité et l'entraide communautaire
- **Phoenix** : Club sportif de football affilié à E2D

L'association gère :
- Des activités sportives (matchs, entraînements, tournois)
- Un système de tontine/épargne pour les membres
- Des événements sociaux et culturels
- Un programme d'aide et de prêts entre membres
- Des partenariats avec des organisations locales

### 1.2 Problématique

Actuellement, l'association dispose d'un portail membre fonctionnel mais manque :
- D'une vitrine publique pour présenter ses activités au grand public
- D'un CMS pour administrer le contenu du site sans compétences techniques
- D'une intégration transparente entre le site public et le portail membre existant

### 1.3 Solution Proposée

Développer un **site web public** comprenant :
1. **Site Web Public** : Vitrine institutionnelle dynamique (8 sections CMS)
2. **CMS Admin** : Interface d'administration intégrée au portail existant
3. **Intégration Portail** : Connexion seamless avec le portail membre existant

### 1.4 Portail Membre Existant (Hors Périmètre)

**Repository GitHub** : https://github.com/Kankan912/e2d-connect.git

**Fonctionnalités déjà développées** :
- ✅ Authentification (Email/Password, Google OAuth)
- ✅ Dashboard membre (profil, dons, cotisations)
- ✅ Dashboard admin (finances, membres, statistiques)
- ✅ Système de rôles (`admin`, `tresorier`, `membre`)
- ✅ Gestion des dons et adhésions
- ✅ Routes protégées avec RLS
- ✅ Base de données complète (tables `membres`, `donations`, `cotisations`, etc.)

**Tables existantes à réutiliser** :
- `profiles`, `user_roles`, `membres`
- `donations`, `recurring_donations`, `adhesions`
- `cotisations`, `epargnes`, `exercices`
- `payment_configs`

---

## 2. OBJECTIFS DU PROJET

### 2.1 Objectifs Business

- **Visibilité** : Augmenter la visibilité de l'association en ligne
- **Acquisition** : Faciliter les adhésions et les dons (4 moyens de paiement)
- **Engagement** : Fidéliser les membres via un portail personnel
- **Efficacité** : Réduire la charge administrative grâce au CMS
- **Transparence** : Offrir un suivi en temps réel des contributions

### 2.2 Objectifs Techniques

- Application web moderne, rapide et responsive
- Interface d'administration intuitive (no-code pour le contenu)
- Sécurité renforcée (authentification, RLS, RGPD)
- Scalabilité pour supporter la croissance
- Multi-device (desktop, tablette, mobile)

### 2.3 Indicateurs de Succès

- Taux de conversion adhésion : > 15%
- Temps de mise à jour contenu : < 5 min
- Satisfaction utilisateurs (NPS) : > 8/10
- Disponibilité : > 99.5%

---

## 3. PUBLIC CIBLE

### 3.1 Visiteurs Anonymes
- **Profil** : Grand public, prospects
- **Besoins** : Découvrir l'association, faire un don, adhérer
- **Actions** : Navigation libre, lecture contenu, formulaire contact/don

### 3.2 Membres Authentifiés
- **Profil** : Adhérents E2D et/ou Phoenix
- **Besoins** : Consulter profil, historique cotisations/dons, télécharger reçus
- **Actions** : Connexion, mise à jour profil, consultation données personnelles

### 3.3 Administrateurs
- **Profil** : Bureau de l'association (trésorier, secrétaire, admin)
- **Besoins** : Gérer contenu site, valider adhésions, suivre finances
- **Actions** : CRUD complet, génération rapports, configuration paiements

---

## 4. ARCHITECTURE GLOBALE

```
┌─────────────────────────────────────────────────────────────┐
│                    PLATEFORME E2D CONNECT                    │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌──────────────┐    ┌──────────────────┐    ┌──────────────┐
│  SITE PUBLIC │    │  PORTAIL MEMBRE  │    │   BACKOFFICE │
│   (Vitrine)  │    │  (Authentifié)   │    │    ADMIN     │
└──────────────┘    └──────────────────┘    └──────────────┘
        │                     │                     │
        └─────────────────────┴─────────────────────┘
                              │
                    ┌─────────┴─────────┐
                    │   BACKEND LAYERS  │
                    ├───────────────────┤
                    │ Supabase Database │
                    │ Storage (Buckets) │
                    │  Edge Functions   │
                    │   Authentication  │
                    └───────────────────┘
```

### 4.1 Modules du Projet

#### ✅ Module 1 : Site Web Public (NOUVEAU - À DÉVELOPPER)
- URL : `/` (homepage)
- 8 sections dynamiques gérées par CMS
- 2 pages secondaires : `/don`, `/adhesion` (déjà existantes)
- Navigation avec bouton "Portail Membre"
- SEO optimisé, responsive design

#### ❌ Module 2 : Portail Membre (EXISTANT - HORS PÉRIMÈTRE)
**Repository** : https://github.com/Kankan912/e2d-connect.git

Fonctionnalités déjà développées :
- URL : `/portal` (page de connexion)
- Dashboard personnel (`/dashboard`)
- Historique dons/cotisations
- Profil modifiable
- Téléchargement reçus fiscaux
- Routes admin (`/dashboard/admin/*`)

**⚠️ Ne pas modifier** : `AuthContext`, `DashboardSidebar`, `AdminRoute`, tables existantes

#### ✅ Module 3 : CMS Admin (NOUVEAU - À INTÉGRER)
- URL : `/dashboard/admin/site/*` (à créer dans le portail existant)
- 6 pages CMS : Hero, À Propos, Activités, Événements, Galerie, Partenaires, Configuration
- Sécurité : Routes protégées par `AdminRoute` (rôles : admin, tresorier)
- Réutilise `MediaUploader`, `StatCard`, hooks existants

---

## 5. SPÉCIFICATIONS FONCTIONNELLES DÉTAILLÉES

### 5.1 SITE WEB PUBLIC

#### 5.1.1 Page d'Accueil (`/`)

**Section Hero (site_hero)** ✨ MODIFIÉE
- **Contenu dynamique** :
  - Badge texte (ex: "E2D Connect")
  - Titre principal (H1)
  - Sous-titre
  - **Carousel d'images de fond** (plusieurs images, défilement automatique configurable)
  - 2 boutons CTA configurables (texte + lien)
  - 3 statistiques avec chiffres + labels
- **Carousel** :
  - Upload de **plusieurs images** dans `site_hero_images`
  - Défilement automatique activable/désactivable
  - Intervalle configurable (par défaut 5 secondes)
  - Flèches de navigation gauche/droite
  - Indicateurs en bas
- **Design** : Plein écran, overlay gradient, typographie impact
- **CTA** : Boutons primaire/secondaire vers contact/adhésion

**Section À Propos (site_about)**
- **Contenu** :
  - Titre + sous-titre
  - Section "Notre Histoire" (titre + contenu markdown)
  - Liste de valeurs (tableau JSON : icône, titre, description)
- **Layout** : Grid 2 colonnes (histoire à gauche, valeurs à droite)

**Section Activités (site_activities)**
- **Contenu** : 
  - Liste d'activités (icône, titre, description, image)
  - Chaque activité peut être activée/désactivée
  - Ordre configurable
- **Layout** : Cards responsive (1-3 colonnes selon device)
- **Filtres** : Affichage uniquement des activités actives

**Section Événements (site_events)** ✨ MODIFIÉE
- **Contenu** :
  - Titre, type (tournoi/match/social), date, heure, lieu
  - Description, image (miniature)
  - Ordre configurable, statut actif/inactif
- **Carousel de miniatures** :
  - Affichage des **miniatures des événements** en carousel automatique
  - Intervalle configurable (par défaut 4 secondes) via `site_events_carousel_config`
  - Navigation par flèches et indicateurs
  - Nombre de miniatures affichées selon le nombre d'événements actifs
- **Layout** : Timeline chronologique ou cards + carousel miniatures
- **Tri** : Par date décroissante

**Section Galerie (site_gallery)** ✨ MODIFIÉE
- **Albums/Catalogues** :
  - Organisation par **albums** (`site_gallery_albums`)
  - Chaque album a : nom, description, image de couverture, ordre
  - Un album peut contenir **plusieurs images et vidéos**
- **Contenu** :
  - Photos et vidéos organisées par album
  - Support upload direct + liens externes
  - Ordre manuel par album
- **UI** : 
  - Vue albums (grid de couvertures)
  - Clic sur album → affiche toutes les photos/vidéos de l'album
  - Lightbox, navigation clavier, lazy loading
- **Catégories** : Photos et Vidéos (distinction dans `categorie`)

**Section Partenaires (site_partners)**
- **Contenu** :
  - Logo, nom, site web, description
  - Ordre configurable
- **Layout** : Grid logos avec hover effect
- **Action** : Clic → ouverture site partenaire (nouvelle fenêtre)

**Section Contact (formulaire)**
- **Champs** :
  - Nom* (required)
  - Email* (validation format)
  - Téléphone (optionnel)
  - Message* (textarea)
- **Backend** : Edge Function `send-email` via Resend
- **UX** : Toast de confirmation, validation Zod

**Footer**
- **Contenu** :
  - Logo E2D
  - Liens rapides (sections, légal)
  - Réseaux sociaux (Facebook, Instagram, Twitter)
  - Coordonnées (adresse, email, téléphone)
- **Configuration** : Via table `site_config`

#### 5.1.2 Page Don (`/don`)

**Formulaire de Don**
- **Montant** :
  - 5 montants prédéfinis (10€, 25€, 50€, 100€, 200€) avec badges (Supporter, Contributeur, etc.)
  - Montant personnalisé
  - Sélecteur devise (EUR, USD, GBP, CAD, CHF)
  - Option don récurrent (mensuel/annuel)

- **Informations donateur** :
  - Nom*, Email*, Téléphone (opt), Message (opt)
  - Validation Zod
  
- **Moyens de paiement** :
  - Onglets : Stripe, PayPal, HelloAsso, Virement
  - Affichage conditionnel selon configuration active

- **Stripe** :
  - Carte bancaire (via Stripe Elements)
  - Gestion abonnements récurrents
  - Webhook pour confirmation

- **PayPal** :
  - Redirection vers PayPal Checkout
  - Retour avec statut transaction

- **HelloAsso** :
  - Iframe ou redirection
  - Callback URL

- **Virement bancaire** :
  - Affichage IBAN, BIC, titulaire
  - Instructions téléchargement
  - Référence unique générée

- **Post-paiement** :
  - Modal de confirmation
  - Email reçu fiscal (si > 10€)
  - Redirection dashboard membre (si authentifié)

#### 5.1.3 Page Adhésion (`/adhesion`)

**Formulaire Adhésion**
- **Informations personnelles** :
  - Nom*, Prénom*, Email*, Téléphone*
  - Validation Zod

- **Type d'adhésion** :
  - Radio buttons :
    - E2D seul (20€)
    - Phoenix seul (30€)
    - E2D + Phoenix (45€)

- **Conditions** :
  - Checkbox acceptation CGU*
  - Message optionnel

- **Paiement** :
  - Mêmes moyens que page Don
  - Montant automatique selon type

- **Workflow** :
  1. Validation formulaire
  2. Création record `adhesions` (statut pending)
  3. Paiement
  4. Edge Function `process-adhesion` :
     - Création membre dans `membres`
     - Création compte user si email nouveau
     - Envoi email bienvenue
     - Mise à jour `adhesions.processed = true`

#### 5.1.4 Navigation (Navbar)

**Desktop** :
- Logo E2D (cliquable → home)
- Menu horizontal : Accueil, À Propos, Activités, Événements, Galerie, Partenaires, Contact
- Boutons CTA : "Faire un Don" (primaire), "Adhérer" (secondaire)
- Icône connexion (si non authentifié) ou avatar + dropdown (si authentifié)

**Mobile** :
- Logo + burger menu
- Drawer latéral avec menu vertical
- Boutons empilés

**Comportement** :
- Scroll smooth vers sections (anchors)
- Active state selon scroll position
- Sticky header avec background blur

---

### 5.2 PORTAIL MEMBRE (EXISTANT - HORS PÉRIMÈTRE)

> ⚠️ **Le portail membre est déjà développé et opérationnel.** Cette section décrit les fonctionnalités existantes que le site web public doit intégrer.

**Repository** : https://github.com/Kankan912/e2d-connect.git

#### 5.2.1 Authentification (`/portal`) - ✅ Déjà implémentée

**Méthodes disponibles** :
- ✅ Email + Password (Supabase Auth)
- ✅ Inscription avec formulaire complet
- ✅ Récupération mot de passe

**Composants existants** :
- `src/pages/Portal.tsx` : Page de connexion/inscription
- `src/contexts/AuthContext.tsx` : Gestion état authentification
- `src/components/auth/AdminRoute.tsx` : Protection routes admin

#### 5.2.2 Dashboard Membre - ✅ Déjà implémenté

**Route** : `/dashboard`

**Fonctionnalités opérationnelles** :
- ✅ Message de bienvenue personnalisé
- ✅ Navigation sidebar dynamique selon rôle
- ✅ Accès Mon Profil, Mes Dons, Mes Cotisations
- ✅ Routes admin protégées

**Composants existants** :
- `src/pages/Dashboard.tsx`
- `src/components/layout/DashboardLayout.tsx`
- `src/components/layout/DashboardSidebar.tsx`
- `src/components/layout/DashboardHeader.tsx`

#### 5.2.3 Fonctionnalités Membres - ✅ Déjà implémentées

**Routes disponibles** :
- ✅ `/dashboard/profile` : Profil modifiable
- ✅ `/dashboard/my-donations` : Historique dons
- ✅ `/dashboard/my-cotisations` : Cotisations E2D/Phoenix

**Routes Admin disponibles** :
- ✅ `/dashboard/admin/donations` : Gestion dons
- ✅ `/dashboard/admin/adhesions` : Validation adhésions
- ✅ `/dashboard/admin/payment-config` : Configuration paiements
- ✅ `/dashboard/admin/membres` : Gestion membres
- ✅ `/dashboard/admin/stats` : Statistiques

#### 5.2.4 Intégration Site Web ↔ Portail

**À implémenter dans le Site Public** :

1. **Navbar publique** :
   ```tsx
   <Button asChild variant="outline">
     <Link to="/portal">
       <LogIn className="mr-2 h-4 w-4" />
       Portail Membre
     </Link>
   </Button>
   ```

2. **Post-adhésion** :
   - Email avec lien vers `/portal`
   - Message : "Connectez-vous pour accéder à votre espace membre"

3. **Post-don** :
   - Si authentifié : visible dans `/dashboard/my-donations`
   - Si anonyme : email confirmation uniquement

---

### 5.3 BACKOFFICE ADMIN

**URL** : `/dashboard/*`  
**Protection** : RLS basée sur `user_roles.role = 'admin'` ou rôles spécifiques

#### 5.3.1 Layout Admin

**Sidebar gauche** :
- Logo E2D
- Menu :
  - 📊 **Tableau de bord** (`/dashboard`)
  - 🌐 **Gestion du Site Web**
    - Hero (`/dashboard/admin/site/hero`)
    - À Propos (`/dashboard/admin/site/about`)
    - Activités (`/dashboard/admin/site/activities`)
    - Événements (`/dashboard/admin/site/events`)
    - Galerie (`/dashboard/admin/site/gallery`)
    - Partenaires (`/dashboard/admin/site/partners`)
    - Configuration (`/dashboard/admin/site/config`)
  - 💰 **Finances**
    - Dons (`/dashboard/admin/donations`)
    - Adhésions (`/dashboard/admin/adhesions`)
    - Configuration Paiements (`/dashboard/admin/payment-config`)
  - 👥 **Membres**
    - Liste Membres (`/dashboard/admin/members`)
    - Rôles & Permissions (`/dashboard/admin/roles`)
  - ⚙️ **Paramètres**
    - Général
    - Email (SMTP)

**Header** :
- Breadcrumb
- Avatar user + dropdown (profil, déconnexion)

#### 5.3.2 Gestion du Site Web - Hero ✨ MODIFIÉE

**Formulaire principal** :
- Badge texte (input)
- Titre (input)
- Sous-titre (textarea)
- Bouton 1 : Texte + Lien
- Bouton 2 : Texte + Lien
- 3 Statistiques : Nombre + Label (6 inputs)
- Toggle "Actif"

**Section Carousel d'images** ✨ NOUVEAU :
- **Liste des images** :
  - Affichage grid des images uploadées
  - Pour chaque image : preview, ordre, toggle actif, boutons éditer/supprimer
  - Drag & drop pour réordonner
- **Ajouter une image** :
  - Bouton "Ajouter une image"
  - Modal avec `MediaUploader` (upload → bucket `site-hero` OU lien externe)
  - Preview image
  - Champ ordre (auto-incrémenté)
- **Configuration carousel** :
  - Toggle "Défilement automatique"
  - Intervalle (slider 3-10 secondes, par défaut 5s)
  - Sauvegarde dans `site_hero.carousel_auto_play` et `carousel_interval`

**Actions** :
- Bouton "Enregistrer" (mutation → `site_hero` + `site_hero_images` tables)
- Toast confirmation

**UX** :
- Skeleton loader pendant fetch
- Validation temps réel
- Preview live du carousel (optionnel)

#### 5.3.3 Gestion du Site Web - À Propos

**Formulaire** :
- Titre, Sous-titre (inputs)
- Histoire : Titre + Contenu (textarea markdown)
- Valeurs (dynamic form) :
  - Bouton "Ajouter valeur"
  - Pour chaque : Icône (Lucide), Titre, Description
  - Drag & drop pour ordre
  - Bouton supprimer

**Stockage** :
- Valeurs en JSONB (`site_about.valeurs`)

#### 5.3.4 Gestion du Site Web - Activités

**Interface** :
- Tableau : Ordre, Icône, Titre, Description, Actif, Actions
- Bouton "Nouvelle activité" (modal)

**Modal Création/Édition** :
- Icône (select Lucide)
- Titre*, Description*, Ordre
- Image (MediaUploader → `site-activities` ou externe)
- Toggle Actif
- Bouton "Enregistrer"

**Actions** :
- ✏️ Éditer (ouvre modal)
- 🗑️ Supprimer (confirmation dialog)
- ↕️ Réordonner (drag & drop)

#### 5.3.5 Gestion du Site Web - Événements ✨ MODIFIÉE

**Interface** :
- Tableau : Date, Titre, Type, Lieu, Miniature, Actif, Actions
- Filtres : Type (tous/tournoi/match/social), Statut (actif/inactif)
- Bouton "Nouvel événement"

**Modal Création/Édition** :
- Titre*, Type* (select)
- Date*, Heure (time picker)
- Lieu*, Description (textarea)
- Image miniature* (MediaUploader → bucket `site-events`)
  - ⚠️ Cette image sera utilisée dans le carousel de miniatures
- Ordre, Toggle Actif

**Configuration Carousel** ✨ NOUVEAU :
- Onglet "Paramètres Carousel" (dans page Événements)
- Toggle "Défilement automatique"
- Intervalle (slider 2-8 secondes, par défaut 4s)
- Toggle "Afficher navigation" (flèches)
- Toggle "Afficher indicateurs" (dots)
- Sauvegarde dans `site_events_carousel_config`

**Tri** :
- Par défaut : Date décroissante
- Changeable par admin

#### 5.3.6 Gestion du Site Web - Galerie ✨ MODIFIÉE

**Nouvelle Architecture avec Albums** :

**Vue principale - Liste des albums** :
- Grid d'albums (cards avec image de couverture)
- Pour chaque album : nom, nombre de photos/vidéos, actions
- Bouton "Nouvel album"

**Modal Création/Édition Album** ✨ NOUVEAU :
- Nom* (input)
- Description (textarea)
- Image de couverture (MediaUploader → bucket `site-gallery`)
- Ordre (input number)
- Toggle Actif
- Boutons : Enregistrer, Annuler

**Vue Album - Contenu de l'album** :
- Clic sur un album → affiche toutes ses photos/vidéos
- Header : Nom album, description, nombre d'items, bouton "Ajouter photo/vidéo"
- Grid photos/vidéos (3-4 colonnes)
- Chaque item : Thumbnail, Titre, Catégorie (photo/vidéo)
- Filtres : Tous/Photos/Vidéos

**Upload dans un album** ✨ MODIFIÉ :
- Sélection de l'album cible (select)
- Drag & drop zone
- Multi-upload (max 10 fichiers simultanément)
- Progress bar par fichier
- Auto-upload vers bucket `site-gallery`
- Catégorie auto-détectée (image → photo, vidéo → vidéo)

**Modal Édition Photo/Vidéo** :
- Preview image/vidéo
- Titre*, Catégorie* (photo/vidéo)
- Album (select - changement d'album possible)
- URL vidéo (si catégorie = vidéo)
- Ordre dans l'album
- Toggle Actif
- Bouton "Supprimer" (supprime fichier bucket + record DB)

#### 5.3.7 Gestion du Site Web - Partenaires

**Interface** :
- Grid logos partenaires
- Bouton "Nouveau partenaire"

**Modal** :
- Nom*, Site web (URL)
- Logo (MediaUploader → bucket `site-partners`)
- Description (textarea)
- Ordre, Toggle Actif

#### 5.3.8 Gestion du Site Web - Configuration

**Onglets** :
- **Général** :
  - Nom du site
  - Slogan
  - Logo (upload)
  - Favicon (upload)

- **Contact** :
  - Adresse postale
  - Email contact
  - Téléphone
  - Horaires

- **Réseaux Sociaux** :
  - Facebook URL
  - Instagram URL
  - Twitter URL
  - LinkedIn URL

**Stockage** :
- Table `site_config` (clé-valeur)
- Type : text, url, image, textarea

#### 5.3.9 Finances - Dons

**Onglets** :
- **Vue d'ensemble**
  - KPIs :
    - Total dons (mois en cours)
    - Total dons (année en cours)
    - Nombre donateurs uniques
    - Montant moyen don
  - Graphique évolution (Recharts area chart)

- **Liste des dons**
  - Tableau : Date, Donateur, Montant, Devise, Méthode, Statut
  - Filtres : 
    - Date (plage calendrier)
    - Méthode paiement (multiselect)
    - Statut (pending/completed/failed)
  - Search : Nom donateur ou email
  - Pagination (50 par page)
  - Export CSV (tous les dons filtrés)

- **Dons récurrents**
  - Liste abonnements actifs
  - Statut (actif/annulé/expiré)
  - Prochaine échéance
  - Actions : Annuler abonnement (Stripe API)

- **Configuration**
  - Montants prédéfinis (édition)
  - Badges associés
  - Devises actives
  - Message remerciement (template email)

**Actions par ligne** :
- Voir détails (modal)
- Envoyer reçu fiscal (re-send)
- Marquer comme payé (si virement)

#### 5.3.10 Finances - Adhésions

**Tableau** :
- Colonnes : Date, Nom, Prénom, Email, Type, Montant, Statut, Traité
- Filtres : Type (E2D/Phoenix/Both), Statut (pending/completed)
- Search

**Actions** :
- ✅ Valider adhésion (trigger `process-adhesion` manuellement)
- 👁️ Voir détails
- 📧 Renvoyer email confirmation

**Workflow** :
- Adhésion pending → Admin valide → Membre créé + Email envoyé

#### 5.3.11 Finances - Configuration Paiements

**Interface** :
- Cards pour chaque provider :
  - **Stripe** :
    - Public Key (input)
    - Secret Key (password input)
    - Webhook Secret
    - Toggle Actif
    - Test mode (toggle)
  
  - **PayPal** :
    - Client ID
    - Client Secret
    - Mode (sandbox/production)
    - Toggle Actif
  
  - **HelloAsso** :
    - Organization slug
    - API Key
    - Toggle Actif
  
  - **Virement Bancaire** :
    - IBAN*
    - BIC*
    - Titulaire compte*
    - Instructions (textarea)
    - Toggle Actif

**Stockage** :
- Table `payment_configs` (1 ligne par provider)
- `config_data` en JSONB (chiffré pour secrets)

**Validation** :
- Bouton "Tester connexion" (appel API provider)
- Badge status (connecté/erreur)

#### 5.3.12 Membres - Liste

**Interface** :
- Tableau : Photo, Nom, Prénom, Email, Rôle, Statut, Adhésion E2D, Adhésion Phoenix
- Filtres :
  - Statut (actif/inactif)
  - Rôle (admin/trésorier/membre)
  - Adhésion E2D (oui/non)
  - Adhésion Phoenix (oui/non)
- Search : Nom, prénom, email
- Bouton "Nouveau membre"

**Actions** :
- ✏️ Éditer (modal)
- 🗑️ Désactiver (soft delete)
- 🔑 Changer rôle (modal)
- 📊 Voir détails (page dédiée)

**Modal Édition** :
- Tous champs profil
- Rôle (multiselect : admin, trésorier, secrétaire, responsable sportif, membre)
- Statut (actif/inactif)
- Équipes (E2D, Phoenix)

#### 5.3.13 Membres - Détails

**Page** : `/dashboard/admin/members/:id`

**Sections** :
- **Informations personnelles** (éditable)
- **Historique Cotisations** (tableau)
- **Historique Dons** (tableau)
- **Historique Épargnes** (si fonctionnalité activée)
- **Activités** (log complet)
- **Fichiers joints** (documents uploadés)

**Actions** :
- Enregistrer modifications
- Envoyer email
- Générer rapport PDF

---

## 6. ARCHITECTURE TECHNIQUE

### 6.1 BASE DE DONNÉES (SUPABASE POSTGRESQL)

> ⚠️ **Tables existantes** : Le portail e2d-connect dispose déjà de tables pour les membres, donations, cotisations, etc. **Ne pas recréer ces tables.**

#### 6.1.1 Tables Site Web (10 tables - À CRÉER)

**`site_hero`**
```sql
- id (uuid, PK)
- titre (text, NOT NULL)
- sous_titre (text, NOT NULL)
- badge_text (text, default 'E2D Connect')
- bouton_1_texte (text)
- bouton_1_lien (text)
- bouton_2_texte (text)
- bouton_2_lien (text)
- stat_1_nombre (int)
- stat_1_label (text)
- stat_2_nombre (int)
- stat_2_label (text)
- stat_3_nombre (int)
- stat_3_label (text)
- carousel_auto_play (boolean, default true)
- carousel_interval (int, default 5000) -- Intervalle en ms entre chaque image
- actif (boolean, default true)
- created_at, updated_at (timestamptz)
```

**`site_hero_images`** ✨ NOUVEAU
```sql
- id (uuid, PK)
- hero_id (uuid, FK → site_hero.id, ON DELETE CASCADE)
- image_url (text, NOT NULL)
- media_source (text, default 'external') -- 'upload' ou 'external'
- ordre (int, default 0)
- actif (boolean, default true)
- created_at, updated_at (timestamptz)
```
> Permet d'avoir **plusieurs images de fond en carousel** pour la section Hero

**`site_about`**
```sql
- id (uuid, PK)
- titre (text)
- sous_titre (text)
- histoire_titre (text)
- histoire_contenu (text)
- valeurs (jsonb) -- [{ icone, titre, description }]
- actif (boolean)
- created_at, updated_at
```

**`site_activities`**
```sql
- id (uuid, PK)
- titre (text, NOT NULL)
- description (text)
- icone (text) -- Nom icône Lucide
- image_url (text)
- media_source (text)
- ordre (int, default 0)
- actif (boolean, default true)
- created_at, updated_at
```

**`site_events`**
```sql
- id (uuid, PK)
- titre (text, NOT NULL)
- type (text, NOT NULL) -- 'tournoi', 'match', 'social'
- date (date, NOT NULL)
- heure (time)
- lieu (text)
- description (text)
- image_url (text)
- media_source (text)
- ordre (int)
- actif (boolean)
- created_at, updated_at
```

**`site_events_carousel_config`** ✨ NOUVEAU
```sql
- id (uuid, PK)
- auto_play (boolean, default true)
- interval (int, default 4000) -- Intervalle en ms entre chaque miniature
- show_navigation (boolean, default true)
- show_indicators (boolean, default true)
- actif (boolean, default true)
- created_at, updated_at (timestamptz)
```
> Configuration pour le **carousel des miniatures d'événements** sur la homepage

**`site_gallery_albums`** ✨ NOUVEAU
```sql
- id (uuid, PK)
- nom (text, NOT NULL)
- description (text)
- image_couverture (text) -- Image de couverture de l'album
- media_source (text, default 'external')
- ordre (int, default 0)
- actif (boolean, default true)
- created_at, updated_at (timestamptz)
```
> Albums/catalogues pour organiser la galerie

**`site_gallery`** (MODIFIÉE)
```sql
- id (uuid, PK)
- album_id (uuid, FK → site_gallery_albums.id, ON DELETE CASCADE, nullable)
- titre (text, NOT NULL)
- categorie (text, NOT NULL) -- 'photo', 'video'
- image_url (text)
- video_url (text)
- media_source (text)
- ordre (int)
- actif (boolean)
- created_at, updated_at
```
> ⚠️ Modifié pour supporter les albums : ajout de `album_id` et `video_url`

**`site_partners`**
```sql
- id (uuid, PK)
- nom (text, NOT NULL)
- logo_url (text, NOT NULL)
- site_web (text)
- description (text)
- media_source (text)
- ordre (int)
- actif (boolean)
- created_at, updated_at
```

**`site_config`**
```sql
- id (uuid, PK)
- cle (text, NOT NULL, UNIQUE)
- valeur (text, NOT NULL)
- description (text)
- type (text, default 'text') -- 'text', 'url', 'image', 'textarea'
- categorie (text, default 'general') -- 'general', 'contact', 'social'
- created_at, updated_at
```

**Exemples de clés `site_config`** :
- `site_name`, `site_slogan`, `logo_url`
- `contact_address`, `contact_email`, `contact_phone`
- `facebook_url`, `instagram_url`, `twitter_url`

#### 6.1.2 Tables Finances - ✅ EXISTANTES (NE PAS RECRÉER)

> ⚠️ **Ces tables existent déjà dans le portail e2d-connect**. Elles seront réutilisées pour les formulaires `/don` et `/adhesion`.

**`donations`** - ✅ Existante
```sql
- id (uuid, PK)
- donor_name (text, NOT NULL)
- donor_email (text, NOT NULL)
- donor_phone (text)
- donor_message (text)
- amount (numeric, NOT NULL)
- currency (text, default 'EUR')
- is_recurring (boolean, default false)
- recurring_frequency (text) -- 'monthly', 'yearly'
- payment_method (text, NOT NULL) -- 'stripe', 'paypal', 'helloasso', 'bank_transfer'
- payment_status (text, default 'pending') -- 'pending', 'completed', 'failed', 'refunded'
- stripe_payment_id (text)
- stripe_customer_id (text)
- paypal_transaction_id (text)
- helloasso_payment_id (text)
- bank_transfer_reference (text)
- transaction_metadata (jsonb)
- fiscal_receipt_sent (boolean, default false)
- fiscal_receipt_url (text)
- created_at, updated_at
```

**`recurring_donations`**
```sql
- id (uuid, PK)
- donation_id (uuid, FK → donations.id)
- stripe_subscription_id (text)
- paypal_subscription_id (text)
- frequency (text) -- 'monthly', 'yearly'
- next_payment_date (date)
- status (text) -- 'active', 'cancelled', 'paused'
- cancelled_at (timestamptz)
- created_at, updated_at
```

**`adhesions`** - ✅ Existante
```sql
- id (uuid, PK)
- nom (text, NOT NULL)
- prenom (text, NOT NULL)
- email (text, NOT NULL)
- telephone (text, NOT NULL)
- type_adhesion (text, NOT NULL) -- 'e2d', 'phoenix', 'both'
- montant (numeric, NOT NULL)
- payment_method (text, NOT NULL)
- payment_status (text, default 'pending')
- stripe_payment_id (text)
- paypal_transaction_id (text)
- helloasso_payment_id (text)
- bank_transfer_reference (text)
- message (text)
- processed (boolean, default false) -- Si membre créé
- membre_id (uuid, FK → membres.id)
- created_at, updated_at
```

**`payment_configs`**
```sql
- id (uuid, PK)
- provider (text, NOT NULL, UNIQUE) -- 'stripe', 'paypal', 'helloasso', 'bank_transfer'
- config_data (jsonb, NOT NULL) -- Clés API, secrets (chiffrés)
- is_active (boolean, default false)
- is_test_mode (boolean, default true)
- created_at, updated_at
```

**Exemple `config_data` Stripe** :
```json
{
  "public_key": "pk_test_...",
  "secret_key": "sk_test_...",
  "webhook_secret": "whsec_..."
}
```

**`cotisations`**
```sql
- id (uuid, PK)
- membre_id (uuid, FK → membres.id)
- type_cotisation_id (uuid, FK → cotisations_types.id)
- montant (numeric, NOT NULL)
- date_paiement (date)
- reunion_id (uuid, nullable)
- statut (text, default 'paye') -- 'paye', 'impaye', 'partiel'
- justificatif_url (text)
- notes (text)
- created_at
```

**`cotisations_types`**
```sql
- id (uuid, PK)
- nom (text, NOT NULL) -- 'Cotisation E2D', 'Cotisation Phoenix'
- montant_defaut (numeric)
- description (text)
- periodicite (text) -- 'mensuel', 'annuel'
- actif (boolean)
- created_at, updated_at
```

**`epargnes`**
```sql
- id (uuid, PK)
- membre_id (uuid, FK)
- montant (numeric, NOT NULL)
- date_depot (date)
- exercice_id (uuid, FK → exercices.id)
- reunion_id (uuid, nullable)
- statut (text, default 'actif')
- notes (text)
- created_at, updated_at
```

**`exercices`**
```sql
- id (uuid, PK)
- nom (text, NOT NULL)
- date_debut (date)
- date_fin (date)
- statut (text, default 'actif') -- 'actif', 'cloture'
- croissance_fond_caisse (numeric)
- plafond_fond_caisse (numeric)
- created_at
```

#### 6.1.3 Tables Membres & Auth (5 tables)

**`membres`**
```sql
- id (uuid, PK)
- user_id (uuid, FK → auth.users.id, nullable)
- nom (text, NOT NULL)
- prenom (text, NOT NULL)
- email (text)
- telephone (text)
- photo_url (text)
- date_inscription (date, default CURRENT_DATE)
- statut (text, default 'actif') -- 'actif', 'inactif', 'suspendu'
- est_membre_e2d (boolean, default true)
- est_adherent_phoenix (boolean, default false)
- equipe_e2d (text)
- equipe_phoenix (text) -- 'Jaune', 'Rouge'
- fonction (text)
- created_at, updated_at
```

**`user_roles`**
```sql
- id (uuid, PK)
- user_id (uuid, FK → auth.users.id, NOT NULL)
- role (text, NOT NULL) -- 'admin', 'tresorier', 'secretaire', 'responsable_sportif', 'membre'
- created_at
```

**Enum `app_role`** :
```sql
CREATE TYPE app_role AS ENUM ('admin', 'tresorier', 'secretaire', 'responsable_sportif', 'membre');
```

**`activites_membres`**
```sql
- id (uuid, PK)
- membre_id (uuid, FK)
- type_activite (text) -- 'cotisation', 'epargne', 'pret', 'don', 'sanction'
- description (text)
- montant (numeric)
- date_activite (timestamptz, default now())
- reference_id (uuid) -- ID de l'enregistrement lié
- reference_table (text)
- created_at
```

**`profiles`**
```sql
- id (uuid, PK, FK → auth.users.id)
- nom (text)
- prenom (text)
- telephone (text)
- created_at, updated_at
```

**`notifications_historique`**
```sql
- id (uuid, PK)
- type_notification (text)
- destinataire_email (text)
- sujet (text)
- contenu (text)
- statut (text) -- 'en_cours', 'envoye', 'erreur'
- date_envoi (timestamptz)
- erreur_message (text)
- variables_utilisees (jsonb)
- created_at, updated_at
```

### 6.2 STORAGE (SUPABASE BUCKETS)

#### Buckets publics :

**`site-hero`**
- Usage : Images de fond section Hero
- Policies : 
  - SELECT : Public
  - INSERT/UPDATE/DELETE : Admin uniquement

**`site-gallery`**
- Usage : Photos galerie
- Policies : SELECT public, WRITE admin

**`site-partners`**
- Usage : Logos partenaires
- Policies : SELECT public, WRITE admin

**`site-events`**
- Usage : Images événements
- Policies : SELECT public, WRITE admin

**`membre-photos`**
- Usage : Photos de profil membres
- Policies :
  - SELECT : Public
  - INSERT/UPDATE : Membre owner OU admin
  - DELETE : Admin

### 6.3 EDGE FUNCTIONS (SERVERLESS)

**`get-payment-config`**
- **Méthode** : GET
- **Auth** : Public
- **Fonction** : Récupérer configs paiements actives (sans secrets)
- **Retour** : `{ stripe: { publicKey }, paypal: { clientId }, ... }`

**`process-adhesion`**
- **Méthode** : POST
- **Auth** : Service Role Key
- **Trigger** : Webhook paiement OU action admin
- **Fonction** :
  1. Récupérer adhesion par ID
  2. Si payment_status = 'completed' et processed = false :
     - Créer membre dans `membres`
     - Créer user dans `auth.users` (si email nouveau)
     - Créer `user_roles` (role = membre)
     - Envoyer email bienvenue (Resend)
     - Mettre à jour `adhesions.processed = true`, `membre_id`
- **Retour** : `{ success: true, membre_id }`

**`send-email`**
- **Méthode** : POST
- **Auth** : Service Role Key
- **Params** : `{ to, subject, html, text }`
- **Fonction** : Envoyer email via Resend API
- **Usage** :
  - Confirmation don
  - Reçu fiscal
  - Bienvenue nouveau membre
  - Réponse formulaire contact

**`donations-stats`**
- **Méthode** : GET
- **Auth** : Admins uniquement (RLS check)
- **Params** : `?period=month|year`
- **Fonction** : Calculer statistiques dons
- **Retour** :
```json
{
  "total": 15000,
  "count": 45,
  "average": 333.33,
  "unique_donors": 32,
  "by_method": {
    "stripe": 8000,
    "paypal": 4000,
    "helloasso": 2000,
    "bank_transfer": 1000
  },
  "monthly_trend": [...]
}
```

**`create-stripe-checkout`**
- **Méthode** : POST
- **Auth** : Public
- **Params** : `{ amount, currency, is_recurring, donor_info }`
- **Fonction** :
  1. Créer donation (status pending)
  2. Créer Stripe Checkout Session
  3. Retourner checkout_url
- **Retour** : `{ checkout_url, donation_id }`

**`stripe-webhook`**
- **Méthode** : POST
- **Auth** : Signature Stripe
- **Fonction** :
  - `checkout.session.completed` → Mettre à jour donation.payment_status = 'completed'
  - `customer.subscription.created` → Créer `recurring_donations`
  - `invoice.payment_succeeded` → Logger paiement récurrent
  - Déclencher `send-email` (reçu fiscal)

### 6.4 ROW LEVEL SECURITY (RLS)

**Principe** : Toutes les tables ont RLS enabled.

#### Politiques Site Web (public read) :

**Tables `site_*`** :
```sql
-- SELECT : Public peut voir uniquement les enregistrements actifs
CREATE POLICY "Public peut voir contenu actif"
ON site_hero FOR SELECT
USING (actif = true);

-- INSERT/UPDATE/DELETE : Admins uniquement
CREATE POLICY "Admins peuvent gérer contenu"
ON site_hero FOR ALL
USING (has_role(auth.uid(), 'admin'));
```

#### Politiques Finances :

**`donations`** :
```sql
-- INSERT : Public (pour créer donation)
CREATE POLICY "Public peut créer donations"
ON donations FOR INSERT
WITH CHECK (true);

-- SELECT/UPDATE : Admin + Trésorier
CREATE POLICY "Admins/Trésoriers peuvent voir donations"
ON donations FOR SELECT
USING (
  has_role(auth.uid(), 'admin') OR 
  has_role(auth.uid(), 'tresorier')
);
```

**`adhesions`** :
```sql
-- INSERT : Public
-- SELECT/UPDATE : Admin + Trésorier
```

#### Politiques Membres :

**`membres`** :
```sql
-- SELECT : Tous les membres authentifiés
CREATE POLICY "Membres peuvent voir tous les membres"
ON membres FOR SELECT
USING (auth.uid() IS NOT NULL);

-- UPDATE : Owner OU Admin
CREATE POLICY "Membres peuvent modifier leur profil"
ON membres FOR UPDATE
USING (
  user_id = auth.uid() OR 
  has_role(auth.uid(), 'admin')
);

-- INSERT/DELETE : Admin uniquement
```

**`cotisations`** :
```sql
-- SELECT : Owner OU Admin/Trésorier
CREATE POLICY "Membres voient leurs cotisations"
ON cotisations FOR SELECT
USING (
  membre_id IN (
    SELECT id FROM membres WHERE user_id = auth.uid()
  ) OR
  has_role(auth.uid(), 'admin') OR
  has_role(auth.uid(), 'tresorier')
);
```

### 6.5 FONCTIONS BASE DE DONNÉES

**`has_role(user_id uuid, role_name text)`**
```sql
CREATE FUNCTION has_role(_user_id uuid, _role app_role)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$ LANGUAGE sql STABLE SECURITY DEFINER;
```

**`get_current_user_role()`**
```sql
CREATE FUNCTION get_current_user_role()
RETURNS text AS $$
  SELECT role::text FROM user_roles
  WHERE user_id = auth.uid()
  ORDER BY 
    CASE role
      WHEN 'admin' THEN 1
      WHEN 'tresorier' THEN 2
      ELSE 3
    END
  LIMIT 1
$$ LANGUAGE sql STABLE SECURITY DEFINER;
```

**`handle_new_user()`** (Trigger)
```sql
CREATE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Créer profil
  INSERT INTO profiles (id, nom, prenom, telephone)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'nom', 'Nom'),
    COALESCE(new.raw_user_meta_data->>'prenom', 'Prénom'),
    COALESCE(new.raw_user_meta_data->>'telephone', '')
  );
  
  -- Assigner rôle membre par défaut
  INSERT INTO user_roles (user_id, role)
  VALUES (new.id, 'membre');
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

---

## 7. INTÉGRATIONS TIERCES

### 7.1 STRIPE

**Usage** :
- Paiements CB (one-time + récurrent)
- Gestion abonnements
- Webhooks pour confirmation

**Configuration** :
- API Keys (public + secret)
- Webhook endpoint : `https://[project].supabase.co/functions/v1/stripe-webhook`
- Events : `checkout.session.completed`, `customer.subscription.*`, `invoice.*`

**Frontend** :
- `@stripe/stripe-js` : Stripe.js SDK
- Stripe Elements (CardElement)
- Checkout Session redirect

**Backend** :
- Edge Function `create-stripe-checkout`
- Edge Function `stripe-webhook`
- Stockage : `donations.stripe_payment_id`, `recurring_donations.stripe_subscription_id`

### 7.2 PAYPAL

**Usage** :
- Paiements ponctuels
- Alternative carte bancaire

**Configuration** :
- Client ID + Client Secret
- Mode sandbox / production

**Frontend** :
- `@paypal/react-paypal-js` : SDK React
- Bouton PayPal natif
- Callback success/error

**Backend** :
- Validation transaction via PayPal API
- Stockage : `donations.paypal_transaction_id`

### 7.3 HELLOASSO

**Usage** :
- Plateforme française dédiée associations
- Paiements don/adhésion

**Configuration** :
- Organization slug
- API Key

**Frontend** :
- Iframe HelloAsso OU redirection
- Callback URL

**Backend** :
- Webhook HelloAsso
- Stockage : `donations.helloasso_payment_id`

### 7.4 RESEND (EMAIL)

**Usage** :
- Envoi emails transactionnels
- Reçus fiscaux
- Notifications

**Configuration** :
- API Key (secret Supabase `RESEND_API_KEY`)
- Domaine vérifié : `noreply@e2d.com`

**Templates** :
- Confirmation don
- Reçu fiscal (avec PDF attaché)
- Bienvenue nouveau membre
- Réponse formulaire contact

**Backend** :
- Edge Function `send-email`

### 7.5 SUPABASE AUTH

**Providers** :
- Email/Password (natif)
- Google OAuth (social)
- Lien magique email (optionnel)

**Configuration** :
- Site URL : `https://[domain].app`
- Redirect URLs : `https://[domain].app/portal`, `https://[domain].app/dashboard`
- Email templates (personnalisés)

---

## 8. PARCOURS UTILISATEUR

### 8.1 Parcours Visiteur → Donateur

```
1. Visite homepage (/)
2. Clique "Faire un Don" (CTA Hero)
3. Page /don
4. Sélectionne montant (ex: 50€)
5. Saisit infos (nom, email)
6. Choisit méthode (ex: Stripe)
7. Paiement CB (Stripe Checkout)
8. Redirection → Modal confirmation
9. Email reçu fiscal (si > 10€)
```

### 8.2 Parcours Visiteur → Adhérent

```
1. Visite homepage
2. Clique "Adhérer" (CTA)
3. Page /adhesion
4. Sélectionne type (E2D + Phoenix = 45€)
5. Remplit formulaire (nom, prénom, email, téléphone)
6. Accepte conditions
7. Paiement (ex: PayPal)
8. Redirection → Confirmation
9. Email bienvenue + instructions connexion
10. Visite /portal → Inscription (définir password)
11. Connexion → Dashboard membre
```

### 8.3 Parcours Membre Authentifié

```
1. Connexion /portal (email + password)
2. Dashboard :
   - Voir résumé (dons, cotisations)
   - Statut adhésion
3. Navigation :
   - Mon Profil : Modifier photo, téléphone
   - Mes Dons : Consulter historique, télécharger reçus
   - Mes Cotisations : Voir E2D/Phoenix, upload justificatif
4. Déconnexion
```

### 8.4 Parcours Admin

```
1. Connexion /portal
2. Redirection auto /dashboard (si role admin)
3. Sidebar :
   - Gestion Site Web : Modifier Hero (upload nouvelle image)
   - Finances : Consulter stats dons (graphique mensuel)
   - Membres : Valider adhésion pending (créer membre)
4. Édition contenu :
   - Ajouter événement (titre, date, image)
   - Sauvegarder
5. Preview site public (bouton header)
```

---

## 9. STACK TECHNIQUE

### 9.1 FRONTEND

**Core** :
- **React 18** : Framework UI
- **TypeScript** : Typage statique
- **Vite** : Build tool (hot reload, optimisations)

**Routing** :
- **React Router DOM v6** : Navigation SPA

**Styling** :
- **Tailwind CSS** : Utility-first CSS
- **shadcn/ui** : Composants UI (Radix UI)
- **Lucide React** : Icônes

**State Management** :
- **React Query (TanStack Query)** : Server state, cache, mutations
- **React Context** : Auth state

**Forms & Validation** :
- **React Hook Form** : Gestion formulaires
- **Zod** : Validation schemas

**Data Visualization** :
- **Recharts** : Graphiques (Area, Bar, Line)

**UI Components** :
- Button, Card, Dialog, Dropdown, Input, Select, Table, Tabs, Toast, etc. (shadcn)

### 9.2 BACKEND

**Database** :
- **Supabase PostgreSQL** : DB relationnelle (15 tables)

**Storage** :
- **Supabase Storage** : Buckets S3-like (4 buckets)

**Authentication** :
- **Supabase Auth** : JWT, OAuth, Email/Password

**Serverless Functions** :
- **Supabase Edge Functions** : Deno runtime
- 6 fonctions (payment, email, stats, webhooks)

**APIs** :
- **Supabase JS Client** : `@supabase/supabase-js`

### 9.3 PAIEMENTS

- **Stripe** : `@stripe/stripe-js`
- **PayPal** : `@paypal/react-paypal-js`
- **HelloAsso** : API REST

### 9.4 EMAIL

- **Resend** : API transactional email

### 9.5 DEVOPS

**Hosting** :
- **Frontend** : Lovable Cloud (ou Vercel/Netlify)
- **Backend** : Supabase Cloud

**CI/CD** :
- Déploiement auto (Git push)

**Environnements** :
- Development (local)
- Staging (optionnel)
- Production

**Monitoring** :
- Supabase Dashboard (logs, analytics)
- Sentry (erreurs frontend, optionnel)

---

## 10. LIVRABLES

### 10.1 Code Source

**Repository Git** :
- `/src` : Code React (pages, components, hooks, lib)
- `/supabase` : Migrations SQL, Edge Functions, config
- `/public` : Assets statiques
- `package.json`, `tsconfig.json`, `tailwind.config.ts`, `vite.config.ts`

**Branches** :
- `main` : Production
- `develop` : Development
- `feature/*` : Features

### 10.2 Base de Données

**Migrations SQL** :
- Fichiers `.sql` dans `/supabase/migrations`
- Ordre chronologique (timestamp)
- Includes :
  - Tables creation
  - RLS policies
  - Functions & triggers
  - Seed data (types cotisations, config initiale)

**Schema Documentation** :
- Diagramme ERD (Entity Relationship Diagram)
- Liste tables avec colonnes, types, contraintes
- Relations (FK)

### 10.3 Documentation

**README.md** :
- Présentation projet
- Prérequis (Node 18+, Supabase account)
- Installation (clone, npm install, env setup)
- Commandes (dev, build, deploy)

**INSTALLATION.md** :
- Configuration Supabase (projet, API keys)
- Configuration Stripe/PayPal/HelloAsso
- Configuration Resend
- Variables d'environnement

**USER_GUIDE.md** :
- Guide utilisateur admin (screenshots)
- Comment modifier Hero
- Comment ajouter événement
- Comment valider adhésion

**API_REFERENCE.md** :
- Documentation Edge Functions
- Endpoints, params, retours
- Exemples curl

### 10.4 Assets

**Design System** :
- Palette couleurs (Tailwind config)
- Typographie (fonts)
- Composants UI (Storybook optionnel)

**Images** :
- Logo E2D (SVG)
- Favicon
- Placeholder images

### 10.5 Tests

**Unit Tests** (optionnel) :
- Vitest + React Testing Library
- Tests composants critiques

**E2E Tests** (optionnel) :
- Playwright
- Scénarios : Adhésion, Don, Login

---

## 11. PLANNING ET PHASES

**Durée totale estimée** : 3.5 semaines (1 développeur full-time)

> ⚠️ **Planning ajusté** : Le portail membre étant déjà développé, le planning se concentre sur le site public et le CMS admin uniquement.

### PHASE 1 : Infrastructure CMS (1 semaine)

**Livrables** :
- ✅ Clone repository e2d-connect existant
- ✅ Configuration environnement local
- ⏳ Migrations 7 tables CMS (`site_hero`, `site_about`, `site_activities`, `site_events`, `site_gallery`, `site_partners`, `site_config`)
- ⏳ Création 4 buckets Storage (`site-hero`, `site-gallery`, `site-partners`, `site-events`)
- ⏳ RLS policies pour tables CMS
- ⏳ Seed data (exemples sections)

**Tâches** :
- [ ] Fork/clone https://github.com/Kankan912/e2d-connect.git
- [ ] Configuration `.env` (Supabase keys)
- [ ] Migrations SQL (10 tables CMS : 7 tables de base + 3 nouvelles tables)
  - ✨ `site_hero_images` (carousel Hero)
  - ✨ `site_gallery_albums` (albums galerie)
  - ✨ `site_events_carousel_config` (configuration carousel événements)
- [ ] RLS policies (lecture publique, gestion admin)
- [ ] Buckets Storage (public read)
- [ ] Insertion données démo

### PHASE 2 : Frontend Site Public (1.5 semaines)

**Livrables** :
- ⏳ Page d'accueil complète (8 sections dynamiques)
- ⏳ Navbar publique avec bouton "Portail Membre"
- ⏳ Footer dynamique (config depuis `site_config`)
- ⏳ Responsive design (mobile, tablette, desktop)
- ⏳ Hooks `useSiteContent` pour fetch CMS data

**Tâches** :
- [ ] Composant `Navbar.tsx` (+ bouton vers `/portal`)
- [ ] Composant `Hero.tsx` ✨ avec carousel d'images (fetch depuis `site_hero` + `site_hero_images`)
- [ ] Composant `About.tsx` (fetch depuis `site_about`)
- [ ] Composant `Activities.tsx` (fetch depuis `site_activities`)
- [ ] Composant `Events.tsx` ✨ avec carousel de miniatures (fetch depuis `site_events` + config)
- [ ] Composant `Gallery.tsx` ✨ avec albums (lightbox + lazy loading + albums)
- [ ] Composant `Partners.tsx` (grid logos)
- [ ] Composant `Contact.tsx` (formulaire)
- [ ] Composant `Footer.tsx` (fetch depuis `site_config`)
- [ ] Hook `useSiteHero`, `useSiteAbout`, etc.
- [ ] Page `Index.tsx` (assemble tous les composants)

### PHASE 3 : CMS Admin (1 semaine)

**Livrables** :
- ⏳ 6 pages admin CMS dans `/dashboard/admin/site/*`
- ⏳ Composant `MediaUploader` (upload + liens externes)
- ⏳ CRUD complet pour toutes sections
- ⏳ Integration dans `DashboardSidebar` existante

**Tâches** :
- [ ] Page `/dashboard/admin/site/hero` ✨ avec gestion carousel (existe - à modifier)
- [ ] Page `/dashboard/admin/site/about` (⏳ à créer)
- [ ] Page `/dashboard/admin/site/activities` (✅ existe déjà - vérifier)
- [ ] Page `/dashboard/admin/site/events` ✨ avec config carousel (existe - à modifier)
- [ ] Page `/dashboard/admin/site/gallery` ✨ avec gestion albums (existe - à modifier)
- [ ] Page `/dashboard/admin/site/partners` (✅ existe déjà - vérifier)
- [ ] Page `/dashboard/admin/site/config` (✅ existe déjà - vérifier)
- [ ] Hook `useSiteContent` (mutations update/create/delete)
- [ ] Utils `media-utils.ts`, `storage-utils.ts`
- [ ] Ajouter "Site Web" dans `DashboardSidebar`

### PHASE 4 : Formulaire Contact (0.5 semaine)

**Livrables** :
- ⏳ Edge Function `send-email` (via Resend)
- ⏳ Table `contact_messages` (log messages)
- ⏳ Page admin `/dashboard/admin/messages` (optionnel)
- ⏳ Email notifications

**Tâches** :
- [ ] Migration table `contact_messages`
- [ ] Edge Function `send-email` (Resend API)
- [ ] Configuration Resend API key (secrets)
- [ ] Formulaire Contact avec validation Zod
- [ ] Toast confirmation envoi
- [ ] Page MessagesAdmin (optionnel)

### PHASE 5 : Intégration, Tests & Déploiement (0.5 semaine)

**Livrables** :
- ⏳ Tests navigation Site ↔ Portail
- ⏳ Tests workflows adhésion/don
- ⏳ Tests responsive (mobile, tablette, desktop)
- ⏳ SEO optimisations (meta tags, sitemap)
- ⏳ Documentation mise à jour

**Tâches** :
- [ ] Tests intégration Site → `/portal` (bouton Navbar)
- [ ] Tests intégration Portail → `/` (optionnel : lien sidebar)
- [ ] Tests workflow adhésion : `/adhesion` → Email → `/portal`
- [ ] Tests workflow don : `/don` → Confirmation → Dashboard (si auth)
- [ ] Optimisation performances (lazy loading images)
- [ ] SEO : meta tags, title, description, Open Graph
- [ ] Accessibilité (a11y audit)
- [ ] Documentation README.md (setup, intégration)
- [ ] Déploiement (merge vers `main`)

---

### 📊 RÉCAPITULATIF PLANNING

| Phase | Durée | Livrables Principaux |
|-------|-------|---------------------|
| **Phase 1** | 1 semaine | 10 tables CMS (7 + 3 nouvelles), 4 buckets, RLS |
| **Phase 2** | 1.5 semaines | 8 composants publics (Hero carousel, Events carousel, Gallery albums) |
| **Phase 3** | 1 semaine | 6 pages admin CMS (Hero, Events, Gallery modifiés) |
| **Phase 4** | 0.5 semaine | Contact form + Edge Function |
| **Phase 5** | 0.5 semaine | Tests + Déploiement |
| **TOTAL** | **3.5 semaines** | Site public + CMS intégré |

---

## 12. CONTRAINTES ET PRÉREQUIS

### 12.1 Budget

**Coût mensuel estimé** : 25-50 € (inchangé)

- **Supabase** : Plan gratuit (500 Mo DB, 1 Go Storage, 2M Edge Functions req/mois)
  - Upgrade Pro (~25€/mois) si trafic élevé
- **Resend** : Plan gratuit (100 emails/jour) ou ~10€/mois (illimité)
- **Lovable Cloud / Vercel** : Plan gratuit (hobby) ou ~20€/mois (pro)
- **Domaine** : ~15€/an

> ⚠️ **Économie** : Le portail existant partage déjà l'infrastructure Supabase, réduisant les coûts additionnels.

### 12.2 Compétences Requises

**Frontend** :
- ✅ React 18 + TypeScript (déjà présent dans e2d-connect)
- ✅ Tailwind CSS + shadcn/ui (déjà configuré)
- ✅ React Query (déjà utilisé)
- ✅ React Hook Form + Zod (déjà utilisé)

**Backend** :
- ✅ Supabase (PostgreSQL, Storage, Auth, Edge Functions) - déjà configuré
- ⏳ SQL (migrations, RLS policies) - nouvelles tables CMS
- ⏳ Deno (Edge Functions) - 1 nouvelle fonction (`send-email`)

**Intégrations** :
- ✅ Stripe, PayPal, HelloAsso (déjà intégrés dans portail)
- ⏳ Resend (nouvelle intégration email)

**DevOps** :
- ✅ Git / GitHub (repository existant)
- ✅ CI/CD (déjà configuré pour portail)

### 12.3 Prérequis Techniques

**Avant démarrage** :
- ✅ Compte GitHub avec accès à https://github.com/Kankan912/e2d-connect.git
- ✅ Projet Supabase existant (même instance que portail)
- ✅ Comptes providers paiement (Stripe, PayPal, HelloAsso) - déjà configurés
- ⏳ Compte Resend (gratuit ou payant)
- ✅ Node.js 18+ + npm/pnpm

**Accès requis** :
- Accès **admin** au repository e2d-connect (pour créer branches/PR)
- Accès **propriétaire** au projet Supabase (pour migrations)
- Clés API providers (déjà disponibles dans `payment_configs`)

### 12.4 Contraintes & Points d'Attention Critiques

#### ⚠️ NE PAS MODIFIER (Portail Existant)

**Tables à NE PAS toucher** :
- ❌ `profiles`, `user_roles`, `membres`
- ❌ `donations`, `recurring_donations`, `adhesions`
- ❌ `cotisations`, `cotisations_types`, `epargnes`
- ❌ `payment_configs`, `exercices`, `activites_membres`

**Composants/Hooks à NE PAS modifier** :
- ❌ `src/contexts/AuthContext.tsx`
- ❌ `src/components/layout/DashboardLayout.tsx`
- ❌ `src/components/layout/DashboardHeader.tsx`
- ❌ `src/components/auth/AdminRoute.tsx`
- ❌ `src/hooks/useDonations.ts`
- ⚠️ `src/components/layout/DashboardSidebar.tsx` (modifier uniquement pour ajouter lien "Site Web")

**Routes à NE PAS toucher** :
- ❌ `/portal`, `/dashboard`, `/dashboard/admin/*` (sauf `/dashboard/admin/site/*`)

#### ✅ À CRÉER / MODIFIER

**Nouvelles tables** :
- ✅ 10 tables CMS (`site_*`)
  - 7 tables de base
  - ✨ 3 nouvelles tables (Hero carousel, Gallery albums, Events carousel config)

**Nouveaux composants** :
- ✅ 8 composants publics (`Navbar`, `Hero`, `About`, etc.)
- ✅ 1 page admin supplémentaire (`AboutAdmin`)

**Modifications autorisées** :
- ✅ `DashboardSidebar.tsx` : Ajouter section "Site Web" avec items CMS
- ✅ `App.tsx` / `Router` : Ajouter routes publiques (`/`, `/don`, `/adhesion`)

#### 🔐 Sécurité

**RLS Policies** :
- ✅ Toutes nouvelles tables doivent avoir RLS activé
- ✅ Réutiliser fonction `has_role(user_id, role)` existante
- ✅ Lecture publique (`anon`) pour tables `site_*`
- ✅ Écriture admin uniquement (`has_role(auth.uid(), 'admin')`)

**Secrets** :
- ✅ Ne jamais commiter clés API
- ✅ Utiliser Supabase Secrets pour Edge Functions
- ✅ Variables `.env.local` pour développement

#### 🎨 UX / Design

**Cohérence visuelle** :
- ✅ Réutiliser design system existant (Tailwind config)
- ✅ Palette couleurs identique portail
- ✅ Composants shadcn/ui déjà installés

**Navigation Site → Portail** :
- ✅ Bouton "Portail Membre" bien visible (top right Navbar)
- ✅ Si user authentifié : bouton devient "Mon Tableau de Bord"
- ✅ Transition seamless (pas de rechargement page)

**Workflow Adhésion** :
- ✅ `/adhesion` → Paiement → Email confirmation → "Connectez-vous sur `/portal`"
- ✅ Edge Function `process-adhesion` déjà existante (ne pas recréer)

### 12.5 Conformité RGPD

**Données personnelles** :
- ✅ Consentement explicite (checkbox CGU)
- ✅ Droit d'accès, rectification, suppression (via profil membre)
- ✅ Données chiffrées en transit (HTTPS) et repos (Supabase)
- ✅ RLS empêche accès non autorisé

**Cookies** :
- ✅ JWT tokens (httpOnly, secure)
- ✅ Banner consentement cookies (optionnel selon trafic)

### 12.6 Performance & SEO

**Objectifs Lighthouse** :
- Performance : > 90
- Accessibility : > 90
- Best Practices : > 95
- SEO : > 95

**Optimisations** :
- ✅ Lazy loading images (`loading="lazy"`)
- ✅ Code splitting (React.lazy)
- ✅ CDN Supabase Storage (images)
- ✅ Meta tags dynamiques (title, description, Open Graph)
- ✅ Sitemap.xml
- ✅ Robots.txt

**Hébergement** :
- Supabase : Plan Free (0€) ou Pro (25$/mois) selon volume
- Frontend : Lovable Cloud / Vercel (0€ pour hobby)

**Services tiers** :
- Stripe : 1.4% + 0.25€ par transaction EU
- PayPal : ~2.9% + 0.35€
- HelloAsso : Gratuit (frais optionnels pour donateurs)
- Resend : Plan Free (100 emails/jour) ou Pro (10$/mois, 50k emails)

**Total mensuel estimé** : 25-50€ (hors frais transactions)

### 12.2 Compétences Requises

**Développeur(s)** :
- React + TypeScript (intermédiaire/avancé)
- Tailwind CSS
- Supabase (PostgreSQL, RLS, Edge Functions)
- Intégrations paiement (Stripe API)
- Git

**Optionnel** :
- Design UI/UX (si customisation)
- DevOps (CI/CD)

### 12.3 Prérequis Techniques

**Développement** :
- Node.js 18+ (LTS)
- npm ou pnpm
- Git
- VSCode (recommandé)

**Comptes** :
- Supabase (gratuit)
- Stripe (test mode gratuit)
- PayPal Developer (gratuit)
- HelloAsso (association française)
- Resend (gratuit jusqu'à 100 emails/jour)
- Google Cloud (pour OAuth, gratuit)

### 12.4 Conformité RGPD

**Données personnelles collectées** :
- Donateurs : nom, email, téléphone (opt)
- Membres : nom, prénom, email, téléphone, photo

**Mesures** :
- Consentement explicite (checkboxes)
- Page Politique de confidentialité
- Page Mentions légales
- Droit accès/rectification/suppression (fonctionnalités admin)
- Chiffrement données sensibles (secrets paiement)
- RLS pour isolation données

**Cookies** :
- Auth JWT (httpOnly, secure)
- Banner cookies (si analytics)

### 12.5 Accessibilité

**Standards** :
- WCAG 2.1 niveau AA
- Aria labels
- Navigation clavier
- Contraste couleurs

**Tests** :
- axe DevTools
- Lighthouse (score > 90)

### 12.6 Performance

**Objectifs** :
- First Contentful Paint : < 1.5s
- Time to Interactive : < 3s
- Lighthouse Performance : > 90

**Optimisations** :
- Lazy loading images
- Code splitting (React.lazy)
- CDN assets
- Compression Gzip/Brotli

---

## 📞 CONTACT & SUPPORT

**Chef de projet** : [Nom]  
**Email** : [email]  
**Slack** : [channel]  

**Support technique** :
- Supabase Discord : [lien]
- Documentation : `README.md`, `docs/`

---

## 🔄 VERSIONING

**v1.0** : Janvier 2025 - Cahier des charges initial
**v2.0** : Janvier 2025 - Ajustement focus site public + intégration portail existant
**v2.1** : Janvier 2025 - ✨ Ajout fonctionnalités avancées

### Modifications v2.1 - Fonctionnalités Avancées

#### 1️⃣ Hero avec Carousel d'Images ✨
- **Avant** : Une seule image de fond statique
- **Après** : Carousel automatique avec plusieurs images
- **Nouvelles tables** :
  - `site_hero_images` : Stocke plusieurs images pour le Hero
  - Relation : `site_hero` (1) → `site_hero_images` (N)
- **Nouvelles colonnes `site_hero`** :
  - `carousel_auto_play` (boolean) : Activer/désactiver défilement auto
  - `carousel_interval` (int) : Intervalle en ms entre images (défaut 5000ms)
- **Admin CMS** :
  - Upload multiple d'images avec drag & drop
  - Réorganisation ordre par drag & drop
  - Configuration défilement automatique et intervalle
- **UX Frontend** :
  - Flèches de navigation (prev/next)
  - Indicateurs en bas (dots)
  - Transition smooth entre images

#### 2️⃣ Galerie avec Albums/Catalogues ✨
- **Avant** : Liste plate d'images, impossible d'organiser par albums
- **Après** : Architecture hiérarchique Albums → Photos/Vidéos
- **Nouvelles tables** :
  - `site_gallery_albums` : Albums avec nom, description, image couverture
  - Modification `site_gallery` : Ajout colonne `album_id` (FK)
- **Admin CMS** :
  - Création/édition d'albums
  - Upload multiple d'images par album
  - Image de couverture pour chaque album
  - Réorganisation images dans un album
  - Changement d'album pour une image
- **UX Frontend** :
  - Vue albums (grid de couvertures)
  - Clic sur album → affiche toutes les photos/vidéos
  - Lightbox pour navigation dans l'album
  - Breadcrumb : Galerie > Nom Album > Photo

#### 3️⃣ Événements avec Carousel de Miniatures ✨
- **Avant** : Liste statique d'événements
- **Après** : Carousel automatique des miniatures d'événements
- **Nouvelles tables** :
  - `site_events_carousel_config` : Configuration du carousel
    - `auto_play`, `interval`, `show_navigation`, `show_indicators`
- **Admin CMS** :
  - Onglet "Paramètres Carousel" dans page Événements
  - Configuration défilement automatique et intervalle (2-8s)
  - Toggle affichage navigation/indicateurs
- **UX Frontend** :
  - Section dédiée "Prochains Événements" avec carousel
  - Miniatures défilent automatiquement selon fréquence définie
  - Flèches navigation + indicateurs
  - Clic sur miniature → détails événement

#### 📊 Récapitulatif Technique

| Élément | v2.0 | v2.1 |
|---------|------|------|
| **Tables CMS** | 7 tables | 10 tables (+3) |
| **Buckets Storage** | 4 buckets | 4 buckets (inchangé) |
| **Pages Admin** | 6 pages | 6 pages (3 modifiées) |
| **Composants Frontend** | 8 composants | 8 composants (3 modifiés) |
| **Fonctionnalités UX** | Standard | Carousels + Albums |

#### 🎯 Impact Planning

- **Durée totale** : Inchangée (3.5 semaines)
- **Phase 1** : +0.5 jour (3 tables supplémentaires)
- **Phase 2** : +0.5 jour (intégration carousels)
- **Phase 3** : +1 jour (modifications admin Hero, Events, Gallery)

**Nouvelle estimation** : ~4 semaines (au lieu de 3.5)

**Prochaines évolutions** :
- Multilingue (FR/EN)
- Application mobile (React Native)
- Module événements avancé (billetterie)
- Intégration comptabilité (export compta)

---

**FIN DU CAHIER DES CHARGES**

Ce document constitue la référence complète pour le développement du projet E2D Connect. Toute modification doit être validée et versionnée.