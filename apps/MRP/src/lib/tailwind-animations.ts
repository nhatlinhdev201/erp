// =============================================================================
// L-ERP MRP - TAILWIND ANIMATION EXTENSIONS
// Custom animations for Tailwind CSS
// =============================================================================

import type { Config } from 'tailwindcss';

export const animationExtensions: Partial<Config['theme']> = {
  extend: {
    // Custom animations
    animation: {
      // Fade animations
      'fade-in': 'fade-in 0.2s ease-out',
      'fade-out': 'fade-out 0.2s ease-out',
      'fade-in-up': 'fade-in-up 0.3s ease-out',
      'fade-in-down': 'fade-in-down 0.3s ease-out',
      'fade-in-left': 'fade-in-left 0.3s ease-out',
      'fade-in-right': 'fade-in-right 0.3s ease-out',

      // Scale animations
      'scale-in': 'scale-in 0.2s ease-out',
      'scale-out': 'scale-out 0.2s ease-out',
      'scale-in-bounce': 'scale-in-bounce 0.5s ease-out',

      // Slide animations
      'slide-in-top': 'slide-in-top 0.3s ease-out',
      'slide-in-bottom': 'slide-in-bottom 0.3s ease-out',
      'slide-in-left': 'slide-in-left 0.3s ease-out',
      'slide-in-right': 'slide-in-right 0.3s ease-out',

      // Micro-interactions
      'ripple': 'ripple 0.6s linear',
      'pulse-soft': 'pulse-soft 2s ease-in-out infinite',
      'pulse-scale': 'pulse-scale 2s ease-in-out infinite',
      'shake': 'shake 0.5s ease-in-out',
      'bounce-subtle': 'bounce-subtle 1s infinite',
      'spin-slow': 'spin-slow 3s linear infinite',
      'wiggle': 'wiggle 1s ease-in-out infinite',
      'float': 'float 3s ease-in-out infinite',
      'glow': 'glow 2s ease-in-out infinite',
      'shimmer': 'shimmer 1.5s ease-in-out infinite',
      'progress-stripe': 'progress-stripe 1s linear infinite',

      // Page transitions
      'page-enter': 'fade-in-up 0.3s ease-out',
      'page-exit': 'fade-out 0.2s ease-out',

      // Modal
      'modal-enter': 'scale-in 0.2s ease-out',
      'modal-exit': 'scale-out 0.15s ease-out',
      'backdrop-enter': 'fade-in 0.2s ease-out',
      'backdrop-exit': 'fade-out 0.15s ease-out',

      // Dropdown
      'dropdown-enter': 'fade-in-down 0.15s ease-out',
      'dropdown-exit': 'fade-out 0.1s ease-out',

      // Toast
      'toast-enter': 'slide-in-right 0.3s ease-out',
      'toast-exit': 'fade-in-right 0.2s ease-out reverse',

      // Sidebar
      'sidebar-enter': 'slide-in-left 0.3s ease-out',
      'sidebar-exit': 'slide-in-left 0.2s ease-out reverse',
    },

    // Keyframes
    keyframes: {
      'fade-in': {
        from: { opacity: '0' },
        to: { opacity: '1' },
      },
      'fade-out': {
        from: { opacity: '1' },
        to: { opacity: '0' },
      },
      'fade-in-up': {
        from: { opacity: '0', transform: 'translateY(20px)' },
        to: { opacity: '1', transform: 'translateY(0)' },
      },
      'fade-in-down': {
        from: { opacity: '0', transform: 'translateY(-20px)' },
        to: { opacity: '1', transform: 'translateY(0)' },
      },
      'fade-in-left': {
        from: { opacity: '0', transform: 'translateX(20px)' },
        to: { opacity: '1', transform: 'translateX(0)' },
      },
      'fade-in-right': {
        from: { opacity: '0', transform: 'translateX(-20px)' },
        to: { opacity: '1', transform: 'translateX(0)' },
      },
      'scale-in': {
        from: { opacity: '0', transform: 'scale(0.95)' },
        to: { opacity: '1', transform: 'scale(1)' },
      },
      'scale-out': {
        from: { opacity: '1', transform: 'scale(1)' },
        to: { opacity: '0', transform: 'scale(0.95)' },
      },
      'scale-in-bounce': {
        '0%': { opacity: '0', transform: 'scale(0.3)' },
        '50%': { transform: 'scale(1.05)' },
        '70%': { transform: 'scale(0.9)' },
        '100%': { opacity: '1', transform: 'scale(1)' },
      },
      'slide-in-top': {
        from: { opacity: '0', transform: 'translateY(-100%)' },
        to: { opacity: '1', transform: 'translateY(0)' },
      },
      'slide-in-bottom': {
        from: { opacity: '0', transform: 'translateY(100%)' },
        to: { opacity: '1', transform: 'translateY(0)' },
      },
      'slide-in-left': {
        from: { opacity: '0', transform: 'translateX(-100%)' },
        to: { opacity: '1', transform: 'translateX(0)' },
      },
      'slide-in-right': {
        from: { opacity: '0', transform: 'translateX(100%)' },
        to: { opacity: '1', transform: 'translateX(0)' },
      },
      'ripple': {
        from: { transform: 'scale(0)', opacity: '1' },
        to: { transform: 'scale(4)', opacity: '0' },
      },
      'pulse-soft': {
        '0%, 100%': { opacity: '1' },
        '50%': { opacity: '0.5' },
      },
      'pulse-scale': {
        '0%, 100%': { transform: 'scale(1)' },
        '50%': { transform: 'scale(1.05)' },
      },
      'shake': {
        '0%, 100%': { transform: 'translateX(0)' },
        '10%, 30%, 50%, 70%, 90%': { transform: 'translateX(-4px)' },
        '20%, 40%, 60%, 80%': { transform: 'translateX(4px)' },
      },
      'bounce-subtle': {
        '0%, 100%': { transform: 'translateY(0)' },
        '50%': { transform: 'translateY(-5px)' },
      },
      'spin-slow': {
        from: { transform: 'rotate(0deg)' },
        to: { transform: 'rotate(360deg)' },
      },
      'wiggle': {
        '0%, 100%': { transform: 'rotate(0deg)' },
        '25%': { transform: 'rotate(-5deg)' },
        '75%': { transform: 'rotate(5deg)' },
      },
      'float': {
        '0%, 100%': { transform: 'translateY(0)' },
        '50%': { transform: 'translateY(-10px)' },
      },
      'glow': {
        '0%, 100%': { boxShadow: '0 0 5px currentColor, 0 0 10px currentColor' },
        '50%': { boxShadow: '0 0 20px currentColor, 0 0 30px currentColor' },
      },
      'shimmer': {
        '0%': { backgroundPosition: '-200% 0' },
        '100%': { backgroundPosition: '200% 0' },
      },
      'progress-stripe': {
        '0%': { backgroundPosition: '1rem 0' },
        '100%': { backgroundPosition: '0 0' },
      },
    },

    // Transition timing functions
    transitionTimingFunction: {
      'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
      'bounce': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      'spring': 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
      'snappy': 'cubic-bezier(0.2, 0, 0, 1)',
    },

    // Transition durations
    transitionDuration: {
      '0': '0ms',
      '150': '150ms',
      '200': '200ms',
      '250': '250ms',
      '300': '300ms',
      '400': '400ms',
      '500': '500ms',
    },
  },
};

export default animationExtensions;
