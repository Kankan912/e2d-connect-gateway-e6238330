/**
 * Contexte d'association pour le **site public** (visiteurs non authentifiés).
 *
 * Résout le tenant depuis le sous-domaine, l'URL (`/s/:slug` ou `?asso=`) ou
 * le dernier choix mémorisé, applique sa charte graphique, sa langue
 * principale, et alimente `publicAssociationStore` pour que les requêtes de
 * contenu (`useSiteContent`) soient filtrées sur la bonne association.
 */
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import i18n from "@/i18n";
import { supabase } from "@/integrations/supabase/client";
import { applyThemeTokens } from "@/lib/applyTheme";
import { logger } from "@/lib/logger";
import {
  PUBLIC_ASSOCIATION_STORAGE_KEY,
  publicAssociationStore,
  resolvePublicSlug,
} from "@/lib/tenantScope";
import { DEFAULT_TEMPLATE_ID, SiteTemplateId } from "@/lib/siteTemplates";

export interface PublicAssociation {
  id: string | null;
  slug: string;
  nom: string;
  sigle: string | null;
  statut: string;
  description: string | null;
  logo_url: string | null;
  theme_tokens: Record<string, string> | null;
  locale: string;
  langue_principale: string;
  site_template: SiteTemplateId;
  subdomain: string | null;
  email_contact: string | null;
  telephone: string | null;
  adresse: string | null;
  ville: string | null;
  pays: string | null;
}

interface Ctx {
  association: PublicAssociation | null;
  template: SiteTemplateId;
  loading: boolean;
  /** true lorsque l'association résolue existe mais n'est pas active. */
  unavailable: boolean;
}

const PublicAssociationContext = createContext<Ctx>({
  association: null,
  template: DEFAULT_TEMPLATE_ID,
  loading: true,
  unavailable: false,
});

export const PublicAssociationProvider = ({ children }: { children: ReactNode }) => {
  const [association, setAssociation] = useState<PublicAssociation | null>(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const queryClient = useQueryClient();

  // Le slug est recalculé à chaque changement d'URL : passer de /s/asso-a à
  // /s/asso-b doit réellement changer de tenant (contenu, logo, couleurs, langue).
  const slug = resolvePublicSlug({
    host: typeof window !== "undefined" ? window.location.host : "",
    pathname: location.pathname,
    search: location.search,
  });

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    (async () => {
      try {
        const { data, error } = await supabase.rpc("get_public_association", { _slug: slug });
        if (error) throw error;
        if (cancelled) return;
        const assoc = (data as unknown as PublicAssociation | null) ?? null;
        setAssociation(assoc);
        const active = !!assoc && assoc.statut === "actif";
        const previousId = publicAssociationStore.get();
        const nextId = active ? assoc!.id : null;
        publicAssociationStore.set(nextId);
        if (previousId !== nextId) {
          // Le contenu public déjà en cache appartient à l'association précédente.
          void queryClient.invalidateQueries();
        }
        if (assoc) {
          applyThemeTokens(assoc.theme_tokens);
          if (assoc.langue_principale) {
            void i18n.changeLanguage(assoc.langue_principale);
          }
          if (typeof window !== "undefined" && active) {
            window.localStorage.setItem(PUBLIC_ASSOCIATION_STORAGE_KEY, assoc.slug);
          }
        }
      } catch (error) {
        logger.warn("[PublicAssociation] résolution du tenant impossible:", error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [slug, queryClient]);

  const unavailable = !!association && association.statut !== "actif";

  return (
    <PublicAssociationContext.Provider
      value={{
        association,
        template: association?.site_template ?? DEFAULT_TEMPLATE_ID,
        loading,
        unavailable,
      }}
    >
      {/* Aucun écran d'attente global : seules les pages publiques attendent la
          résolution du tenant (voir PublicSiteGuard). Connexion et espace
          membre restent accessibles même si la résolution échoue ou traîne. */}
      {children}
    </PublicAssociationContext.Provider>
  );
};

export const usePublicAssociation = () => useContext(PublicAssociationContext);
