'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import {
  BarChart3, Package, ShoppingCart, Factory, Activity,
  Download, RefreshCw, Award, Loader2,
} from 'lucide-react';

// Lazy-load the chart-heavy content (recharts ~500KB)
const AnalyticsChartsContent = dynamic(
  () => import('./analytics-charts'),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-96 bg-gray-50 dark:bg-neutral-800 rounded-xl animate-pulse">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-400">Loading charts...</p>
        </div>
      </div>
    ),
  }
);

// Types
interface DashboardMetrics {
  inventory: {
    totalParts: number;
    totalValue: number;
    lowStockItems: number;
    outOfStockItems: number;
    turnoverRate: number;
    changePercent: number;
  };
  sales: {
    totalOrders: number;
    totalRevenue: number;
    pendingOrders: number;
    completedOrders: number;
    avgOrderValue: number;
    changePercent: number;
  };
  production: {
    activeWorkOrders: number;
    completedThisMonth: number;
    onTimeDelivery: number;
    efficiency: number;
    pendingMaterials: number;
    changePercent: number;
  };
  quality: {
    totalNCRs: number;
    openNCRs: number;
    openCAPAs: number;
    defectRate: number;
    firstPassYield: number;
    changePercent: number;
  };
  suppliers: {
    totalSuppliers: number;
    activeSuppliers: number;
    ndaaCompliant: number;
    avgLeadTime: number;
    onTimeDelivery: number;
    changePercent: number;
  };
  compliance: {
    ndaaCompliantParts: number;
    itarControlledParts: number;
    rohsCompliantParts: number;
    expiringSoonCerts: number;
  };
}

interface ChartData {
  revenueByMonth: { month: string; revenue: number; cost: number; profit: number }[];
  inventoryByCategory: { category: string; value: number; quantity: number }[];
  ordersByStatus: { status: string; count: number; color: string }[];
  productionTrend: { week: string; planned: number; actual: number; efficiency: number }[];
  topProducts: { name: string; quantity: number; revenue: number }[];
  topParts: { name: string; quantity: number; value: number }[];
  qualityTrend: { month: string; ncr: number; capa: number; fpy: number }[];
  supplierPerformance: { name: string; onTime: number; quality: number; score: number }[];
}

// Color palette
const COLORS = {
  primary: '#1e3a5f',
  secondary: '#2c5282',
  success: '#38a169',
  warning: '#d69e2e',
  danger: '#e53e3e',
  info: '#3182ce',
  purple: '#805ad5',
  pink: '#d53f8c',
  cyan: '#00b5d8',
  orange: '#dd6b20',
};

// Mock data generator (will be replaced with API call)
const generateMockData = (): { metrics: DashboardMetrics; charts: ChartData } => {
  return {
    metrics: {
      inventory: {
        totalParts: 2847,
        totalValue: 1250000,
        lowStockItems: 23,
        outOfStockItems: 5,
        turnoverRate: 4.2,
        changePercent: 8.5,
      },
      sales: {
        totalOrders: 156,
        totalRevenue: 3450000,
        pendingOrders: 12,
        completedOrders: 144,
        avgOrderValue: 22115,
        changePercent: 15.3,
      },
      production: {
        activeWorkOrders: 8,
        completedThisMonth: 24,
        onTimeDelivery: 94.5,
        efficiency: 87.2,
        pendingMaterials: 3,
        changePercent: 5.2,
      },
      quality: {
        totalNCRs: 47,
        openNCRs: 8,
        openCAPAs: 5,
        defectRate: 1.2,
        firstPassYield: 98.8,
        changePercent: -2.1,
      },
      suppliers: {
        totalSuppliers: 45,
        activeSuppliers: 38,
        ndaaCompliant: 42,
        avgLeadTime: 18,
        onTimeDelivery: 91.3,
        changePercent: 3.7,
      },
      compliance: {
        ndaaCompliantParts: 2680,
        itarControlledParts: 156,
        rohsCompliantParts: 2790,
        expiringSoonCerts: 12,
      },
    },
    charts: {
      revenueByMonth: [
        { month: 'T7', revenue: 420000, cost: 310000, profit: 110000 },
        { month: 'T8', revenue: 380000, cost: 290000, profit: 90000 },
        { month: 'T9', revenue: 520000, cost: 380000, profit: 140000 },
        { month: 'T10', revenue: 480000, cost: 350000, profit: 130000 },
        { month: 'T11', revenue: 650000, cost: 470000, profit: 180000 },
        { month: 'T12', revenue: 720000, cost: 510000, profit: 210000 },
      ],
      inventoryByCategory: [
        { category: 'Propulsion', value: 450000, quantity: 320 },
        { category: 'Frame', value: 280000, quantity: 180 },
        { category: 'Electronics', value: 320000, quantity: 450 },
        { category: 'Power', value: 150000, quantity: 280 },
        { category: 'AI Computing', value: 180000, quantity: 95 },
        { category: 'Sensors', value: 120000, quantity: 380 },
      ],
      ordersByStatus: [
        { status: 'Hoan thanh', count: 144, color: COLORS.success },
        { status: 'Dang xu ly', count: 8, color: COLORS.info },
        { status: 'Cho xac nhan', count: 4, color: COLORS.warning },
        { status: 'Huy', count: 2, color: COLORS.danger },
      ],
      productionTrend: [
        { week: 'W1', planned: 6, actual: 5, efficiency: 83 },
        { week: 'W2', planned: 8, actual: 7, efficiency: 87 },
        { week: 'W3', planned: 7, actual: 7, efficiency: 100 },
        { week: 'W4', planned: 9, actual: 8, efficiency: 89 },
      ],
      topProducts: [
        { name: 'HERA-X8-PRO', quantity: 45, revenue: 1125000 },
        { name: 'HERA-X8-ENT', quantity: 32, revenue: 960000 },
        { name: 'HERA-X4-PRO', quantity: 28, revenue: 420000 },
        { name: 'HERA-X8-GOV', quantity: 18, revenue: 720000 },
        { name: 'HERA-X4-STD', quantity: 15, revenue: 180000 },
      ],
      topParts: [
        { name: 'Motor U15 II KV100', quantity: 384, value: 149376 },
        { name: 'Pixhawk 6X', quantity: 95, value: 56905 },
        { name: 'Carbon Frame X8', quantity: 48, value: 60000 },
        { name: 'Battery 22000mAh', quantity: 186, value: 74400 },
        { name: 'ESC 80A FOC', quantity: 384, value: 46080 },
      ],
      qualityTrend: [
        { month: 'T7', ncr: 8, capa: 3, fpy: 97.5 },
        { month: 'T8', ncr: 12, capa: 5, fpy: 96.8 },
        { month: 'T9', ncr: 6, capa: 2, fpy: 98.2 },
        { month: 'T10', ncr: 9, capa: 4, fpy: 97.9 },
        { month: 'T11', ncr: 7, capa: 3, fpy: 98.5 },
        { month: 'T12', ncr: 5, capa: 2, fpy: 98.8 },
      ],
      supplierPerformance: [
        { name: 'KDE Direct', onTime: 96, quality: 99, score: 97.5 },
        { name: 'Holybro', onTime: 94, quality: 98, score: 96.0 },
        { name: 'Tattu', onTime: 92, quality: 97, score: 94.5 },
        { name: 'T-Motor', onTime: 95, quality: 96, score: 95.5 },
        { name: 'Foxtech', onTime: 88, quality: 95, score: 91.5 },
      ],
    },
  };
};

// Main Dashboard Component
export default function AnalyticsDashboard() {
  const [dateRange, setDateRange] = useState('6m');
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<{ metrics: DashboardMetrics; charts: ChartData } | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'inventory' | 'sales' | 'production' | 'quality'>('overview');

  useEffect(() => {
    // Simulate API call - can be replaced with real API call
    setIsLoading(true);
    setTimeout(() => {
      setData(generateMockData());
      setIsLoading(false);
    }, 1000);
  }, [dateRange]);

  // Early return for loading state
  if (isLoading || !data) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-neutral-900 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-primary-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-neutral-400">Dang tai du lieu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-neutral-900">
      {/* Header */}
      <div className="bg-white dark:bg-neutral-800 border-b border-gray-200 dark:border-neutral-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-br from-primary-500 to-purple-600 rounded-lg">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">Analytics Dashboard</h1>
                <p className="text-xs text-gray-500 dark:text-neutral-400">L-ERP MRP Insights</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {/* Date Range Selector */}
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                aria-label="Chọn khoảng thời gian"
                className="px-3 py-2 border border-gray-300 dark:border-neutral-600 rounded-lg text-sm bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
              >
                <option value="1m">1 thang</option>
                <option value="3m">3 thang</option>
                <option value="6m">6 thang</option>
                <option value="1y">1 nam</option>
                <option value="all">Tat ca</option>
              </select>

              <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg" aria-label="Lam moi">
                <RefreshCw className="h-5 w-5" />
              </button>

              <button className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
                <Download className="h-4 w-4 mr-2" />
                Export
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex space-x-1 pb-2">
            {[
              { key: 'overview', label: 'Tong quan', icon: Activity },
              { key: 'inventory', label: 'Ton kho', icon: Package },
              { key: 'sales', label: 'Ban hang', icon: ShoppingCart },
              { key: 'production', label: 'San xuat', icon: Factory },
              { key: 'quality', label: 'Chat luong', icon: Award },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as 'overview' | 'inventory' | 'sales' | 'production' | 'quality')}
                className={`flex items-center px-4 py-2 rounded-t-lg text-sm font-medium transition-colors ${
                  activeTab === tab.key
                    ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 border-b-2 border-primary-600'
                    : 'text-gray-500 dark:text-neutral-400 hover:text-gray-700 dark:hover:text-neutral-200 hover:bg-gray-50 dark:hover:bg-neutral-700'
                }`}
              >
                <tab.icon className="h-4 w-4 mr-2" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content - Dynamically loaded charts */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <AnalyticsChartsContent data={data} activeTab={activeTab} />
      </div>
    </div>
  );
}
