import { Target, Users, Heart, Award } from "lucide-react";

const About = () => {
  const values = [
    {
      icon: Target,
      title: "Notre Mission",
      description: "Promouvoir le sport comme vecteur de cohésion sociale et de développement personnel au sein de notre communauté."
    },
    {
      icon: Users,
      title: "L'Esprit d'Équipe",
      description: "Cultiver un environnement où chacun peut s'épanouir, progresser et tisser des liens d'amitié durables."
    },
    {
      icon: Heart,
      title: "La Solidarité",
      description: "Soutenir nos membres dans leurs projets personnels et sportifs, créer une vraie famille au-delà du terrain."
    },
    {
      icon: Award,
      title: "L'Excellence",
      description: "Viser l'excellence sportive tout en préservant les valeurs de fair-play, de respect et d'entraide."
    }
  ];

  return (
    <section id="apropos" className="py-20 lg:py-32 bg-muted/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-4">
            À Propos de Nous
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-6">
            Plus qu'une Association Sportive
          </h2>
          <p className="text-lg text-muted-foreground">
            E2D est née de la passion commune pour le football et de la volonté de créer 
            un espace où le sport rime avec fraternité, développement et engagement communautaire.
          </p>
        </div>

        {/* Story Section */}
        <div className="max-w-4xl mx-auto mb-20">
          <div className="bg-card rounded-2xl p-8 lg:p-12 shadow-soft border border-border">
            <h3 className="text-2xl lg:text-3xl font-bold text-foreground mb-6">Notre Histoire</h3>
            <div className="prose prose-lg max-w-none text-muted-foreground space-y-4">
              <p>
                Fondée il y a plus de 10 ans par un groupe de passionnés de football, l'Association 
                Sportive E2D s'est rapidement imposée comme un acteur majeur du sport local.
              </p>
              <p>
                Ce qui a commencé comme de simples rencontres entre amis s'est transformé en une 
                véritable communauté où chacun trouve sa place, qu'il soit joueur débutant ou confirmé.
              </p>
              <p>
                Aujourd'hui, E2D c'est plus de 150 membres actifs, des équipes compétitives, 
                des entraînements réguliers, et surtout une famille soudée par les valeurs du sport 
                et de l'entraide.
              </p>
            </div>
          </div>
        </div>

        {/* Values Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {values.map((value, index) => {
            const Icon = value.icon;
            return (
              <div 
                key={index}
                className="bg-card rounded-xl p-6 shadow-soft border border-border hover:shadow-medium hover:scale-105 transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-secondary to-secondary/80 flex items-center justify-center mb-4">
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-3">{value.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{value.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default About;
