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

    // Envoyer à la table audit_logs
    this.sendToAuditService(auditLog);
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
   */
  private sendToSentry(level: string, message: string, error?: unknown, context?: LogContext) {
    if (this.isDevelopment) {
      console.error('[SENTRY PLACEHOLDER]', { level, message, error, context });
    }
  }

  /**
   * Persiste les logs d'audit dans la table audit_logs de Supabase
   */
  private async sendToAuditService(auditLog: Record<string, unknown>) {
    try {
      const { supabase } = await import("@/integrations/supabase/client");
      await supabase.from('audit_logs').insert([{
        action: String(auditLog.action || auditLog.message || 'unknown'),
        table_name: String(auditLog.resource || ''),
        user_id: (auditLog.userId as string) || null,
        new_data: JSON.parse(JSON.stringify(auditLog)),
      }]);
    } catch (e) {
      console.error('[AUDIT] Failed to persist audit log:', e);
    }
  }
}

export const logger = new Logger();
