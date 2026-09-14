/**
 * Aide à la configuration des sous-domaines d'association.
 *
 * L'application sait déjà résoudre le tenant depuis l'hôte (`src/lib/tenantScope.ts`).
 * Ce module fournit : normalisation, validation de format, détection de doublon
 * et aperçu de l'adresse finale.
 */

/** Domaine générique sur lequel les sous-domaines seront servis (configurable). */
export const BASE_DOMAIN =
  (import.meta.env.VITE_BASE_DOMAIN as string | undefined)?.trim() || "";

/** Préfixes techniques qui ne peuvent pas désigner une association. */
export const RESERVED_SUBDOMAINS = [
  "www",
  "app",
  "api",
  "admin",
  "preview",
  "id-preview",
  "lovable",
  "mail",
  "static",
  "assets",
  "cdn",
  "localhost",
];

const FORMAT = /^[a-z0-9](?:[a-z0-9-]{1,61}[a-z0-9])?$/;

/** Met la valeur saisie au format d'un sous-domaine (minuscules, tirets). */
export function normalizeSubdomain(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export interface SubdomainCheck {
  valid: boolean;
  /** Message d'erreur en français, `null` si la valeur est correcte. */
  error: string | null;
}

/**
 * Valide un sous-domaine : format, longueur, mot réservé, doublon.
 * Une valeur vide est acceptée (le slug sert alors de repli).
 */
export function validateSubdomain(
  value: string,
  options?: { existing?: string[]; allowEmpty?: boolean },
): SubdomainCheck {
  const v = value.trim().toLowerCase();
  if (!v) {
    return options?.allowEmpty === false
      ? { valid: false, error: "Le sous-domaine est obligatoire." }
      : { valid: true, error: null };
  }
  if (v.length < 3) return { valid: false, error: "3 caractères minimum." };
  if (v.length > 63) return { valid: false, error: "63 caractères maximum." };
  if (!FORMAT.test(v)) {
    return {
      valid: false,
      error: "Lettres minuscules, chiffres et tirets uniquement (pas au début ni à la fin).",
    };
  }
  if (RESERVED_SUBDOMAINS.includes(v)) {
    return { valid: false, error: "Ce préfixe est réservé au fonctionnement du service." };
  }
  const existing = (options?.existing ?? []).map((s) => s.toLowerCase());
  if (existing.includes(v)) {
    return { valid: false, error: "Ce sous-domaine est déjà utilisé par une autre association." };
  }
  return { valid: true, error: null };
}

/** Adresse complète telle qu'elle sera visible par les visiteurs. */
export function subdomainPreview(value: string, fallbackSlug?: string): string {
  const sub = normalizeSubdomain(value || fallbackSlug || "");
  if (!sub) return "";
  if (!BASE_DOMAIN) return `${sub}.<votre-domaine>`;
  return `${sub}.${BASE_DOMAIN}`;
}
