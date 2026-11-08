// =============================================================================
// MOCK DATA GENERATORS
// L-ERP MRP Test Suite
// =============================================================================

import { 
  DemandForecast, 
  EquipmentHealth, 
  TimeSeriesDataPoint,
  SensorReading,
  RiskFactor,
  MaintenanceEvent 
} from '@/lib/ai/ml-engine';

// =============================================================================
// RANDOM GENERATORS
// =============================================================================

export const randomInt = (min: number, max: number): number => 
  Math.floor(Math.random() * (max - min + 1)) + min;

export const randomFloat = (min: number, max: number, decimals: number = 2): number => 
  parseFloat((Math.random() * (max - min) + min).toFixed(decimals));

export const randomChoice = <T>(array: T[]): T => 
  array[Math.floor(Math.random() * array.length)];

export const randomDate = (start: Date, end: Date): Date => 
  new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));

export const randomString = (length: number): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  return Array.from({ length }, () => chars.charAt(Math.floor(Math.random() * chars.length))).join('');
};

// =============================================================================
// TIME SERIES DATA GENERATORS
// =============================================================================

export const generateTimeSeriesData = (
  days: number,
  baseValue: number = 100,
  variance: number = 20,
  trend: number = 0
): TimeSeriesDataPoint[] => {
  const data: TimeSeriesDataPoint[] = [];
  const now = new Date();
  
  for (let i = days; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    const trendValue = trend * (days - i);
    const noise = (Math.random() - 0.5) * variance;
    const value = Math.max(0, Math.round(baseValue + trendValue + noise));
    
    data.push({
      date: date.toISOString().split('T')[0],
      value,
    });
  }
  
  return data;
};

export const generateSeasonalData = (
  days: number,
  baseValue: number = 100,
  seasonalAmplitude: number = 30,
  period: number = 7
): TimeSeriesDataPoint[] => {
  const data: TimeSeriesDataPoint[] = [];
  const now = new Date();
  
  for (let i = days; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    const seasonal = Math.sin((2 * Math.PI * i) / period) * seasonalAmplitude;
    const noise = (Math.random() - 0.5) * 10;
    const value = Math.max(0, Math.round(baseValue + seasonal + noise));
    
    data.push({
      date: date.toISOString().split('T')[0],
      value,
    });
  }
  
  return data;
};

// =============================================================================
// EQUIPMENT DATA GENERATORS
// =============================================================================

export const generateSensorReadings = (count: number = 4): SensorReading[] => {
  const sensorTypes = [
    { name: 'Nhiệt độ động cơ', unit: '°C', min: 40, max: 80, normalMin: 40, normalMax: 75 },
    { name: 'Độ rung', unit: 'mm/s', min: 0, max: 6, normalMin: 0, normalMax: 4 },
    { name: 'Dòng điện', unit: 'A', min: 8, max: 20, normalMin: 8, normalMax: 18 },
    { name: 'Áp suất dầu', unit: 'bar', min: 3, max: 7, normalMin: 4, normalMax: 6 },
    { name: 'Tốc độ trục', unit: 'RPM', min: 1000, max: 3000, normalMin: 1200, normalMax: 2800 },
  ];
  
  return sensorTypes.slice(0, count).map((sensor, idx) => {
    const value = randomFloat(sensor.min, sensor.max);
    const isNormal = value >= sensor.normalMin && value <= sensor.normalMax;
    
    return {
      sensorId: `sensor-${idx + 1}`,
      name: sensor.name,
      value,
      unit: sensor.unit,
      normalRange: { min: sensor.normalMin, max: sensor.normalMax },
      status: isNormal ? 'NORMAL' : (value > sensor.normalMax * 1.1 ? 'CRITICAL' : 'WARNING'),
      timestamp: new Date().toISOString(),
    };
  });
};

export const generateMaintenanceHistory = (count: number = 5): MaintenanceEvent[] => {
  const events: MaintenanceEvent[] = [];
  const types: MaintenanceEvent['type'][] = ['PM', 'CM', 'INSPECTION'];
  
  for (let i = 0; i < count; i++) {
    const date = new Date();
    date.setDate(date.getDate() - randomInt(1, 180));
    
    events.push({
      id: `mh-${i + 1}`,
      type: randomChoice(types),
      date: date.toISOString().split('T')[0],
      description: `Bảo trì ${i + 1}`,
      cost: randomInt(1000000, 10000000),
      downtimeHours: randomInt(1, 8),
    });
  }
  
  return events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

export const generateRiskFactors = (count: number = 3): RiskFactor[] => {
  const riskTypes = [
    { name: 'Thông số sensor bất thường', description: 'Một số sensor đang ở mức cảnh báo' },
    { name: 'Tuổi thọ cao', description: 'Đã hoạt động trên 70% tuổi thọ dự kiến' },
    { name: 'Lịch sử sửa chữa', description: 'Có nhiều lần sửa chữa đột xuất gần đây' },
    { name: 'PM quá hạn', description: 'Đã quá hạn bảo trì định kỳ' },
    { name: 'Môi trường vận hành', description: 'Nhiệt độ/độ ẩm môi trường cao' },
  ];
  
  const severities: RiskFactor['severity'][] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
  const trends: RiskFactor['trend'][] = ['IMPROVING', 'STABLE', 'WORSENING'];
  
  return riskTypes.slice(0, count).map((risk, idx) => ({
    id: `rf-${idx + 1}`,
    name: risk.name,
    description: risk.description,
    severity: randomChoice(severities),
    contribution: randomInt(10, 40),
    trend: randomChoice(trends),
  }));
};

// =============================================================================
// BULK DATA GENERATORS FOR STRESS TESTS
// =============================================================================

export const generateBulkItems = (count: number): Array<{
  id: string;
  code: string;
  name: string;
  quantity: number;
  price: number;
}> => {
  return Array.from({ length: count }, (_, i) => ({
    id: `item-${i + 1}`,
    code: `ITEM-${String(i + 1).padStart(5, '0')}`,
    name: `Item ${i + 1}`,
    quantity: randomInt(1, 1000),
    price: randomInt(10000, 10000000),
  }));
};

export const generateBulkOrders = (count: number): Array<{
  id: string;
  orderNumber: string;
  items: number;
  total: number;
  status: string;
}> => {
  const statuses = ['PENDING', 'CONFIRMED', 'IN_PRODUCTION', 'SHIPPED', 'COMPLETED'];
  
  return Array.from({ length: count }, (_, i) => ({
    id: `order-${i + 1}`,
    orderNumber: `SO-${new Date().getFullYear()}-${String(i + 1).padStart(4, '0')}`,
    items: randomInt(1, 20),
    total: randomInt(1000000, 100000000),
    status: randomChoice(statuses),
  }));
};

export const generateBulkEquipment = (count: number): Array<{
  id: string;
  code: string;
  name: string;
  healthScore: number;
  status: string;
}> => {
  const statuses = ['HEALTHY', 'DEGRADED', 'AT_RISK', 'CRITICAL'];
  
  return Array.from({ length: count }, (_, i) => ({
    id: `eq-${i + 1}`,
    code: `EQ-${String(i + 1).padStart(3, '0')}`,
    name: `Equipment ${i + 1}`,
    healthScore: randomInt(20, 100),
    status: randomChoice(statuses),
  }));
};

// =============================================================================
// COMPLEX DATA GENERATORS
// =============================================================================

export const generateDemandForecastMock = (): DemandForecast => {
  const historicalData = generateTimeSeriesData(90, 100, 20, 0.5);
  const values = historicalData.map(d => d.value);
  const avgDailyDemand = Math.round(values.reduce((a, b) => a + b, 0) / values.length);
  
  return {
    itemId: 'item-001',
    itemCode: 'BRG-6205-2RS',
    itemName: 'Bearing 6205-2RS',
    currentStock: randomInt(100, 500),
    avgDailyDemand,
    historicalData,
    forecast: Array.from({ length: 14 }, (_, i) => ({
      date: new Date(Date.now() + (i + 1) * 86400000).toISOString().split('T')[0],
      predicted: avgDailyDemand + randomInt(-10, 10),
      lowerBound: avgDailyDemand - 20,
      upperBound: avgDailyDemand + 20,
      confidence: 95 - i * 2,
    })),
    metrics: {
      mape: randomFloat(5, 15),
      mae: randomFloat(5, 20),
      rmse: randomFloat(8, 25),
      accuracy: randomFloat(80, 95),
    },
    recommendations: [],
    seasonalityDetected: Math.random() > 0.5,
    trendDirection: randomChoice(['UP', 'DOWN', 'STABLE']),
  };
};

export const generateEquipmentHealthMock = (): EquipmentHealth => {
  const healthScore = randomInt(30, 100);
  const status = healthScore >= 80 ? 'HEALTHY' 
    : healthScore >= 60 ? 'DEGRADED' 
    : healthScore >= 30 ? 'AT_RISK' : 'CRITICAL';
  
  return {
    equipmentId: 'eq-001',
    equipmentCode: 'CNC-001',
    equipmentName: 'CNC Machine #1',
    healthScore,
    status,
    failureProbability: randomInt(5, 50),
    predictedFailureDate: healthScore < 50 
      ? new Date(Date.now() + randomInt(7, 30) * 86400000).toISOString().split('T')[0]
      : undefined,
    daysUntilMaintenance: randomInt(0, 30),
    riskFactors: generateRiskFactors(randomInt(1, 4)),
    recommendations: [],
    sensorData: generateSensorReadings(4),
    maintenanceHistory: generateMaintenanceHistory(5),
  };
};
