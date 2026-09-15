import { lazy, ComponentType } from "react";

/**
 * Chargement différé robuste (A13).
 *
 * En cas d'échec de téléchargement d'un morceau de code (déploiement pendant
 * la navigation, réseau instable), on réessaie l'import un nombre borné de
 * fois avec une courte attente. Aucun rechargement complet de la page n'est
 * déclenché : l'utilisateur ne perd jamais sa saisie en cours. Si toutes les
 * tentatives échouent, l'erreur remonte à l'ErrorBoundary qui propose un
 * bouton de réessai explicite.
 */
const MAX_ATTEMPTS = 3;
const RETRY_DELAY_MS = 500;

const isChunkLoadError = (err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  return /chunk|dynamically imported module|failed to fetch|loading css chunk/i.test(message);
};

/**
 * Après une publication, l'ancien fichier n'existe plus : un unique
 * rechargement récupère la nouvelle version. La clé de session empêche
 * toute boucle de rechargement si le problème persiste.
 */
const RELOAD_KEY = "chunk-reload-once";

const tryReloadOnce = (): boolean => {
  if (typeof window === "undefined") return false;
  try {
    if (window.sessionStorage.getItem(RELOAD_KEY)) return false;
    window.sessionStorage.setItem(RELOAD_KEY, String(Date.now()));
  } catch {
    return false;
  }
  window.location.reload();
  return true;
};

export function lazyWithRetry<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>
) {
  return lazy(async () => {
    let lastError: unknown;
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      try {
        const mod = await factory();
        try {
          window.sessionStorage.removeItem(RELOAD_KEY);
        } catch {
          /* stockage indisponible : sans conséquence */
        }
        return mod;
      } catch (err: unknown) {
        lastError = err;
        if (!isChunkLoadError(err) || attempt === MAX_ATTEMPTS) break;
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS * attempt));
      }
    }
    if (isChunkLoadError(lastError) && tryReloadOnce()) {
      // Rechargement en cours : on laisse la promesse en attente.
      return new Promise<{ default: T }>(() => {});
    }
    throw lastError;
  });
}
