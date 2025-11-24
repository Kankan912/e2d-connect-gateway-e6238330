import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, XCircle } from "lucide-react";

export default function TableauBordJauneRouge() {
  // Récupérer les statistiques réelles depuis match_statistics
  const { data: cartonsData = [] } = useQuery({
    queryKey: ['phoenix-cartons-stats'],
    queryFn: async () => {
      // Récupérer tous les adhérents Phoenix actifs
      const { data: membres, error: membresError } = await supabase
        .from('membres')
        .select('id, nom, prenom, equipe_jaune_rouge')
        .eq('est_adherent_phoenix', true)
        .eq('statut', 'actif')
        .order('nom');
      
      if (membresError) throw membresError;

      // Pour chaque membre, compter ses cartons depuis match_statistics
      const membresAvecCartons = await Promise.all(
        membres.map(async (membre) => {
          // Récupérer les stats où player_name correspond au nom du membre
          const playerName = `${membre.nom} ${membre.prenom}`;
          const { data: stats, error: statsError } = await supabase
            .from('match_statistics')
            .select('yellow_cards, red_cards')
            .eq('player_name', playerName);

          if (statsError) throw statsError;

          const cartonsJaunes = stats.reduce((sum, s) => sum + (s.yellow_cards || 0), 0);
          const cartonsRouges = stats.reduce((sum, s) => sum + (s.red_cards || 0), 0);

          return {
            ...membre,
            cartonsJaunes,
            cartonsRouges
          };
        })
      );

      return membresAvecCartons;
    }
  });

  const totalJaunes = cartonsData.reduce((sum, a) => sum + a.cartonsJaunes, 0);
  const totalRouges = cartonsData.reduce((sum, a) => sum + a.cartonsRouges, 0);

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              Cartons Jaunes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{totalJaunes}</p>
            <p className="text-sm text-muted-foreground mt-1">Total cette saison</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-500" />
              Cartons Rouges
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{totalRouges}</p>
            <p className="text-sm text-muted-foreground mt-1">Total cette saison</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Détail par Joueur</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Joueur</TableHead>
                <TableHead>Équipe</TableHead>
                <TableHead className="text-center">
                  <AlertTriangle className="h-4 w-4 inline text-yellow-500" /> Jaunes
                </TableHead>
                <TableHead className="text-center">
                  <XCircle className="h-4 w-4 inline text-red-500" /> Rouges
                </TableHead>
                <TableHead className="text-center">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cartonsData
                .sort((a, b) => (b.cartonsJaunes + b.cartonsRouges * 2) - (a.cartonsJaunes + a.cartonsRouges * 2))
                .map((joueur) => (
                  <TableRow key={joueur.id}>
                    <TableCell className="font-medium">
                      {joueur.nom} {joueur.prenom}
                    </TableCell>
                    <TableCell>
                      <Badge variant={joueur.equipe_jaune_rouge === 'jaune' ? 'default' : 'destructive'}>
                        {joueur.equipe_jaune_rouge || 'Non assigné'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      {joueur.cartonsJaunes > 0 && (
                        <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
                          {joueur.cartonsJaunes}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {joueur.cartonsRouges > 0 && (
                        <Badge variant="destructive">
                          {joueur.cartonsRouges}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-center font-semibold">
                      {joueur.cartonsJaunes + joueur.cartonsRouges * 2}
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
