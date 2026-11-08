// =============================================================================
// L-ERP MRP - DESIGN SYSTEM THEME CONFIGURATION
// Modern, Minimal, Premium, Data-First UI System
// =============================================================================

// -----------------------------------------------------------------------------
// COLOR SYSTEM
// -----------------------------------------------------------------------------

export const colors = {
  // Primary Brand Colors (Prismy Green)
  primary: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#3ecf8e',
    500: '#30a46c',  // Main primary
    600: '#249163',
    700: '#1a7f4f',
    800: '#166534',
    900: '#14532d',
    950: '#052e16',
  },

  // Navy (Sidebar, Headers)
  navy: {
    50: '#F8FAFC',
    100: '#F1F5F9',
    200: '#E2E8F0',
    300: '#CBD5E1',
    400: '#94A3B8',
    500: '#64748B',
    600: '#475569',
    700: '#334155',
    800: '#1E293B',
    900: '#0F172A',  // Main navy
    950: '#020617',
  },

  // Semantic Colors
  success: {
    50: '#ECFDF5',
    100: '#D1FAE5',
    200: '#A7F3D0',
    300: '#6EE7B7',
    400: '#34D399',
    500: '#10B981',  // Main success
    600: '#059669',
    700: '#047857',
    800: '#065F46',
    900: '#064E3B',
  },

  warning: {
    50: '#FFFBEB',
    100: '#FEF3C7',
    200: '#FDE68A',
    300: '#FCD34D',
    400: '#FBBF24',
    500: '#F59E0B',  // Main warning
    600: '#D97706',
    700: '#B45309',
    800: '#92400E',
    900: '#78350F',
  },

  danger: {
    50: '#FEF2F2',
    100: '#FEE2E2',
    200: '#FECACA',
    300: '#FCA5A5',
    400: '#F87171',
    500: '#EF4444',  // Main danger
    600: '#DC2626',
    700: '#B91C1C',
    800: '#991B1B',
    900: '#7F1D1D',
  },

  info: {
    50: '#EFF6FF',
    100: '#DBEAFE',
    200: '#BFDBFE',
    300: '#93C5FD',
    400: '#60A5FA',
    500: '#3B82F6',  // Main info
    600: '#2563EB',
    700: '#1D4ED8',
    800: '#1E40AF',
    900: '#1E3A8A',
  },

  purple: {
    50: '#FAF5FF',
    100: '#F3E8FF',
    200: '#E9D5FF',
    300: '#D8B4FE',
    400: '#C084FC',
    500: '#A855F7',  // Main purple (AI/Tech)
    600: '#9333EA',
    700: '#7C3AED',
    800: '#6B21A8',
    900: '#581C87',
  },

  cyan: {
    50: '#ECFEFF',
    100: '#CFFAFE',
    200: '#A5F3FC',
    300: '#67E8F9',
    400: '#22D3EE',
    500: '#06B6D4',  // Main cyan (Accent)
    600: '#0891B2',
    700: '#0E7490',
    800: '#155E75',
    900: '#164E63',
  },

  // Neutral (Slate-based)
  neutral: {
    0: '#FFFFFF',
    50: '#F8FAFC',
    100: '#F1F5F9',
    200: '#E2E8F0',
    300: '#CBD5E1',
    400: '#94A3B8',
    500: '#64748B',
    600: '#475569',
    700: '#334155',
    800: '#1E293B',
    900: '#0F172A',
    950: '#020617',
  },
} as const;

// Chart color palette (6 colors for data visualization)
export const chartColors = {
  palette: [
    '#30a46c', // Prismy Green
    '#10B981', // Green
    '#F59E0B', // Yellow
    '#EF4444', // Red
    '#8B5CF6', // Purple
    '#06B6D4', // Cyan
  ],
  extended: [
    '#30a46c', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4',
    '#EC4899', '#14B8A6', '#F97316', '#6366F1', '#84CC16', '#0EA5E9',
  ],
  gradient: {
    blue: ['#30a46c', '#3ecf8e'],
    green: ['#10B981', '#34D399'],
    purple: ['#8B5CF6', '#A78BFA'],
    orange: ['#F59E0B', '#FBBF24'],
  },
} as const;

// Status colors mapping
export const statusColors = {
  // Order/WO Status
  draft: { bg: 'bg-neutral-100', text: 'text-neutral-600', dot: 'bg-neutral-400' },
  pending: { bg: 'bg-warning-50', text: 'text-warning-700', dot: 'bg-warning-500' },
  confirmed: { bg: 'bg-info-50', text: 'text-info-700', dot: 'bg-info-500' },
  in_progress: { bg: 'bg-primary-50', text: 'text-primary-700', dot: 'bg-primary-500' },
  completed: { bg: 'bg-success-50', text: 'text-success-700', dot: 'bg-success-500' },
  cancelled: { bg: 'bg-danger-50', text: 'text-danger-700', dot: 'bg-danger-500' },
  on_hold: { bg: 'bg-purple-50', text: 'text-purple-700', dot: 'bg-purple-500' },
  
  // Stock Status
  in_stock: { bg: 'bg-success-50', text: 'text-success-700', dot: 'bg-success-500' },
  low_stock: { bg: 'bg-warning-50', text: 'text-warning-700', dot: 'bg-warning-500' },
  out_of_stock: { bg: 'bg-danger-50', text: 'text-danger-700', dot: 'bg-danger-500' },
  
  // Priority
  critical: { bg: 'bg-danger-50', text: 'text-danger-700', dot: 'bg-danger-500' },
  high: { bg: 'bg-warning-50', text: 'text-warning-700', dot: 'bg-warning-500' },
  medium: { bg: 'bg-info-50', text: 'text-info-700', dot: 'bg-info-500' },
  low: { bg: 'bg-neutral-100', text: 'text-neutral-600', dot: 'bg-neutral-400' },
  
  // Boolean
  active: { bg: 'bg-success-50', text: 'text-success-700', dot: 'bg-success-500' },
  inactive: { bg: 'bg-neutral-100', text: 'text-neutral-600', dot: 'bg-neutral-400' },
  yes: { bg: 'bg-success-50', text: 'text-success-700', dot: 'bg-success-500' },
  no: { bg: 'bg-neutral-100', text: 'text-neutral-600', dot: 'bg-neutral-400' },
} as const;

// -----------------------------------------------------------------------------
// TYPOGRAPHY SYSTEM
// -----------------------------------------------------------------------------

export const typography = {
  // Font families
  fontFamily: {
    sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
    mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'Monaco', 'monospace'],
    display: ['Inter', 'system-ui', 'sans-serif'],
  },

  // Font sizes with line heights
  fontSize: {
    'display-xl': ['3rem', { lineHeight: '3.5rem', letterSpacing: '-0.02em', fontWeight: '600' }],      // 48px
    'display-lg': ['2.25rem', { lineHeight: '2.75rem', letterSpacing: '-0.02em', fontWeight: '600' }],  // 36px
    'heading-1': ['1.875rem', { lineHeight: '2.25rem', letterSpacing: '-0.01em', fontWeight: '600' }],  // 30px
    'heading-2': ['1.5rem', { lineHeight: '2rem', letterSpacing: '-0.01em', fontWeight: '600' }],       // 24px
    'heading-3': ['1.25rem', { lineHeight: '1.75rem', letterSpacing: '0', fontWeight: '500' }],         // 20px
    'heading-4': ['1.125rem', { lineHeight: '1.5rem', letterSpacing: '0', fontWeight: '500' }],         // 18px
    'body-lg': ['1rem', { lineHeight: '1.5rem', letterSpacing: '0', fontWeight: '400' }],               // 16px
    'body': ['0.875rem', { lineHeight: '1.25rem', letterSpacing: '0', fontWeight: '400' }],             // 14px (default)
    'body-sm': ['0.8125rem', { lineHeight: '1.125rem', letterSpacing: '0', fontWeight: '400' }],        // 13px
    'caption': ['0.75rem', { lineHeight: '1rem', letterSpacing: '0.01em', fontWeight: '500' }],         // 12px
    'overline': ['0.6875rem', { lineHeight: '0.875rem', letterSpacing: '0.05em', fontWeight: '600' }],  // 11px
  },

  // Font weights
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
} as const;

// -----------------------------------------------------------------------------
// SPACING SYSTEM (Based on 4px grid)
// -----------------------------------------------------------------------------

export const spacing = {
  px: '1px',
  0: '0',
  0.5: '0.125rem',  // 2px
  1: '0.25rem',     // 4px
  1.5: '0.375rem',  // 6px
  2: '0.5rem',      // 8px
  2.5: '0.625rem',  // 10px
  3: '0.75rem',     // 12px
  3.5: '0.875rem',  // 14px
  4: '1rem',        // 16px
  5: '1.25rem',     // 20px
  6: '1.5rem',      // 24px
  7: '1.75rem',     // 28px
  8: '2rem',        // 32px
  9: '2.25rem',     // 36px
  10: '2.5rem',     // 40px
  11: '2.75rem',    // 44px
  12: '3rem',       // 48px
  14: '3.5rem',     // 56px
  16: '4rem',       // 64px
  20: '5rem',       // 80px
  24: '6rem',       // 96px
  28: '7rem',       // 112px
  32: '8rem',       // 128px
} as const;

// Component-specific spacing
export const componentSpacing = {
  card: {
    padding: spacing[6],      // 24px
    gap: spacing[4],          // 16px
  },
  table: {
    cellPadding: {
      x: spacing[4],          // 16px
      y: spacing[3],          // 12px
    },
    headerPadding: {
      x: spacing[4],
      y: spacing[3],
    },
  },
  button: {
    sm: { x: spacing[3], y: spacing[2] },       // 12px, 8px
    md: { x: spacing[4], y: spacing[2.5] },     // 16px, 10px
    lg: { x: spacing[5], y: spacing[3] },       // 20px, 12px
  },
  input: {
    padding: { x: spacing[3.5], y: spacing[2.5] },  // 14px, 10px
  },
  modal: {
    padding: spacing[6],
  },
} as const;

// -----------------------------------------------------------------------------
// BORDER RADIUS
// -----------------------------------------------------------------------------

export const borderRadius = {
  none: '0',
  sm: '0.25rem',      // 4px
  DEFAULT: '0.5rem',  // 8px
  md: '0.5rem',       // 8px
  lg: '0.75rem',      // 12px
  xl: '1rem',         // 16px
  '2xl': '1.25rem',   // 20px
  '3xl': '1.5rem',    // 24px
  full: '9999px',
} as const;

// -----------------------------------------------------------------------------
// SHADOWS
// -----------------------------------------------------------------------------

export const shadows = {
  none: 'none',
  xs: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  sm: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  DEFAULT: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
  // Colored shadows
  primary: '0 4px 14px 0 rgb(48 164 108 / 0.3)',
  success: '0 4px 14px 0 rgb(16 185 129 / 0.3)',
  warning: '0 4px 14px 0 rgb(245 158 11 / 0.3)',
  danger: '0 4px 14px 0 rgb(239 68 68 / 0.3)',
} as const;

// -----------------------------------------------------------------------------
// Z-INDEX
// -----------------------------------------------------------------------------

export const zIndex = {
  hide: -1,
  auto: 'auto',
  base: 0,
  docked: 10,
  dropdown: 1000,
  sticky: 1100,
  banner: 1200,
  overlay: 1300,
  modal: 1400,
  popover: 1500,
  skipLink: 1600,
  toast: 1700,
  tooltip: 1800,
  commandPalette: 1900,
} as const;

// -----------------------------------------------------------------------------
// TRANSITIONS
// -----------------------------------------------------------------------------

export const transitions = {
  duration: {
    fast: '100ms',
    normal: '200ms',
    slow: '300ms',
    slower: '500ms',
  },
  easing: {
    linear: 'linear',
    ease: 'ease',
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  },
} as const;

// -----------------------------------------------------------------------------
// BREAKPOINTS
// -----------------------------------------------------------------------------

export const breakpoints = {
  xs: '475px',
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

// -----------------------------------------------------------------------------
// LAYOUT
// -----------------------------------------------------------------------------

export const layout = {
  sidebar: {
    width: '220px',
    collapsedWidth: '48px',
  },
  topbar: {
    height: '48px',
  },
  content: {
    maxWidth: '1440px',
    padding: spacing[6],
  },
  grid: {
    columns: 12,
    gutter: spacing[6],
    margin: spacing[8],
  },
} as const;

// -----------------------------------------------------------------------------
// COMPONENT SIZES
// -----------------------------------------------------------------------------

export const sizes = {
  button: {
    xs: { height: '28px', fontSize: '12px', iconSize: '14px' },
    sm: { height: '32px', fontSize: '13px', iconSize: '16px' },
    md: { height: '40px', fontSize: '14px', iconSize: '18px' },
    lg: { height: '48px', fontSize: '16px', iconSize: '20px' },
    xl: { height: '56px', fontSize: '18px', iconSize: '24px' },
  },
  input: {
    sm: { height: '32px', fontSize: '13px' },
    md: { height: '40px', fontSize: '14px' },
    lg: { height: '48px', fontSize: '16px' },
  },
  avatar: {
    xs: '24px',
    sm: '32px',
    md: '40px',
    lg: '48px',
    xl: '64px',
    '2xl': '96px',
  },
  icon: {
    xs: '12px',
    sm: '14px',
    md: '16px',
    lg: '20px',
    xl: '24px',
    '2xl': '32px',
  },
} as const;

// -----------------------------------------------------------------------------
// EXPORT DEFAULT THEME
// -----------------------------------------------------------------------------

export const theme = {
  colors,
  chartColors,
  statusColors,
  typography,
  spacing,
  componentSpacing,
  borderRadius,
  shadows,
  zIndex,
  transitions,
  breakpoints,
  layout,
  sizes,
} as const;

export type Theme = typeof theme;
export type Colors = typeof colors;
export type ChartColors = typeof chartColors;

export default theme;
