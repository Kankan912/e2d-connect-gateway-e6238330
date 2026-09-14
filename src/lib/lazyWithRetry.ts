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

export function lazyWithRetry<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>
) {
  return lazy(async () => {
    let lastError: unknown;
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      try {
        return await factory();
      } catch (err: unknown) {
        lastError = err;
        if (!isChunkLoadError(err) || attempt === MAX_ATTEMPTS) break;
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS * attempt));
      }
    }
    throw lastError;
  });
}
