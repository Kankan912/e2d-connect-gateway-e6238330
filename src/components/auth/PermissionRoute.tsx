import { ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import { Loader2 } from "lucide-react";
import { Navigate } from "react-router-dom";
import AccesRefuse from "@/pages/AccesRefuse";

interface PermissionRouteProps {
  children: ReactNode;
  resource: string;
  permission: string;
  fallback?: string;
}

export const PermissionRoute = ({
  children,
  resource,
  permission,
}: PermissionRouteProps) => {
  const { user, loading: authLoading } = useAuth();
  const { hasPermission, isLoading: permLoading } = usePermissions();

  if (authLoading || permLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!hasPermission(resource, permission)) {
    return (
      <AccesRefuse
        message={`Vous ne disposez pas de l'autorisation « ${permission} » sur la ressource « ${resource} ».`}
      />
    );
  }

  return <>{children}</>;
};
