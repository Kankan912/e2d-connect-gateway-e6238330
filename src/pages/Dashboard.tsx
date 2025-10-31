import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, LogOut, User, Shield } from "lucide-react";
import { toast } from "sonner";
import logoE2D from "@/assets/logo-e2d.png";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, profile, userRole, loading, signOut } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/portal");
    }
  }, [user, loading, navigate]);

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success("Déconnexion réussie");
      navigate("/");
    } catch (error) {
      toast.error("Erreur lors de la déconnexion");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !profile) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <img src={logoE2D} alt="Logo E2D" className="h-12 w-auto" />
            <div>
              <h1 className="text-2xl font-bold text-foreground">E2D Connect</h1>
              <p className="text-sm text-muted-foreground">Portail Membre</p>
            </div>
          </div>
          <Button variant="outline" onClick={handleSignOut}>
            <LogOut className="w-4 h-4 mr-2" />
            Déconnexion
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
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
                <p className="font-medium">{profile.prenom} {profile.nom}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{user.email}</p>
              </div>
              {profile.telephone && (
                <div>
                  <p className="text-sm text-muted-foreground">Téléphone</p>
                  <p className="font-medium">{profile.telephone}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-muted-foreground">Statut</p>
                <p className="font-medium capitalize">{profile.statut}</p>
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
              {profile.est_membre_e2d && (
                <p className="mt-4 text-sm text-muted-foreground">
                  Membre E2D
                </p>
              )}
              {profile.est_adherent_phoenix && (
                <p className="text-sm text-muted-foreground">
                  Adhérent Phoenix
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Bienvenue !</CardTitle>
              <CardDescription>Tableau de bord en construction</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Le portail E2D Connect est en cours de développement. De nouvelles fonctionnalités seront bientôt disponibles.
              </p>
              <Button className="mt-4 w-full" onClick={() => navigate("/")}>
                Retour au site
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
