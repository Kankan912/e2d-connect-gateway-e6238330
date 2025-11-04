import { useEffect } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { AdminRoute } from "@/components/auth/AdminRoute";
import { Loader2 } from "lucide-react";

// Dashboard Pages
import DashboardHome from "./dashboard/DashboardHome";
import Profile from "./dashboard/Profile";
import MyDonations from "./dashboard/MyDonations";
import MyCotisations from "./dashboard/MyCotisations";

// Admin Pages
import DonationsAdmin from "./admin/DonationsAdmin";
import HeroAdmin from "./admin/site/HeroAdmin";
import ActivitiesAdmin from "./admin/site/ActivitiesAdmin";
import EventsAdmin from "./admin/site/EventsAdmin";
import GalleryAdmin from "./admin/site/GalleryAdmin";
import PartnersAdmin from "./admin/site/PartnersAdmin";
import ConfigAdmin from "./admin/site/ConfigAdmin";

// Tontine Pages
import EpargnesAdmin from "./admin/tontine/EpargnesAdmin";
import TontineConfigAdmin from "./admin/tontine/TontineConfigAdmin";

// Reunions Pages
import ReunionsAdmin from "./admin/reunions/ReunionsAdmin";
import PresencesAdmin from "./admin/reunions/PresencesAdmin";

// Sport Pages
import E2DMatchsAdmin from "./admin/sport/E2DMatchsAdmin";
import PhoenixConfigAdmin from "./admin/sport/PhoenixConfigAdmin";
import EntrainementsAdmin from "./admin/sport/EntrainementsAdmin";

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
            <AdminRoute>
              <DonationsAdmin />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/adhesions"
          element={
            <AdminRoute>
              <div className="p-6">
                <h1 className="text-2xl font-bold">Gestion des Adhésions</h1>
                <p className="text-muted-foreground mt-2">À venir...</p>
              </div>
            </AdminRoute>
          }
        />
        <Route
          path="/admin/payment-config"
          element={
            <AdminRoute>
              <div className="p-6">
                <h1 className="text-2xl font-bold">Configuration des Paiements</h1>
                <p className="text-muted-foreground mt-2">À venir...</p>
              </div>
            </AdminRoute>
          }
        />
        <Route
          path="/admin/membres"
          element={
            <AdminRoute allowedRoles={["admin"]}>
              <div className="p-6">
                <h1 className="text-2xl font-bold">Gestion des Membres</h1>
                <p className="text-muted-foreground mt-2">À venir...</p>
              </div>
            </AdminRoute>
          }
        />
        <Route
          path="/admin/stats"
          element={
            <AdminRoute>
              <div className="p-6">
                <h1 className="text-2xl font-bold">Statistiques</h1>
                <p className="text-muted-foreground mt-2">À venir...</p>
              </div>
            </AdminRoute>
          }
        />
        
        {/* Routes Tontine */}
        <Route
          path="/admin/tontine/epargnes"
          element={
            <AdminRoute allowedRoles={["admin", "tresorier"]}>
              <EpargnesAdmin />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/tontine/config"
          element={
            <AdminRoute allowedRoles={["admin", "tresorier"]}>
              <TontineConfigAdmin />
            </AdminRoute>
          }
        />
        
        {/* Routes Réunions */}
        <Route
          path="/admin/reunions"
          element={
            <AdminRoute allowedRoles={["admin", "secretaire_general"]}>
              <ReunionsAdmin />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/presences"
          element={
            <AdminRoute allowedRoles={["admin", "secretaire_general"]}>
              <PresencesAdmin />
            </AdminRoute>
          }
        />
        
        {/* Routes Sport */}
        <Route
          path="/admin/sport/e2d"
          element={
            <AdminRoute allowedRoles={["admin", "responsable_sportif"]}>
              <E2DMatchsAdmin />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/sport/phoenix"
          element={
            <AdminRoute allowedRoles={["admin", "responsable_sportif"]}>
              <PhoenixConfigAdmin />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/sport/entrainements"
          element={
            <AdminRoute allowedRoles={["admin", "responsable_sportif"]}>
              <EntrainementsAdmin />
            </AdminRoute>
          }
        />
        
        {/* Routes CMS Site Web */}
        <Route
          path="/admin/site/hero"
          element={
            <AdminRoute allowedRoles={["admin"]}>
              <HeroAdmin />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/site/activities"
          element={
            <AdminRoute allowedRoles={["admin"]}>
              <ActivitiesAdmin />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/site/events"
          element={
            <AdminRoute allowedRoles={["admin"]}>
              <EventsAdmin />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/site/gallery"
          element={
            <AdminRoute allowedRoles={["admin"]}>
              <GalleryAdmin />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/site/partners"
          element={
            <AdminRoute allowedRoles={["admin"]}>
              <PartnersAdmin />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/site/config"
          element={
            <AdminRoute allowedRoles={["admin"]}>
              <ConfigAdmin />
            </AdminRoute>
          }
        />
      </Routes>
    </DashboardLayout>
  );
};

export default Dashboard;
