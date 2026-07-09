import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

interface SuperAdminRouteProps {
  children: ReactNode;
  fallback?: string;
}

/**
 * Restreint l'accès aux utilisateurs plateforme (super_admin uniquement).
 * Utilisé pour la console d'administration multi-tenant.
 */
export const SuperAdminRoute = ({ children, fallback = "/dashboard" }: SuperAdminRouteProps) => {
  const { user, userRole, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || userRole !== "super_admin") {
    return <Navigate to={fallback} replace />;
  }

  return <>{children}</>;
};
