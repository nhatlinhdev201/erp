// =============================================================================
// L-ERP MRP - LOGGER UTILITY
// Centralized logging to replace console.log
// =============================================================================

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
  userId?: string;
  requestId?: string;
}

interface LoggerConfig {
  level: LogLevel;
  enabled: boolean;
  includeTimestamp: boolean;
  includeContext: boolean;
  sensitiveFields: string[];
}

// =============================================================================
// CONFIGURATION
// =============================================================================

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const DEFAULT_CONFIG: LoggerConfig = {
  level: (process.env.LOG_LEVEL as LogLevel) || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
  enabled: process.env.NODE_ENV !== 'test',
  includeTimestamp: true,
  includeContext: process.env.NODE_ENV !== 'production',
  sensitiveFields: [
    'password',
    'token',
    'secret',
    'apiKey',
    'api_key',
    'authorization',
    'credit_card',
    'creditCard',
    'ssn',
    'socialSecurity',
  ],
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function maskSensitiveData(data: unknown, sensitiveFields: string[]): unknown {
  if (data === null || data === undefined) {
    return data;
  }

  if (typeof data === 'string') {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map(item => maskSensitiveData(item, sensitiveFields));
  }

  if (typeof data === 'object') {
    const masked: Record<string, any> = {};
    for (const [key, value] of Object.entries(data)) {
      const lowerKey = key.toLowerCase();
      const isSensitive = sensitiveFields.some(field =>
        lowerKey.includes(field.toLowerCase())
      );

      if (isSensitive) {
        masked[key] = '[REDACTED]';
      } else if (typeof value === 'object' && value !== null) {
        masked[key] = maskSensitiveData(value, sensitiveFields);
      } else {
        masked[key] = value;
      }
    }
    return masked;
  }

  return data;
}

function formatLogEntry(entry: LogEntry, config: LoggerConfig): string {
  const parts: string[] = [];

  if (config.includeTimestamp) {
    parts.push(`[${entry.timestamp}]`);
  }

  parts.push(`[${entry.level.toUpperCase()}]`);

  if (entry.requestId) {
    parts.push(`[${entry.requestId}]`);
  }

  if (entry.userId) {
    parts.push(`[user:${entry.userId}]`);
  }

  parts.push(entry.message);

  if (config.includeContext && entry.context) {
    const maskedContext = maskSensitiveData(entry.context, config.sensitiveFields);
    parts.push(JSON.stringify(maskedContext, null, 2));
  }

  return parts.join(' ');
}

// =============================================================================
// LOGGER CLASS
// =============================================================================

class LoggerImpl {
  private config: LoggerConfig;
  private requestId?: string;
  private userId?: string;

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  private shouldLog(level: LogLevel): boolean {
    if (!this.config.enabled) return false;
    return LOG_LEVELS[level] >= LOG_LEVELS[this.config.level];
  }

  private log(level: LogLevel, message: string, context?: Record<string, any>): void {
    if (!this.shouldLog(level)) return;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      userId: this.userId,
      requestId: this.requestId,
    };

    const formatted = formatLogEntry(entry, this.config);

    switch (level) {
      case 'debug':
        if (process.env.NODE_ENV !== 'production') {
          console.debug(formatted);
        }
        break;
      case 'info':
        console.info(formatted);
        break;
      case 'warn':
        console.warn(formatted);
        break;
      case 'error':
        console.error(formatted);
        break;
    }

    // In production, send to external logging service
    if (process.env.NODE_ENV === 'production') {
      this.sendToExternalService(entry);
    }
  }

  private async sendToExternalService(entry: LogEntry): Promise<void> {
    const serviceUrl = process.env.LOG_SERVICE_URL;
    if (!serviceUrl) return;
    try {
      await fetch(serviceUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry),
      }).catch(() => {}); // Fire and forget
    } catch {
      // Swallow errors to prevent logging from crashing the app
    }
  }

  // Set request context
  setRequestContext(requestId: string, userId?: string): void {
    this.requestId = requestId;
    this.userId = userId;
  }

  // Clear request context
  clearRequestContext(): void {
    this.requestId = undefined;
    this.userId = undefined;
  }

  // Log methods
  debug(message: string, context?: Record<string, any>): void {
    this.log('debug', message, context);
  }

  info(message: string, context?: Record<string, any>): void {
    this.log('info', message, context);
  }

  warn(message: string, context?: Record<string, any>): void {
    this.log('warn', message, context);
  }

  error(message: string, context?: Record<string, any>): void {
    this.log('error', message, context);
  }

  // Log error with stack trace
  logError(err: Error, context?: Record<string, any>): void {
    this.error(err.message, {
      ...context,
      stack: err.stack,
      name: err.name,
    });
  }

  // Performance logging
  time(label: string): () => void {
    const start = performance.now();
    return () => {
      const duration = performance.now() - start;
      this.debug(`${label} completed`, { durationMs: duration.toFixed(2) });
    };
  }

  // API request logging
  logRequest(
    method: string,
    path: string,
    statusCode: number,
    durationMs: number,
    context?: Record<string, any>
  ): void {
    const level = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info';
    this.log(level, `${method} ${path} ${statusCode}`, {
      ...context,
      method,
      path,
      statusCode,
      durationMs,
    });
  }

  // Database query logging
  logQuery(query: string, durationMs: number, context?: Record<string, any>): void {
    this.debug(`DB Query: ${query.substring(0, 100)}...`, {
      ...context,
      durationMs,
    });
  }

  // Audit logging (always logs regardless of level)
  audit(
    action: string,
    resource: string,
    resourceId: string,
    context?: Record<string, any>
  ): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: 'info',
      message: `AUDIT: ${action} on ${resource}:${resourceId}`,
      context: {
        ...context,
        auditAction: action,
        resource,
        resourceId,
      },
      userId: this.userId,
      requestId: this.requestId,
    };

    // Always log audit events
    console.info(formatLogEntry(entry, this.config));

    // In production, ensure audit logs are persisted
    if (process.env.NODE_ENV === 'production') {
      this.sendToExternalService(entry);
    }
  }

  // Create child logger with context
  child(context: { requestId?: string; userId?: string }): LoggerImpl {
    const childLogger = new LoggerImpl(this.config);
    childLogger.requestId = context.requestId || this.requestId;
    childLogger.userId = context.userId || this.userId;
    return childLogger;
  }
}

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

export const logger = new LoggerImpl();

// =============================================================================
// CONVENIENCE EXPORTS
// =============================================================================

export function debug(message: string, context?: Record<string, any>): void {
  logger.debug(message, context);
}

export function info(message: string, context?: Record<string, any>): void {
  logger.info(message, context);
}

export function warn(message: string, context?: Record<string, any>): void {
  logger.warn(message, context);
}

export function error(message: string, context?: Record<string, any>): void {
  logger.error(message, context);
}

export function logError(err: Error, context?: Record<string, any>): void {
  logger.logError(err, context);
}

export function audit(
  action: string,
  resource: string,
  resourceId: string,
  context?: Record<string, any>
): void {
  logger.audit(action, resource, resourceId, context);
}

// =============================================================================
// REQUEST LOGGER MIDDLEWARE
// =============================================================================

export function createRequestLogger(requestId: string, userId?: string): LoggerImpl {
  return logger.child({ requestId, userId });
}

export default logger;
