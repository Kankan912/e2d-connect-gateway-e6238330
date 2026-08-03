import { createContext, useContext, useEffect, useMemo, useState, ReactNode, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { associationStore, CurrentAssociation } from '@/stores/associationStore';
import { logger } from '@/lib/logger';
import { setActiveCurrency } from '@/lib/utils';
import { resolveCurrency } from '@/lib/formatCurrencyDynamic';
import { applyThemeTokens } from '@/lib/applyTheme';
import i18n, { LANGUAGE_STORAGE_KEY } from '@/i18n';

const STORAGE_KEY = 'lovable_current_association';

interface AssociationRow {
  id: string;
  slug: string;
  nom: string;
  logo_url: string | null;
  theme_tokens: Record<string, string> | null;
  statut?: string | null;
  langue_principale?: string | null;
  site_template?: string | null;
  sigle?: string | null;
}

interface AssociationContextType {
  currentAssociation: AssociationRow | null;
  availableAssociations: AssociationRow[];
  isSuperAdmin: boolean;
  loading: boolean;
  switchAssociation: (id: string) => void;
  refreshAssociations: () => Promise<void>;
}

const AssociationContext = createContext<AssociationContextType | undefined>(undefined);

export const AssociationProvider = ({ children }: { children: ReactNode }) => {
  const { user, userRole, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();

  const [availableAssociations, setAvailableAssociations] = useState<AssociationRow[]>([]);
  const [currentAssociation, setCurrentAssociation] = useState<AssociationRow | null>(null);
  const [loading, setLoading] = useState(true);

  const isSuperAdmin = userRole === 'super_admin';

  // Applique les theme_tokens (charte complète) + devise + langue principale
  const applyTheme = useCallback((assoc: AssociationRow | null) => {
    // Devise active du tenant (utilisée par formatFCFA hors React / PDF)
    const resolved = resolveCurrency(assoc?.theme_tokens ?? null);
    setActiveCurrency(
      resolved === 'EUR' || resolved === 'USD' ? resolved : 'FCFA',
      assoc?.theme_tokens?.locale ?? 'fr-FR',
    );

    applyThemeTokens(assoc?.theme_tokens ?? null);

    // Langue principale de l'association (l'utilisateur peut toujours la changer
    // manuellement ensuite via le sélecteur de langue).
    const lang = assoc?.langue_principale;
    if (lang && !localStorage.getItem(LANGUAGE_STORAGE_KEY)) {
      void i18n.changeLanguage(lang);
    }
  }, []);

  const loadAssociations = useCallback(async () => {
    if (!user) {
      setAvailableAssociations([]);
      setCurrentAssociation(null);
      associationStore.set(null);
      applyTheme(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      let assocs: AssociationRow[] = [];

      if (isSuperAdmin) {
        const { data, error } = await supabase
          .from('associations')
          .select('id, slug, nom, sigle, logo_url, theme_tokens, statut, langue_principale, site_template')
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
            .select('id, slug, nom, sigle, logo_url, theme_tokens, statut, langue_principale, site_template')
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
          .select('id, slug, nom, sigle, logo_url, theme_tokens, statut, langue_principale, site_template')
          .eq('slug', 'e2d')
          .maybeSingle();
        if (data) assocs = [data as AssociationRow];
      }

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
      setLoading(false);
    }
  }, [user, isSuperAdmin, applyTheme]);

  useEffect(() => {
    if (authLoading) return;
    void loadAssociations();
  }, [authLoading, loadAssociations]);


  const syncTenantOnDb = useCallback(async (id: string | null) => {
    try {
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
      refreshAssociations: loadAssociations,
    }),
    [currentAssociation, availableAssociations, isSuperAdmin, loading, switchAssociation, loadAssociations]
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
