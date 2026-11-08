// ============================================================
// @linkk/branding — Main Entry Point
// ============================================================
//
// Package trung tâm quản lý thương hiệu / Central branding package
// Import: import { getBrand, getLabels } from '@linkk/branding'
//
// ============================================================

// ─── Brand Configuration ────────────────────────────────────
export {
  type BrandConfig,
  DEFAULT_BRAND,
  setBrand,
  getBrand,
} from './config';

// ─── Internationalization / UI Labels ───────────────────────
export {
  type UILabels,
  type Locale,
  createBilingualLabels,
  createViLabels,
  createEnLabels,
  setLocale,
  getLocale,
  getLabels,
} from './i18n';

// ─── Convenience Helpers ────────────────────────────────────

import { getBrand } from './config';
import { getLabels } from './i18n';

/** Lấy tên nền tảng / Get platform name */
export const platformName = () => getBrand().platform.name;

/** Lấy tên ngắn / Get short name */
export const platformShortName = () => getBrand().platform.shortName;

/** Lấy tagline theo locale / Get tagline by locale */
export const tagline = (lang: 'vi' | 'en' = 'vi') => getBrand().platform.tagline[lang];

/** Lấy npm scope / Get npm scope */
export const npmScope = () => getBrand().technical.npmScope;

/** Lấy copyright / Get copyright notice */
export const copyright = () => getBrand().legal.copyright;

/** Lấy label nhanh / Quick label access */
export const label = (section: string, key: string): string => {
  const labels = getLabels() as any;
  return labels?.[section]?.[key] ?? `${section}.${key}`;
};
