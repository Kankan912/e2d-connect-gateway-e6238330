import { useEffect } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { AdminRoute } from "@/components/auth/AdminRoute";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, User, Shield } from "lucide-react";
import DonationsAdmin from "./admin/DonationsAdmin";

const DashboardHome = () => {
  const navigate = useNavigate();
  const { user, profile, userRole } = useAuth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Bienvenue, {profile?.prenom} !</h1>
        <p className="text-muted-foreground mt-1">Votre espace personnel E2D</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="w-5 h-5 mr-2 text-primary" />
              Profil
            </CardTitle>
            <CardDescription>Vos informations personnelles</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <p className="text-sm text-muted-foreground">Nom complet</p>
              <p className="font-medium">{profile?.prenom} {profile?.nom}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium">{user?.email}</p>
            </div>
            {profile?.telephone && (
              <div>
                <p className="text-sm text-muted-foreground">Téléphone</p>
                <p className="font-medium">{profile.telephone}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-muted-foreground">Statut</p>
              <p className="font-medium capitalize">{profile?.statut}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Shield className="w-5 h-5 mr-2 text-primary" />
              Rôle
            </CardTitle>
            <CardDescription>Votre niveau d'accès</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <div className="px-3 py-1 rounded-full bg-primary/10 text-primary font-medium capitalize">
                {userRole || 'Membre'}
              </div>
            </div>
            {profile?.est_membre_e2d && (
              <p className="mt-4 text-sm text-muted-foreground">Membre E2D</p>
            )}
            {profile?.est_adherent_phoenix && (
              <p className="text-sm text-muted-foreground">Adhérent Phoenix</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Bienvenue !</CardTitle>
            <CardDescription>Votre portail membre</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Accédez à toutes les fonctionnalités de votre espace membre via le menu de gauche.
            </p>
            <Button className="w-full" onClick={() => navigate("/")}>
              Retour au site
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/portal");
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
        <Route path="/" element={<DashboardHome />} />
        <Route path="/profile" element={<div>Profil (à venir)</div>} />
        <Route path="/my-donations" element={<div>Mes Dons (à venir)</div>} />
        <Route path="/my-cotisations" element={<div>Mes Cotisations (à venir)</div>} />
        
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
              <div>Gestion Adhésions (à venir)</div>
            </AdminRoute>
          }
        />
        <Route
          path="/admin/payment-config"
          element={
            <AdminRoute>
              <div>Configuration Paiements (à venir)</div>
            </AdminRoute>
          }
        />
        <Route
          path="/admin/membres"
          element={
            <AdminRoute allowedRoles={["admin"]}>
              <div>Gestion Membres (à venir)</div>
            </AdminRoute>
          }
        />
        <Route
          path="/admin/stats"
          element={
            <AdminRoute>
              <div>Statistiques (à venir)</div>
            </AdminRoute>
          }
        />
      </Routes>
    </DashboardLayout>
  );
};

export default Dashboard;
