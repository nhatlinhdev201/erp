'use client';

import React, { useState, useMemo } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { PieLabelRenderProps } from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Download,
  Maximize2,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// =============================================================================
// L-ERP MRP - CHART COMPONENTS
// Reusable chart components with Vietnamese labels
// =============================================================================

// =============================================================================
// COLOR PALETTES
// =============================================================================

export const chartColors = {
  primary: ['#8B5CF6', '#A78BFA', '#C4B5FD', '#DDD6FE', '#EDE9FE'],
  blue: ['#30a46c', '#60A5FA', '#93C5FD', '#BFDBFE', '#DBEAFE'],
  green: ['#10B981', '#34D399', '#6EE7B7', '#A7F3D0', '#D1FAE5'],
  orange: ['#F59E0B', '#FBBF24', '#FCD34D', '#FDE68A', '#FEF3C7'],
  red: ['#EF4444', '#F87171', '#FCA5A5', '#FECACA', '#FEE2E2'],
  mixed: ['#8B5CF6', '#30a46c', '#10B981', '#F59E0B', '#EF4444', '#EC4899', '#14B8A6'],
};

export const statusColors = {
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
  neutral: '#6B7280',
};

// =============================================================================
// TYPES
// =============================================================================

interface ChartContainerProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  actions?: React.ReactNode;
  loading?: boolean;
  onRefresh?: () => void;
  onExport?: () => void;
  onExpand?: () => void;
}

interface BaseChartProps {
  data: Record<string, unknown>[];
  height?: number;
  className?: string;
  loading?: boolean;
}

// =============================================================================
// CHART CONTAINER
// =============================================================================

export function ChartContainer({
  title,
  subtitle,
  children,
  className,
  actions,
  loading,
  onRefresh,
  onExport,
  onExpand,
}: ChartContainerProps) {
  return (
    <div className={cn(
      'bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden',
      className
    )}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700">
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white">{title}</h3>
          {subtitle && (
            <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>
          )}
        </div>
        <div className="flex items-center gap-1">
          {actions}
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              aria-label="Làm mới"
            >
              <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
            </button>
          )}
          {onExport && (
            <button
              onClick={onExport}
              className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              aria-label="Tải xuống"
            >
              <Download className="w-4 h-4" />
            </button>
          )}
          {onExpand && (
            <button
              onClick={onExpand}
              className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              aria-label="Mở rộng"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Chart */}
      <div className="p-5">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <RefreshCw className="w-8 h-8 text-gray-300 animate-spin" />
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}

// =============================================================================
// CUSTOM TOOLTIP
// =============================================================================

interface TooltipPayloadEntry {
  color: string;
  name: string;
  value: number;
  dataKey?: string;
  payload?: Record<string, unknown>;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadEntry[];
  label?: string;
  formatter?: (value: number, name: string) => string;
}

function CustomTooltip({ active, payload, label, formatter }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-3 min-w-[150px]">
      <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">{label}</p>
      {payload.map((entry: TooltipPayloadEntry, index: number) => (
        <div key={index} className="flex items-center justify-between gap-4 text-sm">
          <div className="flex items-center gap-2">
            <span
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-gray-600 dark:text-gray-400">{entry.name}</span>
          </div>
          <span className="font-medium text-gray-900 dark:text-white">
            {formatter ? formatter(entry.value, entry.name) : entry.value.toLocaleString('vi-VN')}
          </span>
        </div>
      ))}
    </div>
  );
}

// =============================================================================
// LINE CHART
// =============================================================================

interface LineChartProps extends BaseChartProps {
  dataKey: string | string[];
  xAxisKey?: string;
  colors?: string[];
  showGrid?: boolean;
  showLegend?: boolean;
  curveType?: 'linear' | 'monotone' | 'step';
  valueFormatter?: (value: number) => string;
}

export function RTRLineChart({
  data,
  dataKey,
  xAxisKey = 'name',
  colors = chartColors.primary,
  height = 300,
  showGrid = true,
  showLegend = true,
  curveType = 'monotone',
  valueFormatter,
  className,
}: LineChartProps) {
  const keys = Array.isArray(dataKey) ? dataKey : [dataKey];

  return (
    <div className={cn('w-full', className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />}
          <XAxis
            dataKey={xAxisKey}
            tick={{ fontSize: 12, fill: '#6B7280' }}
            axisLine={{ stroke: '#E5E7EB' }}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 12, fill: '#6B7280' }}
            axisLine={{ stroke: '#E5E7EB' }}
            tickLine={false}
            tickFormatter={valueFormatter}
          />
          <Tooltip
            content={<CustomTooltip formatter={(v) => valueFormatter ? valueFormatter(v) : v.toLocaleString('vi-VN')} />}
          />
          {showLegend && <Legend />}
          {keys.map((key, index) => (
            <Line
              key={key}
              type={curveType}
              dataKey={key}
              stroke={colors[index % colors.length]}
              strokeWidth={2}
              dot={{ fill: colors[index % colors.length], strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// =============================================================================
// BAR CHART
// =============================================================================

interface BarChartProps extends BaseChartProps {
  dataKey: string | string[];
  xAxisKey?: string;
  colors?: string[];
  showGrid?: boolean;
  showLegend?: boolean;
  stacked?: boolean;
  horizontal?: boolean;
  valueFormatter?: (value: number) => string;
}

export function RTRBarChart({
  data,
  dataKey,
  xAxisKey = 'name',
  colors = chartColors.blue,
  height = 300,
  showGrid = true,
  showLegend = true,
  stacked = false,
  horizontal = false,
  valueFormatter,
  className,
}: BarChartProps) {
  const keys = Array.isArray(dataKey) ? dataKey : [dataKey];

  const layout = horizontal ? 'vertical' : 'horizontal';

  return (
    <div className={cn('w-full', className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout={layout}
          margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
        >
          {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />}
          {horizontal ? (
            <>
              <XAxis type="number" tick={{ fontSize: 12, fill: '#6B7280' }} tickFormatter={valueFormatter} />
              <YAxis dataKey={xAxisKey} type="category" tick={{ fontSize: 12, fill: '#6B7280' }} width={100} />
            </>
          ) : (
            <>
              <XAxis dataKey={xAxisKey} tick={{ fontSize: 12, fill: '#6B7280' }} />
              <YAxis tick={{ fontSize: 12, fill: '#6B7280' }} tickFormatter={valueFormatter} />
            </>
          )}
          <Tooltip
            content={<CustomTooltip formatter={(v) => valueFormatter ? valueFormatter(v) : v.toLocaleString('vi-VN')} />}
          />
          {showLegend && <Legend />}
          {keys.map((key, index) => (
            <Bar
              key={key}
              dataKey={key}
              fill={colors[index % colors.length]}
              stackId={stacked ? 'stack' : undefined}
              radius={[4, 4, 0, 0]}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// =============================================================================
// PIE/DONUT CHART
// =============================================================================

interface PieChartProps extends BaseChartProps {
  dataKey: string;
  nameKey?: string;
  colors?: string[];
  innerRadius?: number;
  showLabel?: boolean;
  showLegend?: boolean;
  valueFormatter?: (value: number) => string;
}

export function RTRPieChart({
  data,
  dataKey,
  nameKey = 'name',
  colors = chartColors.mixed,
  height = 300,
  innerRadius = 0,
  showLabel = true,
  showLegend = true,
  valueFormatter,
  className,
}: PieChartProps) {
  const total = useMemo(() =>
    data.reduce((sum, item) => sum + (Number(item[dataKey]) || 0), 0),
    [data, dataKey]
  );

  const renderLabel = (props: PieLabelRenderProps) => {
    const { cx, cy, midAngle, innerRadius: ir, outerRadius: or, percent } = props as { cx: number; cy: number; midAngle: number; innerRadius: number; outerRadius: number; percent: number };
    if (!showLabel || percent < 0.05) return null;

    const RADIAN = Math.PI / 180;
    const radius = ir + (or - ir) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={12}
        fontWeight={500}
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <div className={cn('w-full', className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderLabel}
            outerRadius={height / 3}
            innerRadius={innerRadius}
            dataKey={dataKey}
            nameKey={nameKey}
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={colors[index % colors.length]}
              />
            ))}
          </Pie>
          <Tooltip
            content={<CustomTooltip formatter={(v) => {
              const formatted = valueFormatter ? valueFormatter(v) : v.toLocaleString('vi-VN');
              return `${formatted} (${((v / total) * 100).toFixed(1)}%)`;
            }} />}
          />
          {showLegend && (
            <Legend
              layout="vertical"
              align="right"
              verticalAlign="middle"
              formatter={(value) => (
                <span className="text-sm text-gray-600 dark:text-gray-400">{value}</span>
              )}
            />
          )}
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

// =============================================================================
// AREA CHART
// =============================================================================

interface AreaChartProps extends BaseChartProps {
  dataKey: string | string[];
  xAxisKey?: string;
  colors?: string[];
  showGrid?: boolean;
  showLegend?: boolean;
  stacked?: boolean;
  gradient?: boolean;
  valueFormatter?: (value: number) => string;
}

export function RTRAreaChart({
  data,
  dataKey,
  xAxisKey = 'name',
  colors = chartColors.green,
  height = 300,
  showGrid = true,
  showLegend = true,
  stacked = false,
  gradient = true,
  valueFormatter,
  className,
}: AreaChartProps) {
  const keys = Array.isArray(dataKey) ? dataKey : [dataKey];

  return (
    <div className={cn('w-full', className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <defs>
            {keys.map((key, index) => (
              <linearGradient key={key} id={`gradient-${key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={colors[index % colors.length]} stopOpacity={0.3} />
                <stop offset="95%" stopColor={colors[index % colors.length]} stopOpacity={0} />
              </linearGradient>
            ))}
          </defs>
          {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />}
          <XAxis
            dataKey={xAxisKey}
            tick={{ fontSize: 12, fill: '#6B7280' }}
            axisLine={{ stroke: '#E5E7EB' }}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 12, fill: '#6B7280' }}
            axisLine={{ stroke: '#E5E7EB' }}
            tickLine={false}
            tickFormatter={valueFormatter}
          />
          <Tooltip
            content={<CustomTooltip formatter={(v) => valueFormatter ? valueFormatter(v) : v.toLocaleString('vi-VN')} />}
          />
          {showLegend && <Legend />}
          {keys.map((key, index) => (
            <Area
              key={key}
              type="monotone"
              dataKey={key}
              stroke={colors[index % colors.length]}
              strokeWidth={2}
              fill={gradient ? `url(#gradient-${key})` : colors[index % colors.length]}
              fillOpacity={gradient ? 1 : 0.3}
              stackId={stacked ? 'stack' : undefined}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// =============================================================================
// STAT CARD WITH MINI CHART
// =============================================================================

interface StatCardWithChartProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: { value: number; label: string };
  chartData?: { value: number }[];
  chartColor?: string;
  icon?: React.ReactNode;
  className?: string;
}

export function StatCardWithChart({
  title,
  value,
  subtitle,
  trend,
  chartData,
  chartColor = '#8B5CF6',
  icon,
  className,
}: StatCardWithChartProps) {
  const TrendIcon = trend
    ? trend.value > 0
      ? TrendingUp
      : trend.value < 0
        ? TrendingDown
        : Minus
    : null;

  return (
    <div className={cn(
      'bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5',
      className
    )}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
          )}
          {trend && TrendIcon && (
            <div className="flex items-center gap-1 mt-2">
              <div className={cn(
                'flex items-center gap-1 text-sm font-medium',
                trend.value > 0 ? 'text-green-600' : trend.value < 0 ? 'text-red-600' : 'text-gray-500'
              )}>
                <TrendIcon className="w-4 h-4" />
                <span>{Math.abs(trend.value).toFixed(1)}%</span>
              </div>
              <span className="text-xs text-gray-500">{trend.label}</span>
            </div>
          )}
        </div>
        {icon && (
          <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-700">
            {icon}
          </div>
        )}
      </div>

      {chartData && chartData.length > 0 && (
        <div className="mt-4 h-16">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id={`mini-gradient-${title}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={chartColor} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={chartColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="value"
                stroke={chartColor}
                strokeWidth={2}
                fill={`url(#mini-gradient-${title})`}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// EXPORT ALL
// =============================================================================

export default {
  ChartContainer,
  RTRLineChart,
  RTRBarChart,
  RTRPieChart,
  RTRAreaChart,
  StatCardWithChart,
  chartColors,
  statusColors,
};
