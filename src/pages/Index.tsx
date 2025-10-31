import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import About from "@/components/About";
import Activities from "@/components/Activities";
import Events from "@/components/Events";
import Gallery from "@/components/Gallery";
import Partners from "@/components/Partners";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
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
