'use client';

import { useEffect, useCallback, useRef } from 'react';

// =============================================================================
// L-ERP MRP - KEYBOARD SHORTCUTS
// Global and component-level keyboard shortcuts
// =============================================================================

// =============================================================================
// TYPES
// =============================================================================

export interface KeyCombo {
  key: string;
  ctrl?: boolean;
  alt?: boolean;
  shift?: boolean;
  meta?: boolean;
}

export interface Shortcut {
  id: string;
  combo: KeyCombo;
  description: string;
  category?: string;
  handler: (e: KeyboardEvent) => void;
  enabled?: boolean;
  preventDefault?: boolean;
}

// =============================================================================
// KEY COMBO UTILITIES
// =============================================================================

/**
 * Parse key combo string like "ctrl+k" or "shift+alt+p"
 */
export function parseKeyCombo(combo: string): KeyCombo {
  const parts = combo.toLowerCase().split('+');
  const key = parts.pop() || '';

  return {
    key,
    ctrl: parts.includes('ctrl') || parts.includes('control'),
    alt: parts.includes('alt'),
    shift: parts.includes('shift'),
    meta: parts.includes('meta') || parts.includes('cmd'),
  };
}

/**
 * Format key combo for display
 */
export function formatKeyCombo(combo: KeyCombo): string {
  const parts: string[] = [];
  
  if (combo.ctrl) parts.push(isMac() ? '⌃' : 'Ctrl');
  if (combo.alt) parts.push(isMac() ? '⌥' : 'Alt');
  if (combo.shift) parts.push(isMac() ? '⇧' : 'Shift');
  if (combo.meta) parts.push(isMac() ? '⌘' : 'Win');
  
  parts.push(formatKey(combo.key));
  
  return parts.join(isMac() ? '' : '+');
}

/**
 * Format single key for display
 */
function formatKey(key: string): string {
  const keyMap: Record<string, string> = {
    escape: 'Esc',
    enter: '↵',
    arrowup: '↑',
    arrowdown: '↓',
    arrowleft: '←',
    arrowright: '→',
    backspace: '⌫',
    delete: 'Del',
    space: 'Space',
    tab: 'Tab',
  };
  
  return keyMap[key.toLowerCase()] || key.toUpperCase();
}

/**
 * Check if on Mac
 */
function isMac(): boolean {
  if (typeof window === 'undefined') return false;
  return navigator.platform.toLowerCase().includes('mac');
}

/**
 * Check if event matches key combo
 */
export function matchesKeyCombo(event: KeyboardEvent, combo: KeyCombo): boolean {
  const key = event.key.toLowerCase();
  
  return (
    key === combo.key.toLowerCase() &&
    event.ctrlKey === !!combo.ctrl &&
    event.altKey === !!combo.alt &&
    event.shiftKey === !!combo.shift &&
    event.metaKey === !!combo.meta
  );
}

// =============================================================================
// SHORTCUTS MANAGER
// =============================================================================

class ShortcutsManager {
  private shortcuts: Map<string, Shortcut> = new Map();
  private enabled = true;

  register(shortcut: Shortcut): () => void {
    this.shortcuts.set(shortcut.id, shortcut);
    return () => this.unregister(shortcut.id);
  }

  unregister(id: string): void {
    this.shortcuts.delete(id);
  }

  enable(): void {
    this.enabled = true;
  }

  disable(): void {
    this.enabled = false;
  }

  getAll(): Shortcut[] {
    return Array.from(this.shortcuts.values());
  }

  getByCategory(category: string): Shortcut[] {
    return this.getAll().filter(s => s.category === category);
  }

  handleKeyDown = (event: KeyboardEvent): void => {
    if (!this.enabled) return;

    // Skip if typing in input/textarea
    const target = event.target as HTMLElement;
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.isContentEditable
    ) {
      // Allow Escape to work in inputs
      if (event.key !== 'Escape') return;
    }

    for (const shortcut of Array.from(this.shortcuts.values())) {
      if (shortcut.enabled === false) continue;

      if (matchesKeyCombo(event, shortcut.combo)) {
        if (shortcut.preventDefault !== false) {
          event.preventDefault();
        }
        shortcut.handler(event);
        return;
      }
    }
  };

  attach(): () => void {
    document.addEventListener('keydown', this.handleKeyDown);
    return () => document.removeEventListener('keydown', this.handleKeyDown);
  }
}

// Global singleton
export const shortcutsManager = new ShortcutsManager();

// =============================================================================
// HOOKS
// =============================================================================

/**
 * Register a keyboard shortcut
 */
export function useKeyboardShortcut(
  combo: string | KeyCombo,
  handler: (e: KeyboardEvent) => void,
  options: {
    id?: string;
    description?: string;
    category?: string;
    enabled?: boolean;
    preventDefault?: boolean;
  } = {}
): void {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  const parsedCombo = typeof combo === 'string' ? parseKeyCombo(combo) : combo;

  useEffect(() => {
    const shortcut: Shortcut = {
      id: options.id || `shortcut-${Date.now()}`,
      combo: parsedCombo,
      description: options.description || '',
      category: options.category,
      handler: (e) => handlerRef.current(e),
      enabled: options.enabled,
      preventDefault: options.preventDefault,
    };

    const unregister = shortcutsManager.register(shortcut);
    return unregister;
  }, [
    parsedCombo.key,
    parsedCombo.ctrl,
    parsedCombo.alt,
    parsedCombo.shift,
    parsedCombo.meta,
    options.id,
    options.enabled,
  ]);
}

/**
 * Register multiple shortcuts
 */
export function useKeyboardShortcuts(
  shortcuts: Array<{
    combo: string | KeyCombo;
    handler: (e: KeyboardEvent) => void;
    id?: string;
    description?: string;
    category?: string;
    enabled?: boolean;
  }>
): void {
  useEffect(() => {
    const unregisters = shortcuts.map((s) => {
      const parsedCombo = typeof s.combo === 'string' ? parseKeyCombo(s.combo) : s.combo;
      return shortcutsManager.register({
        id: s.id || `shortcut-${Date.now()}-${Math.random()}`,
        combo: parsedCombo,
        description: s.description || '',
        category: s.category,
        handler: s.handler,
        enabled: s.enabled,
      });
    });

    return () => unregisters.forEach((fn) => fn());
  }, [shortcuts]);
}

/**
 * Get all registered shortcuts (for help display)
 */
export function useShortcutsList(): Shortcut[] {
  return shortcutsManager.getAll();
}

/**
 * Initialize global keyboard handler
 */
export function useGlobalKeyboardHandler(): void {
  useEffect(() => {
    const detach = shortcutsManager.attach();
    return detach;
  }, []);
}

// =============================================================================
// COMMON SHORTCUTS
// =============================================================================

export const commonShortcuts = {
  // Navigation
  goHome: { combo: 'alt+h', description: 'Về trang chủ' },
  goBack: { combo: 'alt+left', description: 'Quay lại' },
  goForward: { combo: 'alt+right', description: 'Đi tiếp' },
  
  // Actions
  save: { combo: 'ctrl+s', description: 'Lưu' },
  new: { combo: 'ctrl+n', description: 'Tạo mới' },
  search: { combo: 'ctrl+k', description: 'Tìm kiếm' },
  refresh: { combo: 'ctrl+r', description: 'Làm mới' },
  delete: { combo: 'delete', description: 'Xóa' },
  
  // UI
  toggleSidebar: { combo: 'ctrl+b', description: 'Ẩn/hiện sidebar' },
  toggleTheme: { combo: 'ctrl+shift+t', description: 'Đổi theme' },
  help: { combo: 'ctrl+/', description: 'Trợ giúp' },
  escape: { combo: 'escape', description: 'Đóng/Hủy' },
  
  // Table navigation
  selectAll: { combo: 'ctrl+a', description: 'Chọn tất cả' },
  nextRow: { combo: 'arrowdown', description: 'Dòng tiếp' },
  prevRow: { combo: 'arrowup', description: 'Dòng trước' },
};

// =============================================================================
// SHORTCUT HELP COMPONENT
// =============================================================================

export function ShortcutsHelp({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const shortcuts = shortcutsManager.getAll();
  
  // Group by category
  const grouped = shortcuts.reduce((acc, s) => {
    const category = s.category || 'Khác';
    if (!acc[category]) acc[category] = [];
    acc[category].push(s);
    return acc;
  }, {} as Record<string, Shortcut[]>);

  useKeyboardShortcut('escape', onClose, { enabled: isOpen });

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-lg w-full max-h-[80vh] overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Phím tắt
            </h2>
            <button
              onClick={onClose}
              className="p-1 text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
          
          <div className="p-6 overflow-y-auto max-h-[60vh]">
            {Object.entries(grouped).map(([category, items]) => (
              <div key={category} className="mb-6 last:mb-0">
                <h3 className="text-sm font-medium text-gray-500 mb-3">
                  {category}
                </h3>
                <div className="space-y-2">
                  {items.map((shortcut) => (
                    <div
                      key={shortcut.id}
                      className="flex items-center justify-between py-2"
                    >
                      <span className="text-gray-700 dark:text-gray-300">
                        {shortcut.description}
                      </span>
                      <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-sm font-mono">
                        {formatKeyCombo(shortcut.combo)}
                      </kbd>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

export default {
  useKeyboardShortcut,
  useKeyboardShortcuts,
  useShortcutsList,
  useGlobalKeyboardHandler,
  shortcutsManager,
  parseKeyCombo,
  formatKeyCombo,
  matchesKeyCombo,
  commonShortcuts,
  ShortcutsHelp,
};
