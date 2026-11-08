# RRI-T-E2E
## REVERSE REQUIREMENTS INTERVIEW — END-TO-END TESTING
### Phương pháp Kiểm thử Luồng Công việc Thực tế Toàn diện

> **Chuyên biệt cho:** L-ERP MRP (Manufacturing Resource Planning)
> **Evolved from:** RRI-T Methodology v1.0
> **Version:** 1.0 | March 2026

---

## 1. NGUỒN GỐC & TRIẾT LÝ

### 1.1 Vấn đề RRI-T chưa giải quyết

RRI-T kiểm thử từng module/feature độc lập. Trong vận hành thực tế:

| # | Điểm thiếu | Hệ quả | RRI-T-E2E bổ sung |
|---|-----------|--------|-------------------|
| 1 | Thiếu cross-module flow | Module A pass, B pass, A→B fail | Journey-based testing |
| 2 | Thiếu real-world scenarios | Test "happy path" nhưng miss edge cases | 50+ Chaos Scenarios |
| 3 | Không test data cascade | Thay đổi Part không test impact BOM→WO→PO | Ripple Effect Matrix |
| 4 | Thiếu concurrent workflows | User A tạo PO, User B approve, User C receive | Multi-actor Orchestration |
| 5 | Không test recovery paths | System works, but recovery after failure? | Resilience Testing |
| 6 | Không test state transitions | Object ở state X, valid transitions? | State Machine Verification |

### 1.2 Từ RRI-T đến RRI-T-E2E

```
RRI-T (Quality Verification)    →    RRI-T-E2E (Operational Verification)
"Chứng minh BUILD là ĐÚNG"      →    "Chứng minh CHẠY ĐƯỢC trong tay USER"
Single module focus             →    Cross-module journey focus
Feature works                   →    WORKFLOW works end-to-end
Test spec                       →    Test REAL LIFE scenarios
```

### 1.3 Định nghĩa "DONE" thực tế

**Không phải:**
- ✗ "Module pass unit test"
- ✗ "API return 200"
- ✗ "UI render đúng"

**Mà là:**
- ✓ "Nhân viên kho nhận hàng → QC pass → nhập kho → cấp cho sản xuất → KHÔNG CÓ LỖI"
- ✓ "Tạo BOM mới với 50 parts → 5 parts thiếu → auto tạo PO → consolidate → approve → KHÔNG CẦN MANUAL FIX"
- ✓ "Server restart lúc đang import 1000 dòng → resume đúng chỗ → KHÔNG MẤT DATA"

---

## 2. MÔ HÌNH 8 TESTING PERSONAS CHO MRP

### 2.1 Mở rộng từ 5 → 8 Personas (MRP-specific)

| Persona | Vai trò | Testing Focus | Real-world Mindset |
|---------|---------|---------------|-------------------|
| 👷 **Warehouse Staff** | Nhận/Xuất kho | Material flow, scanning, physical ops | "Tôi có 15 giây cho mỗi thao tác" |
| 🔬 **QC Inspector** | Kiểm tra chất lượng | Inspection flow, NCR, hold/release | "Mọi lỗi đều có hậu quả" |
| 📋 **Production Planner** | Lập kế hoạch SX | MRP, scheduling, capacity | "Kế hoạch thay đổi 10 lần/ngày" |
| 🛒 **Purchasing Officer** | Mua hàng | PO creation, supplier mgmt | "NCC không bao giờ giao đúng hẹn" |
| 👤 **Production Supervisor** | Giám sát SX | Work orders, shop floor | "Máy hỏng, thiếu người, deadline gấp" |
| 📊 **Finance Controller** | Kế toán | Costing, invoicing, reconciliation | "Mọi số phải khớp đến đồng" |
| 🛠️ **System Admin** | Vận hành IT | Backup, recovery, monitoring | "2AM server crash, sáng phải chạy" |
| 🎯 **Operations Manager** | Quản lý tổng thể | Cross-dept, reports, decisions | "Tôi cần nhìn big picture, ngay lập tức" |

### 2.2 Ma trận Persona × Workflow

| Workflow | 👷 | 🔬 | 📋 | 🛒 | 👤 | 📊 | 🛠️ | 🎯 |
|----------|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
| PO → Receive → QC → Stock | ●●● | ●●● | ● | ●●● | ● | ●● | ● | ●● |
| MRP → PO → Receive | ● | ● | ●●● | ●●● | ● | ●● | ● | ●● |
| WO → Issue → Produce → FG | ●●● | ●● | ●●● | ● | ●●● | ●● | ● | ●●● |
| NCR → Disposition → Scrap/Rework | ●● | ●●● | ● | ● | ●● | ●●● | ● | ●● |
| Backup → Restore → Verify | ● | ● | ● | ● | ● | ●●● | ●●● | ●● |

---

## 3. 12 LUỒNG CÔNG VIỆC E2E CHÍNH

### 3.1 Tổng quan

| # | Journey Name | Start → End | Actors | Critical? |
|---|-------------|-------------|--------|-----------|
| J1 | **Purchase-to-Stock** | PO Created → Material in MAIN | 🛒👷🔬 | 🔴 |
| J2 | **Plan-to-Produce** | Sales Order → Finished Goods | 📋👤👷 | 🔴 |
| J3 | **Stock-to-Ship** | Pick → Pack → Ship → Confirm | 👷📊 | 🔴 |
| J4 | **Quality-to-Disposition** | QC Fail → NCR → Resolution | 🔬👷📊 | 🔴 |
| J5 | **BOM-to-Costing** | New BOM → Cost Rollup → Price | 📋📊 | 🟡 |
| J6 | **Import-to-Production** | Excel Upload → Data in Use | 🛠️📋 | 🟡 |
| J7 | **Alert-to-Action** | Low Stock → PO Auto-created | 📋🛒 | 🟡 |
| J8 | **Failure-to-Recovery** | System Crash → Full Restore | 🛠️ | 🔴 |
| J9 | **Month-End-Close** | All transactions → Reports | 📊🎯 | 🔴 |
| J10 | **New-Part-Setup** | Part Created → Ready for Use | 📋🛒👷 | 🟡 |
| J11 | **Engineering-Change** | BOM Update → WO Impact | 📋👤 | 🟡 |
| J12 | **Multi-Actor-Conflict** | Concurrent Edits → Resolution | All | 🔴 |

---

## 4. JOURNEY J1: PURCHASE-TO-STOCK

### 4.1 Happy Path

```
┌─────────┐    ┌──────────┐    ┌──────────┐    ┌─────────┐    ┌──────────┐
│ Create  │───▶│ Approve  │───▶│ Receive  │───▶│ QC Pass │───▶│ In MAIN  │
│   PO    │    │   PO     │    │ at WH-   │    │         │    │   WH     │
│         │    │          │    │ RECEIVING│    │         │    │          │
└─────────┘    └──────────┘    └──────────┘    └─────────┘    └──────────┘
    🛒             🎯              👷             🔬             👷
```

### 4.2 Chaos Scenarios (50+ test cases)

#### 4.2.1 PO Creation Chaos

| ID | Scenario | Chaos Factor | Expected Behavior |
|----|----------|--------------|-------------------|
| J1-C01 | Create PO với part chưa có trong Master | 🔲 MISSING | Block + prompt tạo Part mới |
| J1-C02 | Create PO với supplier inactive | ❌ ERROR | Block + show "Supplier inactive" |
| J1-C03 | Create PO với 500 line items | 📊 DATA | Complete < 10s, pagination works |
| J1-C04 | Create PO khi đang offline | 🏗️ INFRA | Queue locally, sync when online |
| J1-C05 | Create 2 PO cùng supplier cùng lúc | 👥 COLLAB | Consolidation warning |
| J1-C06 | Create PO với giá = 0 | ❌ ERROR | Warning nhưng cho phép (sample) |
| J1-C07 | Create PO với lead time > 365 days | ⚠️ EDGE | Warning "Unusual lead time" |
| J1-C08 | Create PO trong tháng đã close | 📋 RULE | Block + "Period closed" |

#### 4.2.2 Receiving Chaos

| ID | Scenario | Chaos Factor | Expected Behavior |
|----|----------|--------------|-------------------|
| J1-C10 | Receive số lượng > PO | ⚠️ EDGE | Warning + allow with note |
| J1-C11 | Receive số lượng < PO (partial) | ✅ NORMAL | Mark partial, backorder created |
| J1-C12 | Receive với lot number đã tồn tại | ❌ ERROR | Block + "Lot exists, use different" |
| J1-C13 | Receive khi PO chưa approved | 📋 RULE | Block + "PO pending approval" |
| J1-C14 | Receive với expiry date < today | ⚠️ EDGE | Warning + require manager approval |
| J1-C15 | Receive khi WH-RECEIVING đầy | 🏗️ INFRA | Block + suggest alternative location |
| J1-C16 | Scan barcode không đúng PO | ❌ ERROR | "Item not in this PO" |
| J1-C17 | Receive 2 người cùng 1 PO line | 👥 COLLAB | Lock mechanism, second user wait |

#### 4.2.3 QC Chaos

| ID | Scenario | Chaos Factor | Expected Behavior |
|----|----------|--------------|-------------------|
| J1-C20 | QC FAIL toàn bộ shipment | ❌ ERROR | → QUARANTINE + NCR auto-created |
| J1-C21 | QC CONDITIONAL (cần review thêm) | ⚠️ EDGE | → HOLD + notification to manager |
| J1-C22 | QC PASS nhưng thiếu CoC | 📋 RULE | Warning "Missing certificate" |
| J1-C23 | QC sau 48h (quá SLA) | 🕐 TIME | Alert + escalation |
| J1-C24 | QC partial batch (10/100 pass) | ⚠️ EDGE | Split: 10→MAIN, 90→QUARANTINE |
| J1-C25 | QC khi inspector không có quyền | 🔐 SECURITY | Block + "Unauthorized" |

#### 4.2.4 Stock Movement Chaos

| ID | Scenario | Chaos Factor | Expected Behavior |
|----|----------|--------------|-------------------|
| J1-C30 | Move to MAIN khi location đầy | 🏗️ INFRA | Suggest alternative location |
| J1-C31 | Move khi đang có WO pending issue | 👥 COLLAB | Warning "Reserved for WO-xxx" |
| J1-C32 | Move với quantity > available | ❌ ERROR | Block + show available |
| J1-C33 | Move khi system backup running | 🏗️ INFRA | Complete nhưng có warning |

### 4.3 Test Case Format Q→A→R→P→T

```
═══════════════════════════════════════════════════════════════════════
ID:        J1-E2E-001
Journey:   Purchase-to-Stock (Happy Path)
Personas:  🛒 Purchasing → 🎯 Manager → 👷 Warehouse → 🔬 QC → 👷 Warehouse
═══════════════════════════════════════════════════════════════════════

Q: Từ lúc tạo PO đến lúc hàng vào kho MAIN, mất bao lâu và có bao nhiêu bước manual?

A: 5 bước chính, mỗi bước < 2 phút, tổng < 10 phút (không tính chờ approve)

R: REQ-E2E-001: PO-to-Stock workflow phải < 10 phút active time

P: P0

T: TEST CASE
   Precondition: 
   - Part "PART-1033" exists, active
   - Supplier "NCC-ABC" exists, active  
   - User has PO_CREATE, PO_APPROVE, WH_RECEIVE, QC_INSPECT permissions
   
   Steps:
   1. 🛒 Create PO: Supplier=NCC-ABC, Line: PART-1033 x 100 units
   2. Verify: PO status = DRAFT, inventory unchanged
   3. 🛒 Submit PO for approval
   4. Verify: PO status = PENDING_APPROVAL, notification sent to 🎯
   5. 🎯 Approve PO
   6. Verify: PO status = APPROVED
   7. 👷 Receive shipment: Lot=LOT-2026-001, Qty=100, Location=WH-RECEIVING
   8. Verify: Inventory +100 at WH-RECEIVING, LotTransaction logged
   9. 🔬 Perform QC Inspection: Result=PASS
   10. Verify: Auto-move to WH-MAIN initiated
   11. 👷 Confirm stock in WH-MAIN
   12. Verify: WH-RECEIVING=0, WH-MAIN=+100, full audit trail
   
   Expected:
   - Total time < 10 minutes (active operations only)
   - 5 manual steps: Create, Submit, Approve, Receive, Inspect
   - 2 auto steps: Move RECEIVING→MAIN, Notifications
   - 0 data entry errors required
   - Full audit trail: 7+ log entries
   
   Dimensions: D1 (UI/UX) + D2 (API) + D5 (Data Integrity)
   Stress: TIME (efficiency), COLLAB (multi-actor)

Result: [✅|❌|⚠️|🔲] [Notes]
═══════════════════════════════════════════════════════════════════════
```

---

## 5. JOURNEY J2: PLAN-TO-PRODUCE

### 5.1 Happy Path

```
┌──────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌──────────┐
│  Sales   │───▶│   MRP   │───▶│ Create  │───▶│ Issue   │───▶│ Report  │───▶│  Move    │
│  Order   │    │   Run   │    │  WO     │    │Material │    │Complete │    │  to FG   │
└──────────┘    └─────────┘    └─────────┘    └─────────┘    └─────────┘    └──────────┘
    🎯             📋             👤            👷             👤             👷
```

### 5.2 Chaos Scenarios

#### 5.2.1 BOM & Planning Chaos

| ID | Scenario | Chaos Factor | Expected Behavior |
|----|----------|--------------|-------------------|
| J2-C01 | BOM có part chưa có inventory | 🔲 MISSING | MRP tạo suggestion "BUY" |
| J2-C02 | BOM có sub-BOM chưa complete | 🔲 MISSING | Block + "BOM incomplete" |
| J2-C03 | BOM có circular reference | ❌ ERROR | Detect + block với message |
| J2-C04 | BOM có 100 levels deep | 📊 DATA | Handle, explosion < 5s |
| J2-C05 | Part trong BOM bị obsolete | ⚠️ EDGE | Warning + suggest alternate |
| J2-C06 | Multiple BOMs cho 1 product | 📋 RULE | Use active/default BOM |
| J2-C07 | BOM quantity = 0.001 (precision) | ⚠️ EDGE | Handle 6 decimal places |
| J2-C08 | BOM với scrap rate 50% | 📊 DATA | MRP calculate gross requirement |

#### 5.2.2 Material Issue Chaos

| ID | Scenario | Chaos Factor | Expected Behavior |
|----|----------|--------------|-------------------|
| J2-C10 | Issue khi stock không đủ | ❌ ERROR | Block + show shortage |
| J2-C11 | Issue từ HOLD warehouse | 📋 RULE | Block + "Material on hold" |
| J2-C12 | Issue với lot sắp hết hạn | ⚠️ EDGE | Warning + FIFO suggestion |
| J2-C13 | Issue khi WO chưa released | 📋 RULE | Block + "WO not released" |
| J2-C14 | Issue partial (100/200 needed) | ✅ NORMAL | Allow, track remaining |
| J2-C15 | Over-issue (vượt BOM qty) | ⚠️ EDGE | Warning + require reason |
| J2-C16 | Issue cùng part từ nhiều lots | ✅ NORMAL | FIFO automatic |
| J2-C17 | Issue khi lot đang QC hold | 📋 RULE | Block + "Lot pending QC" |

#### 5.2.3 Production Completion Chaos

| ID | Scenario | Chaos Factor | Expected Behavior |
|----|----------|--------------|-------------------|
| J2-C20 | Complete > planned qty | ⚠️ EDGE | Allow with warning, update WO |
| J2-C21 | Complete < planned (partial) | ✅ NORMAL | Track remaining, status update |
| J2-C22 | Complete với scrap > 0 | ✅ NORMAL | Record scrap, adjust cost |
| J2-C23 | Complete khi material chưa issue | 📋 RULE | Warning "No material issued" |
| J2-C24 | Complete với serial number | ✅ NORMAL | Validate uniqueness |
| J2-C25 | Complete và Final QC fail | ❌ ERROR | → QUARANTINE, NCR created |
| J2-C26 | Complete cùng lúc 2 operators | 👥 COLLAB | Lock, prevent double-count |

### 5.3 BOM Creation → Full Production Flow Test

```
═══════════════════════════════════════════════════════════════════════
ID:        J2-E2E-005
Journey:   New BOM → MRP → Multi-source Procurement → Production
Personas:  📋 Planner → 🛒 Purchasing → 👷 Warehouse → 👤 Supervisor
═══════════════════════════════════════════════════════════════════════

Q: Tạo BOM mới với 20 parts, 5 parts thiếu cần mua từ 3 NCC khác nhau. 
   System có tự động tạo PO và consolidate không?

A: MRP phải detect shortage, auto-generate suggestions grouped by supplier,
   và cho phép 1-click tạo consolidated POs.

R: REQ-E2E-015: MRP must auto-consolidate PO suggestions by supplier

P: P0

T: TEST CASE
   Precondition:
   - Product "DRONE-X1" exists
   - 20 parts prepared: 15 in stock, 5 short
   - 5 short parts mapped to 3 suppliers (A:2, B:2, C:1)
   
   Steps:
   1. 📋 Create new BOM for DRONE-X1 with 20 components
   2. Verify: BOM saved, all parts linked
   3. 📋 Run MRP for demand 100 units DRONE-X1
   4. Verify: MRP shows 5 BUY suggestions, grouped by supplier
      - Supplier A: 2 items, combined value
      - Supplier B: 2 items, combined value
      - Supplier C: 1 item
   5. 📋 Click "Create All POs" 
   6. Verify: 3 POs created (not 5), each with correct lines
   7. 🎯 Approve all 3 POs
   8. 👷 Receive all shipments, QC pass
   9. Verify: All 20 parts now available
   10. 👤 Create WO-001 for 100 units DRONE-X1
   11. 👷 Issue materials (all 20 parts)
   12. Verify: WIP inventory created, MAIN depleted
   13. 👤 Report completion: 100 units
   14. Verify: FG inventory +100, WIP consumed
   
   Expected:
   - PO consolidation: 3 POs (not 5) for 3 suppliers
   - MRP accuracy: Exact quantities per BOM
   - Material flow: MAIN → WIP → FG with full tracking
   - No manual calculation required
   - Total steps: 8 clicks (not counting data entry)
   
   Dimensions: D2 (API) + D5 (Data Integrity) + D7 (Edge Cases)
   Stress: DATA (multi-part), COLLAB (multi-supplier)

Result: [✅|❌|⚠️|🔲] [Notes]
═══════════════════════════════════════════════════════════════════════
```

---

## 6. JOURNEY J4: QUALITY-TO-DISPOSITION

### 6.1 NCR Flow Map

```
                                    ┌─────────────┐
                                    │    SCRAP    │───▶ WH-SCRAP → Dispose
                                    └─────────────┘
                                          ▲
                                          │
┌──────────┐    ┌──────────┐    ┌─────────┴───────┐
│ QC FAIL  │───▶│   NCR    │───▶│   DISPOSITION   │
└──────────┘    │ Created  │    │    Decision     │
     🔬         └──────────┘    └─────────────────┘
                                          │
                                    ┌─────┴─────┐
                              ┌─────┴─────┐     │
                              │           │     │
                        ┌─────▼─────┐ ┌───▼───┐ │
                        │  REWORK   │ │RETURN │ ▼
                        │  → WIP    │ │TO NCC │ USE_AS_IS
                        └───────────┘ └───────┘ → MAIN
```

### 6.2 NCR Chaos Scenarios

| ID | Scenario | Chaos Factor | Expected Behavior |
|----|----------|--------------|-------------------|
| J4-C01 | NCR với qty > inspection qty | ❌ ERROR | Block + "Qty exceeds inspected" |
| J4-C02 | NCR trên lot đã ship | ❌ ERROR | Block + "Lot already shipped" |
| J4-C03 | Scrap disposition nhưng qty high value | ⚠️ EDGE | Require manager approval |
| J4-C04 | Rework nhưng WIP không có capacity | ⚠️ EDGE | Warning + delay suggestion |
| J4-C05 | Return to vendor nhưng PO closed | 📋 RULE | Create debit note instead |
| J4-C06 | Use-as-is nhưng customer strict | 📋 RULE | Require customer waiver doc |
| J4-C07 | NCR cho lot span 2 PO receipts | ⚠️ EDGE | Split NCR per receipt |
| J4-C08 | Execute disposition khi NCR pending | 📋 RULE | Block + "NCR not approved" |
| J4-C09 | Scrap write-off > $10,000 | 📊 DATA | Multi-level approval required |
| J4-C10 | Multiple NCRs same root cause | ⚠️ EDGE | Suggest CAPA creation |

### 6.3 Full NCR → Scrap Disposal Test

```
═══════════════════════════════════════════════════════════════════════
ID:        J4-E2E-003
Journey:   QC Fail → NCR → Scrap → Write-off → Finance Impact
Personas:  🔬 QC → 📋 Planner → 🎯 Manager → 📊 Finance → 👷 Warehouse
═══════════════════════════════════════════════════════════════════════

Q: Một lot 100 units fail QC, cần scrap. Từ lúc QC fail đến lúc ghi nhận 
   write-off trong sổ, có bao nhiêu bước và thông tin có đồng bộ không?

A: 6 bước chính, tất cả inventory movements + financial entries phải tự động sync

R: REQ-E2E-045: NCR → Scrap flow must auto-sync inventory and finance

P: P0

T: TEST CASE
   Precondition:
   - Lot "LOT-2026-099" in WH-RECEIVING, qty=100, unit_cost=50 VND
   - QC inspection pending
   
   Steps:
   1. 🔬 Perform QC inspection: Result=FAIL, qty=100
   2. Verify: 
      - Inventory auto-moved to WH-QUARANTINE
      - NCR auto-created: NCR-2026-XXXX
      - Notification to 📋 Planner
   3. 📋 Review NCR, set disposition=SCRAP
   4. 🎯 Approve NCR disposition
   5. Verify: NCR status = APPROVED_FOR_SCRAP
   6. 👷 Navigate to Quality > Scrap page
   7. Verify: LOT-2026-099 appears in Scrap inventory
   8. 👷 Execute disposal: method=PHYSICAL_DESTRUCTION
   9. Verify:
      - WH-SCRAP qty = 0 (disposed)
      - ScrapDisposal record created
      - Write-off value = 100 × 50 = 5,000 VND
   10. 📊 Check Finance module
   11. Verify: Journal entry created for 5,000 VND write-off
   
   Expected:
   - Inventory path: RECEIVING → QUARANTINE → SCRAP → DISPOSED
   - 4 LotTransaction records (one per move)
   - 1 NCR record with full history
   - 1 ScrapDisposal record
   - 1 Journal entry (if finance enabled)
   - Write-off matches: inventory value = finance entry
   
   Dimensions: D5 (Data Integrity) + D2 (API) + D7 (Edge Cases)
   Stress: ERROR (recovery from quality failure)

Result: [✅|❌|⚠️|🔲] [Notes]
═══════════════════════════════════════════════════════════════════════
```

---

## 7. JOURNEY J8: FAILURE-TO-RECOVERY

### 7.1 System Failure Scenarios

| ID | Failure Type | Chaos Factor | Recovery Requirement |
|----|-------------|--------------|---------------------|
| J8-C01 | Server crash mid-transaction | 🏗️ INFRA | Transaction rollback, no partial data |
| J8-C02 | Database connection lost 5 min | 🏗️ INFRA | Queue operations, auto-retry |
| J8-C03 | Disk full during backup | 🏗️ INFRA | Alert + cleanup old files |
| J8-C04 | Network partition 10 min | 🏗️ INFRA | Offline mode, sync on reconnect |
| J8-C05 | Memory leak crash after 48h | 🏗️ INFRA | Auto-restart, preserve state |
| J8-C06 | SSL certificate expired | 🔐 SECURITY | Graceful failure, clear message |
| J8-C07 | Third-party API down | 🏗️ INFRA | Fallback, queue for retry |
| J8-C08 | Corrupted backup file | 🏗️ INFRA | Detect, use previous backup |

### 7.2 Backup → Restore → Verify Test

```
═══════════════════════════════════════════════════════════════════════
ID:        J8-E2E-001
Journey:   Full System Backup → Simulated Failure → Complete Restore
Personas:  🛠️ System Admin
═══════════════════════════════════════════════════════════════════════

Q: Nếu server crash lúc 2AM, sáng admin đến có thể restore trong bao lâu?
   Data loss tối đa bao nhiêu?

A: RTO < 15 phút, RPO < 24 giờ (với daily backup)

R: REQ-E2E-080: System must support RTO < 15m, RPO < 24h

P: P0

T: TEST CASE
   Precondition:
   - Production database with real data (or realistic test data)
   - Backup schedule configured: Daily at 2:00 AM
   - Last backup completed successfully
   
   Steps:
   1. 🛠️ Note current data state:
      - Count: Parts, POs, WOs, Inventory records
      - Checksum: Sum of inventory quantities
   2. 🛠️ Make some changes (simulate day's work):
      - Create 1 PO, 1 WO
      - Move some inventory
   3. 🛠️ Run manual backup
   4. Verify: Backup file created with correct timestamp and size
   5. 🛠️ Make MORE changes (simulate after-backup changes):
      - Create 1 more PO
      - Update 1 part
   6. 🛠️ Simulate disaster: Truncate all tables OR restore to new DB
   7. Start timer ⏱️
   8. 🛠️ Initiate restore from backup
   9. Verify restore process:
      - Progress indicator shown
      - No errors during restore
   10. Stop timer ⏱️
   11. Verify data integrity:
       - Counts match backup point
       - Checksum matches backup point
       - Changes AFTER backup ARE LOST (expected)
   
   Expected:
   - Restore time < 15 minutes
   - All data from backup point intact
   - Post-backup changes lost (acceptable per RPO)
   - Application fully functional after restore
   - User sessions require re-login
   
   Dimensions: D6 (Infrastructure) + D5 (Data Integrity)
   Stress: INFRA (disaster recovery)

Result: [✅|❌|⚠️|🔲] [Notes]
Time to restore: _____ minutes
Data loss: _____ hours
═══════════════════════════════════════════════════════════════════════
```

---

## 8. JOURNEY J12: MULTI-ACTOR CONFLICT

### 8.1 Concurrent Operation Scenarios

| ID | Scenario | Actors | Chaos Factor | Expected |
|----|----------|--------|--------------|----------|
| J12-C01 | 2 users edit same Part | 👤👤 | 👥 COLLAB | Last-write-wins + version warning |
| J12-C02 | 2 users approve same PO | 🎯🎯 | 👥 COLLAB | First wins, second sees "Already approved" |
| J12-C03 | User A create, User B delete same | 👤👤 | 👥 COLLAB | Delete blocked if created |
| J12-C04 | Issue material while MRP running | 👷📋 | 👥 COLLAB | MRP sees latest inventory |
| J12-C05 | Receive PO while PO being edited | 👷🛒 | 👥 COLLAB | Receive uses approved version |
| J12-C06 | 2 QC inspectors same lot | 🔬🔬 | 👥 COLLAB | First submits, second blocked |
| J12-C07 | Backup running while user editing | 🛠️👤 | 👥 COLLAB | Consistent backup snapshot |
| J12-C08 | Month-end close while transactions in-flight | 📊👤 | 👥 COLLAB | Block close until complete |

### 8.2 Race Condition Test

```
═══════════════════════════════════════════════════════════════════════
ID:        J12-E2E-002
Journey:   Simultaneous Inventory Operations
Personas:  👷 Warehouse A + 👷 Warehouse B (concurrent)
═══════════════════════════════════════════════════════════════════════

Q: Hai nhân viên kho cùng issue từ 1 lot chỉ còn 100 units. 
   Cả hai cần 80 units. System xử lý thế nào?

A: First-come-first-serve với real-time lock. Second user thấy "Only 20 available"

R: REQ-E2E-120: Concurrent inventory ops must prevent over-issue

P: P0

T: TEST CASE
   Precondition:
   - PART-1033 at WH-MAIN, Lot=LOT-001, Qty=100
   - Two browser sessions: User A, User B
   - Both have WH_ISSUE permission
   
   Steps:
   1. 👷A Open Material Issue page, select LOT-001
   2. 👷B Open Material Issue page, select LOT-001
   3. Verify: Both see "Available: 100"
   4. 👷A Enter qty=80, click Issue (do NOT submit yet)
   5. 👷B Enter qty=80, click Issue (do NOT submit yet)
   6. 👷A Submit
   7. Verify: 👷A sees success, LOT-001 now = 20
   8. 👷B Submit (within 2 seconds of A)
   9. Verify: 👷B sees error "Only 20 available, you requested 80"
   10. 👷B Changes qty to 20, submits
   11. Verify: 👷B succeeds, LOT-001 now = 0
   12. Check LotTransaction log
   
   Expected:
   - Total issued = 100 (not 160)
   - 2 transactions: 80 + 20
   - No race condition data corruption
   - User B gets clear feedback
   
   Dimensions: D7 (Edge Cases) + D5 (Data Integrity)
   Stress: COLLAB (concurrent operations)

Result: [✅|❌|⚠️|🔲] [Notes]
═══════════════════════════════════════════════════════════════════════
```

---

## 9. RIPPLE EFFECT MATRIX

### 9.1 Data Change Impact Map

Khi thay đổi data ở Module A, những module nào bị ảnh hưởng?

| Thay đổi | → Parts | → BOM | → Inventory | → PO | → WO | → MRP | → Finance |
|----------|:-------:|:-----:|:-----------:|:----:|:----:|:-----:|:---------:|
| Part unit_cost | — | — | ✓ value | ✓ value | ✓ cost | ✓ suggest | ✓ cost |
| Part lead_time | — | — | — | — | — | ✓ suggest | — |
| Part obsolete | ✓ status | ✓ warning | — | ✓ block | ✓ warning | ✓ exclude | — |
| BOM qty change | — | — | — | — | ✓ material | ✓ suggest | ✓ cost |
| Inventory adjust | — | — | — | — | — | ✓ suggest | ✓ value |
| PO price change | — | — | — | — | — | ✓ suggest | ✓ AP |
| WO complete | — | — | ✓ move | — | — | ✓ demand | ✓ WIP |
| Supplier inactive | — | — | — | ✓ block | — | ✓ suggest | ✓ AP |

### 9.2 Ripple Effect Test Template

```
═══════════════════════════════════════════════════════════════════════
ID:        RIPPLE-001
Trigger:   Part unit_cost changed from 100 → 150 VND
Impact Chain: Part → Inventory Value → BOM Cost → WO Cost → MRP Suggestion
═══════════════════════════════════════════════════════════════════════

Steps:
1. Note initial state:
   - Part PART-1033 cost = 100 VND
   - Inventory 1000 units → value = 100,000 VND
   - BOM "DRONE-X1" uses 5x PART-1033 → material cost = 500 VND per unit
   - WO-001 for 100 units DRONE-X1 → expected material cost = 50,000 VND
   
2. Update Part cost: 100 → 150 VND

3. Verify cascade effects:
   - [ ] Inventory value recalculated: 1000 × 150 = 150,000 VND
   - [ ] BOM cost updated: 5 × 150 = 750 VND per unit
   - [ ] WO-001 estimated cost updated: 100 × 750 = 75,000 VND
   - [ ] MRP suggestion prices use new cost
   - [ ] Finance reports reflect new valuation

4. Verify NO cascade (should not happen):
   - [ ] Historical transactions unchanged (cost at time of transaction)
   - [ ] Completed WO costs unchanged (already booked)
   - [ ] Paid invoices unchanged

Result: [✅|❌|⚠️|🔲] 
═══════════════════════════════════════════════════════════════════════
```

---

## 10. COVERAGE MATRIX

### 10.1 Journey × Dimension Coverage

| Journey | D1 UI | D2 API | D3 Perf | D4 Sec | D5 Data | D6 Infra | D7 Edge |
|---------|:-----:|:------:|:-------:|:------:|:-------:|:--------:|:-------:|
| J1 Purchase-to-Stock | ●●● | ●●● | ●● | ●● | ●●● | ●● | ●●● |
| J2 Plan-to-Produce | ●●● | ●●● | ●●● | ●● | ●●● | ●● | ●●● |
| J3 Stock-to-Ship | ●●● | ●●● | ●● | ●● | ●●● | ●● | ●●● |
| J4 Quality-Disposition | ●●● | ●●● | ●● | ●● | ●●● | ●● | ●●● |
| J5 BOM-to-Costing | ●● | ●●● | ●● | ● | ●●● | ● | ●●● |
| J6 Import-to-Production | ●●● | ●●● | ●●● | ●● | ●●● | ●● | ●●● |
| J7 Alert-to-Action | ●● | ●●● | ●● | ●● | ●●● | ●● | ●●● |
| J8 Failure-to-Recovery | ●● | ●●● | ●●● | ●●● | ●●● | ●●● | ●●● |
| J9 Month-End-Close | ●● | ●●● | ●● | ●● | ●●● | ●● | ●●● |
| J10 New-Part-Setup | ●●● | ●●● | ●● | ●● | ●●● | ● | ●●● |
| J11 Engineering-Change | ●● | ●●● | ●● | ●● | ●●● | ●● | ●●● |
| J12 Multi-Actor-Conflict | ●●● | ●●● | ●●● | ●●● | ●●● | ●● | ●●● |

### 10.2 Minimum Test Case Counts

| Journey | Min Test Cases | P0 | P1 | P2 |
|---------|---------------:|---:|---:|---:|
| J1 Purchase-to-Stock | 40 | 15 | 15 | 10 |
| J2 Plan-to-Produce | 50 | 20 | 20 | 10 |
| J3 Stock-to-Ship | 30 | 12 | 12 | 6 |
| J4 Quality-Disposition | 35 | 15 | 12 | 8 |
| J5 BOM-to-Costing | 20 | 8 | 8 | 4 |
| J6 Import-to-Production | 25 | 10 | 10 | 5 |
| J7 Alert-to-Action | 15 | 6 | 6 | 3 |
| J8 Failure-to-Recovery | 20 | 10 | 6 | 4 |
| J9 Month-End-Close | 25 | 10 | 10 | 5 |
| J10 New-Part-Setup | 20 | 8 | 8 | 4 |
| J11 Engineering-Change | 25 | 10 | 10 | 5 |
| J12 Multi-Actor-Conflict | 30 | 12 | 12 | 6 |
| **TOTAL** | **335** | **136** | **129** | **70** |

### 10.3 Release Gate Criteria

| Metric | 🟢 Release | 🟡 Conditional | 🔴 Block |
|--------|-----------|----------------|----------|
| P0 Pass Rate | ≥ 100% | 95-99% | < 95% |
| P1 Pass Rate | ≥ 95% | 85-94% | < 85% |
| P2 Pass Rate | ≥ 85% | 70-84% | < 70% |
| Critical Journeys (J1,J2,J4,J8) | All ≥ 95% | 1 < 95% | 2+ < 95% |
| Regression | 0 new failures | ≤ 2 new | > 2 new |

---

## 11. VIETNAMESE-SPECIFIC E2E TESTS

### 11.1 Localization Edge Cases

| ID | Scenario | Test Steps | Expected |
|----|----------|------------|----------|
| VN-01 | Part name với dấu dài | Part "Ống nhựa PVC Φ21mm loại đặc biệt" | No truncation, search works |
| VN-02 | Supplier name dấu đặc biệt | "Công ty TNHH Thép Không Gỉ Đại Việt" | Full name stored, sorted correctly |
| VN-03 | Currency formatting | Value 1234567890 | "1.234.567.890 ₫" |
| VN-04 | Date across timezone | Transaction at 23:30 GMT+7 | Shows correct date |
| VN-05 | PDF export với dấu | Export report with Vietnamese text | Dấu renders correctly |
| VN-06 | Excel import dấu | Import file with Vietnamese headers | Headers recognized |
| VN-07 | Search diacritics | Search "nguyen" | Finds "Nguyễn" |
| VN-08 | MST validation | MST "0312345678" vs "0312345678-001" | Both valid formats |

### 11.2 Vietnamese Business Rules

| Rule | Test | Expected |
|------|------|----------|
| Tết holiday | MRP forecast January | Account for 2-week shutdown |
| Government holidays | Lead time calculation | Skip 30/4, 2/9, etc. |
| Banking hours | Payment scheduling | Only Mon-Fri, exclude holidays |

---

## 12. EXECUTION PROTOCOL

### 12.1 Testing Phases

| Phase | Duration | Focus | Output |
|-------|----------|-------|--------|
| 1. Setup | 4 giờ | Environment, test data, accounts | Ready environment |
| 2. Journey Discovery | 8 giờ | Generate all test cases from 8 personas | 335+ test cases |
| 3. Happy Path | 8 giờ | Execute all happy path tests | Baseline established |
| 4. Chaos Testing | 16 giờ | Execute chaos scenarios | Issues discovered |
| 5. Regression | 4 giờ | Re-test after fixes | Verify fixes |
| 6. Report | 4 giờ | Coverage analysis, gap report | Release decision |
| **TOTAL** | **~44 giờ** | | |

### 12.2 Test Data Requirements

| Entity | Minimum Records | Notes |
|--------|----------------:|-------|
| Parts | 500 | Mix: raw, sub-assy, finished goods |
| BOMs | 50 | 5-level deep hierarchy |
| Suppliers | 20 | Mix: active, inactive, preferred |
| Customers | 10 | Mix: domestic, export |
| POs | 100 | Mix: all statuses |
| WOs | 100 | Mix: all statuses |
| Inventory | 2000 | Multiple lots per part |
| Users | 10 | One per persona role |

### 12.3 Defect Classification

| Severity | Definition | Example | SLA |
|----------|------------|---------|-----|
| S1 Critical | System unusable, data loss | Inventory shows wrong qty | Fix before release |
| S2 Major | Workflow blocked, workaround exists | Can't approve PO, must use API | Fix before release |
| S3 Minor | Inconvenient but works | Wrong label, misaligned UI | Fix in next sprint |
| S4 Trivial | Cosmetic | Typo in message | Fix when convenient |

---

## 13. PROMPT TEMPLATES CHO CLAUDE CODE

### 13.1 Journey Test Generation

```
ROLE: RRI-T-E2E Test Engineer
SYSTEM: L-ERP MRP (Manufacturing Resource Planning)
JOURNEY: [J1/J2/.../J12]

Hãy đóng vai [persona] và đặt 30 câu hỏi về journey [journey name].

Focus on:
1. Happy path completeness
2. Chaos scenarios (data, time, concurrent, error)
3. Recovery paths
4. Cross-module impacts

Format mỗi câu hỏi theo Q→A→R→P→T:
- Q: Câu hỏi từ góc nhìn [persona]
- A: Expected behavior
- R: Requirement
- P: Priority (P0/P1/P2)
- T: Full test case với Steps + Expected

Include Vietnamese-specific scenarios where relevant.
```

### 13.2 Chaos Scenario Discovery

```
ROLE: QA Destroyer + DevOps Tester combined
SYSTEM: L-ERP MRP
MODULE: [specific module]

Hãy tìm 20 kịch bản CHAOS có thể phá vỡ [module]:

Categories to explore:
1. Data extremes (null, empty, max, overflow)
2. Timing (race conditions, timeouts, slow network)
3. Concurrent access (2+ users same record)
4. State transitions (invalid state changes)
5. Infrastructure (DB down, disk full, memory leak)
6. Security (injection, bypass, abuse)
7. Recovery (partial failure, retry, rollback)

For each chaos scenario provide:
- Trigger condition
- Expected system behavior
- What COULD go wrong if not handled
- Test to verify
```

### 13.3 Ripple Effect Analysis

```
ROLE: Data Integrity Analyst
SYSTEM: L-ERP MRP
CHANGE: [specific data change]

Trace the ripple effect of [change]:

1. Direct impacts (same module)
2. Cross-module impacts (which modules affected)
3. Historical data impact (should past data change?)
4. Reporting impact (which reports affected)
5. Integration impact (external systems?)

For each impact provide:
- What changes
- What should NOT change
- Test to verify both
```

---

## 14. CÔNG THỨC THÀNH CÔNG RRI-T-E2E

```
JOURNEY THINKING × CHAOS MINDSET × DATA INTEGRITY × RECOVERY AWARENESS
(12 Journeys)      (50+ Scenarios)  (Ripple Matrix)   (Failure Tests)

=

OPERATIONAL QUALITY ASSURANCE
```

---

> **RRI-T-E2E Methodology v1.0**
> **Specialized for Manufacturing Systems**
> **Built for Vietnamese Enterprise Software**
> **Designed for L-ERP MRP Production Readiness**

---

## APPENDIX A: QUICK REFERENCE

### A.1 Journey Quick Reference

| Journey | Actors | Critical Path | Chaos Focus |
|---------|--------|---------------|-------------|
| J1 | 🛒🎯👷🔬 | PO→Receive→QC→Stock | Partial receipt, QC fail |
| J2 | 📋👤👷 | MRP→WO→Issue→Complete | BOM errors, material shortage |
| J3 | 👷📊 | Pick→Pack→Ship | Over-pick, partial ship |
| J4 | 🔬👷📊 | QC Fail→NCR→Dispose | Multi-disposition, high value |
| J8 | 🛠️ | Crash→Backup→Restore | Data loss, corruption |
| J12 | All | Concurrent ops | Race conditions |

### A.2 Persona Quick Reference

| Persona | Primary Journeys | Chaos Focus |
|---------|------------------|-------------|
| 👷 Warehouse | J1, J2, J3, J4 | Physical ops speed |
| 🔬 QC | J1, J4 | Inspection edge cases |
| 📋 Planner | J2, J5, J7 | MRP accuracy |
| 🛒 Purchasing | J1, J7 | Supplier chaos |
| 👤 Supervisor | J2 | Production interrupts |
| 📊 Finance | J4, J9 | Number accuracy |
| 🛠️ Admin | J8 | Infrastructure failure |
| 🎯 Manager | All | Cross-dept visibility |

### A.3 Dimension Quick Reference

| Dim | Focus | Key Metric |
|-----|-------|------------|
| D1 | UI/UX | Task completion time |
| D2 | API | Contract compliance |
| D3 | Performance | p95 response time |
| D4 | Security | 0 unauthorized access |
| D5 | Data | 100% integrity |
| D6 | Infrastructure | RTO < 15m |
| D7 | Edge Cases | Graceful handling |
