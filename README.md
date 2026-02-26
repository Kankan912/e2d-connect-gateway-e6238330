# E2D — Plateforme de Gestion Associative

Application web de gestion complète pour l'association E2D : membres, cotisations, trésorerie, réunions, sport, dons.

## Quick Start

```bash
git clone <YOUR_GIT_URL>
cd <YOUR_PROJECT_NAME>
npm install
npm run dev
```

L'application démarre sur `http://localhost:5173`.

## Stack technique

- **Frontend** : React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui
- **Backend** : Supabase (PostgreSQL, Auth, Storage, Edge Functions)
- **State** : React Query (TanStack Query v5)
- **Tests** : Vitest + Testing Library

## Documentation

| Document | Description |
|----------|-------------|
| [Architecture](docs/ARCHITECTURE.md) | Structure du projet, patterns, flux de données |
| [Référence Hooks](docs/HOOKS_REFERENCE.md) | Liste complète des hooks avec paramètres et exemples |
| [Schéma BDD](docs/DATABASE_SCHEMA.md) | Diagramme ERD Mermaid des tables principales |
| [Permissions & RLS](docs/RLS_PERMISSIONS.md) | Rôles, politiques RLS, vérification côté client |
| [Guide de Contribution](docs/CONTRIBUTING.md) | Comment ajouter une fonctionnalité |
| [Guide Utilisateur](docs/GUIDE_UTILISATEUR.md) | Manuel utilisateur |
| [Checklist Implémentation](docs/IMPLEMENTATION_CHECKLIST.md) | État d'avancement des fonctionnalités |

## Modules principaux

- **Membres** : Inscription, profils, rôles, statuts
- **Cotisations** : Saisie par réunion, suivi par exercice, récapitulatifs
- **Caisse** : Journal comptable, synthèse, ventilation, alertes
- **Réunions** : Présences, sanctions, bénéficiaires, comptes rendus
- **Prêts** : Accordement, paiements, reconduction, alertes échéance
- **Épargnes** : Dépôts, suivi par membre et exercice
- **Sport** : Matchs E2D/Phoenix, classements, compositions, statistiques
- **Dons** : Formulaire public, suivi admin
- **Notifications** : Campagnes email, rappels automatiques

## Développement avec Lovable

Ce projet est éditable via [Lovable](https://lovable.dev/projects/403b8901-aa9b-44e8-8af7-a7b15ab6114d). Les modifications sont commitées automatiquement.

## Déploiement

Ouvrir [Lovable](https://lovable.dev/projects/403b8901-aa9b-44e8-8af7-a7b15ab6114d) → Share → Publish.

Support domaine personnalisé : Project → Settings → Domains → Connect Domain.
