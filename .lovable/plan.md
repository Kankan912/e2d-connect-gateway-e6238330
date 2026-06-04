## Lot B — Réunions & dépendances (Phases 1 & 8)

Audit ciblé des réunions et de leurs interactions avec les autres modules. Aucune nouvelle fonctionnalité — uniquement vérifications + corrections d'anomalies confirmées.

### Périmètre

**Phase 1 — Réunions (cycle de vie)**
- Création / ouverture (`en_cours`) → projection cotisations (déjà corrigée en Lot A — A1, à re-tester)
- Clôture (`terminee`) → génération sanctions, notifications, verrouillage
- Réouverture (`terminee` → `en_cours`) → déverrouillage + recalculs cohérents (cf. memory `meeting-reopening`)
- Statuts intermédiaires, présences, ordre du jour

**Phase 8 — Dépendances croisées**
- Réunion ↔ Cotisations (projections, paiements, verrouillage)
- Réunion ↔ Bénéficiaires (mois actif, assignations)
- Réunion ↔ Sanctions (génération auto à la clôture)
- Réunion ↔ Caisse (synchronisation des flux liés)
- Réunion ↔ Notifications (envois partiels possibles sans bloquer la clôture)

### Méthode

1. **Audit code** : `useReunions`, `ReunionDetails`, hooks de clôture/réouverture, edge functions associées, triggers SQL.
2. **Audit DB** : requêtes `supabase--read_query` pour vérifier cohérence `reunions` ↔ `cotisations` ↔ `sanctions` ↔ `reunion_beneficiaires` ↔ `fond_caisse_operations`.
3. **Tests UI ciblés** : ouverture, clôture, réouverture, envoi notifications partielles.
4. **Documentation** : section "Lot B" ajoutée à `docs/AUDIT_E2D_V3.md` avec :
   - Constats (compliant / anomalie)
   - Anomalies confirmées + correctifs (migrations SQL + edits frontend)
   - Tests post-correctif à valider par l'utilisateur

### Points de vigilance (à confirmer)

- B1 — La clôture ne doit **pas** échouer si l'envoi email partiel échoue (cf. memory `meeting-closure-workflow`)
- B2 — La réouverture doit déverrouiller cotisations + nettoyer sanctions selon le workflow v31 (memory `reunions/reopening-unlock-and-cleanup-v31`)
- B3 — Vérifier qu'aucune désynchronisation n'existe entre `reunion_beneficiaires.paye` et `fond_caisse_operations` (trigger A2 du Lot A)
- B4 — Vérifier la cohérence présences ↔ sanctions générées
- B5 — Notifications partielles : possibilité d'envoyer sans déclencher la clôture définitive

### Livrables

- `docs/AUDIT_E2D_V3.md` enrichi (section Lot B)
- Migrations SQL si anomalies confirmées
- Edits frontend ciblés uniquement sur anomalies confirmées
- Liste des tests utilisateur à effectuer avant Lot C

### Hors périmètre

- Refonte UI réunions
- Nouvelles fonctionnalités (workflow approbation, etc.)
- Modifications schémas réservés Supabase

Après validation Lot B → passage Lot C (Utilisateurs / Permissions / Email).
