/**
 * Centralized Currency Formatting Utility
 * L-ERP MRP System
 */

export type Currency = 'USD' | 'VND' | 'EUR';

interface FormatCurrencyOptions {
  currency?: Currency;
  showSymbol?: boolean;
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
  compact?: boolean;
}

// Default currency for the system
const DEFAULT_CURRENCY: Currency = 'USD';

// Currency configurations
const CURRENCY_CONFIG: Record<Currency, { locale: string; decimals: number }> = {
  USD: { locale: 'en-US', decimals: 2 },
  VND: { locale: 'vi-VN', decimals: 0 },
  EUR: { locale: 'de-DE', decimals: 2 },
};

/**
 * Format a number as currency
 * @param amount - The amount to format
 * @param options - Formatting options
 * @returns Formatted currency string
 */
export function formatCurrency(
  amount: number | null | undefined,
  options: FormatCurrencyOptions = {}
): string {
  const {
    currency = DEFAULT_CURRENCY,
    showSymbol = true,
    minimumFractionDigits,
    maximumFractionDigits,
    compact = false,
  } = options;

  // Handle null/undefined
  if (amount === null || amount === undefined) {
    return showSymbol ? formatCurrency(0, options) : '0';
  }

  const config = CURRENCY_CONFIG[currency];

  // Compact notation for large numbers
  if (compact && Math.abs(amount) >= 1000) {
    const formatter = new Intl.NumberFormat(config.locale, {
      style: showSymbol ? 'currency' : 'decimal',
      currency: showSymbol ? currency : undefined,
      notation: 'compact',
      maximumFractionDigits: 1,
    });
    return formatter.format(amount);
  }

  const formatter = new Intl.NumberFormat(config.locale, {
    style: showSymbol ? 'currency' : 'decimal',
    currency: showSymbol ? currency : undefined,
    minimumFractionDigits: minimumFractionDigits ?? config.decimals,
    maximumFractionDigits: maximumFractionDigits ?? config.decimals,
  });

  return formatter.format(amount);
}

/**
 * Format currency for display in tables (no symbol, right-aligned friendly)
 */
export function formatCurrencyValue(
  amount: number | null | undefined,
  currency: Currency = DEFAULT_CURRENCY
): string {
  return formatCurrency(amount, { currency, showSymbol: false });
}

/**
 * Format currency with symbol
 */
export function formatCurrencyWithSymbol(
  amount: number | null | undefined,
  currency: Currency = DEFAULT_CURRENCY
): string {
  return formatCurrency(amount, { currency, showSymbol: true });
}

/**
 * Format large currency amounts in compact form (e.g., $1.2M)
 */
export function formatCurrencyCompact(
  amount: number | null | undefined,
  currency: Currency = DEFAULT_CURRENCY
): string {
  return formatCurrency(amount, { currency, compact: true });
}

/**
 * Parse a currency string back to number
 */
export function parseCurrency(value: string): number {
  // Remove currency symbols, spaces, and thousand separators
  const cleaned = value
    .replace(/[^\d.,-]/g, '')
    .replace(/,/g, '');
  return parseFloat(cleaned) || 0;
}

/**
 * Get currency symbol
 */
export function getCurrencySymbol(currency: Currency = DEFAULT_CURRENCY): string {
  const symbols: Record<Currency, string> = {
    USD: '$',
    VND: '₫',
    EUR: '€',
  };
  return symbols[currency];
}

/**
 * Get the default system currency
 */
export function getDefaultCurrency(): Currency {
  return DEFAULT_CURRENCY;
}
