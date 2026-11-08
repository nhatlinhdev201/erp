// src/lib/ml-client/index.ts
// ML Service client for L-ERP MRP System

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://localhost:8000";

// Types
export interface ForecastRequest {
  partId: string;
  horizonDays?: number;
  modelType?: "prophet" | "arima" | "ets" | "ensemble";
  retrain?: boolean;
}

export interface ForecastPrediction {
  date: string;
  predicted: number;
  lowerBound?: number;
  upperBound?: number;
  trend?: number;
  modelPredictions?: Record<string, number>;
}

export interface ForecastResult {
  partId: string;
  partName?: string;
  modelType: string;
  horizonDays: number;
  predictions: ForecastPrediction[];
  modelMetrics?: {
    mape?: number;
    rmse?: number;
    mae?: number;
  };
  generatedAt: string;
}

export interface LeadTimePrediction {
  supplierId: string;
  supplierName?: string;
  predictedDays: number;
  lowerBound: number;
  upperBound: number;
  confidence: number;
  factors?: Record<string, number>;
}

export interface SafetyStockResult {
  partId: string;
  partName?: string;
  safetyStock: number;
  reorderPoint: number;
  averageDailyDemand: number;
  demandStdDev: number;
  serviceLevel: number;
  zScore: number;
  leadTimeDays: number;
  daysOfSupply: number;
  method: string;
  calculatedAt: string;
}

export interface EOQResult {
  partId: string;
  partName?: string;
  eoq: number;
  ordersPerYear: number;
  daysBetweenOrders: number;
  orderingCostAnnual: number;
  holdingCostAnnual: number;
  totalCostAnnual: number;
  calculatedAt: string;
}

export interface InventoryOptimizationResult {
  partId: string;
  partName?: string;
  safetyStock: SafetyStockResult;
  eoq: EOQResult;
  reorderPoint: {
    reorderPoint: number;
    demandDuringLeadTime: number;
    safetyStock: number;
  };
  recommendations: {
    optimalOrderQuantity: number;
    reorderPoint: number;
    safetyStock: number;
    maxInventory: number;
    expectedAnnualCost: number;
    ordersPerYear: number;
    averageInventory: number;
  };
  calculatedAt: string;
}

export interface AnomalyResult {
  date: string;
  value: number;
  isAnomaly: boolean;
  anomalyScore: number;
}

export interface AnomalyDetectionResult {
  partId: string;
  anomalies: AnomalyResult[];
  anomalyCount: number;
  totalRecords: number;
  contamination: number;
  analyzedAt: string;
}

export interface ModelInfo {
  modelId: string;
  modelType: string;
  status: "active" | "training" | "error" | "pending";
  lastTrained: string | null;
  metrics: Record<string, number>;
}

export interface MLServiceHealth {
  status: string;
  service: string;
  timestamp: string;
  modelsLoaded: number;
  totalModels: number;
}

// ML Client class
class MLClient {
  private baseUrl: string;

  constructor(baseUrl: string = ML_SERVICE_URL) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...options.headers,
        },
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(
          error.message || error.detail || `ML Service error: ${response.status}`
        );
      }

      return response.json();
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Failed to connect to ML service");
    }
  }

  // Health check
  async healthCheck(): Promise<MLServiceHealth> {
    return this.request("/health");
  }

  async isAvailable(): Promise<boolean> {
    try {
      await this.healthCheck();
      return true;
    } catch {
      return false;
    }
  }

  // Forecasting
  async forecastDemand(input: ForecastRequest): Promise<ForecastResult> {
    return this.request("/api/v1/forecast/demand", {
      method: "POST",
      body: JSON.stringify({
        part_id: input.partId,
        horizon_days: input.horizonDays || 90,
        model_type: input.modelType || "ensemble",
        retrain: input.retrain || false,
      }),
    });
  }

  async batchForecast(
    partIds: string[],
    horizonDays: number = 90
  ): Promise<{ jobId: string; status: string; partCount: number }> {
    return this.request("/api/v1/forecast/demand/batch", {
      method: "POST",
      body: JSON.stringify({
        part_ids: partIds,
        horizon_days: horizonDays,
      }),
    });
  }

  async getForecastHistory(
    partId: string,
    limit: number = 10
  ): Promise<{ partId: string; history: unknown[] }> {
    return this.request(`/api/v1/forecast/demand/${partId}/history?limit=${limit}`);
  }

  // Lead Time
  async predictLeadTime(input: {
    supplierId: string;
    orderValue?: number;
    lineCount?: number;
    totalQuantity?: number;
    isCritical?: boolean;
    partCategory?: string;
  }): Promise<LeadTimePrediction> {
    return this.request("/api/v1/leadtime/predict", {
      method: "POST",
      body: JSON.stringify({
        supplier_id: input.supplierId,
        order_value: input.orderValue || 0,
        line_count: input.lineCount || 1,
        total_quantity: input.totalQuantity || 1,
        is_critical: input.isCritical || false,
        part_category: input.partCategory,
      }),
    });
  }

  async getSupplierLeadTimeAnalysis(supplierId: string): Promise<{
    supplierId: string;
    statistics: {
      mean: number;
      median: number;
      std: number;
      min: number;
      max: number;
      percentile90: number;
      percentile95: number;
    };
    sampleCount: number;
    onTimeRate: number;
    analyzedAt: string;
  }> {
    return this.request(`/api/v1/leadtime/supplier/${supplierId}/analysis`);
  }

  async trainLeadTimeModel(supplierId: string): Promise<{
    status: string;
    supplierId: string;
    modelId: string;
    metrics: Record<string, number>;
    trainedAt: string | null;
  }> {
    return this.request(`/api/v1/leadtime/train/${supplierId}`, {
      method: "POST",
    });
  }

  // Anomaly Detection
  async detectAnomalies(input: {
    partId: string;
    lookbackDays?: number;
    contamination?: number;
  }): Promise<AnomalyDetectionResult> {
    return this.request("/api/v1/anomaly/detect", {
      method: "POST",
      body: JSON.stringify({
        part_id: input.partId,
        lookback_days: input.lookbackDays || 90,
        contamination: input.contamination || 0.1,
      }),
    });
  }

  // Optimization
  async calculateSafetyStock(input: {
    partId: string;
    serviceLevel?: number;
    leadTimeDays?: number;
    method?: "standard" | "king" | "dynamic";
  }): Promise<SafetyStockResult> {
    return this.request("/api/v1/optimization/safety-stock", {
      method: "POST",
      body: JSON.stringify({
        part_id: input.partId,
        service_level: input.serviceLevel || 0.95,
        lead_time_days: input.leadTimeDays,
        method: input.method || "king",
      }),
    });
  }

  async calculateEOQ(input: {
    partId: string;
    orderCost: number;
    holdingCostRate?: number;
  }): Promise<EOQResult> {
    return this.request("/api/v1/optimization/eoq", {
      method: "POST",
      body: JSON.stringify({
        part_id: input.partId,
        order_cost: input.orderCost,
        holding_cost_rate: input.holdingCostRate || 0.25,
      }),
    });
  }

  async optimizeInventory(input: {
    partId: string;
    serviceLevel?: number;
    orderCost?: number;
    holdingCostRate?: number;
  }): Promise<InventoryOptimizationResult> {
    return this.request("/api/v1/optimization/inventory-optimization", {
      method: "POST",
      body: JSON.stringify({
        part_id: input.partId,
        service_level: input.serviceLevel || 0.95,
        order_cost: input.orderCost || 50,
        holding_cost_rate: input.holdingCostRate || 0.25,
      }),
    });
  }

  async batchOptimize(
    partIds: string[],
    serviceLevel: number = 0.95
  ): Promise<{
    total: number;
    successful: number;
    failed: number;
    results: Array<{
      partId: string;
      status: string;
      recommendations?: Record<string, number>;
      error?: string;
    }>;
    calculatedAt: string;
  }> {
    return this.request("/api/v1/optimization/batch-optimization", {
      method: "POST",
      body: JSON.stringify({
        part_ids: partIds,
        service_level: serviceLevel,
      }),
    });
  }

  // Model Management
  async getModelStatus(): Promise<{
    models: ModelInfo[];
    total: number;
    active: number;
  }> {
    return this.request("/api/v1/models/status");
  }

  async getModelInfo(modelId: string): Promise<ModelInfo> {
    return this.request(`/api/v1/models/${modelId}`);
  }

  async trainModel(
    modelType: string,
    entityId?: string
  ): Promise<{
    jobId: string;
    modelId: string;
    modelType: string;
    status: string;
    message: string;
  }> {
    return this.request("/api/v1/models/train", {
      method: "POST",
      body: JSON.stringify({
        model_type: modelType,
        entity_id: entityId,
      }),
    });
  }

  async deleteModel(modelId: string): Promise<{ status: string; modelId: string }> {
    return this.request(`/api/v1/models/${modelId}`, {
      method: "DELETE",
    });
  }
}

// Export singleton instance
export const mlClient = new MLClient();

// Export class for custom instances
export { MLClient };
