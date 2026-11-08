// src/lib/i18n/index.ts
// i18n Context and Hooks for multi-language support

'use client'

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { vi, type Translations } from './vi'
import { en } from './en'

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

export type Locale = 'vi' | 'en'

export interface I18nContextType {
    locale: Locale
    t: Translations
    setLocale: (locale: Locale) => void
    formatNumber: (num: number) => string
    formatCurrency: (amount: number) => string
    formatDate: (date: Date | string, format?: 'short' | 'long' | 'full') => string
}

// ═══════════════════════════════════════════════════════════════
// TRANSLATIONS MAP
// ═══════════════════════════════════════════════════════════════

const translations: Record<Locale, Translations> = {
    vi,
    en: en as unknown as Translations,
}

// ═══════════════════════════════════════════════════════════════
// CONTEXT
// ═══════════════════════════════════════════════════════════════

const I18nContext = createContext<I18nContextType | undefined>(undefined)

// ═══════════════════════════════════════════════════════════════
// PROVIDER
// ═══════════════════════════════════════════════════════════════

export interface I18nProviderProps {
    children: React.ReactNode
    defaultLocale?: Locale
}

export function I18nProvider({ children, defaultLocale = 'vi' }: I18nProviderProps) {
    const [locale, setLocaleState] = useState<Locale>(defaultLocale)

    // Load saved locale from localStorage
    useEffect(() => {
        const saved = localStorage.getItem('lerp-hr-locale') as Locale | null
        if (saved && translations[saved]) {
            setLocaleState(saved)
        }
    }, [])

    // Set locale and persist
    const setLocale = useCallback((newLocale: Locale) => {
        setLocaleState(newLocale)
        localStorage.setItem('lerp-hr-locale', newLocale)
        document.documentElement.lang = newLocale
    }, [])

    // Format number based on locale
    const formatNumber = useCallback((num: number): string => {
        return new Intl.NumberFormat(locale === 'vi' ? 'vi-VN' : 'en-US').format(num)
    }, [locale])

    // Format currency (VND)
    const formatCurrency = useCallback((amount: number): string => {
        return new Intl.NumberFormat(locale === 'vi' ? 'vi-VN' : 'en-US', {
            style: 'currency',
            currency: 'VND',
            maximumFractionDigits: 0,
        }).format(amount)
    }, [locale])

    // Format date based on locale
    const formatDate = useCallback((
        date: Date | string,
        format: 'short' | 'long' | 'full' = 'short'
    ): string => {
        const d = typeof date === 'string' ? new Date(date) : date

        const options: Intl.DateTimeFormatOptions =
            format === 'short'
                ? { day: '2-digit', month: '2-digit', year: 'numeric' }
                : format === 'long'
                    ? { day: 'numeric', month: 'long', year: 'numeric' }
                    : { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }

        return new Intl.DateTimeFormat(
            locale === 'vi' ? 'vi-VN' : 'en-US',
            options
        ).format(d)
    }, [locale])

    const value: I18nContextType = {
        locale,
        t: translations[locale],
        setLocale,
        formatNumber,
        formatCurrency,
        formatDate,
    }

    return React.createElement(
        I18nContext.Provider,
        { value },
        children
    )
}

// ═══════════════════════════════════════════════════════════════
// HOOKS
// ═══════════════════════════════════════════════════════════════

/**
 * Hook to access i18n context
 * @returns I18nContextType
 * @throws Error if used outside I18nProvider
 */
export function useI18n(): I18nContextType {
    const context = useContext(I18nContext)
    if (!context) {
        throw new Error('useI18n must be used within an I18nProvider')
    }
    return context
}

/**
 * Hook to get translations only
 * @returns Translations object
 */
export function useTranslations(): Translations {
    const { t } = useI18n()
    return t
}

/**
 * Hook to get current locale
 * @returns Current locale
 */
export function useLocale(): Locale {
    const { locale } = useI18n()
    return locale
}

// ═══════════════════════════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════════════════════════

/**
 * Get translation for a nested key
 * @param t Translations object
 * @param key Dot-separated key (e.g., 'common.save')
 * @returns Translation string or key if not found
 */
export function getTranslation(t: Translations, key: string): string {
    const keys = key.split('.')
    let current: unknown = t

    for (const k of keys) {
        if (current && typeof current === 'object' && k in current) {
            current = (current as Record<string, unknown>)[k]
        } else {
            return key
        }
    }

    return typeof current === 'string' ? current : key
}

/**
 * Available locales
 */
export const AVAILABLE_LOCALES: { code: Locale; name: string; nativeName: string }[] = [
    { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt' },
    { code: 'en', name: 'English', nativeName: 'English' },
]

// Re-export translations
export { vi, en }
export type { Translations }
