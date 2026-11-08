// ═══════════════════════════════════════════════════════════════════════════════
// L-ERP MRP TAILWIND CONFIG v2.0
// "Industrial Precision" Theme
// ═══════════════════════════════════════════════════════════════════════════════
//
// HƯỚNG DẪN TÍCH HỢP:
// 1. Replace nội dung tailwind.config.ts hiện tại với file này
// 2. Import fonts trong layout.tsx hoặc globals.css
// 3. Apply các utility classes theo design system
//
// ═══════════════════════════════════════════════════════════════════════════════

import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    // ═══ FONT FAMILIES ═══
    fontFamily: {
      display: ['JetBrains Mono', 'monospace'],
      body: ['IBM Plex Sans', 'sans-serif'],
      mono: ['IBM Plex Mono', 'monospace'],
    },
    
    // ═══ FONT SIZES (Compact scale) ═══
    fontSize: {
      'xs': ['11px', { lineHeight: '1.4' }],
      'sm': ['12px', { lineHeight: '1.4' }],
      'base': ['13px', { lineHeight: '1.5' }],
      'md': ['14px', { lineHeight: '1.5' }],
      'lg': ['16px', { lineHeight: '1.5' }],
      'xl': ['20px', { lineHeight: '1.3' }],
      '2xl': ['24px', { lineHeight: '1.2' }],
      '3xl': ['28px', { lineHeight: '1.2' }],
    },
    
    extend: {
      // ═══ COLORS: Industrial Palette ═══
      colors: {
        // Primary backgrounds
        'steel': {
          dark: '#1A1D23',
          DEFAULT: '#1A1D23',
        },
        'gunmetal': {
          DEFAULT: '#2D3139',
          light: '#363B44',
        },
        'slate': {
          DEFAULT: '#3D4450',
          light: '#4A5568',
        },
        
        // Status colors (functional, not decorative)
        'production': {
          green: '#22C55E',
          'green-dim': 'rgba(34, 197, 94, 0.2)',
        },
        'alert': {
          amber: '#F59E0B',
          'amber-dim': 'rgba(245, 158, 11, 0.2)',
        },
        'urgent': {
          red: '#EF4444',
          'red-dim': 'rgba(239, 68, 68, 0.2)',
        },
        'info': {
          cyan: '#06B6D4',
          'cyan-dim': 'rgba(6, 182, 212, 0.2)',
        },
        
        // Chart colors
        'chart': {
          blue: '#3B82F6',
          emerald: '#10B981',
          violet: '#8B5CF6',
          orange: '#F97316',
        },
        
        // Text colors
        'mrp-text': {
          primary: '#F4F4F5',
          secondary: '#A1A1AA',
          muted: '#71717A',
          disabled: '#52525B',
        },
        
        // Border colors
        'mrp-border': {
          DEFAULT: '#3D4450',
          light: '#52525B',
          focus: '#06B6D4',
        },
      },
      
      // ═══ SPACING (4px base, tight) ═══
      spacing: {
        '0.5': '2px',
        '1': '4px',
        '1.5': '6px',
        '2': '8px',
        '2.5': '10px',
        '3': '12px',
        '3.5': '14px',
        '4': '16px',
        '5': '20px',
        '6': '24px',
        '8': '32px',
        '10': '40px',
        '12': '48px',
      },
      
      // ═══ SIZING ═══
      height: {
        'header': '48px',
        'toolbar': '40px',
        'statusbar': '24px',
        'row': '36px',
        'input': '32px',
        'btn': '32px',
        'btn-sm': '28px',
      },
      
      width: {
        'sidebar': '56px',
        'sidebar-expanded': '200px',
      },
      
      // ═══ BORDER RADIUS (Sharp edges - minimal) ═══
      borderRadius: {
        'none': '0',
        'sm': '2px',
        DEFAULT: '0',  // Sharp edges by default
      },
      
      // ═══ BOX SHADOW (Minimal - flat design) ═══
      boxShadow: {
        'none': 'none',
        'subtle': '0 1px 2px rgba(0, 0, 0, 0.2)',
        'dropdown': '0 4px 12px rgba(0, 0, 0, 0.3)',
      },
      
      // ═══ TRANSITIONS ═══
      transitionDuration: {
        'fast': '100ms',
        'base': '150ms',
        'slow': '300ms',
      },
      
      // ═══ KEYFRAMES & ANIMATIONS ═══
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-in': {
          '0%': { transform: 'translateX(-10px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        'pulse-alert': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.15s ease-out',
        'slide-in': 'slide-in 0.2s ease-out',
        'pulse-alert': 'pulse-alert 2s ease-in-out infinite',
      },
    },
  },
  
  plugins: [
    // Custom plugin for MRP-specific utilities
    function({ addUtilities, addComponents, theme }: any) {
      // ═══ UTILITY CLASSES ═══
      addUtilities({
        // Text utilities
        '.text-label': {
          fontSize: '11px',
          fontWeight: '500',
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          color: theme('colors.mrp-text.muted'),
        },
        '.text-value': {
          fontFamily: theme('fontFamily.mono'),
          fontSize: '28px',
          fontWeight: '600',
          color: theme('colors.mrp-text.primary'),
        },
        '.text-mono-data': {
          fontFamily: theme('fontFamily.mono'),
          fontSize: '13px',
        },
        
        // Status dots
        '.status-dot': {
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '12px',
          '&::before': {
            content: '""',
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: 'currentColor',
          },
        },
        '.status-dot-active': { color: theme('colors.production.green') },
        '.status-dot-pending': { color: theme('colors.alert.amber') },
        '.status-dot-overdue': { color: theme('colors.urgent.red') },
        '.status-dot-completed': { color: theme('colors.mrp-text.muted') },
      })
      
      // ═══ COMPONENT CLASSES ═══
      addComponents({
        // Buttons
        '.btn': {
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
          height: '32px',
          padding: '0 12px',
          fontFamily: theme('fontFamily.body'),
          fontSize: '13px',
          fontWeight: '500',
          border: '1px solid transparent',
          cursor: 'pointer',
          transition: 'all 100ms ease',
          '&:disabled': {
            opacity: '0.5',
            cursor: 'not-allowed',
          },
        },
        '.btn-primary': {
          backgroundColor: theme('colors.info.cyan'),
          color: theme('colors.steel.dark'),
          borderColor: theme('colors.info.cyan'),
          '&:hover:not(:disabled)': {
            backgroundColor: '#0891B2',
          },
        },
        '.btn-secondary': {
          backgroundColor: theme('colors.slate.DEFAULT'),
          color: theme('colors.mrp-text.primary'),
          borderColor: theme('colors.mrp-border.DEFAULT'),
          '&:hover:not(:disabled)': {
            backgroundColor: theme('colors.slate.light'),
          },
        },
        '.btn-ghost': {
          backgroundColor: 'transparent',
          color: theme('colors.mrp-text.secondary'),
          '&:hover:not(:disabled)': {
            backgroundColor: theme('colors.slate.DEFAULT'),
            color: theme('colors.mrp-text.primary'),
          },
        },
        '.btn-danger': {
          backgroundColor: theme('colors.urgent.red-dim'),
          color: theme('colors.urgent.red'),
          borderColor: 'rgba(239, 68, 68, 0.3)',
          '&:hover:not(:disabled)': {
            backgroundColor: 'rgba(239, 68, 68, 0.3)',
          },
        },
        '.btn-sm': {
          height: '28px',
          padding: '0 8px',
          fontSize: '12px',
        },
        
        // Inputs
        '.input': {
          height: '32px',
          padding: '0 12px',
          backgroundColor: theme('colors.slate.DEFAULT'),
          border: `1px solid ${theme('colors.mrp-border.DEFAULT')}`,
          color: theme('colors.mrp-text.primary'),
          fontFamily: theme('fontFamily.body'),
          fontSize: '13px',
          transition: 'all 100ms ease',
          '&::placeholder': {
            color: theme('colors.mrp-text.muted'),
          },
          '&:focus': {
            outline: 'none',
            borderColor: theme('colors.mrp-border.focus'),
            backgroundColor: theme('colors.gunmetal.DEFAULT'),
          },
        },
        
        // Cards
        '.card': {
          backgroundColor: 'rgba(45, 49, 57, 0.5)',
          border: `1px solid ${theme('colors.mrp-border.DEFAULT')}`,
        },
        '.card-header': {
          padding: '12px 16px',
          borderBottom: `1px solid ${theme('colors.mrp-border.DEFAULT')}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        },
        '.card-title': {
          fontSize: '12px',
          fontWeight: '600',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          color: theme('colors.mrp-text.secondary'),
        },
        
        // Badges
        '.badge': {
          display: 'inline-flex',
          alignItems: 'center',
          padding: '2px 8px',
          fontSize: '10px',
          fontWeight: '500',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        },
        '.badge-success': {
          backgroundColor: theme('colors.production.green-dim'),
          color: theme('colors.production.green'),
        },
        '.badge-warning': {
          backgroundColor: theme('colors.alert.amber-dim'),
          color: theme('colors.alert.amber'),
        },
        '.badge-danger': {
          backgroundColor: theme('colors.urgent.red-dim'),
          color: theme('colors.urgent.red'),
        },
        '.badge-info': {
          backgroundColor: theme('colors.info.cyan-dim'),
          color: theme('colors.info.cyan'),
        },
        
        // KPI Card
        '.kpi-card': {
          backgroundColor: theme('colors.gunmetal.DEFAULT'),
          border: `1px solid ${theme('colors.mrp-border.DEFAULT')}`,
          padding: '16px',
        },
        '.kpi-label': {
          fontSize: '11px',
          fontWeight: '500',
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          color: theme('colors.mrp-text.muted'),
          marginBottom: '8px',
        },
        '.kpi-value': {
          fontFamily: theme('fontFamily.mono'),
          fontSize: '28px',
          fontWeight: '600',
          color: theme('colors.mrp-text.primary'),
          lineHeight: '1.2',
        },
        '.kpi-delta': {
          fontSize: '11px',
          marginTop: '8px',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
        },
        '.kpi-delta-positive': { color: theme('colors.production.green') },
        '.kpi-delta-negative': { color: theme('colors.urgent.red') },
      })
    },
  ],
}

export default config
