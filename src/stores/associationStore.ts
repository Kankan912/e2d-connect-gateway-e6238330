/**
 * Store singleton (hors React) exposant l'association courante.
 * Permet aux helpers non-React (`tenantQuery`, edge functions côté client,
 * loggers, etc.) de lire le tenant actif sans passer par le contexte.
 *
 * L'unique source de vérité côté React reste `AssociationContext` — ce store
 * n'est qu'un miroir mis à jour par le provider.
 */

export interface CurrentAssociation {
  id: string;
  slug: string;
  nom: string;
  logo_url?: string | null;
  theme_tokens?: Record<string, string> | null;
}

let current: CurrentAssociation | null = null;
const listeners = new Set<(value: CurrentAssociation | null) => void>();

export const associationStore = {
  get(): CurrentAssociation | null {
    return current;
  },
  set(value: CurrentAssociation | null) {
    current = value;
    listeners.forEach((l) => l(value));
  },
  subscribe(listener: (value: CurrentAssociation | null) => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};
