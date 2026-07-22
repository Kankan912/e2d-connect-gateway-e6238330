
# Lot B — Bénéficiaires cotisations mensuelles & Réunions

Suite de Lot A. Objectif : passer du modèle 1 mois ↔ 1 bénéficiaire au modèle **1 mois ↔ N bénéficiaires**, auto-remplir la réunion à sa création, et fiabiliser la validation de paiement en clôture.

## Périmètre (items #5, #6, #7, #9, #10 du classeur, page 1)

1. **Modèle DB** — `calendrier_beneficiaires` supporte déjà `mois_benefice` mais l'UI et l'usage traitent implicitement 1↔1. On lève la contrainte, on formalise l'ordre par `(mois_benefice, rang)` et on garde la formule Lot A (`mensuel × nb_mois`).
2. **Admin calendrier** — Refonte `CalendrierBeneficiairesManager` : liste groupée par mois, boutons Ajouter / Monter / Descendre / Retirer par ligne, multi-bénéficiaires par mois, montant recalculé via `CotisationPaymentEngine`.
3. **Auto-remplissage à la création de réunion** — `useReunions.create` résout le mois de `date_reunion`, charge tous les bénéficiaires programmés, insère les lignes `reunion_beneficiaires` en `prevu` avec montant prévisionnel.
4. **Clôture — validation paiement** — Nouveau modal `ValiderPaiementBeneficiaireModal` déclenché depuis `BeneficiairesReunionWidget` / `ClotureReunionModal` : trésorier saisit montant réel, date, mode, référence par bénéficiaire ; chaque validation appelle `CaisseService.recordMovement('sortie', 'beneficiaire')` + insère l'audit + notifie le bénéficiaire.
5. **Onglet calendrier consultable** — `BeneficiairesTab` : ajout d'un sous-onglet lecture seule "Calendrier annuel" listant `(mois, membres, montants, statut)` pour tous les rôles autorisés.
6. **Tests & doc** — Vitest sur auto-remplissage et calcul prévisionnel ; `docs/LOT_B_BENEFICIAIRES.md` récapitulant règles, workflow, tables impactées.

## Détails techniques

### DB (migration SQL unique)
- `ALTER TABLE calendrier_beneficiaires` : `mois_benefice INT NOT NULL CHECK (1..12)`, drop de tout unique `(exercice_id, mois_benefice)` existant, ajout `UNIQUE (exercice_id, mois_benefice, rang)`.
- Backfill : lignes existantes sans mois → répartition mensuelle 1..12 selon `rang`.
- `reunion_beneficiaires` : rien à changer côté colonnes ; nouveau trigger optionnel `set_association_id`.
- RPC `auto_fill_reunion_beneficiaires(p_reunion_id UUID)` : SECURITY DEFINER, insère les prévisionnels si aucune ligne existe, sans doublonner. Idempotente.
- RPC `valider_paiement_beneficiaire(...)` : met à jour la ligne, appelle `record_caisse_movement`, insère `beneficiaires_paiements_audit`. Transactionnel.
- Colonne dérivée : conserver `reunions.beneficiaire_id` en legacy nullable, ne plus l'écrire depuis le front (dépréciée, à supprimer Lot C).

### Frontend
- `src/hooks/useCalendrierBeneficiaires.ts` : ajouter helpers `getByMois`, `moveRang(id, direction)`, `addForMois(mois, membreId)`.
- `src/components/config/CalendrierBeneficiairesManager.tsx` : refonte UI groupée par mois (Accordion), formulaire multi-select via `CotisationPaymentEngine.calculMontantAnnuelAttendu`.
- `src/hooks/useReunions.ts` : après `insert` d'une réunion, appeler `supabase.rpc('auto_fill_reunion_beneficiaires', { p_reunion_id })`.
- `src/components/BeneficiairesReunionWidget.tsx` : bouton "Valider paiement" par bénéficiaire prévu, ouvre `ValiderPaiementBeneficiaireModal`.
- `src/components/ValiderPaiementBeneficiaireModal.tsx` (nouveau) : form (montant, date, mode, référence, notes) → RPC `valider_paiement_beneficiaire`.
- `src/pages/reunions/components/BeneficiairesTab.tsx` : ajouter sous-onglet "Calendrier annuel" en lecture seule via `useCalendrierBeneficiaires(exerciceCourant)`.

### Fichiers créés
- `supabase/migrations/<ts>_lot_b_beneficiaires_1_n.sql`
- `src/components/ValiderPaiementBeneficiaireModal.tsx`
- `src/domain/finance/BeneficiaireService.test.ts` (extension)
- `docs/LOT_B_BENEFICIAIRES.md`

### Fichiers modifiés
- `src/hooks/useCalendrierBeneficiaires.ts`, `src/hooks/useReunions.ts`
- `src/components/config/CalendrierBeneficiairesManager.tsx`
- `src/components/BeneficiairesReunionWidget.tsx`
- `src/pages/reunions/components/BeneficiairesTab.tsx`
- `docs/CHANGELOG.md`, mémoire `mem://modules/beneficiaries/calendar-management-logic-v2`

## Hors périmètre
- Suppression définitive de `reunions.beneficiaire_id` (Lot C).
- Refonte multi-tenant du calendrier (Lot D).
- Notifications push / SMS (existant Resend suffit).

## Vérification
- `bunx vitest run` sur services finance.
- Scénario manuel : créer réunion mars → widget affiche bénéficiaires prévus → valider paiement → `fond_caisse_operations` reçoit la sortie.
