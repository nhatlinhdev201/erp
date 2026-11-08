'use client';

import React, { useState, useCallback } from 'react';
import {
  Type,
  Hash,
  Calendar,
  ToggleLeft,
  List,
  AlignLeft,
  Mail,
  Phone,
  Link,
  Upload,
  Plus,
  Trash2,
  GripVertical,
  Settings,
  Eye,
  Save,
  Copy,
  ChevronDown,
  ChevronUp,
  X,
  Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// =============================================================================
// L-ERP MRP - FORM BUILDER
// Dynamic form creation with drag-drop fields
// =============================================================================

// =============================================================================
// TYPES
// =============================================================================

export type FieldType =
  | 'text'
  | 'number'
  | 'email'
  | 'phone'
  | 'url'
  | 'textarea'
  | 'select'
  | 'multiselect'
  | 'checkbox'
  | 'radio'
  | 'date'
  | 'datetime'
  | 'file'
  | 'hidden';

export interface ValidationRule {
  type: 'required' | 'min' | 'max' | 'minLength' | 'maxLength' | 'pattern' | 'custom';
  value?: any;
  message: string;
}

export interface FieldOption {
  label: string;
  value: string;
}

export interface FormField {
  id: string;
  type: FieldType;
  name: string;
  label: string;
  placeholder?: string;
  defaultValue?: any;
  options?: FieldOption[];
  validation?: ValidationRule[];
  helpText?: string;
  width?: 'full' | 'half' | 'third';
  hidden?: boolean;
  disabled?: boolean;
  dependsOn?: {
    field: string;
    value: any;
  };
}

export interface FormTemplate {
  id: string;
  name: string;
  description?: string;
  fields: FormField[];
  createdAt: Date;
  updatedAt: Date;
}

// =============================================================================
// FIELD TYPE CONFIG
// =============================================================================

const fieldTypes: {
  type: FieldType;
  label: string;
  icon: React.ReactNode;
  description: string;
}[] = [
  { type: 'text', label: 'Văn bản', icon: <Type className="w-4 h-4" />, description: 'Nhập văn bản ngắn' },
  { type: 'number', label: 'Số', icon: <Hash className="w-4 h-4" />, description: 'Nhập số' },
  { type: 'email', label: 'Email', icon: <Mail className="w-4 h-4" />, description: 'Địa chỉ email' },
  { type: 'phone', label: 'Điện thoại', icon: <Phone className="w-4 h-4" />, description: 'Số điện thoại' },
  { type: 'url', label: 'URL', icon: <Link className="w-4 h-4" />, description: 'Địa chỉ website' },
  { type: 'textarea', label: 'Văn bản dài', icon: <AlignLeft className="w-4 h-4" />, description: 'Nhập văn bản nhiều dòng' },
  { type: 'select', label: 'Chọn 1', icon: <List className="w-4 h-4" />, description: 'Chọn 1 từ danh sách' },
  { type: 'multiselect', label: 'Chọn nhiều', icon: <List className="w-4 h-4" />, description: 'Chọn nhiều từ danh sách' },
  { type: 'checkbox', label: 'Checkbox', icon: <ToggleLeft className="w-4 h-4" />, description: 'Đánh dấu có/không' },
  { type: 'radio', label: 'Radio', icon: <List className="w-4 h-4" />, description: 'Chọn 1 từ nhóm' },
  { type: 'date', label: 'Ngày', icon: <Calendar className="w-4 h-4" />, description: 'Chọn ngày' },
  { type: 'datetime', label: 'Ngày giờ', icon: <Calendar className="w-4 h-4" />, description: 'Chọn ngày và giờ' },
  { type: 'file', label: 'Tệp tin', icon: <Upload className="w-4 h-4" />, description: 'Upload file' },
];

// =============================================================================
// FIELD EDITOR
// =============================================================================

interface FieldEditorProps {
  field: FormField;
  onChange: (field: FormField) => void;
  onDelete: () => void;
  allFields: FormField[];
}

function FieldEditor({ field, onChange, onDelete, allFields }: FieldEditorProps) {
  const [expanded, setExpanded] = useState(false);
  const fieldConfig = fieldTypes.find(f => f.type === field.type);
  const showOptions = ['select', 'multiselect', 'radio'].includes(field.type);

  const addOption = () => {
    const options = field.options || [];
    onChange({
      ...field,
      options: [...options, { label: `Tùy chọn ${options.length + 1}`, value: `option_${options.length + 1}` }],
    });
  };

  const updateOption = (index: number, key: 'label' | 'value', value: string) => {
    const options = [...(field.options || [])];
    options[index] = { ...options[index], [key]: value };
    onChange({ ...field, options });
  };

  const removeOption = (index: number) => {
    const options = [...(field.options || [])];
    options.splice(index, 1);
    onChange({ ...field, options });
  };

  const addValidation = (type: ValidationRule['type']) => {
    const validation = field.validation || [];
    onChange({
      ...field,
      validation: [...validation, { type, message: getDefaultMessage(type) }],
    });
  };

  const getDefaultMessage = (type: ValidationRule['type']): string => {
    const messages: Record<ValidationRule['type'], string> = {
      required: 'Trường này bắt buộc',
      min: 'Giá trị phải lớn hơn hoặc bằng {value}',
      max: 'Giá trị phải nhỏ hơn hoặc bằng {value}',
      minLength: 'Độ dài tối thiểu là {value} ký tự',
      maxLength: 'Độ dài tối đa là {value} ký tự',
      pattern: 'Định dạng không hợp lệ',
      custom: 'Giá trị không hợp lệ',
    };
    return messages[type];
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 dark:bg-gray-700/50">
        <button className="p-1 text-gray-400 cursor-grab hover:text-gray-600">
          <GripVertical className="w-4 h-4" />
        </button>
        <div className="p-1.5 rounded-lg bg-purple-100 dark:bg-purple-900/30 text-purple-600">
          {fieldConfig?.icon}
        </div>
        <div className="flex-1 min-w-0">
          <input
            type="text"
            value={field.label}
            onChange={(e) => onChange({ ...field, label: e.target.value })}
            className="w-full bg-transparent font-medium text-gray-900 dark:text-white border-none focus:ring-0 p-0"
            placeholder="Nhãn trường"
          />
        </div>
        <span className="text-xs text-gray-500 bg-gray-200 dark:bg-gray-600 px-2 py-1 rounded">
          {fieldConfig?.label}
        </span>
        <button
          onClick={() => setExpanded(!expanded)}
          className="p-1 text-gray-400 hover:text-gray-600"
        >
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        <button
          onClick={onDelete}
          className="p-1 text-gray-400 hover:text-red-600"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Expanded Settings */}
      {expanded && (
        <div className="p-4 space-y-4 border-t border-gray-200 dark:border-gray-700">
          {/* Basic Settings */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Tên trường (name)</label>
              <input
                type="text"
                value={field.name}
                onChange={(e) => onChange({ ...field, name: e.target.value.toLowerCase().replace(/\s/g, '_') })}
                className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg"
                placeholder="field_name"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Chiều rộng</label>
              <select
                value={field.width || 'full'}
                onChange={(e) => onChange({ ...field, width: e.target.value as any })}
                className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg"
              >
                <option value="full">Full</option>
                <option value="half">1/2</option>
                <option value="third">1/3</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Placeholder</label>
            <input
              type="text"
              value={field.placeholder || ''}
              onChange={(e) => onChange({ ...field, placeholder: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Văn bản trợ giúp</label>
            <input
              type="text"
              value={field.helpText || ''}
              onChange={(e) => onChange({ ...field, helpText: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg"
            />
          </div>

          {/* Options for select/radio */}
          {showOptions && (
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-2">Tùy chọn</label>
              <div className="space-y-2">
                {(field.options || []).map((option, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={option.label}
                      onChange={(e) => updateOption(index, 'label', e.target.value)}
                      className="flex-1 px-3 py-1.5 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg"
                      placeholder="Nhãn"
                    />
                    <input
                      type="text"
                      value={option.value}
                      onChange={(e) => updateOption(index, 'value', e.target.value)}
                      className="flex-1 px-3 py-1.5 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg"
                      placeholder="Giá trị"
                    />
                    <button
                      onClick={() => removeOption(index)}
                      className="p-1.5 text-gray-400 hover:text-red-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={addOption}
                  className="flex items-center gap-1 text-sm text-purple-600 hover:text-purple-700"
                >
                  <Plus className="w-4 h-4" />
                  Thêm tùy chọn
                </button>
              </div>
            </div>
          )}

          {/* Validation */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-2">Validation</label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => addValidation('required')}
                className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200"
              >
                Bắt buộc
              </button>
              {['number'].includes(field.type) && (
                <>
                  <button
                    onClick={() => addValidation('min')}
                    className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200"
                  >
                    Min
                  </button>
                  <button
                    onClick={() => addValidation('max')}
                    className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200"
                  >
                    Max
                  </button>
                </>
              )}
              {['text', 'textarea', 'email'].includes(field.type) && (
                <>
                  <button
                    onClick={() => addValidation('minLength')}
                    className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200"
                  >
                    Min length
                  </button>
                  <button
                    onClick={() => addValidation('maxLength')}
                    className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200"
                  >
                    Max length
                  </button>
                </>
              )}
            </div>
            {field.validation && field.validation.length > 0 && (
              <div className="mt-2 space-y-1">
                {field.validation.map((rule, index) => (
                  <div key={index} className="flex items-center gap-2 text-xs text-gray-600 bg-gray-50 dark:bg-gray-700 px-2 py-1 rounded">
                    <Check className="w-3 h-3 text-green-500" />
                    <span>{rule.type}</span>
                    {rule.value !== undefined && <span>: {rule.value}</span>}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Conditional */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id={`disabled-${field.id}`}
              checked={field.disabled || false}
              onChange={(e) => onChange({ ...field, disabled: e.target.checked })}
              className="rounded border-gray-300"
            />
            <label htmlFor={`disabled-${field.id}`} className="text-sm text-gray-600 dark:text-gray-400">
              Vô hiệu hóa
            </label>
            <input
              type="checkbox"
              id={`hidden-${field.id}`}
              checked={field.hidden || false}
              onChange={(e) => onChange({ ...field, hidden: e.target.checked })}
              className="rounded border-gray-300"
            />
            <label htmlFor={`hidden-${field.id}`} className="text-sm text-gray-600 dark:text-gray-400">
              Ẩn
            </label>
          </div>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// FORM PREVIEW
// =============================================================================

interface FormPreviewProps {
  fields: FormField[];
  className?: string;
}

function FormPreview({ fields, className }: FormPreviewProps) {
  const visibleFields = fields.filter(f => !f.hidden);

  const renderField = (field: FormField) => {
    const baseInputClass = "w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent";

    switch (field.type) {
      case 'textarea':
        return <textarea className={baseInputClass} rows={3} placeholder={field.placeholder} disabled={field.disabled} />;
      
      case 'select':
        return (
          <select className={baseInputClass} disabled={field.disabled}>
            <option value="">{field.placeholder || 'Chọn...'}</option>
            {field.options?.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        );
      
      case 'checkbox':
        return (
          <label className="flex items-center gap-2">
            <input type="checkbox" className="rounded border-gray-300" disabled={field.disabled} />
            <span className="text-sm text-gray-600 dark:text-gray-400">{field.placeholder || 'Đồng ý'}</span>
          </label>
        );
      
      case 'radio':
        return (
          <div className="space-y-2">
            {field.options?.map(opt => (
              <label key={opt.value} className="flex items-center gap-2">
                <input type="radio" name={field.name} value={opt.value} className="border-gray-300" disabled={field.disabled} />
                <span className="text-sm text-gray-600 dark:text-gray-400">{opt.label}</span>
              </label>
            ))}
          </div>
        );
      
      case 'file':
        return (
          <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-6 text-center">
            <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
            <p className="text-sm text-gray-500">Kéo thả file hoặc click để chọn</p>
          </div>
        );
      
      default:
        return (
          <input
            type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : field.type === 'datetime' ? 'datetime-local' : 'text'}
            className={baseInputClass}
            placeholder={field.placeholder}
            disabled={field.disabled}
          />
        );
    }
  };

  return (
    <div className={cn('p-6 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700', className)}>
      <div className="grid grid-cols-6 gap-4">
        {visibleFields.map((field) => {
          const colSpan = field.width === 'third' ? 2 : field.width === 'half' ? 3 : 6;
          return (
            <div key={field.id} className={`col-span-${colSpan}`} style={{ gridColumn: `span ${colSpan}` }}>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {field.label}
                {field.validation?.some(v => v.type === 'required') && (
                  <span className="text-red-500 ml-1">*</span>
                )}
              </label>
              {renderField(field)}
              {field.helpText && (
                <p className="mt-1 text-xs text-gray-500">{field.helpText}</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// =============================================================================
// MAIN FORM BUILDER
// =============================================================================

interface FormBuilderProps {
  initialTemplate?: FormTemplate;
  onSave?: (template: FormTemplate) => void;
}

export function FormBuilder({ initialTemplate, onSave }: FormBuilderProps) {
  const [name, setName] = useState(initialTemplate?.name || 'Form mới');
  const [fields, setFields] = useState<FormField[]>(initialTemplate?.fields || []);
  const [showPreview, setShowPreview] = useState(false);
  const [showFieldPicker, setShowFieldPicker] = useState(false);

  const addField = useCallback((type: FieldType) => {
    const fieldConfig = fieldTypes.find(f => f.type === type);
    const newField: FormField = {
      id: `field-${Date.now()}`,
      type,
      name: `field_${fields.length + 1}`,
      label: fieldConfig?.label || 'Trường mới',
      width: 'full',
    };
    setFields(prev => [...prev, newField]);
    setShowFieldPicker(false);
  }, [fields.length]);

  const updateField = useCallback((index: number, field: FormField) => {
    setFields(prev => {
      const next = [...prev];
      next[index] = field;
      return next;
    });
  }, []);

  const removeField = useCallback((index: number) => {
    setFields(prev => prev.filter((_, i) => i !== index));
  }, []);

  const handleSave = () => {
    const template: FormTemplate = {
      id: initialTemplate?.id || `template-${Date.now()}`,
      name,
      fields,
      createdAt: initialTemplate?.createdAt || new Date(),
      updatedAt: new Date(),
    };
    onSave?.(template);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Settings className="w-6 h-6 text-purple-600" />
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="text-xl font-bold text-gray-900 dark:text-white bg-transparent border-none focus:ring-0 p-0"
            />
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowPreview(!showPreview)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-xl transition-colors',
                showPreview
                  ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              )}
            >
              <Eye className="w-4 h-4" />
              Preview
            </button>
            <button
              onClick={() => navigator.clipboard.writeText(JSON.stringify(fields, null, 2))}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
            >
              <Copy className="w-4 h-4" />
              Copy JSON
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 transition-colors"
            >
              <Save className="w-4 h-4" />
              Lưu
            </button>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className={cn('grid gap-6', showPreview ? 'grid-cols-2' : 'grid-cols-1')}>
          {/* Editor */}
          <div className="space-y-4">
            {fields.map((field, index) => (
              <FieldEditor
                key={field.id}
                field={field}
                onChange={(f) => updateField(index, f)}
                onDelete={() => removeField(index)}
                allFields={fields}
              />
            ))}

            {/* Add Field Button */}
            <button
              onClick={() => setShowFieldPicker(true)}
              className="w-full flex items-center justify-center gap-2 py-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors"
            >
              <Plus className="w-5 h-5 text-gray-400" />
              <span className="text-gray-500">Thêm trường</span>
            </button>
          </div>

          {/* Preview */}
          {showPreview && (
            <div className="sticky top-24">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Preview</h3>
              <FormPreview fields={fields} />
            </div>
          )}
        </div>
      </div>

      {/* Field Picker Modal */}
      {showFieldPicker && (
        <>
          <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setShowFieldPicker(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="font-semibold text-gray-900 dark:text-white">Chọn loại trường</h3>
                <button onClick={() => setShowFieldPicker(false)} className="p-1 text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-4 grid grid-cols-3 gap-3 max-h-96 overflow-y-auto">
                {fieldTypes.map((fieldType) => (
                  <button
                    key={fieldType.type}
                    onClick={() => addField(fieldType.type)}
                    className="flex flex-col items-center gap-2 p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors"
                  >
                    <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                      {fieldType.icon}
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{fieldType.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default FormBuilder;
