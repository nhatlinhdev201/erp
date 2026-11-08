# 📊 L-ERP MRP - UI/UX CHO CHỨC NĂNG MRP

## Tổng quan các màn hình mới

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                               ║
║   📱 MRP PLANNING PAGE - /v2/mrp                                             ║
║                                                                               ║
║   Màn hình tính toán nhu cầu vật tư và đề xuất mua hàng                      ║
║                                                                               ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

---

## 🖥️ WIREFRAME: MRP Planning Page

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  🏠 Dashboard  📦 Inventory  📋 Sales  ⚙️ Production  [MRP] 📊 Analytics      │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  🧮 MRP Planning                                          [Export] [▶️ Chạy MRP] │
│  Tính toán nhu cầu vật tư và đề xuất mua hàng                                   │
│                                                                                  │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐       │
│  │ 📋 2    │ │ 🔴 2    │ │ 🟡 2    │ │ 🟢 4    │ │ 🛒 4    │ │ 💰 16.9M│       │
│  │ Đơn hàng│ │ CRITICAL│ │ Sắp hết │ │ Đủ hàng │ │ Cần mua │ │ Tổng    │       │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘       │
│                                                                                  │
│  ┌──────────────────┬──────────────────┬──────────────────┐                     │
│  │ [📋 Đơn hàng(3)] │ [🧮 Kết quả(8)]  │ [🛒 Đề xuất(4)]  │                     │
│  └──────────────────┴──────────────────┴──────────────────┘                     │
│                                                                                  │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  TAB 1: ĐƠN HÀNG NGUỒN                                                          │
│  ─────────────────────────────────────────────────────────────────────────────  │
│                                                                                  │
│  ☑️ Chọn đơn hàng để tính MRP                           Đã chọn: 2 đơn         │
│                                                                                  │
│  ┌────┬───────────────┬─────────────────┬───────────┬────────┬──────────┬─────┐ │
│  │ ☑️ │ Số đơn hàng   │ Khách hàng      │ Sản phẩm  │ SL     │ Ngày YC  │ TT  │ │
│  ├────┼───────────────┼─────────────────┼───────────┼────────┼──────────┼─────┤ │
│  │ ☑️ │ SO-2025-001   │ ABC Manufact... │ FG-PRD-A1 │ 10     │ 15/01/25 │ 🟢  │ │
│  │ ☑️ │ SO-2025-002   │ XYZ Industries  │ FG-PRD-A2 │ 5      │ 20/01/25 │ 🟢  │ │
│  │ ☐  │ SO-2025-003   │ Đông Á Group    │ FG-PRD-B1 │ 15     │ 25/01/25 │ 🟡  │ │
│  └────┴───────────────┴─────────────────┴───────────┴────────┴──────────┴─────┘ │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 🖥️ WIREFRAME: Tab Kết quả MRP (Tính vật tư thiếu)

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                                                                  │
│  TAB 2: KẾT QUẢ TÍNH TOÁN NHU CẦU VẬT TƯ                    [Filter: Tất cả ▼] │
│  ─────────────────────────────────────────────────────────────────────────────  │
│                                                                                  │
│  ┌──────┬─────────────┬────────────────────┬────────┬──────┬──────┬──────┬─────┐│
│  │ TT   │ Mã vật tư   │ Tên vật tư         │ Nhu cầu│ Tồn  │Đặt   │An toàn│THIẾU││
│  ├──────┼─────────────┼────────────────────┼────────┼──────┼──────┼──────┼─────┤│
│  │ 🔴   │ CMP-BRG-002 │ Bạc đạn 6201-2RS   │ 60 pcs │ 25   │ 0    │ 30   │ 65  ││
│  │ 🔴   │ CMP-MOT-001 │ Motor DC 12V 50W   │ 40 pcs │ 15   │ 10   │ 10   │ 25  ││
│  ├──────┼─────────────┼────────────────────┼────────┼──────┼──────┼──────┼─────┤│
│  │ 🟡   │ RM-STL-002  │ Thép tấm 3mm       │ 180 kg │ 120  │ 0    │ 40   │ 100 ││
│  │ 🟡   │ CMP-GBX-001 │ Hộp số 1:10        │ 30 pcs │ 18   │ 5    │ 5    │ 12  ││
│  ├──────┼─────────────┼────────────────────┼────────┼──────┼──────┼──────┼─────┤│
│  │ 🟢   │ CMP-SCR-001 │ Vít M4x10 inox     │ 800 pcs│ 2500 │ 0    │ 500  │ -   ││
│  │ 🟢   │ CMP-SCR-002 │ Vít M5x12 inox     │ 600 pcs│ 2200 │ 0    │ 500  │ -   ││
│  │ 🟢   │ RM-STL-001  │ Thép tấm 2mm       │ 120 kg │ 250  │ 0    │ 50   │ -   ││
│  │ 🟢   │ RM-ALU-001  │ Nhôm tấm 1.5mm     │ 75 kg  │ 85   │ 50   │ 30   │ -   ││
│  └──────┴─────────────┴────────────────────┴────────┴──────┴──────┴──────┴─────┘│
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────────┐│
│  │ 📐 Công thức: THIẾU = Nhu cầu - Tồn kho - Đang đặt + Tồn an toàn           ││
│  └─────────────────────────────────────────────────────────────────────────────┘│
│                                                                                  │
│  Chú thích:                                                                      │
│  🔴 CRITICAL = Thiếu nghiêm trọng, cần đặt hàng GẤP                             │
│  🟡 LOW = Sắp hết, cần đặt hàng                                                  │
│  🟢 OK = Đủ hàng                                                                 │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 🖥️ WIREFRAME: Tab Đề xuất mua hàng (Purchase Suggestions)

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                                                                  │
│  TAB 3: ĐỀ XUẤT ĐƠN MUA HÀNG                      [✅ Duyệt tất cả] [📤 Tạo PO] │
│  ─────────────────────────────────────────────────────────────────────────────  │
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────────┐│
│  │ ⚠️ Có 2 vật tư cần đặt hàng GẤP! Ngày đặt hàng đề xuất đã qua.             ││
│  └─────────────────────────────────────────────────────────────────────────────┘│
│                                                                                  │
│  ┌────┬──────┬─────────────┬───────────────┬────────────────┬────────┬─────────┐│
│  │ ☑️ │ Ưu   │ Mã vật tư   │ Tên           │ Nhà cung cấp   │ SL     │ Tiền    ││
│  │    │ tiên │             │               │                │        │         ││
│  ├────┼──────┼─────────────┼───────────────┼────────────────┼────────┼─────────┤│
│  │ ☑️ │ 🔴   │ CMP-MOT-001 │ Motor DC 12V  │ Oriental Motor │ 25 pcs │ 6.25M   ││
│  │    │URGENT│             │               │                │        │         ││
│  │ ☑️ │ 🔴   │ CMP-BRG-002 │ Bạc đạn 6201  │ SKF Vietnam    │ 65 pcs │ 2.73M   ││
│  │    │URGENT│             │               │                │        │         ││
│  │ ☑️ │ 🟠   │ CMP-GBX-001 │ Hộp số 1:10   │ Oriental Motor │ 12 pcs │ 5.40M   ││
│  │    │ HIGH │             │               │                │        │         ││
│  │ ☑️ │ 🔵   │ RM-STL-002  │ Thép tấm 3mm  │ Thép VN Steel  │ 100 kg │ 2.60M   ││
│  │    │NORMAL│             │               │                │        │         ││
│  └────┴──────┴─────────────┴───────────────┴────────────────┴────────┴─────────┘│
│                                                                                  │
│                                            Tổng giá trị đề xuất: 💰 16,980,000  │
│                                                                                  │
│  ─────────────────────────────────────────────────────────────────────────────  │
│                                                                                  │
│  📊 TỔNG HỢP THEO NHÀ CUNG CẤP:                                                 │
│                                                                                  │
│  ┌─────────────────────────┐ ┌─────────────────────────┐ ┌─────────────────────┐│
│  │ 🏭 Oriental Motor VN    │ │ 🏭 SKF Vietnam          │ │ 🏭 Thép VN Steel    ││
│  │ 2 vật tư                │ │ 1 vật tư                │ │ 1 vật tư            ││
│  │ 💰 11,650,000           │ │ 💰 2,730,000            │ │ 💰 2,600,000        ││
│  └─────────────────────────┘ └─────────────────────────┘ └─────────────────────┘│
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 🔄 USER FLOW: Quy trình sử dụng MRP

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                                                                  │
│                          USER FLOW: MRP PLANNING                                 │
│                                                                                  │
│   ┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐  │
│   │         │     │         │     │         │     │         │     │         │  │
│   │ 1️⃣ CHỌN │────▶│ 2️⃣ CHẠY │────▶│ 3️⃣ XEM  │────▶│ 4️⃣ DUYỆT │────▶│ 5️⃣ TẠO  │  │
│   │   ĐƠN   │     │   MRP   │     │ KẾT QUẢ │     │ ĐỀ XUẤT │     │   PO    │  │
│   │  HÀNG   │     │         │     │         │     │         │     │         │  │
│   └─────────┘     └─────────┘     └─────────┘     └─────────┘     └─────────┘  │
│       │               │               │               │               │        │
│       ▼               ▼               ▼               ▼               ▼        │
│   ┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐  │
│   │ Tick    │     │ System  │     │ Xem vật │     │ Check   │     │ Gửi PO  │  │
│   │ chọn SO │     │ tính    │     │ tư thiếu│     │ và duyệt│     │ cho NCC │  │
│   │ cần tính│     │ BOM     │     │ cần mua │     │ đề xuất │     │         │  │
│   └─────────┘     └─────────┘     └─────────┘     └─────────┘     └─────────┘  │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 📱 RESPONSIVE DESIGN

### Desktop (1280px+)
- Full table với tất cả columns
- Summary cards 6 columns
- Side-by-side supplier summary

### Tablet (768px - 1279px)
- Summary cards 3 columns
- Table scroll horizontal
- Stacked supplier summary

### Mobile (< 768px)
- Summary cards 2 columns
- Card view thay cho table
- Full-width supplier cards

---

## 🎨 COLOR CODING (Mã màu)

### Status Colors

| Status | Color | Hex | Usage |
|--------|-------|-----|-------|
| **CRITICAL** | Đỏ | `#DC2626` | Thiếu nghiêm trọng |
| **LOW** | Vàng | `#D97706` | Sắp hết |
| **OK** | Xanh lá | `#16A34A` | Đủ hàng |

### Priority Colors

| Priority | Color | Hex | Usage |
|----------|-------|-----|-------|
| **URGENT** | Đỏ | `#DC2626` | Cần mua gấp |
| **HIGH** | Cam | `#EA580C` | Ưu tiên cao |
| **NORMAL** | Xanh dương | `#2563EB` | Bình thường |
| **LOW** | Xám | `#6B7280` | Ưu tiên thấp |

---

## 📐 CÔNG THỨC TÍNH TOÁN

### Net Requirement (Nhu cầu thực)

```
Net Requirement = Gross Requirement - On Hand - On Order + Safety Stock

Ví dụ:
- Gross Requirement: 60 pcs (từ BOM explosion)
- On Hand: 25 pcs (tồn kho hiện tại)
- On Order: 0 pcs (đang đặt)
- Safety Stock: 30 pcs (tồn an toàn)

Net Requirement = 60 - 25 - 0 + 30 = 65 pcs (cần mua)
```

### Suggested Order Date (Ngày đặt hàng đề xuất)

```
Suggested Order Date = Required Date - Lead Time

Ví dụ:
- Required Date: 2025-01-10 (ngày cần hàng)
- Lead Time: 7 days (thời gian giao hàng)

Suggested Order Date = 2025-01-10 - 7 = 2025-01-03
```

---

## 🔗 INTEGRATION VỚI CÁC MODULE KHÁC

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                                                                  │
│                          SYSTEM INTEGRATION                                      │
│                                                                                  │
│   ┌───────────┐                                          ┌───────────┐          │
│   │  SALES    │─────────────┐                    ┌───────│  PURCHASE │          │
│   │  ORDERS   │             │                    │       │  ORDERS   │          │
│   └───────────┘             ▼                    │       └───────────┘          │
│                       ┌───────────┐              │              ▲               │
│   ┌───────────┐       │           │              │              │               │
│   │   BOM     │──────▶│    MRP    │──────────────┴──────────────┘               │
│   │           │       │  PLANNING │                                              │
│   └───────────┘       │           │──────────────┬──────────────┐               │
│                       └───────────┘              │              │               │
│   ┌───────────┐             ▲                    │              ▼               │
│   │ INVENTORY │─────────────┘                    │       ┌───────────┐          │
│   │           │                                  └───────│PRODUCTION │          │
│   └───────────┘                                          │   ORDERS  │          │
│                                                          └───────────┘          │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Data Flow:
1. **Sales Orders** → MRP (nguồn nhu cầu)
2. **BOM** → MRP (cấu trúc sản phẩm)
3. **Inventory** → MRP (tồn kho hiện tại)
4. **MRP** → **Purchase Orders** (đề xuất mua)
5. **MRP** → **Production Orders** (lệnh sản xuất)

---

## 📍 NAVIGATION UPDATE

### Sidebar Menu (thêm MRP)

```
📊 Dashboard
📦 Inventory
🏭 Parts Master
📋 Sales Orders
⚙️ Production
├── Work Orders
└── Scheduling
🧮 MRP Planning    ← NEW
├── Run MRP
├── Purchase Suggestions
└── Material Status
✅ Quality
📑 BOM
📈 Analytics
⚙️ Settings
```

---

## ✅ CHECKLIST IMPLEMENTATION

| Feature | Status | File |
|---------|--------|------|
| MRP Planning Page | ✅ Done | `components/pages/mrp-planning.tsx` |
| Route /v2/mrp | ✅ Done | `app/v2/mrp/page.tsx` |
| Sales Order Selection | ✅ Done | Tab 1 |
| MRP Calculation Results | ✅ Done | Tab 2 |
| Purchase Suggestions | ✅ Done | Tab 3 |
| Status Badges | ✅ Done | Component |
| Summary Cards | ✅ Done | KPI display |
| Responsive Design | ✅ Done | Tailwind |
| Dark Mode Support | ✅ Done | dark: classes |
| Sidebar Update | ⏳ Pending | `sidebar.tsx` |

---

**Document Version**: 1.0  
**Created**: 2025-12-31  
**Author**: L-ERP MRP Architecture Team
