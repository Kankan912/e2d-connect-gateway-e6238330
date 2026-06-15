## 1. Modale "Ajouter un bénéficiaire" — recherche/filtre membre

**Fichier:** `src/components/config/CalendrierBeneficiairesManager.tsx`

Le `Select` natif (lignes 534-541) n'a pas de champ de recherche : avec une longue liste de membres E2D, impossible de filtrer. Remplacer par un **Combobox cherchable** (`Command` + `Popover` shadcn) :

- Champ "Rechercher un membre…" filtrant `membresDisponibles` sur `prenom + nom` (insensible casse/accents).
- Afficher un message "Tous les membres sont déjà dans le calendrier" si liste vide.
- Conserver l'état `selectedMembre` et le reset à la fermeture.
- Même traitement pour le `Select` de mois si utile (laisser tel quel sauf demande).

## 2. Montants des cotisations non répercutés

**Cause:** quand une réunion est ouverte, `projeter_cotisations_reunion()` insère des lignes dans `cotisations` avec le montant figé à cet instant. Modifier ensuite `cotisations_mensuelles_exercice.montant` ne met PAS à jour les lignes `cotisations` déjà créées (statut `en_attente`), donc la grille affiche l'ancien montant.

**Migration SQL** (trigger `AFTER UPDATE` sur `cotisations_mensuelles_exercice`):

- Lorsque `montant` change, mettre à jour toutes les `cotisations` correspondantes :
  - `membre_id = NEW.membre_id`
  - `exercice_id = NEW.exercice_id`
  - `type_cotisation_id` = id du type "Cotisation mensuelle" obligatoire
  - `statut = 'en_attente'` (ne jamais toucher aux paiements `paye`/`partiel`)
- Tracer la propagation dans `cotisations_mensuelles_audit` (raison: "Propagation aux cotisations en_attente").

**Sécurité:** trigger `SECURITY DEFINER`, ne touche que les lignes non payées, ne crée pas de doublon `fond_caisse_operations`.

## 3. Fusion onglet "Configuration Tontine" dans "Configuration E2D"

Tontine est déjà intégré comme sous-onglet de E2D Config (ligne 235-250 de `E2DConfigAdmin.tsx`). Il reste à **supprimer l'entrée de menu doublon** :

- `src/components/layout/DashboardSidebar.tsx` lignes 81-83 : retirer `e2dTontineItems` (et son rendu dans la sidebar) pour ne plus exposer le lien standalone.
- Garder la route `/dashboard/admin/tontine/config` fonctionnelle (au cas où un lien direct existe), mais la masquer du menu.

## Récapitulatif fichiers

- `src/components/config/CalendrierBeneficiairesManager.tsx` — Combobox de recherche membre.
- Nouvelle migration SQL — trigger de propagation `cotisations_mensuelles_exercice` → `cotisations` (en_attente).
- `src/components/layout/DashboardSidebar.tsx` — retirer le menu "Configuration Tontine".
