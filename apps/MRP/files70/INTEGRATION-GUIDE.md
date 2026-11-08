# ═══════════════════════════════════════════════════════════════════════════════
#                    L-ERP MRP UI REDESIGN - INTEGRATION GUIDE
#                    "Industrial Precision" Theme v2.0
# ═══════════════════════════════════════════════════════════════════════════════

---

## 🔒 NGUYÊN TẮC VÀNG: EXCEL-FIRST

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║   ⚠️ CRITICAL: BẢO TOÀN TẤT CẢ TABLES HIỆN TẠI                              ║
║                                                                              ║
║   Lý do: Người dùng MRP chủ yếu chuyển từ Excel sang                        ║
║   → Giao diện càng giống Excel càng dễ chấp nhận                            ║
║   → Tables hiện tại đã được thiết kế Excel-like chuẩn mực                   ║
║                                                                              ║
║   QUY TẮC:                                                                   ║
║   • KHÔNG thay đổi columns (số lượng, thứ tự, tên)                          ║
║   • KHÔNG thay đổi data formatting                                          ║
║   • KHÔNG xóa sort/filter functionality                                     ║
║   • CHỈ thay đổi colors, fonts, spacing                                     ║
║                                                                              ║
║   Xem chi tiết: TABLE-PRESERVATION-RULES.md                                 ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

---

## 📦 DELIVERABLES

| File | Mô tả | Cách dùng |
|------|-------|-----------|
| `design-system.css` | CSS Variables + Utility Classes | Import vào globals.css |
| `tailwind.config.ts` | Tailwind theme configuration | Replace file hiện tại |
| `dashboard-preview.html` | Interactive mockup | Mở trong browser để preview |
| `TABLE-PRESERVATION-RULES.md` | 🔒 Quy tắc bảo toàn tables | **ĐỌC TRƯỚC KHI SỬA TABLE** |

---

## 🚀 HƯỚNG DẪN TÍCH HỢP

### Bước 1: Cài đặt Fonts

Thêm vào `src/app/layout.tsx`:

```tsx
import { JetBrains_Mono, IBM_Plex_Sans, IBM_Plex_Mono } from 'next/font/google'

const jetbrainsMono = JetBrains_Mono({ 
  subsets: ['latin'],
  variable: '--font-display',
})

const ibmPlexSans = IBM_Plex_Sans({ 
  weight: ['400', '500', '600'],
  subsets: ['latin'],
  variable: '--font-body',
})

const ibmPlexMono = IBM_Plex_Mono({ 
  weight: ['400', '500', '600'],
  subsets: ['latin'],
  variable: '--font-mono',
})

// Trong return:
<html className={`${jetbrainsMono.variable} ${ibmPlexSans.variable} ${ibmPlexMono.variable}`}>
```

### Bước 2: Replace Tailwind Config

1. Backup `tailwind.config.ts` hiện tại
2. Replace với file `tailwind.config.ts` mới
3. Chạy `npm run dev` để test

### Bước 3: Update globals.css

Thêm vào đầu file `src/app/globals.css`:

```css
@import url('./design-system.css');

/* Override default backgrounds */
body {
  background-color: #1A1D23;
  color: #F4F4F5;
}
```

### Bước 4: Update Components

#### Buttons - Trước:
```tsx
<Button variant="default">Add</Button>
```

#### Buttons - Sau:
```tsx
<button className="btn btn-primary">Thêm mới</button>
// hoặc với shadcn:
<Button className="btn btn-primary h-btn">Thêm mới</Button>
```

#### Tables - Áp dụng class mới:
```tsx
<table className="w-full border-collapse text-base">
  <thead>
    <tr>
      <th className="bg-gunmetal text-sm uppercase tracking-wide text-mrp-text-muted p-2 border border-mrp-border text-left sticky top-0">
        Mã
      </th>
    </tr>
  </thead>
  <tbody>
    <tr className="hover:bg-slate/50">
      <td className="p-2 border border-mrp-border font-mono">WO-2024-001</td>
    </tr>
  </tbody>
</table>
```

---

## 🎨 DESIGN TOKENS QUICK REFERENCE

### Colors
```
Background:     bg-steel-dark     (#1A1D23)
Cards:          bg-gunmetal       (#2D3139)
Borders:        border-mrp-border (#3D4450)
Focus:          border-info-cyan  (#06B6D4)

Status:
  Active:       text-production-green    (#22C55E)
  Warning:      text-alert-amber         (#F59E0B)
  Error:        text-urgent-red          (#EF4444)
  Info:         text-info-cyan           (#06B6D4)
```

### Typography
```
Headings:       font-display (JetBrains Mono)
Body:           font-body (IBM Plex Sans)
Data/Numbers:   font-mono (IBM Plex Mono)

Sizes:
  xs: 11px     (labels, badges)
  sm: 12px     (table headers, small text)
  base: 13px   (body text, table data)
  md: 14px     (section titles)
  lg: 16px     (rare, emphasis)
  xl: 20px     (page titles only)
```

### Spacing
```
Tight:          p-2 (8px)
Normal:         p-3 (12px)
Comfortable:    p-4 (16px)

Row height:     h-row (36px)
Button height:  h-btn (32px)
Input height:   h-input (32px)
```

---

## 📐 COMPONENT MIGRATION MAP

| Old Component | New Classes | Notes |
|---------------|-------------|-------|
| `<Button>` | `.btn .btn-primary` | Sharp edges, compact |
| `<Input>` | `.input` | No border-radius |
| `<Card>` | `.card` | Semi-transparent bg |
| `<Badge>` | `.badge .badge-success` | Uppercase, tiny |
| `<Table>` | Custom classes | Excel-like styling |

---

## 📋 CHECKLIST TRIỂN KHAI

### Phase 0: Đọc quy tắc (QUAN TRỌNG)
- [ ] Đọc kỹ TABLE-PRESERVATION-RULES.md
- [ ] Hiểu nguyên tắc Excel-First
- [ ] Screenshot tất cả tables hiện tại

### Phase 1: Foundation (1-2 ngày)
- [ ] Install fonts
- [ ] Replace tailwind.config.ts
- [ ] Update globals.css
- [ ] Test build passes

### Phase 2: Layout (2-3 ngày)
- [ ] Update Header component
- [ ] Update Sidebar component
- [ ] Update main layout wrapper
- [ ] Test responsive behavior

### Phase 3: Components (3-5 ngày)
- [ ] Update Button styles
- [ ] Update Input styles
- [ ] Update Table styles
- [ ] Update Card styles
- [ ] Update Badge/Status styles

### Phase 4: Pages (5-7 ngày)
- [ ] Dashboard
- [ ] Parts Management
- [ ] BOM
- [ ] Work Orders
- [ ] Purchase Orders
- [ ] Inventory
- [ ] Quality/QC
- [ ] MRP

### Phase 5: Polish (2-3 ngày)
- [ ] Review all pages
- [ ] Fix edge cases
- [ ] Performance check
- [ ] Cross-browser test

---

## ⚠️ LƯU Ý QUAN TRỌNG

1. **KHÔNG dùng rounded corners** - Theme này là sharp edges
2. **KHÔNG dùng shadows nhiều** - Flat design, dùng borders
3. **KHÔNG dùng font > 20px** - Compact, data-dense
4. **SỐ LIỆU phải dùng font-mono** - Để căn chỉnh đẹp
5. **Status colors CHỈ cho status** - Không decoration

---

## 🔗 FILES ĐI KÈM

```
lerp-mrp-redesign/
├── design-system.css            # Full CSS với tất cả utilities
├── tailwind.config.ts           # Tailwind configuration
├── dashboard-preview.html       # Interactive preview
├── TABLE-PRESERVATION-RULES.md  # 🔒 Quy tắc bảo toàn tables
└── INTEGRATION-GUIDE.md         # File này
```

---

# ═══════════════════════════════════════════════════════════════════════════════
#                              END OF GUIDE
# ═══════════════════════════════════════════════════════════════════════════════
