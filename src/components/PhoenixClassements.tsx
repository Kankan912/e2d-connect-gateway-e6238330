import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Trophy, Target, Medal } from "lucide-react";

export default function PhoenixClassements() {
  // Table phoenix_matchs à créer
  const stats: any[] = [];

  const { data: adherents } = useQuery({
    queryKey: ['phoenix-adherents-classement'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('membres')
        .select('*')
        .eq('equipe_phoenix', true)
        .eq('statut', 'actif')
        .order('nom');
      
      if (error) throw error;
      return data;
    }
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Classement des Joueurs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>Joueur</TableHead>
                <TableHead>Équipe</TableHead>
                <TableHead className="text-center">Matchs</TableHead>
                <TableHead className="text-center">Buts</TableHead>
                <TableHead className="text-center">Passes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {adherents?.map((joueur, index) => (
                <TableRow key={joueur.id}>
                  <TableCell className="font-medium">
                    {index + 1}
                    {index === 0 && <Trophy className="h-4 w-4 inline ml-1 text-yellow-500" />}
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{joueur.nom} {joueur.prenom}</p>
                      {joueur.poste && (
                        <p className="text-sm text-muted-foreground">{joueur.poste}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={joueur.equipe_couleur === 'jaune' ? 'default' : 'destructive'}>
                      {joueur.equipe_couleur || 'Non assigné'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">-</TableCell>
                  <TableCell className="text-center">-</TableCell>
                  <TableCell className="text-center">-</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Target className="h-4 w-4" />
              Meilleur Buteur
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">-</p>
            <p className="text-sm text-muted-foreground">Buts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Medal className="h-4 w-4" />
              Meilleur Passeur
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">-</p>
            <p className="text-sm text-muted-foreground">Passes décisives</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Trophy className="h-4 w-4" />
              Joueur du Mois
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">-</p>
            <p className="text-sm text-muted-foreground">À déterminer</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
