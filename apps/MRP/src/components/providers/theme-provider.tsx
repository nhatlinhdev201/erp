// =============================================================================
// L-ERP MRP - THEME PROVIDER
// Dark/Light mode with system preference detection
// =============================================================================

'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

// =============================================================================
// TYPES
// =============================================================================

export type Theme = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

interface ThemeContextValue {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  isDark: boolean;
}

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
  enableSystem?: boolean;
  disableTransitionOnChange?: boolean;
}

// =============================================================================
// CONTEXT
// =============================================================================

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

// =============================================================================
// HELPERS
// =============================================================================

function getSystemTheme(): ResolvedTheme {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function getStoredTheme(key: string): Theme | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(key) as Theme | null;
  } catch {
    return null;
  }
}

function setStoredTheme(key: string, theme: Theme): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, theme);
  } catch {
    // Ignore storage errors
  }
}

// =============================================================================
// PROVIDER
// =============================================================================

export function ThemeProvider({
  children,
  defaultTheme = 'system',
  storageKey = 'lerp-mrp-theme',
  enableSystem = true,
  disableTransitionOnChange = false,
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(() => {
    const stored = getStoredTheme(storageKey);
    return stored || defaultTheme;
  });

  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() => {
    if (theme === 'system') return getSystemTheme();
    return theme as ResolvedTheme;
  });

  // Apply theme to document
  const applyTheme = useCallback((newTheme: ResolvedTheme) => {
    const root = document.documentElement;

    // Disable transitions temporarily if requested
    if (disableTransitionOnChange) {
      root.style.setProperty('--transition-duration', '0s');
    }

    // Remove existing theme classes
    root.classList.remove('light', 'dark');

    // Add new theme class
    root.classList.add(newTheme);

    // Set color-scheme for native elements
    root.style.colorScheme = newTheme;

    // Re-enable transitions
    if (disableTransitionOnChange) {
      // Use requestAnimationFrame to ensure the class change has taken effect
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          root.style.removeProperty('--transition-duration');
        });
      });
    }
  }, [disableTransitionOnChange]);

  // Handle theme change
  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    setStoredTheme(storageKey, newTheme);

    const resolved = newTheme === 'system' ? getSystemTheme() : newTheme as ResolvedTheme;
    setResolvedTheme(resolved);
    applyTheme(resolved);
  }, [storageKey, applyTheme]);

  // Toggle between light and dark
  const toggleTheme = useCallback(() => {
    const newTheme = resolvedTheme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
  }, [resolvedTheme, setTheme]);

  // Listen for system theme changes
  useEffect(() => {
    if (!enableSystem) return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = (e: MediaQueryListEvent) => {
      if (theme === 'system') {
        const newResolved = e.matches ? 'dark' : 'light';
        setResolvedTheme(newResolved);
        applyTheme(newResolved);
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme, enableSystem, applyTheme]);

  // Initial theme application
  useEffect(() => {
    applyTheme(resolvedTheme);
  }, []);

  const value: ThemeContextValue = {
    theme,
    resolvedTheme,
    setTheme,
    toggleTheme,
    isDark: resolvedTheme === 'dark',
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

// =============================================================================
// HOOK
// =============================================================================

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

// =============================================================================
// THEME TOGGLE COMPONENT
// =============================================================================

interface ThemeToggleProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export function ThemeToggle({ className = '', size = 'md', showLabel = false }: ThemeToggleProps) {
  const { theme, setTheme, resolvedTheme, isDark } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className={`theme-toggle-skeleton ${size} ${className}`} />
    );
  }

  const sizes = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <button
        onClick={() => setTheme(isDark ? 'light' : 'dark')}
        className={`
          ${sizes[size]}
          relative flex items-center justify-center
          rounded-full
          bg-gray-100 dark:bg-neutral-800
          hover:bg-gray-200 dark:hover:bg-neutral-700
          border border-gray-200 dark:border-neutral-700
          transition-all duration-300 ease-out
          hover:scale-105 active:scale-95
          focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
          dark:focus:ring-offset-gray-900
          group
        `}
        aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      >
        {/* Sun icon */}
        <svg
          className={`
            ${iconSizes[size]}
            absolute
            text-amber-500
            transition-all duration-500
            ${isDark ? 'opacity-0 rotate-90 scale-0' : 'opacity-100 rotate-0 scale-100'}
          `}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
          />
        </svg>

        {/* Moon icon */}
        <svg
          className={`
            ${iconSizes[size]}
            absolute
            text-blue-400
            transition-all duration-500
            ${isDark ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-0'}
          `}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
          />
        </svg>
      </button>

      {showLabel && (
        <span className="text-sm text-gray-600 dark:text-neutral-400 capitalize">
          {theme === 'system' ? `System (${resolvedTheme})` : resolvedTheme}
        </span>
      )}
    </div>
  );
}

// =============================================================================
// THEME SELECTOR (DROPDOWN)
// =============================================================================

interface ThemeSelectorProps {
  className?: string;
}

export function ThemeSelector({ className = '' }: ThemeSelectorProps) {
  const { theme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const themes: { value: Theme; label: string; icon: string }[] = [
    { value: 'light', label: 'Light', icon: '☀️' },
    { value: 'dark', label: 'Dark', icon: '🌙' },
    { value: 'system', label: 'System', icon: '💻' },
  ];

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="
          flex items-center gap-2 px-3 py-2
          rounded-lg
          bg-gray-100 dark:bg-neutral-800
          hover:bg-gray-200 dark:hover:bg-neutral-700
          border border-gray-200 dark:border-neutral-700
          text-sm font-medium
          transition-all duration-200
        "
      >
        <span>{themes.find(t => t.value === theme)?.icon}</span>
        <span className="capitalize">{theme}</span>
        <svg
          className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="
            absolute right-0 top-full mt-2 z-50
            min-w-[140px]
            bg-white dark:bg-neutral-800
            border border-gray-200 dark:border-neutral-700
            rounded-lg shadow-lg
            py-1
            animate-in fade-in slide-in-from-top-2 duration-200
          ">
            {themes.map(({ value, label, icon }) => (
              <button
                key={value}
                onClick={() => {
                  setTheme(value);
                  setIsOpen(false);
                }}
                className={`
                  w-full flex items-center gap-2 px-3 py-2
                  text-sm text-left
                  transition-colors duration-150
                  ${theme === value
                    ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'
                    : 'hover:bg-gray-100 dark:hover:bg-neutral-700'}
                `}
              >
                <span>{icon}</span>
                <span>{label}</span>
                {theme === value && (
                  <svg className="w-4 h-4 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
