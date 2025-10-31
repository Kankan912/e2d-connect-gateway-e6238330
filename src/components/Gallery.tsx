import { Image, Play } from "lucide-react";
import heroImage from "@/assets/hero-sports.jpg";
import teamImage from "@/assets/team-celebration.jpg";

const Gallery = () => {
  const galleryItems = [
    {
      type: "image",
      src: heroImage,
      title: "Match de Championnat",
      category: "Compétition"
    },
    {
      type: "image",
      src: teamImage,
      title: "Célébration d'Équipe",
      category: "Moments Forts"
    },
    {
      type: "placeholder",
      icon: Play,
      title: "Highlights du Tournoi",
      category: "Vidéo"
    },
    {
      type: "placeholder",
      icon: Image,
      title: "Training Phoenix",
      category: "Entraînement"
    }
  ];

  return (
    <section id="galerie" className="py-20 lg:py-32 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-4">
            Galerie
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-6">
            Revivez Nos Meilleurs Moments
          </h2>
          <p className="text-lg text-muted-foreground">
            Découvrez en images et en vidéos les moments forts qui font la richesse de notre association.
          </p>
        </div>

        {/* Gallery Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {galleryItems.map((item, index) => (
            <div 
              key={index}
              className="group relative aspect-square rounded-xl overflow-hidden shadow-soft hover:shadow-strong transition-all duration-300 cursor-pointer"
            >
              {item.type === "image" ? (
                <>
                  <img 
                    src={item.src}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-primary/90 via-primary/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </>
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
                  {item.icon && <item.icon className="w-16 h-16 text-muted-foreground/30" />}
                </div>
              )}
              
              {/* Overlay Info */}
              <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                <span className="inline-block px-2 py-1 rounded text-xs font-medium bg-secondary text-white mb-2">
                  {item.category}
                </span>
                <h3 className="text-white font-semibold">{item.title}</h3>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <p className="text-muted-foreground mb-4">Plus de photos et vidéos disponibles sur nos réseaux sociaux</p>
          <button 
            onClick={() => window.open("https://www.facebook.com/phoenixkmra/", "_blank")}
            className="inline-flex items-center px-6 py-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors duration-200"
          >
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
            Suivez-nous sur Facebook
          </button>
        </div>
      </div>
    </section>
  );
};

export default Gallery;
