import { useState } from "react";
import { Menu, X, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import logoE2D from "@/assets/logo-e2d.png";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    { label: "Accueil", href: "#accueil" },
    { label: "À propos", href: "#apropos" },
    { label: "Activités", href: "#activites" },
    { label: "Événements", href: "#evenements" },
    { label: "Galerie", href: "#galerie" },
    { label: "Partenaires", href: "#partenaires" },
    { label: "Contact", href: "#contact" },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-b border-border shadow-sm">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <a href="#accueil" className="flex items-center space-x-3 group">
            <img 
              src={logoE2D} 
              alt="Logo E2D" 
              className="h-12 lg:h-16 w-auto transition-transform duration-300 group-hover:scale-105"
            />
            <span className="font-bold text-lg lg:text-xl text-foreground hidden sm:inline-block">
              Association E2D
            </span>
          </a>

          {/* Desktop Menu */}
          <div className="hidden lg:flex items-center space-x-1">
            {menuItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="px-4 py-2 rounded-lg text-sm font-medium text-foreground/80 hover:text-foreground hover:bg-accent/10 transition-all duration-200"
              >
                {item.label}
              </a>
            ))}
          </div>

          {/* CTA Button - Portal Access */}
          <div className="hidden lg:flex items-center space-x-4">
            <Button 
              variant="default"
              size="lg"
              className="bg-gradient-to-r from-secondary to-secondary/90 hover:from-secondary/90 hover:to-secondary shadow-lg hover:shadow-glow transition-all duration-300"
              onClick={() => window.location.href = "/portal"}
            >
              <LogIn className="w-4 h-4 mr-2" />
              Portail Membre
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="lg:hidden p-2 rounded-lg hover:bg-accent/10 transition-colors"
          >
            {isOpen ? (
              <X className="w-6 h-6 text-foreground" />
            ) : (
              <Menu className="w-6 h-6 text-foreground" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="lg:hidden py-4 space-y-2 animate-in fade-in slide-in-from-top duration-300">
            {menuItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className="block px-4 py-3 rounded-lg text-base font-medium text-foreground/80 hover:text-foreground hover:bg-accent/10 transition-all"
              >
                {item.label}
              </a>
            ))}
            <Button 
              variant="default"
              size="lg"
              className="w-full bg-gradient-to-r from-secondary to-secondary/90 mt-4"
              onClick={() => {
                setIsOpen(false);
                window.location.href = "/portal";
              }}
            >
              <LogIn className="w-4 h-4 mr-2" />
              Portail Membre E2D Connect
            </Button>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
