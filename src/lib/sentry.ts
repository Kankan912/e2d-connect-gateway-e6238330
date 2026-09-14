/**
 * Sentry — initialisation conditionnelle (Lot 4).
 *
 * Activé UNIQUEMENT si `VITE_SENTRY_DSN` est défini dans l'environnement et si
 * le paquet `@sentry/react` est installé. L'import dynamique est marqué
 * `@vite-ignore` : aucune évaluation de code à l'exécution (pas de
 * `new Function`), donc compatible avec une CSP sans `unsafe-eval`.
 */
export async function initSentry(): Promise<void> {
  const dsn = import.meta.env.VITE_SENTRY_DSN as string | undefined;
  if (!dsn) return;
  try {
    const modName = "@sentry/react";
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const Sentry: any = await import(/* @vite-ignore */ modName).catch(() => null);
    if (!Sentry?.init) return;
    Sentry.init({
      dsn,
      environment: import.meta.env.MODE,
      tracesSampleRate: 0.1,
      replaysSessionSampleRate: 0,
      replaysOnErrorSampleRate: 0.1,
    });
  } catch {
    // Volontairement silencieux : Sentry ne doit jamais casser l'app.
  }
}
