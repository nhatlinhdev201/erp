// =============================================================================
// L-ERP MRP - CLIENT-SIDE LOGGER
// Lightweight logger safe for 'use client' components
// Strips debug/info logs in production, keeps error/warn for observability
// =============================================================================

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const isProduction = typeof window !== 'undefined'
  && window.location?.hostname !== 'localhost'
  && window.location?.hostname !== '127.0.0.1';

const MIN_LEVEL: LogLevel = isProduction ? 'warn' : 'debug';

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[MIN_LEVEL];
}

function formatMessage(level: LogLevel, message: string): string {
  return `[${level.toUpperCase()}] ${message}`;
}

export const clientLogger = {
  debug(message: string, ...args: unknown[]): void {
    if (shouldLog('debug')) {
      console.debug(formatMessage('debug', message), ...args);
    }
  },

  info(message: string, ...args: unknown[]): void {
    if (shouldLog('info')) {
      console.info(formatMessage('info', message), ...args);
    }
  },

  warn(message: string, ...args: unknown[]): void {
    if (shouldLog('warn')) {
      console.warn(formatMessage('warn', message), ...args);
    }
  },

  error(message: string, error?: unknown): void {
    if (shouldLog('error')) {
      if (error instanceof Error) {
        console.error(formatMessage('error', message), {
          name: error.name,
          message: error.message,
          stack: error.stack,
        });
      } else if (error !== undefined) {
        console.error(formatMessage('error', message), error);
      } else {
        console.error(formatMessage('error', message));
      }
    }
  },
};

export default clientLogger;
