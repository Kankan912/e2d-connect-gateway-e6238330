type LogLevel = 'info' | 'warn' | 'error' | 'debug' | 'audit';

interface LogContext {
  component?: string;
  action?: string;
  data?: unknown;
}

interface AuditContext {
  userId?: string;
  resource: string;
  action: 'create' | 'update' | 'delete' | 'view' | 'export' | 'login' | 'logout' | 'permission_change';
  details?: Record<string, unknown>;
  ip?: string;
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
    
    // En production, envoyer à Sentry si disponible
    if (!this.isDevelopment) {
      this.sendToSentry('error', message, error, context);
    }
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

  /**
   * Méthode d'audit pour les actions critiques (permissions, données sensibles, etc.)
   * Ces logs sont toujours enregistrés, en dev et en production
   */
  audit(message: string, context: AuditContext) {
    const timestamp = new Date().toISOString();
    const auditLog = {
      timestamp,
      level: 'audit' as LogLevel,
      message,
      ...context
    };

    // Toujours logger les audits
    console.log(`🔐 [AUDIT] ${message}`, auditLog);

    // En production, envoyer à un service d'audit
    if (!this.isDevelopment) {
      this.sendToAuditService(auditLog);
    }
  }

  // Logger structuré avec contexte
  logWithContext(level: LogLevel, message: string, context: LogContext) {
    const timestamp = new Date().toISOString();
    const emoji = level === 'error' ? '❌' : level === 'warn' ? '⚠️' : level === 'debug' ? '🐛' : level === 'audit' ? '🔐' : 'ℹ️';

    const formattedLog = {
      timestamp,
      level,
      message,
      component: context.component,
      action: context.action,
      data: context.data
    };

    if (this.isDevelopment || this.debugMode || level === 'error' || level === 'audit') {
      const consoleMethod = level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'log';
      console[consoleMethod](
        `${emoji} [${level.toUpperCase()}] [${context.component || 'UNKNOWN'}] ${message}`,
        formattedLog
      );
    }

    // En production, envoyer les erreurs à Sentry
    if (!this.isDevelopment && level === 'error') {
      this.sendToSentry(level, message, null, context);
    }
  }

  /**
   * Placeholder pour intégration Sentry
   * TODO: Installer @sentry/browser et configurer
   * npm install @sentry/browser
   * 
   * import * as Sentry from '@sentry/browser';
   * Sentry.init({ dsn: 'YOUR_SENTRY_DSN' });
   */
  private sendToSentry(level: string, message: string, error?: unknown, context?: LogContext) {
    // Placeholder pour Sentry
    // Décommenter après installation de @sentry/browser:
    // 
    // if (typeof Sentry !== 'undefined') {
    //   Sentry.captureMessage(message, {
    //     level: level as Sentry.SeverityLevel,
    //     extra: { error, context }
    //   });
    // }
    console.error('[SENTRY PLACEHOLDER]', { level, message, error, context });
  }

  /**
   * Placeholder pour service d'audit externe
   * TODO: Envoyer les audits à un service comme LogRocket, Datadog, ou table Supabase
   */
  private sendToAuditService(auditLog: Record<string, unknown>) {
    // Placeholder - envoyer à Supabase ou service externe
    // 
    // supabase.from('audit_logs').insert(auditLog);
    // 
    // ou LogRocket:
    // LogRocket.track('audit', auditLog);
    console.log('[AUDIT SERVICE PLACEHOLDER]', auditLog);
  }
}

export const logger = new Logger();
