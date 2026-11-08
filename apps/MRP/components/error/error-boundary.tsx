'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, ChevronDown, ChevronUp, Copy, Check, Bug } from 'lucide-react';

// =============================================================================
// L-ERP MRP - ERROR BOUNDARY
// Catch and display errors gracefully
// =============================================================================

// =============================================================================
// TYPES
// =============================================================================

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showDetails?: boolean;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

// =============================================================================
// ERROR BOUNDARY CLASS COMPONENT
// =============================================================================

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo });

    // Log to console
    console.error('[ErrorBoundary] Caught error:', error);
    console.error('[ErrorBoundary] Component stack:', errorInfo.componentStack);

    // Call custom error handler
    this.props.onError?.(error, errorInfo);

    // Send to error tracking service (e.g., Sentry)
    this.reportError(error, errorInfo);
  }

  private reportError(error: Error, errorInfo: ErrorInfo): void {
    // In production, send to error tracking service
    if (process.env.NODE_ENV === 'production') {
      // Example: Sentry.captureException(error, { extra: { componentStack: errorInfo.componentStack } });
    }
  }

  private handleRetry = (): void => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  private handleReload = (): void => {
    window.location.reload();
  };

  private handleGoHome = (): void => {
    window.location.href = '/';
  };

  render(): ReactNode {
    const { hasError, error, errorInfo } = this.state;
    const { children, fallback, showDetails = true } = this.props;

    if (hasError) {
      if (fallback) {
        return fallback;
      }

      return (
        <ErrorFallback
          error={error}
          errorInfo={errorInfo}
          onRetry={this.handleRetry}
          onReload={this.handleReload}
          onGoHome={this.handleGoHome}
          showDetails={showDetails}
        />
      );
    }

    return children;
  }
}

// =============================================================================
// ERROR FALLBACK COMPONENT
// =============================================================================

interface ErrorFallbackProps {
  error: Error | null;
  errorInfo: ErrorInfo | null;
  onRetry?: () => void;
  onReload?: () => void;
  onGoHome?: () => void;
  showDetails?: boolean;
}

export function ErrorFallback({
  error,
  errorInfo,
  onRetry,
  onReload,
  onGoHome,
  showDetails = true,
}: ErrorFallbackProps) {
  const [showStack, setShowStack] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  const copyError = () => {
    const errorText = `
Error: ${error?.message}
Stack: ${error?.stack}
Component Stack: ${errorInfo?.componentStack}
    `.trim();

    navigator.clipboard.writeText(errorText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="max-w-lg w-full">
        {/* Icon */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-100 dark:bg-red-900/30 mb-4">
            <AlertTriangle className="w-10 h-10 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Đã xảy ra lỗi
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Xin lỗi, đã có lỗi xảy ra khi xử lý yêu cầu của bạn.
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-red-200 dark:border-red-800 p-4 mb-6">
            <div className="flex items-start gap-3">
              <Bug className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 dark:text-white">
                  {error.name}: {error.message}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          {onRetry && (
            <button
              onClick={onRetry}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 transition-colors"
            >
              <RefreshCw className="w-5 h-5" />
              Thử lại
            </button>
          )}
          {onReload && (
            <button
              onClick={onReload}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              <RefreshCw className="w-5 h-5" />
              Tải lại trang
            </button>
          )}
          {onGoHome && (
            <button
              onClick={onGoHome}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              <Home className="w-5 h-5" />
              Trang chủ
            </button>
          )}
        </div>

        {/* Stack Trace (collapsible) */}
        {showDetails && error?.stack && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <button
              onClick={() => setShowStack(!showStack)}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50"
            >
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Chi tiết lỗi
              </span>
              {showStack ? (
                <ChevronUp className="w-4 h-4 text-gray-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-400" />
              )}
            </button>

            {showStack && (
              <div className="border-t border-gray-200 dark:border-gray-700">
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-500">Stack Trace</span>
                    <button
                      onClick={copyError}
                      className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
                    >
                      {copied ? (
                        <>
                          <Check className="w-3 h-3" />
                          Đã copy
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          Copy
                        </>
                      )}
                    </button>
                  </div>
                  <pre className="text-xs text-gray-600 dark:text-gray-400 overflow-x-auto whitespace-pre-wrap bg-gray-50 dark:bg-gray-900 p-3 rounded-lg max-h-48 overflow-y-auto">
                    {error.stack}
                  </pre>
                </div>

                {errorInfo?.componentStack && (
                  <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                    <span className="text-xs text-gray-500 block mb-2">Component Stack</span>
                    <pre className="text-xs text-gray-600 dark:text-gray-400 overflow-x-auto whitespace-pre-wrap bg-gray-50 dark:bg-gray-900 p-3 rounded-lg max-h-48 overflow-y-auto">
                      {errorInfo.componentStack}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Help */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            Nếu lỗi vẫn tiếp tục, vui lòng liên hệ{' '}
            <a
              href="mailto:support@rtr.vn"
              className="text-purple-600 hover:text-purple-700"
            >
              support@rtr.vn
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// ASYNC ERROR BOUNDARY (for async components)
// =============================================================================

interface AsyncBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  loadingFallback?: ReactNode;
}

export function AsyncBoundary({ children, fallback, loadingFallback }: AsyncBoundaryProps) {
  return (
    <ErrorBoundary fallback={fallback}>
      <React.Suspense fallback={loadingFallback || <DefaultLoadingFallback />}>
        {children}
      </React.Suspense>
    </ErrorBoundary>
  );
}

function DefaultLoadingFallback() {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
    </div>
  );
}

// =============================================================================
// HOC FOR WRAPPING COMPONENTS
// =============================================================================

export function withErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  options?: Omit<ErrorBoundaryProps, 'children'>
) {
  return function WithErrorBoundary(props: P) {
    return (
      <ErrorBoundary {...options}>
        <WrappedComponent {...props} />
      </ErrorBoundary>
    );
  };
}

// =============================================================================
// ERROR UTILITIES
// =============================================================================

/**
 * Safe JSON parse with error handling
 */
export function safeJSONParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json);
  } catch {
    return fallback;
  }
}

/**
 * Safe async function wrapper
 */
export async function safeAsync<T>(
  fn: () => Promise<T>,
  fallback: T
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    console.error('[safeAsync] Error:', error);
    return fallback;
  }
}

/**
 * Try-catch wrapper with logging
 */
export function tryCatch<T>(fn: () => T, fallback: T): T {
  try {
    return fn();
  } catch (error) {
    console.error('[tryCatch] Error:', error);
    return fallback;
  }
}

export default ErrorBoundary;
