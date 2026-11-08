// =============================================================================
// L-ERP MRP - OFFLINE PAGE
// Fallback page shown when user is offline
// =============================================================================

'use client';

import React from 'react';
import { WifiOff, RefreshCw, Home, ArrowLeft } from 'lucide-react';
import { useNetworkStatus } from '@/lib/hooks/use-pwa';

export default function OfflinePage() {
  const { isOnline } = useNetworkStatus();

  // Redirect to dashboard if back online
  React.useEffect(() => {
    if (isOnline) {
      window.location.href = '/home';
    }
  }, [isOnline]);

  const handleRetry = () => {
    window.location.reload();
  };

  const handleGoBack = () => {
    window.history.back();
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-neutral-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        {/* Animated offline icon */}
        <div className="relative inline-flex items-center justify-center mb-8">
          <div className="absolute inset-0 bg-amber-500/20 rounded-full animate-ping" />
          <div className="relative w-24 h-24 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center">
            <WifiOff className="w-12 h-12 text-amber-600 dark:text-amber-400" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
          You're Offline
        </h1>

        {/* Description */}
        <p className="text-gray-600 dark:text-neutral-400 mb-8">
          It looks like you've lost your internet connection. 
          Some features may be unavailable until you're back online.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={handleRetry}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-all hover:scale-105 active:scale-95"
          >
            <RefreshCw className="w-5 h-5" />
            Try Again
          </button>

          <button
            onClick={handleGoBack}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 dark:bg-neutral-800 hover:bg-gray-200 dark:hover:bg-neutral-700 text-gray-700 dark:text-neutral-300 font-medium rounded-xl transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
            Go Back
          </button>
        </div>

        {/* Cached data notice */}
        <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
          <p className="text-sm text-blue-800 dark:text-blue-300">
            <strong>Tip:</strong> Some pages you've visited before may still be available offline.
          </p>
        </div>

        {/* Connection status */}
        <div className="mt-6 flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-neutral-400">
          <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-amber-500 animate-pulse'}`} />
          <span>{isOnline ? 'Connected' : 'Waiting for connection...'}</span>
        </div>
      </div>
    </div>
  );
}
