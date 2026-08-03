import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";
import AccesRefuse from "@/pages/AccesRefuse";

interface SuperAdminRouteProps {
  children: ReactNode;
}

/**
 * Restreint l'accès aux utilisateurs plateforme (super_admin uniquement).
 * Utilisé pour la console d'administration multi-tenant.
 */
export const SuperAdminRoute = ({ children }: SuperAdminRouteProps) => {
  const { user, userRole, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (userRole !== "super_admin") {
    return (
      <AccesRefuse message="Cette console est réservée aux super administrateurs de la plateforme." />
    );
  }

  return <>{children}</>;
};
