import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User, Heart, Receipt, Settings } from "lucide-react";

const DashboardHome = () => {
  const navigate = useNavigate();
  const { profile, userRole } = useAuth();

  const quickActions = [
    {
      title: "Mon Profil",
      description: "Gérer mes informations personnelles",
      icon: User,
      href: "/dashboard/profile",
      color: "text-blue-500",
    },
    {
      title: "Mes Dons",
      description: "Consulter l'historique de mes dons",
      icon: Heart,
      href: "/dashboard/my-donations",
      color: "text-red-500",
    },
    {
      title: "Mes Cotisations",
      description: "Voir mes cotisations et paiements",
      icon: Receipt,
      href: "/dashboard/my-cotisations",
      color: "text-green-500",
    },
  ];

  const isAdmin = userRole === "admin" || userRole === "tresorier";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          Bienvenue, {profile?.prenom} {profile?.nom} !
        </h1>
        <p className="text-muted-foreground mt-2">
          Votre tableau de bord E2D Connect
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rôle</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">{userRole || "Membre"}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Votre niveau d'accès actuel
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Statut</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Actif</div>
            <p className="text-xs text-muted-foreground mt-1">
              Votre compte est actif
            </p>
          </CardContent>
        </Card>

        {profile?.telephone && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Contact</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-semibold">{profile.telephone}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Votre numéro de téléphone
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      <div>
        <h2 className="text-2xl font-semibold mb-4">Actions rapides</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {quickActions.map((action) => (
            <Card
              key={action.href}
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => navigate(action.href)}
            >
              <CardHeader>
                <div className="flex items-center gap-3">
                  <action.icon className={`h-8 w-8 ${action.color}`} />
                  <div>
                    <CardTitle className="text-lg">{action.title}</CardTitle>
                    <CardDescription className="text-sm">
                      {action.description}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>

      {isAdmin && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle>Accès Administrateur</CardTitle>
            <CardDescription>
              Vous avez accès aux fonctionnalités d'administration
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate("/dashboard/admin/donations")}>
              Accéder à l'administration
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DashboardHome;
