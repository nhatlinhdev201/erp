// src/lib/monitoring/sentry.ts
// Error tracking integration for L-ERP MRP System
// Uses Sentry when configured, falls back to console logging

import { logger } from "./logger";

type SeverityLevel = "fatal" | "error" | "warning" | "log" | "info" | "debug";

interface Breadcrumb {
  type?: string;
  category?: string;
  message?: string;
  data?: Record<string, unknown>;
  level?: SeverityLevel;
  timestamp?: number;
}

interface User {
  id: string;
  email?: string;
  name?: string;
}

const SENTRY_DSN = process.env.SENTRY_DSN;

// Dynamic Sentry import - only loads if installed and configured
let Sentry: typeof import("@sentry/nextjs") | null = null;

export async function initSentry() {
  if (!SENTRY_DSN) {
    logger.info("Sentry not configured. Using console logging.");
    return;
  }

  try {
    Sentry = await import("@sentry/nextjs");
    Sentry.init({
      dsn: SENTRY_DSN,
      environment: process.env.NODE_ENV || "development",
      release: process.env.npm_package_version || "0.1.0",
      tracesSampleRate: process.env.NODE_ENV === "production" ? 0.2 : 1.0,
      debug: process.env.NODE_ENV !== "production",
      integrations: [],
    });
    logger.info("Sentry initialized successfully.");
  } catch {
    logger.warn("Sentry package not available. Using console logging.");
    Sentry = null;
  }
}

// Capture custom errors
export function captureError(
  error: Error,
  context?: Record<string, unknown>
) {
  if (Sentry) {
    Sentry.captureException(error, {
      extra: context,
    });
  }

  logger.error("Error captured", {
    error: error.message,
    stack: error.stack,
    ...context
  });
}

// Capture messages
export function captureMessage(
  message: string,
  level: SeverityLevel = "info"
) {
  if (Sentry) {
    Sentry.captureMessage(message, level as "fatal" | "error" | "warning" | "log" | "info" | "debug");
  }

  switch (level) {
    case "error":
    case "fatal":
      logger.error(message);
      break;
    case "warning":
      logger.warn(message);
      break;
    default:
      logger.info(message);
  }
}

// Set user context
export function setUser(user: User | null) {
  if (Sentry) {
    Sentry.setUser(user ? { id: user.id, email: user.email, username: user.name } : null);
  }
  if (user) {
    logger.debug("User context set", { userId: user.id });
  }
}

// Add breadcrumb
export function addBreadcrumb(breadcrumb: Breadcrumb) {
  if (Sentry) {
    Sentry.addBreadcrumb({
      type: breadcrumb.type,
      category: breadcrumb.category,
      message: breadcrumb.message,
      data: breadcrumb.data,
      level: breadcrumb.level,
      timestamp: breadcrumb.timestamp,
    });
  }
  logger.debug("Breadcrumb", {
    category: breadcrumb.category,
    message: breadcrumb.message,
  });
}

// Wrap async function with error capturing
export function withErrorCapture<T extends (...args: unknown[]) => Promise<unknown>>(
  fn: T,
  context?: Record<string, unknown>
): T {
  return (async (...args: unknown[]) => {
    try {
      return await fn(...args);
    } catch (error) {
      captureError(error as Error, {
        ...context,
        functionName: fn.name,
      });
      throw error;
    }
  }) as T;
}
