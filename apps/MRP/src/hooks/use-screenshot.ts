'use client'

import { useState, useCallback } from 'react'
import type html2canvas from 'html2canvas'
import { clientLogger } from '@/lib/client-logger'

type Html2Canvas = typeof html2canvas;
let _html2canvas: Html2Canvas | null = null;

async function getHtml2Canvas(): Promise<Html2Canvas> {
  if (!_html2canvas) {
    _html2canvas = (await import('html2canvas')).default;
  }
  return _html2canvas;
}

// =============================================================================
// UTILS
// =============================================================================

/**
 * Convert data URL to Blob without using fetch (CSP-safe)
 */
function dataURLtoBlob(dataURL: string): Blob {
  const parts = dataURL.split(',')
  const mime = parts[0].match(/:(.*?);/)?.[1] || 'image/png'
  const bstr = atob(parts[1])
  let n = bstr.length
  const u8arr = new Uint8Array(n)
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n)
  }
  return new Blob([u8arr], { type: mime })
}

// =============================================================================
// TYPES
// =============================================================================

export interface ScreenshotMetadata {
  capturedBy: string
  capturedAt: string
  pageTitle: string
  pageUrl: string
  module: string
  viewport: string
  resolution: string
  appVersion: string
}

export interface ScreenshotResult {
  dataUrl: string
  blob: Blob
  metadata: ScreenshotMetadata
  width: number
  height: number
}

export type CaptureMode = 'viewport' | 'fullpage' | 'region'

interface UseScreenshotOptions {
  appVersion?: string
}

// =============================================================================
// HOOK
// =============================================================================

/**
 * Professional Screenshot Hook with metadata capture
 * Supports viewport, full page, and region capture modes
 */
export function useScreenshot(options: UseScreenshotOptions = {}) {
  const [isCapturing, setIsCapturing] = useState(false)
  const [result, setResult] = useState<ScreenshotResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isSelectingRegion, setIsSelectingRegion] = useState(false)

  /**
   * Generate professional metadata like EXIF
   */
  const generateMetadata = useCallback((width: number, height: number): ScreenshotMetadata => {
    // Get current user from localStorage or session
    let userName = 'Unknown User'
    try {
      const userStr = localStorage.getItem('user') || sessionStorage.getItem('user')
      if (userStr) {
        const user = JSON.parse(userStr)
        userName = user.name || user.email || 'Unknown User'
      }
    } catch {
      // Fallback - try to get from document
      const userElement = document.querySelector('[data-user-name]')
      if (userElement) {
        userName = userElement.getAttribute('data-user-name') || 'Unknown User'
      }
    }

    // Get module from URL path
    const pathParts = window.location.pathname.split('/').filter(Boolean)
    const pageMod = pathParts[0] || 'dashboard'

    return {
      capturedBy: userName,
      capturedAt: new Date().toLocaleString('vi-VN', {
        dateStyle: 'full',
        timeStyle: 'medium',
      }),
      pageTitle: document.title,
      pageUrl: window.location.href,
      module: pageMod.charAt(0).toUpperCase() + pageMod.slice(1),
      viewport: `${window.innerWidth} × ${window.innerHeight}`,
      resolution: `${width} × ${height}`,
      appVersion: options.appVersion || 'L-ERP MRP v1.0',
    }
  }, [options.appVersion])

  /**
   * Capture current viewport (visible area)
   */
  const captureViewport = useCallback(async (): Promise<ScreenshotResult> => {
    setIsCapturing(true)
    setError(null)

    try {
      // Store original scroll
      const originalScrollTop = window.scrollY
      const originalScrollLeft = window.scrollX

      // Scroll to top
      window.scrollTo(0, 0)
      await new Promise(resolve => setTimeout(resolve, 100))

      // Capture the entire document (including fixed headers)
      const html2canvasFn = await getHtml2Canvas();
      const canvas = await html2canvasFn(document.documentElement, {
        backgroundColor: '#1A1D23',
        scale: 2,
        logging: false,
        useCORS: true,
        allowTaint: true,
        width: document.documentElement.scrollWidth,
        height: document.documentElement.clientHeight,
        windowWidth: document.documentElement.scrollWidth,
        windowHeight: document.documentElement.clientHeight,
        x: 0,
        y: 0,
        scrollX: 0,
        scrollY: 0,
        // Fix sticky/fixed positioning issues
        onclone: (clonedDoc) => {
          // Convert sticky headers to relative positioning
          const stickyElements = clonedDoc.querySelectorAll('[class*="sticky"], header')
          stickyElements.forEach((el) => {
            if (el instanceof HTMLElement) {
              const computedStyle = window.getComputedStyle(el)
              if (computedStyle.position === 'sticky' || computedStyle.position === 'fixed') {
                el.style.position = 'relative'
                el.style.top = '0'
              }
            }
          })
          // Also handle any fixed elements
          const fixedElements = clonedDoc.querySelectorAll('*')
          fixedElements.forEach((el) => {
            if (el instanceof HTMLElement) {
              const computedStyle = window.getComputedStyle(el)
              if (computedStyle.position === 'fixed') {
                el.style.position = 'absolute'
              }
            }
          })
        },
        ignoreElements: (el) => {
          return el.classList?.contains('screenshot-ignore') || false
        }
      })

      // Restore scroll
      window.scrollTo(originalScrollLeft, originalScrollTop)

      const dataUrl = canvas.toDataURL('image/png', 1.0)
      const blob = dataURLtoBlob(dataUrl)
      const metadata = generateMetadata(canvas.width, canvas.height)

      const screenshotResult: ScreenshotResult = {
        dataUrl,
        blob,
        metadata,
        width: canvas.width,
        height: canvas.height,
      }

      setResult(screenshotResult)
      return screenshotResult
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Screenshot failed'
      setError(message)
      throw err
    } finally {
      setIsCapturing(false)
    }
  }, [generateMetadata])

  /**
   * Capture full page (entire scrollable content)
   */
  const captureFullPage = useCallback(async (): Promise<ScreenshotResult> => {
    setIsCapturing(true)
    setError(null)

    try {
      // Store original scroll position
      const originalScrollTop = window.scrollY
      const originalScrollLeft = window.scrollX

      // Scroll to top
      window.scrollTo(0, 0)

      // Get body element for full page capture
      const bodyElement = document.body
      const htmlElement = document.documentElement

      // Store original body styles
      const originalOverflow = bodyElement.style.overflow
      const originalHeight = bodyElement.style.height
      const originalHtmlOverflow = htmlElement.style.overflow

      // Temporarily expand to show all content
      bodyElement.style.overflow = 'visible'
      bodyElement.style.height = 'auto'
      htmlElement.style.overflow = 'visible'

      // Wait for reflow
      await new Promise(resolve => setTimeout(resolve, 150))

      // Get full dimensions
      const fullWidth = Math.max(
        bodyElement.scrollWidth,
        bodyElement.offsetWidth,
        htmlElement.clientWidth,
        htmlElement.scrollWidth,
        htmlElement.offsetWidth
      )
      const fullHeight = Math.max(
        bodyElement.scrollHeight,
        bodyElement.offsetHeight,
        htmlElement.clientHeight,
        htmlElement.scrollHeight,
        htmlElement.offsetHeight
      )

      const html2canvasFn = await getHtml2Canvas();
      const canvas = await html2canvasFn(document.documentElement, {
        backgroundColor: '#1A1D23',
        scale: 2,
        logging: false,
        useCORS: true,
        allowTaint: true,
        width: fullWidth,
        height: fullHeight,
        windowWidth: fullWidth,
        windowHeight: fullHeight,
        x: 0,
        y: 0,
        scrollX: 0,
        scrollY: 0,
        // Fix sticky/fixed positioning issues
        onclone: (clonedDoc) => {
          // Convert sticky headers to relative positioning
          const stickyElements = clonedDoc.querySelectorAll('[class*="sticky"], header')
          stickyElements.forEach((el) => {
            if (el instanceof HTMLElement) {
              const computedStyle = window.getComputedStyle(el)
              if (computedStyle.position === 'sticky' || computedStyle.position === 'fixed') {
                el.style.position = 'relative'
                el.style.top = '0'
              }
            }
          })
          // Also handle any fixed elements
          const fixedElements = clonedDoc.querySelectorAll('*')
          fixedElements.forEach((el) => {
            if (el instanceof HTMLElement) {
              const computedStyle = window.getComputedStyle(el)
              if (computedStyle.position === 'fixed') {
                el.style.position = 'absolute'
              }
            }
          })
          // Ensure body and html have visible overflow in clone
          const clonedBody = clonedDoc.body
          const clonedHtml = clonedDoc.documentElement
          clonedBody.style.overflow = 'visible'
          clonedBody.style.height = 'auto'
          clonedHtml.style.overflow = 'visible'
        },
        ignoreElements: (el) => {
          return el.classList?.contains('screenshot-ignore') || false
        }
      })

      // Restore original styles
      bodyElement.style.overflow = originalOverflow
      bodyElement.style.height = originalHeight
      htmlElement.style.overflow = originalHtmlOverflow

      // Restore scroll position
      window.scrollTo(originalScrollLeft, originalScrollTop)

      const dataUrl = canvas.toDataURL('image/png', 1.0)
      const blob = dataURLtoBlob(dataUrl)
      const metadata = generateMetadata(canvas.width, canvas.height)

      const screenshotResult: ScreenshotResult = {
        dataUrl,
        blob,
        metadata,
        width: canvas.width,
        height: canvas.height,
      }

      setResult(screenshotResult)
      return screenshotResult
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Screenshot failed'
      setError(message)
      throw err
    } finally {
      setIsCapturing(false)
    }
  }, [generateMetadata])

  /**
   * Start region selection mode
   */
  const startRegionSelect = useCallback(() => {
    setIsSelectingRegion(true)
  }, [])

  /**
   * Cancel region selection
   */
  const cancelRegionSelect = useCallback(() => {
    setIsSelectingRegion(false)
  }, [])

  /**
   * Capture selected region
   */
  const captureRegion = useCallback(async (
    x: number,
    y: number,
    width: number,
    height: number
  ): Promise<ScreenshotResult> => {
    setIsCapturing(true)
    setIsSelectingRegion(false)
    setError(null)

    try {
      const html2canvasFn = await getHtml2Canvas();
      const canvas = await html2canvasFn(document.documentElement, {
        backgroundColor: '#1A1D23',
        scale: 2,
        logging: false,
        useCORS: true,
        allowTaint: true,
        x: x,
        y: y,
        width: width,
        height: height,
        // Fix sticky/fixed positioning issues
        onclone: (clonedDoc) => {
          // Convert sticky headers to relative positioning
          const stickyElements = clonedDoc.querySelectorAll('[class*="sticky"], header')
          stickyElements.forEach((el) => {
            if (el instanceof HTMLElement) {
              const computedStyle = window.getComputedStyle(el)
              if (computedStyle.position === 'sticky' || computedStyle.position === 'fixed') {
                el.style.position = 'relative'
                el.style.top = '0'
              }
            }
          })
        },
        ignoreElements: (el) => {
          return el.classList?.contains('screenshot-ignore') || false
        }
      })

      const dataUrl = canvas.toDataURL('image/png', 1.0)
      const blob = dataURLtoBlob(dataUrl)
      const metadata = generateMetadata(canvas.width, canvas.height)

      const screenshotResult: ScreenshotResult = {
        dataUrl,
        blob,
        metadata,
        width: canvas.width,
        height: canvas.height,
      }

      setResult(screenshotResult)
      return screenshotResult
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Screenshot failed'
      setError(message)
      throw err
    } finally {
      setIsCapturing(false)
    }
  }, [generateMetadata])

  /**
   * Download screenshot as PNG
   */
  const download = useCallback((customResult?: ScreenshotResult) => {
    const data = customResult || result
    if (!data) return

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
    const filename = `lerp-mrp-${data.metadata.module.toLowerCase()}-${timestamp}.png`

    const link = document.createElement('a')
    link.download = filename
    link.href = data.dataUrl
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }, [result])

  /**
   * Copy screenshot to clipboard
   */
  const copyToClipboard = useCallback(async (customResult?: ScreenshotResult): Promise<boolean> => {
    const data = customResult || result
    if (!data) return false

    try {
      if (!navigator.clipboard?.write) {
        setError('Clipboard API not supported')
        return false
      }

      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': data.blob })
      ])
      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Copy failed'
      setError(message)
      clientLogger.error('Clipboard copy error', err)
      return false
    }
  }, [result])

  /**
   * Reset state
   */
  const reset = useCallback(() => {
    setResult(null)
    setError(null)
    setIsSelectingRegion(false)
  }, [])

  return {
    // Capture methods
    captureViewport,
    captureFullPage,
    captureRegion,
    startRegionSelect,
    cancelRegionSelect,

    // Actions
    download,
    copyToClipboard,
    reset,

    // State
    isCapturing,
    isSelectingRegion,
    result,
    error,
  }
}

export default useScreenshot
