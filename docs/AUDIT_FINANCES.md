# AUDIT FINANCES — Bloc 1 (Phase 3)

> Date : 2026-06-01
> Périmètre : Cotisations · Bénéficiaires · Prêts · Caisse
> Méthode : lecture statique + lecture RPC + croisement avec spec `E2D_FULL_AUDIT_AND_STABILIZATION_V2`

Légende sévérité :
- 🔴 **CRITIQUE** — calcul faux, donnée non-fiable, sécurité
- 🟠 **MAJEUR** — non-conformité fonctionnelle vs spec
- 🟡 **MINEUR** — UX, cohérence, dette technique

---

## 1. COTISATIONS

| # | Fonctionnalité | Attendu | Observé | Sévérité | Correctif proposé |
|---|----------------|---------|---------|----------|-------------------|
| C1 | Montant individuel | Lire `cotisations_mensuelles_exercice` en priorité, fallback `cotisations_types.montant_defaut` | ✅ Conforme via `get_cotisation_mensuelle_membre()` et `get_montant_cotisation_membre()` | — | Aucun |
| C2 | Filtrage types par exercice | Seuls les types `exercices_cotisations_types.actif = true` | À confirmer côté UI (`CotisationsGridView`) — RPC OK | 🟡 | Vérifier que les composants filtrent bien |
| C3 | Verrouillage exercice actif | Cotisations verrouillées dès passage à `actif` | ✅ Trigger `verrouiller_cotisations_mensuelles_on_exercice_actif` présent | — | Aucun |
| C4 | Total réunion | Somme des cotisations `paye` de la réunion | À vérifier dans les composants de récap | 🟡 | Audit visuel d'un récap réunion |

**État global cotisations : SAIN.** Pas de correctif structurel.

---

## 2. BÉNÉFICIAIRES

### 🔴 C5 — Formule de calcul du montant bénéficiaire INCORRECTE

**Spec** :
> Si un membre A a 20 000 FCFA de cotisation mensuelle et que **12 membres participent** :
> Montant bénéficiaire = 20 000 × **12** = 240 000 FCFA

→ La formule est `cotisation_mensuelle × nb_membres_participants`.

**Observé** dans `public.calculer_montant_beneficiaire()` :
```sql
v_montant_brut := v_montant_mensuel * 12;  -- multiplie par 12 (mois) en dur
```

→ Le `12` est codé en dur. Mathématiquement équivalent **uniquement si** exactement 12 membres participent. Si l'association compte 15 membres actifs, un bénéficiaire dont la cotisation est 20 000 devrait toucher **300 000**, mais reçoit **240 000**. Sous-paiement structurel.

**Impact métier** : tous les montants bénéficiaires sont faux dès que `nb_membres_actifs ≠ 12`.

**Correctif** : remplacer le `* 12` par `* (SELECT count(*) FROM membres WHERE statut NOT IN ('supprime','suspendu','inactif'))` — ou mieux, par le nombre de membres ayant cotisé sur la période, paramétrable.

---

### 🟠 C6 — Pas de regroupement visuel par mois

**Spec** : « Les bénéficiaires d'un même mois doivent être regroupés visuellement sous le même mois. Ne jamais créer plusieurs lignes du même mois. »

**Observé** : `CalendrierBeneficiaires.tsx` affiche une carte plate par bénéficiaire, triée par `date_benefice_prevue` desc. Aucun groupement par mois.

**Correctif** : refondre l'affichage en sections `<month>` avec liste de bénéficiaires dessous.

---

### 🟠 C7 — Pas d'ajout manuel (membre + mois + rang)

**Spec** : « bouton Ajouter / choix du membre / choix du mois / choix du rang / librement modifiable ».

**Observé** : `CalendrierBeneficiaires.tsx` n'a aucun bouton Ajouter. Le hook `useCalendrierBeneficiaires` expose bien `createBeneficiaire`/`updateBeneficiaire`/`reorderBeneficiaires`, mais aucune UI ne les utilise dans ce composant. L'admin `Beneficiaires.tsx` les utilise probablement — à confirmer.

**Correctif** : intégrer un dialog Ajouter/Modifier avec sélecteur membre, mois, rang.

---

### 🟠 C8 — Permissions édition non restreintes côté UI

**Spec** : « Seuls Administrateur et Trésorier peuvent modifier le calendrier ».

**Observé** : aucun gate UI sur `marquerPayeMutation`, `createBeneficiaire`, etc. Côté DB la RLS via `is_admin()` (qui inclut admin + tresorier + secretaire_general + super_admin) couvre partiellement, mais **inclut aussi le secrétaire général** — non conforme à la spec qui ne mentionne que admin + trésorier.

**Correctif** :
1. Ajouter check UI via `usePermissions().hasAnyPermission(['beneficiaires:write'])` ou rôles `['administrateur','tresorier']`.
2. Affiner la RLS sur `calendrier_beneficiaires` et `reunion_beneficiaires` UPDATE/INSERT/DELETE pour matcher exactement Admin/Trésorier.

---

### 🟡 C9 — `initializeCalendrier` impose un rang séquentiel sur 12 mois

**Observé** : `mois_benefice: index + 1 <= 12 ? index + 1 : null` — implique implicitement un schéma 12 membres / 12 mois, conflit avec le principe nb_membres variable.

**Correctif** : laisser `mois_benefice = null` à l'init, à renseigner manuellement.

---

## 3. PRÊTS

### ✅ C10 — Remboursement partiel : intérêts NON recalculés

**Spec** : « Lors d'un remboursement partiel : NE PAS recalculer les intérêts. capital restant = capital restant − montant remboursé. »

**Observé** dans `PretsPaiementsManager.tsx` lignes 136-150 :
- `type_paiement = capital` → `capital_paye += montantPaye` (les intérêts ne bougent pas) ✅
- `type_paiement = interet` → `interet_paye += montantPaye` ✅
- `type_paiement = mixte` → d'abord intérêt, puis capital ✅
- `dernier_interet` n'est jamais modifié lors d'un paiement ✅

→ **Conforme.** Le service `calculerResumePret` ne recalcule jamais sur la base d'un paiement partiel.

---

### 🟠 C11 — Pas de statut `EN_ATTENTE_RECONDUCTION`

**Spec** :
> Lorsqu'un prêt dépasse son échéance → statut `EN_ATTENTE_RECONDUCTION`.

**Observé** : la fonction `get_pret_status()` ne connaît que `en_cours`, `partiel`, `rembourse`, `en_retard`, `retard_partiel`. Aucun statut « en attente de reconduction ». La reconduction est déclenchée manuellement via `ReconduireModal`, sans étape d'attente.

**Correctif** : ajouter le statut et la transition automatique lors du dépassement.

---

### 🔴 C12 — Reconduction sans workflow de validation

**Spec** :
> Une reconduction doit être validée par : Administrateur, Trésorier, Commissaire aux comptes.
> Une validation doit produire : historique + notification + journalisation.
> Un refus doit demander un motif + notifier l'emprunteur.
> Aucune reconduction automatique.

**Observé** :
- `ReconduireModal.tsx` exécute la reconduction immédiatement après une simple coche utilisateur. Aucun workflow multi-validateur.
- Le trigger `enforce_reconduction_validation` met bien à `en_attente` si non-admin, mais ne déclenche pas de workflow multi-rôles.
- Pas de table de validation dédiée (équivalent `loan_request_validations` pour les reconductions).
- Pas de notification email automatique sur validation/refus.

**Correctif** (gros) :
1. Table `prets_reconductions_validations(id, reconduction_id, role, ordre, statut, validated_by, validated_at, commentaire)`.
2. RPCs `request_reconduction(_pret_id, _motif)`, `validate_reconduction_step`, `reject_reconduction_step(_motif)`.
3. UI multi-étapes inspirée de `LoanValidationTimeline`.
4. Edge function `send-reconduction-notification`.

---

### 🟡 C13 — Calcul du nouvel intérêt sur reconduction = `capital_restant × taux`

**Observé** `ReconduireModal.tsx` ligne 49 : `nouvelInteret = capitalRestant * (taux/100)`.

→ Cohérent avec la mémoire `mem://data/interest-calculation-comprehensive`. Pas un défaut tant que la formule est validée par le métier. **À confirmer avec utilisateur** : faut-il calculer sur capital initial ou capital restant ?

---

## 4. CAISSE

### ✅ C14 — Source unique : `get_caisse_synthese()`

**Observé** : `get_caisse_stats()` (utilisée par `CaisseDashboard`) appelle en interne `get_caisse_synthese()` (utilisée par les détails). Le `solde_global` du dashboard = `fondTotal` de la synthèse. **Cohérence garantie côté DB.** ✅

---

### 🟡 C15 — Catégorie 'distribution_beneficiaire' jamais insérée

**Observé** : `useCaisseDetails` (cas `reliquat`) lit `categorie = 'distribution_beneficiaire'`. Or `create_caisse_operation_from_source` n'insère jamais cette catégorie — seules `epargne`, `cotisation`, `sanction`, `pret_decaissement`, `pret_remboursement`, `aide` sont émises automatiquement. Le détail « Reliquat » remontera donc toujours `totalDist = 0`.

**Correctif** : soit créer le trigger sur `reunion_beneficiaires` payés → insert catégorie `beneficiaire` ; soit changer la requête pour utiliser `categorie = 'beneficiaire'`.

`get_caisse_synthese()` utilise déjà `categorie='beneficiaire' OR libelle LIKE '%bénéficiaire%'` (cohérent). Aligner `useCaisseDetails`.

---

### 🟡 C16 — Dashboard caisse ne montre pas le solde empruntable critique

**Observé** : `CaisseDashboard` affiche solde global + empruntable + entrées/sorties du mois. Les alertes apparaissent en haut, OK. Le calcul `soldeEmpruntable = 80% × fondTotal − prets_en_cours` est correct (mémoire `loanable-balance-logic`). ✅

---

## SYNTHÈSE / PRIORITÉS

| Priorité | Item | Effort | Impact |
|----------|------|--------|--------|
| P0 | C5 — formule bénéficiaire (×12 codé en dur) | S | Sous-paiement permanent |
| P0 | C12 — workflow validation reconduction | L | Conformité gouvernance |
| P1 | C6 + C7 — UI bénéficiaires (groupage mois + ajout manuel) | M | Conformité spec |
| P1 | C8 — restriction édition Admin/Trésorier uniquement | S | Sécurité métier |
| P1 | C11 — statut `en_attente_reconduction` | S | Visibilité prêts en retard |
| P2 | C15 — catégorie distribution bénéficiaire | S | Reliquat correct |
| P2 | C9 — init calendrier sans préremplir mois | XS | Cohérence |
| P3 | C2, C4, C13 — vérifications complémentaires | S | Audit complet |

---

## PROCHAINE ÉTAPE — VALIDATION REQUISE

Avant d'appliquer les correctifs, **questions ouvertes** :

1. **C5** : la formule doit-elle utiliser
   - (a) `nb_membres_actifs E2D` au moment du calcul, ou
   - (b) `nb_membres ayant effectivement cotisé sur le mois en question`, ou
   - (c) un nombre fixe défini dans `caisse_config` / `exercices_cotisations` ?

2. **C12** (workflow reconduction) : OK pour reproduire la même architecture que les demandes de prêt (`loan_validation_config` + étapes ordonnées) ? Ou validation **parallèle** (les 3 doivent valider, ordre indifférent) ?

3. **C8** : confirmer que **seul** `administrateur` + `tresorier` peuvent éditer le calendrier (exclure secretaire_general qui passe actuellement via `is_admin()`).

4. **C13** : intérêt de reconduction sur capital **restant** ou capital **initial** ?

Après validation des points 1-4, j'enchaîne les correctifs dans cet ordre : C5 → C8 → C15 → C9 → C6+C7 → C11 → C12.
