import { useEffect, lazy, Suspense } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PermissionRoute } from "@/components/auth/PermissionRoute";
import { Loader2 } from "lucide-react";

// Dashboard Pages
import DashboardHome from "./dashboard/DashboardHome";
import Profile from "./dashboard/Profile";
import MyDonations from "./dashboard/MyDonations";
import MyCotisations from "./dashboard/MyCotisations";

// Admin Pages
import DonationsAdmin from "./admin/DonationsAdmin";
import RolesAdmin from "./admin/RolesAdmin";
import PermissionsAdmin from "./admin/PermissionsAdmin";
import HeroAdmin from "./admin/site/HeroAdmin";
import ActivitiesAdmin from "./admin/site/ActivitiesAdmin";
import EventsAdmin from "./admin/site/EventsAdmin";
import GalleryAdmin from "./admin/site/GalleryAdmin";
import PartnersAdmin from "./admin/site/PartnersAdmin";
import ConfigAdmin from "./admin/site/ConfigAdmin";

// Pages originales restaurées depuis GitHub
import Reunions from "./Reunions";
import Epargnes from "./Epargnes";
import GestionPresences from "./GestionPresences";
import Sport from "./Sport";
import SportE2D from "./SportE2D";
import SportPhoenix from "./SportPhoenix";

// Lazy loaded pages
const Beneficiaires = lazy(() => import("./admin/Beneficiaires"));
const TontineConfig = lazy(() => import("./admin/TontineConfig"));
const MembresAdmin = lazy(() => import("./admin/MembresAdmin"));
const AdhesionsAdmin = lazy(() => import("./admin/AdhesionsAdmin"));
const PaymentConfigAdmin = lazy(() => import("./admin/PaymentConfigAdmin"));
const StatsAdmin = lazy(() => import("./admin/StatsAdmin"));
const SportEntrainements = lazy(() => import("./admin/SportEntrainements"));
const SportSanctions = lazy(() => import("./admin/SportSanctions"));
const PretsAdmin = lazy(() => import("./admin/PretsAdmin"));
const NotificationsAdmin = lazy(() => import("./admin/NotificationsAdmin"));
const ExportsAdmin = lazy(() => import("./admin/ExportsAdmin"));
const MatchGalaConfig = lazy(() => import("./admin/MatchGalaConfig"));
const SportEquipes = lazy(() => import("./SportEquipes"));

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <DashboardLayout>
      <Routes>
        {/* Member Routes */}
        <Route path="/" element={<DashboardHome />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/my-donations" element={<MyDonations />} />
        <Route path="/my-cotisations" element={<MyCotisations />} />
        
        {/* Admin Routes - Finance */}
        <Route
          path="/admin/donations"
          element={
            <PermissionRoute resource="donations" permission="read">
              <DonationsAdmin />
            </PermissionRoute>
          }
        />
        <Route
          path="/admin/adhesions"
          element={
            <PermissionRoute resource="adhesions" permission="read">
              <Suspense fallback={<div className="flex items-center justify-center p-8"><Loader2 className="w-8 h-8 animate-spin" /></div>}>
                <AdhesionsAdmin />
              </Suspense>
            </PermissionRoute>
          }
        />
        <Route
          path="/admin/payment-config"
          element={
            <PermissionRoute resource="config" permission="write">
              <Suspense fallback={<div className="flex items-center justify-center p-8"><Loader2 className="w-8 h-8 animate-spin" /></div>}>
                <PaymentConfigAdmin />
              </Suspense>
            </PermissionRoute>
          }
        />
        <Route
          path="/admin/membres"
          element={
            <PermissionRoute resource="membres" permission="read">
              <Suspense fallback={<div className="flex items-center justify-center p-8"><Loader2 className="w-8 h-8 animate-spin" /></div>}>
                <MembresAdmin />
              </Suspense>
            </PermissionRoute>
          }
        />
        <Route
          path="/admin/roles"
          element={
            <PermissionRoute resource="roles" permission="write">
              <RolesAdmin />
            </PermissionRoute>
          }
        />
        <Route
          path="/admin/permissions"
          element={
            <PermissionRoute resource="configuration" permission="read">
              <PermissionsAdmin />
            </PermissionRoute>
          }
        />
        <Route
          path="/admin/stats"
          element={
            <PermissionRoute resource="stats" permission="read">
              <Suspense fallback={<div className="flex items-center justify-center p-8"><Loader2 className="w-8 h-8 animate-spin" /></div>}>
                <StatsAdmin />
              </Suspense>
            </PermissionRoute>
          }
        />
        
        {/* Routes Tontine */}
        <Route
          path="/admin/tontine/epargnes"
          element={
            <PermissionRoute resource="epargnes" permission="read">
              <Epargnes />
            </PermissionRoute>
          }
        />
        <Route
          path="/admin/tontine/beneficiaires"
          element={
            <PermissionRoute resource="epargnes" permission="read">
              <Suspense fallback={<div className="flex items-center justify-center p-8"><Loader2 className="w-8 h-8 animate-spin" /></div>}>
                <Beneficiaires />
              </Suspense>
            </PermissionRoute>
          }
        />
        <Route
          path="/admin/tontine/config"
          element={
            <PermissionRoute resource="config" permission="write">
              <Suspense fallback={<div className="flex items-center justify-center p-8"><Loader2 className="w-8 h-8 animate-spin" /></div>}>
                <TontineConfig />
              </Suspense>
            </PermissionRoute>
          }
        />
        
        {/* Routes Réunions */}
        <Route
          path="/admin/reunions"
          element={
            <PermissionRoute resource="reunions" permission="read">
              <Reunions />
            </PermissionRoute>
          }
        />
        <Route
          path="/admin/presences"
          element={
            <PermissionRoute resource="presences" permission="read">
              <GestionPresences />
            </PermissionRoute>
          }
        />
        
        {/* Routes Sport */}
        <Route
          path="/admin/sport"
          element={
            <PermissionRoute resource="sport_e2d" permission="read">
              <Sport />
            </PermissionRoute>
          }
        />
        <Route
          path="/admin/sport/e2d"
          element={
            <PermissionRoute resource="sport_e2d" permission="read">
              <SportE2D />
            </PermissionRoute>
          }
        />
        <Route
          path="/admin/sport/phoenix"
          element={
            <PermissionRoute resource="sport_phoenix" permission="read">
              <SportPhoenix />
            </PermissionRoute>
          }
        />
        <Route
          path="/admin/sport/equipes"
          element={
            <PermissionRoute resource="sport_phoenix" permission="read">
              <Suspense fallback={<div className="flex items-center justify-center p-8"><Loader2 className="w-8 h-8 animate-spin" /></div>}>
                <SportEquipes />
              </Suspense>
            </PermissionRoute>
          }
        />
        <Route
          path="/admin/sport/entrainements"
          element={
            <PermissionRoute resource="sport_phoenix" permission="read">
              <Suspense fallback={<div className="flex items-center justify-center p-8"><Loader2 className="w-8 h-8 animate-spin" /></div>}>
                <SportEntrainements />
              </Suspense>
            </PermissionRoute>
          }
        />
        <Route
          path="/admin/sport/sanctions"
          element={
            <PermissionRoute resource="sport_phoenix" permission="read">
              <Suspense fallback={<div className="flex items-center justify-center p-8"><Loader2 className="w-8 h-8 animate-spin" /></div>}>
                <SportSanctions />
              </Suspense>
            </PermissionRoute>
          }
        />
        <Route
          path="/admin/sport/match-gala"
          element={
            <PermissionRoute resource="sport_phoenix" permission="read">
              <Suspense fallback={<div className="flex items-center justify-center p-8"><Loader2 className="w-8 h-8 animate-spin" /></div>}>
                <MatchGalaConfig />
              </Suspense>
            </PermissionRoute>
          }
        />
        
        {/* Routes Finances Avancées */}
        <Route
          path="/admin/finances/prets"
          element={
            <PermissionRoute resource="prets" permission="read">
              <Suspense fallback={<div className="flex items-center justify-center p-8"><Loader2 className="w-8 h-8 animate-spin" /></div>}>
                <PretsAdmin />
              </Suspense>
            </PermissionRoute>
          }
        />
        
        {/* Routes Communication */}
        <Route
          path="/admin/communication/notifications"
          element={
            <PermissionRoute resource="notifications" permission="read">
              <Suspense fallback={<div className="flex items-center justify-center p-8"><Loader2 className="w-8 h-8 animate-spin" /></div>}>
                <NotificationsAdmin />
              </Suspense>
            </PermissionRoute>
          }
        />
        
        {/* Routes Configuration */}
        <Route
          path="/admin/config/exports"
          element={
            <PermissionRoute resource="config" permission="write">
              <Suspense fallback={<div className="flex items-center justify-center p-8"><Loader2 className="w-8 h-8 animate-spin" /></div>}>
                <ExportsAdmin />
              </Suspense>
            </PermissionRoute>
          }
        />
        
        {/* Routes CMS Site Web */}
        <Route
          path="/admin/site/hero"
          element={
            <PermissionRoute resource="site" permission="write">
              <HeroAdmin />
            </PermissionRoute>
          }
        />
        <Route
          path="/admin/site/activities"
          element={
            <PermissionRoute resource="site" permission="write">
              <ActivitiesAdmin />
            </PermissionRoute>
          }
        />
        <Route
          path="/admin/site/events"
          element={
            <PermissionRoute resource="site" permission="write">
              <EventsAdmin />
            </PermissionRoute>
          }
        />
        <Route
          path="/admin/site/gallery"
          element={
            <PermissionRoute resource="site" permission="write">
              <GalleryAdmin />
            </PermissionRoute>
          }
        />
        <Route
          path="/admin/site/partners"
          element={
            <PermissionRoute resource="site" permission="write">
              <PartnersAdmin />
            </PermissionRoute>
          }
        />
        <Route
          path="/admin/site/config"
          element={
            <PermissionRoute resource="site" permission="write">
              <ConfigAdmin />
            </PermissionRoute>
          }
        />
      </Routes>
    </DashboardLayout>
  );
};

export default Dashboard;
