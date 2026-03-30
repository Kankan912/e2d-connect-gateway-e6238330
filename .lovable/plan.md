

# Plan: 6 corrections Événements / Match / Galerie

## Résumé des problèmes et solutions

### 1. Upload logo adversaire (E2DMatchForm + E2DMatchEditForm)
- Le champ `logo_equipe_adverse` existe déjà en DB mais est toujours `null`
- **Action** : Ajouter un champ upload d'image dans les deux formulaires (création + édition) qui upload vers le bucket `sport-logos` et stocke l'URL dans `logo_equipe_adverse`
- Utiliser le même pattern que les autres uploads du projet (`storage-utils.ts`)

### 2. Gestion des joueurs par match (E2D + adversaire)
- La table `phoenix_compositions` existe pour Phoenix mais rien pour E2D
- **Action DB** : Créer une table `match_joueurs` avec colonnes : `id`, `match_id` (FK → sport_e2d_matchs), `equipe` (enum 'e2d'/'adverse'), `nom`, `numero`, `poste`, `membre_id` (nullable FK → membres, pour joueurs E2D)
- **Action UI** : Ajouter un onglet "Effectifs" dans `MatchDetailsModal` pour gérer les joueurs des deux équipes (ajout/modification/suppression)
- Afficher les effectifs dans `EventDetail.tsx` (page publique)

### 3. Tri des événements DESC
- `useSiteEvents` trie par `date ASC` (ligne 181 de `useSiteContent.ts`)
- **Action** : Changer `ascending: true` → `ascending: false` pour afficher les plus récents en premier

### 4. Image miniature (thumbnail) du match
- La table `sport_e2d_matchs` n'a pas de colonne `image_url`
- **Action DB** : Ajouter colonne `image_url TEXT` à `sport_e2d_matchs`
- **Action UI** : Ajouter champ upload thumbnail dans E2DMatchForm + E2DMatchEditForm, upload vers bucket `sport-logos`
- Synchroniser vers `site_events.image_url` dans `sync-events.ts`

### 5. Affichage logos + score dans EventDetail
- Le bloc score (lignes 268-297) affiche "E2D" en texte sans logo
- **Action** : Afficher le logo E2D (depuis assets ou config) et le `logo_equipe_adverse` du match à côté des noms d'équipe dans le bloc score

### 6. Bouton retour galerie
- `AlbumDetail.tsx` a déjà un fallback correct (lignes 52-56) : `navigate(-1)` avec fallback `/#galerie`
- Le bouton retour dans `EventDetail.tsx` utilise `navigate(-1)` (ligne 183) — fonctionne correctement
- **Action** : Vérifier si le problème est ailleurs. Ajouter le même pattern fallback que AlbumDetail à EventDetail pour robustesse

---

## Étapes d'implémentation

### Étape 1 : Migration DB (2 changements)
```sql
-- Ajouter image_url à sport_e2d_matchs
ALTER TABLE sport_e2d_matchs ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Créer table match_joueurs
CREATE TABLE match_joueurs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES sport_e2d_matchs(id) ON DELETE CASCADE,
  equipe TEXT NOT NULL CHECK (equipe IN ('e2d', 'adverse')),
  nom TEXT NOT NULL,
  numero INTEGER,
  poste TEXT,
  membre_id UUID REFERENCES membres(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE match_joueurs ENABLE ROW LEVEL SECURITY;
-- RLS: lecture publique, écriture admin
CREATE POLICY "Lecture match_joueurs" ON match_joueurs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Gestion match_joueurs" ON match_joueurs FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
```

### Étape 2 : Formulaires match (E2DMatchForm + E2DMatchEditForm)
- Ajouter champ upload logo adversaire (vers bucket `sport-logos`)
- Ajouter champ upload image thumbnail (vers bucket `sport-logos`)
- Passer les URLs dans le mutation

### Étape 3 : Tri événements
- `useSiteContent.ts` ligne 181 : `ascending: false`

### Étape 4 : Affichage logos + score (EventDetail.tsx)
- Dans le bloc score, remplacer le texte "E2D" par logo E2D + nom
- Afficher `matchDetails.logo_equipe_adverse` à côté du nom adverse

### Étape 5 : Gestion effectifs (MatchDetailsModal)
- Ajouter onglet "Effectifs" dans le modal
- Formulaire inline pour ajouter joueurs E2D (sélection depuis membres) et adverses (saisie libre)
- CRUD via Supabase sur `match_joueurs`

### Étape 6 : Sync thumbnail
- Mettre à jour `sync-events.ts` pour synchroniser `image_url` du match vers `site_events.image_url`

### Étape 7 : Bouton retour EventDetail
- Ajouter fallback `/#evenements` si `window.history.length <= 1` (même pattern que AlbumDetail)

