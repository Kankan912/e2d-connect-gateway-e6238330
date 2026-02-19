import { useEffect, lazy, Suspense } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PermissionRoute } from "@/components/auth/PermissionRoute";
import { PageLoader, SuspenseFallback } from "@/components/ui/page-loader";
import { ErrorBoundary } from "@/components/ErrorBoundary";

// ============================================
// ALL PAGES LAZY LOADED FOR OPTIMAL PERFORMANCE
// ============================================

// Dashboard Pages (Member)
const DashboardHome = lazy(() => import("./dashboard/DashboardHome"));
const Profile = lazy(() => import("./dashboard/Profile"));
const MyDonations = lazy(() => import("./dashboard/MyDonations"));
const MyCotisations = lazy(() => import("./dashboard/MyCotisations"));
const MyEpargnes = lazy(() => import("./dashboard/MyEpargnes"));
const MySanctions = lazy(() => import("./dashboard/MySanctions"));
const MyPrets = lazy(() => import("./dashboard/MyPrets"));
const MyPresences = lazy(() => import("./dashboard/MyPresences"));
const MyAides = lazy(() => import("./dashboard/MyAides"));

// Admin Pages - Core
const DonationsAdmin = lazy(() => import("./admin/DonationsAdmin"));
const MobileMoneyAdmin = lazy(() => import("./admin/MobileMoneyAdmin"));
const RolesAdmin = lazy(() => import("./admin/RolesAdmin"));
const PermissionsAdmin = lazy(() => import("./admin/PermissionsAdmin"));
const MembresAdmin = lazy(() => import("./admin/MembresAdmin"));
const AdhesionsAdmin = lazy(() => import("./admin/AdhesionsAdmin"));
const PaymentConfigAdmin = lazy(() => import("./admin/PaymentConfigAdmin"));
const StatsAdmin = lazy(() => import("./admin/StatsAdmin"));
const UtilisateursAdmin = lazy(() => import("./admin/UtilisateursAdmin"));

// Admin Pages - Tontine/Finance
const Epargnes = lazy(() => import("./Epargnes"));
const Beneficiaires = lazy(() => import("./admin/Beneficiaires"));
const TontineConfig = lazy(() => import("./admin/TontineConfig"));
const CaisseAdmin = lazy(() => import("./admin/CaisseAdmin"));
const PretsAdmin = lazy(() => import("./admin/PretsAdmin"));
const PretsConfigAdmin = lazy(() => import("./admin/PretsConfigAdmin"));
const AidesAdmin = lazy(() => import("./admin/AidesAdmin"));
const RapportsAdmin = lazy(() => import("./admin/RapportsAdmin"));

// Admin Pages - Reunions
const Reunions = lazy(() => import("./Reunions"));
const GestionPresences = lazy(() => import("./GestionPresences"));

// Admin Pages - Sport
const Sport = lazy(() => import("./Sport"));
const SportE2D = lazy(() => import("./SportE2D"));
const SportPhoenix = lazy(() => import("./SportPhoenix"));
const SportEquipes = lazy(() => import("./SportEquipes"));
const SportEntrainements = lazy(() => import("./admin/SportEntrainements"));
const SportSanctions = lazy(() => import("./admin/SportSanctions"));
const MatchGalaConfig = lazy(() => import("./admin/MatchGalaConfig"));
const E2DConfigAdmin = lazy(() => import("./admin/E2DConfigAdmin"));

// Admin Pages - Communication
const NotificationsAdmin = lazy(() => import("./admin/NotificationsAdmin"));
const NotificationsTemplatesAdmin = lazy(() => import("./admin/NotificationsTemplatesAdmin"));
const ExportsAdmin = lazy(() => import("./admin/ExportsAdmin"));

// Admin Pages - Site CMS
const HeroAdmin = lazy(() => import("./admin/site/HeroAdmin"));
const ActivitiesAdmin = lazy(() => import("./admin/site/ActivitiesAdmin"));
const EventsAdmin = lazy(() => import("./admin/site/EventsAdmin"));
const GalleryAdmin = lazy(() => import("./admin/site/GalleryAdmin"));
const PartnersAdmin = lazy(() => import("./admin/site/PartnersAdmin"));
const ConfigAdmin = lazy(() => import("./admin/site/ConfigAdmin"));
const AboutAdmin = lazy(() => import("./admin/site/AboutAdmin"));
const MessagesAdmin = lazy(() => import("./admin/site/MessagesAdmin"));
const ImagesAdmin = lazy(() => import("./admin/site/ImagesAdmin"));

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, loading, mustChangePassword } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    } else if (!loading && user && mustChangePassword) {
      navigate("/change-password");
    }
  }, [user, loading, mustChangePassword, navigate]);

  if (loading) {
    return <PageLoader fullPage />;
  }

  if (!user) {
    return null;
  }

  return (
    <DashboardLayout>
      <ErrorBoundary>
        <Suspense fallback={<SuspenseFallback />}>
          <Routes>
          {/* ==================== MEMBER ROUTES ==================== */}
          <Route path="/" element={<DashboardHome />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/my-donations" element={<MyDonations />} />
          <Route path="/my-cotisations" element={<MyCotisations />} />
          <Route path="/my-epargnes" element={<MyEpargnes />} />
          <Route path="/my-sanctions" element={<MySanctions />} />
          <Route path="/my-prets" element={<MyPrets />} />
          <Route path="/my-presences" element={<MyPresences />} />
          <Route path="/my-aides" element={<MyAides />} />
          
          {/* ==================== ADMIN ROUTES - FINANCE ==================== */}
          <Route path="/admin/donations" element={<PermissionRoute resource="donations" permission="read"><DonationsAdmin /></PermissionRoute>} />
          <Route path="/admin/donations/mobile-money" element={<PermissionRoute resource="donations" permission="read"><MobileMoneyAdmin /></PermissionRoute>} />
          <Route path="/admin/adhesions" element={<PermissionRoute resource="adhesions" permission="read"><AdhesionsAdmin /></PermissionRoute>} />
          <Route path="/admin/payment-config" element={<PermissionRoute resource="config" permission="write"><PaymentConfigAdmin /></PermissionRoute>} />
          <Route path="/admin/membres" element={<PermissionRoute resource="membres" permission="read"><MembresAdmin /></PermissionRoute>} />
          <Route path="/admin/roles" element={<PermissionRoute resource="roles" permission="write"><RolesAdmin /></PermissionRoute>} />
          <Route path="/admin/utilisateurs" element={<PermissionRoute resource="roles" permission="write"><UtilisateursAdmin /></PermissionRoute>} />
          <Route path="/admin/permissions" element={<PermissionRoute resource="configuration" permission="read"><PermissionsAdmin /></PermissionRoute>} />
          <Route path="/admin/stats" element={<PermissionRoute resource="stats" permission="read"><StatsAdmin /></PermissionRoute>} />
          
          {/* ==================== ROUTES TONTINE ==================== */}
          <Route path="/admin/tontine/epargnes" element={<PermissionRoute resource="epargnes" permission="read"><Epargnes /></PermissionRoute>} />
          <Route path="/admin/tontine/beneficiaires" element={<PermissionRoute resource="epargnes" permission="read"><Beneficiaires /></PermissionRoute>} />
          <Route path="/admin/caisse" element={<PermissionRoute resource="caisse" permission="read"><CaisseAdmin /></PermissionRoute>} />
          <Route path="/admin/tontine/config" element={<PermissionRoute resource="config" permission="write"><TontineConfig /></PermissionRoute>} />
          
          {/* ==================== ROUTES RÉUNIONS ==================== */}
          <Route path="/admin/reunions" element={<PermissionRoute resource="reunions" permission="read"><Reunions /></PermissionRoute>} />
          <Route path="/admin/presences" element={<PermissionRoute resource="presences" permission="read"><GestionPresences /></PermissionRoute>} />
          
          {/* ==================== ROUTES SPORT ==================== */}
          <Route path="/admin/sport" element={<PermissionRoute resource="sport_e2d" permission="read"><Sport /></PermissionRoute>} />
          <Route path="/admin/sport/e2d" element={<PermissionRoute resource="sport_e2d" permission="read"><SportE2D /></PermissionRoute>} />
          <Route path="/admin/sport/phoenix" element={<PermissionRoute resource="sport_phoenix" permission="read"><SportPhoenix /></PermissionRoute>} />
          <Route path="/admin/sport/equipes" element={<PermissionRoute resource="sport_phoenix" permission="read"><SportEquipes /></PermissionRoute>} />
          <Route path="/admin/sport/entrainements" element={<PermissionRoute resource="sport_phoenix" permission="read"><SportEntrainements /></PermissionRoute>} />
          <Route path="/admin/sport/sanctions" element={<PermissionRoute resource="sport_phoenix" permission="read"><SportSanctions /></PermissionRoute>} />
          <Route path="/admin/sport/match-gala" element={<PermissionRoute resource="sport_phoenix" permission="read"><MatchGalaConfig /></PermissionRoute>} />
          
          {/* ==================== ROUTES FINANCES AVANCÉES ==================== */}
          <Route path="/admin/finances/prets" element={<PermissionRoute resource="prets" permission="read"><PretsAdmin /></PermissionRoute>} />
          <Route path="/admin/finances/prets/config" element={<PermissionRoute resource="config" permission="write"><PretsConfigAdmin /></PermissionRoute>} />
          <Route path="/admin/finances/aides" element={<PermissionRoute resource="aides" permission="read"><AidesAdmin /></PermissionRoute>} />
          
          {/* ==================== ROUTES COMMUNICATION ==================== */}
          <Route path="/admin/communication/notifications" element={<PermissionRoute resource="notifications" permission="read"><NotificationsAdmin /></PermissionRoute>} />
          <Route path="/admin/communication/notifications-templates" element={<PermissionRoute resource="notifications" permission="write"><NotificationsTemplatesAdmin /></PermissionRoute>} />
          
          {/* ==================== ROUTES CONFIGURATION ==================== */}
          <Route path="/admin/config/exports" element={<PermissionRoute resource="config" permission="write"><ExportsAdmin /></PermissionRoute>} />
          <Route path="/admin/rapports" element={<PermissionRoute resource="stats" permission="read"><RapportsAdmin /></PermissionRoute>} />
          <Route path="/admin/e2d-config" element={<PermissionRoute resource="config" permission="write"><E2DConfigAdmin /></PermissionRoute>} />
          
          {/* ==================== ROUTES CMS SITE WEB ==================== */}
          <Route path="/admin/site/hero" element={<PermissionRoute resource="site" permission="write"><HeroAdmin /></PermissionRoute>} />
          <Route path="/admin/site/activities" element={<PermissionRoute resource="site" permission="write"><ActivitiesAdmin /></PermissionRoute>} />
          <Route path="/admin/site/events" element={<PermissionRoute resource="site" permission="write"><EventsAdmin /></PermissionRoute>} />
          <Route path="/admin/site/gallery" element={<PermissionRoute resource="site" permission="write"><GalleryAdmin /></PermissionRoute>} />
          <Route path="/admin/site/partners" element={<PermissionRoute resource="site" permission="write"><PartnersAdmin /></PermissionRoute>} />
          <Route path="/admin/site/config" element={<PermissionRoute resource="site" permission="write"><ConfigAdmin /></PermissionRoute>} />
          <Route path="/admin/site/about" element={<PermissionRoute resource="site" permission="write"><AboutAdmin /></PermissionRoute>} />
          <Route path="/admin/site/messages" element={<PermissionRoute resource="site" permission="write"><MessagesAdmin /></PermissionRoute>} />
          <Route path="/admin/site/images" element={<PermissionRoute resource="site" permission="write"><ImagesAdmin /></PermissionRoute>} />
          </Routes>
        </Suspense>
      </ErrorBoundary>
    </DashboardLayout>
  );
};

export default Dashboard;
