type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogContext {
  component?: string;
  action?: string;
  data?: unknown;
}

class Logger {
  private isDevelopment = import.meta.env.DEV;
  private debugMode = import.meta.env.VITE_DEBUG === 'true';

  info(message: string, data?: unknown) {
    if (this.isDevelopment) {
      console.log(`ℹ️ [INFO] ${message}`, data !== undefined ? data : '');
    }
  }

  warn(message: string, data?: unknown) {
    if (this.isDevelopment) {
      console.warn(`⚠️ [WARN] ${message}`, data !== undefined ? data : '');
    }
  }

  error(message: string, error?: unknown, context?: LogContext) {
    // Toujours logger les erreurs, même en production
    console.error(`❌ [ERROR] ${message}`, error || '', context || '');
    // TODO: Envoyer à un service de monitoring (Sentry, LogRocket, etc.)
  }

  debug(message: string, data?: unknown) {
    if (this.isDevelopment && this.debugMode) {
      console.log(`🐛 [DEBUG] ${message}`, data !== undefined ? data : '');
    }
  }

  // Méthode pour logs de succès
  success(message: string, data?: unknown) {
    if (this.isDevelopment) {
      console.log(`✅ [SUCCESS] ${message}`, data !== undefined ? data : '');
    }
  }

  // CORRECTION #16: Logger structuré avec contexte
  logWithContext(level: LogLevel, message: string, context: LogContext) {
    const timestamp = new Date().toISOString();
    const emoji = level === 'error' ? '❌' : level === 'warn' ? '⚠️' : level === 'debug' ? '🐛' : 'ℹ️';

    const formattedLog = {
      timestamp,
      level,
      message,
      component: context.component,
      action: context.action,
      data: context.data
    };

    if (this.isDevelopment || this.debugMode || level === 'error') {
      const consoleMethod = level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'log';
      console[consoleMethod](
        `${emoji} [${level.toUpperCase()}] [${context.component || 'UNKNOWN'}] ${message}`,
        formattedLog
      );
    }

    // En production, envoyer les erreurs à un service externe (Sentry, LogRocket)
    if (!this.isDevelopment && level === 'error') {
      // TODO: Intégration Sentry
      console.error('[PRODUCTION ERROR]', formattedLog);
    }
  }
}

export const logger = new Logger();
