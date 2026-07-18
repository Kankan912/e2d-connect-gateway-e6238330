/**
 * Sentry — initialisation conditionnelle (Lot 4).
 *
 * Activé UNIQUEMENT si `VITE_SENTRY_DSN` est défini dans l'environnement.
 * Le module `@sentry/react` n'étant pas installé par défaut, l'import est fait
 * dynamiquement via une string non résolue à la compilation, pour éviter à la
 * fois un ajout de dépendance et une erreur TypeScript. Ajoutez le package
 * pour activer réellement Sentry.
 */
export async function initSentry(): Promise<void> {
  const dsn = import.meta.env.VITE_SENTRY_DSN as string | undefined;
  if (!dsn) return;
  try {
    const modName = "@sentry/react";
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const Sentry: any = await (new Function("m", "return import(m)"))(modName).catch(() => null);
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
