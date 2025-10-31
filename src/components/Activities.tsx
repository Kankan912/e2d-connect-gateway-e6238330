import { Trophy, Users, Calendar, Dumbbell } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const Activities = () => {
  const activities = [
    {
      icon: Trophy,
      title: "Compétitions E2D",
      description: "Participez à nos matchs de championnat et représentez fièrement les couleurs de l'association.",
      features: ["Matchs hebdomadaires", "Championnat local", "Tournois inter-clubs"]
    },
    {
      icon: Dumbbell,
      title: "Entraînements Phoenix",
      description: "Séances d'entraînement intensives pour progresser techniquement et tactiquement.",
      features: ["Training du week-end", "Préparation physique", "Exercices techniques"]
    },
    {
      icon: Users,
      title: "Jaune & Rouge",
      description: "Matchs internes amicaux pour maintenir la cohésion d'équipe et le plaisir du jeu.",
      features: ["Matchs amicaux", "Esprit convivial", "Rotation des équipes"]
    },
    {
      icon: Calendar,
      title: "Événements Communautaires",
      description: "Activités sociales et sportives pour renforcer les liens au-delà du terrain.",
      features: ["Soirées d'équipe", "Tournois caritatifs", "Rassemblements familiaux"]
    }
  ];

  return (
    <section id="activites" className="py-20 lg:py-32 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-secondary/10 text-secondary text-sm font-semibold mb-4">
            Nos Activités
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-6">
            Des Activités pour Tous les Niveaux
          </h2>
          <p className="text-lg text-muted-foreground">
            Que vous soyez débutant ou joueur confirmé, E2D propose une gamme complète d'activités 
            sportives et communautaires adaptées à tous.
          </p>
        </div>

        {/* Activities Grid */}
        <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
          {activities.map((activity, index) => {
            const Icon = activity.icon;
            return (
              <Card 
                key={index}
                className="border-border hover:shadow-medium transition-all duration-300 hover:scale-[1.02]"
              >
                <CardHeader>
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center mb-4">
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <CardTitle className="text-2xl">{activity.title}</CardTitle>
                  <CardDescription className="text-base">{activity.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {activity.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center text-muted-foreground">
                        <div className="w-1.5 h-1.5 rounded-full bg-secondary mr-3" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* CTA Section */}
        <div className="mt-16 text-center">
          <div className="bg-gradient-to-br from-primary to-primary/90 rounded-2xl p-8 lg:p-12 text-white">
            <h3 className="text-2xl lg:text-3xl font-bold mb-4">
              Envie de Rejoindre l'Aventure ?
            </h3>
            <p className="text-lg text-white/90 mb-6 max-w-2xl mx-auto">
              Que vous souhaitiez jouer en compétition, vous entraîner pour le plaisir, 
              ou simplement faire partie de notre communauté, il y a une place pour vous chez E2D !
            </p>
            <button 
              onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}
              className="bg-secondary hover:bg-secondary/90 text-white font-semibold px-8 py-3 rounded-lg shadow-lg hover:shadow-glow transition-all duration-300"
            >
              Contactez-nous
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Activities;
