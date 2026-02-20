import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { FullPageFallback } from "@/components/ui/page-loader";

// Lazy load des pages principales pour réduire le bundle initial
const Index = lazy(() => import("./pages/Index"));
const Auth = lazy(() => import("./pages/Auth"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Don = lazy(() => import("./pages/Don"));
const Adhesion = lazy(() => import("./pages/Adhesion"));
const FirstPasswordChange = lazy(() => import("./pages/FirstPasswordChange"));
const EventDetail = lazy(() => import("./pages/EventDetail"));
const AlbumDetail = lazy(() => import("./pages/AlbumDetail"));
const NotFound = lazy(() => import("./pages/NotFound"));

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

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <AuthProvider>
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
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
