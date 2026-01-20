import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Calendar, Clock, MapPin, ArrowLeft, Trophy, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import SEOHead from "@/components/SEOHead";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function EventDetail() {
  const { id } = useParams<{ id: string }>();

  const { data: event, isLoading } = useQuery({
    queryKey: ["site-event-detail", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_events")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Si c'est un match synchronisé, récupérer les détails du match
  const { data: matchDetails } = useQuery({
    queryKey: ["match-details-for-event", event?.match_id],
    queryFn: async () => {
      if (!event?.match_id) return null;
      const { data, error } = await supabase
        .from("sport_e2d_matchs")
        .select("*")
        .eq("id", event.match_id)
        .single();

      if (error) return null;
      return data;
    },
    enabled: !!event?.match_id,
  });

  if (isLoading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-background pt-24">
          <div className="container mx-auto px-4 py-8">
            <Skeleton className="h-8 w-32 mb-6" />
            <Skeleton className="h-64 w-full mb-6" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
        <Footer />
      </>
    );
  }

  if (!event) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-background pt-24 flex items-center justify-center">
          <Card className="max-w-md mx-auto">
            <CardContent className="p-8 text-center">
              <h1 className="text-2xl font-bold mb-4">Événement non trouvé</h1>
              <p className="text-muted-foreground mb-6">
                L'événement que vous recherchez n'existe pas ou a été supprimé.
              </p>
              <Link to="/#evenements">
                <Button>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Retour aux événements
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </>
    );
  }

  const eventDate = new Date(event.date);
  const isPast = eventDate < new Date();
  const isMatch = event.match_type === 'e2d' && matchDetails;

  return (
    <>
      <SEOHead
        title={`${event.titre} | E2D`}
        description={event.description || `Détails de l'événement ${event.titre}`}
      />
      <Navbar />
      <main className="min-h-screen bg-background pt-24">
        <div className="container mx-auto px-4 py-8">
          {/* Bouton retour */}
          <Link to="/#evenements" className="inline-flex items-center text-muted-foreground hover:text-primary mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour aux événements
          </Link>

          {/* En-tête de l'événement */}
          <div className="grid lg:grid-cols-2 gap-8 mb-8">
            {/* Image de l'événement */}
            <div className="relative rounded-2xl overflow-hidden bg-muted aspect-video">
              {event.image_url ? (
                <img
                  src={event.image_url}
                  alt={event.titre}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-secondary/20">
                  <Calendar className="h-24 w-24 text-primary/40" />
                </div>
              )}
              <div className="absolute top-4 left-4">
                <Badge className={isPast ? "bg-muted-foreground" : "bg-primary"}>
                  {event.type}
                </Badge>
              </div>
              {isPast && (
                <div className="absolute top-4 right-4">
                  <Badge variant="secondary">Passé</Badge>
                </div>
              )}
            </div>

            {/* Informations */}
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
                  {event.titre}
                </h1>
                {event.description && (
                  <p className="text-lg text-muted-foreground">
                    {event.description}
                  </p>
                )}
              </div>

              <Card>
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Calendar className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Date</p>
                      <p className="font-semibold">
                        {format(eventDate, "EEEE dd MMMM yyyy", { locale: fr })}
                      </p>
                    </div>
                  </div>

                  {event.heure && (
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Clock className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Heure</p>
                        <p className="font-semibold">{event.heure}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <MapPin className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Lieu</p>
                      <p className="font-semibold">{event.lieu}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Score si match terminé */}
              {isMatch && matchDetails.statut === 'termine' && (
                <Card className="bg-gradient-to-r from-primary/10 to-secondary/10">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-center gap-8">
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground mb-1">E2D</p>
                        <p className="text-4xl font-bold text-primary">
                          {matchDetails.score_e2d}
                        </p>
                      </div>
                      <div className="text-2xl font-bold text-muted-foreground">-</div>
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground mb-1">
                          {matchDetails.equipe_adverse}
                        </p>
                        <p className="text-4xl font-bold">
                          {matchDetails.score_adverse}
                        </p>
                      </div>
                    </div>
                    <div className="text-center mt-4">
                      <Badge variant="secondary">
                        <Trophy className="h-3 w-3 mr-1" />
                        Match Terminé
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Détails supplémentaires du match */}
          {isMatch && (
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Informations du match
                </h2>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground">Type de match</p>
                    <p className="font-medium capitalize">{matchDetails.type_match}</p>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground">Statut</p>
                    <p className="font-medium capitalize">{matchDetails.statut}</p>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground">Adversaire</p>
                    <p className="font-medium">{matchDetails.equipe_adverse}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
