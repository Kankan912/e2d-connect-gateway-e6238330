import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar, 
  TrendingUp, 
  Users, 
  Settings,
  Trophy,
  MapPin,
  Clock,
  Shirt,
  User,
  Plus
} from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import LogoHeader from "@/components/LogoHeader";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import E2DMatchForm from "@/components/forms/E2DMatchForm";
import MatchDetailsModal from "@/components/MatchDetailsModal";
import { useRealtimeUpdates } from "@/hooks/useRealtimeUpdates";
import { useSportEventSync } from "@/hooks/useSportEventSync";

export default function SportE2D() {
  const navigate = useNavigate();
  const [showMatchForm, setShowMatchForm] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<any>(null);
  const [showMatchDetails, setShowMatchDetails] = useState(false);
  const queryClient = useQueryClient();

  const { data: membres } = useQuery({
    queryKey: ['membres'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('membres')
        .select('id, nom, prenom')
        .eq('est_membre_e2d', true)
        .order('nom');
      if (error) throw error;
      return data;
    }
  });

  const { data: config } = useQuery({
    queryKey: ['sport-e2d-config'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sport_e2d_config')
        .select('*')
        .maybeSingle();
      if (error) throw error;
      return data;
    }
  });

  const { data: matchs } = useQuery({
    queryKey: ['sport-e2d-matchs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sport_e2d_matchs')
        .select('*')
        .order('date_match', { ascending: false })
        .limit(5);
      if (error) throw error;
      return data;
    }
  });

  // Real-time updates
  useRealtimeUpdates({
    table: 'sport_e2d_matchs',
    onUpdate: () => {
      queryClient.invalidateQueries({ queryKey: ['sport-e2d-matchs'] });
    }
  });

  useRealtimeUpdates({
    table: 'membres',
    onUpdate: () => {
      queryClient.invalidateQueries({ queryKey: ['membres'] });
    }
  });

  // Synchronisation automatique vers le site web
  useSportEventSync();

  const totalMembres = membres?.length || 0;

  return (
    <div className="space-y-6">
      <LogoHeader 
        title="Sport E2D"
        subtitle="Gestion de l'équipe sportive E2D"
      />

      {/* Configuration Display */}
      {config && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Configuration E2D
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-blue-500" />
                <span className="font-medium">{config.nom_equipe}</span>
              </div>
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-purple-500" />
                <span className="text-sm">Entraîneur: {config.entraineur || 'Non défini'}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-green-500" />
                <span className="text-sm">{config.lieu_entrainement || 'Lieu non défini'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-orange-500" />
                <span className="text-sm">{config.horaire_entrainement || 'Horaire non défini'}</span>
              </div>
              {config.couleur_maillot && (
                <div className="flex items-center gap-2">
                  <Shirt className="h-4 w-4" style={{ color: config.couleur_maillot }} />
                  <span className="text-sm">Maillot: {config.couleur_maillot}</span>
                </div>
              )}
              <div className="col-span-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => navigate("/dashboard/admin/e2d-config")}
                >
                  <Settings className="h-4 w-4 mr-1" />
                  Modifier la config
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions rapides */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate("/dashboard/admin/presences")}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Présences</p>
                <p className="text-2xl font-bold">Gérer</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Button 
          className="h-full min-h-[120px] flex flex-col items-center justify-center"
          onClick={() => setShowMatchForm(true)}
        >
          <Plus className="h-8 w-8 mb-2" />
          <span className="text-sm">Planifier un match</span>
        </Button>

        <Button 
          className="h-full min-h-[120px] flex flex-col items-center justify-center"
          variant="outline"
          onClick={() => navigate("/dashboard/admin/sport")}
        >
          <TrendingUp className="h-8 w-8 mb-2" />
          <span className="text-sm">Voir les résultats</span>
        </Button>

        <Button 
          className="h-full min-h-[120px] flex flex-col items-center justify-center"
          variant="outline"
          onClick={() => navigate("/dashboard/admin/e2d-config")}
        >
          <Settings className="h-8 w-8 mb-2" />
          <span className="text-sm">Gérer les finances</span>
        </Button>
      </div>

      {/* Derniers matchs */}
      {matchs && matchs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              Derniers Matchs E2D
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {matchs.slice(0, 3).map((match) => (
                <div 
                  key={match.id} 
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div 
                    className="flex-1 cursor-pointer"
                    onClick={() => {
                      setSelectedMatch(match);
                      setShowMatchDetails(true);
                    }}
                  >
                    <p className="font-medium">{config?.nom_equipe || 'E2D'} vs {match.equipe_adverse}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(match.date_match).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      {match.score_e2d !== null && match.score_adverse !== null ? (
                        <p className="text-lg font-bold">
                          {match.score_e2d} - {match.score_adverse}
                        </p>
                      ) : (
                        <Badge variant="outline">{match.statut}</Badge>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedMatch(match);
                        setShowMatchDetails(true);
                      }}
                    >
                      <TrendingUp className="h-4 w-4 mr-1" />
                      Stats
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <E2DMatchForm
        open={showMatchForm}
        onOpenChange={setShowMatchForm}
        onSuccess={() => {
          // Rafraîchir les données des matchs
          queryClient.invalidateQueries({ queryKey: ['sport-e2d-matchs'] });
          setShowMatchForm(false);
        }}
      />

      <MatchDetailsModal
        open={showMatchDetails}
        onOpenChange={setShowMatchDetails}
        match={selectedMatch}
        matchType="e2d"
      />
    </div>
  );
}
