// =============================================================================
// ML ENGINE UNIT TESTS (FIXED)
// L-ERP MRP Test Suite
// =============================================================================

import { MLEngine } from '@/lib/ai/ml-engine';
import { 
  generateTimeSeriesData, 
  generateSeasonalData,
} from '../mocks/data-generators';
import { measurePerformance, expectPerformance } from '../utils/setup';

describe('MLEngine', () => {
  // ===========================================================================
  // STATISTICAL FUNCTIONS
  // ===========================================================================
  
  describe('Statistical Functions', () => {
    describe('standardDeviation', () => {
      it('should calculate correct standard deviation for simple dataset', () => {
        const data = [2, 4, 4, 4, 5, 5, 7, 9];
        const stdDev = MLEngine.standardDeviation(data);
        // Population std dev for [2,4,4,4,5,5,7,9] ≈ 2.0
        expect(stdDev).toBeCloseTo(2.0, 0);
      });

      it('should return 0 for identical values', () => {
        const data = [5, 5, 5, 5, 5];
        const stdDev = MLEngine.standardDeviation(data);
        expect(stdDev).toBe(0);
      });

      it('should handle single value', () => {
        const data = [42];
        const stdDev = MLEngine.standardDeviation(data);
        expect(stdDev).toBe(0);
      });

      it('should handle empty array', () => {
        const data: number[] = [];
        const stdDev = MLEngine.standardDeviation(data);
        expect(stdDev).toBe(0);
      });

      it('should handle large datasets efficiently', async () => {
        const data = Array.from({ length: 100000 }, () => Math.random() * 100);
        
        const metrics = await measurePerformance(() => {
          MLEngine.standardDeviation(data);
        }, 10);

        expectPerformance(metrics, {
          maxExecutionTime: 1000,
        });
      });
    });
  });

  // ===========================================================================
  // MOVING AVERAGES
  // ===========================================================================

  describe('Moving Averages', () => {
    describe('movingAverage', () => {
      it('should calculate correct simple moving average', () => {
        const data = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
        const sma = MLEngine.movingAverage(data, 3);
        
        expect(sma[0]).toBe(1);
        expect(sma[1]).toBe(2);
        expect(sma[2]).toBe(2); // (1+2+3)/3
        expect(sma[3]).toBe(3); // (2+3+4)/3
        expect(sma[9]).toBe(9); // (8+9+10)/3
      });

      it('should handle window size larger than data', () => {
        const data = [1, 2, 3];
        const sma = MLEngine.movingAverage(data, 5);
        
        expect(sma.length).toBe(3);
      });

      it('should preserve data length', () => {
        const data = generateTimeSeriesData(100).map(d => d.value);
        const sma = MLEngine.movingAverage(data, 7);
        
        expect(sma.length).toBe(data.length);
      });
    });

    describe('exponentialMovingAverage', () => {
      it('should calculate correct EMA', () => {
        const data = [10, 20, 30, 40, 50];
        const ema = MLEngine.exponentialMovingAverage(data, 0.5);
        
        expect(ema[0]).toBe(10);
        expect(ema[1]).toBe(15); // 0.5 * 20 + 0.5 * 10
        expect(ema.length).toBe(data.length);
      });

      it('should respond more to recent data with higher alpha', () => {
        const data = [10, 10, 10, 100, 100];
        const emaLow = MLEngine.exponentialMovingAverage(data, 0.1);
        const emaHigh = MLEngine.exponentialMovingAverage(data, 0.9);
        
        expect(emaHigh[4]).toBeGreaterThan(emaLow[4]);
      });
    });
  });

  // ===========================================================================
  // DEMAND FORECASTING
  // ===========================================================================

  describe('Demand Forecasting', () => {
    describe('doubleExponentialSmoothing', () => {
      it('should generate correct number of forecast periods', () => {
        const data = generateTimeSeriesData(30).map(d => d.value);
        const forecast = MLEngine.doubleExponentialSmoothing(data, 0.3, 0.1, 14);
        
        expect(forecast.length).toBe(14);
      });

      it('should return empty for insufficient data', () => {
        const data = [100];
        const forecast = MLEngine.doubleExponentialSmoothing(data, 0.3, 0.1, 7);
        
        expect(forecast.length).toBe(0);
      });

      it('should have decreasing confidence over time', () => {
        const data = generateTimeSeriesData(30).map(d => d.value);
        const forecast = MLEngine.doubleExponentialSmoothing(data, 0.3, 0.1, 14);
        
        for (let i = 1; i < forecast.length; i++) {
          expect(forecast[i].confidence).toBeLessThanOrEqual(forecast[i - 1].confidence);
        }
      });

      it('should capture upward trend', () => {
        const data = Array.from({ length: 30 }, (_, i) => 100 + i * 5);
        const forecast = MLEngine.doubleExponentialSmoothing(data, 0.3, 0.1, 7);
        
        expect(forecast[6].predicted).toBeGreaterThan(forecast[0].predicted);
      });

      it('should handle large datasets efficiently', async () => {
        const data = generateTimeSeriesData(365).map(d => d.value);
        
        const metrics = await measurePerformance(() => {
          MLEngine.doubleExponentialSmoothing(data, 0.3, 0.1, 30);
        }, 100);

        expectPerformance(metrics, {
          maxExecutionTime: 500,
          minOpsPerSecond: 100,
        });
      });
    });

    describe('detectSeasonality', () => {
      it('should return false for insufficient data', () => {
        const data = [1, 2, 3, 4, 5];
        const hasSeasonality = MLEngine.detectSeasonality(data, 7);
        
        expect(hasSeasonality).toBe(false);
      });

      it('should return boolean for valid data', () => {
        const data = generateSeasonalData(28, 100, 30, 7).map(d => d.value);
        const hasSeasonality = MLEngine.detectSeasonality(data, 7);
        
        expect(typeof hasSeasonality).toBe('boolean');
      });
    });

    describe('detectTrend', () => {
      it('should detect upward trend', () => {
        const data = Array.from({ length: 30 }, (_, i) => 100 + i * 5);
        const trend = MLEngine.detectTrend(data);
        
        expect(trend).toBe('UP');
      });

      it('should detect downward trend', () => {
        const data = Array.from({ length: 30 }, (_, i) => 200 - i * 5);
        const trend = MLEngine.detectTrend(data);
        
        expect(trend).toBe('DOWN');
      });

      it('should detect stable trend', () => {
        const data = Array.from({ length: 30 }, () => 100);
        const trend = MLEngine.detectTrend(data);
        
        expect(trend).toBe('STABLE');
      });

      it('should return STABLE for insufficient data', () => {
        const data = [100, 110];
        const trend = MLEngine.detectTrend(data);
        
        expect(trend).toBe('STABLE');
      });
    });

    describe('calculateForecastMetrics', () => {
      it('should calculate perfect accuracy for identical predictions', () => {
        const actual = [100, 110, 120, 130, 140];
        const predicted = [100, 110, 120, 130, 140];
        
        const metrics = MLEngine.calculateForecastMetrics(actual, predicted);
        
        expect(metrics.mape).toBe(0);
        expect(metrics.mae).toBe(0);
        expect(metrics.rmse).toBe(0);
        expect(metrics.accuracy).toBe(100);
      });

      it('should handle different length arrays', () => {
        const actual = [100, 110, 120];
        const predicted = [100, 110, 120, 130, 140];
        
        const metrics = MLEngine.calculateForecastMetrics(actual, predicted);
        
        expect(metrics.mape).toBe(0);
      });

      it('should return zero metrics for empty arrays', () => {
        const metrics = MLEngine.calculateForecastMetrics([], []);
        
        expect(metrics.mape).toBe(0);
        expect(metrics.accuracy).toBe(0);
      });

      it('should calculate non-zero error for different values', () => {
        const actual = [100, 100, 100];
        const predicted = [110, 90, 100];
        
        const metrics = MLEngine.calculateForecastMetrics(actual, predicted);
        
        expect(metrics.mae).toBeGreaterThan(0);
        expect(metrics.rmse).toBeGreaterThan(0);
      });
    });
  });

  // ===========================================================================
  // PREDICTIVE MAINTENANCE
  // ===========================================================================

  describe('Predictive Maintenance', () => {
    describe('calculateHealthScore', () => {
      it('should return high score for healthy equipment', () => {
        const sensors = [
          { sensorId: 's1', name: 'Temp', value: 50, unit: '°C', normalRange: { min: 40, max: 80 }, status: 'NORMAL' as const, timestamp: '' },
        ];
        
        const score = MLEngine.calculateHealthScore(sensors, [], 1000, 20000);
        
        expect(score).toBeGreaterThanOrEqual(90);
      });

      it('should deduct points for warning sensors', () => {
        const normalSensors = [
          { sensorId: 's1', name: 'Temp', value: 50, unit: '°C', normalRange: { min: 40, max: 80 }, status: 'NORMAL' as const, timestamp: '' },
        ];
        const warningSensors = [
          { sensorId: 's1', name: 'Temp', value: 75, unit: '°C', normalRange: { min: 40, max: 80 }, status: 'WARNING' as const, timestamp: '' },
        ];
        
        const normalScore = MLEngine.calculateHealthScore(normalSensors, [], 1000, 20000);
        const warningScore = MLEngine.calculateHealthScore(warningSensors, [], 1000, 20000);
        
        expect(warningScore).toBeLessThan(normalScore);
      });

      it('should deduct points for critical sensors', () => {
        const warningSensors = [
          { sensorId: 's1', name: 'Temp', value: 75, unit: '°C', normalRange: { min: 40, max: 80 }, status: 'WARNING' as const, timestamp: '' },
        ];
        const criticalSensors = [
          { sensorId: 's1', name: 'Temp', value: 95, unit: '°C', normalRange: { min: 40, max: 80 }, status: 'CRITICAL' as const, timestamp: '' },
        ];
        
        const warningScore = MLEngine.calculateHealthScore(warningSensors, [], 1000, 20000);
        const criticalScore = MLEngine.calculateHealthScore(criticalSensors, [], 1000, 20000);
        
        expect(criticalScore).toBeLessThan(warningScore);
      });

      it('should deduct points for high operating hours', () => {
        const sensors = [
          { sensorId: 's1', name: 'Temp', value: 50, unit: '°C', normalRange: { min: 40, max: 80 }, status: 'NORMAL' as const, timestamp: '' },
        ];
        
        const youngScore = MLEngine.calculateHealthScore(sensors, [], 5000, 20000);
        const oldScore = MLEngine.calculateHealthScore(sensors, [], 18000, 20000);
        
        expect(oldScore).toBeLessThan(youngScore);
      });

      it('should never return score outside 0-100', () => {
        const criticalSensors = [
          { sensorId: 's1', name: 'Temp', value: 95, unit: '°C', normalRange: { min: 40, max: 80 }, status: 'CRITICAL' as const, timestamp: '' },
          { sensorId: 's2', name: 'Vibration', value: 10, unit: 'mm/s', normalRange: { min: 0, max: 5 }, status: 'CRITICAL' as const, timestamp: '' },
          { sensorId: 's3', name: 'Current', value: 25, unit: 'A', normalRange: { min: 8, max: 18 }, status: 'CRITICAL' as const, timestamp: '' },
          { sensorId: 's4', name: 'Pressure', value: 8, unit: 'bar', normalRange: { min: 4, max: 6 }, status: 'CRITICAL' as const, timestamp: '' },
        ];
        const cmHistory = Array.from({ length: 10 }, (_, i) => ({
          id: `cm-${i}`,
          type: 'CM' as const,
          date: new Date(Date.now() - i * 86400000).toISOString().split('T')[0],
          description: 'CM',
        }));
        
        const score = MLEngine.calculateHealthScore(criticalSensors, cmHistory, 19500, 20000);
        
        expect(score).toBeGreaterThanOrEqual(0);
        expect(score).toBeLessThanOrEqual(100);
      });
    });

    describe('calculateFailureProbability', () => {
      it('should return low probability for healthy equipment', () => {
        const probability = MLEngine.calculateFailureProbability(90, 10, 30, []);
        
        expect(probability).toBeLessThan(30);
      });

      it('should return higher probability for degraded equipment', () => {
        const probability = MLEngine.calculateFailureProbability(30, 45, 30, []);
        
        expect(probability).toBeGreaterThan(40);
      });

      it('should increase probability for overdue PM', () => {
        const normalProbability = MLEngine.calculateFailureProbability(70, 25, 30, []);
        const overdueProbability = MLEngine.calculateFailureProbability(70, 45, 30, []);
        
        expect(overdueProbability).toBeGreaterThan(normalProbability);
      });

      it('should never exceed 100%', () => {
        const riskFactors = [
          { id: 'rf1', name: 'Risk 1', severity: 'CRITICAL' as const, contribution: 50, description: '', trend: 'WORSENING' as const },
          { id: 'rf2', name: 'Risk 2', severity: 'CRITICAL' as const, contribution: 50, description: '', trend: 'WORSENING' as const },
        ];
        const probability = MLEngine.calculateFailureProbability(10, 90, 30, riskFactors);
        
        expect(probability).toBeLessThanOrEqual(100);
      });
    });

    describe('predictFailureDate', () => {
      it('should return date string for critical equipment', () => {
        const failureDate = MLEngine.predictFailureDate(25, -0.5);
        
        expect(failureDate).toBeDefined();
        expect(typeof failureDate).toBe('string');
      });

      it('should return undefined for improving health', () => {
        const failureDate = MLEngine.predictFailureDate(50, 0.5);
        
        expect(failureDate).toBeUndefined();
      });

      it('should return undefined for stable health above threshold', () => {
        const failureDate = MLEngine.predictFailureDate(85, 0);
        
        expect(failureDate).toBeUndefined();
      });

      it('should return future date for degrading equipment', () => {
        const failureDate = MLEngine.predictFailureDate(60, -2);
        
        expect(failureDate).toBeDefined();
        expect(new Date(failureDate!).getTime()).toBeGreaterThan(Date.now());
      });
    });

    describe('getHealthStatus', () => {
      it('should return correct status for all ranges', () => {
        expect(MLEngine.getHealthStatus(95)).toBe('HEALTHY');
        expect(MLEngine.getHealthStatus(80)).toBe('HEALTHY');
        expect(MLEngine.getHealthStatus(79)).toBe('DEGRADED');
        expect(MLEngine.getHealthStatus(60)).toBe('DEGRADED');
        expect(MLEngine.getHealthStatus(59)).toBe('AT_RISK');
        expect(MLEngine.getHealthStatus(30)).toBe('AT_RISK');
        expect(MLEngine.getHealthStatus(29)).toBe('CRITICAL');
        expect(MLEngine.getHealthStatus(0)).toBe('CRITICAL');
      });
    });
  });

  // ===========================================================================
  // ANOMALY DETECTION
  // ===========================================================================

  describe('Anomaly Detection', () => {
    describe('detectAnomaliesZScore', () => {
      it('should detect obvious outliers', () => {
        const data = [10, 11, 10, 12, 10, 11, 100, 10, 11, 10];
        const anomalies = MLEngine.detectAnomaliesZScore(data, 2);
        
        expect(anomalies.length).toBeGreaterThan(0);
        expect(anomalies.some(a => a.value === 100)).toBe(true);
      });

      it('should return empty for uniform data', () => {
        const data = [100, 100, 100, 100, 100];
        const anomalies = MLEngine.detectAnomaliesZScore(data);
        
        expect(anomalies.length).toBe(0);
      });

      it('should respect threshold parameter', () => {
        const data = [10, 10, 10, 15, 10, 10, 20, 10];
        
        const strictAnomalies = MLEngine.detectAnomaliesZScore(data, 1.5);
        const lenientAnomalies = MLEngine.detectAnomaliesZScore(data, 3);
        
        expect(strictAnomalies.length).toBeGreaterThanOrEqual(lenientAnomalies.length);
      });
    });

    describe('detectAnomaliesIQR', () => {
      it('should detect outliers using IQR method', () => {
        const data = [1, 2, 3, 4, 5, 6, 7, 8, 9, 50];
        const anomalies = MLEngine.detectAnomaliesIQR(data);
        
        expect(anomalies.length).toBeGreaterThan(0);
        expect(anomalies.some(a => a.value === 50)).toBe(true);
      });

      it('should handle large datasets efficiently', async () => {
        const data = Array.from({ length: 10000 }, () => Math.random() * 100);
        data.push(500, -100);
        
        const metrics = await measurePerformance(() => {
          MLEngine.detectAnomaliesIQR(data);
        }, 100);

        expectPerformance(metrics, {
          maxExecutionTime: 500,
        });
      });
    });
  });

  // ===========================================================================
  // UTILITY FUNCTIONS
  // ===========================================================================

  describe('Utility Functions', () => {
    describe('isWithinDays', () => {
      it('should return true for recent dates', () => {
        const today = new Date().toISOString().split('T')[0];
        expect(MLEngine.isWithinDays(today, 7)).toBe(true);
      });

      it('should return false for old dates', () => {
        const oldDate = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
        expect(MLEngine.isWithinDays(oldDate, 7)).toBe(false);
      });
    });

    describe('addDays', () => {
      it('should add days correctly', () => {
        const date = new Date('2025-01-01');
        const result = MLEngine.addDays(date, 10);
        
        expect(result.getDate()).toBe(11);
        expect(result.getMonth()).toBe(0);
      });

      it('should handle month overflow', () => {
        const date = new Date('2025-01-25');
        const result = MLEngine.addDays(date, 10);
        
        expect(result.getMonth()).toBe(1);
        expect(result.getDate()).toBe(4);
      });
    });

    describe('getHealthStatusColor', () => {
      it('should return correct colors for all statuses', () => {
        expect(MLEngine.getHealthStatusColor('HEALTHY')).toContain('green');
        expect(MLEngine.getHealthStatusColor('DEGRADED')).toContain('yellow');
        expect(MLEngine.getHealthStatusColor('AT_RISK')).toContain('orange');
        expect(MLEngine.getHealthStatusColor('CRITICAL')).toContain('red');
      });
    });

    describe('getPriorityColor', () => {
      it('should return correct colors for all priorities', () => {
        expect(MLEngine.getPriorityColor('LOW')).toContain('gray');
        expect(MLEngine.getPriorityColor('MEDIUM')).toContain('blue');
        expect(MLEngine.getPriorityColor('HIGH')).toContain('orange');
        expect(MLEngine.getPriorityColor('CRITICAL')).toContain('red');
      });
    });
  });
});
