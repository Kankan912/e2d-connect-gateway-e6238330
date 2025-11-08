import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const usePermissions = () => {
  const { user } = useAuth();

  const { data: permissions, isLoading } = useQuery({
    queryKey: ['user-permissions', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      // Récupérer les rôles de l'utilisateur
      const { data: userRoles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);
      
      if (!userRoles?.length) return [];
      
      // Récupérer les permissions pour ces rôles via la table roles
      const { data: roleIds } = await supabase
        .from('roles')
        .select('id')
        .in('name', userRoles.map(r => r.role));
      
      if (!roleIds?.length) return [];
      
      // Récupérer toutes les permissions accordées
      const { data: rolePermissions } = await supabase
        .from('role_permissions')
        .select('*')
        .in('role_id', roleIds.map(r => r.id))
        .eq('granted', true);
      
      return rolePermissions || [];
    },
    enabled: !!user?.id,
  });

  const hasPermission = (resource: string, permission: string) => {
    if (!permissions) return false;
    return permissions.some(
      p => p.resource === resource && p.permission === permission
    );
  };

  const hasAnyPermission = (checks: Array<{resource: string; permission: string}>) => {
    return checks.some(check => hasPermission(check.resource, check.permission));
  };

  const canAccessResource = (resource: string) => {
    if (!permissions) return false;
    return permissions.some(p => p.resource === resource && p.granted);
  };

  return { 
    permissions, 
    hasPermission, 
    hasAnyPermission, 
    canAccessResource,
    isLoading 
  };
};
