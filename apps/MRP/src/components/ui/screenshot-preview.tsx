'use client'

import { useState } from 'react'
import { X, Download, Copy, Check, ZoomIn, ZoomOut, Maximize2, Info, User, Clock, Globe, Monitor, Layers, Package } from 'lucide-react'
import type { ScreenshotResult } from '@/hooks/use-screenshot'
import { cn } from '@/lib/utils'

interface ScreenshotPreviewProps {
  result: ScreenshotResult
  onDownload: () => void
  onCopy: () => Promise<boolean>
  onClose: () => void
}

/**
 * Screenshot Preview Modal with Industrial Precision styling
 * Features: Zoom controls, Metadata panel, Download/Copy actions
 */
export function ScreenshotPreview({ result, onDownload, onCopy, onClose }: ScreenshotPreviewProps) {
  const [zoom, setZoom] = useState(0.5) // Start at 50%
  const [copied, setCopied] = useState(false)
  const [showMetadata, setShowMetadata] = useState(true)

  const handleCopy = async () => {
    const success = await onCopy()
    if (success) {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.25, 2))
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.25, 0.25))
  const handleZoomFit = () => setZoom(0.5)
  const handleZoom100 = () => setZoom(1)

  const { metadata } = result

  return (
    <div className="fixed inset-0 z-[200] bg-[#0a0c0f] flex flex-col screenshot-ignore">
      {/* Header - Industrial Precision */}
      <div className="h-12 bg-[#1a1d23] border-b border-[#2a2f3a] flex items-center justify-between px-4 flex-shrink-0">
        <div className="flex items-center gap-4">
          <span className="text-[13px] font-medium text-[#e8eaed] font-mono tracking-wide">
            SCREENSHOT PREVIEW
          </span>
          <div className="h-4 w-px bg-[#2a2f3a]" />
          <span className="text-[11px] text-[#8b9ab0] font-mono">
            {result.width} × {result.height} px
          </span>
        </div>

        <div className="flex items-center gap-1">
          {/* Zoom controls */}
          <button
            onClick={handleZoomOut}
            className="w-8 h-8 flex items-center justify-center text-[#8b9ab0] hover:bg-[#252a35] hover:text-[#e8eaed] transition-colors"
            title="Thu nhỏ (−25%)"
            aria-label="Thu nhỏ"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={handleZoomFit}
            className="px-2 h-8 flex items-center justify-center text-[11px] text-[#8b9ab0] font-mono hover:bg-[#252a35] hover:text-[#e8eaed] transition-colors min-w-[50px]"
            title="Click để fit"
          >
            {Math.round(zoom * 100)}%
          </button>
          <button
            onClick={handleZoomIn}
            className="w-8 h-8 flex items-center justify-center text-[#8b9ab0] hover:bg-[#252a35] hover:text-[#e8eaed] transition-colors"
            title="Phóng to (+25%)"
            aria-label="Phóng to"
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          <div className="w-px h-6 bg-[#2a2f3a] mx-2" />

          {/* 100% zoom */}
          <button
            onClick={handleZoom100}
            className={cn(
              "h-8 px-2 flex items-center justify-center text-[10px] font-mono transition-colors",
              zoom === 1
                ? "bg-[#00d4ff]/20 text-[#00d4ff]"
                : "text-[#8b9ab0] hover:bg-[#252a35] hover:text-[#e8eaed]"
            )}
            title="100% zoom"
          >
            1:1
          </button>

          {/* Toggle metadata */}
          <button
            onClick={() => setShowMetadata(!showMetadata)}
            className={cn(
              "w-8 h-8 flex items-center justify-center transition-colors",
              showMetadata
                ? "bg-[#00d4ff]/20 text-[#00d4ff]"
                : "text-[#8b9ab0] hover:bg-[#252a35] hover:text-[#e8eaed]"
            )}
            title="Thông tin ảnh"
            aria-label="Thông tin ảnh"
          >
            <Info className="w-4 h-4" />
          </button>

          <div className="w-px h-6 bg-[#2a2f3a] mx-2" />

          {/* Copy action */}
          <button
            onClick={handleCopy}
            className="h-8 px-3 flex items-center gap-1.5 text-[11px] text-[#8b9ab0] hover:bg-[#252a35] hover:text-[#e8eaed] border border-transparent hover:border-[#2a2f3a] transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-[#22c55e]" />
                <span className="text-[#22c55e]">Đã copy!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy</span>
              </>
            )}
          </button>

          {/* Download action */}
          <button
            onClick={onDownload}
            className="h-8 px-3 flex items-center gap-1.5 text-[11px] font-medium bg-[#00d4ff] text-[#0a0c0f] hover:bg-[#00d4ff]/90 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Tải xuống</span>
          </button>

          <div className="w-px h-6 bg-[#2a2f3a] mx-2" />

          {/* Close */}
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-[#8b9ab0] hover:bg-[#ef4444]/20 hover:text-[#ef4444] transition-colors"
            title="Đóng (ESC)"
            aria-label="Đóng"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Image area */}
        <div className="flex-1 overflow-auto p-6 flex items-center justify-center bg-[#0a0c0f]">
          <div
            style={{
              transform: `scale(${zoom})`,
              transformOrigin: 'center center',
              transition: 'transform 0.15s ease-out',
            }}
          >
            <img
              src={result.dataUrl}
              alt="Screenshot preview"
              className="shadow-2xl"
              style={{
                maxWidth: 'none',
                imageRendering: zoom >= 1 ? 'pixelated' : 'auto',
                border: '1px solid #2a2f3a',
              }}
            />
          </div>
        </div>

        {/* Metadata panel - Industrial Dark */}
        {showMetadata && (
          <div className="w-[280px] bg-[#12151a] border-l border-[#2a2f3a] flex-shrink-0 overflow-auto">
            {/* Panel header */}
            <div className="px-4 py-3 border-b border-[#2a2f3a] bg-[#1a1d23]">
              <h3 className="text-[10px] font-mono uppercase tracking-widest text-[#6b7a90]">
                Thông tin Screenshot
              </h3>
            </div>

            <div className="p-4 space-y-4">
              {/* Captured by */}
              <MetadataItem
                icon={<User className="w-3.5 h-3.5" />}
                label="Người chụp"
                value={metadata.capturedBy}
              />

              {/* Captured at */}
              <MetadataItem
                icon={<Clock className="w-3.5 h-3.5" />}
                label="Thời gian"
                value={metadata.capturedAt}
              />

              {/* Module */}
              <MetadataItem
                icon={<Layers className="w-3.5 h-3.5" />}
                label="Module"
                value={metadata.module}
                highlight
              />

              {/* Divider */}
              <div className="border-t border-[#2a2f3a]" />

              {/* Page Title */}
              <MetadataItem
                icon={<Globe className="w-3.5 h-3.5" />}
                label="Tiêu đề trang"
                value={metadata.pageTitle}
              />

              {/* Page URL */}
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Globe className="w-3.5 h-3.5 text-[#6b7a90]" />
                  <span className="text-[10px] text-[#6b7a90] uppercase tracking-wide">
                    URL
                  </span>
                </div>
                <div className="text-[10px] text-[#00d4ff] font-mono break-all pl-5 leading-relaxed">
                  {metadata.pageUrl}
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-[#2a2f3a]" />

              {/* Resolution */}
              <MetadataItem
                icon={<Monitor className="w-3.5 h-3.5" />}
                label="Độ phân giải"
                value={metadata.resolution}
                mono
              />

              {/* Viewport */}
              <MetadataItem
                icon={<Maximize2 className="w-3.5 h-3.5" />}
                label="Viewport"
                value={metadata.viewport}
                mono
              />

              {/* App Version */}
              <MetadataItem
                icon={<Package className="w-3.5 h-3.5" />}
                label="Phiên bản"
                value={metadata.appVersion}
              />
            </div>

            {/* Footer */}
            <div className="px-4 py-3 border-t border-[#2a2f3a] bg-[#0f1115]">
              <p className="text-[9px] text-[#4a5568] text-center font-mono tracking-wider">
                L-ERP MRP Screenshot Tool
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Keyboard shortcuts hint */}
      <div className="h-8 bg-[#1a1d23] border-t border-[#2a2f3a] flex items-center justify-center gap-6 text-[10px] text-[#6b7a90]">
        <span><kbd className="px-1.5 py-0.5 bg-[#12151a] border border-[#2a2f3a] text-[#8b9ab0] mr-1">ESC</kbd> Đóng</span>
        <span><kbd className="px-1.5 py-0.5 bg-[#12151a] border border-[#2a2f3a] text-[#8b9ab0] mr-1">+</kbd><kbd className="px-1.5 py-0.5 bg-[#12151a] border border-[#2a2f3a] text-[#8b9ab0] mr-1">-</kbd> Zoom</span>
        <span><kbd className="px-1.5 py-0.5 bg-[#12151a] border border-[#2a2f3a] text-[#8b9ab0] mr-1">I</kbd> Metadata</span>
      </div>
    </div>
  )
}

// Helper component for metadata items
interface MetadataItemProps {
  icon: React.ReactNode
  label: string
  value: string
  mono?: boolean
  highlight?: boolean
}

function MetadataItem({ icon, label, value, mono, highlight }: MetadataItemProps) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-1">
        <span className="text-[#6b7a90]">{icon}</span>
        <span className="text-[10px] text-[#6b7a90] uppercase tracking-wide">
          {label}
        </span>
      </div>
      <div className={cn(
        "text-[12px] pl-5",
        highlight ? "text-[#00d4ff]" : "text-[#c9d1dc]",
        mono && "font-mono"
      )}>
        {value}
      </div>
    </div>
  )
}

export default ScreenshotPreview
