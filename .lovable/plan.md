## Lot 2 — Pages membre : filtres, échéancier, exports

Lot 1 vérifié ✅ : filtres (recherche / statut / équipe), colonne Équipe, exports CSV + PDF, états vides gérés, mémoïsation — tout est conforme au plan.

### Objectif
Aligner les pages côté membre (`MyCotisations`, `MyPrets`, `MesDemandesPret`) sur le même standard que l'admin : filtres, vue détaillée et export PDF personnel.

---

### 1. `src/pages/dashboard/MyCotisations.tsx`
- Ajouter un **sélecteur d'exercice** (Select avec liste des exercices liés aux cotisations du membre, "Tous" par défaut).
- Ajouter un filtre **Statut** (`Tous | Payé | En attente | Annulé`) et un filtre **Type de cotisation** (alimenté dynamiquement depuis `cotisations.type.nom`).
- Ajouter une carte **Progression annuelle** (sur l'exercice sélectionné si défini) :
  - Montant attendu (via `cotisations_mensuelles_exercice` + `exercices_cotisations_types`).
  - Montant payé, reste à payer, % progression (`Progress` shadcn).
- Bouton **Export PDF récapitulatif personnel** :
  - jsPDF A4 portrait, en-tête "Mes cotisations — <prénom nom>", exercice, date édition.
  - Tableau (`autoTable`) : Type, Date, Montant, Statut.
  - Bloc total payé.
  - Nom : `mes_cotisations_<exercice>_<YYYY-MM-DD>.pdf`.
- Aucun changement sur `useUserCotisations`.

### 2. `src/pages/dashboard/MyPrets.tsx`
- Ajouter un filtre **Statut** (`Tous | En cours | Remboursé | En attente | Refusé`).
- Ajouter une carte **Échéancier prochain remboursement** :
  - Affiche le prochain prêt actif (`en_cours` ou `approuve`) avec `echeance`, montant restant et badge couleur si proche (< 7 j = destructive, < 30 j = warning).
- Bouton **Export PDF "Mes prêts"** :
  - A4 paysage, en-tête membre + date.
  - Tableau : Date, Montant initial, Remboursé, Reste, Échéance, Statut.
  - Footer : totaux remboursés / restants.
- Réutilise `useUserPrets` (aucun nouveau hook).

### 3. `src/pages/dashboard/MesDemandesPret.tsx`
- Ajouter un filtre **Statut** (`Toutes | En attente | En cours | Approuvée | Rejetée | Décaissée`).
- Ajouter un filtre **Urgence** (`Toutes | Normal | Urgent`).
- Compteur "X demandes affichées / Y total".
- Pas d'export (les demandes restent suivies dans l'admin).
- Aucun changement sur `useMyLoanRequests` ni `LoanRequestDialog`.

### 4. Utilitaire partagé
- Créer `src/lib/membre-pdf.ts` exposant `buildMembrePDFHeader(doc, { titre, membreLabel, exerciceLabel? })` pour mutualiser l'en-tête PDF des deux exports membre. Évite la duplication entre `MyCotisations` et `MyPrets`.

### Hors périmètre
- Pas de migration, pas de nouvelle RPC, pas de modification des hooks ou des RLS.
- Pas de modifications côté admin (déjà couvert par Lot 1).
- Pas de modification de `LoanRequestDialog` (workflow et notifications restent identiques — cf. mémoire `request-workflow`).
- Filtres serveur (pagination) hors scope : volumes membres faibles → filtrage client suffisant.

### Détails techniques
- Composants : `Input`, `Select`, `Button`, `Badge`, `Progress`, `Card` shadcn déjà importés.
- Date utils : `date-fns` + locale `fr` (déjà utilisés).
- Format montant : `formatFCFA` (déjà utilisé) et `Intl.NumberFormat('fr-FR')` pour PDF.
- PDF : `jspdf ^3.0.3` + `jspdf-autotable` (mêmes versions que Lot 1, cf. mémoire).
- Identité du membre récupérée via `useAuth()` → `user.user_metadata` ou via la première ligne de `cotisations.membre` / `prets.membre` selon ce qui est déjà exposé par le hook (à vérifier au moment de l'implémentation, fallback sur `Mon récapitulatif`).

### Validation
- Build TypeScript propre.
- Vérifier visuellement les 3 pages dans `/dashboard/...` (vue desktop + mobile).
- Tester un export PDF par page.
- Vérifier que les filtres se combinent (statut + type/urgence).

Lot 3 (workflow demandes + notifications côté membre) sera proposé après validation du Lot 2.
