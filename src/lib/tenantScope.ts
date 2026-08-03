/**
 * Résolution du tenant pour les visiteurs du site public (non authentifiés).
 *
 * Ordre de résolution :
 *  1. sous-domaine de l'hôte  (ex. `mon-asso.domaine.com`)
 *  2. paramètre d'URL `?asso=slug` ou segment `/s/:slug`
 *  3. valeur mémorisée en localStorage
 *  4. association par défaut (`e2d`)
 */

export const PUBLIC_ASSOCIATION_STORAGE_KEY = "lovable_public_association_slug";
export const DEFAULT_ASSOCIATION_SLUG = "e2d";

const IGNORED_HOST_PREFIXES = new Set([
  "www",
  "app",
  "localhost",
  "preview",
  "id-preview",
  "lovable",
]);

/** Extrait un slug candidat depuis le nom d'hôte. */
export function slugFromHost(host: string): string | null {
  const clean = host.split(":")[0];
  if (!clean || clean === "localhost") return null;
  // Adresse IP → pas de sous-domaine
  if (/^\d+\.\d+\.\d+\.\d+$/.test(clean)) return null;
  const parts = clean.split(".");
  if (parts.length < 3) return null;
  const first = parts[0].toLowerCase();
  if (IGNORED_HOST_PREFIXES.has(first)) return null;
  // Prévisualisations Lovable : `id-preview--xxxx.lovable.app`
  if (first.includes("--")) return null;
  return first;
}

/** Extrait un slug depuis le chemin `/s/:slug` ou la query `?asso=`. */
export function slugFromLocation(pathname: string, search: string): string | null {
  const params = new URLSearchParams(search);
  const q = params.get("asso");
  if (q) return q.toLowerCase();
  const m = pathname.match(/^\/s\/([a-z0-9-]+)/i);
  return m ? m[1].toLowerCase() : null;
}

/** Slug résolu pour la session courante du visiteur. */
export function resolvePublicSlug(loc?: { host: string; pathname: string; search: string }): string {
  const l =
    loc ??
    (typeof window !== "undefined"
      ? {
          host: window.location.host,
          pathname: window.location.pathname,
          search: window.location.search,
        }
      : null);
  if (!l) return DEFAULT_ASSOCIATION_SLUG;

  const fromUrl = slugFromLocation(l.pathname, l.search);
  if (fromUrl) return fromUrl;

  const fromHost = slugFromHost(l.host);
  if (fromHost) return fromHost;

  if (typeof window !== "undefined") {
    const saved = window.localStorage.getItem(PUBLIC_ASSOCIATION_STORAGE_KEY);
    if (saved) return saved;
  }
  return DEFAULT_ASSOCIATION_SLUG;
}

/* ------------------------------------------------------------------ */
/* Store non-React consommé par les hooks de contenu public            */
/* ------------------------------------------------------------------ */

let publicAssociationId: string | null = null;
const listeners = new Set<(id: string | null) => void>();

export const publicAssociationStore = {
  get: () => publicAssociationId,
  set(id: string | null) {
    publicAssociationId = id;
    listeners.forEach((l) => l(id));
  },
  subscribe(listener: (id: string | null) => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};

/**
 * Applique le filtre d'association sur une requête de contenu public.
 * Sans tenant résolu, la requête est renvoyée telle quelle (mode mono-tenant).
 */
export function scopePublic<T>(query: T): T {
  const id = publicAssociationStore.get();
  if (!id) return query;
  return (query as unknown as { eq: (col: string, value: string) => T }).eq("association_id", id);
}
