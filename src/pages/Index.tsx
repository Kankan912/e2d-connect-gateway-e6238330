import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import About from "@/components/About";
import Activities from "@/components/Activities";
import Events from "@/components/Events";
import Gallery from "@/components/Gallery";
import Partners from "@/components/Partners";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEOHead 
        title="Association E2D | Communauté Sportive et Solidaire"
        description="Rejoignez l'Association E2D - une communauté dynamique où le sport, l'amitié et la solidarité se rencontrent. Football, entraide et convivialité au cœur de notre action."
        keywords="association E2D, football camerounais, communauté sportive, solidarité, Phoenix KMRA, adhésion, don"
      />
      <Navbar />
      <Hero />
      <About />
      <Activities />
      <Events />
      <Gallery />
      <Partners />
      <Contact />
      <Footer />
    </div>
  );
};

export default Index;
