// =============================================================================
// L-ERP MRP - PWA META TAGS
// Head elements for PWA support
// =============================================================================

import React from 'react';

interface PWAMetaTagsProps {
  title?: string;
  description?: string;
  themeColor?: string;
}

export function PWAMetaTags({
  title = 'L-ERP MRP',
  description = 'Enterprise Manufacturing Resource Planning System',
  themeColor = '#30a46c',
}: PWAMetaTagsProps) {
  return (
    <>
      {/* Primary Meta Tags */}
      <meta name="title" content={title} />
      <meta name="description" content={description} />
      
      {/* PWA Meta Tags */}
      <meta name="application-name" content="L-ERP MRP" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      <meta name="apple-mobile-web-app-title" content="L-ERP MRP" />
      <meta name="format-detection" content="telephone=no" />
      <meta name="mobile-web-app-capable" content="yes" />
      <meta name="theme-color" content={themeColor} />
      <meta name="msapplication-TileColor" content={themeColor} />
      <meta name="msapplication-tap-highlight" content="no" />
      
      {/* Viewport */}
      <meta 
        name="viewport" 
        content="width=device-width, initial-scale=1, maximum-scale=5, viewport-fit=cover" 
      />
      
      {/* Icons */}
      <link rel="icon" type="image/png" sizes="32x32" href="/icons/favicon-32x32.png" />
      <link rel="icon" type="image/png" sizes="16x16" href="/icons/favicon-16x16.png" />
      <link rel="icon" href="/icons/icon.svg" type="image/svg+xml" />
      <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
      <link rel="apple-touch-icon" sizes="152x152" href="/icons/icon-152x152.png" />
      <link rel="apple-touch-icon" sizes="180x180" href="/icons/icon-192x192.png" />
      <link rel="apple-touch-icon" sizes="167x167" href="/icons/icon-192x192.png" />
      
      {/* Manifest */}
      <link rel="manifest" href="/manifest.json" />
      
      {/* Splash Screens for iOS */}
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <link 
        rel="apple-touch-startup-image" 
        href="/splash/apple-splash-2048-2732.png" 
        media="(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2)" 
      />
      <link 
        rel="apple-touch-startup-image" 
        href="/splash/apple-splash-1668-2388.png" 
        media="(device-width: 834px) and (device-height: 1194px) and (-webkit-device-pixel-ratio: 2)" 
      />
      <link 
        rel="apple-touch-startup-image" 
        href="/splash/apple-splash-1536-2048.png" 
        media="(device-width: 768px) and (device-height: 1024px) and (-webkit-device-pixel-ratio: 2)" 
      />
      <link 
        rel="apple-touch-startup-image" 
        href="/splash/apple-splash-1125-2436.png" 
        media="(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3)" 
      />
      <link 
        rel="apple-touch-startup-image" 
        href="/splash/apple-splash-1242-2688.png" 
        media="(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 3)" 
      />
      <link 
        rel="apple-touch-startup-image" 
        href="/splash/apple-splash-750-1334.png" 
        media="(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2)" 
      />
      <link 
        rel="apple-touch-startup-image" 
        href="/splash/apple-splash-1242-2208.png" 
        media="(device-width: 414px) and (device-height: 736px) and (-webkit-device-pixel-ratio: 3)" 
      />
      <link 
        rel="apple-touch-startup-image" 
        href="/splash/apple-splash-640-1136.png" 
        media="(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2)" 
      />
      
      {/* Microsoft */}
      <meta name="msapplication-config" content="/browserconfig.xml" />
      <meta name="msapplication-TileImage" content="/icons/icon-144x144.png" />
    </>
  );
}

// Export as metadata for Next.js App Router
export const pwaMetadata = {
  applicationName: 'L-ERP MRP',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'L-ERP MRP',
  },
  formatDetection: {
    telephone: false,
  },
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#111827' },
  ],
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/icons/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/icons/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icons/icon.svg', type: 'image/svg+xml' },
    ],
    shortcut: '/icons/icon-192x192.png',
    apple: [
      { url: '/icons/apple-touch-icon.png' },
      { url: '/icons/icon-152x152.png', sizes: '152x152' },
      { url: '/icons/icon-192x192.png', sizes: '180x180' },
    ],
  },
  other: {
    'mobile-web-app-capable': 'yes',
  },
};
