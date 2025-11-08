import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Plus } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function PhoenixCompositionsManager() {
  const [selectedMatch, setSelectedMatch] = useState<string>("");

  const { data: matchs } = useQuery({
    queryKey: ['phoenix-matchs-compositions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sport_phoenix_matchs')
        .select('*')
        .order('date_match', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data;
    }
  });

  const { data: adherents } = useQuery({
    queryKey: ['phoenix-joueurs-disponibles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('membres')
        .select('*')
        .eq('est_adherent_phoenix', true)
        .eq('statut', 'actif')
        .order('nom');
      
      if (error) throw error;
      return data;
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Compositions d'Équipe</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sélectionner un Match</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedMatch} onValueChange={setSelectedMatch}>
            <SelectTrigger>
              <SelectValue placeholder="Choisir un match" />
            </SelectTrigger>
            <SelectContent>
              {matchs?.map((match) => (
                <SelectItem key={match.id} value={match.id}>
                  {match.equipe_adverse} - {new Date(match.date_match).toLocaleDateString('fr-FR')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedMatch && (
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Composition Titulaires
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground mb-4">
                  Sélectionnez les joueurs titulaires pour ce match
                </p>
                <div className="space-y-2">
                  {adherents?.slice(0, 11).map((joueur) => (
                    <div key={joueur.id} className="flex items-center justify-between p-2 border rounded">
                      <span className="text-sm">
                        {joueur.nom} {joueur.prenom}
                      </span>
                      <Badge variant="outline">{joueur.equipe_jaune_rouge || 'Non défini'}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Remplaçants
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground mb-4">
                  Sélectionnez les joueurs remplaçants
                </p>
                <div className="space-y-2">
                  {adherents?.slice(11).map((joueur) => (
                    <div key={joueur.id} className="flex items-center justify-between p-2 border rounded">
                      <span className="text-sm">
                        {joueur.nom} {joueur.prenom}
                      </span>
                      <Badge variant="secondary">{joueur.equipe_jaune_rouge || 'Non défini'}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
