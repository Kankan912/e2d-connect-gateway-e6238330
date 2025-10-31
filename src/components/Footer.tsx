import { Facebook, Mail, Heart } from "lucide-react";
import logoE2D from "@/assets/logo-e2d.png";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    "Navigation": [
      { label: "Accueil", href: "#accueil" },
      { label: "À propos", href: "#apropos" },
      { label: "Activités", href: "#activites" },
      { label: "Événements", href: "#evenements" }
    ],
    "Ressources": [
      { label: "Galerie", href: "#galerie" },
      { label: "Partenaires", href: "#partenaires" },
      { label: "Contact", href: "#contact" },
      { label: "Portail Membre", href: "/portal" }
    ]
  };

  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12 mb-12">
          {/* Brand Section */}
          <div className="lg:col-span-2">
            <div className="flex items-center space-x-3 mb-4">
              <img src={logoE2D} alt="Logo E2D" className="h-12 w-auto" />
              <span className="font-bold text-xl">Association Sportive E2D</span>
            </div>
            <p className="text-primary-foreground/80 mb-6 max-w-md">
              Plus qu'une association sportive, une famille unie par la passion du football 
              et les valeurs de solidarité, de respect et d'excellence.
            </p>
            <div className="flex space-x-4">
              <a 
                href="https://www.facebook.com/phoenixkmra/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-lg bg-white/10 hover:bg-secondary flex items-center justify-center transition-colors duration-200"
              >
                <Facebook className="w-5 h-5" />
              </a>
              <a 
                href="mailto:alexr.fotso@gmail.com"
                className="w-10 h-10 rounded-lg bg-white/10 hover:bg-secondary flex items-center justify-center transition-colors duration-200"
              >
                <Mail className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Links Sections */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h3 className="font-bold text-lg mb-4">{title}</h3>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.label}>
                     <a
                      href={link.href}
                      className="text-primary-foreground/80 hover:text-secondary transition-colors duration-200"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-white/10">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-sm text-primary-foreground/70 text-center md:text-left">
              © {currentYear} Association Sportive E2D. Tous droits réservés.
            </p>
            <p className="text-sm text-primary-foreground/70 flex items-center">
              Fait avec <Heart className="w-4 h-4 mx-1 text-secondary" /> pour la communauté E2D
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
