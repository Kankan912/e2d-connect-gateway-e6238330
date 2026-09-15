import { ReactNode, Suspense } from "react";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { lazyWithRetry } from "@/lib/lazyWithRetry";

// Lazy load des sections below-the-fold pour accélérer le FCP
const About = lazyWithRetry(() => import("@/components/About"));
const Activities = lazyWithRetry(() => import("@/components/Activities"));
const Events = lazyWithRetry(() => import("@/components/Events"));
const Gallery = lazyWithRetry(() => import("@/components/Gallery"));
const Partners = lazyWithRetry(() => import("@/components/Partners"));
const Contact = lazyWithRetry(() => import("@/components/Contact"));

// Skeleton pour les sections en chargement
const SectionSkeleton = () => (
  <div className="py-16 px-4">
    <div className="max-w-6xl mx-auto space-y-6">
      <Skeleton className="h-8 w-48 mx-auto" />
      <Skeleton className="h-4 w-96 mx-auto" />
      <div className="grid md:grid-cols-3 gap-6 mt-8">
        <Skeleton className="h-48 rounded-lg" />
        <Skeleton className="h-48 rounded-lg" />
        <Skeleton className="h-48 rounded-lg" />
      </div>
    </div>
  </div>
);

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
      <Suspense fallback={<SectionSkeleton />}>
        <About />
      </Suspense>
      <Suspense fallback={<SectionSkeleton />}>
        <Activities />
      </Suspense>
      <Suspense fallback={<SectionSkeleton />}>
        <Events />
      </Suspense>
      <Suspense fallback={<SectionSkeleton />}>
        <Gallery />
      </Suspense>
      <Suspense fallback={<SectionSkeleton />}>
        <Partners />
      </Suspense>
      <Suspense fallback={<SectionSkeleton />}>
        <Contact />
      </Suspense>
      <Footer />
    </div>
  );
};

export default Index;
