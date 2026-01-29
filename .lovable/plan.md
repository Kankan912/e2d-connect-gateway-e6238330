

# Plan de Correction - Affichage CR et Statistiques sur le Site Public

## Objectif
Compléter `EventDetail.tsx` pour afficher le Compte Rendu et les Statistiques des matchs E2D sur le site public, comme c'est déjà le cas côté administration.

---

## Modifications à effectuer

### Fichier : `src/pages/EventDetail.tsx`

#### 1. Ajouter les requêtes manquantes (après ligne 65)

```typescript
// Charger le compte rendu du match
const { data: compteRendu } = useQuery({
  queryKey: ["match-compte-rendu-public", event?.match_id],
  queryFn: async () => {
    if (!event?.match_id) return null;
    const { data, error } = await supabase
      .from("match_compte_rendus")
      .select("*")
      .eq("match_id", event.match_id)
      .maybeSingle();
    if (error) return null;
    return data;
  },
  enabled: !!event?.match_id,
});

// Charger les statistiques individuelles
const { data: matchStats = [] } = useQuery({
  queryKey: ["match-stats-public", event?.match_id],
  queryFn: async () => {
    if (!event?.match_id) return [];
    const { data, error } = await supabase
      .from("match_statistics")
      .select("*")
      .eq("match_id", event.match_id)
      .eq("match_type", "e2d");
    if (error) return [];
    return data || [];
  },
  enabled: !!event?.match_id,
});
```

#### 2. Ajouter les imports nécessaires

```typescript
import { FileText, Target, Star, Award } from "lucide-react";
```

#### 3. Ajouter la section Compte Rendu (après la Card "Informations du match")

```typescript
{/* Compte Rendu du match */}
{isMatch && compteRendu && (compteRendu.resume || compteRendu.faits_marquants) && (
  <Card>
    <CardContent className="p-6">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        <FileText className="h-5 w-5" />
        Compte Rendu du Match
      </h2>
      
      {compteRendu.resume && (
        <div className="mb-4">
          <h3 className="font-semibold text-muted-foreground mb-2">Résumé</h3>
          <p className="text-foreground whitespace-pre-wrap">{compteRendu.resume}</p>
        </div>
      )}
      
      {compteRendu.faits_marquants && (
        <div className="mb-4">
          <h3 className="font-semibold text-muted-foreground mb-2">Faits Marquants</h3>
          <p className="text-foreground whitespace-pre-wrap">{compteRendu.faits_marquants}</p>
        </div>
      )}
      
      {compteRendu.score_mi_temps && (
        <div className="mb-4">
          <Badge variant="outline">Mi-temps : {compteRendu.score_mi_temps}</Badge>
        </div>
      )}
      
      <div className="grid md:grid-cols-2 gap-4 mt-4">
        {compteRendu.conditions_jeu && (
          <div className="p-3 bg-muted/50 rounded-lg">
            <p className="text-xs text-muted-foreground mb-1">Conditions de jeu</p>
            <p className="text-sm">{compteRendu.conditions_jeu}</p>
          </div>
        )}
        {compteRendu.ambiance && (
          <div className="p-3 bg-muted/50 rounded-lg">
            <p className="text-xs text-muted-foreground mb-1">Ambiance</p>
            <p className="text-sm">{compteRendu.ambiance}</p>
          </div>
        )}
      </div>
    </CardContent>
  </Card>
)}
```

#### 4. Ajouter la section Statistiques Individuelles (après Compte Rendu)

```typescript
{/* Statistiques individuelles */}
{isMatch && matchStats.length > 0 && (
  <Card>
    <CardContent className="p-6">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        <Target className="h-5 w-5" />
        Statistiques du Match
      </h2>
      
      {/* Résumé global */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="text-center p-3 bg-primary/10 rounded-lg">
          <p className="text-2xl font-bold text-primary">
            {matchStats.reduce((sum, s) => sum + (s.goals || 0), 0)}
          </p>
          <p className="text-xs text-muted-foreground">Buts</p>
        </div>
        <div className="text-center p-3 bg-blue-500/10 rounded-lg">
          <p className="text-2xl font-bold text-blue-600">
            {matchStats.reduce((sum, s) => sum + (s.assists || 0), 0)}
          </p>
          <p className="text-xs text-muted-foreground">Passes D.</p>
        </div>
        <div className="text-center p-3 bg-yellow-500/10 rounded-lg">
          <p className="text-2xl font-bold text-yellow-600">
            {matchStats.reduce((sum, s) => sum + (s.yellow_cards || 0), 0)}
          </p>
          <p className="text-xs text-muted-foreground">Cartons J.</p>
        </div>
        <div className="text-center p-3 bg-red-500/10 rounded-lg">
          <p className="text-2xl font-bold text-red-600">
            {matchStats.reduce((sum, s) => sum + (s.red_cards || 0), 0)}
          </p>
          <p className="text-xs text-muted-foreground">Cartons R.</p>
        </div>
      </div>
      
      {/* Homme du match */}
      {matchStats.find(s => s.man_of_match) && (
        <div className="p-4 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg flex items-center gap-3 mb-4">
          <Star className="h-6 w-6 text-yellow-600" />
          <div>
            <p className="text-sm text-muted-foreground">Homme du match</p>
            <p className="font-bold">{matchStats.find(s => s.man_of_match)?.player_name}</p>
          </div>
        </div>
      )}
      
      {/* Buteurs et Passeurs */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Buteurs */}
        {matchStats.filter(s => s.goals > 0).length > 0 && (
          <div>
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <Award className="h-4 w-4" /> Buteurs
            </h3>
            <div className="space-y-1">
              {matchStats.filter(s => s.goals > 0).map((stat, idx) => (
                <div key={idx} className="flex justify-between text-sm p-2 bg-muted/50 rounded">
                  <span>{stat.player_name}</span>
                  <Badge>{stat.goals} but{stat.goals > 1 ? 's' : ''}</Badge>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Passeurs */}
        {matchStats.filter(s => s.assists > 0).length > 0 && (
          <div>
            <h3 className="font-semibold mb-2">Passeurs Décisifs</h3>
            <div className="space-y-1">
              {matchStats.filter(s => s.assists > 0).map((stat, idx) => (
                <div key={idx} className="flex justify-between text-sm p-2 bg-muted/50 rounded">
                  <span>{stat.player_name}</span>
                  <Badge variant="secondary">{stat.assists} passe{stat.assists > 1 ? 's' : ''}</Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </CardContent>
  </Card>
)}
```

---

## Récapitulatif des Ajouts

| Section | Description | Données |
|---------|-------------|---------|
| Compte Rendu | Résumé narratif du match | resume, faits_marquants, score_mi_temps, conditions_jeu, ambiance |
| Statistiques | Performance individuelle | goals, assists, yellow_cards, red_cards, man_of_match |

---

## Ordre d'affichage final sur EventDetail

1. En-tête (image, titre, badges)
2. Informations (date, heure, lieu)
3. Score (si match terminé)
4. Informations du match (type, statut, adversaire)
5. **Compte Rendu** ← Nouveau
6. **Statistiques** ← Nouveau
7. Galerie médias

---

## Temps estimé

- Modifications : 20 minutes
- Tests : 10 minutes
- **Total : 30 minutes**

