# CAHIER DES CHARGES - SITE WEB E2D CONNECT

## 📋 CONTEXTE DU PROJET

### Présentation
Développement d'un **site web vitrine public** pour l'Association Sportive E2D, une communauté de football basée sur les valeurs de solidarité, respect et excellence. Le site sera intégré au portail interne de gestion de l'association.

### Objectifs
- Présenter l'association et ses activités au grand public
- Attirer de nouveaux membres et partenaires
- Permettre les dons et adhésions en ligne
- Gérer le contenu via un CMS admin intégré au portail

---

## 🎯 PÉRIMÈTRE FONCTIONNEL

### 1. SITE WEB PUBLIC (Frontend)

#### 1.1 Page d'Accueil (`/`)
Composée de 8 sections dynamiques :

**A. Section Hero**
- Bannière principale avec image de fond
- Badge personnalisable ("E2D Connect")
- Titre et sous-titre accrocheurs
- 2 boutons d'action (CTA)
- 3 statistiques clés (ex: 150 membres, 12 tournois, 5 années)
- Indicateur de scroll

**B. Section À Propos (`#apropos`)**
- Titre et sous-titre de la mission
- Histoire de l'association (titre + contenu riche)
- 3-4 valeurs fondamentales avec icônes

**C. Section Activités (`#activites`)**
- Présentation des activités sportives
- Cards avec icône, titre, description et caractéristiques
- CTA "Contactez-nous" en bas de section

**D. Section Événements (`#evenements`)**
- Liste des événements à venir
- Pour chaque événement : type, date, heure, lieu
- Image illustrative avec overlay statistiques

**E. Section Galerie (`#galerie`)**
- Grille de photos et vidéos
- Catégorisation (Matchs, Entraînements, Événements)
- Effet hover avec informations
- Support vidéo YouTube/Vimeo

**F. Section Partenaires (`#partenaires`)**
- Logos des partenaires avec liens
- CTA "Devenir Partenaire"

**G. Section Contact (`#contact`)**
- Formulaire de contact (nom, email, téléphone, message)
- Informations de contact (email, téléphone, adresse, Facebook)
- Liens rapides (Portail, Adhésion, Don)

**H. Footer**
- Informations association (logo, nom, description)
- Liens réseaux sociaux
- Navigation par sections
- Copyright et mentions

#### 1.2 Navigation (Navbar)
- Logo E2D
- Menu desktop avec liens d'ancrage
- Menu mobile responsive (burger)
- Bouton "Portail Membre" (lien vers `/portal`)

#### 1.3 Pages Secondaires

**Page Don (`/don`)**
- Sélection du montant de don
- Choix de la méthode de paiement :
  - Carte bancaire (Stripe)
  - PayPal
  - HelloAsso
  - Virement bancaire
- Option don récurrent
- Message personnalisé du donateur
- Modal de confirmation

**Page Adhésion (`/adhesion`)**
- Formulaire d'inscription membre
- Choix du type d'adhésion (E2D / Phoenix / Les deux)
- Paiement de la cotisation
- Validation et confirmation par email

---

### 2. SYSTÈME DE GESTION DE CONTENU (CMS)

#### 2.1 Architecture Backend

**Tables Supabase créées :**
1. `site_hero` - Contenu section Hero
2. `site_about` - Contenu section À Propos
3. `site_activities` - Activités sportives
4. `site_events` - Événements à venir
5. `site_gallery` - Photos et vidéos
6. `site_partners` - Partenaires
7. `site_config` - Configuration globale (email, téléphone, adresse, réseaux sociaux, etc.)

**Système de stockage hybride :**
- 4 buckets Supabase Storage : `site-hero`, `site-gallery`, `site-partners`, `site-events`
- Support upload direct + liens externes
- Champs `media_source` : "storage" ou "external"
- Utilitaires : `storage-utils.ts`, `media-utils.ts`

**Sécurité :**
- RLS activé sur toutes les tables
- Lecture publique (SELECT)
- Gestion réservée aux admins (INSERT, UPDATE, DELETE)

#### 2.2 Pages d'Administration

Accessibles via le portail interne `/dashboard/admin/site/` :

**A. Hero Admin (`/hero`)**
- Modification titre, sous-titre, badge
- Upload/lien image de fond
- Configuration des 2 boutons CTA
- Édition des 3 statistiques

**B. À Propos Admin (`/about`)** [À CRÉER]
- Édition titre, sous-titre
- Modification histoire (titre + contenu riche)
- Gestion des valeurs (icône, titre, description)

**C. Activités Admin (`/activities`)**
- Liste des activités avec drag & drop (ordre)
- CRUD : Créer, Modifier, Supprimer
- Champs : icône, titre, description, caractéristiques

**D. Événements Admin (`/events`)**
- Calendrier des événements
- CRUD avec upload image
- Champs : titre, type, date, heure, lieu, description

**E. Galerie Admin (`/gallery`)**
- Upload photos/vidéos
- Support liens externes (YouTube, Vimeo)
- Catégorisation et réorganisation
- Champs : titre, catégorie, image/vidéo

**F. Partenaires Admin (`/partners`)**
- Gestion liste partenaires
- Upload logo ou lien externe
- Champs : nom, logo, site web, description, ordre

**G. Configuration Admin (`/config`)**
- Paramètres globaux du site
- Édition par catégorie (général, contact, social)
- Clés : `site_name`, `site_email`, `site_telephone`, `site_adresse`, `site_description`, `facebook_url`, `site_year`, etc.

**H. Messages Contact Admin (`/messages`)** [À CRÉER]
- Liste des messages du formulaire de contact
- Statut : nouveau, lu, traité
- Actions : répondre, archiver

#### 2.3 Composant Transversal

**MediaUploader**
- Upload fichier Supabase Storage
- Saisie URL externe
- Prévisualisation
- Validation format (images, vidéos)
- Utilisé dans : Gallery, Partners, Events, Hero

---

### 3. SYSTÈME DE DONS & ADHÉSIONS

#### 3.1 Tables Backend
- `donations` - Historique des dons
- `adhesions` - Adhésions membres
- `recurring_donations` - Abonnements récurrents
- `payment_configs` - Configuration moyens de paiement

#### 3.2 Edge Functions (Supabase)
- `get-payment-config` - Récupération config paiements
- `process-adhesion` - Traitement adhésion
- `send-email` - Envoi emails confirmation
- `donations-stats` - Statistiques dons

#### 3.3 Frontend
- Schémas de validation Zod (`donation-schemas.ts`)
- Utilitaires paiement (`payment-utils.ts`)
- Composants : `DonationAmountSelector`, `PaymentMethodTabs`, `BankTransferInfo`, `DonationSuccessModal`

---

## 🛠️ STACK TECHNIQUE

### Frontend
- **Framework** : React 18 + TypeScript
- **Build** : Vite
- **Routing** : React Router DOM v6
- **Styling** : Tailwind CSS + shadcn/ui
- **State Management** : React Query (TanStack Query)
- **Forms** : React Hook Form + Zod
- **Icons** : Lucide React

### Backend
- **BaaS** : Supabase (Lovable Cloud)
- **Database** : PostgreSQL
- **Storage** : Supabase Storage (buckets)
- **Auth** : Supabase Auth
- **Functions** : Supabase Edge Functions (Deno)

### Intégrations Paiement
- Stripe (cartes bancaires)
- PayPal
- HelloAsso
- Virement bancaire

---

## 📂 STRUCTURE DES FICHIERS

### Pages Principales
```
src/pages/
├── Index.tsx              # Page d'accueil publique
├── Don.tsx                # Page de don
├── Adhesion.tsx           # Page d'adhésion
├── Portal.tsx             # Portail interne (auth)
├── Dashboard.tsx          # Dashboard admin
└── admin/
    ├── DonationsAdmin.tsx
    └── site/
        ├── HeroAdmin.tsx
        ├── ActivitiesAdmin.tsx
        ├── EventsAdmin.tsx
        ├── GalleryAdmin.tsx
        ├── PartnersAdmin.tsx
        └── ConfigAdmin.tsx
```

### Composants Publics
```
src/components/
├── Navbar.tsx
├── Hero.tsx
├── About.tsx
├── Activities.tsx
├── Events.tsx
├── Gallery.tsx
├── Partners.tsx
├── Contact.tsx
└── Footer.tsx
```

### Hooks & Utilitaires
```
src/hooks/
└── useSiteContent.ts      # 435 lignes - Hooks React Query CMS

src/lib/
├── storage-utils.ts       # Upload Supabase Storage
├── media-utils.ts         # Gestion médias hybrides
├── payment-utils.ts       # Logique paiements
└── donation-schemas.ts    # Validation formulaires
```

---

## ✅ ÉTAT D'AVANCEMENT ACTUEL

### ✅ Complété (100%)

#### Infrastructure & Base de données
- [x] 7 tables CMS créées avec RLS
- [x] 4 buckets Supabase Storage
- [x] 2 migrations SQL appliquées
- [x] Données de démonstration insérées

#### Backend
- [x] Hook `useSiteContent.ts` complet (CRUD pour toutes les sections)
- [x] Hooks custom : `useSiteHero()`, `useSiteAbout()`, `useSiteActivities()`, etc.
- [x] Mutations React Query (create, update, delete)
- [x] Utilitaires storage et médias

#### Admin CMS
- [x] 6 pages admin fonctionnelles
- [x] Composant `MediaUploader` réutilisable
- [x] Routes protégées (`AdminRoute`)
- [x] Section "Site Web" dans sidebar admin

#### Frontend Public
- [x] 8 composants dynamiques connectés à la DB
- [x] Navbar responsive avec menu mobile
- [x] Footer dynamique avec `useSiteConfig()`
- [x] Contact dynamique avec `useSiteConfig()`
- [x] Skeleton loaders sur toutes les sections

#### Système Dons/Adhésions
- [x] Page `/don` avec sélection montant
- [x] Page `/adhesion` avec formulaire
- [x] 4 méthodes de paiement intégrées
- [x] Edge Functions backend
- [x] Validation Zod

---

### ⏳ Phases Restantes (Priorité Haute)

#### Phase A : Admin Dons & Adhésions
- [ ] **A1. DonationsAdmin** : Graphique évolution 12 mois + onglets abonnements + config
- [ ] **A2. AdhesionsAdmin** : Liste + filtres + workflow validation
- [ ] **A3. PaymentConfigAdmin** : CRUD config paiements + test connexions

#### Phase B : Admin Section "À Propos"
- [ ] **B1. AboutAdmin** : Page CRUD pour `site_about` (titre, histoire, valeurs)

#### Phase C : Formulaire Contact Backend
- [ ] **C1. Table `contact_messages`** : Stockage messages
- [ ] **C2. Hook `useSubmitContact()`** : Insertion DB + email
- [ ] **C3. MessagesAdmin** : Liste + gestion messages reçus

---

## 🎨 DESIGN & UX

### Principes
- Design moderne et épuré
- Palette de couleurs E2D (à définir)
- Responsive mobile-first
- Animations subtiles (hover, transitions)
- Loading states (skeletons) partout

### Accessibilité
- Navigation clavier
- Contraste WCAG AA
- ARIA labels
- Focus visible

---

## 🔐 SÉCURITÉ

### Backend
- Row Level Security (RLS) sur toutes les tables
- Authentification Supabase (JWT)
- Rôles : `admin`, `membre`, `public`
- Validation côté serveur (Edge Functions)

### Frontend
- Routes protégées (`AdminRoute`)
- Validation formulaires (Zod)
- Sanitization inputs
- HTTPS obligatoire

---

## 📊 MÉTRIQUES & KPIs

### Site Public
- Nombre de visiteurs uniques
- Taux de conversion (adhésions)
- Montant total des dons

### CMS Admin
- Nombre de modifications de contenu
- Temps de chargement des pages
- Taux d'utilisation des fonctionnalités

---

## 🚀 DÉPLOIEMENT

### Environnements
- **Production** : Lovable.dev (ou domaine custom)
- **Base de données** : Supabase Cloud
- **CDN** : Intégré Lovable

### Process
1. Push code sur repo Git
2. Auto-deploy Lovable
3. Vérification admin CMS
4. Publication

---

## 📝 DOCUMENTATION TECHNIQUE

### Fichiers créés
- `CMS_IMPLEMENTATION.md` - Documentation CMS
- `DONATIONS_README.md` - Documentation système dons
- `CAHIER_DES_CHARGES_SITE_WEB.md` - Cahier des charges complet

### Conventions
- TypeScript strict mode
- ESLint + Prettier
- Commits conventionnels
- Components fonctionnels React

---

## 🎯 PROCHAINES ÉTAPES RECOMMANDÉES

### Priorité 1 - Finaliser Admin Dons (4-6h)
1. Compléter `DonationsAdmin.tsx` (graphique + onglets)
2. Créer `AdhesionsAdmin.tsx`
3. Créer `PaymentConfigAdmin.tsx`

### Priorité 2 - Admin "À Propos" (2-3h)
1. Créer `AboutAdmin.tsx`
2. Formulaire édition valeurs (array)

### Priorité 3 - Contact Backend (2h)
1. Créer table `contact_messages`
2. Hook `useSubmitContact()`
3. Page `MessagesAdmin.tsx`

---

## 📧 CONTACTS & SUPPORT

- **Email** : alexr.fotso@gmail.com
- **Facebook** : @phoenixkmra
- **Portail Admin** : `/dashboard/admin`

---

**Document créé le** : 2025-11-01  
**Dernière mise à jour** : 2025-11-01  
**Version** : 1.0
