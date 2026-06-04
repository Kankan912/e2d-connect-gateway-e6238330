# Plan d'audit & stabilisation E2D — V3

## Principe

Aucune nouvelle fonctionnalité. Pour chaque module : **auditer → documenter → corriger uniquement les anomalies réelles**. Livrable central : `docs/AUDIT_E2D_V3.md` mis à jour à chaque phase avec tableau (Fonctionnalité / Attendu / Observé / Anomalie / Impact / Correction).

## Découpage en lots livrables

Le périmètre couvre 13 phases. Le faire en un seul passage est irréaliste et ingérable côté revue. Je propose **6 lots séquentiels**, chacun = un audit + corrections ciblées + mise à jour du rapport. Vous validez chaque lot avant le suivant.

### Lot A — Finances (Phases 4, 5, 6, 7)
Le cœur métier et le plus à risque. Déjà partiellement traité (C6/C7/C8/C11/C12/C13).
- Cotisations : montants individuels par membre/exercice, historisation, propagation
- Bénéficiaires : formule `cotisation_mensuelle × nb_mois_exercice`, regroupement par mois, calendrier configurable, notifications PDF + emails
- Prêts : intérêt unique, remboursement = capital uniquement, reconduction manuelle multi-validateurs, demande → caisse
- Caisse : source unique (`get_solde_caisse`), cohérence Dashboard/Synthèse/Détail/Rapports
- Vérification croisée Cotisations↔Bénéficiaires↔Caisse↔Dashboard

### Lot B — Réunions & dépendances (Phases 1, 8)
- Audit dépendances Réunions ↔ Cotisations/Bénéficiaires/Présences/Dashboard
- Réouverture : déverrouillage complet + recalculs
- Notifications partielles (1/N/tous membres) sans clôture obligatoire

### Lot C — Utilisateurs, Permissions, Email (Phases 2, 3, 13)
- Liaison membre↔compte, règle "utilisateur ⇒ membre lié obligatoire"
- Visibilité liste utilisateurs (admin only)
- Config Resend/SMTP : save/load/test
- Tests réels d'envoi par type de notification
- Sécurité clés API (jamais frontend)
- Compléter logs (emails, réunions, cotisations, bénéficiaires, prêts, caisse, utilisateurs)

### Lot D — Matchs, Évènements, Site web, Galerie (Phases 9, 10)
- Publication match → création évènement auto + email membres
- Compte rendu + médias visibles site
- Galerie → albums (titre/description/date/photos, style Facebook)
- Footer fonctionnel, bouton Retour = historique navigateur

### Lot E — UX globale & Erreurs (Phases 11, 12)
- Suppression pages blanches, boutons inactifs, onglets parasites
- Feedback unifié (loading, toasts métier)
- Normaliser erreurs Edge Functions : `{success, code, message}` + extraction côté client (jamais "non-2xx" brut)

### Lot F — Rapport final & validation (Phase 0 final)
- Consolidation `docs/AUDIT_E2D_V3.md`
- Liste anomalies corrigées
- Liste tests réalisés
- Liste anomalies restantes (le cas échéant)
- Check final des règles métier

## Méthode par lot

1. **Audit** : lecture code + requêtes DB (`supabase--read_query`) + tests UI ciblés. Aucune modification.
2. **Rapport partiel** : ajout au tableau d'audit.
3. **Corrections** : uniquement anomalies confirmées, migrations SQL si nécessaire.
4. **Vérification** : tests post-correction + mise à jour du rapport.
5. **Stop & validation utilisateur** avant lot suivant.

## Détails techniques

- Rapport : `docs/AUDIT_E2D_V3.md` (nouveau, complète `AUDIT_FINANCES.md` existant)
- Source unique caisse : `get_solde_caisse()` RPC (déjà en mémoire)
- Filtre E2D : `est_membre_e2d = true` (déjà en mémoire)
- Rôle admin : `'administrateur'` (déjà en mémoire)
- Erreurs Edge : extraction via `data?.error` (déjà en mémoire)
- Ne pas régénérer `src/integrations/supabase/types.ts`
- Toute migration : GRANTs explicites + RLS via `is_admin()` / `has_role()`

## Question de cadrage

Confirmez-vous ce découpage en 6 lots, en commençant par le **Lot A (Finances)** ? Ou préférez-vous démarrer par un autre lot (ex. Lot C si l'email/notifications est plus bloquant) ?

## Hors périmètre

- Aucune nouvelle fonctionnalité
- Aucune refonte UI majeure non liée à une anomalie
- Pas de modification des schémas Supabase réservés (`auth`, `storage`, etc.)
