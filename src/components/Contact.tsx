import { Mail, MapPin, Phone, Facebook } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

const Contact = () => {
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Message envoyé !",
      description: "Nous vous répondrons dans les plus brefs délais.",
    });
  };

  const contactInfo = [
    {
      icon: Mail,
      title: "Email",
      value: "alexr.fotso@gmail.com",
      href: "mailto:alexr.fotso@gmail.com"
    },
    {
      icon: Phone,
      title: "Téléphone",
      value: "+33 (0)X XX XX XX XX",
      href: "tel:+33XXXXXXXXX"
    },
    {
      icon: MapPin,
      title: "Localisation",
      value: "Communauté Locale",
      href: "#"
    },
    {
      icon: Facebook,
      title: "Facebook",
      value: "@phoenixkmra",
      href: "https://www.facebook.com/phoenixkmra/"
    }
  ];

  return (
    <section id="contact" className="py-20 lg:py-32 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-secondary/10 text-secondary text-sm font-semibold mb-4">
            Contactez-nous
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-6">
            Rejoignez l'Aventure E2D
          </h2>
          <p className="text-lg text-muted-foreground">
            Que vous souhaitiez adhérer, devenir partenaire, ou simplement en savoir plus, 
            nous sommes à votre écoute !
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
          {/* Contact Form */}
          <div className="bg-card rounded-2xl p-8 shadow-soft border border-border">
            <h3 className="text-2xl font-bold text-foreground mb-6">Envoyez-nous un Message</h3>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Prénom
                  </label>
                  <Input placeholder="Votre prénom" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Nom
                  </label>
                  <Input placeholder="Votre nom" required />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Email
                </label>
                <Input type="email" placeholder="votre.email@exemple.com" required />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Téléphone
                </label>
                <Input type="tel" placeholder="+33 X XX XX XX XX" />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Message
                </label>
                <Textarea 
                  placeholder="Parlez-nous de votre projet ou de vos questions..."
                  rows={5}
                  required
                />
              </div>

              <Button 
                type="submit"
                className="w-full bg-secondary hover:bg-secondary/90 text-white"
                size="lg"
              >
                Envoyer le Message
              </Button>
            </form>
          </div>

          {/* Contact Info */}
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-primary to-primary/90 rounded-2xl p-8 text-white">
              <h3 className="text-2xl font-bold mb-6">Informations de Contact</h3>
              <div className="space-y-6">
                {contactInfo.map((info, index) => {
                  const Icon = info.icon;
                  return (
                    <a
                      key={index}
                      href={info.href}
                      target={info.href.startsWith("http") ? "_blank" : undefined}
                      rel={info.href.startsWith("http") ? "noopener noreferrer" : undefined}
                      className="flex items-start group cursor-pointer hover:translate-x-2 transition-transform duration-200"
                    >
                      <div className="w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center mr-4 flex-shrink-0 group-hover:bg-white/20 transition-colors">
                        <Icon className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="font-semibold mb-1">{info.title}</div>
                        <div className="text-white/80">{info.value}</div>
                      </div>
                    </a>
                  );
                })}
              </div>
            </div>

            {/* Quick Links */}
            <div className="bg-card rounded-2xl p-8 shadow-soft border border-border">
              <h3 className="text-xl font-bold text-foreground mb-4">Liens Rapides</h3>
              <div className="space-y-3">
                <Button 
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => window.open("https://lovable.dev/projects/403b8901-aa9b-44e8-8af7-a7b15ab6114d", "_blank")}
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Accès Portail Membre E2D Connect
                </Button>
                <Button 
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => document.getElementById('apropos')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  Formulaire d'Adhésion
                </Button>
                <Button 
                  variant="outline"
                  className="w-full justify-start"
                >
                  Faire un Don (HelloAsso)
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;
