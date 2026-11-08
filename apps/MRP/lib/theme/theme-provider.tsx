'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import { Sun, Moon, Monitor, Palette, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

// =============================================================================
// L-ERP MRP - THEME SYSTEM
// Dark mode, color schemes, and theme persistence
// =============================================================================

// =============================================================================
// TYPES
// =============================================================================

type ThemeMode = 'light' | 'dark' | 'system';

type ColorScheme = 
  | 'purple'   // Default
  | 'blue'
  | 'green'
  | 'orange'
  | 'red'
  | 'pink'
  | 'teal';

interface ThemeConfig {
  mode: ThemeMode;
  colorScheme: ColorScheme;
  reducedMotion: boolean;
  fontSize: 'sm' | 'base' | 'lg';
}

interface ThemeContextType extends ThemeConfig {
  isDark: boolean;
  setMode: (mode: ThemeMode) => void;
  setColorScheme: (scheme: ColorScheme) => void;
  setReducedMotion: (reduced: boolean) => void;
  setFontSize: (size: 'sm' | 'base' | 'lg') => void;
  toggleMode: () => void;
  resetTheme: () => void;
}

// =============================================================================
// COLOR SCHEMES
// =============================================================================

export const colorSchemes: Record<ColorScheme, {
  name: string;
  primary: string;
  primaryHover: string;
  primaryLight: string;
  gradient: string;
}> = {
  purple: {
    name: 'Tím',
    primary: '#8B5CF6',
    primaryHover: '#7C3AED',
    primaryLight: '#EDE9FE',
    gradient: 'from-purple-600 to-indigo-600',
  },
  blue: {
    name: 'Xanh dương',
    primary: '#3B82F6',
    primaryHover: '#2563EB',
    primaryLight: '#DBEAFE',
    gradient: 'from-blue-600 to-cyan-600',
  },
  green: {
    name: 'Xanh lá',
    primary: '#10B981',
    primaryHover: '#059669',
    primaryLight: '#D1FAE5',
    gradient: 'from-green-600 to-emerald-600',
  },
  orange: {
    name: 'Cam',
    primary: '#F59E0B',
    primaryHover: '#D97706',
    primaryLight: '#FEF3C7',
    gradient: 'from-orange-500 to-amber-500',
  },
  red: {
    name: 'Đỏ',
    primary: '#EF4444',
    primaryHover: '#DC2626',
    primaryLight: '#FEE2E2',
    gradient: 'from-red-600 to-rose-600',
  },
  pink: {
    name: 'Hồng',
    primary: '#EC4899',
    primaryHover: '#DB2777',
    primaryLight: '#FCE7F3',
    gradient: 'from-pink-600 to-rose-600',
  },
  teal: {
    name: 'Xanh ngọc',
    primary: '#14B8A6',
    primaryHover: '#0D9488',
    primaryLight: '#CCFBF1',
    gradient: 'from-teal-600 to-cyan-600',
  },
};

// =============================================================================
// STORAGE
// =============================================================================

const THEME_STORAGE_KEY = 'lerp-mrp-theme';

const defaultTheme: ThemeConfig = {
  mode: 'system',
  colorScheme: 'purple',
  reducedMotion: false,
  fontSize: 'base',
};

function loadTheme(): ThemeConfig {
  if (typeof window === 'undefined') return defaultTheme;
  
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored) {
      return { ...defaultTheme, ...JSON.parse(stored) };
    }
  } catch {}
  
  return defaultTheme;
}

function saveTheme(theme: ThemeConfig): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(theme));
}

// =============================================================================
// CONTEXT
// =============================================================================

const ThemeContext = createContext<ThemeContextType | null>(null);

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}

// =============================================================================
// PROVIDER
// =============================================================================

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultMode?: ThemeMode;
  defaultColorScheme?: ColorScheme;
}

export function ThemeProvider({
  children,
  defaultMode,
  defaultColorScheme,
}: ThemeProviderProps) {
  const [config, setConfig] = useState<ThemeConfig>(() => ({
    ...loadTheme(),
    mode: defaultMode || loadTheme().mode,
    colorScheme: defaultColorScheme || loadTheme().colorScheme,
  }));
  
  const [systemDark, setSystemDark] = useState(false);

  // Detect system preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setSystemDark(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // Apply theme to document
  useEffect(() => {
    const isDark = config.mode === 'dark' || (config.mode === 'system' && systemDark);
    
    // Apply dark mode
    document.documentElement.classList.toggle('dark', isDark);
    
    // Apply color scheme
    const scheme = colorSchemes[config.colorScheme];
    document.documentElement.style.setProperty('--color-primary', scheme.primary);
    document.documentElement.style.setProperty('--color-primary-hover', scheme.primaryHover);
    document.documentElement.style.setProperty('--color-primary-light', scheme.primaryLight);
    
    // Apply font size
    const fontSizes = { sm: '14px', base: '16px', lg: '18px' };
    document.documentElement.style.setProperty('--font-size-base', fontSizes[config.fontSize]);
    
    // Apply reduced motion
    if (config.reducedMotion) {
      document.documentElement.classList.add('reduce-motion');
    } else {
      document.documentElement.classList.remove('reduce-motion');
    }
    
    // Save to storage
    saveTheme(config);
  }, [config, systemDark]);

  // Computed isDark
  const isDark = useMemo(() => {
    return config.mode === 'dark' || (config.mode === 'system' && systemDark);
  }, [config.mode, systemDark]);

  // Actions
  const setMode = useCallback((mode: ThemeMode) => {
    setConfig(prev => ({ ...prev, mode }));
  }, []);

  const setColorScheme = useCallback((colorScheme: ColorScheme) => {
    setConfig(prev => ({ ...prev, colorScheme }));
  }, []);

  const setReducedMotion = useCallback((reducedMotion: boolean) => {
    setConfig(prev => ({ ...prev, reducedMotion }));
  }, []);

  const setFontSize = useCallback((fontSize: 'sm' | 'base' | 'lg') => {
    setConfig(prev => ({ ...prev, fontSize }));
  }, []);

  const toggleMode = useCallback(() => {
    setConfig(prev => ({
      ...prev,
      mode: prev.mode === 'light' ? 'dark' : prev.mode === 'dark' ? 'system' : 'light',
    }));
  }, []);

  const resetTheme = useCallback(() => {
    setConfig(defaultTheme);
  }, []);

  const value: ThemeContextType = {
    ...config,
    isDark,
    setMode,
    setColorScheme,
    setReducedMotion,
    setFontSize,
    toggleMode,
    resetTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

// =============================================================================
// THEME TOGGLE BUTTON
// =============================================================================

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

export function ThemeToggle({ className, showLabel = false }: ThemeToggleProps) {
  const { mode, isDark, toggleMode } = useTheme();

  const icons = {
    light: Sun,
    dark: Moon,
    system: Monitor,
  };

  const labels = {
    light: 'Sáng',
    dark: 'Tối',
    system: 'Hệ thống',
  };

  const Icon = icons[mode];

  return (
    <button
      onClick={toggleMode}
      className={cn(
        'flex items-center gap-2 p-2 rounded-xl transition-colors',
        'hover:bg-gray-100 dark:hover:bg-gray-800',
        'text-gray-600 dark:text-gray-400',
        className
      )}
      title={`Chế độ: ${labels[mode]}`}
    >
      <Icon className="w-5 h-5" />
      {showLabel && <span className="text-sm">{labels[mode]}</span>}
    </button>
  );
}

// =============================================================================
// THEME SELECTOR
// =============================================================================

interface ThemeSelectorProps {
  className?: string;
}

export function ThemeSelector({ className }: ThemeSelectorProps) {
  const { mode, setMode, colorScheme, setColorScheme, fontSize, setFontSize } = useTheme();

  const modeOptions: { value: ThemeMode; label: string; icon: React.ReactNode }[] = [
    { value: 'light', label: 'Sáng', icon: <Sun className="w-4 h-4" /> },
    { value: 'dark', label: 'Tối', icon: <Moon className="w-4 h-4" /> },
    { value: 'system', label: 'Hệ thống', icon: <Monitor className="w-4 h-4" /> },
  ];

  const fontOptions: { value: 'sm' | 'base' | 'lg'; label: string }[] = [
    { value: 'sm', label: 'Nhỏ' },
    { value: 'base', label: 'Vừa' },
    { value: 'lg', label: 'Lớn' },
  ];

  return (
    <div className={cn('space-y-6', className)}>
      {/* Mode Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Chế độ hiển thị
        </label>
        <div className="flex gap-2">
          {modeOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setMode(option.value)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-xl border transition-all',
                mode === option.value
                  ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              )}
            >
              {option.icon}
              <span className="text-sm">{option.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Color Scheme */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          <Palette className="w-4 h-4 inline mr-2" />
          Màu chủ đạo
        </label>
        <div className="grid grid-cols-4 gap-3">
          {(Object.keys(colorSchemes) as ColorScheme[]).map((scheme) => (
            <button
              key={scheme}
              onClick={() => setColorScheme(scheme)}
              className={cn(
                'relative flex flex-col items-center gap-2 p-3 rounded-xl border transition-all',
                colorScheme === scheme
                  ? 'border-gray-400 dark:border-gray-500 ring-2 ring-offset-2 ring-gray-400'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
              )}
            >
              <div
                className="w-8 h-8 rounded-full"
                style={{ backgroundColor: colorSchemes[scheme].primary }}
              />
              <span className="text-xs text-gray-600 dark:text-gray-400">
                {colorSchemes[scheme].name}
              </span>
              {colorScheme === scheme && (
                <Check className="absolute top-2 right-2 w-4 h-4 text-gray-600" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Font Size */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Cỡ chữ
        </label>
        <div className="flex gap-2">
          {fontOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setFontSize(option.value)}
              className={cn(
                'flex-1 px-4 py-2 rounded-xl border transition-all text-center',
                fontSize === option.value
                  ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
              )}
            >
              <span className={cn(
                option.value === 'sm' && 'text-sm',
                option.value === 'base' && 'text-base',
                option.value === 'lg' && 'text-lg'
              )}>
                {option.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// QUICK THEME SWITCHER (for header)
// =============================================================================

export function QuickThemeSwitcher() {
  const { isDark, toggleMode, colorScheme } = useTheme();
  const scheme = colorSchemes[colorScheme];

  return (
    <button
      onClick={toggleMode}
      className="relative p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors group"
      title="Đổi chế độ sáng/tối"
    >
      <div className="relative w-5 h-5">
        <Sun className={cn(
          'absolute inset-0 w-5 h-5 transition-all duration-300',
          isDark ? 'opacity-0 rotate-90 scale-50' : 'opacity-100 rotate-0 scale-100'
        )} style={{ color: scheme.primary }} />
        <Moon className={cn(
          'absolute inset-0 w-5 h-5 transition-all duration-300',
          isDark ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-50'
        )} style={{ color: scheme.primary }} />
      </div>
    </button>
  );
}

export default ThemeProvider;
