'use client';

// ═══════════════════════════════════════════════════════════════════════════
// Screen: LoginScreen | API: /auth/login | Status: COMPLETE
// Design: L-ERP Login V2 (light theme, fashion icons, glassmorphism)
// ═══════════════════════════════════════════════════════════════════════════
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';

/* ═══════════════════════════════════════════════
   FASHION ICON SVGs (decorative floating elements)
═══════════════════════════════════════════════ */
const FashionIcons = () => (
  <div className="fixed inset-0 pointer-events-none overflow-hidden">
    {/* Handbag */}
    <svg className="absolute w-20 h-20 top-[10%] right-[8%] opacity-[0.25]"
      viewBox="0 0 50 50" fill="none" stroke="#A69076" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22 C12 16, 18 12, 25 12 C32 12, 38 16, 38 22 L38 40 C38 43, 34 45, 25 45 C16 45, 12 43, 12 40 Z"/>
      <path d="M18 12 C18 6, 21 4, 25 4 C29 4, 32 6, 32 12"/>
      <circle cx="25" cy="30" r="3"/>
    </svg>
    {/* Watch */}
    <svg className="absolute w-[65px] h-20 top-[22%] left-[10%] opacity-20"
      viewBox="0 0 40 50" fill="none" stroke="#A69076" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
      <rect x="10" y="12" width="20" height="26" rx="3"/>
      <circle cx="20" cy="25" r="8"/>
      <line x1="20" y1="25" x2="20" y2="19"/>
      <line x1="20" y1="25" x2="25" y2="25"/>
      <path d="M13 12 L13 5 L27 5 L27 12"/>
      <path d="M13 38 L13 45 L27 45 L27 38"/>
    </svg>
    {/* Dress */}
    <svg className="absolute w-[70px] h-[100px] bottom-[25%] right-[6%] opacity-20"
      viewBox="0 0 50 70" fill="none" stroke="#A69076" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 5 C20 3, 22 2, 25 2 C28 2, 30 3, 30 5"/>
      <path d="M20 5 L17 15 L10 60 C10 63, 15 65, 25 65 C35 65, 40 63, 40 60 L33 15 L30 5"/>
      <path d="M20 5 L22 8 L25 5 L28 8 L30 5"/>
      <ellipse cx="25" cy="25" rx="8" ry="3"/>
    </svg>
    {/* Sunglasses */}
    <svg className="absolute w-[75px] h-10 top-[55%] right-[12%] opacity-[0.18]"
      viewBox="0 0 60 30" fill="none" stroke="#A69076" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="15" cy="17" rx="12" ry="10"/>
      <ellipse cx="45" cy="17" rx="12" ry="10"/>
      <path d="M27 17 C29 14, 31 14, 33 17"/>
      <path d="M3 15 L0 12"/>
      <path d="M57 15 L60 12"/>
    </svg>
    {/* Jacket */}
    <svg className="absolute w-[85px] h-[90px] bottom-[12%] right-[25%] opacity-[0.18]"
      viewBox="0 0 60 65" fill="none" stroke="#A69076" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 5 L15 8 L8 60 L25 60 L25 25 L30 15 L35 25 L35 60 L52 60 L45 8 L40 5"/>
      <path d="M20 5 C20 2, 25 0, 30 0 C35 0, 40 2, 40 5"/>
      <path d="M25 15 L30 25 L35 15"/>
      <line x1="30" y1="30" x2="30" y2="55"/>
      <circle cx="30" cy="35" r="2"/>
      <circle cx="30" cy="45" r="2"/>
    </svg>
    {/* T-Shirt */}
    <svg className="absolute w-[70px] h-[65px] top-[42%] left-[5%] opacity-[0.16]"
      viewBox="0 0 55 50" fill="none" stroke="#A69076" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 5 L12 8 L2 15 L8 22 L15 18 L15 45 L40 45 L40 18 L47 22 L53 15 L43 8 L37 5"/>
      <path d="M18 5 C18 2, 23 0, 27.5 0 C32 0, 37 2, 37 5"/>
      <ellipse cx="27.5" cy="6" rx="5" ry="3"/>
    </svg>
    {/* Pants */}
    <svg className="absolute w-[60px] h-[85px] bottom-[15%] left-[8%] opacity-[0.18]"
      viewBox="0 0 45 65" fill="none" stroke="#A69076" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 2 L37 2 L37 8 L40 60 L28 60 L25 25 L22.5 8 L20 25 L17 60 L5 60 L8 8 Z"/>
      <path d="M8 2 L37 2 L37 8 L8 8 Z"/>
      <line x1="22.5" y1="8" x2="22.5" y2="20"/>
    </svg>
  </div>
);

const LoginScreen = () => {
  const { login, loginWithMicrosoft, loading, loginStatus: authLoginStatus } = useAuth();
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loginStatus, setLoginStatus] = useState('');

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLocalError('');
    setLoginStatus('');

    if (!email || !password) {
      setLocalError(t('login.emptyFieldError'));
      return;
    }

    try {
      await login(email, password);
      setLoginStatus('');
      toast.success(t('login.loginSuccess'));
    } catch (err: any) {
      setLoginStatus('');
      const isTimeout = err.message?.includes('timeout');
      const isNetwork = err.message?.includes('Network Error') || err.message?.includes('ERR_NETWORK');

      if (isTimeout || isNetwork) {
        setLocalError('Máy chủ đang khởi động, vui lòng thử lại sau vài giây...');
        toast.error('Máy chủ đang khởi động...');
      } else {
        setLocalError(err.message || t('login.loginFailed'));
        toast.error(err.message || t('login.loginFailed'));
      }
    }
  };

  const handleMicrosoftLogin = async () => {
    setLocalError('');
    try {
      await loginWithMicrosoft();
      toast.success('Đăng nhập Microsoft thành công!');
    } catch (err: any) {
      if (err.message?.includes('hủy')) return;
      setLocalError(err.message || 'Microsoft login failed');
      toast.error(err.message || 'Microsoft login failed');
    }
  };

  // Demo accounts for quick login
  const demoAccounts = [
    { email: 'admin@your-domain.com', password: 'lerp@2026', role: 'Admin', color: '#C4A77D' },
    { email: 'merch@your-domain.com', password: 'lerp@2026', role: 'Merchandiser', color: '#6B8E6B' },
    { email: 'manager@your-domain.com', password: 'lerp@2026', role: 'Manager', color: '#6B7B8E' },
    { email: 'finance@your-domain.com', password: 'lerp@2026', role: 'Finance', color: '#8E6B8E' },
  ];

  const handleDemoLogin = (account: any) => {
    setEmail(account.email);
    setPassword(account.password);
    setLocalError('');
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-5 md:p-10"
      style={{ background: 'linear-gradient(160deg, #FAF9F7 0%, #F5F3EF 30%, #EDE9E3 60%, #F0EDE7 100%)' }}>

      {/* Subtle accent shapes */}
      <div className="fixed w-[400px] h-[400px] rounded-full -top-[100px] -right-[100px] opacity-40 pointer-events-none"
        style={{ background: 'linear-gradient(135deg, #D4C4B0 0%, transparent 70%)', filter: 'blur(80px)' }} />
      <div className="fixed w-[300px] h-[300px] rounded-full -bottom-[50px] -left-[50px] opacity-40 pointer-events-none"
        style={{ background: 'linear-gradient(135deg, #C9B8A4 0%, transparent 70%)', filter: 'blur(80px)' }} />

      {/* Fashion icons */}
      <div className="hidden md:block">
        <FashionIcons />
      </div>

      {/* Main content */}
      <div className="relative z-10 w-full max-w-[420px]">

        {/* Logo Section */}
        <div className="text-center mb-10">
          <img src="/vietErp-logo.png" alt="L-ERP" className="h-16 mx-auto mb-2 object-contain" />
          <p className="text-[15px] font-semibold tracking-[0.08em] text-[#5C4A3A] mb-1"
            style={{ fontFamily: 'var(--font-montserrat), sans-serif' }}>
            Hệ Thống Quản Lý OTB
          </p>
          <p className="text-[12px] font-light tracking-[0.03em] text-[#7A6655]"
            style={{ fontFamily: 'var(--font-montserrat), sans-serif' }}>
            Quản lý kế hoạch Open-to-Buy
          </p>
        </div>

        {/* Login Card */}
        <div className="relative px-11 py-12 rounded-3xl border"
          style={{
            background: 'rgba(255, 255, 255, 0.82)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderColor: 'rgba(139, 115, 85, 0.22)',
            boxShadow: '0 4px 40px rgba(139, 115, 85, 0.12), 0 1px 3px rgba(139, 115, 85, 0.08)',
          }}>

          {/* Decorative corners */}
          <div className="absolute top-4 left-4 w-6 h-6 border-t border-l" style={{ borderColor: 'rgba(139, 115, 85, 0.30)' }} />
          <div className="absolute bottom-4 right-4 w-6 h-6 border-b border-r" style={{ borderColor: 'rgba(139, 115, 85, 0.30)' }} />

          {/* Welcome */}
          <div className="text-center mb-9">
            <h2 className="text-[28px] font-normal text-[#3D2E22] mb-1.5"
              style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}>
              Welcome Back
            </h2>
            <p className="text-[13px] font-light text-[#7A6655] tracking-[0.02em]">
              Sign in to continue
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            {/* Email */}
            <div className="relative mb-[18px]">
              <input
                data-testid="email-input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('login.emailPlaceholder') || 'Email address'}
                className="login-input w-full py-4 pl-5 pr-[50px] rounded-[14px] text-[14px] font-normal text-[#3D2E22] tracking-[0.02em] outline-none transition-colors duration-200 focus:border-[rgba(139,115,85,0.50)] focus:bg-[rgba(255,255,255,0.9)] focus:ring-[3px] focus:ring-[rgba(139,115,85,0.08)]"
                style={{
                  background: 'rgba(255, 255, 255, 0.7)',
                  border: '1px solid rgba(139, 115, 85, 0.28)',
                  fontFamily: 'var(--font-montserrat), sans-serif',
                }}
              />
              <svg className="absolute right-[18px] top-1/2 -translate-y-1/2 w-5 h-5 text-[#8B7A6B] pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
              </svg>
            </div>

            {/* Password */}
            <div className="relative mb-[18px]">
              <input
                data-testid="password-input"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('login.passwordPlaceholder') || 'Password'}
                className="login-input w-full py-4 pl-5 pr-[50px] rounded-[14px] text-[14px] font-normal text-[#3D2E22] tracking-[0.02em] outline-none transition-colors duration-200 focus:border-[rgba(139,115,85,0.50)] focus:bg-[rgba(255,255,255,0.9)] focus:ring-[3px] focus:ring-[rgba(139,115,85,0.08)]"
                style={{
                  background: 'rgba(255, 255, 255, 0.7)',
                  border: '1px solid rgba(139, 115, 85, 0.28)',
                  fontFamily: 'var(--font-montserrat), sans-serif',
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-[18px] top-1/2 -translate-y-1/2 text-[#8B7A6B] hover:text-[#5C4A3A] transition-colors"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            {/* Error */}
            {localError && (
              <div data-testid="error-message" className="mb-4 p-3 rounded-xl text-sm text-red-600 border"
                style={{ background: 'rgba(220, 38, 38, 0.06)', borderColor: 'rgba(220, 38, 38, 0.15)' }}>
                {localError}
              </div>
            )}

            {/* Remember & Forgot */}
            <div className="flex items-center justify-between mb-7 text-[13px]">
              <label className="flex items-center gap-2.5 cursor-pointer text-[#6B5744] hover:text-[#3D2E22] transition-colors font-light select-none">
                <div
                  onClick={() => setRememberMe(!rememberMe)}
                  className="w-[18px] h-[18px] rounded-[4px] border-[1.5px] flex items-center justify-center cursor-pointer transition-all shrink-0"
                  style={{
                    borderColor: rememberMe ? '#6B5744' : 'rgba(139, 115, 85, 0.40)',
                    background: rememberMe ? '#6B5744' : 'rgba(255, 255, 255, 0.8)',
                  }}
                >
                  {rememberMe && (
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M2.5 6L5 8.5L9.5 3.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </div>
                <span>Ghi nhớ đăng nhập</span>
              </label>
              <button type="button" onClick={() => toast(t('login.contactAdmin') || 'Contact your administrator to reset your password', { icon: 'ℹ️' })} className="text-[#6B5744] hover:text-[#3D2E22] font-light transition-colors no-underline bg-transparent border-none cursor-pointer text-[13px]">
                Forgot password?
              </button>
            </div>

            {/* Submit */}
            <button
              data-testid="submit-button"
              type="submit"
              disabled={loading}
              className="w-full py-[18px] rounded-[14px] text-white text-[12px] font-medium tracking-[0.25em] uppercase cursor-pointer relative overflow-hidden transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#7A6548]"
              style={{
                background: 'linear-gradient(135deg, #8B7355 0%, #6B5744 100%)',
                fontFamily: 'var(--font-montserrat), sans-serif',
                boxShadow: '0 4px 15px rgba(107, 87, 68, 0.2)',
              }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {authLoginStatus || 'Đang đăng nhập...'}
                </span>
              ) : (
                <span>Sign In</span>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-5 my-6">
            <div className="flex-1 h-px" style={{ background: 'rgba(139, 115, 85, 0.25)' }} />
            <span className="text-[11px] font-medium text-[#8B7A6B] tracking-[0.15em]">OR</span>
            <div className="flex-1 h-px" style={{ background: 'rgba(139, 115, 85, 0.25)' }} />
          </div>

          {/* Microsoft Login */}
          <button
            type="button"
            onClick={handleMicrosoftLogin}
            disabled={loading}
            className="w-full py-[14px] rounded-[14px] text-[13px] font-medium tracking-[0.03em] cursor-pointer flex items-center justify-center gap-3 transition-all duration-200 hover:border-[rgba(139,115,85,0.45)] hover:bg-[rgba(255,255,255,0.95)] disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: 'rgba(255, 255, 255, 0.8)',
              border: '1px solid rgba(139, 115, 85, 0.28)',
              color: '#3D2E22',
              fontFamily: 'var(--font-montserrat), sans-serif',
            }}
          >
            <svg width="20" height="20" viewBox="0 0 21 21" fill="none">
              <rect x="1" y="1" width="9" height="9" fill="#F25022"/>
              <rect x="11" y="1" width="9" height="9" fill="#7FBA00"/>
              <rect x="1" y="11" width="9" height="9" fill="#00A4EF"/>
              <rect x="11" y="11" width="9" height="9" fill="#FFB900"/>
            </svg>
            Sign in with Microsoft
          </button>

          {/* Demo Divider */}
          <div className="flex items-center gap-5 my-6">
            <div className="flex-1 h-px" style={{ background: 'rgba(139, 115, 85, 0.25)' }} />
            <span className="text-[11px] font-medium text-[#8B7A6B] tracking-[0.15em]">DEMO</span>
            <div className="flex-1 h-px" style={{ background: 'rgba(139, 115, 85, 0.25)' }} />
          </div>

          {/* Demo Accounts */}
          <div className="grid grid-cols-2 gap-2">
            {demoAccounts.map((account) => (
              <button
                key={account.email}
                type="button"
                onClick={() => handleDemoLogin(account)}
                className="flex items-center justify-between px-3 py-2.5 rounded-[10px] text-[12px] cursor-pointer transition-colors duration-200 hover:bg-[rgba(255,255,255,0.9)] hover:border-[rgba(139,115,85,0.35)] group"
                style={{
                  background: 'rgba(255, 255, 255, 0.75)',
                  border: '1px solid rgba(139, 115, 85, 0.22)',
                }}
              >
                <span className="text-[#3D2E22] font-normal truncate">{account.email.split('@')[0]}</span>
                <span className="font-medium ml-1" style={{ color: account.color }}>{account.role}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-[11px] font-light text-[#8B7A6B] tracking-[0.08em]">
            &copy; 2026 Your Company. All rights reserved.
          </p>
        </div>
      </div>

      {/* Keyframe animations - using dangerouslySetInnerHTML to avoid jsx type issues */}
      <style dangerouslySetInnerHTML={{ __html: `
        .login-input::placeholder {
          color: #8B7A6B;
          font-weight: 300;
        }
      ` }} />
    </div>
  );
};

export default LoginScreen;
