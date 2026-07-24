# Lot C — Situation membre & Justificatifs aides

## Objectifs
1. Fournir à chaque membre une vue consolidée (cotisations, prêts, aides, épargnes, sanctions, paiements bénéficiaires) filtrable par exercice.
2. Empêcher toute validation d'aide sans justificatif attaché.

## Backend
- **RPC `get_membre_situation(p_membre_id uuid, p_exercice_id uuid default null) returns jsonb`** — `SECURITY DEFINER`, autorise seulement le membre concerné ou un admin (`public.is_admin()`). Retourne :
  - `membre`, `exercice_id`
  - listes : `cotisations`, `prets`, `aides`, `epargnes`, `sanctions`, `beneficiaires_paiements`
  - `totaux` : `cotisations_payees`, `prets_en_cours` (restant à payer), `aides_recues`, `epargnes_totales`, `sanctions_dues`
- **Trigger `trg_enforce_aide_justificatif`** (BEFORE UPDATE sur `aides`) — refuse la transition vers `allouee` / `alloue` / `payee` si `justificatif_url` est vide.

## Frontend
- `src/hooks/useMembreSituation.ts` — wrapper React Query sur la RPC.
- `src/pages/dashboard/MaSituation.tsx` — page dashboard avec sélecteur d'exercice, 5 stat-cards, onglets détaillés et export PDF (`jsPDF` + `autoTable`).
- Route `/dashboard/ma-situation` ajoutée dans `src/pages/Dashboard.tsx`.
- `src/components/forms/AideForm.tsx` — justificatif marqué obligatoire (label + garde-fou submit) dès que `statut ∈ {alloue, allouee, payee}`.

## Sécurité
- La RPC vérifie l'identité (`auth.uid()`) : un membre ne peut pas lire la situation d'un autre.
- Le trigger DB garantit l'obligation du justificatif même si le front est contourné.

## Vérification manuelle
1. Se connecter en tant que membre → `/dashboard/ma-situation` doit afficher les totaux + onglets.
2. Tenter de passer une aide en `allouee` sans justificatif via SQL → erreur `check_violation`.
3. Exporter le PDF → contient les 5 indicateurs et le nom de l'exercice.
