// =============================================================================
// L-ERP MRP - REGISTER PAGE
// User registration interface
// =============================================================================

'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { LogoLight } from '@/components/ui/logo';
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  AlertCircle,
  Loader2,
  ArrowRight,
  CheckCircle,
  XCircle,
  Briefcase,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const ROLE_OPTIONS = [
  { value: 'viewer', label: 'Xem (Viewer)', description: 'Chỉ xem báo cáo và dữ liệu' },
  { value: 'operator', label: 'Nhân viên (Operator)', description: 'Vận hành, tạo/sửa dữ liệu sản xuất' },
  { value: 'manager', label: 'Quản lý (Manager)', description: 'Quản lý, phê duyệt đơn hàng và sản xuất' },
];

export default function RegisterPage() {
  const router = useRouter();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('viewer');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const passwordChecks = [
    { label: 'Ít nhất 12 ký tự', valid: password.length >= 12 },
    { label: 'Có chữ in hoa', valid: /[A-Z]/.test(password) },
    { label: 'Có chữ thường', valid: /[a-z]/.test(password) },
    { label: 'Có chữ số', valid: /[0-9]/.test(password) },
    { label: 'Có ký tự đặc biệt', valid: /[!@#$%^&*(),.?":{}|<>]/.test(password) },
  ];

  const allChecksPass = passwordChecks.every((c) => c.valid);
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;
  const canSubmit = name.trim().length > 0 && email.length > 0 && allChecksPass && passwordsMatch;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.toLowerCase().trim(),
          role,
          password,
          confirmPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Đã xảy ra lỗi');
      } else {
        router.push('/login?registered=true');
      }
    } catch {
      setError('Không thể kết nối đến server');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-gray-900">
      <div className="w-full flex flex-col lg:flex-row">
        {/* Left Panel - Branding (reuse from login) */}
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
            <div className="flex items-center">
              <LogoLight height={48} width={180} className="h-10 lg:h-12 w-auto" priority />
            </div>

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

            <div className="text-gray-500 text-sm font-mono">
              © 2026 RTR Manufacturing
            </div>
          </div>
        </div>

        {/* Right Panel - Register Form */}
        <div className="w-full lg:w-[45%] flex items-center justify-center p-6 lg:p-12 bg-gray-50 dark:bg-gray-950">
          <div className="w-full max-w-md">
            {/* Form Header */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Tạo tài khoản
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Đăng ký để sử dụng hệ thống L-ERP MRP
              </p>
            </div>

            {/* Error Alert */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            {/* Register Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Name Input */}
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Họ và tên
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                  </div>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    autoComplete="name"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={cn(
                      'block w-full pl-12 pr-4 py-3 rounded-xl border transition-all',
                      'bg-white dark:bg-gray-800',
                      'border-gray-300 dark:border-gray-700',
                      'text-gray-900 dark:text-white',
                      'placeholder-gray-400 dark:placeholder-gray-500',
                      'focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500',
                      'disabled:opacity-50 disabled:cursor-not-allowed'
                    )}
                    placeholder="Nguyễn Văn A"
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Email Input */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Email
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

              {/* Role Selector */}
              <div>
                <label
                  htmlFor="role"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Vai trò
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Briefcase className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                  </div>
                  <select
                    id="role"
                    name="role"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className={cn(
                      'block w-full pl-12 pr-4 py-3 rounded-xl border transition-all appearance-none',
                      'bg-white dark:bg-gray-800',
                      'border-gray-300 dark:border-gray-700',
                      'text-gray-900 dark:text-white',
                      'focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500',
                      'disabled:opacity-50 disabled:cursor-not-allowed'
                    )}
                    disabled={isLoading}
                  >
                    {ROLE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
                <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                  {ROLE_OPTIONS.find((opt) => opt.value === role)?.description}
                </p>
              </div>

              {/* Password Input */}
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Mật khẩu
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
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

              {/* Password Requirements Checklist */}
              {password.length > 0 && (
                <div className="space-y-1.5">
                  {passwordChecks.map((check, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      {check.valid ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <XCircle className="w-4 h-4 text-gray-300 dark:text-gray-600" />
                      )}
                      <span className={check.valid ? 'text-green-600 dark:text-green-400' : 'text-gray-500'}>
                        {check.label}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Confirm Password Input */}
              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Xác nhận mật khẩu
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                  </div>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={cn(
                      'block w-full pl-12 pr-4 py-3 rounded-xl border transition-all',
                      'bg-white dark:bg-gray-800',
                      confirmPassword.length > 0 && !passwordsMatch
                        ? 'border-red-300 dark:border-red-700'
                        : 'border-gray-300 dark:border-gray-700',
                      'text-gray-900 dark:text-white',
                      'placeholder-gray-400 dark:placeholder-gray-500',
                      'focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500',
                      'disabled:opacity-50 disabled:cursor-not-allowed'
                    )}
                    placeholder="Nhập lại mật khẩu"
                    disabled={isLoading}
                  />
                </div>
                {confirmPassword.length > 0 && !passwordsMatch && (
                  <p className="mt-1.5 text-sm text-red-500">Mật khẩu không khớp</p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading || !canSubmit}
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
                    <span>Đang xử lý...</span>
                  </>
                ) : (
                  <>
                    <span>Đăng ký</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>

            {/* Login Link */}
            <div className="mt-8 text-center text-sm text-gray-600 dark:text-gray-400">
              <p>
                Đã có tài khoản?{' '}
                <Link
                  href="/login"
                  className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                >
                  Đăng nhập
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
