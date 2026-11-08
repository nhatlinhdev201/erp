'use client';

import React, { useState } from 'react';
import {
  Mail,
  Bell,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  Clock,
  Users,
  AlertTriangle,
  Package,
  FileText,
  Settings,
  Play,
  Pause,
  ChevronDown,
  ChevronUp,
  Save,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// =============================================================================
// L-ERP MRP - EMAIL NOTIFICATION SETTINGS UI
// Configure email triggers, templates, and schedules
// =============================================================================

// =============================================================================
// TYPES
// =============================================================================

interface NotificationTrigger {
  id: string;
  name: string;
  event: string;
  template: string;
  recipients: string[];
  enabled: boolean;
  conditions?: Record<string, any>;
}

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  description: string;
  category: 'order' | 'inventory' | 'quality' | 'report' | 'system';
}

// =============================================================================
// MOCK DATA
// =============================================================================

const mockTriggers: NotificationTrigger[] = [
  {
    id: '1',
    name: 'Cảnh báo tồn kho thấp',
    event: 'inventory:low_stock',
    template: 'low-stock-alert',
    recipients: ['inventory@company.com', 'manager@company.com'],
    enabled: true,
    conditions: { threshold: 'safety_stock' },
  },
  {
    id: '2',
    name: 'NCR mới (nghiêm trọng)',
    event: 'quality:ncr_created',
    template: 'ncr-created',
    recipients: ['quality@company.com'],
    enabled: true,
    conditions: { severity: ['CRITICAL', 'MAJOR'] },
  },
  {
    id: '3',
    name: 'Đơn hàng mới',
    event: 'order:created',
    template: 'order-confirmation',
    recipients: ['sales@company.com'],
    enabled: false,
  },
  {
    id: '4',
    name: 'Báo cáo hàng ngày',
    event: 'schedule:daily',
    template: 'daily-report',
    recipients: ['management@company.com'],
    enabled: true,
    conditions: { time: '08:00' },
  },
];

const mockTemplates: EmailTemplate[] = [
  { id: 'order-confirmation', name: 'Xác nhận đơn hàng', subject: 'Xác nhận đơn hàng #{orderNumber}', description: 'Gửi khi đơn hàng được xác nhận', category: 'order' },
  { id: 'order-shipped', name: 'Đơn hàng đã gửi', subject: 'Đơn hàng #{orderNumber} đã được gửi', description: 'Gửi khi đơn hàng được giao', category: 'order' },
  { id: 'low-stock-alert', name: 'Cảnh báo tồn kho thấp', subject: '⚠️ Cảnh báo tồn kho thấp', description: 'Khi vật tư dưới mức an toàn', category: 'inventory' },
  { id: 'ncr-created', name: 'NCR mới', subject: 'NCR mới: #{ncrNumber}', description: 'Khi tạo NCR mới', category: 'quality' },
  { id: 'daily-report', name: 'Báo cáo ngày', subject: 'Báo cáo ngày {date}', description: 'Tổng hợp hoạt động hàng ngày', category: 'report' },
  { id: 'weekly-report', name: 'Báo cáo tuần', subject: 'Báo cáo tuần {weekNumber}', description: 'Tổng hợp hoạt động hàng tuần', category: 'report' },
];

// =============================================================================
// COMPONENTS
// =============================================================================

interface TriggerCardProps {
  trigger: NotificationTrigger;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

function TriggerCard({ trigger, onToggle, onEdit, onDelete }: TriggerCardProps) {
  const [expanded, setExpanded] = useState(false);

  const getEventIcon = (event: string) => {
    if (event.startsWith('inventory:')) return <Package className="w-5 h-5" />;
    if (event.startsWith('quality:')) return <AlertTriangle className="w-5 h-5" />;
    if (event.startsWith('order:')) return <FileText className="w-5 h-5" />;
    if (event.startsWith('schedule:')) return <Clock className="w-5 h-5" />;
    return <Bell className="w-5 h-5" />;
  };

  return (
    <div className={cn(
      'bg-white dark:bg-gray-800 rounded-xl border transition-all',
      trigger.enabled
        ? 'border-gray-200 dark:border-gray-700'
        : 'border-gray-200 dark:border-gray-700 opacity-60'
    )}>
      {/* Header */}
      <div className="flex items-center gap-4 p-4">
        <div className={cn(
          'p-2.5 rounded-xl',
          trigger.enabled
            ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600'
            : 'bg-gray-100 dark:bg-gray-700 text-gray-400'
        )}>
          {getEventIcon(trigger.event)}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 dark:text-white">
            {trigger.name}
          </h3>
          <p className="text-sm text-gray-500 truncate">
            {trigger.recipients.length} người nhận
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onToggle}
            className={cn(
              'p-2 rounded-lg transition-colors',
              trigger.enabled
                ? 'bg-green-100 dark:bg-green-900/30 text-green-600 hover:bg-green-200'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-400 hover:bg-gray-200'
            )}
            title={trigger.enabled ? 'Đang bật' : 'Đang tắt'}
          >
            {trigger.enabled ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
          </button>

          <button
            onClick={() => setExpanded(!expanded)}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Expanded Details */}
      {expanded && (
        <div className="px-4 pb-4 pt-0 border-t border-gray-100 dark:border-gray-700 mt-2">
          <div className="pt-4 space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-500 w-24">Sự kiện:</span>
              <code className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs">
                {trigger.event}
              </code>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-500 w-24">Template:</span>
              <span className="text-gray-900 dark:text-white">{trigger.template}</span>
            </div>
            <div className="flex items-start gap-2 text-sm">
              <span className="text-gray-500 w-24">Người nhận:</span>
              <div className="flex flex-wrap gap-1">
                {trigger.recipients.map((email, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded text-xs"
                  >
                    {email}
                  </span>
                ))}
              </div>
            </div>
            {trigger.conditions && (
              <div className="flex items-start gap-2 text-sm">
                <span className="text-gray-500 w-24">Điều kiện:</span>
                <code className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs">
                  {JSON.stringify(trigger.conditions)}
                </code>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
            <button
              onClick={onEdit}
              className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              <Edit2 className="w-4 h-4" />
              Sửa
            </button>
            <button
              onClick={onDelete}
              className="flex items-center gap-1 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
            >
              <Trash2 className="w-4 h-4" />
              Xóa
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function TemplateCard({ template }: { template: EmailTemplate }) {
  const categoryColors: Record<string, string> = {
    order: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    inventory: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    quality: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    report: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    system: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400',
  };

  return (
    <div className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <h3 className="font-medium text-gray-900 dark:text-white">
          {template.name}
        </h3>
        <span className={cn('px-2 py-0.5 rounded text-xs font-medium', categoryColors[template.category])}>
          {template.category}
        </span>
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
        {template.subject}
      </p>
      <p className="text-xs text-gray-500">
        {template.description}
      </p>
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function EmailNotificationSettings() {
  const [triggers, setTriggers] = useState(mockTriggers);
  const [activeTab, setActiveTab] = useState<'triggers' | 'templates'>('triggers');
  const [showAddModal, setShowAddModal] = useState(false);

  const toggleTrigger = (id: string) => {
    setTriggers(prev =>
      prev.map(t => (t.id === id ? { ...t, enabled: !t.enabled } : t))
    );
  };

  const deleteTrigger = (id: string) => {
    if (confirm('Bạn có chắc muốn xóa trigger này?')) {
      setTriggers(prev => prev.filter(t => t.id !== id));
    }
  };

  const enabledCount = triggers.filter(t => t.enabled).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Mail className="w-6 h-6 text-purple-600" />
            Thông báo Email
          </h2>
          <p className="text-gray-500 mt-1">
            Cấu hình email tự động cho các sự kiện
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Thêm trigger
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500">Triggers đang bật</p>
          <p className="text-2xl font-bold text-green-600">{enabledCount}</p>
        </div>
        <div className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500">Tổng triggers</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{triggers.length}</p>
        </div>
        <div className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500">Templates</p>
          <p className="text-2xl font-bold text-purple-600">{mockTemplates.length}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab('triggers')}
          className={cn(
            'px-4 py-2 font-medium transition-colors relative',
            activeTab === 'triggers'
              ? 'text-purple-600'
              : 'text-gray-500 hover:text-gray-700'
          )}
        >
          Triggers
          {activeTab === 'triggers' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-600" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('templates')}
          className={cn(
            'px-4 py-2 font-medium transition-colors relative',
            activeTab === 'templates'
              ? 'text-purple-600'
              : 'text-gray-500 hover:text-gray-700'
          )}
        >
          Templates
          {activeTab === 'templates' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-600" />
          )}
        </button>
      </div>

      {/* Content */}
      {activeTab === 'triggers' ? (
        <div className="space-y-3">
          {triggers.map(trigger => (
            <TriggerCard
              key={trigger.id}
              trigger={trigger}
              onToggle={() => toggleTrigger(trigger.id)}
              onEdit={() => alert('Sửa trigger: ' + trigger.name)}
              onDelete={() => deleteTrigger(trigger.id)}
            />
          ))}
          {triggers.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              Chưa có trigger nào. Bấm "Thêm trigger" để tạo mới.
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {mockTemplates.map(template => (
            <TemplateCard key={template.id} template={template} />
          ))}
        </div>
      )}

      {/* Add Modal (simplified) */}
      {showAddModal && (
        <>
          <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setShowAddModal(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Thêm Trigger mới
                </h3>
                <button onClick={() => setShowAddModal(false)} className="p-1 text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Tên trigger
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl"
                    placeholder="VD: Cảnh báo hết hàng"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Sự kiện
                  </label>
                  <select className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl">
                    <option value="">Chọn sự kiện...</option>
                    <option value="order:created">Đơn hàng mới</option>
                    <option value="inventory:low_stock">Tồn kho thấp</option>
                    <option value="quality:ncr_created">NCR mới</option>
                    <option value="schedule:daily">Lịch hàng ngày</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Template
                  </label>
                  <select className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl">
                    <option value="">Chọn template...</option>
                    {mockTemplates.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Người nhận (cách nhau bởi dấu phẩy)
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl"
                    placeholder="email1@company.com, email2@company.com"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl"
                >
                  Hủy
                </button>
                <button
                  onClick={() => {
                    alert('Trigger đã được thêm!');
                    setShowAddModal(false);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700"
                >
                  <Save className="w-4 h-4" />
                  Lưu
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default EmailNotificationSettings;
