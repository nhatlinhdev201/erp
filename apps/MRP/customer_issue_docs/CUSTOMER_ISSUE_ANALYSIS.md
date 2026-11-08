# 📋 BÁO CÁO PHÂN TÍCH VÀ KẾ HOẠCH XỬ LÝ
## Phản hồi yêu cầu khách hàng - 2026-01-09

---

## 🎯 TÓM TẮT VẤN ĐỀ KHÁCH HÀNG BÁO CÁO

| Issue | Mô tả | Xác nhận |
|-------|-------|----------|
| Issue 1 | Không mở được cửa sổ nhập dữ liệu | ✅ Confirmed |
| Issue 2 | Nhập xong không lưu được | ✅ Confirmed |
| Issue 3 | Trường hiển thị nhưng không có trong form | ✅ Confirmed |

---

## 🔍 KẾT QUẢ ĐIỀU TRA CHI TIẾT

### Issue 1: Không mở được cửa sổ nhập dữ liệu

**Root Cause:** Nút "Add Part" không có xử lý onClick

```tsx
// File: components/pages/parts-master.tsx (Line 600-604)
// HIỆN TẠI - KHÔNG CÓ onClick:
<button className="px-4 py-2 text-sm font-medium text-white bg-primary-600...">
  <Plus className="h-4 w-4" />
  Add Part
</button>

// CẦN SỬA THÀNH:
<button 
  onClick={() => setShowCreateDialog(true)}
  className="px-4 py-2 text-sm font-medium text-white bg-primary-600..."
>
  <Plus className="h-4 w-4" />
  Add Part
</button>
```

**Thêm vào đó:** Không có component Form Dialog cho Parts module.

### Issue 2: Nhập xong không lưu được

**Root Cause:** 
1. Không có Form Dialog → không có form để submit
2. Nhiều module đang dùng MOCK DATA thay vì gọi API thực

```tsx
// File: components/pages/parts-master.tsx (Line 44-150)
// HIỆN TẠI - MOCK DATA:
const partsData = [
  {
    id: '1',
    partNumber: 'PRT-MOT-001',
    name: 'Motor U15 II KV100',
    // ... mock data
  },
  // ...
];

// CẦN SỬA: Gọi API thực
const { data: partsData, isLoading } = useSWR('/api/v2/parts', fetcher);
```

### Issue 3: Trường hiển thị nhưng không có trong form

**Root Cause:** Không có Form component → không có field nào để so sánh.

---

## 📊 DANH SÁCH MODULES CẦN KIỂM TRA

| Module | Page | Form Dialog | API Connected | Status |
|--------|------|-------------|---------------|--------|
| **Parts** | ✅ | ❌ MISSING | ❌ Mock data | 🔴 Cần fix |
| Inventory | ✅ | ❓ Check | ❓ Check | 🟡 Cần verify |
| Sales | ✅ | ❓ Check | ❓ Check | 🟡 Cần verify |
| Production | ✅ | ❓ Check | ❓ Check | 🟡 Cần verify |
| BOM | ✅ | ❓ Check | ❓ Check | 🟡 Cần verify |

---

## ✅ KẾ HOẠCH FIX THEO YÊU CẦU KHÁCH HÀNG

### Ưu tiên theo yêu cầu:
1. ✅ Mở được cửa sổ nhập dữ liệu
2. ✅ Lưu được dữ liệu thành công
3. ✅ Export dữ liệu để verify

### Bắt đầu với: **Parts Module** (theo đề xuất khách hàng)

---

## 🔧 CHI TIẾT FIX - PARTS MODULE

### Step 1: Tạo Part Form Dialog Component

**File mới:** `components/parts/part-form-dialog.tsx`

```tsx
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

// Validation schema
const partFormSchema = z.object({
  partNumber: z.string().min(1, 'Mã part là bắt buộc'),
  name: z.string().min(1, 'Tên part là bắt buộc'),
  description: z.string().optional(),
  category: z.string().min(1, 'Danh mục là bắt buộc'),
  unit: z.string().default('EA'),
  unitCost: z.number().min(0).default(0),
  // Thêm các fields khác...
});

type PartFormData = z.infer<typeof partFormSchema>;

interface PartFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  part?: PartFormData | null; // null = create, có data = edit
  onSuccess?: () => void;
}

export function PartFormDialog({ 
  open, 
  onOpenChange, 
  part, 
  onSuccess 
}: PartFormDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const isEdit = !!part;

  const form = useForm<PartFormData>({
    resolver: zodResolver(partFormSchema),
    defaultValues: part || {
      partNumber: '',
      name: '',
      description: '',
      category: '',
      unit: 'EA',
      unitCost: 0,
    },
  });

  const onSubmit = async (data: PartFormData) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/v2/parts', {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Có lỗi xảy ra');
      }

      toast.success(isEdit ? 'Cập nhật thành công!' : 'Tạo mới thành công!');
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Có lỗi xảy ra');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? 'Chỉnh sửa Part' : 'Tạo Part mới'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Part Number */}
            <div>
              <Label htmlFor="partNumber">Mã Part *</Label>
              <Input 
                id="partNumber"
                {...form.register('partNumber')}
                placeholder="VD: PRT-001"
              />
              {form.formState.errors.partNumber && (
                <p className="text-red-500 text-sm mt-1">
                  {form.formState.errors.partNumber.message}
                </p>
              )}
            </div>
            
            {/* Name */}
            <div>
              <Label htmlFor="name">Tên Part *</Label>
              <Input 
                id="name"
                {...form.register('name')}
                placeholder="Tên part"
              />
              {form.formState.errors.name && (
                <p className="text-red-500 text-sm mt-1">
                  {form.formState.errors.name.message}
                </p>
              )}
            </div>

            {/* Category */}
            <div>
              <Label htmlFor="category">Danh mục *</Label>
              <Input 
                id="category"
                {...form.register('category')}
                placeholder="VD: Electronics"
              />
            </div>

            {/* Unit */}
            <div>
              <Label htmlFor="unit">Đơn vị</Label>
              <Input 
                id="unit"
                {...form.register('unit')}
                placeholder="EA, PCS, KG..."
              />
            </div>

            {/* Unit Cost */}
            <div>
              <Label htmlFor="unitCost">Đơn giá</Label>
              <Input 
                id="unitCost"
                type="number"
                {...form.register('unitCost', { valueAsNumber: true })}
                placeholder="0"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">Mô tả</Label>
            <Input 
              id="description"
              {...form.register('description')}
              placeholder="Mô tả chi tiết..."
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Đang xử lý...' : (isEdit ? 'Cập nhật' : 'Tạo mới')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

### Step 2: Cập nhật Parts Master Page

**File:** `components/pages/parts-master.tsx`

**Thay đổi cần làm:**

```tsx
// 1. Import form dialog
import { PartFormDialog } from '@/components/parts/part-form-dialog';

// 2. Thêm state
const [showCreateDialog, setShowCreateDialog] = useState(false);
const [editingPart, setEditingPart] = useState<Part | null>(null);

// 3. Thay mock data bằng API call
import useSWR from 'swr';
const { data: partsData, isLoading, mutate } = useSWR('/api/v2/parts', fetcher);

// 4. Update Add button
<button 
  onClick={() => setShowCreateDialog(true)}
  className="px-4 py-2 text-sm font-medium text-white bg-primary-600..."
>
  <Plus className="h-4 w-4" />
  Add Part
</button>

// 5. Add Dialog component
<PartFormDialog
  open={showCreateDialog}
  onOpenChange={setShowCreateDialog}
  onSuccess={() => mutate()}
/>
```

### Step 3: Verify API Endpoint

**Kiểm tra:** `app/api/v2/parts/route.ts`

```bash
# Verify endpoints exist and work:
# GET /api/v2/parts - List parts
# POST /api/v2/parts - Create part
# PUT /api/v2/parts/[id] - Update part
# DELETE /api/v2/parts/[id] - Delete part
```

### Step 4: Add Export Function

```tsx
// Thêm vào parts-master.tsx
const handleExport = async () => {
  try {
    const response = await fetch('/api/export?type=parts');
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `parts-${new Date().toISOString().split('T')[0]}.xlsx`;
    a.click();
    toast.success('Export thành công!');
  } catch (error) {
    toast.error('Export thất bại');
  }
};
```

---

## 📅 TIMELINE ĐỀ XUẤT

### Ngày 1: Parts Module
- [ ] Tạo PartFormDialog component
- [ ] Connect với API thực
- [ ] Test Create/Edit/Save
- [ ] Test Export
- [ ] Verify với khách hàng

### Ngày 2-3: Các module khác
- [ ] Inventory Module
- [ ] Sales Module
- [ ] Production Module
- [ ] BOM Module

### Ngày 4: Testing & Verification
- [ ] End-to-end testing
- [ ] Verify với khách hàng
- [ ] Fix issues nếu có

---

## ✅ CHECKLIST VERIFY SAU KHI FIX

Cho mỗi module, verify:

- [ ] Click "Add" button → Form dialog mở
- [ ] Nhập data → Validation hiển thị đúng
- [ ] Submit → Data lưu thành công
- [ ] Refresh page → Data vẫn còn
- [ ] Export → File download với data đúng
- [ ] Edit → Load data đúng, save đúng
- [ ] Delete → Xóa thành công

---

## 📞 LIÊN HỆ

Sau khi fix xong từng chức năng, sẽ báo để cùng verify:
1. Cung cấp link/environment để test
2. Hướng dẫn test step-by-step
3. Collect feedback để fix tiếp

---

*Báo cáo phân tích - 2026-01-09*
*L-ERP MRP Customer Issue Response*
