# L-ERP MRP CHAOS SIMULATION PACK
## Kịch bản Kiểm thử E2E Mô phỏng Môi trường Thực tế

> **Triết lý:** "Done" không phải khi code chạy, mà khi USER THẬT làm việc THẬT không gặp vấn đề
> **Phương pháp:** Đóng vai từng user, tưởng tượng MỌI THỨ có thể sai

---

# MEGA SCENARIO 1: NEW BOM WITH CASCADING COMPLEXITY

## Bối cảnh thực tế

**Tình huống:** Công ty RTR nhận đơn hàng sản xuất product mới "HERA-V2". Engineering team vừa hoàn thành thiết kế, cần:
- Tạo BOM mới với 47 parts
- 12 parts chưa có trong hệ thống (cần tạo mới)
- 8 parts nằm trong sub-BOM (BOM lồng nhau)
- 15 parts thiếu hàng, cần mua từ 6 nhà cung cấp khác nhau
- 3 parts chỉ có 1 nhà cung cấp (single-source risk)
- Deadline: 2 tuần

**Các user tham gia:**
- 👨‍💻 Kỹ sư thiết kế (tạo BOM)
- 📋 Planner (chạy MRP, lập kế hoạch)
- 🛒 Purchasing (tạo PO)
- 👷 Warehouse (nhận hàng, cấp vật tư)
- 👤 Production Supervisor (chạy sản xuất)

---

## PHASE 1: BOM CREATION CHAOS

### Scenario 1.1: Tạo BOM với Part chưa tồn tại

```
═══════════════════════════════════════════════════════════════════════════════
CHAOS-BOM-001: Engineer tạo BOM, reference part chưa có trong Master
═══════════════════════════════════════════════════════════════════════════════

👨‍💻 Kỹ sư (nội tâm): "Tôi có file Excel từ CAD, 47 dòng BOM. Paste vào hệ thống thôi."

BƯỚC THỰC HIỆN:
1. 👨‍💻 Navigate: Products → HERA-V2 → BOM → Create New
2. 👨‍💻 Click "Import from Excel"
3. 👨‍💻 Upload file BOM_HERA_V2.xlsx (47 rows)
4. Hệ thống phân tích...

KỊCH BẢN XẤU #1: 12 parts không tìm thấy
┌─────────────────────────────────────────────────────────────────────────────┐
│ ⚠️ Import Analysis                                                          │
│                                                                             │
│ Total rows: 47                                                              │
│ ✅ Matched: 35 parts                                                        │
│ ❌ Not found: 12 parts                                                      │
│                                                                             │
│ Unmatched parts:                                                            │
│   - MOTOR-BL-2806 (Row 5)                                                  │
│   - ESC-40A-V2 (Row 8)                                                     │
│   - FRAME-CF-V2 (Row 12)                                                   │
│   - ... 9 more                                                             │
│                                                                             │
│ Options:                                                                    │
│   [Create Missing Parts] [Skip & Continue] [Cancel]                        │
└─────────────────────────────────────────────────────────────────────────────┘

KIỂM TRA:
☐ Hệ thống PHẢI hiện rõ danh sách parts thiếu
☐ Có option tạo part mới ngay từ đây
☐ Nếu "Create Missing Parts":
   ☐ Form tạo part với data đã có từ Excel (tên, số lượng)
   ☐ Bắt buộc nhập: category, unit, lead time
   ☐ Sau khi tạo, tự động link vào BOM line
☐ Nếu "Skip & Continue":
   ☐ BOM lưu với 35 lines
   ☐ 12 lines marked as "Pending Part Creation"
   ☐ Warning banner trên BOM page
☐ KHÔNG ĐƯỢC crash hoặc mất data đã nhập

KẾT QUẢ: ☐ PASS | ☐ FAIL | ☐ PAINFUL | ☐ MISSING
NOTES: _______________________________________________________________
═══════════════════════════════════════════════════════════════════════════════
```

### Scenario 1.2: BOM với Sub-BOM Chưa Complete

```
═══════════════════════════════════════════════════════════════════════════════
CHAOS-BOM-002: BOM reference sub-assembly chưa có BOM riêng
═══════════════════════════════════════════════════════════════════════════════

👨‍💻 Kỹ sư: "HERA-V2 dùng module LANDING-GEAR-ASSY. Module này có BOM riêng không nhỉ?"

BƯỚC THỰC HIỆN:
1. 👨‍💻 Đang tạo BOM cho HERA-V2
2. 👨‍💻 Add line: Part = LANDING-GEAR-ASSY, Qty = 4
3. Hệ thống check...

KỊCH BẢN XẤU: LANDING-GEAR-ASSY là sub-assembly nhưng chưa có BOM

┌─────────────────────────────────────────────────────────────────────────────┐
│ ⚠️ Sub-Assembly Warning                                                     │
│                                                                             │
│ "LANDING-GEAR-ASSY" is marked as SUB_ASSEMBLY but has no BOM defined.      │
│                                                                             │
│ This means:                                                                 │
│ - MRP cannot explode requirements                                          │
│ - Cost rollup will be incomplete                                           │
│ - Production cannot issue materials                                        │
│                                                                             │
│ Options:                                                                    │
│   [Create BOM Now] [Mark as Purchased] [Continue Anyway]                   │
└─────────────────────────────────────────────────────────────────────────────┘

KIỂM TRA:
☐ System PHẢI detect sub-assembly without BOM
☐ Clear warning về hậu quả
☐ Option "Create BOM Now" opens BOM creation for sub-assy
☐ Option "Mark as Purchased" converts to BUY item
☐ Nếu "Continue Anyway":
   ☐ BOM saves với warning flag
   ☐ MRP sẽ treat as single item (không explode)
   ☐ Warning hiện ở mọi nơi dùng BOM này

THÊM CHAOS: Sub-assembly có BOM nhưng BOM đó CŨNG có sub-assembly chưa complete
→ Đệ quy detect đến level sâu nhất

KẾT QUẢ: ☐ PASS | ☐ FAIL | ☐ PAINFUL | ☐ MISSING
NOTES: _______________________________________________________________
═══════════════════════════════════════════════════════════════════════════════
```

### Scenario 1.3: BOM với Circular Reference

```
═══════════════════════════════════════════════════════════════════════════════
CHAOS-BOM-003: Circular reference do copy-paste lỗi
═══════════════════════════════════════════════════════════════════════════════

👨‍💻 Kỹ sư (vội vàng): "Copy BOM cũ sửa lại cho nhanh..."

BƯỚC THỰC HIỆN:
1. 👨‍💻 Copy BOM từ HERA-V1
2. 👨‍💻 Đổi tên product thành HERA-V2
3. 👨‍💻 Trong BOM, add line: Part = HERA-V2 (chính nó!)
4. Click Save

KỊCH BẢN XẤU: Tạo circular reference

┌─────────────────────────────────────────────────────────────────────────────┐
│ ❌ Error: Circular Reference Detected                                       │
│                                                                             │
│ Cannot save BOM. The following circular reference was found:               │
│                                                                             │
│ HERA-V2 → HERA-V2 (self-reference)                                         │
│                                                                             │
│ A product cannot contain itself in its BOM.                                │
│ Please remove the circular reference and try again.                        │
│                                                                             │
│ [OK]                                                                        │
└─────────────────────────────────────────────────────────────────────────────┘

THÊM CHAOS PHỨC TẠP HƠN:
- HERA-V2 → MODULE-A → MODULE-B → HERA-V2 (indirect circular)
- System phải detect qua NHIỀU level

KIỂM TRA:
☐ Block save với message rõ ràng
☐ Hiện ra ĐƯỜNG ĐI circular (A → B → C → A)
☐ Không mất data đã nhập
☐ Highlight dòng gây lỗi

KẾT QUẢ: ☐ PASS | ☐ FAIL | ☐ PAINFUL | ☐ MISSING
NOTES: _______________________________________________________________
═══════════════════════════════════════════════════════════════════════════════
```

### Scenario 1.4: BOM Version Conflict

```
═══════════════════════════════════════════════════════════════════════════════
CHAOS-BOM-004: Hai engineer cùng edit BOM
═══════════════════════════════════════════════════════════════════════════════

👨‍💻 Kỹ sư A: "Tôi update motor specs..."
👨‍💻 Kỹ sư B: "Tôi update frame specs..."
(Cả hai mở BOM cùng lúc)

BƯỚC THỰC HIỆN:
1. 👨‍💻A Opens BOM HERA-V2 at 9:00 AM
2. 👨‍💻B Opens same BOM at 9:01 AM
3. 👨‍💻A Changes Motor qty: 4 → 6
4. 👨‍💻A Saves at 9:10 AM ✅
5. 👨‍💻B Changes Frame qty: 1 → 2
6. 👨‍💻B Saves at 9:15 AM ❓

KỊCH BẢN XẤU: Edit conflict

┌─────────────────────────────────────────────────────────────────────────────┐
│ ⚠️ Version Conflict                                                         │
│                                                                             │
│ This BOM was modified by another user since you started editing.           │
│                                                                             │
│ Your version: Loaded at 9:01 AM                                            │
│ Current version: Modified by Engineer A at 9:10 AM                         │
│                                                                             │
│ Changes you will lose:                                                     │
│   - MOTOR-BL-2806: Qty changed 4 → 6                                       │
│                                                                             │
│ Your changes:                                                               │
│   - FRAME-CF-V2: Qty changed 1 → 2                                         │
│                                                                             │
│ Options:                                                                    │
│   [Merge Both] [Overwrite (Keep Mine)] [Discard (Keep Theirs)] [Review]   │
└─────────────────────────────────────────────────────────────────────────────┘

KIỂM TRA:
☐ Detect conflict trước khi save
☐ Show EXACTLY những gì khác
☐ Option merge thông minh (non-overlapping changes)
☐ Audit trail ghi nhận ai thay đổi gì

KẾT QUẢ: ☐ PASS | ☐ FAIL | ☐ PAINFUL | ☐ MISSING
NOTES: _______________________________________________________________
═══════════════════════════════════════════════════════════════════════════════
```

---

## PHASE 2: MRP EXPLOSION CHAOS

### Scenario 2.1: MRP với Multi-Level BOM

```
═══════════════════════════════════════════════════════════════════════════════
CHAOS-MRP-001: MRP explosion với BOM 5 levels, 200+ parts
═══════════════════════════════════════════════════════════════════════════════

📋 Planner: "Chạy MRP cho 100 units HERA-V2, deadline 2 tuần"

BƯỚC THỰC HIỆN:
1. 📋 Navigate: MRP → Run MRP
2. 📋 Select Product: HERA-V2
3. 📋 Demand: 100 units, Due: +14 days
4. 📋 Click "Run MRP"

KỊCH BẢN PHỨC TẠP:
- BOM 5 levels: HERA-V2 → Module → Sub-assy → Component → Raw material
- 200+ unique parts khi flatten
- 15 parts shortage
- 8 parts có multiple suppliers
- 3 parts single-source

┌─────────────────────────────────────────────────────────────────────────────┐
│ MRP Run Results: HERA-V2 × 100 units                                       │
│                                                                             │
│ Explosion: 5 levels, 247 part requirements                                 │
│ Processing time: 3.2 seconds                                               │
│                                                                             │
│ Summary:                                                                    │
│ ┌─────────────────────────────────────────────────────────────────────┐   │
│ │ ✅ Sufficient stock:  189 parts                                      │   │
│ │ ❌ Shortage:           43 parts (need to BUY)                        │   │
│ │ ⚠️ Long lead time:     12 parts (may miss deadline)                  │   │
│ │ 🔴 Single-source:       3 parts (risk)                               │   │
│ └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│ Suggested Actions:                                                         │
│ ┌─────────────────────────────────────────────────────────────────────┐   │
│ │ Supplier           │ Items │ Total Value  │ Lead Time │ Action      │   │
│ │────────────────────│───────│──────────────│───────────│─────────────│   │
│ │ NCC-MOTORS         │    8  │  45,000,000₫ │ 7 days    │ [Create PO] │   │
│ │ NCC-ELECTRONICS    │   12  │  23,000,000₫ │ 5 days    │ [Create PO] │   │
│ │ NCC-FRAME          │    5  │  67,000,000₫ │ 10 days ⚠️│ [Create PO] │   │
│ │ NCC-FASTENERS      │   18  │   2,500,000₫ │ 3 days    │ [Create PO] │   │
│ └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│ [Create All POs] [Review Details] [Export]                                 │
└─────────────────────────────────────────────────────────────────────────────┘

KIỂM TRA:
☐ MRP hoàn thành < 5 giây (performance)
☐ Explosion chính xác (check sample: Part X × BOM qty × demand = requirement)
☐ Netting đúng (requirement - on-hand - on-order = shortage)
☐ Suggestions grouped by supplier
☐ Lead time warning cho parts vượt deadline
☐ Single-source risk highlighted

KẾT QUẢ: ☐ PASS | ☐ FAIL | ☐ PAINFUL | ☐ MISSING
NOTES: _______________________________________________________________
Processing time: _____ seconds
═══════════════════════════════════════════════════════════════════════════════
```

### Scenario 2.2: Parts Shared Across Multiple Products

```
═══════════════════════════════════════════════════════════════════════════════
CHAOS-MRP-002: Cùng 1 part dùng cho nhiều sản phẩm, stock allocation conflict
═══════════════════════════════════════════════════════════════════════════════

📋 Planner: "MOTOR-BL-2806 dùng cho cả HERA-V2 và RAVEN-X1. Stock chỉ còn 50."

BƯỚC THỰC HIỆN:
1. 📋 MRP cho HERA-V2: cần 400 motors (100 units × 4 motors)
2. 📋 MRP cho RAVEN-X1: cần 200 motors (50 units × 4 motors)
3. Stock MOTOR-BL-2806: 50 units
4. Cả hai MRP chạy cùng ngày

KỊCH BẢN XẤU: Stock allocation conflict

┌─────────────────────────────────────────────────────────────────────────────┐
│ ⚠️ Shared Stock Warning                                                     │
│                                                                             │
│ Part MOTOR-BL-2806 is required by multiple demands:                        │
│                                                                             │
│ │ Demand           │ Required │ Allocated │ Shortage │ Priority │         │
│ │──────────────────│──────────│───────────│──────────│──────────│         │
│ │ HERA-V2 (100)    │    400   │     50    │    350   │ HIGH     │         │
│ │ RAVEN-X1 (50)    │    200   │      0    │    200   │ MEDIUM   │         │
│ │──────────────────│──────────│───────────│──────────│──────────│         │
│ │ TOTAL            │    600   │     50    │    550   │          │         │
│                                                                             │
│ Current stock: 50 units                                                    │
│ Allocation method: [FIFO by Due Date] ▼                                    │
│                                                                             │
│ Options:                                                                    │
│   [Auto-Allocate by Priority] [Manual Allocation] [Create Combined PO]    │
└─────────────────────────────────────────────────────────────────────────────┘

KIỂM TRA:
☐ System detect shared stock situation
☐ Show all demands using same part
☐ Clear allocation logic (FIFO, Priority, Manual)
☐ Prevent double-counting stock
☐ Combined PO option để mua tổng cộng

KẾT QUẢ: ☐ PASS | ☐ FAIL | ☐ PAINFUL | ☐ MISSING
NOTES: _______________________________________________________________
═══════════════════════════════════════════════════════════════════════════════
```

### Scenario 2.3: MRP với Parts Đang On-Order

```
═══════════════════════════════════════════════════════════════════════════════
CHAOS-MRP-003: Part đã có PO đang chờ giao, MRP phải trừ đi
═══════════════════════════════════════════════════════════════════════════════

📋 Planner: "MOTOR-BL-2806 đã đặt 200 units, delivery next week."

DATA:
- Stock: 50
- On-order (PO-2026-0123): 200 units, ETA 5 days
- Requirement: 400 units

BƯỚC THỰC HIỆN:
1. 📋 Run MRP
2. Check suggestion for MOTOR-BL-2806

EXPECTED:
- Requirement: 400
- On-hand: 50
- On-order: 200
- Net requirement: 400 - 50 - 200 = 150
- Suggestion: BUY 150 (not 350)

KIỂM TRA:
☐ MRP correctly nets on-order quantity
☐ Shows breakdown: demand - stock - on-order = suggestion
☐ Considers on-order delivery date vs demand date
☐ If on-order arrives AFTER demand date → still suggest buy

KỊCH BẢN XẤU THÊM:
- PO delivery date AFTER demand date
  → System should suggest: Expedite PO OR Buy additional

KẾT QUẢ: ☐ PASS | ☐ FAIL | ☐ PAINFUL | ☐ MISSING
NOTES: _______________________________________________________________
═══════════════════════════════════════════════════════════════════════════════
```

---

## PHASE 3: PO CONSOLIDATION CHAOS

### Scenario 3.1: Auto-Consolidate Multiple MRP Suggestions

```
═══════════════════════════════════════════════════════════════════════════════
CHAOS-PO-001: 15 MRP suggestions cho cùng supplier → 1 PO consolidated
═══════════════════════════════════════════════════════════════════════════════

🛒 Purchasing: "MRP suggest 15 parts từ NCC-ELECTRONICS. Tạo 1 PO hay 15 PO?"

BƯỚC THỰC HIỆN:
1. 🛒 Navigate: MRP → Suggestions
2. 🛒 Filter by Supplier: NCC-ELECTRONICS (15 items shown)
3. 🛒 Select All
4. 🛒 Click "Create PO"

KỊCH BẢN: Smart consolidation

┌─────────────────────────────────────────────────────────────────────────────┐
│ Create Purchase Order(s)                                                    │
│                                                                             │
│ Selected: 15 items from NCC-ELECTRONICS                                    │
│ Total value: 23,450,000₫                                                   │
│                                                                             │
│ Consolidation Options:                                                      │
│ ○ Single PO (15 lines)                                                     │
│ ○ Split by delivery date (3 POs)                                           │
│ ○ Split by product (HERA-V2: 10 lines, RAVEN-X1: 5 lines)                 │
│                                                                             │
│ ⚠️ Note: 3 items have different required dates:                            │
│    - PART-A, PART-B: Need by Mar 10                                        │
│    - PART-C: Need by Mar 15                                                │
│    - Others: Need by Mar 20                                                │
│                                                                             │
│ [Create Single PO] [Create Split POs] [Cancel]                             │
└─────────────────────────────────────────────────────────────────────────────┘

KIỂM TRA:
☐ Option consolidate thành 1 PO
☐ Option split theo logic (date, product, etc.)
☐ Warning nếu dates khác nhau
☐ Link tất cả PO lines về MRP suggestion gốc
☐ Clear audit trail: MRP → PO

KẾT QUẢ: ☐ PASS | ☐ FAIL | ☐ PAINFUL | ☐ MISSING
NOTES: _______________________________________________________________
═══════════════════════════════════════════════════════════════════════════════
```

### Scenario 3.2: Existing Draft PO for Same Supplier

```
═══════════════════════════════════════════════════════════════════════════════
CHAOS-PO-002: Đã có PO draft cho supplier, MRP suggest thêm items
═══════════════════════════════════════════════════════════════════════════════

🛒 Purchasing: "Hôm qua tôi đã tạo draft PO cho NCC-MOTORS. Hôm nay MRP suggest thêm 3 parts."

DATA:
- Existing: PO-2026-DRAFT-001 (NCC-MOTORS), 5 lines, status=DRAFT
- MRP suggests: 3 more parts from NCC-MOTORS

BƯỚC THỰC HIỆN:
1. 🛒 Select 3 MRP suggestions
2. 🛒 Click "Create PO"

KỊCH BẢN: Existing draft detected

┌─────────────────────────────────────────────────────────────────────────────┐
│ ⚠️ Existing Draft PO Found                                                  │
│                                                                             │
│ You have an existing draft PO for this supplier:                           │
│   PO-2026-DRAFT-001 (5 lines, 12,500,000₫)                                 │
│   Created: Yesterday by You                                                │
│                                                                             │
│ Options:                                                                    │
│ ○ Add to existing draft (+3 lines → 8 lines total)                         │
│ ○ Create new PO (will have 2 draft POs for same supplier)                  │
│                                                                             │
│ [Add to Existing] [Create New] [View Existing PO]                          │
└─────────────────────────────────────────────────────────────────────────────┘

KIỂM TRA:
☐ Detect existing draft PO cùng supplier
☐ Option add vào existing
☐ Nếu add: PO updated, audit log shows addition
☐ Nếu create new: Warning about multiple drafts
☐ MRP suggestion linked correctly

KẾT QUẢ: ☐ PASS | ☐ FAIL | ☐ PAINFUL | ☐ MISSING
NOTES: _______________________________________________________________
═══════════════════════════════════════════════════════════════════════════════
```

### Scenario 3.3: Supplier Min Order Value Not Met

```
═══════════════════════════════════════════════════════════════════════════════
CHAOS-PO-003: PO value < supplier minimum order value
═══════════════════════════════════════════════════════════════════════════════

🛒 Purchasing: "NCC-FASTENERS yêu cầu min order 5,000,000₫, tôi chỉ cần 1,500,000₫"

DATA:
- Supplier: NCC-FASTENERS, min_order_value = 5,000,000₫
- MRP suggestion: 1,500,000₫ worth of parts

BƯỚC THỰC HIỆN:
1. 🛒 Create PO from MRP suggestion
2. Total = 1,500,000₫

┌─────────────────────────────────────────────────────────────────────────────┐
│ ⚠️ Minimum Order Value Not Met                                              │
│                                                                             │
│ Supplier minimum: 5,000,000₫                                               │
│ Your order:       1,500,000₫                                               │
│ Shortfall:        3,500,000₫                                               │
│                                                                             │
│ Options:                                                                    │
│ 1. Add more items (view other parts from this supplier)                    │
│ 2. Proceed anyway (may incur small order surcharge)                        │
│ 3. Wait and consolidate with future orders                                 │
│                                                                             │
│ Other parts available from NCC-FASTENERS:                                  │
│ │ Part          │ Current Stock │ Reorder Point │ Suggested Qty │         │
│ │───────────────│───────────────│───────────────│───────────────│         │
│ │ SCREW-M3x10   │     500       │     200       │     300       │         │
│ │ NUT-M4        │     200       │     100       │     150       │         │
│ │ WASHER-M5     │     100       │      50       │     100       │         │
│                                                                             │
│ [Add Suggested Items] [Proceed Anyway] [Cancel]                            │
└─────────────────────────────────────────────────────────────────────────────┘

KIỂM TRA:
☐ Check min order value khi tạo PO
☐ Suggest thêm items để đạt min
☐ Show items có thể order thêm (stock replenishment)
☐ Allow proceed với warning
☐ Record note về small order

KẾT QUẢ: ☐ PASS | ☐ FAIL | ☐ PAINFUL | ☐ MISSING
NOTES: _______________________________________________________________
═══════════════════════════════════════════════════════════════════════════════
```

---

## PHASE 4: RECEIVING & ALLOCATION CHAOS

### Scenario 4.1: Receive Parts for Multiple WOs

```
═══════════════════════════════════════════════════════════════════════════════
CHAOS-RECV-001: PO có parts dùng cho nhiều Work Orders, allocation khi receive
═══════════════════════════════════════════════════════════════════════════════

👷 Warehouse: "Nhận 200 MOTOR-BL-2806, nhưng WO-001 cần 150, WO-002 cần 100. Chia sao?"

DATA:
- Receiving: 200 motors
- WO-001 (HERA-V2): needs 150, shortage flagged
- WO-002 (RAVEN-X1): needs 100, shortage flagged
- Total need: 250, receiving: 200, shortfall: 50

BƯỚC THỰC HIỆN:
1. 👷 Receive PO: 200 motors
2. System detects multiple demands

┌─────────────────────────────────────────────────────────────────────────────┐
│ 📦 Allocation Required                                                      │
│                                                                             │
│ Received: 200 units of MOTOR-BL-2806                                       │
│ Total demand: 250 units (shortage: 50)                                     │
│                                                                             │
│ Pending Work Orders:                                                        │
│ │ WO          │ Product   │ Need │ Priority │ Due Date  │ Allocate │      │
│ │─────────────│───────────│──────│──────────│───────────│──────────│      │
│ │ WO-001      │ HERA-V2   │ 150  │ HIGH     │ Mar 15    │ [150]    │      │
│ │ WO-002      │ RAVEN-X1  │ 100  │ MEDIUM   │ Mar 20    │ [50]     │      │
│ │─────────────│───────────│──────│──────────│───────────│──────────│      │
│ │ TOTAL       │           │ 250  │          │           │ 200      │      │
│                                                                             │
│ Allocation method: [Priority + Due Date] ▼                                 │
│                                                                             │
│ Note: WO-002 will have 50 units pending (create PO suggestion?)            │
│                                                                             │
│ [Confirm Allocation] [Manual Override] [Receive All to Stock]              │
└─────────────────────────────────────────────────────────────────────────────┘

KIỂM TRA:
☐ Detect pending demands khi receive
☐ Smart allocation (priority, date)
☐ Option manual override
☐ Clear what remains unfulfilled
☐ Auto-create MRP suggestion for shortage

KẾT QUẢ: ☐ PASS | ☐ FAIL | ☐ PAINFUL | ☐ MISSING
NOTES: _______________________________________________________________
═══════════════════════════════════════════════════════════════════════════════
```

### Scenario 4.2: Receive Wrong Quantity from Supplier

```
═══════════════════════════════════════════════════════════════════════════════
CHAOS-RECV-002: Supplier giao 180 thay vì 200 (short shipment)
═══════════════════════════════════════════════════════════════════════════════

👷 Warehouse: "PO ghi 200, thùng hàng chỉ có 180. Làm sao?"

BƯỚC THỰC HIỆN:
1. 👷 Open PO-2026-0456 to receive
2. 👷 Count actual: 180 (PO says 200)
3. 👷 Enter Qty = 180

┌─────────────────────────────────────────────────────────────────────────────┐
│ ⚠️ Quantity Mismatch                                                        │
│                                                                             │
│ PO Line: MOTOR-BL-2806                                                     │
│ Ordered:  200 units                                                        │
│ Received: 180 units                                                        │
│ Short:     20 units                                                        │
│                                                                             │
│ This is a SHORT SHIPMENT. What would you like to do?                       │
│                                                                             │
│ ○ Receive 180 now, keep PO open for remaining 20                           │
│ ○ Receive 180 now, cancel remaining 20                                     │
│ ○ Reject shipment (do not receive)                                         │
│                                                                             │
│ Additional actions:                                                         │
│ ☐ Create supplier claim / discrepancy report                               │
│ ☐ Flag supplier performance                                                │
│ ☐ Email supplier about short shipment                                      │
│                                                                             │
│ [Confirm] [Cancel]                                                          │
└─────────────────────────────────────────────────────────────────────────────┘

KIỂM TRA:
☐ Detect quantity mismatch
☐ Clear options: partial receive, keep open, cancel remainder
☐ Option to create claim
☐ Supplier performance tracking
☐ PO status: PARTIALLY_RECEIVED

KẾT QUẢ: ☐ PASS | ☐ FAIL | ☐ PAINFUL | ☐ MISSING
NOTES: _______________________________________________________________
═══════════════════════════════════════════════════════════════════════════════
```

### Scenario 4.3: Receive Part That's Different from Ordered

```
═══════════════════════════════════════════════════════════════════════════════
CHAOS-RECV-003: Supplier giao part khác (wrong part substitution)
═══════════════════════════════════════════════════════════════════════════════

👷 Warehouse: "Đặt MOTOR-BL-2806, nhận được MOTOR-BL-2806-V2 (version mới). Có tương thích không?"

BƯỚC THỰC HIỆN:
1. 👷 Scan barcode: MOTOR-BL-2806-V2
2. System lookup: Part not in PO

┌─────────────────────────────────────────────────────────────────────────────┐
│ ❓ Part Not in Purchase Order                                               │
│                                                                             │
│ Scanned: MOTOR-BL-2806-V2                                                  │
│ Expected: MOTOR-BL-2806                                                    │
│                                                                             │
│ This part is not in PO-2026-0456.                                          │
│                                                                             │
│ Possible reasons:                                                          │
│ 1. Supplier substituted with newer version                                 │
│ 2. Wrong item shipped                                                      │
│ 3. Part number updated in system                                           │
│                                                                             │
│ System found:                                                               │
│ ✓ MOTOR-BL-2806-V2 exists in Part Master                                   │
│ ✓ MOTOR-BL-2806-V2 is marked as ALTERNATE for MOTOR-BL-2806               │
│                                                                             │
│ Options:                                                                    │
│ ○ Accept substitution (receive as MOTOR-BL-2806-V2)                        │
│ ○ Receive as original part (MOTOR-BL-2806) with note                       │
│ ○ Reject and return to supplier                                            │
│                                                                             │
│ [Confirm] [Cancel]                                                          │
└─────────────────────────────────────────────────────────────────────────────┘

KIỂM TRA:
☐ Detect part mismatch
☐ Check alternate parts relationship
☐ Option accept substitution
☐ Engineering approval required (if configured)
☐ Full traceability maintained

KẾT QUẢ: ☐ PASS | ☐ FAIL | ☐ PAINFUL | ☐ MISSING
NOTES: _______________________________________________________________
═══════════════════════════════════════════════════════════════════════════════
```

---

## PHASE 5: PRODUCTION MATERIAL SHORTAGE CHAOS

### Scenario 5.1: Material Issue khi Stock Bị Lock bởi QC

```
═══════════════════════════════════════════════════════════════════════════════
CHAOS-PROD-001: Cần issue material nhưng lot đang pending QC
═══════════════════════════════════════════════════════════════════════════════

👤 Supervisor: "WO cần 100 motors. Inventory hiện 150, nhưng 120 đang QC hold!"

DATA:
- Total inventory: 150 motors
- In WH-MAIN: 30
- In WH-HOLD (pending QC): 120
- WO-001 needs: 100

BƯỚC THỰC HIỆN:
1. 👤 Open WO-001
2. 👤 Click "Issue Materials"
3. System calculates availability

┌─────────────────────────────────────────────────────────────────────────────┐
│ ⚠️ Insufficient Available Stock                                             │
│                                                                             │
│ Part: MOTOR-BL-2806                                                        │
│ Required: 100 units                                                        │
│                                                                             │
│ Stock breakdown:                                                            │
│ │ Location       │ Qty  │ Status        │ Available │                     │
│ │────────────────│──────│───────────────│───────────│                     │
│ │ WH-MAIN        │  30  │ Available     │    30     │                     │
│ │ WH-HOLD        │ 120  │ Pending QC ⏳ │     0     │                     │
│ │ WH-QUARANTINE  │   0  │ -             │     0     │                     │
│ │────────────────│──────│───────────────│───────────│                     │
│ │ TOTAL          │ 150  │               │    30     │                     │
│                                                                             │
│ Options:                                                                    │
│ 1. Issue 30 now, wait for QC release (remaining 70)                        │
│ 2. Expedite QC inspection (notify QC team)                                 │
│ 3. Wait for full quantity                                                  │
│                                                                             │
│ QC pending items:                                                          │
│ - LOT-2026-099: 120 units, received 2 hours ago                           │
│   [Request Expedite QC]                                                    │
│                                                                             │
│ [Issue Partial (30)] [Wait] [Request Expedite]                             │
└─────────────────────────────────────────────────────────────────────────────┘

KIỂM TRA:
☐ Show stock breakdown by availability
☐ Clear why stock unavailable
☐ Option partial issue
☐ Option expedite QC (với notification)
☐ WO tracks remaining material need

KẾT QUẢ: ☐ PASS | ☐ FAIL | ☐ PAINFUL | ☐ MISSING
NOTES: _______________________________________________________________
═══════════════════════════════════════════════════════════════════════════════
```

### Scenario 5.2: Production Complete nhưng Thiếu 1 Component

```
═══════════════════════════════════════════════════════════════════════════════
CHAOS-PROD-002: Sản xuất xong 100 units nhưng BOM có 1 part chưa issue đủ
═══════════════════════════════════════════════════════════════════════════════

👤 Supervisor: "Lắp xong 100 products rồi. Báo complete thôi!"

DATA:
- WO-001: 100 units HERA-V2
- BOM: 47 components
- 46 components issued fully
- SCREW-M3x10: Required 400, Issued 350 (short 50)

BƯỚC THỰC HIỆN:
1. 👤 Open WO-001
2. 👤 Click "Report Completion"
3. 👤 Enter: Completed = 100

┌─────────────────────────────────────────────────────────────────────────────┐
│ ⚠️ Material Variance Detected                                               │
│                                                                             │
│ You are completing 100 units, but material issue is incomplete:            │
│                                                                             │
│ │ Component     │ Required │ Issued │ Variance │ Status    │              │
│ │───────────────│──────────│────────│──────────│───────────│              │
│ │ SCREW-M3x10   │    400   │   350  │    -50   │ ❌ SHORT  │              │
│ │ (46 others)   │     OK   │    OK  │     0    │ ✅ OK     │              │
│                                                                             │
│ This could mean:                                                           │
│ 1. Forgot to issue remaining 50 screws                                     │
│ 2. Used less than BOM (process improvement?)                               │
│ 3. Part substitution occurred                                              │
│                                                                             │
│ Options:                                                                    │
│ ○ Issue remaining 50 now (if in stock)                                     │
│ ○ Record as negative variance (used less than BOM)                         │
│ ○ Block until resolved                                                     │
│                                                                             │
│ Reason required: [___________________________________________]              │
│                                                                             │
│ [Issue Remaining] [Record Variance] [Cancel]                               │
└─────────────────────────────────────────────────────────────────────────────┘

KIỂM TRA:
☐ Detect material variance at completion
☐ Show exactly which parts have variance
☐ Require reason/explanation
☐ Option to issue remaining
☐ Cost variance tracked

KẾT QUẢ: ☐ PASS | ☐ FAIL | ☐ PAINFUL | ☐ MISSING
NOTES: _______________________________________________________________
═══════════════════════════════════════════════════════════════════════════════
```

---

## PHASE 6: ENGINEERING CHANGE CHAOS

### Scenario 6.1: BOM Change While WO In Progress

```
═══════════════════════════════════════════════════════════════════════════════
CHAOS-ECO-001: Engineering thay đổi BOM khi WO đang chạy
═══════════════════════════════════════════════════════════════════════════════

👨‍💻 Kỹ sư: "Phát hiện motor cũ có vấn đề. Đổi sang MOTOR-BL-2810 mới."

DATA:
- WO-001: HERA-V2 × 100, status=IN_PROGRESS
- Materials issued: 50% complete
- Old BOM: MOTOR-BL-2806 × 4
- New BOM: MOTOR-BL-2810 × 4

BƯỚC THỰC HIỆN:
1. 👨‍💻 Edit BOM HERA-V2
2. 👨‍💻 Replace MOTOR-BL-2806 with MOTOR-BL-2810
3. 👨‍💻 Save

┌─────────────────────────────────────────────────────────────────────────────┐
│ ⚠️ BOM Change Impact Analysis                                               │
│                                                                             │
│ You are modifying the BOM while Work Orders are in progress:               │
│                                                                             │
│ Affected Work Orders:                                                       │
│ │ WO          │ Status      │ Progress │ Material Issued │ Impact        │ │
│ │─────────────│─────────────│──────────│─────────────────│───────────────│ │
│ │ WO-001      │ IN_PROGRESS │   50%    │ MOTOR-BL-2806   │ ⚠️ AFFECTED   │ │
│ │             │             │          │ (200 issued)    │               │ │
│ │ WO-002      │ PLANNED     │    0%    │ None            │ ✅ Will use   │ │
│ │             │             │          │                 │ new BOM       │ │
│                                                                             │
│ Options:                                                                    │
│ 1. Apply to new WOs only (WO-001 continues with old BOM)                   │
│ 2. Apply to all (WO-001 must return issued material & re-issue)            │
│ 3. Cancel change                                                           │
│                                                                             │
│ Engineering Change Order required? [Yes - Create ECO]                       │
│                                                                             │
│ [Apply New WOs Only] [Apply All WOs] [Create ECO First] [Cancel]           │
└─────────────────────────────────────────────────────────────────────────────┘

KIỂM TRA:
☐ Detect WOs using this BOM
☐ Show impact analysis
☐ Option for gradual rollout
☐ ECO workflow integration
☐ Material return tracking if applied to in-progress WO

KẾT QUẢ: ☐ PASS | ☐ FAIL | ☐ PAINFUL | ☐ MISSING
NOTES: _______________________________________________________________
═══════════════════════════════════════════════════════════════════════════════
```

---

## MEGA SCENARIO VERIFICATION CHECKLIST

### Full End-to-End Flow Check

```
═══════════════════════════════════════════════════════════════════════════════
MEGA-E2E-001: New BOM → MRP → Multi-PO → Receive → QC → Issue → Produce
═══════════════════════════════════════════════════════════════════════════════

Execute in sequence, checking data integrity at each step:

STEP 1: BOM CREATION
☐ Create product HERA-V2
☐ Create BOM with 47 components
☐ Handle 12 missing parts (create on the fly)
☐ Handle 3 sub-assemblies (create nested BOMs)
☐ Verify: BOM complete, all parts linked

STEP 2: MRP RUN
☐ Run MRP for 100 units, due in 14 days
☐ Verify explosion: 47 × qty × 100 = correct requirements
☐ Verify netting: requirement - stock - on-order = suggestion
☐ Verify grouping: suggestions grouped by supplier
☐ Count suggestions: ___ parts, ___ suppliers

STEP 3: PO CREATION
☐ Create consolidated POs (1 per supplier)
☐ Verify total value matches MRP suggestions
☐ Submit for approval
☐ Approve all POs
☐ Verify: All PO status = APPROVED

STEP 4: RECEIVING
☐ Receive first PO (simulate partial delivery)
☐ Receive remaining POs
☐ Verify: PO status = RECEIVED or PARTIALLY_RECEIVED
☐ Verify: Inventory increased in WH-RECEIVING
☐ Check: Allocation to waiting WOs

STEP 5: QC INSPECTION
☐ QC all received lots
☐ 1 lot: PASS → move to MAIN
☐ 1 lot: CONDITIONAL → move to HOLD
☐ 1 lot: FAIL → move to QUARANTINE, NCR created
☐ Verify: Inventory in correct warehouses

STEP 6: HOLD RESOLUTION
☐ Review HOLD item
☐ Release to MAIN
☐ Verify: Available for production

STEP 7: NCR DISPOSITION
☐ Open NCR for FAIL lot
☐ Disposition: SCRAP
☐ Execute scrap
☐ Verify: Inventory disposed, write-off recorded

STEP 8: WORK ORDER CREATION
☐ Create WO-001 for 100 units HERA-V2
☐ Verify: Material requirements calculated
☐ Release WO

STEP 9: MATERIAL ISSUE
☐ Issue all materials
☐ Verify: Inventory moved to WIP
☐ Handle any shortage

STEP 10: PRODUCTION COMPLETION
☐ Report completion: 95 good, 5 scrap
☐ Verify: FG inventory +95
☐ Verify: Scrap recorded
☐ Verify: WO status = COMPLETED

STEP 11: FINAL QC
☐ QC finished goods
☐ PASS: Move to FG warehouse
☐ Verify: Ready for shipment

DATA INTEGRITY FINAL CHECK:
☐ Inventory total reconciles (starting + received - issued - scrap = ending)
☐ All transactions have audit trail
☐ All costs calculated correctly
☐ No orphan records

═══════════════════════════════════════════════════════════════════════════════
OVERALL RESULT: ☐ PASS | ☐ FAIL

Time to complete: _____ hours
Issues found: _____ 
Critical bugs: _____
═══════════════════════════════════════════════════════════════════════════════
```

---

## EXECUTION NOTES

### Test Environment Requirements

```
- Full dataset: 500+ parts, 50+ BOMs, 20+ suppliers
- Multiple user accounts with different roles
- 2 browser sessions for concurrent testing
- Network throttling tool for slow connection tests
- Database access for data verification
```

### Severity Classification

| Level | Definition | Action |
|-------|------------|--------|
| S1 | Data loss, wrong calculation, blocked workflow | STOP. Fix immediately |
| S2 | Workaround exists but painful | Fix before production |
| S3 | Minor inconvenience | Fix in next sprint |
| S4 | Cosmetic | When time permits |

### Test Execution Order

1. **Week 1:** BOM & MRP scenarios (CHAOS-BOM-*, CHAOS-MRP-*)
2. **Week 2:** PO & Receiving scenarios (CHAOS-PO-*, CHAOS-RECV-*)  
3. **Week 3:** Production & NCR scenarios (CHAOS-PROD-*, NCR-*)
4. **Week 4:** Mega E2E + Regression

---

> **L-ERP MRP Chaos Simulation Pack v1.0**
> **50+ Chaos Scenarios**
> **Designed to Break the System Before Users Do**
