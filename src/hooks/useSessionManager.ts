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

// Clé localStorage pour le début de session
const SESSION_START_KEY = 'lovable_session_start';

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
  const validityCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Déterminer le type de session
  const sessionType = getRoleSessionType(userRole, permissions);

  // Récupérer ou initialiser le début de session depuis localStorage
  const getSessionStart = useCallback((userId: string): Date => {
    const storageKey = `${SESSION_START_KEY}_${userId}`;
    const stored = localStorage.getItem(storageKey);
    
    if (stored) {
      const storedDate = new Date(stored);
      // Vérifier que la date stockée est valide et pas trop ancienne (ex: 24h max)
      const maxAge = 24 * 60 * 60 * 1000; // 24 heures
      if (!isNaN(storedDate.getTime()) && (Date.now() - storedDate.getTime()) < maxAge) {
        console.log('🕐 [SessionManager] Session start restored from localStorage:', storedDate.toISOString());
        return storedDate;
      }
    }
    
    // Nouvelle session
    const now = new Date();
    localStorage.setItem(storageKey, now.toISOString());
    console.log('🆕 [SessionManager] New session start saved:', now.toISOString());
    return now;
  }, []);

  // Nettoyer le localStorage lors de la déconnexion
  const clearSessionStorage = useCallback((userId?: string) => {
    if (userId) {
      localStorage.removeItem(`${SESSION_START_KEY}_${userId}`);
    }
    // Nettoyer toutes les clés de session si pas d'userId
    const keys = Object.keys(localStorage).filter(k => k.startsWith(SESSION_START_KEY));
    keys.forEach(k => localStorage.removeItem(k));
    console.log('🧹 [SessionManager] Session storage cleared');
  }, []);

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

      // Récupérer le début de session depuis localStorage
      if (session.user?.id) {
        sessionStartRef.current = getSessionStart(session.user.id);
      }
    };

    loadConfig();
  }, [session, sessionType, enabled, getSessionStart]);

  // Fonction pour déclencher la déconnexion
  const triggerLogout = useCallback(async (reason: 'inactivity' | 'session_expired') => {
    console.log('🚪 [SessionManager] Triggering logout:', reason);
    setState(prev => ({ ...prev, logoutReason: reason, showWarning: false }));
    
    // Nettoyer tous les timers
    if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    if (sessionTimerRef.current) clearTimeout(sessionTimerRef.current);
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    if (validityCheckIntervalRef.current) clearInterval(validityCheckIntervalRef.current);
    
    // Nettoyer le localStorage de session
    if (session?.user?.id) {
      clearSessionStorage(session.user.id);
    }
    
    await onLogout();
  }, [onLogout, session?.user?.id, clearSessionStorage]);

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

  // Timer de durée maximale de session + vérification périodique
  useEffect(() => {
    const config = state.sessionConfig;
    if (!config || !session || !enabled || !sessionStartRef.current) return;

    const checkSessionValidity = () => {
      if (!sessionStartRef.current) return;
      
      const remainingMinutes = calculateRemainingTime(
        sessionStartRef.current,
        config.session_duration_minutes
      );

      console.log(`⏱️ [SessionManager] Remaining session time: ${remainingMinutes.toFixed(1)} minutes`);

      if (remainingMinutes <= 0) {
        console.log('⏰ [SessionManager] Session expired!');
        triggerLogout('session_expired');
        return true; // Session expirée
      }

      // Si proche de l'expiration, afficher le warning
      const warningThresholdMinutes = config.warning_before_logout_seconds / 60;
      if (remainingMinutes <= warningThresholdMinutes && !state.showWarning) {
        showWarningModal('session_expired');
      }

      return false;
    };

    // Vérifier immédiatement
    if (checkSessionValidity()) return;

    // Timer pour la fin de session
    const remainingMinutes = calculateRemainingTime(
      sessionStartRef.current,
      config.session_duration_minutes
    );
    const timeoutMs = (remainingMinutes * 60 - config.warning_before_logout_seconds) * 1000;
    
    sessionTimerRef.current = setTimeout(() => {
      showWarningModal('session_expired');
    }, Math.max(0, timeoutMs));

    // Vérification périodique toutes les 60 secondes (pour gérer la veille PC)
    validityCheckIntervalRef.current = setInterval(() => {
      checkSessionValidity();
    }, 60 * 1000);

    return () => {
      if (sessionTimerRef.current) clearTimeout(sessionTimerRef.current);
      if (validityCheckIntervalRef.current) clearInterval(validityCheckIntervalRef.current);
    };
  }, [state.sessionConfig, session, enabled, showWarningModal, triggerLogout, state.showWarning]);

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
      if (validityCheckIntervalRef.current) clearInterval(validityCheckIntervalRef.current);
    };
  }, []);

  return {
    ...state,
    extendSession,
    logoutNow,
    resetInactivityTimer
  };
};
