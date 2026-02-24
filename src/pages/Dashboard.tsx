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
      <Suspense fallback={<SuspenseFallback />}>
        <Routes>
          {/* ==================== MEMBER ROUTES ==================== */}
          <Route path="/" element={<DashboardHome />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/my-donations" element={<ErrorBoundary fallbackTitle="Erreur - Mes dons"><MyDonations /></ErrorBoundary>} />
          <Route path="/my-cotisations" element={<ErrorBoundary fallbackTitle="Erreur - Mes cotisations"><MyCotisations /></ErrorBoundary>} />
          <Route path="/my-epargnes" element={<ErrorBoundary fallbackTitle="Erreur - Mes épargnes"><MyEpargnes /></ErrorBoundary>} />
          <Route path="/my-sanctions" element={<ErrorBoundary fallbackTitle="Erreur - Mes sanctions"><MySanctions /></ErrorBoundary>} />
          <Route path="/my-prets" element={<ErrorBoundary fallbackTitle="Erreur - Mes prêts"><MyPrets /></ErrorBoundary>} />
          <Route path="/my-presences" element={<ErrorBoundary fallbackTitle="Erreur - Mes présences"><MyPresences /></ErrorBoundary>} />
          <Route path="/my-aides" element={<ErrorBoundary fallbackTitle="Erreur - Mes aides"><MyAides /></ErrorBoundary>} />
          
          {/* ==================== ADMIN ROUTES - FINANCE ==================== */}
          <Route path="/admin/donations" element={<PermissionRoute resource="donations" permission="read"><ErrorBoundary fallbackTitle="Erreur - Donations"><DonationsAdmin /></ErrorBoundary></PermissionRoute>} />
          <Route path="/admin/donations/mobile-money" element={<PermissionRoute resource="donations" permission="read"><ErrorBoundary fallbackTitle="Erreur - Mobile Money"><MobileMoneyAdmin /></ErrorBoundary></PermissionRoute>} />
          <Route path="/admin/adhesions" element={<PermissionRoute resource="adhesions" permission="read"><ErrorBoundary fallbackTitle="Erreur - Adhésions"><AdhesionsAdmin /></ErrorBoundary></PermissionRoute>} />
          <Route path="/admin/payment-config" element={<PermissionRoute resource="config" permission="write"><ErrorBoundary fallbackTitle="Erreur - Config paiement"><PaymentConfigAdmin /></ErrorBoundary></PermissionRoute>} />
          <Route path="/admin/membres" element={<PermissionRoute resource="membres" permission="read"><ErrorBoundary fallbackTitle="Erreur - Membres"><MembresAdmin /></ErrorBoundary></PermissionRoute>} />
          <Route path="/admin/roles" element={<PermissionRoute resource="roles" permission="write"><ErrorBoundary fallbackTitle="Erreur - Rôles"><RolesAdmin /></ErrorBoundary></PermissionRoute>} />
          <Route path="/admin/utilisateurs" element={<PermissionRoute resource="roles" permission="write"><ErrorBoundary fallbackTitle="Erreur - Utilisateurs"><UtilisateursAdmin /></ErrorBoundary></PermissionRoute>} />
          <Route path="/admin/permissions" element={<PermissionRoute resource="configuration" permission="read"><ErrorBoundary fallbackTitle="Erreur - Permissions"><PermissionsAdmin /></ErrorBoundary></PermissionRoute>} />
          <Route path="/admin/stats" element={<PermissionRoute resource="stats" permission="read"><ErrorBoundary fallbackTitle="Erreur - Statistiques"><StatsAdmin /></ErrorBoundary></PermissionRoute>} />
          
          {/* ==================== ROUTES TONTINE ==================== */}
          <Route path="/admin/tontine/epargnes" element={<PermissionRoute resource="epargnes" permission="read"><ErrorBoundary fallbackTitle="Erreur - Épargnes"><Epargnes /></ErrorBoundary></PermissionRoute>} />
          <Route path="/admin/tontine/beneficiaires" element={<PermissionRoute resource="epargnes" permission="read"><ErrorBoundary fallbackTitle="Erreur - Bénéficiaires"><Beneficiaires /></ErrorBoundary></PermissionRoute>} />
          <Route path="/admin/caisse" element={<PermissionRoute resource="caisse" permission="read"><ErrorBoundary fallbackTitle="Erreur - Caisse"><CaisseAdmin /></ErrorBoundary></PermissionRoute>} />
          <Route path="/admin/tontine/config" element={<PermissionRoute resource="config" permission="write"><ErrorBoundary fallbackTitle="Erreur - Config Tontine"><TontineConfig /></ErrorBoundary></PermissionRoute>} />
          
          {/* ==================== ROUTES RÉUNIONS ==================== */}
          <Route path="/admin/reunions" element={<PermissionRoute resource="reunions" permission="read"><ErrorBoundary fallbackTitle="Erreur - Réunions"><Reunions /></ErrorBoundary></PermissionRoute>} />
          <Route path="/admin/presences" element={<PermissionRoute resource="presences" permission="read"><ErrorBoundary fallbackTitle="Erreur - Présences"><GestionPresences /></ErrorBoundary></PermissionRoute>} />
          
          {/* ==================== ROUTES SPORT ==================== */}
          <Route path="/admin/sport" element={<PermissionRoute resource="sport_e2d" permission="read"><ErrorBoundary fallbackTitle="Erreur - Sport"><Sport /></ErrorBoundary></PermissionRoute>} />
          <Route path="/admin/sport/e2d" element={<PermissionRoute resource="sport_e2d" permission="read"><ErrorBoundary fallbackTitle="Erreur - Sport E2D"><SportE2D /></ErrorBoundary></PermissionRoute>} />
          <Route path="/admin/sport/phoenix" element={<PermissionRoute resource="sport_phoenix" permission="read"><ErrorBoundary fallbackTitle="Erreur - Sport Phoenix"><SportPhoenix /></ErrorBoundary></PermissionRoute>} />
          <Route path="/admin/sport/equipes" element={<PermissionRoute resource="sport_phoenix" permission="read"><ErrorBoundary fallbackTitle="Erreur - Équipes"><SportEquipes /></ErrorBoundary></PermissionRoute>} />
          <Route path="/admin/sport/entrainements" element={<PermissionRoute resource="sport_phoenix" permission="read"><ErrorBoundary fallbackTitle="Erreur - Entraînements"><SportEntrainements /></ErrorBoundary></PermissionRoute>} />
          <Route path="/admin/sport/sanctions" element={<PermissionRoute resource="sport_phoenix" permission="read"><ErrorBoundary fallbackTitle="Erreur - Sanctions Sport"><SportSanctions /></ErrorBoundary></PermissionRoute>} />
          <Route path="/admin/sport/match-gala" element={<PermissionRoute resource="sport_phoenix" permission="read"><ErrorBoundary fallbackTitle="Erreur - Match Gala"><MatchGalaConfig /></ErrorBoundary></PermissionRoute>} />
          
          {/* ==================== ROUTES FINANCES AVANCÉES ==================== */}
          <Route path="/admin/finances/prets" element={<PermissionRoute resource="prets" permission="read"><ErrorBoundary fallbackTitle="Erreur - Prêts"><PretsAdmin /></ErrorBoundary></PermissionRoute>} />
          <Route path="/admin/finances/prets/config" element={<PermissionRoute resource="config" permission="write"><ErrorBoundary fallbackTitle="Erreur - Config Prêts"><PretsConfigAdmin /></ErrorBoundary></PermissionRoute>} />
          <Route path="/admin/finances/aides" element={<PermissionRoute resource="aides" permission="read"><ErrorBoundary fallbackTitle="Erreur - Aides"><AidesAdmin /></ErrorBoundary></PermissionRoute>} />
          
          {/* ==================== ROUTES COMMUNICATION ==================== */}
          <Route path="/admin/communication/notifications" element={<PermissionRoute resource="notifications" permission="read"><ErrorBoundary fallbackTitle="Erreur - Notifications"><NotificationsAdmin /></ErrorBoundary></PermissionRoute>} />
          <Route path="/admin/communication/notifications-templates" element={<PermissionRoute resource="notifications" permission="write"><ErrorBoundary fallbackTitle="Erreur - Templates"><NotificationsTemplatesAdmin /></ErrorBoundary></PermissionRoute>} />
          
          {/* ==================== ROUTES CONFIGURATION ==================== */}
          <Route path="/admin/config/exports" element={<PermissionRoute resource="config" permission="write"><ErrorBoundary fallbackTitle="Erreur - Exports"><ExportsAdmin /></ErrorBoundary></PermissionRoute>} />
          <Route path="/admin/rapports" element={<PermissionRoute resource="stats" permission="read"><ErrorBoundary fallbackTitle="Erreur - Rapports"><RapportsAdmin /></ErrorBoundary></PermissionRoute>} />
          <Route path="/admin/e2d-config" element={<PermissionRoute resource="config" permission="write"><ErrorBoundary fallbackTitle="Erreur - Config E2D"><E2DConfigAdmin /></ErrorBoundary></PermissionRoute>} />
          
          {/* ==================== ROUTES CMS SITE WEB ==================== */}
          <Route path="/admin/site/hero" element={<PermissionRoute resource="site" permission="write"><ErrorBoundary fallbackTitle="Erreur - Hero"><HeroAdmin /></ErrorBoundary></PermissionRoute>} />
          <Route path="/admin/site/activities" element={<PermissionRoute resource="site" permission="write"><ErrorBoundary fallbackTitle="Erreur - Activités"><ActivitiesAdmin /></ErrorBoundary></PermissionRoute>} />
          <Route path="/admin/site/events" element={<PermissionRoute resource="site" permission="write"><ErrorBoundary fallbackTitle="Erreur - Événements"><EventsAdmin /></ErrorBoundary></PermissionRoute>} />
          <Route path="/admin/site/gallery" element={<PermissionRoute resource="site" permission="write"><ErrorBoundary fallbackTitle="Erreur - Galerie"><GalleryAdmin /></ErrorBoundary></PermissionRoute>} />
          <Route path="/admin/site/partners" element={<PermissionRoute resource="site" permission="write"><ErrorBoundary fallbackTitle="Erreur - Partenaires"><PartnersAdmin /></ErrorBoundary></PermissionRoute>} />
          <Route path="/admin/site/config" element={<PermissionRoute resource="site" permission="write"><ErrorBoundary fallbackTitle="Erreur - Config Site"><ConfigAdmin /></ErrorBoundary></PermissionRoute>} />
          <Route path="/admin/site/about" element={<PermissionRoute resource="site" permission="write"><ErrorBoundary fallbackTitle="Erreur - À propos"><AboutAdmin /></ErrorBoundary></PermissionRoute>} />
          <Route path="/admin/site/messages" element={<PermissionRoute resource="site" permission="write"><ErrorBoundary fallbackTitle="Erreur - Messages"><MessagesAdmin /></ErrorBoundary></PermissionRoute>} />
          <Route path="/admin/site/images" element={<PermissionRoute resource="site" permission="write"><ErrorBoundary fallbackTitle="Erreur - Images"><ImagesAdmin /></ErrorBoundary></PermissionRoute>} />
        </Routes>
      </Suspense>
    </DashboardLayout>
  );
};

export default Dashboard;
