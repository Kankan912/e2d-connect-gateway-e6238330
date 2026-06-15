import { createContext, useCallback, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useSessionManager } from '@/hooks/useSessionManager';
import { SessionWarningModal } from '@/components/SessionWarningModal';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';

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
  must_change_password?: boolean;
  password_changed?: boolean;
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
  permissions: Permission[];
  loading: boolean;
  mustChangePassword: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [memberBlocked, setMemberBlocked] = useState(false);
  const loadedUserIdRef = useRef<string | null>(null);
  const loadingUserIdRef = useRef<string | null>(null);

  const withTimeout = async <T,>(promise: Promise<T>, label: string, timeoutMs = 8000): Promise<T> => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new Error(`${label} timeout after ${timeoutMs}ms`)), timeoutMs);
    });

    try {
      return await Promise.race([promise, timeout]);
    } finally {
      if (timer) clearTimeout(timer);
    }
  };

  // Fetch user permissions
  const fetchUserPermissions = async (userId: string): Promise<Permission[]> => {
    try {
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('role_id')
        .eq('user_id', userId);
      
      if (rolesError) throw rolesError;
      if (!userRoles?.length) return [];
      
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
    } catch (error: unknown) {
      logger.error('[AuthContext] Error fetching permissions:', error);
      return [];
    }
  };

  // Check member status - returns { allowed: boolean, status: string | null }
  const checkMemberStatus = async (userId: string): Promise<{ allowed: boolean; status: string | null }> => {
    try {
      const { data: membre, error } = await supabase
        .from('membres')
        .select('statut')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (error) {
        logger.error('[AuthContext] Error checking member status:', error);
        return { allowed: true, status: null }; // Allow access if we can't check
      }
      
      if (!membre) {
        // No member linked, allow access (new user)
        return { allowed: true, status: null };
      }
      
      if (membre.statut !== 'actif') {
        logger.info('[AuthContext] Member status is not active: ' + membre.statut);
        
        // Log blocked login attempt
        try {
          await supabase.from('historique_connexion').insert({
            user_id: userId,
            statut: 'bloque',
            ip_address: '0.0.0.0'
          });
        } catch (logError) {
          logger.error('[AuthContext] Failed to log blocked attempt:', logError);
        }
        
        return { allowed: false, status: membre.statut };
      }
      
      return { allowed: true, status: membre.statut };
    } catch (error: unknown) {
      logger.error('[AuthContext] Error in checkMemberStatus:', error);
      return { allowed: true, status: null };
    }
  };

  useEffect(() => {
    let isSigningOut = false;

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        // Handle expired/invalid refresh token gracefully
        if (event === 'TOKEN_REFRESHED' && !session) {
          if (!isSigningOut) {
            isSigningOut = true;
            logger.info('[AuthContext] Token refresh failed — signing out');
            setTimeout(() => {
              signOut();
              toast({
                title: "Session expirée",
                description: "Votre session a expiré. Veuillez vous reconnecter.",
                variant: "default"
              });
            }, 0);
          }
          return;
        }

        if (event === 'SIGNED_OUT') {
          isSigningOut = false;
          loadedUserIdRef.current = null;
          setSession(null);
          setUser(null);
          setProfile(null);
          setUserRole(null);
          setPermissions([]);
          setMustChangePassword(false);
          setMemberBlocked(false);
          setLoading(false);
          return;
        }

        setSession(session);
        setUser(session?.user ?? null);

        // Only refetch profile when the user actually changes.
        // TOKEN_REFRESHED / USER_UPDATED keep the same user id → skip the cascade.
        if (session?.user) {
          if (loadedUserIdRef.current !== session.user.id && loadingUserIdRef.current !== session.user.id) {
            loadingUserIdRef.current = session.user.id;
            setTimeout(() => {
              fetchUserProfile(session.user.id);
            }, 0);
          }
        } else {
          loadedUserIdRef.current = null;
          setProfile(null);
          setUserRole(null);
          setPermissions([]);
          setMustChangePassword(false);
          setMemberBlocked(false);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        if (loadedUserIdRef.current !== session.user.id && loadingUserIdRef.current !== session.user.id) {
          loadingUserIdRef.current = session.user.id;
          setTimeout(() => {
            fetchUserProfile(session.user.id);
          }, 0);
        }
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      logger.info('[AuthContext] Fetching profile for user: ' + userId);

      // Check member status first
      const { allowed, status } = await withTimeout(checkMemberStatus(userId), 'checkMemberStatus');
      if (!allowed) {
        setMemberBlocked(true);

        const statusMessages: Record<string, { title: string; description: string }> = {
          inactif: {
            title: "Compte inactif",
            description: "Votre compte est actuellement inactif. Contactez l'association pour le réactiver."
          },
          suspendu: {
            title: "Compte suspendu",
            description: "Votre compte a été suspendu. Veuillez contacter l'administrateur pour plus d'informations."
          }
        };

        const message = statusMessages[status || ''] || {
          title: "Accès refusé",
          description: "Votre compte ne vous permet pas d'accéder à l'application. Contactez l'administrateur."
        };

        toast({
          title: message.title,
          description: message.description,
          variant: "destructive"
        });
        setLoading(false);
        await signOut();
        return;
      }

      // Parallelize profile + role + permissions for a single network round-trip
      const [profileRes, roleRes, userPerms] = await withTimeout(
        Promise.all([
          supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .maybeSingle(),
          supabase
            .from('user_roles')
            .select('role_id, roles(name)')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle(),
          fetchUserPermissions(userId),
        ]),
        'fetchUserProfile'
      );

      if (profileRes.error) throw profileRes.error;
      if (roleRes.error) {
        logger.error('[AuthContext] Role fetch error:', roleRes.error);
        throw roleRes.error;
      }

      const profileData = profileRes.data;
      const roleData = roleRes.data;

      logger.success('[AuthContext] Profile loaded: ' + profileData?.nom + ' ' + profileData?.prenom);
      setProfile(profileData);

      if (profileData?.must_change_password === true) {
        logger.info('[AuthContext] User must change password');
        setMustChangePassword(true);
      } else {
        setMustChangePassword(false);
      }

      logger.success('[AuthContext] Role data received: ' + roleData?.roles?.name);
      setUserRole(roleData?.roles?.name || null);

      setPermissions(userPerms);
      loadedUserIdRef.current = userId;
      logger.success('[AuthContext] Permissions loaded: ' + userPerms.length);
    } catch (error: unknown) {
      logger.error('[AuthContext] Error fetching user data:', error);
      loadedUserIdRef.current = null;
    } finally {
      if (loadingUserIdRef.current === userId) {
        loadingUserIdRef.current = null;
      }
      setLoading(false);
    }
  };


  const signOut = useCallback(async () => {
    // Purger toutes les clés de début de session pour éviter de restaurer
    // une session précédente déjà expirée lors de la prochaine connexion.
    try {
      const keys = Object.keys(localStorage).filter(k => k.startsWith('lovable_session_start'));
      keys.forEach(k => localStorage.removeItem(k));
    } catch (e) {
      logger.error('[AuthContext] Failed to clear session storage:', e);
    }
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setUserRole(null);
    setPermissions([]);
    setMustChangePassword(false);
    setMemberBlocked(false);
  }, []);

  // Session manager integration
  const sessionManager = useSessionManager({
    session,
    userRole,
    permissions,
    onLogout: async () => {
      const reason = sessionManager.logoutReason;
      await signOut();
      
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
    <AuthContext.Provider value={{ user, session, profile, userRole, permissions, loading, mustChangePassword, signOut }}>
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
