# 📋 CAHIER DES CHARGES - PROJET COMPLET
## Plateforme Web E2D Connect - Site Vitrine + Portail Membre + Backoffice Admin

**Version:** 1.0  
**Date:** Janvier 2025  
**Type:** Application Web Full-Stack avec CMS Intégré

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

Actuellement, l'association manque d'outils numériques pour :
- Présenter ses activités au grand public
- Gérer les adhésions et les dons en ligne
- Offrir un espace membre sécurisé
- Administrer le contenu du site sans compétences techniques
- Centraliser la gestion financière (dons, cotisations, épargnes)

### 1.3 Solution Proposée

Développer une **plateforme web complète** comprenant :
1. **Site Web Public** : Vitrine institutionnelle dynamique
2. **Portail Membre** : Espace personnel authentifié pour les adhérents
3. **Backoffice Admin** : CMS complet + gestion membres + gestion financière

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

### 4.1 Trois Modules Principaux

#### Module 1 : Site Web Public
- URL : `/` (homepage)
- 8 sections dynamiques gérées par CMS
- 2 pages secondaires : `/don`, `/adhesion`
- SEO optimisé, responsive design

#### Module 2 : Portail Membre
- URL : `/portal` (après connexion)
- Dashboard personnel
- Historique dons/cotisations
- Profil modifiable
- Téléchargement reçus fiscaux

#### Module 3 : Backoffice Admin
- URL : `/dashboard/*` (protégé par rôle admin)
- CMS pour gérer le site web
- Gestion membres (CRUD, rôles)
- Gestion financière (dons, adhésions, stats)
- Configuration globale

---

## 5. SPÉCIFICATIONS FONCTIONNELLES DÉTAILLÉES

### 5.1 SITE WEB PUBLIC

#### 5.1.1 Page d'Accueil (`/`)

**Section Hero (site_hero)**
- **Contenu dynamique** :
  - Badge texte (ex: "E2D Connect")
  - Titre principal (H1)
  - Sous-titre
  - Image de fond (upload ou lien externe)
  - 2 boutons CTA configurables (texte + lien)
  - 3 statistiques avec chiffres + labels
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

**Section Événements (site_events)**
- **Contenu** :
  - Titre, type (tournoi/match/social), date, heure, lieu
  - Description, image
  - Ordre configurable, statut actif/inactif
- **Layout** : Timeline chronologique ou cards
- **Tri** : Par date décroissante

**Section Galerie (site_gallery)**
- **Contenu** :
  - Images avec titre, catégorie
  - Support upload direct + liens externes
  - Ordre manuel + filtres par catégorie
- **UI** : Lightbox, navigation clavier, lazy loading
- **Catégories** : Tournois, Entraînements, Événements, Autre

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

### 5.2 PORTAIL MEMBRE

#### 5.2.1 Authentification (`/portal`)

**Méthodes de connexion** :
- Email + Password (Supabase Auth)
- Google OAuth (social login)
- Lien magique par email (optionnel)

**Écrans** :
- Login (email/password + bouton Google)
- Inscription (nom, prénom, email, password)
- Mot de passe oublié (reset link)
- Vérification email

**Sécurité** :
- Hash bcrypt passwords
- Rate limiting (max 5 tentatives/5min)
- JWT tokens (access + refresh)
- RLS sur toutes les tables

#### 5.2.2 Dashboard Membre

**Aperçu** :
- Message de bienvenue personnalisé
- Résumé contributions (total dons, total cotisations)
- Statut adhésion (actif/expiré, date limite)
- Prochains événements (3 prochains)

**Cards** :
- Mes Dons (total + dernier don)
- Mes Cotisations (taux paiement E2D/Phoenix)
- Mon Profil (complétude %)
- Actions rapides (faire un don, mettre à jour profil)

#### 5.2.3 Mon Profil

**Informations modifiables** :
- Photo de profil (upload vers `membre-photos` bucket)
- Nom, Prénom
- Email (avec re-vérification)
- Téléphone
- Équipe E2D (dropdown)
- Équipe Phoenix (Jaune/Rouge)
- Fonction (optionnel)

**Actions** :
- Bouton "Enregistrer" (mutation avec toast)
- Bouton "Changer mot de passe" (modal)

#### 5.2.4 Mes Dons

**Liste des dons** :
- Tableau : Date, Montant, Devise, Statut, Méthode paiement
- Filtres : Date (plage), Statut (tous/completed/pending), Méthode
- Tri : Par date décroissante (défaut)

**Actions par ligne** :
- Télécharger reçu fiscal (si disponible)
- Voir détails (modal avec transaction_metadata)

**Statistiques** :
- Total donné (année en cours)
- Total historique
- Graphique évolution mensuelle (Recharts)

#### 5.2.5 Mes Cotisations

**Onglets** :
- Cotisations E2D
- Cotisations Phoenix

**Pour chaque onglet** :
- Tableau : Année, Montant, Date paiement, Statut
- Badge statut (payé/impayé/partiel)
- Upload justificatif (si payé manuellement)

**Alertes** :
- Notification si cotisation impayée proche échéance
- Bouton "Payer maintenant" (redirection `/don` avec pré-remplissage)

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

#### 5.3.2 Gestion du Site Web - Hero

**Formulaire** :
- Badge texte (input)
- Titre (input)
- Sous-titre (textarea)
- Image de fond :
  - Composant `MediaUploader` (upload → bucket `site-hero` OU lien externe)
  - Preview image
- Bouton 1 : Texte + Lien
- Bouton 2 : Texte + Lien
- 3 Statistiques : Nombre + Label (6 inputs)
- Toggle "Actif"

**Actions** :
- Bouton "Enregistrer" (mutation → `site_hero` table)
- Toast confirmation

**UX** :
- Skeleton loader pendant fetch
- Validation temps réel
- Preview live (optionnel)

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

#### 5.3.5 Gestion du Site Web - Événements

**Interface** :
- Tableau : Date, Titre, Type, Lieu, Actif, Actions
- Filtres : Type (tous/tournoi/match/social), Statut (actif/inactif)
- Bouton "Nouvel événement"

**Modal Création/Édition** :
- Titre*, Type* (select)
- Date*, Heure (time picker)
- Lieu*, Description (textarea)
- Image (MediaUploader → bucket `site-events`)
- Ordre, Toggle Actif

**Tri** :
- Par défaut : Date décroissante
- Changeable par admin

#### 5.3.6 Gestion du Site Web - Galerie

**Interface** :
- Grid photos (3-4 colonnes)
- Chaque photo : Image, Titre, Catégorie
- Filtres : Catégorie
- Bouton "Ajouter photo"

**Upload** :
- Drag & drop zone
- Multi-upload (max 10 photos simultanément)
- Progress bar par fichier
- Auto-upload vers bucket `site-gallery`

**Modal Édition Photo** :
- Preview image
- Titre*, Catégorie* (select)
- Ordre
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

#### 6.1.1 Tables Site Web (7 tables)

**`site_hero`**
```sql
- id (uuid, PK)
- titre (text, NOT NULL)
- sous_titre (text, NOT NULL)
- badge_text (text, default 'E2D Connect')
- image_url (text, NOT NULL)
- media_source (text, default 'external') -- 'upload' ou 'external'
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
- actif (boolean, default true)
- created_at, updated_at (timestamptz)
```

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

**`site_gallery`**
```sql
- id (uuid, PK)
- titre (text, NOT NULL)
- categorie (text, NOT NULL) -- 'tournois', 'entrainements', 'evenements', 'autre'
- image_url (text, NOT NULL)
- media_source (text)
- ordre (int)
- actif (boolean)
- created_at, updated_at
```

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

#### 6.1.2 Tables Finances (8 tables)

**`donations`**
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

**`adhesions`**
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

**Durée totale estimée** : 7 semaines (1 développeur full-time)

### PHASE 1 : Infrastructure & Auth (1 semaine)

**Livrables** :
- Setup projet Vite + React + TypeScript
- Configuration Tailwind + shadcn/ui
- Création projet Supabase
- Migrations initiales (tables users, profiles, user_roles)
- Supabase Auth (Email/Password + Google)
- Layout de base (Navbar, Footer)
- Pages Login, Register, Reset Password

**Tâches** :
- [ ] Initialiser repo Git
- [ ] Setup Vite + dependencies
- [ ] Créer projet Supabase
- [ ] Configurer Auth providers
- [ ] Créer migrations auth
- [ ] Implémenter AuthContext
- [ ] Composants Login/Register
- [ ] Protected routes (AdminRoute)

### PHASE 2 : Site Web Public + CMS (2 semaines)

**Semaine 1 : Frontend Public**

**Livrables** :
- Page d'accueil complète (8 sections)
- Navbar responsive
- Footer
- Formulaire contact (envoi email)

**Tâches** :
- [ ] Migrations tables `site_*` (7 tables)
- [ ] Créer buckets Storage (4 buckets)
- [ ] Composant Hero (dynamique)
- [ ] Composant About
- [ ] Composant Activities
- [ ] Composant Events
- [ ] Composant Gallery (lightbox)
- [ ] Composant Partners
- [ ] Composant Contact (form + validation)
- [ ] Edge Function `send-email`

**Semaine 2 : CMS Admin**

**Livrables** :
- Dashboard admin (layout + sidebar)
- Pages admin site web (6 pages)
- Composant MediaUploader
- CRUD complet sections

**Tâches** :
- [ ] Layout DashboardLayout + Sidebar
- [ ] Page HeroAdmin (form + MediaUploader)
- [ ] Page AboutAdmin
- [ ] Page ActivitiesAdmin (table + modal)
- [ ] Page EventsAdmin
- [ ] Page GalleryAdmin (grid + upload)
- [ ] Page PartnersAdmin
- [ ] Page ConfigAdmin (onglets)
- [ ] Hooks `useSiteContent` (fetch + mutations)
- [ ] Utils `storage-utils.ts`, `media-utils.ts`

### PHASE 3 : Système Dons & Adhésions (2 semaines)

**Semaine 1 : Frontend Don/Adhésion**

**Livrables** :
- Page `/don` complète
- Page `/adhesion` complète
- Intégration Stripe frontend
- Intégration PayPal frontend

**Tâches** :
- [ ] Migrations tables `donations`, `adhesions`, `payment_configs`
- [ ] Page Don (form + montants présets)
- [ ] DonationAmountSelector component
- [ ] PaymentMethodTabs component
- [ ] Intégration Stripe Elements
- [ ] Intégration PayPal Button
- [ ] BankTransferInfo component
- [ ] DonationSuccessModal
- [ ] Page Adhesion (form + validation)
- [ ] Schemas Zod (`donation-schemas.ts`)

**Semaine 2 : Backend Paiements**

**Livrables** :
- Edge Functions paiements
- Webhooks Stripe
- Configuration paiements admin

**Tâches** :
- [ ] Edge Function `get-payment-config`
- [ ] Edge Function `create-stripe-checkout`
- [ ] Edge Function `stripe-webhook`
- [ ] Edge Function `process-adhesion`
- [ ] Page PaymentConfigAdmin
- [ ] Envoi email reçu fiscal
- [ ] Tests paiements (sandbox)

### PHASE 4 : Portail Membre (1 semaine)

**Livrables** :
- Dashboard membre
- Mon Profil
- Mes Dons
- Mes Cotisations

**Tâches** :
- [ ] Migration table `cotisations`, `cotisations_types`
- [ ] Page Portal Dashboard
- [ ] Page Mon Profil (édition + upload photo)
- [ ] Page Mes Dons (table + filtres)
- [ ] Page Mes Cotisations (onglets E2D/Phoenix)
- [ ] Hooks `useDonations`, `useMemberProfile`
- [ ] Composant StatCard
- [ ] Génération reçus fiscaux (PDF)

### PHASE 5 : Backoffice Admin Complet (1 semaine)

**Livrables** :
- Gestion membres
- Statistiques financières
- Validation adhésions

**Tâches** :
- [ ] Migration tables `activites_membres`
- [ ] Page Gestion Membres (table + modal)
- [ ] Page Détails Membre
- [ ] Page DonationsAdmin (stats + liste)
- [ ] Page AdhesionsAdmin (validation)
- [ ] Edge Function `donations-stats`
- [ ] Graphiques Recharts (évolution dons)
- [ ] Export CSV donations

### PHASE 6 : Tests, Optimisations & Déploiement (1 semaine)

**Livrables** :
- Application production-ready
- Documentation complète
- Déploiement

**Tâches** :
- [ ] Tests E2E (Playwright)
- [ ] Optimisation performances (lazy loading, code splitting)
- [ ] SEO (meta tags, sitemap)
- [ ] Accessibilité (a11y audit)
- [ ] Security audit (RLS, secrets)
- [ ] Rédaction documentation
- [ ] Configuration domaine production
- [ ] Déploiement Supabase + Frontend
- [ ] Tests post-déploiement
- [ ] Formation admin

---

## 12. CONTRAINTES ET PRÉREQUIS

### 12.1 Budget

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
**Prochaines évolutions** :
- Multilingue (FR/EN)
- Application mobile (React Native)
- Module événements avancé (billetterie)
- Intégration comptabilité (export compta)

---

**FIN DU CAHIER DES CHARGES**

Ce document constitue la référence complète pour le développement du projet E2D Connect. Toute modification doit être validée et versionnée.