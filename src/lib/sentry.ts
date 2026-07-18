/**
 * Sentry — initialisation conditionnelle (Lot 4).
 *
 * Activé UNIQUEMENT si `VITE_SENTRY_DSN` est défini dans l'environnement.
 * Sans DSN, aucun code Sentry n'est chargé (no-op complet, aucun impact bundle
 * hors ce petit shim). Cela permet d'activer Sentry par déploiement sans
 * modification de code.
 */
export async function initSentry(): Promise<void> {
  const dsn = import.meta.env.VITE_SENTRY_DSN as string | undefined;
  if (!dsn) return;
  try {
    const Sentry = await import(/* @vite-ignore */ "@sentry/react" as string).catch(() => null);
    if (!Sentry) {
      // Package non installé — silencieux (Sentry reste optionnel).
      return;
    }
    (Sentry as any).init({
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
