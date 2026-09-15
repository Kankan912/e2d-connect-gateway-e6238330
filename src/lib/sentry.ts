/**
 * Sentry — initialisation conditionnelle (Lot 4).
 *
 * Le paquet `@sentry/react` est installé ; l'initialisation n'a lieu que si
 * `VITE_SENTRY_DSN` est défini. Sans DSN, aucun réseau, aucun impact.
 * L'import est dynamique afin de ne pas peser sur le bundle initial, et sans
 * évaluation de code à l'exécution (CSP sans `unsafe-eval`).
 */
export async function initSentry(): Promise<void> {
  const dsn = import.meta.env.VITE_SENTRY_DSN as string | undefined;
  if (!dsn) return;
  try {
    const Sentry = await import("@sentry/react");
    Sentry.init({
      dsn,
      environment: import.meta.env.MODE,
      tracesSampleRate: 0.1,
      replaysSessionSampleRate: 0,
      replaysOnErrorSampleRate: 0.1,
    });
  } catch {
    // Volontairement silencieux : la supervision ne doit jamais casser l'app.
  }
}
