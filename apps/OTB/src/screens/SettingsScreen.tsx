'use client';

import React, { useState, useEffect } from 'react';
import {
  Sun, Moon, Monitor, Globe, Bell, BellOff, Lock, Eye, EyeOff,
  Palette, Type, Zap, Database, HardDrive, Trash2, Download,
  ChevronRight, Check, Info, AlertTriangle
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useIsMobile } from '@/hooks/useIsMobile';
import { useConfirmDialog } from '@/hooks/useConfirmDialog';
import { ConfirmDialog } from '@/components/ui';

const SettingsScreen = ({ darkMode = true, setDarkMode, user }: any) => {
  const { t, language, setLanguage } = useLanguage();
  const { isMobile } = useIsMobile();
  const { dialogProps, confirm } = useConfirmDialog();
  const SETTINGS_STORAGE_KEY = 'otb_user_settings';

  const [settings, setSettings] = useState<Record<string, any>>(() => {
    // Load persisted settings from localStorage
    try {
      const saved = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...parsed, theme: darkMode ? 'dark' : 'light' };
      }
    } catch { /* ignore parse errors */ }
    return {
      theme: darkMode ? 'dark' : 'light',
      notifications: { email: true, push: true, desktop: false },
      privacy: { showOnline: true, showActivity: true },
      display: { compactMode: false, animationsEnabled: true },
    };
  });

  // Persist settings to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    } catch { /* ignore quota errors */ }
  }, [settings]);

  const updateSetting = (category: any, key: any, value: any) => {
    if (category) {
      setSettings(prev => ({
        ...prev,
        [category]: {
          ...prev[category],
          [key]: value
        }
      }));
    } else if (key === 'language') {
      setLanguage(value);
    } else {
      setSettings(prev => ({ ...prev, [key]: value }));
      if (key === 'theme') {
        setDarkMode && setDarkMode(value === 'dark');
      }
    }
  };

  const SettingSection = ({ title, description, children }: any) => (
    <div className={`rounded-xl border overflow-hidden ${
      darkMode ? 'border-[#2E2E2E]' : 'border-gray-300'
    }`} style={{
      background: darkMode
        ? 'linear-gradient(135deg, #121212 0%, rgba(215,183,151,0.03) 40%, rgba(215,183,151,0.08) 100%)'
        : 'linear-gradient(135deg, #ffffff 0%, rgba(215,183,151,0.04) 35%, rgba(215,183,151,0.10) 100%)',
      boxShadow: `inset 0 -1px 0 ${darkMode ? 'rgba(215,183,151,0.06)' : 'rgba(215,183,151,0.04)'}`,
    }}>
      <div className={`px-5 py-4 border-b ${darkMode ? 'border-[#2E2E2E]' : 'border-gray-200'}`}>
        <h3 className={`text-base font-semibold font-['Montserrat'] ${
          darkMode ? 'text-[#F2F2F2]' : 'text-gray-900'
        }`}>
          {title}
        </h3>
        {description && (
          <p className={`text-xs mt-0.5 ${darkMode ? 'text-[#666666]' : 'text-gray-700'}`}>
            {description}
          </p>
        )}
      </div>
      <div className="p-2">
        {children}
      </div>
    </div>
  );

  const SettingRow = ({ icon: Icon, label, description, children, onClick }: any) => (
    <div
      onClick={onClick}
      className={`flex items-center gap-4 p-3 rounded-lg transition-all ${
        onClick ? 'cursor-pointer' : ''
      } ${
        darkMode
          ? 'hover:bg-[rgba(215,183,151,0.05)]'
          : 'hover:bg-gray-50'
      }`}
    >
      <div className={`p-2 rounded-lg ${darkMode ? 'bg-[#1A1A1A]' : 'bg-gray-100'}`}>
        <Icon size={18} className={darkMode ? 'text-[#D7B797]' : 'text-[#6B4D30]'} />
      </div>
      <div className="flex-1 min-w-0">
        <div className={`text-sm font-medium ${darkMode ? 'text-[#F2F2F2]' : 'text-gray-900'}`}>
          {label}
        </div>
        {description && (
          <div className={`text-xs mt-0.5 ${darkMode ? 'text-[#666666]' : 'text-gray-700'}`}>
            {description}
          </div>
        )}
      </div>
      {children}
    </div>
  );

  const Toggle = ({ enabled, onChange }: any) => (
    <button
      onClick={() => onChange(!enabled)}
      className={`relative w-11 h-6 rounded-full transition-all duration-200 ${
        enabled
          ? 'bg-[#127749]'
          : darkMode ? 'bg-[#2E2E2E]' : 'bg-gray-300'
      }`}
    >
      <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all duration-200 ${
        enabled ? 'left-6' : 'left-1'
      }`} />
    </button>
  );

  const ThemeOption = ({ value, icon: Icon, label, current }: any) => (
    <button
      onClick={() => updateSetting(null, 'theme', value)}
      className={`flex-1 flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
        current === value
          ? darkMode
            ? 'border-[#D7B797] bg-[rgba(215,183,151,0.1)]'
            : 'border-[#8A6340] bg-[rgba(215,183,151,0.15)]'
          : darkMode
            ? 'border-[#2E2E2E] hover:border-[#3E3E3E]'
            : 'border-gray-300 hover:border-gray-400'
      }`}
    >
      <Icon size={24} className={
        current === value
          ? darkMode ? 'text-[#D7B797]' : 'text-[#6B4D30]'
          : darkMode ? 'text-[#666666]' : 'text-gray-600'
      } />
      <span className={`text-sm font-medium ${
        current === value
          ? darkMode ? 'text-[#D7B797]' : 'text-[#6B4D30]'
          : darkMode ? 'text-[#999999]' : 'text-gray-600'
      }`}>
        {label}
      </span>
      {current === value && (
        <div className={`absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center ${
          darkMode ? 'bg-[#D7B797]' : 'bg-[#8A6340]'
        }`}>
          <Check size={12} className="text-white" />
        </div>
      )}
    </button>
  );

  return (
    <div className="space-y-3 md:space-y-6">
      {/* Page Header */}
      <div>
        <h1 className={`text-lg font-semibold font-['Montserrat'] ${
          darkMode ? 'text-[#F2F2F2]' : 'text-gray-900'
        }`}>
          {t('settings.title')}
        </h1>
        <p className={`text-xs mt-0.5 ${darkMode ? 'text-[#666666]' : 'text-gray-700'}`}>
          {t('settings.subtitle')}
        </p>
      </div>

      {/* Appearance */}
      <SettingSection title={t('settings.appearance')} description={t('settings.customizeAppLooks')}>
        <div className="p-3">
          <div className={`text-xs font-medium uppercase tracking-wider mb-3 ${
            darkMode ? 'text-[#666666]' : 'text-gray-700'
          }`}>
            {t('settings.theme')}
          </div>
          <div className="flex gap-3">
            <ThemeOption value="light" icon={Sun} label={t('settings.light')} current={settings.theme} />
            <ThemeOption value="dark" icon={Moon} label={t('settings.dark')} current={settings.theme} />
            <ThemeOption value="system" icon={Monitor} label={t('settings.system')} current={settings.theme} />
          </div>
        </div>

        <div className={`mx-3 h-px ${darkMode ? 'bg-[#2E2E2E]' : 'bg-gray-100'}`} />

        <SettingRow
          icon={Zap}
          label={t('settings.animations')}
          description={t('settings.animationsDesc')}
        >
          <Toggle
            enabled={settings.display.animationsEnabled}
            onChange={(v: any) => updateSetting('display', 'animationsEnabled', v)}
          />
        </SettingRow>

        <SettingRow
          icon={Type}
          label={t('settings.compactMode')}
          description={t('settings.compactModeDesc')}
        >
          <Toggle
            enabled={settings.display.compactMode}
            onChange={(v: any) => updateSetting('display', 'compactMode', v)}
          />
        </SettingRow>
      </SettingSection>

      {/* Language & Region */}
      <SettingSection title={t('settings.languageAndRegion')}>
        <SettingRow
          icon={Globe}
          label={t('settings.language')}
          description={t('settings.chooseLanguage')}
        >
          <select
            value={language}
            onChange={(e) => updateSetting(null, 'language', e.target.value)}
            className={`pl-3 pr-8 py-1.5 rounded-lg text-sm font-medium border outline-none cursor-pointer ${
              darkMode
                ? 'bg-[#1A1A1A] border-[#2E2E2E] text-[#F2F2F2]'
                : 'bg-gray-100 border-gray-300 text-gray-900'
            }`}
          >
            <option value="vi">{t('settings.vietnamese')}</option>
            <option value="en">{t('settings.english')}</option>
          </select>
        </SettingRow>
      </SettingSection>

      {/* Notifications */}
      <SettingSection title={t('settings.notifications')} description={t('settings.manageUpdates')}>
        <SettingRow
          icon={Bell}
          label={t('settings.emailNotifications')}
          description={t('settings.emailNotificationsDesc')}
        >
          <Toggle
            enabled={settings.notifications.email}
            onChange={(v: any) => updateSetting('notifications', 'email', v)}
          />
        </SettingRow>

        <SettingRow
          icon={Bell}
          label={t('settings.pushNotifications')}
          description={t('settings.pushNotificationsDesc')}
        >
          <Toggle
            enabled={settings.notifications.push}
            onChange={(v: any) => updateSetting('notifications', 'push', v)}
          />
        </SettingRow>

        <SettingRow
          icon={BellOff}
          label={t('settings.desktopNotifications')}
          description={t('settings.desktopNotificationsDesc')}
        >
          <Toggle
            enabled={settings.notifications.desktop}
            onChange={(v: any) => updateSetting('notifications', 'desktop', v)}
          />
        </SettingRow>
      </SettingSection>

      {/* Privacy */}
      <SettingSection title={t('settings.privacy')} description={t('settings.controlVisibility')}>
        <SettingRow
          icon={Eye}
          label={t('settings.showOnlineStatus')}
          description={t('settings.showOnlineStatusDesc')}
        >
          <Toggle
            enabled={settings.privacy.showOnline}
            onChange={(v: any) => updateSetting('privacy', 'showOnline', v)}
          />
        </SettingRow>

        <SettingRow
          icon={EyeOff}
          label={t('settings.showActivity')}
          description={t('settings.showActivityDesc')}
        >
          <Toggle
            enabled={settings.privacy.showActivity}
            onChange={(v: any) => updateSetting('privacy', 'showActivity', v)}
          />
        </SettingRow>
      </SettingSection>

      {/* Data & Storage */}
      <SettingSection title={t('settings.dataAndStorage')}>
        <SettingRow
          icon={Download}
          label={t('settings.exportData')}
          description={t('settings.exportDataDesc')}
          onClick={() => alert(t('settings.exportComingSoon'))}
        >
          <ChevronRight size={18} className={darkMode ? 'text-[#666666]' : 'text-gray-600'} />
        </SettingRow>

        <SettingRow
          icon={HardDrive}
          label={t('settings.clearCache')}
          description={t('settings.clearCacheDesc')}
          onClick={() => alert(t('settings.cacheCleared'))}
        >
          <ChevronRight size={18} className={darkMode ? 'text-[#666666]' : 'text-gray-600'} />
        </SettingRow>
      </SettingSection>

      {/* Danger Zone */}
      <SettingSection title={t('settings.dangerZone')}>
        <SettingRow
          icon={Trash2}
          label={t('settings.deleteAccount')}
          description={t('settings.deleteAccountDesc')}
          onClick={() => {
            confirm({
              title: t('settings.deleteAccount'),
              message: t('settings.deleteConfirm'),
              confirmLabel: t('common.delete'),
              variant: 'danger',
              onConfirm: () => { /* account deletion placeholder */ },
            });
          }}
        >
          <span className={`text-xs font-medium px-2 py-1 rounded ${
            darkMode
              ? 'bg-[rgba(248,81,73,0.1)] text-[#FF7B72]'
              : 'bg-red-100 text-red-600'
          }`}>
            {t('common.irreversible')}
          </span>
        </SettingRow>
      </SettingSection>

      {/* App Info */}
      <div className={`rounded-xl border p-5 ${
        darkMode ? 'bg-[#0A0A0A] border-[#1A1A1A]' : 'bg-gray-50 border-gray-300'
      }`}>
        <div className="flex items-center gap-3">
          <img
            src="/vietErp-logo.png"
            alt="L-ERP"
            className="h-10 w-auto object-contain"
          />
          <div className="flex-1">
            <div className={`text-sm font-semibold font-['Montserrat'] ${
              darkMode ? 'text-[#F2F2F2]' : 'text-gray-900'
            }`}>
              {t('settings.otbSystem')}
            </div>
            <div className={`text-xs ${darkMode ? 'text-[#666666]' : 'text-gray-700'}`}>
              {t('settings.versionLabel')}
            </div>
          </div>
          <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs ${
            darkMode
              ? 'bg-[rgba(42,158,106,0.15)] text-[#2A9E6A]'
              : 'bg-green-100 text-green-700'
          }`}>
            <Check size={12} />
            {t('settings.upToDate')}
          </div>
        </div>
      </div>
      <ConfirmDialog {...dialogProps} />
    </div>
  );
};

export default SettingsScreen;
