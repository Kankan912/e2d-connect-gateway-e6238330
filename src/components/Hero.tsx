import { ArrowRight, Heart, Users, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useSiteHero } from "@/hooks/useSiteContent";
import heroImage from "@/assets/hero-sports.jpg";

const Hero = () => {
  const { data: hero, isLoading } = useSiteHero();

  if (isLoading) {
    return (
      <section id="accueil" className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16 lg:pt-20">
        <div className="absolute inset-0 z-0 bg-primary/90" />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <Skeleton className="h-8 w-64 mx-auto bg-white/20" />
            <Skeleton className="h-20 w-full bg-white/20" />
            <Skeleton className="h-6 w-3/4 mx-auto bg-white/20" />
          </div>
        </div>
      </section>
    );
  }

  const backgroundImage = hero?.image_url || heroImage;

  return (
    <section id="accueil" className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16 lg:pt-20">
      {/* Background Image with Overlay */}
      <div 
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `url(${backgroundImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-primary/95 via-primary/85 to-primary/75" />
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-secondary/20 backdrop-blur-sm border border-secondary/30 mb-8 animate-in fade-in slide-in-from-top duration-700">
            <Trophy className="w-4 h-4 text-secondary mr-2" />
            <span className="text-sm font-semibold text-secondary">{hero?.badge_text || "Association Sportive E2D"}</span>
          </div>

          {/* Main Heading */}
          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold text-white mb-6 leading-tight animate-in fade-in slide-in-from-top duration-700 delay-100">
            {hero?.titre || "Ensemble pour la Passion du Sport"}
          </h1>

          {/* Subheading */}
          <p className="text-lg sm:text-xl lg:text-2xl text-white/90 mb-12 max-w-2xl mx-auto animate-in fade-in slide-in-from-top duration-700 delay-200">
            {hero?.sous_titre || "Rejoignez une communauté dynamique où le sport, l'amitié et la solidarité se rencontrent. Plus qu'un club, une famille !"}
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-in fade-in slide-in-from-top duration-700 delay-300">
            <Button 
              size="lg"
              className="bg-secondary hover:bg-secondary/90 text-white shadow-xl hover:shadow-glow transition-all duration-300 text-lg px-8 py-6"
              onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}
            >
              {hero?.bouton_1_texte || "Nous Rejoindre"}
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button 
              size="lg"
              variant="outline"
              className="border-2 border-white text-white hover:bg-white hover:text-primary backdrop-blur-sm bg-white/10 text-lg px-8 py-6 transition-all duration-300"
              onClick={() => document.getElementById('apropos')?.scrollIntoView({ behavior: 'smooth' })}
            >
              {hero?.bouton_2_texte || "En Savoir Plus"}
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-6 mt-16 max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom duration-700 delay-500">
            <div className="text-center">
              <Users className="w-8 h-8 text-secondary mx-auto mb-2" />
              <div className="text-3xl font-bold text-white mb-1">{hero?.stat_1_nombre || 150}+</div>
              <div className="text-sm text-white/80">{hero?.stat_1_label || "Membres Actifs"}</div>
            </div>
            <div className="text-center">
              <Trophy className="w-8 h-8 text-secondary mx-auto mb-2" />
              <div className="text-3xl font-bold text-white mb-1">{hero?.stat_2_nombre || 25}+</div>
              <div className="text-sm text-white/80">{hero?.stat_2_label || "Tournois par An"}</div>
            </div>
            <div className="text-center">
              <Heart className="w-8 h-8 text-secondary mx-auto mb-2" />
              <div className="text-3xl font-bold text-white mb-1">{hero?.stat_3_nombre || 10}+</div>
              <div className="text-sm text-white/80">{hero?.stat_3_label || "Années d'Existence"}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10 animate-bounce">
        <div className="w-6 h-10 rounded-full border-2 border-white/50 flex items-start justify-center p-2">
          <div className="w-1 h-3 bg-white/50 rounded-full" />
        </div>
      </div>
    </section>
  );
};

export default Hero;
