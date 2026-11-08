// =============================================================================
// L-ERP MRP - STRUCTURED LOGGING
// Production-ready logging with JSON format and log levels
// =============================================================================

// Note: Install winston: npm install winston

type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

interface LogContext {
  tenantId?: string;
  userId?: string;
  requestId?: string;
  traceId?: string;
  spanId?: string;
  [key: string]: unknown;
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  service: string;
  version: string;
  environment: string;
  hostname: string;
  pid: number;
  context?: LogContext;
  error?: {
    name: string;
    message: string;
    stack?: string;
    code?: string;
  };
  duration?: number;
  [key: string]: unknown;
}

// =============================================================================
// CONFIGURATION
// =============================================================================

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  fatal: 4,
};

const config = {
  level: (process.env.LOG_LEVEL || 'info') as LogLevel,
  format: process.env.LOG_FORMAT || 'json', // 'json' or 'pretty'
  service: process.env.SERVICE_NAME || 'lerp-mrp',
  version: process.env.APP_VERSION || '1.0.0',
  environment: process.env.NODE_ENV || 'development',
  hostname: process.env.HOSTNAME || process.env.POD_NAME || 'unknown',
  pid: process.pid,
};

// =============================================================================
// LOGGER CLASS
// =============================================================================

class Logger {
  private context: LogContext = {};

  constructor(defaultContext?: LogContext) {
    if (defaultContext) {
      this.context = defaultContext;
    }
  }

  /**
   * Create child logger with additional context
   */
  child(context: LogContext): Logger {
    const childLogger = new Logger({ ...this.context, ...context });
    return childLogger;
  }

  /**
   * Set context
   */
  setContext(context: LogContext): void {
    this.context = { ...this.context, ...context };
  }

  /**
   * Check if level is enabled
   */
  private isLevelEnabled(level: LogLevel): boolean {
    return LOG_LEVELS[level] >= LOG_LEVELS[config.level];
  }

  /**
   * Format log entry
   */
  private formatEntry(
    level: LogLevel,
    message: string,
    data?: Record<string, any>
  ): LogEntry {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      service: config.service,
      version: config.version,
      environment: config.environment,
      hostname: config.hostname,
      pid: config.pid,
    };

    // Add context
    if (Object.keys(this.context).length > 0) {
      entry.context = this.context;
    }

    // Add additional data
    if (data) {
      // Extract error if present
      if (data.error instanceof Error) {
        entry.error = {
          name: data.error.name,
          message: data.error.message,
          stack: data.error.stack,
          code: 'code' in data.error ? (data.error as Error & { code?: string }).code : undefined,
        };
        delete data.error;
      }

      // Extract duration if present
      if (typeof data.duration === 'number') {
        entry.duration = data.duration;
        delete data.duration;
      }

      // Merge remaining data
      Object.assign(entry, data);
    }

    return entry;
  }

  /**
   * Output log entry
   */
  private output(entry: LogEntry): void {
    const output = config.format === 'pretty' 
      ? this.formatPretty(entry)
      : JSON.stringify(entry);

    // Use appropriate console method
    switch (entry.level) {
      case 'debug':
        console.debug(output);
        break;
      case 'info':
        console.info(output);
        break;
      case 'warn':
        console.warn(output);
        break;
      case 'error':
      case 'fatal':
        console.error(output);
        break;
    }
  }

  /**
   * Format pretty output (for development)
   */
  private formatPretty(entry: LogEntry): string {
    const levelColors: Record<LogLevel, string> = {
      debug: '\x1b[36m', // cyan
      info: '\x1b[32m',  // green
      warn: '\x1b[33m',  // yellow
      error: '\x1b[31m', // red
      fatal: '\x1b[35m', // magenta
    };

    const reset = '\x1b[0m';
    const color = levelColors[entry.level];
    const time = entry.timestamp.split('T')[1].split('.')[0];

    let output = `${color}[${entry.level.toUpperCase()}]${reset} ${time} ${entry.message}`;

    if (entry.context) {
      output += ` ${JSON.stringify(entry.context)}`;
    }

    if (entry.error) {
      output += `\n${entry.error.stack || entry.error.message}`;
    }

    if (entry.duration) {
      output += ` (${entry.duration}ms)`;
    }

    return output;
  }

  /**
   * Log methods
   */
  debug(message: string, data?: Record<string, any>): void {
    if (this.isLevelEnabled('debug')) {
      this.output(this.formatEntry('debug', message, data));
    }
  }

  info(message: string, data?: Record<string, any>): void {
    if (this.isLevelEnabled('info')) {
      this.output(this.formatEntry('info', message, data));
    }
  }

  warn(message: string, data?: Record<string, any>): void {
    if (this.isLevelEnabled('warn')) {
      this.output(this.formatEntry('warn', message, data));
    }
  }

  error(message: string, data?: Record<string, any>): void {
    if (this.isLevelEnabled('error')) {
      this.output(this.formatEntry('error', message, data));
    }
  }

  fatal(message: string, data?: Record<string, any>): void {
    if (this.isLevelEnabled('fatal')) {
      this.output(this.formatEntry('fatal', message, data));
    }
  }

  /**
   * Log HTTP request
   */
  http(req: {
    method: string;
    url: string;
    status: number;
    duration: number;
    ip?: string;
    userAgent?: string;
  }): void {
    const level = req.status >= 500 ? 'error' : req.status >= 400 ? 'warn' : 'info';
    
    this[level](`HTTP ${req.method} ${req.url}`, {
      http: {
        method: req.method,
        url: req.url,
        status: req.status,
        duration: req.duration,
        ip: req.ip,
        userAgent: req.userAgent,
      },
    });
  }

  /**
   * Log database query
   */
  db(query: {
    operation: string;
    model: string;
    duration: number;
    success: boolean;
  }): void {
    const level = query.success ? 'debug' : 'error';
    
    this[level](`DB ${query.operation} ${query.model}`, {
      db: query,
      duration: query.duration,
    });
  }

  /**
   * Log background job
   */
  job(job: {
    queue: string;
    name: string;
    id: string;
    status: 'started' | 'completed' | 'failed';
    duration?: number;
    error?: Error;
  }): void {
    const level = job.status === 'failed' ? 'error' : 'info';
    
    this[level](`Job ${job.status}: ${job.queue}/${job.name}`, {
      job: {
        queue: job.queue,
        name: job.name,
        id: job.id,
        status: job.status,
      },
      duration: job.duration,
      error: job.error,
    });
  }

  /**
   * Log security event
   */
  security(event: {
    type: 'login' | 'logout' | 'access_denied' | 'rate_limited' | 'suspicious';
    userId?: string;
    ip?: string;
    userAgent?: string;
    details?: string;
  }): void {
    const level = event.type === 'suspicious' || event.type === 'access_denied' ? 'warn' : 'info';
    
    this[level](`Security: ${event.type}`, {
      security: event,
    });
  }

  /**
   * Log audit event
   */
  audit(event: {
    action: string;
    resource: string;
    resourceId?: string;
    userId: string;
    changes?: Record<string, { old: unknown; new: unknown }>;
  }): void {
    this.info(`Audit: ${event.action} ${event.resource}`, {
      audit: event,
    });
  }

  /**
   * Performance timing
   */
  time(label: string): () => void {
    const start = Date.now();
    
    return () => {
      const duration = Date.now() - start;
      this.debug(`Timer: ${label}`, { duration });
    };
  }
}

// =============================================================================
// DEFAULT LOGGER INSTANCE
// =============================================================================

export const logger = new Logger();

// =============================================================================
// REQUEST CONTEXT HELPER
// =============================================================================

/**
 * Create request-scoped logger
 */
export function createRequestLogger(req: {
  headers?: Record<string, string | string[] | undefined>;
  query?: Record<string, string | string[] | undefined>;
}): Logger {
  const requestId = 
    req.headers?.['x-request-id'] as string ||
    req.headers?.['x-correlation-id'] as string ||
    generateRequestId();

  const tenantId = req.headers?.['x-tenant-id'] as string;
  const userId = req.headers?.['x-user-id'] as string;
  const traceId = req.headers?.['x-trace-id'] as string;

  return logger.child({
    requestId,
    tenantId,
    userId,
    traceId,
  });
}

/**
 * Generate unique request ID
 */
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

// =============================================================================
// MIDDLEWARE
// =============================================================================

/**
 * Express/Next.js logging middleware
 */
export function loggingMiddleware() {
  return (
    req: {
      method: string;
      url: string;
      ip?: string;
      connection?: { remoteAddress?: string };
      headers: Record<string, string | string[] | undefined>;
      log?: Logger;
    },
    res: {
      statusCode: number;
      on: (event: string, cb: () => void) => void;
    },
    next: () => void
  ) => {
    const start = Date.now();
    const requestLogger = createRequestLogger(req);

    // Attach logger to request
    req.log = requestLogger;

    // Log request
    requestLogger.debug(`Request started`, {
      http: {
        method: req.method,
        url: req.url,
        ip: req.ip || req.connection?.remoteAddress,
      },
    });

    // Log response when finished
    res.on('finish', () => {
      const duration = Date.now() - start;

      requestLogger.http({
        method: req.method,
        url: req.url,
        status: res.statusCode,
        duration,
        ip: req.ip || req.connection?.remoteAddress,
        userAgent: req.headers['user-agent'] as string | undefined,
      });
    });

    next();
  };
}

// =============================================================================
// EXPORT
// =============================================================================

export type { LogLevel, LogContext, LogEntry };
export { Logger };

export default logger;
