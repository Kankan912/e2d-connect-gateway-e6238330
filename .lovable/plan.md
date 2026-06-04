## Objectif

Aligner l'UI `CalendrierBeneficiairesManager.tsx` sur les règles métiers corrigées (C13 = durée dynamique, C5 = épargne individuelle, C6/C7 = regroupement par mois sans partage).

## Constat

Le composant groupe déjà par mois, mais conserve des restes en dur (`12`) et n'utilise pas la chronologie réelle de l'exercice. Le tableau, le PDF et l'initialisation supposent un exercice janvier→décembre.

## Changements (frontend uniquement, `src/components/config/CalendrierBeneficiairesManager.tsx`)

1. **Mois dynamiques basés sur l'exercice**
   - Ajouter un `useMemo moisExerciceList` qui retourne la liste ordonnée `[{ index: 1..nbMoisExercice, mois: 0..11, annee, label: "Mois AAAA" }]` calculée à partir de `date_debut` et `nbMoisExercice`.
   - Remplacer le tableau statique `MOIS[]` (utilisé pour l'affichage) par ce dérivé. Garder `MOIS` uniquement pour le formatage du libellé court.

2. **Regroupement**
   - Réécrire `groupedByMonth` et `monthKeys` pour itérer sur `moisExerciceList` (1..nbMoisExercice) au lieu de 1..12.
   - Conserver le bucket `null` ("Non défini") en fin de liste si non vide.

3. **En-têtes et libellés**
   - Header tableau : `Total (×${nbMoisExercice})` au lieu de `Total (×12)` (ligne 357).
   - Libellé total final : "Total Exercice Prévu" (au lieu de "Total Annuel Prévu").
   - PDF : afficher la période exercice (`date_debut → date_fin`) sous le titre.

4. **Dialog d'ajout**
   - Liste déroulante "Mois de bénéfice" alimentée par `moisExerciceList` (avec année), pas par `MOIS[]` figé.
   - Conserver les compteurs `(n bénéf.)` et l'avertissement "Ce mois compte déjà …".

5. **Initialisation**
   - `handleInitialize` : `mois_benefice = (index + 1) <= nbMoisExercice ? index + 1 : null` (au lieu de `<= 12`).

6. **Présentation regroupée (C6/C7)**
   - Garder le principe : 1 ligne par mois, badges individuels par bénéficiaire avec leur montant propre — aucun partage/division.
   - Ajouter sous chaque badge le total individuel (`mensuel × nbMoisExercice`) en tooltip via `title`, pour rendre la règle visible.
   - Afficher un sous-titre dans le `CardDescription` qui explicite la règle : « Montant bénéficiaire = cotisation mensuelle individuelle × nombre de mois de l'exercice ({nbMoisExercice} mois). Plusieurs bénéficiaires sur le même mois conservent chacun leur montant. »

7. **Garde-fou doublons**
   - Petit badge `bénéf.` reste affiché dès qu'il y a ≥ 1 bénéficiaire (pas seulement > 1) si plusieurs sont sur le même mois, pour bien signaler le regroupement.

## Hors périmètre

- Aucune modification SQL/RPC (déjà fait sur C13/C8).
- Aucune modification du hook `useCalendrierBeneficiaires`.
- Aucune action sur C11/C12 (workflow reconduction) — sera traitée séparément.

## Vérification

- Vérifier preview avec un exercice 12 mois (rendu inchangé) et, si possible, modifier la `date_fin` d'un exercice test pour confirmer que header `(×N)`, liste de mois et initialisation suivent `nbMoisExercice`.
- Vérifier export PDF (header colonne et période).
