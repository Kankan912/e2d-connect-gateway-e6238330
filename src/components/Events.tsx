import { Calendar, MapPin, Clock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useSiteEvents } from "@/hooks/useSiteContent";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import teamImage from "@/assets/team-celebration.jpg";

const Events = () => {
  const { data: events, isLoading } = useSiteEvents();

  if (isLoading) {
    return (
      <section id="evenements" className="py-20 lg:py-32 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Skeleton className="h-8 w-48 mx-auto mb-4" />
            <Skeleton className="h-12 w-96 mx-auto" />
          </div>
          <div className="grid lg:grid-cols-2 gap-8">
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-32" />
              ))}
            </div>
            <Skeleton className="h-96" />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="evenements" className="py-20 lg:py-32 bg-muted/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-secondary/10 text-secondary text-sm font-semibold mb-4">
            Événements
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-6">
            Ne Manquez Aucun Moment Fort
          </h2>
          <p className="text-lg text-muted-foreground">
            Calendrier complet de nos matchs, entraînements et événements communautaires à venir.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Events List */}
          <div className="space-y-4">
            {events?.map((event: any) => (
              <div 
                key={event.id}
                className="bg-card rounded-xl p-6 border border-border shadow-soft hover:shadow-medium transition-all duration-300 hover:scale-[1.02]"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Calendar className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-foreground">{event.titre}</h3>
                      <span className="inline-block px-2 py-1 rounded text-xs font-medium bg-secondary/10 text-secondary mt-1">
                        {event.type}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="space-y-2 ml-15">
                  <div className="flex items-center text-muted-foreground">
                    <Calendar className="w-4 h-4 mr-2 text-primary" />
                    <span className="text-sm">
                      {format(new Date(event.date), "dd MMM yyyy", { locale: fr })}
                    </span>
                    {event.heure && (
                      <>
                        <Clock className="w-4 h-4 ml-4 mr-2 text-primary" />
                        <span className="text-sm">{event.heure.slice(0, 5)}</span>
                      </>
                    )}
                  </div>
                  <div className="flex items-center text-muted-foreground">
                    <MapPin className="w-4 h-4 mr-2 text-primary" />
                    <span className="text-sm">{event.lieu}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Image Side */}
          <div className="relative">
            <div className="relative rounded-2xl overflow-hidden shadow-strong">
              <img 
                src={teamImage}
                alt="Équipe E2D célébrant"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/60 to-transparent" />
            </div>
            
            {/* Stats Overlay */}
            <div className="absolute -bottom-6 left-6 right-6 bg-card rounded-xl p-6 shadow-strong border border-border">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-foreground">25+</div>
                  <div className="text-xs text-muted-foreground">Matchs/An</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-foreground">48</div>
                  <div className="text-xs text-muted-foreground">Entraînements</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-foreground">12</div>
                  <div className="text-xs text-muted-foreground">Événements</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Events;
