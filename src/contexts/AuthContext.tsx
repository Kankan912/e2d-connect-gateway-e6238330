import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { useSessionManager } from '@/hooks/useSessionManager';
import { SessionWarningModal } from '@/components/SessionWarningModal';
import { useToast } from '@/hooks/use-toast';

interface Profile {
  id: string;
  nom: string;
  prenom: string;
  telephone?: string;
  photo_url?: string;
  date_inscription?: string;
  est_membre_e2d: boolean;
  est_adherent_phoenix: boolean;
  statut: string;
}

interface Permission {
  resource: string;
  permission: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  userRole: string | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch user permissions - utilise deux requêtes séparées car la FK role_permissions→roles n'existe pas encore
  const fetchUserPermissions = async (userId: string): Promise<Permission[]> => {
    try {
      // 1. Récupérer les role_ids de l'utilisateur
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('role_id')
        .eq('user_id', userId);
      
      if (rolesError) throw rolesError;
      if (!userRoles?.length) return [];
      
      // 2. Récupérer les permissions pour ces rôles
      const roleIds = userRoles.map(r => r.role_id).filter(Boolean);
      if (!roleIds.length) return [];

      const { data: rolePerms, error: permsError } = await supabase
        .from('role_permissions')
        .select('resource, permission')
        .in('role_id', roleIds)
        .eq('granted', true);
      
      if (permsError) throw permsError;
      
      return (rolePerms || []).map(rp => ({
        resource: rp.resource,
        permission: rp.permission
      }));
    } catch (error) {
      console.error('❌ [AuthContext] Error fetching permissions:', error);
      return [];
    }
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Defer profile fetching with setTimeout
        if (session?.user) {
          setTimeout(() => {
            fetchUserProfile(session.user.id);
          }, 0);
        } else {
          setProfile(null);
          setUserRole(null);
          setPermissions([]);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        setTimeout(() => {
          fetchUserProfile(session.user.id);
        }, 0);
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      console.log('🔍 [AuthContext] Fetching profile for user:', userId);
      
      // Invalider le cache des permissions pour forcer un rafraîchissement
      queryClient.invalidateQueries({ 
        queryKey: ['user-permissions', userId] 
      });

      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (profileError) throw profileError;
      console.log('✅ [AuthContext] Profile loaded:', profileData?.nom, profileData?.prenom);
      setProfile(profileData);

      // Fetch role (avec jointure sur la table roles) - Syntaxe corrigée
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role_id, roles(name)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (roleError) {
        console.error('❌ [AuthContext] Role fetch error:', roleError);
        throw roleError;
      }
      
      console.log('✅ [AuthContext] Role data received:', roleData);
      console.log('✅ [AuthContext] Role name extracted:', roleData?.roles?.name);
      
      setUserRole(roleData?.roles?.name || null);

      // Fetch permissions for session manager
      const userPerms = await fetchUserPermissions(userId);
      setPermissions(userPerms);
      console.log('✅ [AuthContext] Permissions loaded:', userPerms.length);

    } catch (error) {
      console.error('❌ [AuthContext] Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setUserRole(null);
    setPermissions([]);
  };

  // Session manager integration
  const sessionManager = useSessionManager({
    session,
    userRole,
    permissions,
    onLogout: async () => {
      const reason = sessionManager.logoutReason;
      await signOut();
      
      // Afficher un toast explicatif
      toast({
        title: reason === 'inactivity' 
          ? 'Session expirée pour inactivité' 
          : 'Durée maximale de session atteinte',
        description: 'Veuillez vous reconnecter pour continuer.',
        variant: 'default'
      });
    },
    enabled: !!session && !loading
  });

  return (
    <AuthContext.Provider value={{ user, session, profile, userRole, loading, signOut }}>
      {children}
      
      {/* Modal d'avertissement de session */}
      <SessionWarningModal
        open={sessionManager.showWarning}
        secondsLeft={sessionManager.warningSecondsLeft}
        reason={sessionManager.logoutReason}
        onExtend={sessionManager.extendSession}
        onLogout={sessionManager.logoutNow}
      />
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
