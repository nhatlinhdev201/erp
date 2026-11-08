// =============================================================================
// L-ERP MRP - ROOT PROVIDERS
// Wraps app with all necessary providers including Theme
// =============================================================================

'use client';

import React from 'react';
import { ThemeProvider } from '@/components/providers/theme-provider';

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <ThemeProvider
      defaultTheme="system"
      storageKey="lerp-mrp-theme"
      enableSystem
      disableTransitionOnChange={false}
    >
      {children}
    </ThemeProvider>
  );
}

export default Providers;
