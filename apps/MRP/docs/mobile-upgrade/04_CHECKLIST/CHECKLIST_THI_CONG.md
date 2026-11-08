# ✅ CHECKLIST THI CÔNG - MOBILE UPGRADE
## L-ERP MRP Manufacturing System

---

## 📋 PHASE 1: CHUẨN BỊ (1-2 ngày)

### Environment Setup
- [ ] Node.js 18+ đã cài đặt
- [ ] npm/yarn đã cài đặt
- [ ] Git đã cài đặt
- [ ] VS Code + extensions (ESLint, Prettier, Tailwind)
- [ ] Chrome DevTools (PWA testing)
- [ ] Điện thoại test (Android/iOS)

### Project Setup
- [ ] Clone repository về máy
- [ ] Chạy `npm install` thành công
- [ ] Chạy `npm run dev` không lỗi
- [ ] Access được http://localhost:3000
- [ ] Database đã kết nối (Prisma)

### Dependencies
- [ ] `npm install @zxing/library @zxing/browser`
- [ ] `npm install qrcode` (optional)
- [ ] `npm install jspdf` (optional - labels)

---

## 📋 PHASE 2: PWA VERIFICATION (1 ngày)

### Manifest Check
- [ ] `public/manifest.json` tồn tại
- [ ] Icons được reference đúng
- [ ] name, short_name đã set
- [ ] start_url = "/"
- [ ] display = "standalone"
- [ ] theme_color đã set

### Service Worker Check
- [ ] `public/sw.js` tồn tại
- [ ] Caching strategy đúng
- [ ] Offline fallback configured

### Test PWA
- [ ] Chrome DevTools > Application > Manifest ✓
- [ ] Service Worker registered ✓
- [ ] "Add to Home Screen" hiển thị
- [ ] Cài đặt app thành công trên điện thoại

### Create Icons (nếu chưa có)
- [ ] icon-72x72.png
- [ ] icon-96x96.png
- [ ] icon-128x128.png
- [ ] icon-144x144.png
- [ ] icon-152x152.png
- [ ] icon-192x192.png
- [ ] icon-384x384.png
- [ ] icon-512x512.png

---

## 📋 PHASE 3: MOBILE LAYOUT (2-3 ngày)

### Create Directory Structure
- [ ] `app/(mobile)/layout.tsx`
- [ ] `app/(mobile)/m/page.tsx`
- [ ] `components/mobile/` folder

### Mobile Shell Component
- [ ] `components/mobile/mobile-shell.tsx`
- [ ] Safe area padding (notch support)
- [ ] Viewport meta correct

### Mobile Header
- [ ] `components/mobile/mobile-header.tsx`
- [ ] Logo/title
- [ ] Status indicators
- [ ] Action buttons

### Bottom Navigation
- [ ] `components/mobile/mobile-nav.tsx`
- [ ] 5 tabs: Home, Inventory, Scan, Tasks, Settings
- [ ] Active state styling
- [ ] Icon + label
- [ ] Fixed position bottom

### Test Mobile Layout
- [ ] Layout renders correctly
- [ ] Navigation works
- [ ] Responsive on different screen sizes
- [ ] Safe area respected (iPhone notch)

---

## 📋 PHASE 4: BARCODE SCANNER (3-4 ngày)

### Scanner Component
- [ ] `components/mobile/barcode-scanner.tsx`
- [ ] Camera permission request
- [ ] Rear camera by default
- [ ] Scanning frame overlay
- [ ] Start/stop controls

### Scanner Library
- [ ] `lib/mobile/scanner.ts`
- [ ] Initialize ZXing reader
- [ ] Support CODE128
- [ ] Support CODE39
- [ ] Support QR Code
- [ ] Support EAN-13

### Barcode Parser
- [ ] `lib/mobile/barcode-parser.ts`
- [ ] Parse part numbers
- [ ] Parse location codes
- [ ] Parse work order numbers
- [ ] Parse PO numbers

### Feedback Systems
- [ ] `lib/mobile/haptics.ts`
- [ ] Vibration on success
- [ ] Different vibration for error
- [ ] Audio beep success
- [ ] Audio beep error

### Scanner UI
- [ ] `components/mobile/scan-result-card.tsx`
- [ ] Show scanned data
- [ ] Show resolved entity
- [ ] Quick action buttons
- [ ] Dismiss/rescan option

### Test Scanner
- [ ] Camera opens without error
- [ ] CODE128 barcode scans
- [ ] QR code scans
- [ ] Haptic works
- [ ] Audio works
- [ ] Torch/flashlight toggles
- [ ] Manual entry works

---

## 📋 PHASE 5: MOBILE PAGES (4-5 ngày)

### Home Page
- [ ] `app/(mobile)/m/page.tsx`
- [ ] Quick scan button (large, centered)
- [ ] Recent scans list
- [ ] Quick stats (pending tasks)
- [ ] User info

### Scan Page
- [ ] `app/(mobile)/m/scan/page.tsx`
- [ ] Full-screen scanner
- [ ] Result modal
- [ ] Navigation to relevant entity

### Inventory Page
- [ ] `app/(mobile)/m/inventory/page.tsx`
- [ ] Search by part number
- [ ] Search by description
- [ ] Recent parts list
- [ ] Part detail view

### Inventory Adjust
- [ ] `app/(mobile)/m/inventory/adjust/page.tsx`
- [ ] Part selection (scan or search)
- [ ] Location selection
- [ ] Quantity input (touch-friendly)
- [ ] Reason selection
- [ ] Confirm button
- [ ] Success/error feedback

### Receiving Page
- [ ] `app/(mobile)/m/receiving/page.tsx`
- [ ] Open PO list
- [ ] PO detail view
- [ ] Line items to receive
- [ ] Quantity input
- [ ] Submit receiving

### Picking Page
- [ ] `app/(mobile)/m/picking/page.tsx`
- [ ] Open pick lists
- [ ] Pick detail view
- [ ] Items to pick
- [ ] Confirm pick

### Work Orders Page
- [ ] `app/(mobile)/m/workorder/page.tsx`
- [ ] Active WO list
- [ ] WO detail view
- [ ] Start/stop operations
- [ ] Record production

### Settings Page
- [ ] `app/(mobile)/m/settings/page.tsx`
- [ ] Scanner settings
- [ ] Sound on/off
- [ ] Vibration on/off
- [ ] Clear cache
- [ ] Logout

---

## 📋 PHASE 6: API ENDPOINTS (2-3 ngày)

### Scan API
- [ ] `app/api/mobile/scan/route.ts`
- [ ] POST: Process scanned barcode
- [ ] Resolve to entity type
- [ ] Return entity data
- [ ] Log scan history

### Inventory APIs
- [ ] `app/api/mobile/inventory/adjust/route.ts`
- [ ] POST: Submit adjustment
- [ ] Validate permissions
- [ ] Create inventory transaction

- [ ] `app/api/mobile/inventory/transfer/route.ts`
- [ ] POST: Submit transfer
- [ ] Validate locations
- [ ] Create transfer record

### Receiving API
- [ ] `app/api/mobile/receiving/route.ts`
- [ ] GET: List pending POs
- [ ] POST: Submit receipt
- [ ] Update PO status

### Picking API
- [ ] `app/api/mobile/picking/route.ts`
- [ ] GET: List pending picks
- [ ] POST: Confirm pick
- [ ] Update allocation

### Work Order API
- [ ] `app/api/mobile/workorder/route.ts`
- [ ] GET: List active WOs
- [ ] POST: Start operation
- [ ] POST: Complete operation
- [ ] POST: Record production

---

## 📋 PHASE 7: OFFLINE SUPPORT (3-4 ngày)

### IndexedDB Store
- [ ] `lib/mobile/offline-store.ts`
- [ ] Initialize database
- [ ] Parts cache table
- [ ] Locations cache table
- [ ] Operations queue table

### Cache Management
- [ ] Download master data on first load
- [ ] Periodic refresh
- [ ] Clear old data
- [ ] Size management

### Operation Queue
- [ ] Queue operations when offline
- [ ] Store with timestamp
- [ ] Retry counter

### Sync Manager
- [ ] `lib/mobile/sync-manager.ts`
- [ ] Detect online/offline
- [ ] Process queue when online
- [ ] Handle conflicts
- [ ] Update UI on sync

### Offline Indicator
- [ ] `components/mobile/offline-indicator.tsx`
- [ ] Show when offline
- [ ] Show sync status
- [ ] Show queue count

### Test Offline
- [ ] Airplane mode - app loads
- [ ] Can search cached parts
- [ ] Operations queued
- [ ] Back online - sync happens
- [ ] Queue cleared after sync

---

## 📋 PHASE 8: DATABASE MIGRATION (1 ngày)

### Schema Updates
- [ ] Add BarcodeDefinition model
- [ ] Add ScanLog model
- [ ] Add OfflineOperation model
- [ ] Add MobileDevice model
- [ ] Add indexes

### Migration
- [ ] `npx prisma migrate dev --name add_mobile_models`
- [ ] Verify tables created
- [ ] Test queries

---

## 📋 PHASE 9: TESTING (2-3 ngày)

### Unit Tests
- [ ] Scanner utilities
- [ ] Barcode parser
- [ ] Offline store
- [ ] Sync manager

### Integration Tests
- [ ] Scan → API → Database
- [ ] Offline → Queue → Sync
- [ ] Mobile pages render

### Device Testing
- [ ] Android Chrome
- [ ] Android Samsung Browser
- [ ] iOS Safari
- [ ] Tablet (iPad)

### Performance
- [ ] First load < 3s
- [ ] Scan response < 500ms
- [ ] Smooth scrolling
- [ ] No memory leaks

---

## 📋 PHASE 10: DEPLOYMENT (1-2 ngày)

### Build
- [ ] `npm run build` success
- [ ] No TypeScript errors
- [ ] No ESLint errors
- [ ] Bundle size acceptable

### Deploy
- [ ] Deploy to staging
- [ ] Test all features
- [ ] Performance check
- [ ] Deploy to production

### Documentation
- [ ] Update user guide
- [ ] Update API docs
- [ ] Training materials

---

## 📊 TỔNG KẾT

| Phase | Thời gian | Trạng thái |
|-------|-----------|------------|
| Phase 1: Chuẩn bị | 1-2 ngày | ⬜ |
| Phase 2: PWA | 1 ngày | ⬜ |
| Phase 3: Mobile Layout | 2-3 ngày | ⬜ |
| Phase 4: Scanner | 3-4 ngày | ⬜ |
| Phase 5: Mobile Pages | 4-5 ngày | ⬜ |
| Phase 6: APIs | 2-3 ngày | ⬜ |
| Phase 7: Offline | 3-4 ngày | ⬜ |
| Phase 8: Database | 1 ngày | ⬜ |
| Phase 9: Testing | 2-3 ngày | ⬜ |
| Phase 10: Deployment | 1-2 ngày | ⬜ |
| **TỔNG** | **20-27 ngày** | |

---

## 📝 GHI CHÚ

### Ưu tiên cao (P0)
1. PWA installable
2. Barcode scanner hoạt động
3. Inventory adjustment
4. Basic offline support

### Ưu tiên trung (P1)
1. Receiving
2. Picking
3. Work orders
4. Full offline sync

### Ưu tiên thấp (P2)
1. Label printing
2. Advanced analytics
3. Device management

---

**Người thi công:** ________________  
**Ngày bắt đầu:** ________________  
**Ngày dự kiến hoàn thành:** ________________  
**Người kiểm tra:** ________________
