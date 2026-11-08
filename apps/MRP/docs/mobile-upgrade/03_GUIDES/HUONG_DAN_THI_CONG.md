# 📱 HƯỚNG DẪN THI CÔNG - NÂNG CẤP GIAO DIỆN MOBILE
## L-ERP MRP Manufacturing System

---

## 📋 TỔNG QUAN DỰ ÁN

### Mục tiêu
Nâng cấp hệ thống L-ERP MRP để hỗ trợ:
- **PWA (Progressive Web App)** - Cài đặt như app native
- **Quét barcode bằng camera** - Không cần máy quét cầm tay
- **Chế độ Offline** - Hoạt động không cần mạng
- **Giao diện Mobile** - Tối ưu cho shop floor

### Công nghệ sử dụng
| Công nghệ | Version | Mục đích |
|-----------|---------|----------|
| Next.js | 14+ | Framework |
| React | 18+ | UI Library |
| TypeScript | 5+ | Type safety |
| @zxing/library | Latest | Barcode scanning |
| IndexedDB | Native | Offline storage |
| Service Worker | Native | PWA & caching |
| Tailwind CSS | 3+ | Styling |

---

## 🏗️ CẤU TRÚC THƯ MỤC CẦN TẠO

```
lerp-mrp/
├── public/
│   ├── manifest.json          ✅ Đã có
│   ├── sw.js                  ✅ Đã có
│   ├── icons/                 ⚠️ Cần tạo icons
│   │   ├── icon-72x72.png
│   │   ├── icon-96x96.png
│   │   ├── icon-128x128.png
│   │   ├── icon-144x144.png
│   │   ├── icon-152x152.png
│   │   ├── icon-192x192.png
│   │   ├── icon-384x384.png
│   │   └── icon-512x512.png
│   └── sounds/                ⚠️ Cần tạo
│       ├── beep-success.mp3
│       └── beep-error.mp3
│
├── app/
│   ├── offline/               ✅ Đã có
│   │   └── page.tsx
│   └── (mobile)/              🆕 CẦN TẠO MỚI
│       ├── layout.tsx         # Mobile layout
│       └── m/
│           ├── page.tsx       # Mobile home
│           ├── scan/
│           │   └── page.tsx   # Barcode scanner
│           ├── inventory/
│           │   ├── page.tsx   # Inventory lookup
│           │   └── adjust/
│           │       └── page.tsx
│           ├── receiving/
│           │   └── page.tsx
│           ├── picking/
│           │   └── page.tsx
│           ├── workorder/
│           │   └── page.tsx
│           └── settings/
│               └── page.tsx
│
├── components/
│   ├── pwa/                   ✅ Đã có
│   │   ├── index.tsx
│   │   ├── pwa-components.tsx
│   │   ├── meta-tags.tsx
│   │   └── offline-page.tsx
│   └── mobile/                🆕 CẦN TẠO MỚI
│       ├── mobile-shell.tsx
│       ├── mobile-header.tsx
│       ├── mobile-nav.tsx
│       ├── barcode-scanner.tsx
│       ├── scan-result-card.tsx
│       ├── quantity-input.tsx
│       ├── location-picker.tsx
│       └── offline-indicator.tsx
│
├── lib/
│   ├── pwa/                   ✅ Đã có
│   │   ├── pwa-config.ts
│   │   ├── pwa-provider.tsx
│   │   └── pwa-utils.ts
│   └── mobile/                🆕 CẦN TẠO MỚI
│       ├── scanner.ts
│       ├── barcode-parser.ts
│       ├── qr-generator.ts
│       ├── offline-store.ts
│       ├── sync-manager.ts
│       └── haptics.ts
│
└── app/api/mobile/            🆕 CẦN TẠO MỚI
    ├── scan/route.ts
    ├── inventory/
    │   ├── adjust/route.ts
    │   └── transfer/route.ts
    ├── receiving/route.ts
    ├── picking/route.ts
    └── offline/
        └── sync/route.ts
```

---

## 📝 CHI TIẾT CÁC MODULE

### Module 1: PWA Setup (✅ ĐÃ CÓ - Cần verify)

**Files cần kiểm tra:**
- `public/manifest.json` - App manifest
- `public/sw.js` - Service worker
- `components/pwa/*` - PWA components
- `lib/pwa/*` - PWA utilities

**Kiểm tra hoạt động:**
```bash
# Chạy dev server
npm run dev

# Mở Chrome DevTools > Application > Manifest
# Kiểm tra Service Worker đã đăng ký
```

### Module 2: Barcode Scanner (🆕 CẦN TẠO)

**Thư viện cần cài:**
```bash
npm install @zxing/library @zxing/browser
```

**Component chính:** `components/mobile/barcode-scanner.tsx`

```typescript
// Xem chi tiết trong CODER_PACK_PHASE12.md
// Section: BARCODE SCANNER COMPONENT

// Các barcode format cần hỗ trợ:
// - CODE128 (phổ biến nhất)
// - CODE39 (industrial)
// - QR Code
// - EAN-13/UPC-A (retail)
```

**Tính năng yêu cầu:**
- [x] Camera access (rear camera ưu tiên)
- [x] Real-time scanning
- [x] Haptic feedback khi scan thành công
- [x] Audio beep
- [x] Manual entry fallback
- [x] Torch/flashlight toggle

### Module 3: Mobile Pages (🆕 CẦN TẠO)

**Layout mobile:** `app/(mobile)/layout.tsx`

```typescript
// Key requirements:
// - Touch-friendly (min 44x44px touch targets)
// - Bottom navigation
// - Pull-to-refresh
// - Swipe gestures
// - Large fonts (16px minimum)
```

**Các trang cần tạo:**

| Trang | Path | Chức năng |
|-------|------|-----------|
| Home | `/m` | Quick actions, dashboard |
| Scan | `/m/scan` | Universal scanner |
| Inventory | `/m/inventory` | Part lookup |
| Adjust | `/m/inventory/adjust` | Điều chỉnh tồn kho |
| Receiving | `/m/receiving` | Nhận hàng PO |
| Picking | `/m/picking` | Xuất hàng |
| Work Orders | `/m/workorder` | Quản lý lệnh SX |
| Settings | `/m/settings` | Cài đặt mobile |

### Module 4: Offline Support (🆕 CẦN TẠO)

**IndexedDB Store:** `lib/mobile/offline-store.ts`

```typescript
// Cần lưu trữ offline:
// - Parts master data
// - Locations master data
// - Pending operations queue
// - Recent scans history
```

**Sync Manager:** `lib/mobile/sync-manager.ts`

```typescript
// Background sync khi có mạng:
// - Retry failed operations
// - Merge conflicts
// - Update local cache
```

---

## 🔧 HƯỚNG DẪN CÀI ĐẶT

### Bước 1: Cài đặt dependencies

```bash
cd lerp-mrp

# Core dependencies
npm install @zxing/library @zxing/browser

# Optional: Better QR generation
npm install qrcode

# Optional: Label printing
npm install jspdf
```

### Bước 2: Tạo Mobile Layout

```bash
# Tạo thư mục
mkdir -p app/\(mobile\)/m/{scan,inventory/adjust,receiving,picking,workorder,settings}
mkdir -p components/mobile
mkdir -p lib/mobile
mkdir -p app/api/mobile/{scan,inventory/adjust,inventory/transfer,receiving,picking,offline/sync}
```

### Bước 3: Copy code từ CODER_PACK

1. Mở file `01_CODER_PACK/CODER_PACK_PHASE12.md`
2. Copy từng section code vào file tương ứng
3. Adjust imports theo cấu trúc project

### Bước 4: Database Migration

```bash
# Thêm models mới vào schema.prisma (xem CODER_PACK)
npx prisma migrate dev --name add_mobile_models
```

### Bước 5: Test

```bash
# Chạy development
npm run dev

# Mở trên điện thoại (cùng mạng WiFi)
# http://<IP máy tính>:3000/m

# Hoặc dùng ngrok để test từ xa
npx ngrok http 3000
```

---

## 📱 UI/UX GUIDELINES

### Touch Targets
```css
/* Minimum touch target size */
.touch-target {
  min-height: 44px;
  min-width: 44px;
  padding: 12px;
}
```

### Typography
```css
/* Mobile-first typography */
body {
  font-size: 16px;  /* Minimum for mobile */
  line-height: 1.5;
}

h1 { font-size: 24px; }
h2 { font-size: 20px; }
h3 { font-size: 18px; }
```

### Colors - Dark Mode Support
```css
/* Use CSS variables for theming */
:root {
  --primary: #3B82F6;
  --success: #10B981;
  --warning: #F59E0B;
  --error: #EF4444;
}
```

### Bottom Navigation
```
┌─────────────────────────────────────────────────────────┐
│                      CONTENT AREA                        │
│                                                          │
│                                                          │
│                                                          │
├──────────┬──────────┬──────────┬──────────┬─────────────┤
│   🏠     │   📦     │   🔍     │   📋     │    ⚙️      │
│  Home    │ Inventory│   Scan   │   Tasks  │  Settings   │
└──────────┴──────────┴──────────┴──────────┴─────────────┘
```

---

## 🔐 SECURITY CONSIDERATIONS

### Camera Permissions
```typescript
// Luôn request permission trước khi access camera
const stream = await navigator.mediaDevices.getUserMedia({
  video: { facingMode: 'environment' }
});
```

### Offline Data
```typescript
// Encrypt sensitive data trong IndexedDB
// Không lưu credentials offline
// Auto-clear cache sau X ngày
```

### API Security
```typescript
// Validate user session cho mọi mobile API
// Rate limiting cho scan operations
// Audit log cho inventory changes
```

---

## 📊 PERFORMANCE TARGETS

| Metric | Target | Đo lường |
|--------|--------|----------|
| First Contentful Paint | < 1.5s | Lighthouse |
| Time to Interactive | < 3s | Lighthouse |
| Scan Response | < 500ms | Manual test |
| Offline Load | < 2s | Manual test |
| Bundle Size (mobile) | < 200KB | Webpack analyzer |

---

## 🧪 TESTING CHECKLIST

### PWA Tests
- [ ] Manifest loads correctly
- [ ] Service worker registers
- [ ] App installable (Add to Home Screen)
- [ ] Offline fallback page works
- [ ] Cache strategy works

### Scanner Tests
- [ ] Camera permission prompt
- [ ] Rear camera selected by default
- [ ] CODE128 barcode scans
- [ ] QR code scans
- [ ] Haptic feedback works
- [ ] Audio feedback works
- [ ] Torch toggle works
- [ ] Manual entry fallback

### Mobile UI Tests
- [ ] Touch targets 44px+
- [ ] Bottom nav accessible
- [ ] Pull-to-refresh works
- [ ] Landscape mode supported
- [ ] Loading states shown
- [ ] Error states handled

### Offline Tests
- [ ] Data cached on first load
- [ ] Operations queue offline
- [ ] Sync resumes when online
- [ ] Conflict handling works

---

## 📞 HỖ TRỢ

### Liên hệ
- Technical Lead: [Điền thông tin]
- Project Manager: [Điền thông tin]

### Tài liệu tham khảo
- CODER_PACK_PHASE12.md - Full technical specification
- Next.js PWA Guide: https://nextjs.org/docs/app/building-your-application/configuring/progressive-web-apps
- ZXing Library: https://github.com/zxing-js/library

---

**Version:** 1.0  
**Cập nhật:** 01/01/2026  
**Trạng thái:** Ready for implementation
