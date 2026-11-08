// =============================================================================
// L-ERP MRP - PERFORMANCE UTILITIES
// Optimization helpers, memoization, lazy loading, and monitoring
// =============================================================================

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

// =============================================================================
// DEBOUNCE & THROTTLE
// =============================================================================

/**
 * Debounce a function
 * @param fn Function to debounce
 * @param delay Delay in milliseconds
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;

  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Throttle a function
 * @param fn Function to throttle
 * @param limit Time limit in milliseconds
 */
export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * React hook for debounced value
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

/**
 * React hook for debounced callback
 */
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  return useCallback(
    debounce((...args: Parameters<T>) => callbackRef.current(...args), delay) as T,
    [delay]
  ) as T;
}

// =============================================================================
// MEMOIZATION
// =============================================================================

/**
 * Simple memoize function with LRU cache
 */
export function memoize<T extends (...args: any[]) => any>(
  fn: T,
  options: { maxSize?: number; ttl?: number } = {}
): T {
  const { maxSize = 100, ttl = 0 } = options;
  const cache = new Map<string, { value: ReturnType<T>; timestamp: number }>();

  return ((...args: Parameters<T>): ReturnType<T> => {
    const key = JSON.stringify(args);
    const now = Date.now();

    // Check cache
    if (cache.has(key)) {
      const cached = cache.get(key)!;
      if (!ttl || now - cached.timestamp < ttl) {
        return cached.value;
      }
    }

    // Calculate and cache
    const result = fn(...args);
    cache.set(key, { value: result, timestamp: now });

    // LRU eviction
    if (cache.size > maxSize) {
      const firstKey = cache.keys().next().value;
      if (firstKey !== undefined) {
        cache.delete(firstKey);
      }
    }

    return result;
  }) as T;
}

/**
 * Deep comparison for memoization
 */
export function deepEqual(a: any, b: any): boolean {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (typeof a !== typeof b) return false;

  if (Array.isArray(a)) {
    if (!Array.isArray(b) || a.length !== b.length) return false;
    return a.every((item, index) => deepEqual(item, b[index]));
  }

  if (typeof a === 'object') {
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    if (keysA.length !== keysB.length) return false;
    return keysA.every(key => deepEqual(a[key], b[key]));
  }

  return false;
}

// =============================================================================
// LAZY LOADING
// =============================================================================

/**
 * Intersection Observer hook for lazy loading
 */
export function useIntersectionObserver(
  options: IntersectionObserverInit = {}
): [React.RefObject<HTMLElement>, boolean] {
  const ref = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true);
        observer.disconnect();
      }
    }, options);

    observer.observe(element);
    return () => observer.disconnect();
  }, [options]);

  return [ref as React.RefObject<HTMLElement>, isVisible];
}

/**
 * Virtual list hook for rendering large lists
 */
export function useVirtualList<T>({
  items,
  itemHeight,
  containerHeight,
  overscan = 3,
}: {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
}) {
  const [scrollTop, setScrollTop] = useState(0);

  const totalHeight = items.length * itemHeight;
  const visibleCount = Math.ceil(containerHeight / itemHeight);

  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(items.length, startIndex + visibleCount + overscan * 2);

  const visibleItems = useMemo(
    () =>
      items.slice(startIndex, endIndex).map((item, index) => ({
        item,
        index: startIndex + index,
        style: {
          position: 'absolute' as const,
          top: (startIndex + index) * itemHeight,
          height: itemHeight,
          width: '100%',
        },
      })),
    [items, startIndex, endIndex, itemHeight]
  );

  const onScroll = useCallback((e: React.UIEvent<HTMLElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  return {
    visibleItems,
    totalHeight,
    onScroll,
  };
}

// =============================================================================
// REQUEST OPTIMIZATION
// =============================================================================

/**
 * Request deduplication
 */
export function createRequestDeduplicator<T>() {
  const pending = new Map<string, Promise<T>>();

  return async (key: string, request: () => Promise<T>): Promise<T> => {
    if (pending.has(key)) {
      return pending.get(key)!;
    }

    const promise = request().finally(() => {
      pending.delete(key);
    });

    pending.set(key, promise);
    return promise;
  };
}

/**
 * Request batching
 */
export function createBatcher<K, V>(
  batchFn: (keys: K[]) => Promise<Map<K, V>>,
  options: { maxBatchSize?: number; delay?: number } = {}
) {
  const { maxBatchSize = 50, delay = 10 } = options;

  let batch: K[] = [];
  let timeout: NodeJS.Timeout | null = null;
  let resolvers: Map<K, { resolve: (v: V) => void; reject: (e: Error) => void }> = new Map();

  const flush = async () => {
    const currentBatch = batch;
    const currentResolvers = resolvers;
    batch = [];
    resolvers = new Map();
    timeout = null;

    try {
      const results = await batchFn(currentBatch);
      currentResolvers.forEach((resolver, key) => {
        if (results.has(key)) {
          resolver.resolve(results.get(key)!);
        } else {
          resolver.reject(new Error(`No result for key: ${key}`));
        }
      });
    } catch (error) {
      currentResolvers.forEach(resolver => {
        resolver.reject(error as Error);
      });
    }
  };

  return (key: K): Promise<V> => {
    return new Promise((resolve, reject) => {
      batch.push(key);
      resolvers.set(key, { resolve, reject });

      if (batch.length >= maxBatchSize) {
        if (timeout) clearTimeout(timeout);
        flush();
      } else if (!timeout) {
        timeout = setTimeout(flush, delay);
      }
    });
  };
}

// =============================================================================
// PERFORMANCE MONITORING
// =============================================================================

interface PerformanceMetrics {
  componentName: string;
  renderCount: number;
  lastRenderTime: number;
  averageRenderTime: number;
  totalRenderTime: number;
}

const metricsMap = new Map<string, PerformanceMetrics>();

/**
 * Performance monitoring hook
 */
export function usePerformanceMonitor(componentName: string) {
  const renderCount = useRef(0);
  const startTime = useRef(performance.now());

  useEffect(() => {
    const endTime = performance.now();
    const renderTime = endTime - startTime.current;
    renderCount.current++;

    let metrics = metricsMap.get(componentName);
    if (!metrics) {
      metrics = {
        componentName,
        renderCount: 0,
        lastRenderTime: 0,
        averageRenderTime: 0,
        totalRenderTime: 0,
      };
      metricsMap.set(componentName, metrics);
    }

    metrics.renderCount = renderCount.current;
    metrics.lastRenderTime = renderTime;
    metrics.totalRenderTime += renderTime;
    metrics.averageRenderTime = metrics.totalRenderTime / metrics.renderCount;

    // Log slow renders
    if (renderTime > 16) {
      console.warn(
        `[Performance] Slow render: ${componentName} took ${renderTime.toFixed(2)}ms`
      );
    }
  });

  // Reset start time for next render
  startTime.current = performance.now();
}

/**
 * Get all performance metrics
 */
export function getPerformanceMetrics(): PerformanceMetrics[] {
  return Array.from(metricsMap.values());
}

/**
 * Clear performance metrics
 */
export function clearPerformanceMetrics(): void {
  metricsMap.clear();
}

/**
 * Web Vitals tracking
 */
export function trackWebVitals() {
  if (typeof window === 'undefined') return;

  // First Contentful Paint
  const fcpObserver = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (entry.name === 'first-contentful-paint') {
        console.log('[Vitals] FCP:', entry.startTime.toFixed(2), 'ms');
      }
    }
  });
  fcpObserver.observe({ type: 'paint', buffered: true });

  // Largest Contentful Paint
  const lcpObserver = new PerformanceObserver((list) => {
    const entries = list.getEntries();
    const lastEntry = entries[entries.length - 1];
    console.log('[Vitals] LCP:', lastEntry.startTime.toFixed(2), 'ms');
  });
  lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });

  // First Input Delay (approximation via long tasks)
  const fidObserver = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      console.log('[Vitals] Long Task:', entry.duration.toFixed(2), 'ms');
    }
  });
  fidObserver.observe({ type: 'longtask', buffered: true });

  // Cumulative Layout Shift
  let clsValue = 0;
  const clsObserver = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (!(entry as any).hadRecentInput) {
        clsValue += (entry as any).value;
      }
    }
    console.log('[Vitals] CLS:', clsValue.toFixed(4));
  });
  clsObserver.observe({ type: 'layout-shift', buffered: true });
}

// =============================================================================
// IMAGE OPTIMIZATION
// =============================================================================

/**
 * Generate srcset for responsive images
 */
export function generateSrcSet(
  src: string,
  widths: number[] = [320, 640, 960, 1280, 1920]
): string {
  return widths
    .map(width => {
      const url = new URL(src, window.location.origin);
      url.searchParams.set('w', width.toString());
      return `${url.toString()} ${width}w`;
    })
    .join(', ');
}

/**
 * Preload critical images
 */
export function preloadImage(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = src;
  });
}

// =============================================================================
// BUNDLE OPTIMIZATION
// =============================================================================

/**
 * Dynamic import with retry
 */
export async function dynamicImportWithRetry<T>(
  importFn: () => Promise<T>,
  retries = 3,
  delay = 1000
): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try {
      return await importFn();
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw new Error('Import failed after retries');
}

/**
 * Preload module
 */
export function preloadModule(moduleId: string): void {
  const link = document.createElement('link');
  link.rel = 'modulepreload';
  link.href = moduleId;
  document.head.appendChild(link);
}

// =============================================================================
// EXPORTS
// =============================================================================

export default {
  debounce,
  throttle,
  useDebounce,
  useDebouncedCallback,
  memoize,
  deepEqual,
  useIntersectionObserver,
  useVirtualList,
  createRequestDeduplicator,
  createBatcher,
  usePerformanceMonitor,
  getPerformanceMetrics,
  clearPerformanceMetrics,
  trackWebVitals,
  generateSrcSet,
  preloadImage,
  dynamicImportWithRetry,
  preloadModule,
};
