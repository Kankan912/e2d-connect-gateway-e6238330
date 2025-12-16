import { useState, useEffect, useCallback, useRef } from 'react';
import { Session } from '@supabase/supabase-js';
import { useActivityTracker } from './useActivityTracker';
import { 
  SessionConfig, 
  SessionType, 
  Permission,
  getRoleSessionType, 
  fetchSessionConfig, 
  getDefaultSessionConfig,
  calculateRemainingTime 
} from '@/lib/session-utils';

interface UseSessionManagerProps {
  session: Session | null;
  userRole: string | null;
  permissions: Permission[];
  onLogout: () => Promise<void>;
  enabled?: boolean;
}

interface SessionManagerState {
  sessionConfig: SessionConfig | null;
  sessionType: SessionType;
  showWarning: boolean;
  warningSecondsLeft: number;
  logoutReason: 'inactivity' | 'session_expired' | null;
  isLoading: boolean;
}

export const useSessionManager = ({
  session,
  userRole,
  permissions,
  onLogout,
  enabled = true
}: UseSessionManagerProps) => {
  const [state, setState] = useState<SessionManagerState>({
    sessionConfig: null,
    sessionType: 'readonly',
    showWarning: false,
    warningSecondsLeft: 0,
    logoutReason: null,
    isLoading: true
  });

  const lastActivityRef = useRef<Date>(new Date());
  const sessionStartRef = useRef<Date | null>(null);
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const sessionTimerRef = useRef<NodeJS.Timeout | null>(null);
  const warningTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Déterminer le type de session
  const sessionType = getRoleSessionType(userRole, permissions);

  // Charger la configuration de session
  useEffect(() => {
    if (!session || !enabled) {
      setState(prev => ({ ...prev, isLoading: false }));
      return;
    }

    const loadConfig = async () => {
      console.log('🔐 [SessionManager] Loading config for type:', sessionType);
      const config = await fetchSessionConfig(sessionType);
      const finalConfig = config || getDefaultSessionConfig(sessionType);
      
      console.log('✅ [SessionManager] Config loaded:', finalConfig);
      
      setState(prev => ({
        ...prev,
        sessionConfig: finalConfig,
        sessionType,
        isLoading: false
      }));

      // Initialiser le début de session
      if (session.access_token) {
        sessionStartRef.current = new Date();
      }
    };

    loadConfig();
  }, [session, sessionType, enabled]);

  // Fonction pour déclencher la déconnexion
  const triggerLogout = useCallback(async (reason: 'inactivity' | 'session_expired') => {
    console.log('🚪 [SessionManager] Triggering logout:', reason);
    setState(prev => ({ ...prev, logoutReason: reason, showWarning: false }));
    
    // Nettoyer tous les timers
    if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    if (sessionTimerRef.current) clearTimeout(sessionTimerRef.current);
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    
    await onLogout();
  }, [onLogout]);

  // Afficher le warning avec countdown
  const showWarningModal = useCallback((reason: 'inactivity' | 'session_expired') => {
    const config = state.sessionConfig;
    if (!config) return;

    console.log('⚠️ [SessionManager] Showing warning modal:', reason);
    
    setState(prev => ({
      ...prev,
      showWarning: true,
      warningSecondsLeft: config.warning_before_logout_seconds,
      logoutReason: reason
    }));

    // Countdown
    countdownIntervalRef.current = setInterval(() => {
      setState(prev => {
        const newSeconds = prev.warningSecondsLeft - 1;
        if (newSeconds <= 0) {
          if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
          triggerLogout(reason);
          return { ...prev, warningSecondsLeft: 0 };
        }
        return { ...prev, warningSecondsLeft: newSeconds };
      });
    }, 1000);

    // Timer de déconnexion après le warning
    warningTimerRef.current = setTimeout(() => {
      triggerLogout(reason);
    }, config.warning_before_logout_seconds * 1000);
  }, [state.sessionConfig, triggerLogout]);

  // Réinitialiser le timer d'inactivité
  const resetInactivityTimer = useCallback(() => {
    const config = state.sessionConfig;
    if (!config || !enabled || !session) return;

    lastActivityRef.current = new Date();

    // Annuler le timer précédent
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }

    // Nouveau timer d'inactivité
    const timeoutMs = (config.inactivity_timeout_minutes * 60 - config.warning_before_logout_seconds) * 1000;
    
    inactivityTimerRef.current = setTimeout(() => {
      showWarningModal('inactivity');
    }, timeoutMs);
  }, [state.sessionConfig, enabled, session, showWarningModal]);

  // Tracker d'activité
  useActivityTracker({
    onActivity: resetInactivityTimer,
    enabled: enabled && !!session && !!state.sessionConfig && !state.showWarning
  });

  // Timer de durée maximale de session
  useEffect(() => {
    const config = state.sessionConfig;
    if (!config || !session || !enabled || !sessionStartRef.current) return;

    const remainingMinutes = calculateRemainingTime(
      sessionStartRef.current,
      config.session_duration_minutes
    );

    if (remainingMinutes <= 0) {
      triggerLogout('session_expired');
      return;
    }

    // Timer pour la fin de session
    const timeoutMs = (remainingMinutes * 60 - config.warning_before_logout_seconds) * 1000;
    
    sessionTimerRef.current = setTimeout(() => {
      showWarningModal('session_expired');
    }, Math.max(0, timeoutMs));

    return () => {
      if (sessionTimerRef.current) clearTimeout(sessionTimerRef.current);
    };
  }, [state.sessionConfig, session, enabled, showWarningModal, triggerLogout]);

  // Initialiser le timer d'inactivité au chargement de la config
  useEffect(() => {
    if (state.sessionConfig && session && enabled) {
      resetInactivityTimer();
    }

    return () => {
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    };
  }, [state.sessionConfig, session, enabled, resetInactivityTimer]);

  // Prolonger la session (fermer le warning et reset les timers)
  const extendSession = useCallback(() => {
    console.log('🔄 [SessionManager] Extending session');
    
    // Annuler les timers de warning
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    
    setState(prev => ({
      ...prev,
      showWarning: false,
      warningSecondsLeft: 0,
      logoutReason: null
    }));
    
    // Reset le timer d'inactivité
    resetInactivityTimer();
  }, [resetInactivityTimer]);

  // Déconnexion immédiate
  const logoutNow = useCallback(async () => {
    await triggerLogout(state.logoutReason || 'inactivity');
  }, [triggerLogout, state.logoutReason]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
      if (sessionTimerRef.current) clearTimeout(sessionTimerRef.current);
      if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, []);

  return {
    ...state,
    extendSession,
    logoutNow,
    resetInactivityTimer
  };
};
