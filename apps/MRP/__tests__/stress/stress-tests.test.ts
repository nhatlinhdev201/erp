// =============================================================================
// STRESS TESTS
// L-ERP MRP Test Suite
// =============================================================================

import { MLEngine } from '@/lib/ai/ml-engine';
import { CustomerPortalEngine } from '@/lib/customer/customer-engine';
import { 
  generateTimeSeriesData, 
  generateBulkItems,
  generateBulkOrders,
  generateBulkEquipment,
  generateSensorReadings,
  generateRiskFactors,
  generateMaintenanceHistory
} from '../mocks/data-generators';
import { 
  runStressTest, 
  measurePerformance, 
  expectPerformance,
  expectStressTestResult,
  StressTestResult,
  PerformanceMetrics,
  formatBytes
} from '../utils/setup';

// =============================================================================
// STRESS TEST CONFIGURATION
// =============================================================================

const STRESS_TEST_CONFIG = {
  // Concurrency levels
  LOW_CONCURRENCY: 10,
  MEDIUM_CONCURRENCY: 50,
  HIGH_CONCURRENCY: 100,
  
  // Duration (ms)
  SHORT_DURATION: 1000,
  MEDIUM_DURATION: 5000,
  LONG_DURATION: 10000,
  
  // Data sizes
  SMALL_DATASET: 100,
  MEDIUM_DATASET: 1000,
  LARGE_DATASET: 10000,
  MASSIVE_DATASET: 100000,
  
  // Thresholds
  MAX_ERROR_RATE: 1, // 1%
  MAX_AVG_RESPONSE_TIME: 100, // ms
  MAX_P95_RESPONSE_TIME: 200, // ms
  MIN_RPS: 100, // requests per second
};

// =============================================================================
// ML ENGINE STRESS TESTS
// =============================================================================

describe('ML Engine Stress Tests', () => {
  describe('Forecasting Performance', () => {
    it('should handle high-frequency forecasting requests', async () => {
      const data = generateTimeSeriesData(365).map(d => d.value);
      
      const result = await runStressTest(
        async () => {
          MLEngine.doubleExponentialSmoothing(data, 0.3, 0.1, 30);
          return true;
        },
        STRESS_TEST_CONFIG.LOW_CONCURRENCY,
        STRESS_TEST_CONFIG.SHORT_DURATION
      );

      console.log('Forecasting Stress Test Results:', result);
      
      expectStressTestResult(result, {
        maxErrorRate: 0,
        maxAvgResponseTime: 50,
      });
    });

    it('should scale with increasing data size', async () => {
      const results: { size: number; metrics: PerformanceMetrics }[] = [];
      
      for (const size of [100, 500, 1000, 5000]) {
        const data = generateTimeSeriesData(size).map(d => d.value);
        
        const metrics = await measurePerformance(() => {
          MLEngine.doubleExponentialSmoothing(data, 0.3, 0.1, 30);
        }, 10);
        
        results.push({ size, metrics });
      }

      // Execution time should scale linearly (not exponentially)
      for (let i = 1; i < results.length; i++) {
        const timeRatio = results[i].metrics.executionTime / results[i - 1].metrics.executionTime;
        const sizeRatio = results[i].size / results[i - 1].size;
        
        // Time should not grow faster than O(n^2)
        expect(timeRatio).toBeLessThan(sizeRatio * sizeRatio);
      }

      console.log('Scaling Results:', results.map(r => ({
        size: r.size,
        time: `${r.metrics.executionTime.toFixed(2)}ms`,
        ops: `${r.metrics.operationsPerSecond.toFixed(0)} ops/s`
      })));
    });

    it('should maintain accuracy under load', async () => {
      const data = Array.from({ length: 100 }, (_, i) => 100 + i); // Linear trend
      let accuracySum = 0;
      let count = 0;
      
      await runStressTest(
        async () => {
          const forecast = MLEngine.doubleExponentialSmoothing(data, 0.3, 0.1, 7);
          // Check if forecast captures the upward trend
          if (forecast.length > 0 && forecast[6].predicted > forecast[0].predicted) {
            accuracySum += 1;
          }
          count++;
          return true;
        },
        STRESS_TEST_CONFIG.LOW_CONCURRENCY,
        STRESS_TEST_CONFIG.SHORT_DURATION
      );

      const accuracyRate = (accuracySum / count) * 100;
      expect(accuracyRate).toBeGreaterThan(90);
      console.log(`Accuracy under load: ${accuracyRate.toFixed(1)}%`);
    });
  });

  describe('Anomaly Detection Performance', () => {
    it('should handle large datasets efficiently', async () => {
      const testCases = [
        { size: STRESS_TEST_CONFIG.SMALL_DATASET, maxTime: 10 },
        { size: STRESS_TEST_CONFIG.MEDIUM_DATASET, maxTime: 50 },
        { size: STRESS_TEST_CONFIG.LARGE_DATASET, maxTime: 200 },
      ];

      for (const testCase of testCases) {
        const data = Array.from({ length: testCase.size }, () => Math.random() * 100);
        // Add some anomalies
        data[Math.floor(testCase.size / 2)] = 1000;
        
        const metrics = await measurePerformance(() => {
          MLEngine.detectAnomaliesZScore(data, 2.5);
        }, 10);

        console.log(`Z-Score Detection (n=${testCase.size}):`, {
          time: `${metrics.executionTime.toFixed(2)}ms`,
          memory: formatBytes(metrics.memoryUsed)
        });

        expect(metrics.executionTime).toBeLessThan(testCase.maxTime);
      }
    });

    it('should compare Z-Score vs IQR performance', async () => {
      const data = Array.from({ length: 10000 }, () => Math.random() * 100);
      
      const zScoreMetrics = await measurePerformance(() => {
        MLEngine.detectAnomaliesZScore(data);
      }, 100);

      const iqrMetrics = await measurePerformance(() => {
        MLEngine.detectAnomaliesIQR(data);
      }, 100);

      console.log('Anomaly Detection Comparison:', {
        'Z-Score': `${zScoreMetrics.executionTime.toFixed(2)}ms, ${zScoreMetrics.operationsPerSecond.toFixed(0)} ops/s`,
        'IQR': `${iqrMetrics.executionTime.toFixed(2)}ms, ${iqrMetrics.operationsPerSecond.toFixed(0)} ops/s`
      });

      // IQR is typically slower due to sorting
      expect(iqrMetrics.executionTime).toBeGreaterThan(0);
    });
  });

  describe('Health Score Calculation Performance', () => {
    it('should handle concurrent health calculations', async () => {
      const result = await runStressTest(
        async () => {
          const sensors = generateSensorReadings(6);
          const history = generateMaintenanceHistory(10);
          MLEngine.calculateHealthScore(sensors, history, 15000, 20000);
          return true;
        },
        STRESS_TEST_CONFIG.MEDIUM_CONCURRENCY,
        STRESS_TEST_CONFIG.SHORT_DURATION
      );

      console.log('Health Calculation Stress Results:', result);
      
      expectStressTestResult(result, {
        maxErrorRate: 0,
        minRequestsPerSecond: 500,
      });
    });

    it('should scale with equipment count', async () => {
      const equipmentCounts = [10, 50, 100, 500];
      
      for (const count of equipmentCounts) {
        const equipment = generateBulkEquipment(count);
        
        const metrics = await measurePerformance(() => {
          equipment.forEach(() => {
            const sensors = generateSensorReadings(4);
            const history = generateMaintenanceHistory(5);
            MLEngine.calculateHealthScore(sensors, history, 10000, 20000);
          });
        }, 10);

        console.log(`Health Score for ${count} equipment:`, {
          totalTime: `${metrics.executionTime.toFixed(2)}ms`,
          perEquipment: `${(metrics.executionTime / count).toFixed(3)}ms`
        });
      }
    });
  });
});

// =============================================================================
// CUSTOMER PORTAL STRESS TESTS
// =============================================================================

describe('Customer Portal Stress Tests', () => {
  describe('Currency Formatting Performance', () => {
    it('should handle high-frequency currency formatting', async () => {
      const amounts = Array.from({ length: 1000 }, () => Math.random() * 10000000000);
      
      const result = await runStressTest(
        async () => {
          amounts.forEach(amount => CustomerPortalEngine.formatCurrency(amount));
          return true;
        },
        STRESS_TEST_CONFIG.LOW_CONCURRENCY,
        STRESS_TEST_CONFIG.SHORT_DURATION
      );

      expectStressTestResult(result, {
        maxErrorRate: 0,
        minRequestsPerSecond: 100,
      });
    });

    it('should format massive invoice lists', async () => {
      const invoiceCount = 10000;
      const invoices = Array.from({ length: invoiceCount }, () => ({
        subtotal: Math.random() * 100000000,
        tax: Math.random() * 10000000,
        total: Math.random() * 110000000,
      }));
      
      const metrics = await measurePerformance(() => {
        invoices.forEach(inv => {
          CustomerPortalEngine.formatCurrency(inv.subtotal);
          CustomerPortalEngine.formatCurrency(inv.tax);
          CustomerPortalEngine.formatCurrency(inv.total);
        });
      }, 10);

      console.log(`Format ${invoiceCount * 3} amounts:`, {
        time: `${metrics.executionTime.toFixed(2)}ms`,
        perAmount: `${(metrics.executionTime / (invoiceCount * 3)).toFixed(4)}ms`
      });

      // Should complete in reasonable time
      expect(metrics.executionTime).toBeLessThan(1000);
    });
  });

  describe('Date Calculations Performance', () => {
    it('should handle bulk due date calculations', async () => {
      const dates = Array.from({ length: 10000 }, () => {
        const offset = (Math.random() - 0.3) * 30 * 86400000; // -9 to +21 days
        return new Date(Date.now() + offset).toISOString();
      });
      
      const metrics = await measurePerformance(() => {
        dates.forEach(date => CustomerPortalEngine.getDaysUntilDue(date));
      }, 10);

      console.log('Due Date Calculation Performance:', {
        total: `${metrics.executionTime.toFixed(2)}ms`,
        perCalculation: `${(metrics.executionTime / 10000).toFixed(4)}ms`
      });

      expect(metrics.executionTime).toBeLessThan(500);
    });
  });

  describe('Order Progress Calculation Performance', () => {
    it('should handle complex order calculations', async () => {
      const orders = Array.from({ length: 1000 }, () => ({
        items: Array.from({ length: Math.floor(Math.random() * 20) + 1 }, () => ({
          quantity: Math.floor(Math.random() * 100) + 1,
          producedQty: Math.floor(Math.random() * 100),
        })),
      }));
      
      const metrics = await measurePerformance(() => {
        orders.forEach(order => CustomerPortalEngine.calculateOrderProgress(order.items as any));
      }, 10);

      console.log('Order Progress Calculation:', {
        totalOrders: orders.length,
        totalItems: orders.reduce((s, o) => s + o.items.length, 0),
        time: `${metrics.executionTime.toFixed(2)}ms`
      });

      expect(metrics.executionTime).toBeLessThan(500);
    });
  });
});

// =============================================================================
// MEMORY STRESS TESTS
// =============================================================================

describe('Memory Stress Tests', () => {
  describe('Large Dataset Memory Usage', () => {
    it('should not leak memory during repeated operations', async () => {
      const initialMemory = process.memoryUsage().heapUsed;
      
      // Perform many operations
      for (let i = 0; i < 100; i++) {
        const data = generateTimeSeriesData(1000).map(d => d.value);
        MLEngine.doubleExponentialSmoothing(data, 0.3, 0.1, 30);
        MLEngine.detectAnomaliesZScore(data);
        MLEngine.detectAnomaliesIQR(data);
      }

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryGrowth = finalMemory - initialMemory;

      console.log('Memory Growth:', formatBytes(memoryGrowth));
      
      // Memory should not grow excessively (< 50MB for 100 iterations)
      expect(memoryGrowth).toBeLessThan(50 * 1024 * 1024);
    });

    it('should handle massive time series data', async () => {
      const massiveData = generateTimeSeriesData(365 * 5); // 5 years of daily data
      const values = massiveData.map(d => d.value);
      
      const metrics = await measurePerformance(() => {
        MLEngine.doubleExponentialSmoothing(values, 0.3, 0.1, 90);
      }, 5);

      console.log('Massive Dataset (5 years daily):', {
        dataPoints: values.length,
        time: `${metrics.executionTime.toFixed(2)}ms`,
        memory: formatBytes(metrics.memoryUsed)
      });

      // Should complete in reasonable time
      expect(metrics.executionTime).toBeLessThan(1000);
    });
  });

  describe('Concurrent Memory Usage', () => {
    it('should handle concurrent calculations without memory issues', async () => {
      const initialMemory = process.memoryUsage().heapUsed;
      
      const promises = Array.from({ length: 100 }, async () => {
        const data = generateTimeSeriesData(500).map(d => d.value);
        MLEngine.doubleExponentialSmoothing(data, 0.3, 0.1, 14);
        return true;
      });

      await Promise.all(promises);

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryGrowth = finalMemory - initialMemory;

      console.log('Concurrent Memory Usage:', formatBytes(memoryGrowth));
      
      // Memory should stay reasonable
      expect(memoryGrowth).toBeLessThan(100 * 1024 * 1024);
    });
  });
});

// =============================================================================
// PERFORMANCE BENCHMARKS
// =============================================================================

describe('Performance Benchmarks', () => {
  const benchmarkResults: { name: string; result: string }[] = [];

  afterAll(() => {
    console.log('\n========================================');
    console.log('PERFORMANCE BENCHMARK SUMMARY');
    console.log('========================================');
    benchmarkResults.forEach(({ name, result }) => {
      console.log(`${name}: ${result}`);
    });
    console.log('========================================\n');
  });

  it('Benchmark: Moving Average (1000 points)', async () => {
    const data = generateTimeSeriesData(1000).map(d => d.value);
    
    const metrics = await measurePerformance(() => {
      MLEngine.movingAverage(data, 7);
    }, 1000);

    benchmarkResults.push({
      name: 'Moving Average (1000 pts)',
      result: `${metrics.operationsPerSecond.toFixed(0)} ops/s`
    });

    expect(metrics.operationsPerSecond).toBeGreaterThan(1000);
  });

  it('Benchmark: EMA (1000 points)', async () => {
    const data = generateTimeSeriesData(1000).map(d => d.value);
    
    const metrics = await measurePerformance(() => {
      MLEngine.exponentialMovingAverage(data, 0.3);
    }, 1000);

    benchmarkResults.push({
      name: 'EMA (1000 pts)',
      result: `${metrics.operationsPerSecond.toFixed(0)} ops/s`
    });

    expect(metrics.operationsPerSecond).toBeGreaterThan(1000);
  });

  it('Benchmark: Double Exponential Smoothing (365 days)', async () => {
    const data = generateTimeSeriesData(365).map(d => d.value);
    
    const metrics = await measurePerformance(() => {
      MLEngine.doubleExponentialSmoothing(data, 0.3, 0.1, 30);
    }, 100);

    benchmarkResults.push({
      name: 'DES Forecast (365 days)',
      result: `${metrics.operationsPerSecond.toFixed(0)} ops/s`
    });

    expect(metrics.operationsPerSecond).toBeGreaterThan(100);
  });

  it('Benchmark: Seasonality Detection', async () => {
    const data = generateTimeSeriesData(365).map(d => d.value);
    
    const metrics = await measurePerformance(() => {
      MLEngine.detectSeasonality(data, 7);
    }, 100);

    benchmarkResults.push({
      name: 'Seasonality Detection',
      result: `${metrics.operationsPerSecond.toFixed(0)} ops/s`
    });

    expect(metrics.operationsPerSecond).toBeGreaterThan(100);
  });

  it('Benchmark: Health Score Calculation', async () => {
    const metrics = await measurePerformance(() => {
      const sensors = generateSensorReadings(6);
      const history = generateMaintenanceHistory(10);
      MLEngine.calculateHealthScore(sensors, history, 15000, 20000);
    }, 1000);

    benchmarkResults.push({
      name: 'Health Score Calculation',
      result: `${metrics.operationsPerSecond.toFixed(0)} ops/s`
    });

    expect(metrics.operationsPerSecond).toBeGreaterThan(500);
  });

  it('Benchmark: Z-Score Anomaly Detection (10000 points)', async () => {
    const data = Array.from({ length: 10000 }, () => Math.random() * 100);
    
    const metrics = await measurePerformance(() => {
      MLEngine.detectAnomaliesZScore(data);
    }, 100);

    benchmarkResults.push({
      name: 'Z-Score Detection (10K pts)',
      result: `${metrics.operationsPerSecond.toFixed(0)} ops/s`
    });

    expect(metrics.operationsPerSecond).toBeGreaterThan(50);
  });

  it('Benchmark: Currency Formatting (10000 amounts)', async () => {
    const amounts = Array.from({ length: 10000 }, () => Math.random() * 10000000000);
    
    const metrics = await measurePerformance(() => {
      amounts.forEach(a => CustomerPortalEngine.formatCurrency(a));
    }, 10);

    benchmarkResults.push({
      name: 'Currency Format (10K)',
      result: `${(10000 / metrics.executionTime * 1000).toFixed(0)} ops/s`
    });
  });
});
