import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Trophy, TrendingUp } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface PhoenixMatchDetailsProps {
  match?: any;
}

export default function PhoenixMatchDetails({ match }: PhoenixMatchDetailsProps) {
  if (!match) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground text-center">
            Sélectionnez un match pour voir ses détails
          </p>
        </CardContent>
      </Card>
    );
  }

  const resultat = match.score_phoenix > match.score_adverse ? 'Victoire' 
    : match.score_phoenix < match.score_adverse ? 'Défaite' 
    : 'Match nul';

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Détails du Match</span>
            <Badge variant={
              resultat === 'Victoire' ? 'default' : 
              resultat === 'Défaite' ? 'destructive' : 
              'secondary'
            }>
              {resultat}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-center text-4xl font-bold gap-4">
            <span>Phoenix</span>
            <span className="text-primary">{match.score_phoenix}</span>
            <span className="text-muted-foreground">-</span>
            <span className="text-primary">{match.score_adverse}</span>
            <span>{match.equipe_adverse}</span>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-6">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                {format(new Date(match.date_match), 'dd MMMM yyyy', { locale: fr })}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm capitalize">{match.lieu}</span>
            </div>
            
            {match.competition && (
              <div className="flex items-center gap-2 col-span-2">
                <Trophy className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{match.competition}</span>
              </div>
            )}
          </div>

          {match.notes && (
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <p className="text-sm">{match.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Statistiques
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Les statistiques détaillées seront disponibles prochainement
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
