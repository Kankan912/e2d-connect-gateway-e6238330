import { Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { AssociationProvider } from "@/contexts/AssociationContext";
import { PublicAssociationProvider } from "@/contexts/PublicAssociationContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { FullPageFallback } from "@/components/ui/page-loader";
import { lazyWithRetry } from "@/lib/lazyWithRetry";
import { usePageviewTracker } from "@/hooks/usePageviewTracker";
import { useConnectionTracker } from "@/hooks/useConnectionTracker";

// Lazy load des pages principales avec retry automatique après déploiement
const Index = lazyWithRetry(() => import("./pages/Index"));
const Auth = lazyWithRetry(() => import("./pages/Auth"));
const Dashboard = lazyWithRetry(() => import("./pages/Dashboard"));
const Don = lazyWithRetry(() => import("./pages/Don"));
const Adhesion = lazyWithRetry(() => import("./pages/Adhesion"));
const FirstPasswordChange = lazyWithRetry(() => import("./pages/FirstPasswordChange"));
const EventDetail = lazyWithRetry(() => import("./pages/EventDetail"));
const AlbumDetail = lazyWithRetry(() => import("./pages/AlbumDetail"));
const NotFound = lazyWithRetry(() => import("./pages/NotFound"));

// Configuration optimisée du QueryClient
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      gcTime: 10 * 60 * 1000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const TrackedRoutes = () => {
  usePageviewTracker();
  useConnectionTracker();
  return (
    <Suspense fallback={<FullPageFallback />}>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/dashboard/*" element={<Dashboard />} />
        <Route path="/don" element={<Don />} />
        <Route path="/adhesion" element={<Adhesion />} />
        <Route path="/change-password" element={<FirstPasswordChange />} />
        <Route path="/evenements/:id" element={<EventDetail />} />
        <Route path="/albums/:albumId" element={<AlbumDetail />} />
        {/* Site public d'une association ciblée par slug : /s/:slug */}
        <Route path="/s/:slug" element={<Index />} />
        <Route path="/s/:slug/don" element={<Don />} />
        <Route path="/s/:slug/adhesion" element={<Adhesion />} />
        <Route path="/s/:slug/evenements/:id" element={<EventDetail />} />
        <Route path="/s/:slug/albums/:albumId" element={<AlbumDetail />} />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
};

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <AuthProvider>
            <PublicAssociationProvider>
              <AssociationProvider>
                <TrackedRoutes />
              </AssociationProvider>
            </PublicAssociationProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
