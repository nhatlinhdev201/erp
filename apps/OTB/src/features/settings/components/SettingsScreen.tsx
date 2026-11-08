'use client';

import React, { useState, useEffect } from 'react';
import {
  Globe, Bell, BellOff, Lock, Eye, EyeOff, Database, HardDrive, Trash2, Download,
  ChevronRight, Check, Info, AlertTriangle
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useIsMobile } from '@/hooks/useIsMobile';
import { useConfirmDialog } from '@/hooks/useConfirmDialog';
import { ConfirmDialog } from '@/components/ui';

const SettingsScreen = ({ user }: any) => {
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
        return parsed;
      }
    } catch { /* ignore parse errors */ }
    return { notifications: { email: true, push: true, desktop: false },
      privacy: { showOnline: true, showActivity: true },
      display: { compactMode: false, animationsEnabled: true }};
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
    }
  };

  const SettingSection = ({ title, description, children }: any) => (
    <div className={`rounded-xl border overflow-hidden ${'border-gray-300'}`} style={{
      background:'linear-gradient(135deg, #ffffff 0%, rgba(215,183,151,0.04) 35%, rgba(215,183,151,0.10) 100%)',
      boxShadow: `inset 0 -1px 0 ${'rgba(215,183,151,0.04)'}`}}>
      <div className={`px-5 py-4 border-b ${'border-gray-200'}`}>
        <h3 className={`text-base font-semibold font-['Montserrat'] ${'text-gray-900'}`}>
          {title}
        </h3>
        {description && (
          <p className={`text-xs mt-0.5 ${'text-gray-700'}`}>
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
      } ${'hover:bg-gray-50'}`}
    >
      <div className={`p-2 rounded-lg ${'bg-gray-100'}`}>
        <Icon size={18} className={'text-[#6B4D30]'} />
      </div>
      <div className="flex-1 min-w-0">
        <div className={`text-sm font-medium ${'text-gray-900'}`}>
          {label}
        </div>
        {description && (
          <div className={`text-xs mt-0.5 ${'text-gray-700'}`}>
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
          :'bg-gray-300'}`}
    >
      <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all duration-200 ${
        enabled ? 'left-6' : 'left-1'
      }`} />
    </button>
  );
  return (
    <div className="space-y-3 md:space-y-6">
      {/* Page Header */}
      <div>
        <h1 className={`text-lg font-semibold font-['Montserrat'] ${'text-gray-900'}`}>
          {t('settings.title')}
        </h1>
        <p className={`text-xs mt-0.5 ${'text-gray-700'}`}>
          {t('settings.subtitle')}
        </p>
      </div>

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
            className={`pl-3 pr-8 py-1.5 rounded-lg text-sm font-medium border outline-none cursor-pointer ${'bg-gray-100 border-gray-300 text-gray-900'}`}
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
          <ChevronRight size={18} className={'text-gray-600'} />
        </SettingRow>

        <SettingRow
          icon={HardDrive}
          label={t('settings.clearCache')}
          description={t('settings.clearCacheDesc')}
          onClick={() => alert(t('settings.cacheCleared'))}
        >
          <ChevronRight size={18} className={'text-gray-600'} />
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
              onConfirm: () => { /* account deletion placeholder */ }});
          }}
        >
          <span className={`text-xs font-medium px-2 py-1 rounded ${'bg-red-100 text-red-600'}`}>
            {t('common.irreversible')}
          </span>
        </SettingRow>
      </SettingSection>

      {/* App Info */}
      <div className={`rounded-xl border p-5 ${'bg-gray-50 border-gray-300'}`}>
        <div className="flex items-center gap-3">
          <img
            src="/vietErp-logo.png"
            alt="L-ERP"
            className="h-10 w-auto object-contain"
          />
          <div className="flex-1">
            <div className={`text-sm font-semibold font-['Montserrat'] ${'text-gray-900'}`}>
              {t('settings.otbSystem')}
            </div>
            <div className={`text-xs ${'text-gray-700'}`}>
              {t('settings.versionLabel')}
            </div>
          </div>
          <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs ${'bg-green-100 text-green-700'}`}>
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
