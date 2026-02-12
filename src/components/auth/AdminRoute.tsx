import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

interface AdminRouteProps {
  children: ReactNode;
  allowedRoles?: string[];
}

export const AdminRoute = ({ children, allowedRoles = ["administrateur", "tresorier", "super_admin", "secretaire_general"] }: AdminRouteProps) => {
  const { userRole, loading } = useAuth();

  // Mapper les anciens noms de rôles vers les nouveaux (pour compatibilité)
  const roleMapping: Record<string, string> = {
    'admin': 'administrateur',
    'secretaire': 'secretaire_general',
    'membre': 'membre_actif',
  };

  // Normaliser les rôles autorisés
  const normalizedRoles = allowedRoles.map(role => roleMapping[role] || role);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!userRole || !normalizedRoles.includes(userRole)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};
