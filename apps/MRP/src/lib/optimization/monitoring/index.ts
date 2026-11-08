// =============================================================================
// L-ERP MRP - PRODUCTION MONITORING MODULE
// Metrics collection, alerting, performance tracking
// =============================================================================

// =============================================================================
// TYPES
// =============================================================================

import { logger } from '@/lib/logger';

export interface Metric {
  name: string;
  value: number;
  timestamp: number;
  tags?: Record<string, string>;
  type: 'counter' | 'gauge' | 'histogram' | 'summary';
}

export interface Alert {
  id: string;
  name: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  message: string;
  timestamp: number;
  resolved?: boolean;
  resolvedAt?: number;
}

export interface PerformanceEntry {
  operation: string;
  duration: number;
  timestamp: number;
  success: boolean;
  metadata?: Record<string, any>;
}

// =============================================================================
// METRICS COLLECTOR
// =============================================================================

class MetricsCollector {
  private metrics: Map<string, Metric[]> = new Map();
  private counters: Map<string, number> = new Map();
  private gauges: Map<string, number> = new Map();
  private histograms: Map<string, number[]> = new Map();
  private maxHistorySize = 1000;

  // Counter operations
  increment(name: string, value = 1, tags?: Record<string, string>): void {
    const key = this.buildKey(name, tags);
    const current = this.counters.get(key) || 0;
    this.counters.set(key, current + value);
    this.record({ name, value: current + value, timestamp: Date.now(), tags, type: 'counter' });
  }

  // Gauge operations
  setGauge(name: string, value: number, tags?: Record<string, string>): void {
    const key = this.buildKey(name, tags);
    this.gauges.set(key, value);
    this.record({ name, value, timestamp: Date.now(), tags, type: 'gauge' });
  }

  // Histogram operations
  recordHistogram(name: string, value: number, tags?: Record<string, string>): void {
    const key = this.buildKey(name, tags);
    const values = this.histograms.get(key) || [];
    values.push(value);
    
    // Keep only last N values
    if (values.length > this.maxHistorySize) {
      values.shift();
    }
    
    this.histograms.set(key, values);
    this.record({ name, value, timestamp: Date.now(), tags, type: 'histogram' });
  }

  // Get histogram percentiles
  getPercentiles(name: string, percentiles: number[], tags?: Record<string, string>): Record<string, number> {
    const key = this.buildKey(name, tags);
    const values = this.histograms.get(key) || [];
    
    if (values.length === 0) {
      return percentiles.reduce((acc, p) => ({ ...acc, [`p${p}`]: 0 }), {});
    }
    
    const sorted = [...values].sort((a, b) => a - b);
    
    return percentiles.reduce((acc, p) => {
      const index = Math.ceil((p / 100) * sorted.length) - 1;
      return { ...acc, [`p${p}`]: sorted[Math.max(0, index)] };
    }, {});
  }

  // Timer helper
  startTimer(name: string, tags?: Record<string, string>): () => number {
    const start = performance.now();
    return () => {
      const duration = performance.now() - start;
      this.recordHistogram(name, duration, tags);
      return duration;
    };
  }

  // Get all metrics
  getMetrics(): Map<string, Metric[]> {
    return new Map(this.metrics);
  }

  // Get summary
  getSummary(): Record<string, any> {
    const summary: Record<string, any> = {
      counters: Object.fromEntries(this.counters),
      gauges: Object.fromEntries(this.gauges),
      histograms: {},
    };

    Array.from(this.histograms.entries()).forEach(([key, values]) => {
      if (values.length > 0) {
        const sorted = [...values].sort((a, b) => a - b);
        summary.histograms[key] = {
          count: values.length,
          min: Math.min(...values),
          max: Math.max(...values),
          avg: values.reduce((a, b) => a + b, 0) / values.length,
          p50: sorted[Math.floor(sorted.length * 0.5)],
          p95: sorted[Math.floor(sorted.length * 0.95)],
          p99: sorted[Math.floor(sorted.length * 0.99)],
        };
      }
    });

    return summary;
  }

  // Reset all metrics
  reset(): void {
    this.metrics.clear();
    this.counters.clear();
    this.gauges.clear();
    this.histograms.clear();
  }

  private buildKey(name: string, tags?: Record<string, string>): string {
    if (!tags) return name;
    const tagStr = Object.entries(tags)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`)
      .join(',');
    return `${name}{${tagStr}}`;
  }

  private record(metric: Metric): void {
    const key = this.buildKey(metric.name, metric.tags);
    const history = this.metrics.get(key) || [];
    history.push(metric);
    
    if (history.length > this.maxHistorySize) {
      history.shift();
    }
    
    this.metrics.set(key, history);
  }
}

// Singleton instance
export const metrics = new MetricsCollector();

// =============================================================================
// ALERT MANAGER
// =============================================================================

export interface AlertRule {
  name: string;
  condition: () => boolean | Promise<boolean>;
  severity: Alert['severity'];
  message: string | (() => string);
  cooldown?: number; // Minimum time between alerts (ms)
  autoResolve?: boolean;
}

class AlertManager {
  private alerts: Map<string, Alert> = new Map();
  private rules: AlertRule[] = [];
  private lastAlertTime: Map<string, number> = new Map();
  private handlers: Array<(alert: Alert) => void> = [];

  addRule(rule: AlertRule): void {
    this.rules.push(rule);
  }

  addHandler(handler: (alert: Alert) => void): void {
    this.handlers.push(handler);
  }

  async checkRules(): Promise<void> {
    for (const rule of this.rules) {
      const now = Date.now();
      const lastAlert = this.lastAlertTime.get(rule.name) || 0;
      const cooldown = rule.cooldown || 60000;

      if (now - lastAlert < cooldown) continue;

      try {
        const triggered = await rule.condition();
        const existingAlert = this.alerts.get(rule.name);

        if (triggered && !existingAlert?.resolved) {
          if (!existingAlert) {
            const alert: Alert = {
              id: `${rule.name}-${now}`,
              name: rule.name,
              severity: rule.severity,
              message: typeof rule.message === 'function' ? rule.message() : rule.message,
              timestamp: now,
            };

            this.alerts.set(rule.name, alert);
            this.lastAlertTime.set(rule.name, now);
            this.notify(alert);
          }
        } else if (!triggered && existingAlert && !existingAlert.resolved && rule.autoResolve) {
          existingAlert.resolved = true;
          existingAlert.resolvedAt = now;
          this.notify(existingAlert);
        }
      } catch (error) {
        logger.logError(error instanceof Error ? error : new Error(String(error)), { context: 'monitoring', operation: 'checkAlertRule', ruleName: rule.name });
      }
    }
  }

  resolveAlert(name: string): void {
    const alert = this.alerts.get(name);
    if (alert && !alert.resolved) {
      alert.resolved = true;
      alert.resolvedAt = Date.now();
      this.notify(alert);
    }
  }

  getActiveAlerts(): Alert[] {
    return Array.from(this.alerts.values()).filter(a => !a.resolved);
  }

  getAllAlerts(): Alert[] {
    return Array.from(this.alerts.values());
  }

  private notify(alert: Alert): void {
    for (const handler of this.handlers) {
      try {
        handler(alert);
      } catch (error) {
        logger.logError(error instanceof Error ? error : new Error(String(error)), { context: 'monitoring', operation: 'alertHandler' });
      }
    }
  }
}

export const alertManager = new AlertManager();

// =============================================================================
// PERFORMANCE TRACKER
// =============================================================================

class PerformanceTracker {
  private entries: PerformanceEntry[] = [];
  private maxEntries = 10000;
  private slowThreshold: Record<string, number> = {};

  setSlowThreshold(operation: string, threshold: number): void {
    this.slowThreshold[operation] = threshold;
  }

  record(entry: Omit<PerformanceEntry, 'timestamp'>): void {
    const fullEntry: PerformanceEntry = {
      ...entry,
      timestamp: Date.now(),
    };

    this.entries.push(fullEntry);
    
    if (this.entries.length > this.maxEntries) {
      this.entries.shift();
    }

    // Track in metrics
    metrics.recordHistogram(`operation_duration`, entry.duration, { operation: entry.operation });
    metrics.increment(`operation_${entry.success ? 'success' : 'failure'}`, 1, { operation: entry.operation });

    // Check for slow operations
    const threshold = this.slowThreshold[entry.operation] || 1000;
    if (entry.duration > threshold) {
      logger.warn(`[SLOW] ${entry.operation}: ${entry.duration.toFixed(2)}ms (threshold: ${threshold}ms)`, { context: 'monitoring' });
      metrics.increment('slow_operations', 1, { operation: entry.operation });
    }
  }

  async track<T>(operation: string, fn: () => Promise<T>, metadata?: Record<string, any>): Promise<T> {
    const start = performance.now();
    let success = true;

    try {
      return await fn();
    } catch (error) {
      success = false;
      throw error;
    } finally {
      this.record({
        operation,
        duration: performance.now() - start,
        success,
        metadata,
      });
    }
  }

  getStats(operation?: string, timeRange?: { from: number; to: number }): {
    count: number;
    successRate: number;
    avgDuration: number;
    p50: number;
    p95: number;
    p99: number;
    slowCount: number;
  } {
    let filtered = this.entries;

    if (operation) {
      filtered = filtered.filter(e => e.operation === operation);
    }

    if (timeRange) {
      filtered = filtered.filter(e => e.timestamp >= timeRange.from && e.timestamp <= timeRange.to);
    }

    if (filtered.length === 0) {
      return { count: 0, successRate: 0, avgDuration: 0, p50: 0, p95: 0, p99: 0, slowCount: 0 };
    }

    const durations = filtered.map(e => e.duration).sort((a, b) => a - b);
    const successCount = filtered.filter(e => e.success).length;
    const threshold = operation ? this.slowThreshold[operation] || 1000 : 1000;
    const slowCount = filtered.filter(e => e.duration > threshold).length;

    return {
      count: filtered.length,
      successRate: (successCount / filtered.length) * 100,
      avgDuration: durations.reduce((a, b) => a + b, 0) / durations.length,
      p50: durations[Math.floor(durations.length * 0.5)],
      p95: durations[Math.floor(durations.length * 0.95)],
      p99: durations[Math.floor(durations.length * 0.99)],
      slowCount,
    };
  }

  getRecentSlow(limit = 10): PerformanceEntry[] {
    return this.entries
      .filter(e => {
        const threshold = this.slowThreshold[e.operation] || 1000;
        return e.duration > threshold;
      })
      .slice(-limit)
      .reverse();
  }

  clear(): void {
    this.entries = [];
  }
}

export const performanceTracker = new PerformanceTracker();

// =============================================================================
// SYSTEM METRICS COLLECTOR
// =============================================================================

export function collectSystemMetrics(): void {
  // Memory usage
  if (typeof process !== 'undefined') {
    const memUsage = process.memoryUsage();
    metrics.setGauge('memory_heap_used_bytes', memUsage.heapUsed);
    metrics.setGauge('memory_heap_total_bytes', memUsage.heapTotal);
    metrics.setGauge('memory_rss_bytes', memUsage.rss);
    metrics.setGauge('memory_external_bytes', memUsage.external);
  }

  // CPU usage (if available)
  if (typeof process !== 'undefined' && process.cpuUsage) {
    const cpuUsage = process.cpuUsage();
    metrics.setGauge('cpu_user_microseconds', cpuUsage.user);
    metrics.setGauge('cpu_system_microseconds', cpuUsage.system);
  }

  // Event loop lag
  const start = Date.now();
  setImmediate(() => {
    metrics.setGauge('event_loop_lag_ms', Date.now() - start);
  });
}

// =============================================================================
// DEFAULT ALERT RULES
// =============================================================================

export function setupDefaultAlerts(): void {
  // High error rate
  alertManager.addRule({
    name: 'high_error_rate',
    severity: 'error',
    condition: () => {
      const stats = performanceTracker.getStats();
      return stats.count > 100 && stats.successRate < 95;
    },
    message: () => {
      const stats = performanceTracker.getStats();
      return `High error rate detected: ${(100 - stats.successRate).toFixed(2)}%`;
    },
    cooldown: 300000, // 5 minutes
    autoResolve: true,
  });

  // Slow response times
  alertManager.addRule({
    name: 'slow_responses',
    severity: 'warning',
    condition: () => {
      const stats = performanceTracker.getStats();
      return stats.count > 50 && stats.p95 > 1000;
    },
    message: () => {
      const stats = performanceTracker.getStats();
      return `Slow response times: P95 = ${stats.p95.toFixed(0)}ms`;
    },
    cooldown: 300000,
    autoResolve: true,
  });

  // High memory usage
  alertManager.addRule({
    name: 'high_memory',
    severity: 'warning',
    condition: () => {
      if (typeof process === 'undefined') return false;
      const memUsage = process.memoryUsage();
      const heapUsedPercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;
      return heapUsedPercent > 85;
    },
    message: () => {
      const memUsage = process.memoryUsage();
      const heapUsedPercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;
      return `High memory usage: ${heapUsedPercent.toFixed(1)}% heap used`;
    },
    cooldown: 600000, // 10 minutes
    autoResolve: true,
  });
}

// =============================================================================
// PROMETHEUS FORMAT EXPORT
// =============================================================================

export function exportPrometheusMetrics(): string {
  const lines: string[] = [];
  const summary = metrics.getSummary();

  // Counters
  for (const [name, value] of Object.entries(summary.counters)) {
    lines.push(`# TYPE ${name} counter`);
    lines.push(`${name} ${value}`);
  }

  // Gauges
  for (const [name, value] of Object.entries(summary.gauges)) {
    lines.push(`# TYPE ${name} gauge`);
    lines.push(`${name} ${value}`);
  }

  // Histograms
  for (const [name, data] of Object.entries(summary.histograms as Record<string, any>)) {
    lines.push(`# TYPE ${name} histogram`);
    lines.push(`${name}_count ${data.count}`);
    lines.push(`${name}_sum ${data.avg * data.count}`);
    lines.push(`${name}_bucket{le="50"} ${data.p50}`);
    lines.push(`${name}_bucket{le="95"} ${data.p95}`);
    lines.push(`${name}_bucket{le="99"} ${data.p99}`);
  }

  return lines.join('\n');
}

// =============================================================================
// MONITORING MIDDLEWARE
// =============================================================================

export function createMonitoringMiddleware() {
  return async function monitoringMiddleware(
    req: Request,
    handler: () => Promise<Response>
  ): Promise<Response> {
    const startTime = performance.now();
    const url = new URL(req.url);
    const operation = `${req.method} ${url.pathname}`;
    
    let success = true;
    let status = 200;

    try {
      const response = await handler();
      status = response.status;
      success = status < 400;
      return response;
    } catch (error) {
      success = false;
      status = 500;
      throw error;
    } finally {
      const duration = performance.now() - startTime;
      
      performanceTracker.record({
        operation,
        duration,
        success,
        metadata: { status, method: req.method, path: url.pathname },
      });

      metrics.increment('http_requests_total', 1, {
        method: req.method,
        path: url.pathname,
        status: String(status),
      });
    }
  };
}

// =============================================================================
// START MONITORING
// =============================================================================

let monitoringInterval: NodeJS.Timeout | null = null;

export function startMonitoring(intervalMs = 30000): void {
  if (monitoringInterval) return;

  setupDefaultAlerts();

  monitoringInterval = setInterval(() => {
    collectSystemMetrics();
    alertManager.checkRules();
  }, intervalMs);
}

export function stopMonitoring(): void {
  if (monitoringInterval) {
    clearInterval(monitoringInterval);
    monitoringInterval = null;
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

export default {
  metrics,
  alertManager,
  performanceTracker,
  collectSystemMetrics,
  setupDefaultAlerts,
  exportPrometheusMetrics,
  createMonitoringMiddleware,
  startMonitoring,
  stopMonitoring,
};
