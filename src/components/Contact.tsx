import { useState } from "react";
import { Mail, MapPin, Phone, Facebook, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useSiteConfig } from "@/hooks/useSiteContent";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";

const Contact = () => {
  const { toast } = useToast();
  const { data: config, isLoading } = useSiteConfig();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    nom: "",
    email: "",
    telephone: "",
    objet: "",
    message: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nom || !formData.email || !formData.objet || !formData.message) {
      toast({
        title: "Champs requis",
        description: "Veuillez remplir tous les champs obligatoires.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from("messages_contact")
        .insert({
          nom: formData.nom,
          email: formData.email,
          telephone: formData.telephone || null,
          objet: formData.objet,
          message: formData.message,
          statut: "nouveau",
        });

      if (error) throw error;

      toast({
        title: "Message envoyé !",
        description: "Nous vous répondrons dans les plus brefs délais.",
      });

      // Reset form
      setFormData({
        nom: "",
        email: "",
        telephone: "",
        objet: "",
        message: "",
      });
    } catch (error) {
      console.error("Erreur envoi message:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue. Veuillez réessayer.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getConfigValue = (key: string) => {
    return config?.find(c => c.cle === key)?.valeur || '';
  };

  const contactInfo = [
    {
      icon: Mail,
      title: "Email",
      value: getConfigValue('site_email'),
      href: `mailto:${getConfigValue('site_email')}`
    },
    {
      icon: Phone,
      title: "Téléphone",
      value: getConfigValue('site_telephone'),
      href: `tel:${getConfigValue('site_telephone').replace(/\s/g, '')}`
    },
    {
      icon: MapPin,
      title: "Localisation",
      value: getConfigValue('site_adresse'),
      href: "#"
    },
    {
      icon: Facebook,
      title: "Facebook",
      value: "Phoenix KMRA",
      href: getConfigValue('facebook_url')
    }
  ];

  if (isLoading) {
    return (
      <section id="contact" className="py-20 lg:py-32 bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Skeleton className="h-10 w-64 mx-auto mb-4" />
            <Skeleton className="h-6 w-96 mx-auto" />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="contact" className="py-20 lg:py-32 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 animate-in fade-in slide-in-from-bottom duration-700">
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
          <div className="bg-card rounded-2xl p-8 shadow-soft border border-border animate-in fade-in slide-in-from-left duration-700 delay-200">
            <h3 className="text-2xl font-bold text-foreground mb-6">Envoyez-nous un Message</h3>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Nom complet *
                  </label>
                  <Input 
                    placeholder="Votre nom" 
                    value={formData.nom}
                    onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                    required 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Téléphone
                  </label>
                  <Input 
                    type="tel" 
                    placeholder="+33 X XX XX XX XX"
                    value={formData.telephone}
                    onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Email *
                </label>
                <Input 
                  type="email" 
                  placeholder="votre.email@exemple.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required 
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Objet *
                </label>
                <Input 
                  placeholder="Objet de votre message"
                  value={formData.objet}
                  onChange={(e) => setFormData({ ...formData, objet: e.target.value })}
                  required 
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Message *
                </label>
                <Textarea 
                  placeholder="Parlez-nous de votre projet ou de vos questions..."
                  rows={5}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  required
                />
              </div>

              <Button 
                type="submit"
                className="w-full bg-secondary hover:bg-secondary/90 text-white transition-all duration-300"
                size="lg"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Envoi en cours...
                  </>
                ) : (
                  "Envoyer le Message"
                )}
              </Button>
            </form>
          </div>

          {/* Contact Info */}
          <div className="space-y-6 animate-in fade-in slide-in-from-right duration-700 delay-300">
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
                  className="w-full justify-start hover:translate-x-1 transition-transform"
                  onClick={() => window.location.href = "/auth"}
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Accès Portail Membre E2D Connect
                </Button>
                <Button 
                  variant="outline"
                  className="w-full justify-start hover:translate-x-1 transition-transform"
                  onClick={() => window.location.href = "/adhesion"}
                >
                  Formulaire d'Adhésion
                </Button>
                <Button 
                  variant="outline"
                  className="w-full justify-start hover:translate-x-1 transition-transform"
                  onClick={() => window.location.href = "/don"}
                >
                  Faire un Don
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
