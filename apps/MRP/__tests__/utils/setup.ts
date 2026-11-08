// =============================================================================
// TEST SETUP & UTILITIES
// L-ERP MRP Test Suite
// =============================================================================

import '@testing-library/jest-dom';
import { vi } from 'vitest';

// =============================================================================
// GLOBAL MOCKS
// =============================================================================

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock fetch
global.fetch = vi.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ success: true, data: {} }),
  })
) as unknown as typeof fetch;

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock IntersectionObserver
class MockIntersectionObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}
Object.defineProperty(window, 'IntersectionObserver', {
  writable: true,
  value: MockIntersectionObserver,
});

// Mock ResizeObserver
class MockResizeObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}
Object.defineProperty(window, 'ResizeObserver', {
  writable: true,
  value: MockResizeObserver,
});

// =============================================================================
// PERFORMANCE HELPERS
// =============================================================================

export interface PerformanceMetrics {
  executionTime: number;
  memoryUsed: number;
  operationsPerSecond: number;
}

export const measurePerformance = async <T>(
  fn: () => T | Promise<T>,
  iterations: number = 1
): Promise<PerformanceMetrics> => {
  const startMemory = process.memoryUsage().heapUsed;
  const startTime = performance.now();

  for (let i = 0; i < iterations; i++) {
    await fn();
  }

  const endTime = performance.now();
  const endMemory = process.memoryUsage().heapUsed;

  const executionTime = endTime - startTime;
  const memoryUsed = endMemory - startMemory;
  const operationsPerSecond = iterations > 0 && executionTime > 0
    ? (iterations / executionTime) * 1000
    : 0;

  return {
    executionTime,
    memoryUsed,
    operationsPerSecond,
  };
};

export const expectPerformance = (
  metrics: PerformanceMetrics,
  thresholds: {
    maxExecutionTime?: number;
    maxMemoryUsed?: number;
    minOpsPerSecond?: number;
  }
) => {
  if (thresholds.maxExecutionTime) {
    expect(metrics.executionTime).toBeLessThan(thresholds.maxExecutionTime);
  }
  if (thresholds.maxMemoryUsed) {
    expect(metrics.memoryUsed).toBeLessThan(thresholds.maxMemoryUsed);
  }
  if (thresholds.minOpsPerSecond) {
    expect(metrics.operationsPerSecond).toBeGreaterThan(thresholds.minOpsPerSecond);
  }
};

export const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(Math.abs(bytes)) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export interface StressTestResult {
  success: boolean;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  errorRate: number;
  avgResponseTime: number;
  p95ResponseTime: number;
  requestsPerSecond: number;
  errors: any[];
}

export const runStressTest = async (
  fn: () => Promise<boolean>,
  concurrency: number,
  durationMs: number
): Promise<StressTestResult> => {
  const startTime = Date.now();
  const endTime = startTime + durationMs;

  let totalRequests = 0;
  let successfulRequests = 0;
  let failedRequests = 0;
  const errors: any[] = [];
  const responseTimes: number[] = [];

  const worker = async () => {
    while (Date.now() < endTime) {
      const reqStart = Date.now();
      try {
        totalRequests++;
        await fn();
        successfulRequests++;
      } catch (error) {
        failedRequests++;
        errors.push(error);
      }
      responseTimes.push(Date.now() - reqStart);
    }
  };

  await Promise.all(Array.from({ length: concurrency }, worker));

  const totalTimeSeconds = (Date.now() - startTime) / 1000;
  responseTimes.sort((a, b) => a - b);

  return {
    success: failedRequests === 0,
    totalRequests,
    successfulRequests,
    failedRequests,
    errorRate: (failedRequests / totalRequests) * 100,
    avgResponseTime: responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length,
    p95ResponseTime: responseTimes[Math.floor(responseTimes.length * 0.95)] || 0,
    requestsPerSecond: totalRequests / totalTimeSeconds,
    errors: errors.slice(0, 5), // Keep only first 5 errors
  };
};

export const expectStressTestResult = (
  result: StressTestResult,
  expectations: {
    maxErrorRate?: number;
    maxAvgResponseTime?: number;
    minRequestsPerSecond?: number;
  }
) => {
  if (expectations.maxErrorRate !== undefined) {
    expect(result.errorRate).toBeLessThanOrEqual(expectations.maxErrorRate);
  }
  if (expectations.maxAvgResponseTime !== undefined) {
    expect(result.avgResponseTime).toBeLessThanOrEqual(expectations.maxAvgResponseTime);
  }
  if (expectations.minRequestsPerSecond !== undefined) {
    expect(result.requestsPerSecond).toBeGreaterThanOrEqual(expectations.minRequestsPerSecond);
  }
};
