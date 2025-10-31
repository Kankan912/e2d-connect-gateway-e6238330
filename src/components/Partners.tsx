import { Handshake } from "lucide-react";

const Partners = () => {
  return (
    <section id="partenaires" className="py-20 lg:py-32 bg-muted/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-secondary/10 text-secondary text-sm font-semibold mb-4">
            Nos Partenaires
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-6">
            Ils Nous Font Confiance
          </h2>
          <p className="text-lg text-muted-foreground">
            Un grand merci à nos partenaires et sponsors qui contribuent au développement de l'association 
            et au rayonnement du sport dans notre communauté.
          </p>
        </div>

        {/* Partners Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 mb-16">
          {[1, 2, 3, 4].map((index) => (
            <div 
              key={index}
              className="aspect-square rounded-xl bg-card border border-border flex items-center justify-center p-8 hover:shadow-medium transition-all duration-300 hover:scale-105"
            >
              <div className="text-center">
                <Handshake className="w-12 h-12 text-muted-foreground/40 mx-auto mb-2" />
                <span className="text-sm text-muted-foreground">Partenaire {index}</span>
              </div>
            </div>
          ))}
        </div>

        {/* CTA to Become Partner */}
        <div className="max-w-3xl mx-auto">
          <div className="bg-gradient-to-br from-primary to-primary/90 rounded-2xl p-8 lg:p-12 text-center text-white shadow-strong">
            <Handshake className="w-16 h-16 mx-auto mb-6 text-white/90" />
            <h3 className="text-2xl lg:text-3xl font-bold mb-4">
              Devenez Partenaire d'E2D
            </h3>
            <p className="text-lg text-white/90 mb-6 max-w-2xl mx-auto">
              Vous souhaitez soutenir le sport local et associer votre image aux valeurs de notre association ? 
              Rejoignez nos partenaires et participez à une aventure humaine enrichissante.
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

export default Partners;
