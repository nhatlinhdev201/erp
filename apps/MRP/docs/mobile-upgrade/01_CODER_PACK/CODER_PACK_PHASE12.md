# ═══════════════════════════════════════════════════════════════════════════════
#                              🔧 CODER PACK
#                    RTR AI-First MRP System - Phase 12
#                      MOBILE & BARCODE INTEGRATION
#            PWA, Camera Scanning, Shop Floor Mobile, Offline Support
#                           Vibecode Kit v4.0
# ═══════════════════════════════════════════════════════════════════════════════
#
#  📋 HƯỚNG DẪN:
#  1. Đảm bảo Phase 1-11 đã hoàn thành và chạy được
#  2. Copy TOÀN BỘ file này → Paste vào Claude Code / Cursor
#  3. Cho biết path của project
#  4. Ngồi chờ code được thêm vào
#
#  ⚠️ QUAN TRỌNG: 
#  - Phase 12 enables SHOP FLOOR mobility
#  - Camera-based barcode scanning (no hardware needed)
#  - PWA for install on any device
#  - Offline support for warehouse operations
#
# ═══════════════════════════════════════════════════════════════════════════════

---

## 🎭 VAI TRÒ

Bạn là THỢ XÂY trong hệ thống Vibecode Kit v4.0.

Đây là Phase 12 - Mobile & Barcode, enabling shop floor mobility.

### QUY TẮC TUYỆT ĐỐI:
1. KHÔNG thay đổi business logic các Phase trước
2. Mobile views phải responsive và touch-friendly
3. Barcode scanning phải work với camera (không cần hardware)
4. Offline mode phải sync khi có connection

---

## 🚀 BẮT ĐẦU

Hỏi: "Path đến project ở đâu?"

Sau đó kiểm tra project tồn tại và → TIẾN HÀNH NGAY.

---

## 📘 PHASE 12 BLUEPRINT

### DELIVERABLES

| # | Module | Features | Priority |
|---|--------|----------|----------|
| 1 | **PWA Setup** | Installable, manifest, service worker | P0 |
| 2 | **Barcode Scanner** | Camera-based scanning | P0 |
| 3 | **QR Code Generator** | Generate codes for parts/locations | P0 |
| 4 | **Mobile Inventory** | Quick adjustments, transfers | P0 |
| 5 | **Mobile Receiving** | PO receiving with scan | P0 |
| 6 | **Mobile Picking** | Pick list execution | P0 |
| 7 | **Mobile Work Orders** | WO status, time entry | P1 |
| 8 | **Mobile Quality** | Quick inspections | P1 |
| 9 | **Offline Support** | Queue operations offline | P1 |
| 10| **Label Printing** | Generate printable labels | P1 |

---

### 📁 NEW FILES TO ADD

```
lerp-mrp/
├── public/
│   ├── manifest.json                           # PWA manifest
│   ├── sw.js                                   # Service worker
│   ├── icons/
│   │   ├── icon-72x72.png
│   │   ├── icon-96x96.png
│   │   ├── icon-128x128.png
│   │   ├── icon-144x144.png
│   │   ├── icon-152x152.png
│   │   ├── icon-192x192.png
│   │   ├── icon-384x384.png
│   │   └── icon-512x512.png
│   └── sounds/
│       ├── beep-success.mp3
│       └── beep-error.mp3
├── src/
│   ├── app/
│   │   └── (mobile)/                           # Mobile-specific layouts
│   │       ├── layout.tsx                      # Mobile layout
│   │       └── m/
│   │           ├── page.tsx                    # Mobile home/launcher
│   │           ├── scan/
│   │           │   └── page.tsx                # Universal scanner
│   │           ├── inventory/
│   │           │   ├── page.tsx                # Inventory lookup
│   │           │   ├── adjust/
│   │           │   │   └── page.tsx            # Quick adjust
│   │           │   ├── transfer/
│   │           │   │   └── page.tsx            # Location transfer
│   │           │   └── count/
│   │           │       └── page.tsx            # Cycle count
│   │           ├── receiving/
│   │           │   ├── page.tsx                # PO list to receive
│   │           │   └── [poId]/
│   │           │       └── page.tsx            # Receive specific PO
│   │           ├── picking/
│   │           │   ├── page.tsx                # Pick lists
│   │           │   └── [pickId]/
│   │           │       └── page.tsx            # Execute pick
│   │           ├── workorder/
│   │           │   ├── page.tsx                # WO list
│   │           │   └── [woId]/
│   │           │       └── page.tsx            # WO details & actions
│   │           ├── quality/
│   │           │   ├── page.tsx                # Pending inspections
│   │           │   └── [inspectionId]/
│   │           │       └── page.tsx            # Quick inspection
│   │           └── settings/
│   │               └── page.tsx                # Mobile settings
│   ├── api/
│   │   └── mobile/
│   │       ├── scan/
│   │       │   └── route.ts                    # Handle scanned codes
│   │       ├── inventory/
│   │       │   ├── adjust/
│   │       │   │   └── route.ts                # Quick adjustment
│   │       │   └── transfer/
│   │       │       └── route.ts                # Transfer
│   │       ├── receiving/
│   │       │   └── route.ts                    # Mobile receiving
│   │       ├── picking/
│   │       │   └── route.ts                    # Picking operations
│   │       ├── workorder/
│   │       │   └── route.ts                    # WO mobile actions
│   │       ├── offline/
│   │       │   ├── sync/
│   │       │   │   └── route.ts                # Sync offline queue
│   │       │   └── data/
│   │       │       └── route.ts                # Download offline data
│   │       └── labels/
│   │           └── route.ts                    # Generate labels
│   ├── components/
│   │   └── mobile/
│   │       ├── mobile-shell.tsx                # Mobile app shell
│   │       ├── mobile-header.tsx               # Mobile header
│   │       ├── mobile-nav.tsx                  # Bottom navigation
│   │       ├── barcode-scanner.tsx             # Camera scanner
│   │       ├── qr-scanner.tsx                  # QR code scanner
│   │       ├── scan-result-card.tsx            # Display scan result
│   │       ├── quantity-input.tsx              # Touch-friendly number
│   │       ├── location-picker.tsx             # Location selector
│   │       ├── part-search.tsx                 # Part lookup
│   │       ├── swipe-actions.tsx               # Swipe to action
│   │       ├── offline-indicator.tsx           # Connection status
│   │       ├── sync-status.tsx                 # Sync progress
│   │       ├── label-preview.tsx               # Label preview
│   │       └── confirmation-modal.tsx          # Touch confirm
│   └── lib/
│       └── mobile/
│           ├── scanner.ts                      # Scanner utilities
│           ├── barcode-parser.ts               # Parse different formats
│           ├── qr-generator.ts                 # Generate QR codes
│           ├── label-generator.ts              # Generate labels
│           ├── offline-store.ts                # IndexedDB storage
│           ├── sync-manager.ts                 # Offline sync
│           ├── pwa.ts                          # PWA utilities
│           └── haptics.ts                      # Vibration feedback
└── next.config.js                              # UPDATE: PWA config
```

---

### 🗄️ DATABASE SCHEMA ADDITIONS

```prisma
// ═══════════════════════════════════════════════════════════════════
//                    MOBILE & BARCODE MODELS
// ═══════════════════════════════════════════════════════════════════

// Barcode/QR Code definitions
model BarcodeDefinition {
  id              String   @id @default(cuid())
  
  // What this barcode represents
  entityType      String   // PART, LOCATION, WORK_ORDER, PO, LOT, SERIAL
  entityId        String
  
  // Barcode data
  barcodeType     String   // CODE128, CODE39, QR, DATAMATRIX, EAN13
  barcodeValue    String   @unique
  
  // For serialized items
  serialNumber    String?
  lotNumber       String?
  
  // Status
  isActive        Boolean  @default(true)
  printedAt       DateTime?
  printCount      Int      @default(0)
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  @@index([entityType, entityId])
  @@index([barcodeValue])
}

// Scan history for audit trail
model ScanLog {
  id              String   @id @default(cuid())
  
  // What was scanned
  barcodeValue    String
  barcodeType     String?
  
  // Resolution
  resolvedType    String?  // PART, LOCATION, etc. or NULL if not found
  resolvedId      String?
  
  // Context
  scanContext     String   // INVENTORY, RECEIVING, PICKING, WORKORDER, LOOKUP
  actionTaken     String?  // What happened after scan
  
  // Device info
  deviceId        String?
  deviceType      String?  // MOBILE, TABLET, SCANNER
  
  // User
  scannedBy       String
  scannedAt       DateTime @default(now())
  
  // Location (GPS if available)
  latitude        Float?
  longitude       Float?
  
  @@index([scannedBy])
  @@index([scannedAt])
  @@index([barcodeValue])
}

// Offline operation queue
model OfflineOperation {
  id              String   @id @default(cuid())
  
  // Operation details
  operationType   String   // INVENTORY_ADJUST, TRANSFER, RECEIVE, PICK, TIME_ENTRY
  operationData   Json     // Full operation payload
  
  // Status
  status          String   @default("PENDING")  // PENDING, SYNCING, COMPLETED, FAILED
  errorMessage    String?
  retryCount      Int      @default(0)
  
  // Timestamps
  createdAt       DateTime @default(now())
  queuedAt        DateTime @default(now())
  syncedAt        DateTime?
  
  // Device
  deviceId        String
  userId          String
  
  @@index([status])
  @@index([userId, status])
}

// Mobile device registration
model MobileDevice {
  id              String   @id @default(cuid())
  
  deviceId        String   @unique
  deviceName      String?
  deviceType      String   // IOS, ANDROID, WEB
  
  // Push notifications
  pushToken       String?
  pushEnabled     Boolean  @default(false)
  
  // User
  userId          String
  user            User     @relation(fields: [userId], references: [id])
  
  // Status
  lastActiveAt    DateTime?
  isActive        Boolean  @default(true)
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  @@index([userId])
}

// Label templates
model LabelTemplate {
  id              String   @id @default(cuid())
  
  name            String
  description     String?
  
  // Template type
  labelType       String   // PART, LOCATION, LOT, SERIAL, SHELF, BIN
  
  // Dimensions (mm)
  width           Int      @default(50)
  height          Int      @default(25)
  
  // Template definition
  template        Json     // ZPL, HTML, or structured template
  templateFormat  String   @default("HTML")  // ZPL, HTML, PDF
  
  // Barcode settings
  barcodeType     String   @default("CODE128")
  includeQR       Boolean  @default(true)
  
  isDefault       Boolean  @default(false)
  isActive        Boolean  @default(true)
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

// Pick List for mobile picking
model PickList {
  id              String   @id @default(cuid())
  
  pickListNumber  String   @unique
  
  // Source
  sourceType      String   // SALES_ORDER, WORK_ORDER, TRANSFER
  sourceId        String
  
  // Assignment
  assignedTo      String?
  assignedAt      DateTime?
  
  // Status
  status          String   @default("PENDING")  // PENDING, IN_PROGRESS, COMPLETED, CANCELLED
  
  // Priority
  priority        Int      @default(5)  // 1-10, 1 = highest
  dueDate         DateTime?
  
  // Progress
  totalLines      Int      @default(0)
  completedLines  Int      @default(0)
  
  // Timing
  startedAt       DateTime?
  completedAt     DateTime?
  
  createdBy       String
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  lines           PickListLine[]
  
  @@index([status])
  @@index([assignedTo])
}

model PickListLine {
  id              String   @id @default(cuid())
  pickListId      String
  pickList        PickList @relation(fields: [pickListId], references: [id], onDelete: Cascade)
  
  lineNumber      Int
  
  // Item to pick
  partId          String
  part            Part     @relation(fields: [partId], references: [id])
  
  // Location
  locationId      String?
  location        InventoryLocation? @relation(fields: [locationId], references: [id])
  binLocation     String?
  
  // Quantities
  requestedQty    Decimal  @db.Decimal(15, 4)
  pickedQty       Decimal  @db.Decimal(15, 4) @default(0)
  
  // Lot/Serial tracking
  lotNumber       String?
  serialNumbers   Json?    // Array of serial numbers
  
  // Status
  status          String   @default("PENDING")  // PENDING, PICKED, SHORT, SKIPPED
  
  // Timing
  pickedAt        DateTime?
  pickedBy        String?
  
  notes           String?
  
  @@index([pickListId])
  @@index([partId])
}
```

---

### 📐 PAGE SPECIFICATIONS

#### 1. MOBILE HOME / LAUNCHER (/m)

```
┌─────────────────────────────────────────┐
│  ≡  L-ERP MRP Mobile            👤 John   │
├─────────────────────────────────────────┤
│                                         │
│  ┌─────────────────────────────────┐   │
│  │         📷 QUICK SCAN           │   │
│  │                                 │   │
│  │    Tap to scan barcode/QR      │   │
│  │                                 │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌───────────┐  ┌───────────┐         │
│  │    📦     │  │    📥     │         │
│  │           │  │           │         │
│  │ Inventory │  │ Receiving │         │
│  │           │  │           │         │
│  │  3 tasks  │  │  2 POs    │         │
│  └───────────┘  └───────────┘         │
│                                         │
│  ┌───────────┐  ┌───────────┐         │
│  │    📤     │  │    🔧     │         │
│  │           │  │           │         │
│  │  Picking  │  │Work Orders│         │
│  │           │  │           │         │
│  │  5 picks  │  │  8 active │         │
│  └───────────┘  └───────────┘         │
│                                         │
│  ┌───────────┐  ┌───────────┐         │
│  │    ✓      │  │    🏷️     │         │
│  │           │  │           │         │
│  │  Quality  │  │  Labels   │         │
│  │           │  │           │         │
│  │ 2 pending │  │  Print    │         │
│  └───────────┘  └───────────┘         │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ ⚡ Recent Activity               │   │
│  │                                 │   │
│  │ • Received PO-2024-089  2m ago │   │
│  │ • Adjusted RTR-MOTOR-001  15m  │   │
│  │ • Picked SO-2024-156    1h ago │   │
│  └─────────────────────────────────┘   │
│                                         │
├─────────────────────────────────────────┤
│  🏠      📷      📦      ⚙️            │
│  Home    Scan    Tasks   Settings       │
└─────────────────────────────────────────┘
```

#### 2. BARCODE SCANNER (/m/scan)

```
┌─────────────────────────────────────────┐
│  ←  Universal Scanner                   │
├─────────────────────────────────────────┤
│                                         │
│  ┌─────────────────────────────────┐   │
│  │                                 │   │
│  │                                 │   │
│  │      ╔═══════════════════╗     │   │
│  │      ║                   ║     │   │
│  │      ║   CAMERA VIEW     ║     │   │
│  │      ║                   ║     │   │
│  │      ║  ┌─────────────┐  ║     │   │
│  │      ║  │░░░░░░░░░░░░░│  ║     │   │
│  │      ║  │░ SCAN AREA ░│  ║     │   │
│  │      ║  │░░░░░░░░░░░░░│  ║     │   │
│  │      ║  └─────────────┘  ║     │   │
│  │      ║                   ║     │   │
│  │      ╚═══════════════════╝     │   │
│  │                                 │   │
│  │          📸 Tap to focus       │   │
│  │                                 │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ 💡 Flash: OFF    🔄 Camera: Back│   │
│  └─────────────────────────────────┘   │
│                                         │
│  Or enter manually:                     │
│  ┌─────────────────────────────────┐   │
│  │ Part #, Location, or Barcode    │   │
│  └─────────────────────────────────┘   │
│                                         │
│  Recent scans:                          │
│  ├─ RTR-MOTOR-001      📦 Part     │   │
│  ├─ WH-A-01-01         📍 Location │   │
│  └─ WO-2024-0089       🔧 Work Order│   │
│                                         │
├─────────────────────────────────────────┤
│  🏠      📷      📦      ⚙️            │
└─────────────────────────────────────────┘
```

#### 3. SCAN RESULT - PART FOUND

```
┌─────────────────────────────────────────┐
│  ←  Scan Result                    ✓    │
├─────────────────────────────────────────┤
│                                         │
│  ✅ PART FOUND                          │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │  📦 RTR-MOTOR-001               │   │
│  │                                 │   │
│  │  Brushless Motor 2812 KV920    │   │
│  │                                 │   │
│  │  ┌─────────┐ ┌─────────┐       │   │
│  │  │ On Hand │ │ Available│       │   │
│  │  │   245   │ │   180    │       │   │
│  │  └─────────┘ └─────────┘       │   │
│  │                                 │   │
│  │  Location: WH-A-01-01          │   │
│  │  Lot: LOT-2024-089             │   │
│  │  Reorder Point: 50             │   │
│  │  Status: ✅ In Stock            │   │
│  │                                 │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ═══════════════════════════════════   │
│  QUICK ACTIONS                          │
│  ═══════════════════════════════════   │
│                                         │
│  ┌───────────┐  ┌───────────┐         │
│  │    ±      │  │    →      │         │
│  │  Adjust   │  │ Transfer  │         │
│  │  Quantity │  │ Location  │         │
│  └───────────┘  └───────────┘         │
│                                         │
│  ┌───────────┐  ┌───────────┐         │
│  │    📋     │  │    🏷️     │         │
│  │   View    │  │  Print    │         │
│  │  Details  │  │  Label    │         │
│  └───────────┘  └───────────┘         │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │        🔄 SCAN ANOTHER          │   │
│  └─────────────────────────────────┘   │
│                                         │
├─────────────────────────────────────────┤
│  🏠      📷      📦      ⚙️            │
└─────────────────────────────────────────┘
```

#### 4. QUICK INVENTORY ADJUST (/m/inventory/adjust)

```
┌─────────────────────────────────────────┐
│  ←  Inventory Adjustment                │
├─────────────────────────────────────────┤
│                                         │
│  ┌─────────────────────────────────┐   │
│  │  📦 RTR-MOTOR-001               │   │
│  │  Brushless Motor 2812           │   │
│  │                                 │   │
│  │  Current Qty: 245               │   │
│  │  Location: WH-A-01-01           │   │
│  └─────────────────────────────────┘   │
│                                         │
│  Adjustment Type:                       │
│  ┌─────────────────────────────────┐   │
│  │  ○ Add (+)                      │   │
│  │  ● Remove (-)                   │   │
│  │  ○ Set to Count                 │   │
│  └─────────────────────────────────┘   │
│                                         │
│  Quantity:                              │
│  ┌─────────────────────────────────┐   │
│  │                                 │   │
│  │    [ - ]     12      [ + ]     │   │
│  │                                 │   │
│  └─────────────────────────────────┘   │
│                                         │
│  New Quantity: 233                      │
│                                         │
│  Reason: *                              │
│  ┌─────────────────────────────────┐   │
│  │  Damaged / Scrap           ▼   │   │
│  └─────────────────────────────────┘   │
│                                         │
│  Notes:                                 │
│  ┌─────────────────────────────────┐   │
│  │  Found damaged in inspection   │   │
│  │                                 │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │         ✓ CONFIRM ADJUSTMENT    │   │
│  └─────────────────────────────────┘   │
│                                         │
├─────────────────────────────────────────┤
│  🏠      📷      📦      ⚙️            │
└─────────────────────────────────────────┘
```

#### 5. MOBILE RECEIVING (/m/receiving/[poId])

```
┌─────────────────────────────────────────┐
│  ←  Receive PO-2024-0089               │
├─────────────────────────────────────────┤
│                                         │
│  📦 Acme Electronics                    │
│  Expected: Dec 28, 2024                 │
│  Status: Partially Received             │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ Progress: ████████░░░ 3/5 lines │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ═══════════════════════════════════   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ ✅ RTR-MOTOR-001                │   │
│  │    Ordered: 100 | Received: 100 │   │
│  │    Location: WH-A-01-01         │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ ✅ RTR-ESC-001                  │   │
│  │    Ordered: 50 | Received: 50   │   │
│  │    Location: WH-A-02-03         │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ 🟡 RTR-FC-001 (Tap to receive)  │   │
│  │    Ordered: 25 | Received: 0    │   │
│  │    [📷 Scan] [Enter Qty]        │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ ⬜ RTR-GPS-001                  │   │
│  │    Ordered: 30 | Received: 0    │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │        📷 SCAN ITEM TO RECEIVE  │   │
│  └─────────────────────────────────┘   │
│                                         │
├─────────────────────────────────────────┤
│  🏠      📷      📦      ⚙️            │
└─────────────────────────────────────────┘
```

#### 6. RECEIVE LINE DETAIL (Modal)

```
┌─────────────────────────────────────────┐
│                                    ✕    │
│  Receive: RTR-FC-001                    │
├─────────────────────────────────────────┤
│                                         │
│  Flight Controller F7                   │
│  Ordered: 25 units                      │
│                                         │
│  Quantity Received:                     │
│  ┌─────────────────────────────────┐   │
│  │                                 │   │
│  │    [ - ]     25      [ + ]     │   │
│  │                                 │   │
│  └─────────────────────────────────┘   │
│                                         │
│  Location: *                            │
│  ┌─────────────────────────────────┐   │
│  │  📷 Scan    WH-A-03-02      ▼  │   │
│  └─────────────────────────────────┘   │
│                                         │
│  Lot Number:                            │
│  ┌─────────────────────────────────┐   │
│  │  LOT-2024-FC-089               │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ☑ Passed Receiving Inspection         │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │                                 │   │
│  │         ✓ CONFIRM RECEIPT       │   │
│  │                                 │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │           ✕ Cancel              │   │
│  └─────────────────────────────────┘   │
│                                         │
└─────────────────────────────────────────┘
```

#### 7. MOBILE PICKING (/m/picking/[pickId])

```
┌─────────────────────────────────────────┐
│  ←  Pick List PL-2024-0156             │
├─────────────────────────────────────────┤
│                                         │
│  📦 Sales Order: SO-2024-0089          │
│  Customer: Aerospace Corp               │
│  Priority: 🔴 HIGH                      │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ Progress: ██████░░░░ 2/5 items  │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ═══════════════════════════════════   │
│  NEXT ITEM TO PICK:                     │
│  ═══════════════════════════════════   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │                                 │   │
│  │  📦 RTR-PROP-15X5               │   │
│  │  Propeller Set 15x5             │   │
│  │                                 │   │
│  │  ┌──────────────────────────┐  │   │
│  │  │  Pick Qty:    20         │  │   │
│  │  │  From:        WH-B-02-01 │  │   │
│  │  │  Available:   156        │  │   │
│  │  └──────────────────────────┘  │   │
│  │                                 │   │
│  │  ┌─────────────────────────┐   │   │
│  │  │   📷 SCAN TO CONFIRM    │   │   │
│  │  └─────────────────────────┘   │   │
│  │                                 │   │
│  │  [Enter Qty Picked] [Skip →]   │   │
│  │                                 │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ═══════════════════════════════════   │
│  COMPLETED:                             │
│  ├─ ✅ RTR-MOTOR-001 (8 pcs)           │
│  └─ ✅ RTR-ESC-001 (8 pcs)             │
│                                         │
│  REMAINING:                             │
│  ├─ ⬜ RTR-FC-001 (2 pcs)              │
│  └─ ⬜ RTR-BATT-001 (4 pcs)            │
│                                         │
├─────────────────────────────────────────┤
│  🏠      📷      📦      ⚙️            │
└─────────────────────────────────────────┘
```

#### 8. MOBILE WORK ORDER (/m/workorder/[woId])

```
┌─────────────────────────────────────────┐
│  ←  WO-2024-0089                       │
├─────────────────────────────────────────┤
│                                         │
│  🔧 HERA-X8-PRO Assembly               │
│  Qty: 5 units | Due: Dec 30            │
│  Status: 🟢 IN PROGRESS                 │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ Progress: ████████░░ 3/5 done   │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ═══════════════════════════════════   │
│  CURRENT OPERATION:                     │
│  ═══════════════════════════════════   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │  Op 30: Motor Installation      │   │
│  │                                 │   │
│  │  Work Center: ASSEMBLY-01       │   │
│  │  Est. Time: 45 min/unit         │   │
│  │                                 │   │
│  │  ┌─────────────────────────┐   │   │
│  │  │     ▶ START OPERATION   │   │   │
│  │  └─────────────────────────┘   │   │
│  │                                 │   │
│  │  [📋 Instructions] [📦 Materials]│   │
│  │                                 │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ═══════════════════════════════════   │
│  QUICK ACTIONS:                         │
│  ═══════════════════════════════════   │
│                                         │
│  ┌───────────┐  ┌───────────┐         │
│  │    ⏱️     │  │    📦     │         │
│  │   Log     │  │  Issue    │         │
│  │   Time    │  │ Material  │         │
│  └───────────┘  └───────────┘         │
│                                         │
│  ┌───────────┐  ┌───────────┐         │
│  │    ⚠️     │  │    ✓      │         │
│  │  Report   │  │ Complete  │         │
│  │  Issue    │  │   Qty     │         │
│  └───────────┘  └───────────┘         │
│                                         │
├─────────────────────────────────────────┤
│  🏠      📷      📦      ⚙️            │
└─────────────────────────────────────────┘
```

---

### 🔧 KEY IMPLEMENTATIONS

#### Barcode Scanner Component

```tsx
// src/components/mobile/barcode-scanner.tsx

'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { BrowserMultiFormatReader, BarcodeFormat } from '@zxing/library';
import { Camera, Flashlight, FlashlightOff, SwitchCamera } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BarcodeScannerProps {
  onScan: (result: ScanResult) => void;
  onError?: (error: Error) => void;
  formats?: BarcodeFormat[];
  continuous?: boolean;
}

interface ScanResult {
  text: string;
  format: string;
  timestamp: Date;
}

export function BarcodeScanner({
  onScan,
  onError,
  formats = [
    BarcodeFormat.QR_CODE,
    BarcodeFormat.CODE_128,
    BarcodeFormat.CODE_39,
    BarcodeFormat.EAN_13,
    BarcodeFormat.EAN_8,
    BarcodeFormat.DATA_MATRIX,
  ],
  continuous = false,
}: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  
  const [isScanning, setIsScanning] = useState(false);
  const [hasFlash, setHasFlash] = useState(false);
  const [flashOn, setFlashOn] = useState(false);
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<string>('');
  const [lastScan, setLastScan] = useState<string>('');

  // Initialize scanner
  useEffect(() => {
    const reader = new BrowserMultiFormatReader();
    readerRef.current = reader;

    // Get available cameras
    reader.listVideoInputDevices().then((devices) => {
      setCameras(devices);
      // Prefer back camera
      const backCamera = devices.find(
        (d) => d.label.toLowerCase().includes('back') || 
               d.label.toLowerCase().includes('rear')
      );
      setSelectedCamera(backCamera?.deviceId || devices[0]?.deviceId || '');
    });

    return () => {
      reader.reset();
    };
  }, []);

  // Start scanning
  const startScanning = useCallback(async () => {
    if (!readerRef.current || !videoRef.current || !selectedCamera) return;

    setIsScanning(true);

    try {
      await readerRef.current.decodeFromVideoDevice(
        selectedCamera,
        videoRef.current,
        (result, error) => {
          if (result) {
            const scanText = result.getText();
            
            // Debounce repeated scans
            if (scanText !== lastScan) {
              setLastScan(scanText);
              
              // Haptic feedback
              if (navigator.vibrate) {
                navigator.vibrate(100);
              }
              
              // Play success sound
              playBeep('success');
              
              onScan({
                text: scanText,
                format: BarcodeFormat[result.getBarcodeFormat()],
                timestamp: new Date(),
              });

              if (!continuous) {
                stopScanning();
              }
            }
          }
        }
      );

      // Check for flash capability
      const track = videoRef.current.srcObject instanceof MediaStream
        ? videoRef.current.srcObject.getVideoTracks()[0]
        : null;
      if (track) {
        const capabilities = track.getCapabilities() as any;
        setHasFlash(!!capabilities?.torch);
      }
    } catch (err) {
      onError?.(err as Error);
      setIsScanning(false);
    }
  }, [selectedCamera, lastScan, continuous, onScan, onError]);

  // Stop scanning
  const stopScanning = useCallback(() => {
    readerRef.current?.reset();
    setIsScanning(false);
    setFlashOn(false);
  }, []);

  // Toggle flash
  const toggleFlash = useCallback(async () => {
    if (!videoRef.current?.srcObject) return;

    const track = (videoRef.current.srcObject as MediaStream).getVideoTracks()[0];
    if (track) {
      await track.applyConstraints({
        advanced: [{ torch: !flashOn } as any],
      });
      setFlashOn(!flashOn);
    }
  }, [flashOn]);

  // Switch camera
  const switchCamera = useCallback(() => {
    const currentIndex = cameras.findIndex((c) => c.deviceId === selectedCamera);
    const nextIndex = (currentIndex + 1) % cameras.length;
    setSelectedCamera(cameras[nextIndex]?.deviceId || '');
    
    if (isScanning) {
      stopScanning();
      setTimeout(startScanning, 100);
    }
  }, [cameras, selectedCamera, isScanning, startScanning, stopScanning]);

  // Auto-start
  useEffect(() => {
    if (selectedCamera && !isScanning) {
      startScanning();
    }
  }, [selectedCamera]);

  return (
    <div className="relative w-full max-w-md mx-auto">
      {/* Camera View */}
      <div className="relative aspect-[4/3] bg-black rounded-lg overflow-hidden">
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          playsInline
          muted
        />
        
        {/* Scan Area Overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-64 h-64 border-2 border-white/50 rounded-lg relative">
            {/* Corner markers */}
            <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-lg" />
            <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr-lg" />
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl-lg" />
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br-lg" />
            
            {/* Scanning line animation */}
            {isScanning && (
              <div className="absolute inset-x-4 h-0.5 bg-primary animate-scan" />
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4">
          {hasFlash && (
            <Button
              variant="ghost"
              size="icon"
              className="bg-black/50 text-white"
              onClick={toggleFlash}
            >
              {flashOn ? <FlashlightOff /> : <Flashlight />}
            </Button>
          )}
          
          {cameras.length > 1 && (
            <Button
              variant="ghost"
              size="icon"
              className="bg-black/50 text-white"
              onClick={switchCamera}
            >
              <SwitchCamera />
            </Button>
          )}
        </div>
      </div>

      {/* Status */}
      <div className="mt-4 text-center text-sm text-muted-foreground">
        {isScanning ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            Scanning...
          </span>
        ) : (
          <span>Camera initializing...</span>
        )}
      </div>
    </div>
  );
}

// Play beep sound
function playBeep(type: 'success' | 'error') {
  const audio = new Audio(`/sounds/beep-${type}.mp3`);
  audio.volume = 0.5;
  audio.play().catch(() => {});
}

// CSS for scan animation (add to globals.css)
/*
@keyframes scan {
  0%, 100% { top: 10%; }
  50% { top: 90%; }
}
.animate-scan {
  animation: scan 2s ease-in-out infinite;
}
*/
```

#### QR Code Generator

```typescript
// src/lib/mobile/qr-generator.ts

import QRCode from 'qrcode';

interface QRCodeOptions {
  width?: number;
  margin?: number;
  color?: {
    dark?: string;
    light?: string;
  };
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
}

interface EntityQRData {
  type: 'PART' | 'LOCATION' | 'WORK_ORDER' | 'PO' | 'LOT' | 'SERIAL';
  id: string;
  code: string;
  name?: string;
  metadata?: Record<string, any>;
}

/**
 * Generate QR code data URL for an entity
 */
export async function generateEntityQR(
  entity: EntityQRData,
  options: QRCodeOptions = {}
): Promise<string> {
  const qrData = JSON.stringify({
    t: entity.type,
    id: entity.id,
    c: entity.code,
    ts: Date.now(),
  });

  return QRCode.toDataURL(qrData, {
    width: options.width || 200,
    margin: options.margin || 2,
    color: {
      dark: options.color?.dark || '#000000',
      light: options.color?.light || '#ffffff',
    },
    errorCorrectionLevel: options.errorCorrectionLevel || 'M',
  });
}

/**
 * Generate barcode for printing
 */
export async function generateBarcode(
  value: string,
  type: 'CODE128' | 'CODE39' | 'EAN13' = 'CODE128'
): Promise<string> {
  const JsBarcode = (await import('jsbarcode')).default;
  
  // Create canvas
  const canvas = document.createElement('canvas');
  
  JsBarcode(canvas, value, {
    format: type,
    width: 2,
    height: 50,
    displayValue: true,
    fontSize: 12,
    margin: 10,
  });

  return canvas.toDataURL('image/png');
}

/**
 * Parse QR code data
 */
export function parseQRData(data: string): EntityQRData | null {
  try {
    const parsed = JSON.parse(data);
    
    return {
      type: parsed.t,
      id: parsed.id,
      code: parsed.c,
    };
  } catch {
    // Not our QR format, try to match patterns
    return parseBarcode(data);
  }
}

/**
 * Parse barcode/text to identify entity
 */
export function parseBarcode(value: string): EntityQRData | null {
  // Part number pattern (e.g., RTR-MOTOR-001)
  if (/^[A-Z]{2,5}-[A-Z0-9-]+$/i.test(value)) {
    return {
      type: 'PART',
      id: '',
      code: value.toUpperCase(),
    };
  }

  // Location pattern (e.g., WH-A-01-01)
  if (/^WH-[A-Z]-\d{2}-\d{2}$/i.test(value)) {
    return {
      type: 'LOCATION',
      id: '',
      code: value.toUpperCase(),
    };
  }

  // Work order pattern (e.g., WO-2024-0089)
  if (/^WO-\d{4}-\d{4}$/i.test(value)) {
    return {
      type: 'WORK_ORDER',
      id: '',
      code: value.toUpperCase(),
    };
  }

  // PO pattern (e.g., PO-2024-0089)
  if (/^PO-\d{4}-\d{4}$/i.test(value)) {
    return {
      type: 'PO',
      id: '',
      code: value.toUpperCase(),
    };
  }

  // Lot pattern (e.g., LOT-2024-001)
  if (/^LOT-\d{4}-\d{3,}$/i.test(value)) {
    return {
      type: 'LOT',
      id: '',
      code: value.toUpperCase(),
    };
  }

  return null;
}
```

#### Offline Store (IndexedDB)

```typescript
// src/lib/mobile/offline-store.ts

import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface RTROfflineDB extends DBSchema {
  operations: {
    key: string;
    value: OfflineOperation;
    indexes: {
      'by-status': string;
      'by-timestamp': number;
    };
  };
  cache: {
    key: string;
    value: CachedData;
    indexes: {
      'by-type': string;
      'by-expiry': number;
    };
  };
  scanHistory: {
    key: string;
    value: ScanHistoryEntry;
    indexes: {
      'by-timestamp': number;
    };
  };
}

interface OfflineOperation {
  id: string;
  type: string;
  data: any;
  status: 'pending' | 'syncing' | 'failed';
  createdAt: number;
  retryCount: number;
  errorMessage?: string;
}

interface CachedData {
  key: string;
  type: string;
  data: any;
  cachedAt: number;
  expiresAt: number;
}

interface ScanHistoryEntry {
  id: string;
  barcode: string;
  resolvedType?: string;
  resolvedName?: string;
  timestamp: number;
}

let db: IDBPDatabase<RTROfflineDB> | null = null;

/**
 * Initialize IndexedDB
 */
export async function initOfflineDB(): Promise<IDBPDatabase<RTROfflineDB>> {
  if (db) return db;

  db = await openDB<RTROfflineDB>('lerp-mrp-offline', 1, {
    upgrade(database) {
      // Operations store
      const operationsStore = database.createObjectStore('operations', {
        keyPath: 'id',
      });
      operationsStore.createIndex('by-status', 'status');
      operationsStore.createIndex('by-timestamp', 'createdAt');

      // Cache store
      const cacheStore = database.createObjectStore('cache', {
        keyPath: 'key',
      });
      cacheStore.createIndex('by-type', 'type');
      cacheStore.createIndex('by-expiry', 'expiresAt');

      // Scan history store
      const scanStore = database.createObjectStore('scanHistory', {
        keyPath: 'id',
      });
      scanStore.createIndex('by-timestamp', 'timestamp');
    },
  });

  return db;
}

/**
 * Queue an operation for offline sync
 */
export async function queueOperation(
  type: string,
  data: any
): Promise<string> {
  const database = await initOfflineDB();
  
  const operation: OfflineOperation = {
    id: `op_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    type,
    data,
    status: 'pending',
    createdAt: Date.now(),
    retryCount: 0,
  };

  await database.add('operations', operation);
  
  // Try to sync immediately if online
  if (navigator.onLine) {
    syncOperations();
  }

  return operation.id;
}

/**
 * Get pending operations
 */
export async function getPendingOperations(): Promise<OfflineOperation[]> {
  const database = await initOfflineDB();
  return database.getAllFromIndex('operations', 'by-status', 'pending');
}

/**
 * Sync pending operations with server
 */
export async function syncOperations(): Promise<{
  synced: number;
  failed: number;
}> {
  const database = await initOfflineDB();
  const pending = await getPendingOperations();
  
  let synced = 0;
  let failed = 0;

  for (const operation of pending) {
    try {
      // Update status to syncing
      await database.put('operations', {
        ...operation,
        status: 'syncing',
      });

      // Send to server
      const response = await fetch('/api/mobile/offline/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(operation),
      });

      if (response.ok) {
        // Remove from queue
        await database.delete('operations', operation.id);
        synced++;
      } else {
        throw new Error(await response.text());
      }
    } catch (error) {
      // Mark as failed, increment retry
      await database.put('operations', {
        ...operation,
        status: 'failed',
        retryCount: operation.retryCount + 1,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      });
      failed++;
    }
  }

  return { synced, failed };
}

/**
 * Cache data for offline access
 */
export async function cacheData(
  key: string,
  type: string,
  data: any,
  ttlMinutes: number = 60
): Promise<void> {
  const database = await initOfflineDB();
  
  await database.put('cache', {
    key,
    type,
    data,
    cachedAt: Date.now(),
    expiresAt: Date.now() + ttlMinutes * 60 * 1000,
  });
}

/**
 * Get cached data
 */
export async function getCachedData<T>(key: string): Promise<T | null> {
  const database = await initOfflineDB();
  const cached = await database.get('cache', key);
  
  if (!cached) return null;
  if (cached.expiresAt < Date.now()) {
    await database.delete('cache', key);
    return null;
  }
  
  return cached.data as T;
}

/**
 * Add to scan history
 */
export async function addScanHistory(
  barcode: string,
  resolvedType?: string,
  resolvedName?: string
): Promise<void> {
  const database = await initOfflineDB();
  
  await database.add('scanHistory', {
    id: `scan_${Date.now()}`,
    barcode,
    resolvedType,
    resolvedName,
    timestamp: Date.now(),
  });

  // Keep only last 50 scans
  const allScans = await database.getAllFromIndex(
    'scanHistory',
    'by-timestamp'
  );
  
  if (allScans.length > 50) {
    const toDelete = allScans.slice(0, allScans.length - 50);
    for (const scan of toDelete) {
      await database.delete('scanHistory', scan.id);
    }
  }
}

/**
 * Get recent scan history
 */
export async function getScanHistory(limit: number = 10): Promise<ScanHistoryEntry[]> {
  const database = await initOfflineDB();
  const all = await database.getAllFromIndex('scanHistory', 'by-timestamp');
  return all.reverse().slice(0, limit);
}
```

#### PWA Manifest

```json
// public/manifest.json

{
  "name": "L-ERP MRP Mobile",
  "short_name": "L-ERP MRP",
  "description": "Mobile interface for L-ERP MRP System",
  "start_url": "/m",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#0f172a",
  "orientation": "portrait-primary",
  "icons": [
    {
      "src": "/icons/icon-72x72.png",
      "sizes": "72x72",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-96x96.png",
      "sizes": "96x96",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-128x128.png",
      "sizes": "128x128",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-144x144.png",
      "sizes": "144x144",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-152x152.png",
      "sizes": "152x152",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-384x384.png",
      "sizes": "384x384",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable any"
    }
  ],
  "categories": ["business", "productivity"],
  "shortcuts": [
    {
      "name": "Scan",
      "url": "/m/scan",
      "icons": [{ "src": "/icons/scan-96.png", "sizes": "96x96" }]
    },
    {
      "name": "Inventory",
      "url": "/m/inventory",
      "icons": [{ "src": "/icons/inventory-96.png", "sizes": "96x96" }]
    },
    {
      "name": "Receiving",
      "url": "/m/receiving",
      "icons": [{ "src": "/icons/receiving-96.png", "sizes": "96x96" }]
    }
  ]
}
```

#### Service Worker

```javascript
// public/sw.js

const CACHE_NAME = 'lerp-mrp-v1';
const OFFLINE_URL = '/m/offline';

// Assets to cache
const PRECACHE_ASSETS = [
  '/m',
  '/m/scan',
  '/m/inventory',
  '/m/offline',
  '/sounds/beep-success.mp3',
  '/sounds/beep-error.mp3',
];

// Install event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Fetch event - Network first, fallback to cache
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  // Skip API requests (they should use offline queue)
  if (event.request.url.includes('/api/')) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Clone and cache successful responses
        if (response.ok) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(async () => {
        // Try cache
        const cachedResponse = await caches.match(event.request);
        if (cachedResponse) {
          return cachedResponse;
        }

        // For navigation requests, return offline page
        if (event.request.mode === 'navigate') {
          return caches.match(OFFLINE_URL);
        }

        return new Response('Offline', { status: 503 });
      })
  );
});

// Background sync
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-operations') {
    event.waitUntil(syncOperations());
  }
});

async function syncOperations() {
  // This will be handled by the app when it comes back online
  const clients = await self.clients.matchAll();
  clients.forEach((client) => {
    client.postMessage({ type: 'SYNC_REQUIRED' });
  });
}

// Push notifications
self.addEventListener('push', (event) => {
  const data = event.data?.json() || {};
  
  const options = {
    body: data.body || 'New notification',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [100, 50, 100],
    data: data.url || '/m',
    actions: data.actions || [],
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'L-ERP MRP', options)
  );
});

// Notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  event.waitUntil(
    clients.openWindow(event.notification.data)
  );
});
```

#### Label Generator

```typescript
// src/lib/mobile/label-generator.ts

import { generateEntityQR, generateBarcode } from './qr-generator';

interface LabelData {
  partNumber: string;
  partName: string;
  location?: string;
  lotNumber?: string;
  quantity?: number;
  date?: string;
}

/**
 * Generate HTML label for printing
 */
export async function generatePartLabel(data: LabelData): Promise<string> {
  const qrCode = await generateEntityQR({
    type: 'PART',
    id: '',
    code: data.partNumber,
  });

  const barcode = await generateBarcode(data.partNumber, 'CODE128');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        @page {
          size: 50mm 25mm;
          margin: 0;
        }
        body {
          margin: 0;
          padding: 2mm;
          font-family: Arial, sans-serif;
          font-size: 8pt;
        }
        .label {
          width: 46mm;
          height: 21mm;
          border: 1px solid #000;
          display: flex;
          padding: 1mm;
        }
        .qr-section {
          width: 15mm;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .qr-section img {
          width: 14mm;
          height: 14mm;
        }
        .info-section {
          flex: 1;
          padding-left: 2mm;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }
        .part-number {
          font-weight: bold;
          font-size: 10pt;
        }
        .part-name {
          font-size: 7pt;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .barcode img {
          width: 100%;
          height: 8mm;
        }
        .meta {
          font-size: 6pt;
          color: #666;
        }
      </style>
    </head>
    <body>
      <div class="label">
        <div class="qr-section">
          <img src="${qrCode}" alt="QR" />
        </div>
        <div class="info-section">
          <div class="part-number">${data.partNumber}</div>
          <div class="part-name">${data.partName}</div>
          <div class="barcode">
            <img src="${barcode}" alt="Barcode" />
          </div>
          <div class="meta">
            ${data.location ? `Loc: ${data.location}` : ''}
            ${data.lotNumber ? `| Lot: ${data.lotNumber}` : ''}
            ${data.quantity ? `| Qty: ${data.quantity}` : ''}
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Generate location label
 */
export async function generateLocationLabel(
  location: string,
  zone?: string
): Promise<string> {
  const qrCode = await generateEntityQR({
    type: 'LOCATION',
    id: '',
    code: location,
  });

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        @page {
          size: 100mm 50mm;
          margin: 0;
        }
        body {
          margin: 0;
          padding: 5mm;
          font-family: Arial, sans-serif;
        }
        .label {
          width: 90mm;
          height: 40mm;
          border: 2px solid #000;
          display: flex;
          align-items: center;
          padding: 3mm;
        }
        .qr-section {
          width: 35mm;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .qr-section img {
          width: 32mm;
          height: 32mm;
        }
        .info-section {
          flex: 1;
          text-align: center;
        }
        .location-code {
          font-size: 24pt;
          font-weight: bold;
          letter-spacing: 2px;
        }
        .zone {
          font-size: 14pt;
          color: #666;
          margin-top: 2mm;
        }
      </style>
    </head>
    <body>
      <div class="label">
        <div class="qr-section">
          <img src="${qrCode}" alt="QR" />
        </div>
        <div class="info-section">
          <div class="location-code">${location}</div>
          ${zone ? `<div class="zone">${zone}</div>` : ''}
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Print label using browser print
 */
export function printLabel(html: string): void {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    throw new Error('Could not open print window');
  }

  printWindow.document.write(html);
  printWindow.document.close();
  
  printWindow.onload = () => {
    printWindow.print();
    printWindow.close();
  };
}
```

---

### 🔗 UPDATE NEXT.JS CONFIG FOR PWA

```javascript
// next.config.js

const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  // ... existing config
};

module.exports = withPWA(nextConfig);
```

---

### 📦 NEW DEPENDENCIES

```bash
npm install @zxing/library qrcode jsbarcode idb next-pwa
npm install -D @types/qrcode
```

---

### ✅ SAU KHI HOÀN THÀNH

```
✅ Đã thêm Phase 12 Mobile & Barcode vào project L-ERP MRP System

New Capabilities:
├── 📱 PWA (Progressive Web App)
│   ├─ Installable on any device
│   ├─ Offline support
│   ├─ Push notifications
│   └─ Home screen icon
│
├── 📷 BARCODE SCANNING
│   ├─ Camera-based (no hardware needed)
│   ├─ Supports CODE128, CODE39, QR, EAN
│   ├─ Auto-detect entity type
│   └─ Haptic & audio feedback
│
├── 🏷️ LABEL GENERATION
│   ├─ Part labels with QR + barcode
│   ├─ Location labels
│   ├─ Browser-based printing
│   └─ Customizable templates
│
├── 📦 MOBILE INVENTORY
│   ├─ Quick lookup by scan
│   ├─ Adjust quantities
│   ├─ Transfer locations
│   └─ Cycle counting
│
├── 📥 MOBILE RECEIVING
│   ├─ PO list with progress
│   ├─ Scan to receive
│   ├─ Lot/location assignment
│   └─ Quality check flag
│
├── 📤 MOBILE PICKING
│   ├─ Pick list execution
│   ├─ Scan to confirm
│   ├─ Short pick handling
│   └─ Route optimization
│
├── 🔧 MOBILE WORK ORDERS
│   ├─ WO status & progress
│   ├─ Start/stop operations
│   ├─ Time entry
│   └─ Material issues
│
└── 🔄 OFFLINE SUPPORT
    ├─ IndexedDB storage
    ├─ Operation queue
    ├─ Auto-sync when online
    └─ Conflict handling

New Mobile Pages:
- /m                    - Mobile launcher
- /m/scan               - Universal scanner
- /m/inventory          - Inventory operations
- /m/inventory/adjust   - Quick adjust
- /m/inventory/transfer - Location transfer
- /m/inventory/count    - Cycle count
- /m/receiving          - PO receiving
- /m/picking            - Pick list execution
- /m/workorder          - Work order operations
- /m/quality            - Quick inspections
- /m/settings           - Mobile settings

Database: +6 new models
```

---

### 📊 SCORECARD UPDATE AFTER PHASE 12

```
╔════════════════════════════════════════════════════════════════════╗
║           L-ERP MRP SYSTEM - POST PHASE 12                          ║
╠════════════════════════════════════════════════════════════════════╣
║                                                                    ║
║  Integration:          4.0/10 → 6.5/10 (+2.5) 🚀🚀                ║
║  Core MRP:             6.5/10 → 7.0/10 (+0.5) (mobile ops)        ║
║                                                                    ║
║  NEW OVERALL SCORE:    7.2/10 → 7.8/10 (+0.6)                     ║
║                                                                    ║
║  Status: PRODUCTION-READY MVP                                     ║
║                                                                    ║
╚════════════════════════════════════════════════════════════════════╝
```

---

# ═══════════════════════════════════════════════════════════════════════════════
#                            END OF CODER PACK
#                    RTR AI-First MRP System - Phase 12
#                      MOBILE & BARCODE INTEGRATION
# ═══════════════════════════════════════════════════════════════════════════════
