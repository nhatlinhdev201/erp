import type { Metadata, Viewport } from "next";
import { Inter, IBM_Plex_Sans, IBM_Plex_Mono, JetBrains_Mono, Be_Vietnam_Pro } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "sonner";
import { Providers } from "./providers";
import { PWAProvider } from "@/components/pwa";
import { WebVitals } from "@/components/web-vitals";

// Primary body font (Industrial Precision)
const ibmPlexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-ibm-plex-sans",
  display: "swap",
});

// Monospace font for numbers/data
const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-ibm-plex-mono",
  display: "swap",
});

// Display font for headings (Industrial Precision)
const jetBrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

// Vietnamese-optimized font
const beVietnamPro = Be_Vietnam_Pro({
  subsets: ["latin", "vietnamese"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-be-vietnam-pro",
  display: "swap",
});

// Fallback font
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: {
    template: '%s | L-ERP MRP',
    default: 'L-ERP MRP - Hệ thống quản lý sản xuất',
  },
  description: 'Hệ thống hoạch định nguồn lực sản xuất L-ERP MRP - AI-First Material Requirements Planning',
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "L-ERP MRP",
  },
  formatDetection: {
    telephone: false,
  },
  keywords: ['MRP', 'sản xuất', 'quản lý', 'vật tư', 'tồn kho', 'L-ERP'],
  authors: [{ name: 'L-ERP' }],
};

export const viewport: Viewport = {
  themeColor: "#30a46c",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className={`${beVietnamPro.variable} ${ibmPlexSans.variable} ${ibmPlexMono.variable} ${jetBrainsMono.variable} ${inter.variable} font-sans antialiased`}>
        <Providers>
          <WebVitals />
          <PWAProvider>
            {children}
          </PWAProvider>
          <Toaster />
          <SonnerToaster position="top-right" richColors />
        </Providers>
      </body>
    </html>
  );
}
