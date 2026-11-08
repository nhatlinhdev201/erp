'use client'

import { useState, useEffect } from 'react'
import { Camera, Monitor, Maximize, Square, Loader2 } from 'lucide-react'
import { useScreenshot } from '@/hooks/use-screenshot'
import { RegionSelector } from './region-selector'
import { ScreenshotPreview } from './screenshot-preview'
import { cn } from '@/lib/utils'

interface ScreenshotButtonProps {
  className?: string
  language?: 'en' | 'vi'
}

/**
 * Professional Screenshot Button with Industrial Precision styling
 * Features: 3 capture modes, preview modal, metadata
 */
export function ScreenshotButton({ className, language = 'vi' }: ScreenshotButtonProps) {
  const {
    captureViewport,
    captureFullPage,
    captureRegion,
    cancelRegionSelect,
    download,
    copyToClipboard,
    reset,
    isCapturing,
    isSelectingRegion,
    result,
  } = useScreenshot({ appVersion: 'L-ERP MRP v1.0' })

  const [showMenu, setShowMenu] = useState(false)
  const [showRegionSelector, setShowRegionSelector] = useState(false)

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (showMenu) setShowMenu(false)
    }
    // Delay to prevent immediate close
    const timer = setTimeout(() => {
      if (showMenu) {
        document.addEventListener('click', handleClickOutside)
      }
    }, 100)
    return () => {
      clearTimeout(timer)
      document.removeEventListener('click', handleClickOutside)
    }
  }, [showMenu])

  // ESC to close preview
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && result) {
        reset()
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [result, reset])

  const handleCaptureViewport = async () => {
    setShowMenu(false)
    await captureViewport()
  }

  const handleCaptureFullPage = async () => {
    setShowMenu(false)
    await captureFullPage()
  }

  const handleStartRegionSelect = () => {
    setShowMenu(false)
    setShowRegionSelector(true)
  }

  const handleRegionSelect = async (x: number, y: number, width: number, height: number) => {
    setShowRegionSelector(false)
    await captureRegion(x, y, width, height)
  }

  const handleCancelRegion = () => {
    setShowRegionSelector(false)
    cancelRegionSelect()
  }

  const handleDownload = () => {
    download()
  }

  const handleCopy = async () => {
    return await copyToClipboard()
  }

  const handleClosePreview = () => {
    reset()
  }

  const labels = language === 'vi' ? {
    title: 'Chụp màn hình',
    viewport: 'Vùng hiển thị',
    viewportDesc: 'Viewport hiện tại',
    fullpage: 'Toàn trang',
    fullpageDesc: 'Full page scroll',
    region: 'Chọn vùng',
    regionDesc: 'Kéo để chọn khu vực',
  } : {
    title: 'Screenshot',
    viewport: 'Viewport',
    viewportDesc: 'Current visible area',
    fullpage: 'Full Page',
    fullpageDesc: 'Entire scrollable page',
    region: 'Select Region',
    regionDesc: 'Drag to select area',
  }

  return (
    <>
      {/* Trigger Button - Industrial Style */}
      <div className="relative">
        <button
          onClick={(e) => {
            e.stopPropagation()
            setShowMenu(!showMenu)
          }}
          disabled={isCapturing}
          className={cn(
            "h-7 w-7 flex items-center justify-center transition-colors",
            "text-gray-500 dark:text-mrp-text-muted",
            "hover:bg-gray-100 dark:hover:bg-gunmetal",
            "hover:text-info-cyan",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            className
          )}
          title={labels.title}
        >
          {isCapturing ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-info-cyan" />
          ) : (
            <Camera className="w-3.5 h-3.5" />
          )}
        </button>

        {/* Dropdown Menu - Industrial Style */}
        {showMenu && !isCapturing && (
          <div
            className={cn(
              "absolute right-0 top-full mt-1 z-50",
              "bg-white dark:bg-gunmetal",
              "border border-gray-200 dark:border-mrp-border",
              "shadow-lg min-w-[220px]",
              "animate-in fade-in slide-in-from-top-1 duration-150"
            )}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-3 py-2 border-b border-gray-100 dark:border-mrp-border bg-gray-50 dark:bg-steel-dark">
              <span className="text-[10px] font-mono uppercase tracking-wider text-gray-500 dark:text-mrp-text-muted">
                {labels.title}
              </span>
            </div>

            {/* Options */}
            <div className="py-1">
              {/* Viewport capture */}
              <button
                onClick={handleCaptureViewport}
                className="w-full px-3 py-2.5 flex items-center gap-3 text-left hover:bg-gray-50 dark:hover:bg-slate transition-colors"
              >
                <div className="w-8 h-8 flex items-center justify-center bg-info-cyan/10 text-info-cyan">
                  <Monitor className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[12px] text-gray-900 dark:text-mrp-text-primary font-medium">
                    {labels.viewport}
                  </div>
                  <div className="text-[10px] text-gray-500 dark:text-mrp-text-muted">
                    {labels.viewportDesc}
                  </div>
                </div>
              </button>

              {/* Full page capture */}
              <button
                onClick={handleCaptureFullPage}
                className="w-full px-3 py-2.5 flex items-center gap-3 text-left hover:bg-gray-50 dark:hover:bg-slate transition-colors"
              >
                <div className="w-8 h-8 flex items-center justify-center bg-production-green/10 text-production-green">
                  <Maximize className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[12px] text-gray-900 dark:text-mrp-text-primary font-medium">
                    {labels.fullpage}
                  </div>
                  <div className="text-[10px] text-gray-500 dark:text-mrp-text-muted">
                    {labels.fullpageDesc}
                  </div>
                </div>
              </button>

              {/* Region capture */}
              <button
                onClick={handleStartRegionSelect}
                className="w-full px-3 py-2.5 flex items-center gap-3 text-left hover:bg-gray-50 dark:hover:bg-slate transition-colors"
              >
                <div className="w-8 h-8 flex items-center justify-center bg-warning-amber/10 text-warning-amber">
                  <Square className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[12px] text-gray-900 dark:text-mrp-text-primary font-medium">
                    {labels.region}
                  </div>
                  <div className="text-[10px] text-gray-500 dark:text-mrp-text-muted">
                    {labels.regionDesc}
                  </div>
                </div>
              </button>
            </div>

            {/* Footer hint */}
            <div className="px-3 py-2 border-t border-gray-100 dark:border-mrp-border bg-gray-50 dark:bg-steel-dark/50">
              <p className="text-[9px] text-gray-400 dark:text-mrp-text-muted text-center">
                {language === 'vi' ? 'Ảnh sẽ hiển thị preview trước khi lưu' : 'Preview before saving'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Region Selector Overlay */}
      <RegionSelector
        isActive={showRegionSelector || isSelectingRegion}
        onSelect={handleRegionSelect}
        onCancel={handleCancelRegion}
      />

      {/* Preview Modal */}
      {result && (
        <ScreenshotPreview
          result={result}
          onDownload={handleDownload}
          onCopy={handleCopy}
          onClose={handleClosePreview}
        />
      )}
    </>
  )
}

export default ScreenshotButton
