## Lot D — Matchs, Évènements, Site web, Galerie (Phases 9 & 10)

Audit ciblé sans nouvelles fonctionnalités. Vérification + corrections d'anomalies confirmées uniquement. Les 5 profils orphelins du Lot C (C2) sont laissés tels quels — décision utilisateur.

### Périmètre

**Phase 9 — Matchs E2D & Évènements**
- Cycle de vie d'un match E2D : création → publication → synchronisation `site_events`
- Règle : sync vers `site_events` uniquement quand `statut_publication = 'publie'` (memory `e2d-match-sync-architecture`)
- Filtrage joueurs `est_membre_e2d = true` pour stats E2D (memory `e2d-match-stats-filtering`)
- Assets match (logos, squad) — bucket `sport-logos`, thumbnail sync (memory `match-assets-and-squad-management`)
- Notification email à la création/publication d'un évènement
- Cohérence évènements ↔ site public (visibilité, dates, suppression)

**Phase 10 — Site web public & Galerie**
- Galerie organisée en albums (style Facebook)
- Conversion HEIC côté client avant upload (memory `comprehensive-viewing-and-heic-support`)
- Footer fonctionnel (liens, mentions légales, contact)
- Bouton retour = historique navigateur (pas de routage dur)
- SPA routing : `vercel.json` rewrites vers `/index.html` (memory `routage-spa-vercel`)
- Pages publiques accessibles sans auth ; contenus admin protégés

### Méthode

1. **Audit code** : composants/pages matchs, évènements, galerie, footer, hooks de sync `site_events`, edge functions email associées.
2. **Audit DB** : `supabase--read_query` pour vérifier :
   - Matchs `publie` sans entrée `site_events` correspondante (ou inverse : entrées orphelines)
   - Albums galerie sans photos ; photos sans album
   - RLS sur `site_events`, `galerie_*`, bucket `sport-logos`
3. **Tests UI ciblés** : publier un match → vérifier apparition site public ; dépublier → disparition ; uploader photo HEIC → conversion auto.
4. **Documentation** : nouvelle section "Lot D" dans `docs/AUDIT_E2D_V3.md`.

### Points de vigilance

- **D1** — Match `publie` ↔ `site_events` : pas de désynchronisation
- **D2** — Match dépublié ou supprimé → `site_events` correspondant supprimé / dépublié
- **D3** — Notifications email envoyées best-effort (ne pas bloquer la publication si email échoue, cf. règle Lot B)
- **D4** — Galerie : albums et photos cohérents, suppression cascade correcte
- **D5** — Bucket `sport-logos` : policies lecture publique / écriture admin
- **D6** — Footer : tous les liens fonctionnels (pas de `href="#"` mort)
- **D7** — Boutons « retour » utilisent `navigate(-1)` ou équivalent, pas de route en dur

### Livrables

- `docs/AUDIT_E2D_V3.md` enrichi (section Lot D)
- Migrations SQL si anomalies confirmées (ex : trigger sync manquant)
- Edits frontend ciblés uniquement sur anomalies confirmées
- Liste tests utilisateur avant Lot E

### Hors périmètre

- Refonte UI matchs / galerie / site public
- Nouvelles fonctionnalités sport (classement, stats avancées, etc.)
- Refonte design system du site public

Après validation Lot D → Lot E (UX globale & gestion des erreurs).
