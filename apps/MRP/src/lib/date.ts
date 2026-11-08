/**
 * Centralized Date Formatting Utility
 * L-ERP MRP System
 */

import { format, formatDistance, formatRelative, isValid, parseISO } from 'date-fns';
import { vi, enUS } from 'date-fns/locale';

export type DateLocale = 'vi' | 'en';

// Default locale for the system
const DEFAULT_LOCALE: DateLocale = 'vi';

// Locale mapping
const LOCALES = {
  vi: vi,
  en: enUS,
};

// Standard date formats
export const DATE_FORMATS = {
  // Display formats
  short: 'dd/MM/yyyy',           // 14/01/2026
  medium: 'dd MMM yyyy',         // 14 Jan 2026
  long: 'dd MMMM yyyy',          // 14 January 2026
  full: 'EEEE, dd MMMM yyyy',    // Tuesday, 14 January 2026

  // With time
  shortTime: 'dd/MM/yyyy HH:mm',          // 14/01/2026 14:30
  mediumTime: 'dd MMM yyyy HH:mm',        // 14 Jan 2026 14:30
  longTime: 'dd MMMM yyyy HH:mm:ss',      // 14 January 2026 14:30:45

  // ISO formats
  iso: "yyyy-MM-dd",             // 2026-01-14
  isoTime: "yyyy-MM-dd'T'HH:mm:ss",   // 2026-01-14T14:30:00

  // Month/Year only
  monthYear: 'MMM yyyy',         // Jan 2026
  month: 'MMMM',                 // January
  year: 'yyyy',                  // 2026

  // Time only
  time: 'HH:mm',                 // 14:30
  timeSeconds: 'HH:mm:ss',       // 14:30:45
} as const;

type DateFormat = keyof typeof DATE_FORMATS | string;

interface FormatDateOptions {
  format?: DateFormat;
  locale?: DateLocale;
}

/**
 * Parse a date value to Date object
 */
function toDate(date: Date | string | number | null | undefined): Date | null {
  if (!date) return null;

  if (date instanceof Date) {
    return isValid(date) ? date : null;
  }

  if (typeof date === 'string') {
    const parsed = parseISO(date);
    return isValid(parsed) ? parsed : null;
  }

  if (typeof date === 'number') {
    const parsed = new Date(date);
    return isValid(parsed) ? parsed : null;
  }

  return null;
}

/**
 * Format a date with the specified format
 * @param date - The date to format
 * @param options - Formatting options
 * @returns Formatted date string or '-' if invalid
 */
export function formatDate(
  date: Date | string | number | null | undefined,
  options: FormatDateOptions = {}
): string {
  const {
    format: formatStr = 'short',
    locale = DEFAULT_LOCALE,
  } = options;

  const parsedDate = toDate(date);
  if (!parsedDate) return '-';

  const formatPattern = DATE_FORMATS[formatStr as keyof typeof DATE_FORMATS] || formatStr;

  try {
    return format(parsedDate, formatPattern, { locale: LOCALES[locale] });
  } catch {
    return '-';
  }
}

/**
 * Format date for display in lists/tables (short format)
 */
export function formatDateShort(date: Date | string | number | null | undefined): string {
  return formatDate(date, { format: 'short' });
}

/**
 * Format date with time for detailed views
 */
export function formatDateTime(date: Date | string | number | null | undefined): string {
  return formatDate(date, { format: 'shortTime' });
}

/**
 * Format date in medium format (e.g., "14 Jan 2026")
 */
export function formatDateMedium(date: Date | string | number | null | undefined): string {
  return formatDate(date, { format: 'medium' });
}

/**
 * Format date in ISO format for forms/APIs
 */
export function formatDateISO(date: Date | string | number | null | undefined): string {
  const parsedDate = toDate(date);
  if (!parsedDate) return '';
  return format(parsedDate, DATE_FORMATS.iso);
}

/**
 * Format relative time (e.g., "2 days ago", "in 3 hours")
 */
export function formatRelativeTime(
  date: Date | string | number | null | undefined,
  baseDate: Date = new Date(),
  locale: DateLocale = DEFAULT_LOCALE
): string {
  const parsedDate = toDate(date);
  if (!parsedDate) return '-';

  try {
    return formatDistance(parsedDate, baseDate, {
      addSuffix: true,
      locale: LOCALES[locale],
    });
  } catch {
    return '-';
  }
}

/**
 * Format relative date (e.g., "yesterday at 4:00 PM")
 */
export function formatRelativeDate(
  date: Date | string | number | null | undefined,
  baseDate: Date = new Date(),
  locale: DateLocale = DEFAULT_LOCALE
): string {
  const parsedDate = toDate(date);
  if (!parsedDate) return '-';

  try {
    return formatRelative(parsedDate, baseDate, {
      locale: LOCALES[locale],
    });
  } catch {
    return '-';
  }
}

/**
 * Check if a date is valid
 */
export function isValidDate(date: Date | string | number | null | undefined): boolean {
  return toDate(date) !== null;
}

/**
 * Get the default system locale
 */
export function getDefaultLocale(): DateLocale {
  return DEFAULT_LOCALE;
}
