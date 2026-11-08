// src/hooks/use-auto-save.ts
// Auto-save form data to localStorage to prevent data loss

'use client'

import { useEffect, useCallback, useRef } from 'react'

interface UseAutoSaveOptions<T> {
  /** Unique key for this form (e.g. 'employee-form-create' or 'employee-form-edit-{id}') */
  key: string
  /** Current form data */
  data: T
  /** Debounce delay in milliseconds (default: 1000) */
  debounceMs?: number
  /** Whether auto-save is enabled (default: true) */
  enabled?: boolean
}

interface UseAutoSaveReturn<T> {
  /** Restore previously saved data, or null if none exists */
  restore: () => T | null
  /** Clear saved data (call after successful form submission) */
  clear: () => void
  /** Whether there is saved data available to restore */
  hasSavedData: boolean
}

const STORAGE_PREFIX = 'lerp-hrm:autosave:'

/**
 * Hook to auto-save form data to localStorage.
 * Prevents data loss when user accidentally navigates away.
 *
 * Usage:
 * ```tsx
 * const { restore, clear, hasSavedData } = useAutoSave({
 *   key: 'employee-form-create',
 *   data: formData,
 * })
 *
 * // On mount, offer to restore
 * useEffect(() => {
 *   if (hasSavedData) {
 *     const saved = restore()
 *     if (saved && confirm('Bạn có dữ liệu chưa lưu. Khôi phục?')) {
 *       setFormData(saved)
 *     }
 *   }
 * }, [])
 *
 * // After successful save
 * const onSubmit = async () => {
 *   await saveToServer(formData)
 *   clear()
 * }
 * ```
 */
export function useAutoSave<T>({
  key,
  data,
  debounceMs = 1000,
  enabled = true,
}: UseAutoSaveOptions<T>): UseAutoSaveReturn<T> {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const storageKey = `${STORAGE_PREFIX}${key}`

  // Auto-save on data change (debounced)
  useEffect(() => {
    if (!enabled) return

    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }

    timerRef.current = setTimeout(() => {
      try {
        const serialized = JSON.stringify({
          data,
          savedAt: Date.now(),
        })
        localStorage.setItem(storageKey, serialized)
      } catch {
        // localStorage full or unavailable — silently fail
      }
    }, debounceMs)

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [data, storageKey, debounceMs, enabled])

  const restore = useCallback((): T | null => {
    try {
      const raw = localStorage.getItem(storageKey)
      if (!raw) return null

      const parsed = JSON.parse(raw)

      // Expire after 24 hours
      if (Date.now() - parsed.savedAt > 24 * 60 * 60 * 1000) {
        localStorage.removeItem(storageKey)
        return null
      }

      return parsed.data as T
    } catch {
      return null
    }
  }, [storageKey])

  const clear = useCallback(() => {
    try {
      localStorage.removeItem(storageKey)
    } catch {
      // silently fail
    }
  }, [storageKey])

  const hasSavedData = (() => {
    if (typeof window === 'undefined') return false
    try {
      const raw = localStorage.getItem(storageKey)
      if (!raw) return false
      const parsed = JSON.parse(raw)
      return Date.now() - parsed.savedAt < 24 * 60 * 60 * 1000
    } catch {
      return false
    }
  })()

  return { restore, clear, hasSavedData }
}
