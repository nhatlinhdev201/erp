// =============================================================================
// L-ERP MRP - LOGIN PAGE
// Professional authentication interface
// =============================================================================

'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { LogoLight } from '@/components/ui/logo';
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  AlertCircle,
  Loader2,
  Shield,
  ArrowRight,
  CheckCircle,
  KeyRound,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/lib/i18n/language-context';

// =============================================================================
// LOGIN CONTENT COMPONENT
// =============================================================================

function LoginContent() {
  const router = useRouter();
  const { status } = useSession();
  const { t } = useLanguage();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams?.get('callbackUrl') || '/home';
  const error = searchParams?.get('error');
  const registered = searchParams?.get('registered');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [showMFA, setShowMFA] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (status === 'authenticated') {
      router.push(callbackUrl);
    }
  }, [status, callbackUrl, router]);

  // Handle error from URL — only allowlisted error codes are processed
  useEffect(() => {
    const ALLOWED_ERRORS = ['CredentialsSignin', 'SessionRequired', 'OAuthSignin', 'OAuthCallback', 'Callback'];
    if (error && ALLOWED_ERRORS.includes(error)) {
      switch (error) {
        case 'CredentialsSignin':
          setLoginError(t('login.errorCredentials'));
          break;
        case 'SessionRequired':
          setLoginError(t('login.errorSession'));
          break;
        default:
          setLoginError(t('login.errorGeneric'));
      }
    } else if (error) {
      // Unknown error code — show generic message, do not reflect the raw value
      setLoginError(t('login.errorGeneric'));
    }
  }, [error, t]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setLoginError(null);

    try {
      const result = await signIn('credentials', {
        redirect: false,
        email: email.toLowerCase().trim(),
        password,
        totp: totpCode || undefined,
      });

      if (result?.error) {
        if (result.error === 'MFA_REQUIRED') {
          setShowMFA(true);
          setLoginError(null);
        } else {
          setLoginError(t('login.errorCredentials'));
        }
      } else if (result?.ok) {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch {
      setLoginError(t('login.errorGeneric'));
    } finally {
      setIsLoading(false);
    }
  };

  // Loading state
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex bg-gray-900">
      {/* Full Width Layout */}
      <div className="w-full flex flex-col lg:flex-row">
        {/* Left Panel - Branding (Full width on mobile, 55% on desktop) */}
        <div className="w-full lg:w-[55%] bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 relative overflow-hidden flex flex-col justify-between p-8 lg:p-12 min-h-[40vh] lg:min-h-screen">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl" />
            <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-indigo-500 rounded-full translate-x-1/3 translate-y-1/3 blur-3xl" />
          </div>

          {/* Grid pattern overlay */}
          <div className="absolute inset-0 opacity-[0.02]" style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '50px 50px'
          }} />

          {/* Content */}
          <div className="relative z-10 flex flex-col h-full justify-between text-white">
            {/* L-ERP Logo */}
            <div className="flex items-center">
              <LogoLight height={48} width={180} className="h-10 lg:h-12 w-auto" priority />
            </div>

            {/* Features */}
            <div className="space-y-6 lg:space-y-8 my-8 lg:my-0">
              <div>
                <h2 className="text-3xl lg:text-5xl font-bold mb-4 leading-tight text-white">
                  Manufacturing<br />Intelligence
                </h2>
                <p className="text-gray-400 text-base lg:text-lg max-w-md">
                  Enterprise MRP with AI-powered analytics. Optimize production, manage inventory, and drive efficiency.
                </p>
              </div>

              <div className="space-y-3 lg:space-y-4">
                {[
                  'MRP & Capacity Planning',
                  'Real-time OEE Dashboard',
                  'SPC Quality Management',
                  'Shop Floor Mobile App',
                ].map((feature, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-gray-300">{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="text-gray-500 text-sm font-mono">
              © 2026 RTR Manufacturing
            </div>
          </div>
        </div>

        {/* Right Panel - Login Form (Full width on mobile, 45% on desktop) */}
        <div className="w-full lg:w-[45%] flex items-center justify-center p-6 lg:p-12 bg-gray-50 dark:bg-gray-950">
        <div className="w-full max-w-md">
          {/* Form Header */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {showMFA ? t('login.mfaTitle') : t('login.heading')}
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              {showMFA
                ? t('login.mfaDescription')
                : t('login.description')
              }
            </p>
          </div>

          {/* Registration Success */}
          {registered === 'true' && !loginError && (
            <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm font-medium text-green-800 dark:text-green-200">
                Đăng ký thành công! Hãy đăng nhập.
              </p>
            </div>
          )}

          {/* Error Alert */}
          {loginError && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-800 dark:text-red-200">
                  {t('login.failed')}
                </p>
                <p className="text-sm text-red-600 dark:text-red-400 mt-0.5">
                  {loginError}
                </p>
              </div>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {!showMFA ? (
              <>
                {/* Email Input */}
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    {t('login.email')}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                    </div>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={cn(
                        'block w-full pl-12 pr-4 py-3 rounded-xl border transition-all',
                        'bg-white dark:bg-gray-800',
                        'border-gray-300 dark:border-gray-700',
                        'text-gray-900 dark:text-white',
                        'placeholder-gray-400 dark:placeholder-gray-500',
                        'focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500',
                        'disabled:opacity-50 disabled:cursor-not-allowed'
                      )}
                      placeholder="your@email.com"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                {/* Password Input */}
                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    {t('login.password')}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                    </div>
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={cn(
                        'block w-full pl-12 pr-12 py-3 rounded-xl border transition-all',
                        'bg-white dark:bg-gray-800',
                        'border-gray-300 dark:border-gray-700',
                        'text-gray-900 dark:text-white',
                        'placeholder-gray-400 dark:placeholder-gray-500',
                        'focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500',
                        'disabled:opacity-50 disabled:cursor-not-allowed'
                      )}
                      placeholder="••••••••••••"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center"
                      tabIndex={-1}
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300" />
                      ) : (
                        <Eye className="h-5 w-5 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Remember Me & Forgot Password */}
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 dark:bg-gray-700"
                    />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {t('login.rememberMe')}
                    </span>
                  </label>
                  <Link
                    href="/forgot-password"
                    className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    {t('login.forgotPassword')}
                  </Link>
                </div>
              </>
            ) : (
              /* MFA Input */
              <div>
                <label
                  htmlFor="totp"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  {t('login.mfaLabel')}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <KeyRound className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                  </div>
                  <input
                    id="totp"
                    name="totp"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    required
                    value={totpCode}
                    onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
                    className={cn(
                      'block w-full pl-12 pr-4 py-3 rounded-xl border transition-all text-center text-2xl tracking-[0.5em]',
                      'bg-white dark:bg-gray-800',
                      'border-gray-300 dark:border-gray-700',
                      'text-gray-900 dark:text-white',
                      'focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500',
                    )}
                    placeholder="000000"
                    disabled={isLoading}
                    autoFocus
                  />
                </div>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  {t('login.mfaHint')}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setShowMFA(false);
                    setTotpCode('');
                  }}
                  className="mt-3 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  ← {t('login.mfaBack')}
                </button>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className={cn(
                'w-full py-3 px-4 rounded-xl font-semibold text-white transition-all',
                'bg-gradient-to-r from-blue-600 to-indigo-600',
                'hover:from-blue-700 hover:to-indigo-700',
                'focus:outline-none focus:ring-2 focus:ring-blue-500/50',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                'flex items-center justify-center gap-2'
              )}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>{t('login.processing')}</span>
                </>
              ) : (
                <>
                  <span>{showMFA ? t('login.mfaVerify') : t('login.signIn')}</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          {/* Security Notice */}
          <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800/30">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-blue-900 dark:text-blue-100">
                  {t('login.securityTitle')}
                </p>
                <p className="text-blue-700 dark:text-blue-300 mt-1">
                  {t('login.securityDesc')}
                </p>
              </div>
            </div>
          </div>

          {/* Register Link */}
          <div className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
            <p>
              Chưa có tài khoản?{' '}
              <Link
                href="/register"
                className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
              >
                Đăng ký
              </Link>
            </p>
          </div>

          {/* Footer Links */}
          <div className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
            <p>
              {t('login.havingIssues')}{' '}
              <Link href="/help" className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium">
                {t('login.contactSupport')}
              </Link>
            </p>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}

// Loading fallback
function LoginLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
      <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
    </div>
  );
}

// Default export with Suspense
export default function LoginPage() {
  return (
    <Suspense fallback={<LoginLoading />}>
      <LoginContent />
    </Suspense>
  );
}
