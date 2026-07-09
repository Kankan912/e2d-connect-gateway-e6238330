import { createContext, useContext, useEffect, useMemo, useState, ReactNode, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { associationStore, CurrentAssociation } from '@/stores/associationStore';
import { logger } from '@/lib/logger';

const STORAGE_KEY = 'lovable_current_association';

interface AssociationRow {
  id: string;
  slug: string;
  nom: string;
  logo_url: string | null;
  theme_tokens: Record<string, string> | null;
  statut?: string | null;
}

interface AssociationContextType {
  currentAssociation: AssociationRow | null;
  availableAssociations: AssociationRow[];
  isSuperAdmin: boolean;
  loading: boolean;
  switchAssociation: (id: string) => void;
}

const AssociationContext = createContext<AssociationContextType | undefined>(undefined);

export const AssociationProvider = ({ children }: { children: ReactNode }) => {
  const { user, userRole, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();

  const [availableAssociations, setAvailableAssociations] = useState<AssociationRow[]>([]);
  const [currentAssociation, setCurrentAssociation] = useState<AssociationRow | null>(null);
  const [loading, setLoading] = useState(true);

  const isSuperAdmin = userRole === 'super_admin';

  // Applique les theme_tokens comme variables CSS
  const applyTheme = useCallback((assoc: AssociationRow | null) => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    // Reset : on nettoie les vars tenant précédentes
    Array.from(root.style)
      .filter((prop) => prop.startsWith('--tenant-'))
      .forEach((prop) => root.style.removeProperty(prop));

    if (!assoc?.theme_tokens) return;
    Object.entries(assoc.theme_tokens).forEach(([key, value]) => {
      if (typeof value === 'string') {
        root.style.setProperty(`--tenant-${key}`, value);
      }
    });
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setAvailableAssociations([]);
      setCurrentAssociation(null);
      associationStore.set(null);
      applyTheme(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        let assocs: AssociationRow[] = [];

        if (isSuperAdmin) {
          const { data, error } = await supabase
            .from('associations')
            .select('id, slug, nom, logo_url, theme_tokens, statut')
            .eq('statut', 'actif')
            .order('nom');
          if (error) throw error;
          assocs = (data ?? []) as AssociationRow[];
        } else {
          const { data: membreRows, error: membreErr } = await supabase
            .from('membres')
            .select('association_id')
            .eq('user_id', user.id);
          if (membreErr) throw membreErr;
          const ids = Array.from(new Set((membreRows ?? []).map((m) => m.association_id).filter(Boolean)));
          if (ids.length) {
            const { data, error } = await supabase
              .from('associations')
              .select('id, slug, nom, logo_url, theme_tokens, statut')
              .in('id', ids)
              .order('nom');
            if (error) throw error;
            assocs = (data ?? []) as AssociationRow[];
          }
        }

        // Fallback : au moins E2D (via slug) pour éviter un état vide
        if (!assocs.length) {
          const { data } = await supabase
            .from('associations')
            .select('id, slug, nom, logo_url, theme_tokens, statut')
            .eq('slug', 'e2d')
            .maybeSingle();
          if (data) assocs = [data as AssociationRow];
        }

        if (cancelled) return;

        // Sélection courante : localStorage → 1ère dispo
        const savedId = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
        const selected = assocs.find((a) => a.id === savedId) ?? assocs[0] ?? null;

        setAvailableAssociations(assocs);
        setCurrentAssociation(selected);
        associationStore.set(selected ? toStoreValue(selected) : null);
        applyTheme(selected);
      } catch (error) {
        logger.error('[AssociationContext] Erreur chargement associations:', error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user, authLoading, isSuperAdmin, applyTheme]);

  const syncTenantOnDb = useCallback(async (id: string | null) => {
    try {
      // @ts-expect-error - RPC générée après migration Phase 3
      await supabase.rpc('set_current_association', { _association_id: id });
    } catch (error) {
      logger.warn('[AssociationContext] set_current_association RPC échouée:', error);
    }
  }, []);

  // Synchronise le tenant côté DB à chaque changement (utile après reload/login)
  useEffect(() => {
    if (currentAssociation?.id) {
      void syncTenantOnDb(currentAssociation.id);
    }
  }, [currentAssociation?.id, syncTenantOnDb]);

  const switchAssociation = useCallback(
    (id: string) => {
      const next = availableAssociations.find((a) => a.id === id);
      if (!next) return;
      setCurrentAssociation(next);
      associationStore.set(toStoreValue(next));
      applyTheme(next);
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, id);
      }
      // Pose la GUC côté Postgres puis invalide le cache React Query
      void syncTenantOnDb(id).then(() => {
        queryClient.invalidateQueries();
      });
    },
    [availableAssociations, applyTheme, queryClient, syncTenantOnDb]
  );

  const value = useMemo<AssociationContextType>(
    () => ({
      currentAssociation,
      availableAssociations,
      isSuperAdmin,
      loading,
      switchAssociation,
    }),
    [currentAssociation, availableAssociations, isSuperAdmin, loading, switchAssociation]
  );

  return <AssociationContext.Provider value={value}>{children}</AssociationContext.Provider>;
};

function toStoreValue(a: AssociationRow): CurrentAssociation {
  return {
    id: a.id,
    slug: a.slug,
    nom: a.nom,
    logo_url: a.logo_url,
    theme_tokens: a.theme_tokens,
  };
}

export const useAssociation = () => {
  const ctx = useContext(AssociationContext);
  if (!ctx) throw new Error('useAssociation must be used within an AssociationProvider');
  return ctx;
};
