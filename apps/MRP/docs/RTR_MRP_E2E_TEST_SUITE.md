# L-ERP MRP E2E TEST SUITE
## Bộ Kiểm thử Luồng Công việc Thực tế

> **Based on:** RRI-T-E2E Methodology
> **Target:** L-ERP MRP v1.0
> **Total Test Cases:** 150+
> **Estimated Execution Time:** 40-50 giờ

---

## TEST SUITE OVERVIEW

| Journey | Test Cases | P0 | P1 | P2 | Status |
|---------|:----------:|:--:|:--:|:--:|:------:|
| J1: Purchase-to-Stock | 35 | 15 | 12 | 8 | ⬜ |
| J2: Plan-to-Produce | 40 | 18 | 14 | 8 | ⬜ |
| J3: Stock-to-Ship | 20 | 8 | 8 | 4 | ⬜ |
| J4: Quality-Disposition | 25 | 12 | 8 | 5 | ⬜ |
| J8: Failure-Recovery | 15 | 8 | 5 | 2 | ⬜ |
| J12: Multi-Actor | 15 | 8 | 5 | 2 | ⬜ |
| **TOTAL** | **150** | **69** | **52** | **29** | |

---

# SECTION 1: JOURNEY J1 — PURCHASE-TO-STOCK

## 1.1 HAPPY PATH TESTS

### J1-HP-001: Complete PO Cycle (Single Line)
```
Priority: P0
Personas: 🛒 Purchasing → 🎯 Manager → 👷 Warehouse → 🔬 QC

Preconditions:
- Part "PART-1033" exists, status=ACTIVE
- Supplier "NCC-ABC" exists, status=ACTIVE
- User has roles: PO_CREATE, PO_APPROVE, WH_RECEIVE, QC_INSPECT
- WH-RECEIVING has available capacity

Steps:
1. Login as Purchasing Officer
2. Navigate: Purchase Orders → New PO
3. Select Supplier: NCC-ABC
4. Add Line: Part=PART-1033, Qty=100, Unit Price=50 VND
5. Save as Draft
   ☐ Verify: PO status = DRAFT
   ☐ Verify: PO number generated (format: PO-YYYY-XXXX)
6. Submit for Approval
   ☐ Verify: Status = PENDING_APPROVAL
   ☐ Verify: Notification sent to Manager
7. Login as Manager
8. Navigate: Approvals → Pending
   ☐ Verify: PO visible in approval queue
9. Approve PO
   ☐ Verify: Status = APPROVED
10. Login as Warehouse Staff
11. Navigate: Receiving → Receive PO
12. Select PO, enter: Lot=LOT-2026-001, Qty=100
13. Confirm Receipt
    ☐ Verify: Inventory created at WH-RECEIVING
    ☐ Verify: LotTransaction logged (type=PO_RECEIPT)
14. Login as QC Inspector
15. Navigate: Quality → Pending Inspection
    ☐ Verify: LOT-2026-001 appears
16. Perform Inspection: Result=PASS
17. Submit Inspection
    ☐ Verify: Auto-move to WH-MAIN initiated
    ☐ Verify: WH-RECEIVING qty = 0
    ☐ Verify: WH-MAIN qty = 100
18. Navigate: Inventory → WH-MAIN
    ☐ Verify: PART-1033, LOT-2026-001, Qty=100 visible

Expected Results:
- [ ] PO lifecycle: DRAFT → PENDING → APPROVED → PARTIALLY_RECEIVED → CLOSED
- [ ] Inventory lifecycle: WH-RECEIVING → WH-MAIN
- [ ] 4+ audit trail entries
- [ ] Total active time < 15 minutes

Result: ☐ PASS | ☐ FAIL | ☐ PAINFUL | ☐ MISSING
Notes: _________________________________________________
```

### J1-HP-002: Complete PO Cycle (Multi-Line)
```
Priority: P0
Personas: 🛒 Purchasing → 👷 Warehouse → 🔬 QC

Preconditions:
- 5 different parts exist
- Same supplier for all

Steps:
1. Create PO with 5 line items
2. Receive all 5 items in single receipt
3. QC pass all items
4. Verify: All 5 parts in WH-MAIN

Expected Results:
- [ ] Single PO, 5 lines
- [ ] Single receipt transaction
- [ ] 5 separate lot records
- [ ] All inventory in correct location

Result: ☐ PASS | ☐ FAIL | ☐ PAINFUL | ☐ MISSING
Notes: _________________________________________________
```

### J1-HP-003: PO with Multiple Receipts (Partial Delivery)
```
Priority: P0
Personas: 🛒 → 👷

Preconditions:
- PO for 100 units approved

Steps:
1. Receive 60 units first delivery
   ☐ Verify: PO status = PARTIALLY_RECEIVED
   ☐ Verify: PO line shows 60/100 received
2. Receive 40 units second delivery
   ☐ Verify: PO status = RECEIVED
   ☐ Verify: PO line shows 100/100 received

Expected Results:
- [ ] 2 separate lot records
- [ ] PO total received = 100
- [ ] Both lots traceable to same PO

Result: ☐ PASS | ☐ FAIL | ☐ PAINFUL | ☐ MISSING
Notes: _________________________________________________
```

## 1.2 CHAOS SCENARIOS — PO CREATION

### J1-CH-001: Create PO with Non-existent Part
```
Priority: P1
Chaos Factor: 🔲 MISSING

Steps:
1. Create new PO
2. Try to add line with Part Number "PART-DOES-NOT-EXIST"

Expected Results:
- [ ] Part lookup shows "No results"
- [ ] Cannot add line without valid part
- [ ] Option to "Create New Part" available
- [ ] Clear error message

Result: ☐ PASS | ☐ FAIL | ☐ PAINFUL | ☐ MISSING
Notes: _________________________________________________
```

### J1-CH-002: Create PO with Inactive Supplier
```
Priority: P1
Chaos Factor: ❌ ERROR

Precondition:
- Supplier "NCC-INACTIVE" exists, status=INACTIVE

Steps:
1. Create new PO
2. Select Supplier: NCC-INACTIVE

Expected Results:
- [ ] Warning: "Supplier is inactive"
- [ ] Option to proceed with warning OR block

Result: ☐ PASS | ☐ FAIL | ☐ PAINFUL | ☐ MISSING
Notes: _________________________________________________
```

### J1-CH-003: Create PO with 100+ Line Items
```
Priority: P2
Chaos Factor: 📊 DATA

Steps:
1. Create PO
2. Add 100 different line items
3. Save

Expected Results:
- [ ] Save completes < 10 seconds
- [ ] UI remains responsive
- [ ] Pagination/scroll works correctly
- [ ] All 100 lines saved accurately

Result: ☐ PASS | ☐ FAIL | ☐ PAINFUL | ☐ MISSING
Notes: _________________________________________________
```

### J1-CH-004: Create Duplicate PO Same Supplier Same Day
```
Priority: P1
Chaos Factor: 👥 COLLAB

Steps:
1. User A creates PO for Supplier X with Part A
2. User A saves as DRAFT
3. User B creates PO for Supplier X with Part B
4. User B saves as DRAFT

Expected Results:
- [ ] System suggests consolidation
- [ ] OR Both POs created with warning
- [ ] Clear indication of multiple open POs

Result: ☐ PASS | ☐ FAIL | ☐ PAINFUL | ☐ MISSING
Notes: _________________________________________________
```

### J1-CH-005: Submit PO for Approval Without Lines
```
Priority: P1
Chaos Factor: ❌ ERROR

Steps:
1. Create PO header only (no lines)
2. Try to submit for approval

Expected Results:
- [ ] Block with message "PO must have at least one line"
- [ ] Focus on Add Line button

Result: ☐ PASS | ☐ FAIL | ☐ PAINFUL | ☐ MISSING
Notes: _________________________________________________
```

### J1-CH-006: Create PO with Price = 0
```
Priority: P2
Chaos Factor: ⚠️ EDGE

Steps:
1. Create PO line with unit price = 0
2. Save

Expected Results:
- [ ] Warning: "Zero price - is this a sample/free goods?"
- [ ] Allow save with warning
- [ ] Flag in reports

Result: ☐ PASS | ☐ FAIL | ☐ PAINFUL | ☐ MISSING
Notes: _________________________________________________
```

### J1-CH-007: Edit Approved PO
```
Priority: P0
Chaos Factor: 📋 RULE

Steps:
1. Open an APPROVED PO
2. Try to edit line quantity

Expected Results:
- [ ] Edit blocked
- [ ] Message: "Cannot edit approved PO"
- [ ] Option to "Create Amendment" or "Cancel and Recreate"

Result: ☐ PASS | ☐ FAIL | ☐ PAINFUL | ☐ MISSING
Notes: _________________________________________________
```

## 1.3 CHAOS SCENARIOS — RECEIVING

### J1-CH-010: Receive Quantity > PO Quantity (Over-delivery)
```
Priority: P0
Chaos Factor: ⚠️ EDGE

Precondition:
- PO for 100 units approved

Steps:
1. Receive with Qty = 120

Expected Results:
- [ ] Warning: "Receiving 120 vs ordered 100"
- [ ] Require reason/note
- [ ] Allow with approval OR block based on setting
- [ ] PO status handles over-receipt

Result: ☐ PASS | ☐ FAIL | ☐ PAINFUL | ☐ MISSING
Notes: _________________________________________________
```

### J1-CH-011: Receive with Existing Lot Number
```
Priority: P0
Chaos Factor: ❌ ERROR

Precondition:
- LOT-EXISTING already in inventory

Steps:
1. Receive new shipment
2. Enter Lot Number = LOT-EXISTING

Expected Results:
- [ ] Block: "Lot number already exists"
- [ ] Suggest: LOT-EXISTING-2 or auto-generate

Result: ☐ PASS | ☐ FAIL | ☐ PAINFUL | ☐ MISSING
Notes: _________________________________________________
```

### J1-CH-012: Receive Against Unapproved PO
```
Priority: P0
Chaos Factor: 📋 RULE

Steps:
1. Navigate to Receiving
2. Try to select a PO with status = DRAFT or PENDING_APPROVAL

Expected Results:
- [ ] PO not visible in receive list
- [ ] OR visible but greyed out with "Not approved"

Result: ☐ PASS | ☐ FAIL | ☐ PAINFUL | ☐ MISSING
Notes: _________________________________________________
```

### J1-CH-013: Receive with Past Expiry Date
```
Priority: P1
Chaos Factor: ⚠️ EDGE

Steps:
1. Receive shipment
2. Enter Expiry Date = Yesterday

Expected Results:
- [ ] Warning: "Expiry date is in the past"
- [ ] Require manager approval OR block
- [ ] If proceed, flag in inventory

Result: ☐ PASS | ☐ FAIL | ☐ PAINFUL | ☐ MISSING
Notes: _________________________________________________
```

### J1-CH-014: Two Users Receive Same PO Line Simultaneously
```
Priority: P0
Chaos Factor: 👥 COLLAB

Precondition:
- PO line for 100 units, 0 received

Steps:
1. User A opens Receive for PO line
2. User B opens Receive for same PO line
3. User A enters Qty=60, submits
4. User B enters Qty=60, submits (within 5 seconds)

Expected Results:
- [ ] User A succeeds (60 received)
- [ ] User B gets error: "Only 40 remaining" OR
- [ ] User B sees updated UI before submit

Result: ☐ PASS | ☐ FAIL | ☐ PAINFUL | ☐ MISSING
Notes: _________________________________________________
```

### J1-CH-015: Receive When Warehouse Location Full
```
Priority: P2
Chaos Factor: 🏗️ INFRA

Precondition:
- WH-RECEIVING at capacity (if tracked)

Steps:
1. Try to receive new shipment

Expected Results:
- [ ] Warning: "Location near capacity"
- [ ] Suggest alternative location
- [ ] OR allow with warning

Result: ☐ PASS | ☐ FAIL | ☐ PAINFUL | ☐ MISSING
Notes: _________________________________________________
```

## 1.4 CHAOS SCENARIOS — QC

### J1-CH-020: QC Fail Entire Shipment
```
Priority: P0
Chaos Factor: ❌ ERROR

Steps:
1. Perform QC inspection
2. Result = FAIL for entire lot

Expected Results:
- [ ] Inventory moves to WH-QUARANTINE
- [ ] NCR auto-created
- [ ] Notification to Quality Manager
- [ ] Original PO still shows as received (not reversed)

Result: ☐ PASS | ☐ FAIL | ☐ PAINFUL | ☐ MISSING
Notes: _________________________________________________
```

### J1-CH-021: QC Conditional Hold
```
Priority: P0
Chaos Factor: ⚠️ EDGE

Steps:
1. Perform QC inspection
2. Result = CONDITIONAL

Expected Results:
- [ ] Inventory moves to WH-HOLD
- [ ] Review task created
- [ ] Notification to manager
- [ ] Cannot use until released

Result: ☐ PASS | ☐ FAIL | ☐ PAINFUL | ☐ MISSING
Notes: _________________________________________________
```

### J1-CH-022: QC Partial Pass/Fail
```
Priority: P1
Chaos Factor: ⚠️ EDGE

Precondition:
- Received 100 units

Steps:
1. Perform QC inspection
2. Mark 80 PASS, 20 FAIL

Expected Results:
- [ ] Lot split: 80 → WH-MAIN, 20 → WH-QUARANTINE
- [ ] 2 separate inventory records
- [ ] NCR created for 20 units only

Result: ☐ PASS | ☐ FAIL | ☐ PAINFUL | ☐ MISSING
Notes: _________________________________________________
```

### J1-CH-023: QC After 48h SLA
```
Priority: P2
Chaos Factor: 🕐 TIME

Precondition:
- QC SLA = 48 hours (configurable)
- Lot received 50 hours ago

Steps:
1. Perform QC inspection now

Expected Results:
- [ ] Warning: "SLA exceeded"
- [ ] Allow proceed with note
- [ ] Flag in reports

Result: ☐ PASS | ☐ FAIL | ☐ PAINFUL | ☐ MISSING
Notes: _________________________________________________
```

---

# SECTION 2: JOURNEY J2 — PLAN-TO-PRODUCE

## 2.1 HAPPY PATH TESTS

### J2-HP-001: Simple WO from BOM
```
Priority: P0
Personas: 📋 Planner → 👤 Supervisor → 👷 Warehouse

Preconditions:
- Product "DRONE-X1" with BOM
- BOM has 5 components, all in stock
- Sufficient inventory for 10 units

Steps:
1. Create Work Order for DRONE-X1 qty=10
2. Release Work Order
3. Issue Materials (all components)
4. Complete Production
5. Receive to FG warehouse

Expected Results:
- [ ] WO lifecycle: DRAFT → RELEASED → IN_PROGRESS → COMPLETED
- [ ] Inventory: MAIN → WIP (issue) → FG (complete)
- [ ] BOM explosion accurate (5 components × 10 = 50 material movements)

Result: ☐ PASS | ☐ FAIL | ☐ PAINFUL | ☐ MISSING
Notes: _________________________________________________
```

### J2-HP-002: MRP Run → Auto PO Suggestions
```
Priority: P0
Personas: 📋 Planner → 🛒 Purchasing

Preconditions:
- Demand for 100 units DRONE-X1
- BOM requires 5 parts
- 2 parts have insufficient stock

Steps:
1. Run MRP
2. Review suggestions
3. Approve BUY suggestions
4. Verify POs created

Expected Results:
- [ ] MRP detects 2 shortages
- [ ] Suggestions grouped by supplier
- [ ] PO consolidation works
- [ ] Quantities match BOM requirement

Result: ☐ PASS | ☐ FAIL | ☐ PAINFUL | ☐ MISSING
Notes: _________________________________________________
```

## 2.2 CHAOS SCENARIOS — BOM

### J2-CH-001: BOM with Missing Part
```
Priority: P0
Chaos Factor: 🔲 MISSING

Precondition:
- BOM line references part that was deleted

Steps:
1. Try to create WO from this BOM

Expected Results:
- [ ] Error: "BOM contains invalid parts"
- [ ] List which parts are invalid
- [ ] Block WO creation

Result: ☐ PASS | ☐ FAIL | ☐ PAINFUL | ☐ MISSING
Notes: _________________________________________________
```

### J2-CH-002: BOM with Circular Reference
```
Priority: P0
Chaos Factor: ❌ ERROR

Steps:
1. Try to create BOM where Product A contains Product B
2. Product B contains Product A

Expected Results:
- [ ] System detects circular reference
- [ ] Block save
- [ ] Clear error message showing the cycle

Result: ☐ PASS | ☐ FAIL | ☐ PAINFUL | ☐ MISSING
Notes: _________________________________________________
```

### J2-CH-003: BOM 10 Levels Deep
```
Priority: P1
Chaos Factor: 📊 DATA

Steps:
1. Create nested BOM: Level 1 → 2 → 3 → ... → 10
2. Run MRP explosion

Expected Results:
- [ ] Explosion completes < 5 seconds
- [ ] All 10 levels processed correctly
- [ ] Material requirements accurate

Result: ☐ PASS | ☐ FAIL | ☐ PAINFUL | ☐ MISSING
Notes: _________________________________________________
```

### J2-CH-004: BOM with Obsolete Part
```
Priority: P1
Chaos Factor: ⚠️ EDGE

Precondition:
- Part in BOM has status = OBSOLETE

Steps:
1. Try to create WO

Expected Results:
- [ ] Warning: "BOM contains obsolete parts"
- [ ] Suggest alternate parts if available
- [ ] Allow proceed with approval

Result: ☐ PASS | ☐ FAIL | ☐ PAINFUL | ☐ MISSING
Notes: _________________________________________________
```

## 2.3 CHAOS SCENARIOS — MATERIAL ISSUE

### J2-CH-010: Issue When Stock Insufficient
```
Priority: P0
Chaos Factor: ❌ ERROR

Precondition:
- WO requires 100 units
- Only 50 in stock

Steps:
1. Try to issue materials

Expected Results:
- [ ] Warning: "Only 50 available, need 100"
- [ ] Option: Issue partial (50)
- [ ] MRP flag for shortage
- [ ] WO not blocked for partial

Result: ☐ PASS | ☐ FAIL | ☐ PAINFUL | ☐ MISSING
Notes: _________________________________________________
```

### J2-CH-011: Issue from HOLD Warehouse
```
Priority: P0
Chaos Factor: 📋 RULE

Precondition:
- Material in WH-HOLD

Steps:
1. Try to issue from HOLD location

Expected Results:
- [ ] Block: "Material on hold, cannot issue"
- [ ] Show reason for hold
- [ ] Suggest: Release hold first

Result: ☐ PASS | ☐ FAIL | ☐ PAINFUL | ☐ MISSING
Notes: _________________________________________________
```

### J2-CH-012: Issue Lot Near Expiry
```
Priority: P1
Chaos Factor: ⚠️ EDGE

Precondition:
- Multiple lots available
- Lot A expires in 30 days
- Lot B expires in 365 days

Steps:
1. Issue materials

Expected Results:
- [ ] FIFO: Lot A selected first
- [ ] Warning if Lot A expires soon
- [ ] Option to override

Result: ☐ PASS | ☐ FAIL | ☐ PAINFUL | ☐ MISSING
Notes: _________________________________________________
```

### J2-CH-013: Over-Issue (More Than BOM)
```
Priority: P1
Chaos Factor: ⚠️ EDGE

Precondition:
- BOM requires 10 units
- Try to issue 15

Steps:
1. Issue 15 units (5 over)

Expected Results:
- [ ] Warning: "Issuing 5 more than BOM requires"
- [ ] Require reason
- [ ] Record variance

Result: ☐ PASS | ☐ FAIL | ☐ PAINFUL | ☐ MISSING
Notes: _________________________________________________
```

## 2.4 CHAOS SCENARIOS — PRODUCTION COMPLETION

### J2-CH-020: Complete More Than Planned
```
Priority: P1
Chaos Factor: ⚠️ EDGE

Precondition:
- WO for 100 units

Steps:
1. Report completion: 110 units

Expected Results:
- [ ] Warning: "Completing more than planned"
- [ ] Allow with note
- [ ] WO qty updated to 110
- [ ] Excess tracked

Result: ☐ PASS | ☐ FAIL | ☐ PAINFUL | ☐ MISSING
Notes: _________________________________________________
```

### J2-CH-021: Complete Without Material Issue
```
Priority: P0
Chaos Factor: 📋 RULE

Precondition:
- WO released but no materials issued

Steps:
1. Try to report completion

Expected Results:
- [ ] Warning: "No materials issued for this WO"
- [ ] Block or require override
- [ ] Cost calculation impacted

Result: ☐ PASS | ☐ FAIL | ☐ PAINFUL | ☐ MISSING
Notes: _________________________________________________
```

### J2-CH-022: Complete With Scrap
```
Priority: P1
Chaos Factor: ✅ NORMAL

Steps:
1. Report completion: Good=95, Scrap=5

Expected Results:
- [ ] FG inventory +95
- [ ] Scrap recorded
- [ ] Cost adjusted for scrap
- [ ] Scrap reason required

Result: ☐ PASS | ☐ FAIL | ☐ PAINFUL | ☐ MISSING
Notes: _________________________________________________
```

### J2-CH-023: Final QC Fail
```
Priority: P0
Chaos Factor: ❌ ERROR

Steps:
1. Complete WO
2. Final QC inspection: FAIL

Expected Results:
- [ ] FG inventory → QUARANTINE
- [ ] NCR auto-created
- [ ] WO status reflects QC fail
- [ ] Option to rework

Result: ☐ PASS | ☐ FAIL | ☐ PAINFUL | ☐ MISSING
Notes: _________________________________________________
```

---

# SECTION 3: JOURNEY J4 — QUALITY-DISPOSITION

## 3.1 NCR DISPOSITION TESTS

### J4-HP-001: NCR Scrap Disposition
```
Priority: P0
Personas: 🔬 QC → 📋 Planner → 🎯 Manager → 👷 Warehouse

Steps:
1. Create NCR for 50 units
2. Set disposition: SCRAP
3. Approve NCR
4. Execute disposition
5. Dispose scrap

Expected Results:
- [ ] Inventory: QUARANTINE → SCRAP → DISPOSED
- [ ] Write-off value calculated
- [ ] ScrapDisposal record created
- [ ] Audit trail complete

Result: ☐ PASS | ☐ FAIL | ☐ PAINFUL | ☐ MISSING
Notes: _________________________________________________
```

### J4-HP-002: NCR Rework Disposition
```
Priority: P0

Steps:
1. Create NCR for 50 units
2. Set disposition: REWORK
3. Approve NCR
4. Execute disposition

Expected Results:
- [ ] Inventory: QUARANTINE → WIP
- [ ] New rework WO created (or linked)
- [ ] Original defect tracked

Result: ☐ PASS | ☐ FAIL | ☐ PAINFUL | ☐ MISSING
Notes: _________________________________________________
```

### J4-HP-003: NCR Return to Vendor
```
Priority: P0

Steps:
1. Create NCR for PO-received material
2. Set disposition: RETURN_TO_VENDOR
3. Execute disposition

Expected Results:
- [ ] Inventory exits system
- [ ] RMA/Debit note created
- [ ] Supplier performance impacted
- [ ] Link to original PO

Result: ☐ PASS | ☐ FAIL | ☐ PAINFUL | ☐ MISSING
Notes: _________________________________________________
```

### J4-HP-004: NCR Use-As-Is
```
Priority: P0

Steps:
1. Create NCR
2. Set disposition: USE_AS_IS
3. Require customer waiver
4. Execute

Expected Results:
- [ ] Inventory: QUARANTINE → MAIN
- [ ] Deviation number assigned
- [ ] Waiver document attached
- [ ] Flagged in system

Result: ☐ PASS | ☐ FAIL | ☐ PAINFUL | ☐ MISSING
Notes: _________________________________________________
```

## 3.2 HOLD MANAGEMENT TESTS

### J4-HP-005: Hold Release Flow
```
Priority: P0

Precondition:
- Material in WH-HOLD from conditional QC

Steps:
1. Review hold item
2. Decision: RELEASE
3. Execute release

Expected Results:
- [ ] Inventory: HOLD → MAIN
- [ ] Hold reason cleared
- [ ] Available for use

Result: ☐ PASS | ☐ FAIL | ☐ PAINFUL | ☐ MISSING
Notes: _________________________________________________
```

### J4-HP-006: Hold Reject Flow
```
Priority: P0

Steps:
1. Review hold item
2. Decision: REJECT
3. Execute rejection

Expected Results:
- [ ] Inventory: HOLD → QUARANTINE
- [ ] NCR auto-created
- [ ] Disposition workflow starts

Result: ☐ PASS | ☐ FAIL | ☐ PAINFUL | ☐ MISSING
Notes: _________________________________________________
```

## 3.3 CHAOS SCENARIOS

### J4-CH-001: Scrap High-Value Material
```
Priority: P0
Chaos Factor: 📊 DATA

Precondition:
- Material value > threshold (e.g., 10,000 VND)

Steps:
1. NCR disposition: SCRAP

Expected Results:
- [ ] Multi-level approval required
- [ ] Finance notification
- [ ] Extended audit trail

Result: ☐ PASS | ☐ FAIL | ☐ PAINFUL | ☐ MISSING
Notes: _________________________________________________
```

### J4-CH-002: Execute Disposition Before NCR Approved
```
Priority: P0
Chaos Factor: 📋 RULE

Steps:
1. Create NCR, set disposition
2. Try to execute without approval

Expected Results:
- [ ] Block: "NCR not approved"
- [ ] Show approval workflow status

Result: ☐ PASS | ☐ FAIL | ☐ PAINFUL | ☐ MISSING
Notes: _________________________________________________
```

---

# SECTION 4: JOURNEY J8 — FAILURE-RECOVERY

## 4.1 BACKUP & RESTORE TESTS

### J8-HP-001: Manual Backup
```
Priority: P0
Personas: 🛠️ System Admin

Steps:
1. Navigate: Settings → Backup
2. Click "Backup Now"
3. Wait for completion

Expected Results:
- [ ] Backup file created
- [ ] Size reasonable (> 0)
- [ ] Appears in backup list
- [ ] Download works

Result: ☐ PASS | ☐ FAIL | ☐ PAINFUL | ☐ MISSING
Notes: _________________________________________________
```

### J8-HP-002: Restore from Backup
```
Priority: P0
Personas: 🛠️ System Admin

Precondition:
- At least one backup exists

Steps:
1. Note current data counts
2. Make changes (create 1 PO, 1 Part)
3. Create new backup
4. Make MORE changes
5. Restore from previous backup
6. Verify data matches backup point

Expected Results:
- [ ] Restore completes < 15 minutes
- [ ] Data matches backup state
- [ ] Post-backup changes lost (expected)
- [ ] Application functional

Result: ☐ PASS | ☐ FAIL | ☐ PAINFUL | ☐ MISSING
Notes: _________________________________________________
Restore time: _____ minutes
```

## 4.2 CHAOS SCENARIOS

### J8-CH-001: Transaction Interrupted
```
Priority: P0
Chaos Factor: 🏗️ INFRA

Steps:
1. Start a multi-step operation (e.g., receive 5 PO lines)
2. Simulate network disconnect after 2 lines
3. Reconnect
4. Check data state

Expected Results:
- [ ] Partial data NOT saved (atomic)
- [ ] OR clear indication of what saved
- [ ] Resume capability

Result: ☐ PASS | ☐ FAIL | ☐ PAINFUL | ☐ MISSING
Notes: _________________________________________________
```

### J8-CH-002: Session Timeout During Work
```
Priority: P1
Chaos Factor: 🏗️ INFRA

Steps:
1. Start editing a form
2. Wait for session timeout
3. Try to save

Expected Results:
- [ ] Graceful re-login prompt
- [ ] Data preserved (local draft)
- [ ] OR clear warning before timeout

Result: ☐ PASS | ☐ FAIL | ☐ PAINFUL | ☐ MISSING
Notes: _________________________________________________
```

---

# SECTION 5: JOURNEY J12 — MULTI-ACTOR CONFLICT

## 5.1 CONCURRENT OPERATION TESTS

### J12-HP-001: Two Users Edit Same Record
```
Priority: P0
Chaos Factor: 👥 COLLAB

Precondition:
- Part "PART-1033" exists

Steps:
1. User A opens Part for edit
2. User B opens same Part for edit
3. User A changes description, saves
4. User B changes unit, saves

Expected Results:
- [ ] User A succeeds
- [ ] User B gets conflict warning
- [ ] Options: Overwrite / Merge / Cancel
- [ ] No data corruption

Result: ☐ PASS | ☐ FAIL | ☐ PAINFUL | ☐ MISSING
Notes: _________________________________________________
```

### J12-HP-002: Race Condition on Inventory Issue
```
Priority: P0
Chaos Factor: 👥 COLLAB

Precondition:
- PART-1033 qty = 100

Steps:
1. User A issues 80 units
2. User B issues 80 units (simultaneously)

Expected Results:
- [ ] One succeeds (80)
- [ ] One fails or reduced (20)
- [ ] Total never exceeds 100
- [ ] No negative inventory

Result: ☐ PASS | ☐ FAIL | ☐ PAINFUL | ☐ MISSING
Notes: _________________________________________________
```

### J12-HP-003: Approve Already Approved PO
```
Priority: P1

Steps:
1. User A opens PO for approval
2. User B approves same PO
3. User A tries to approve

Expected Results:
- [ ] User A sees "Already approved"
- [ ] No duplicate approval
- [ ] Clear UI feedback

Result: ☐ PASS | ☐ FAIL | ☐ PAINFUL | ☐ MISSING
Notes: _________________________________________________
```

---

# SECTION 6: VIETNAMESE-SPECIFIC TESTS

### VN-001: Part Name With Diacritics
```
Priority: P1

Steps:
1. Create Part: Name = "Ống nhựa PVC Φ21mm đặc biệt"
2. Save
3. Search for "ong nhua"

Expected Results:
- [ ] Name saved correctly
- [ ] Search finds it (diacritic-insensitive)
- [ ] Display correct in all screens

Result: ☐ PASS | ☐ FAIL | ☐ PAINFUL | ☐ MISSING
Notes: _________________________________________________
```

### VN-002: Currency Formatting
```
Priority: P0

Steps:
1. Create PO with value = 1234567890 VND
2. View in list and detail

Expected Results:
- [ ] Display: "1.234.567.890 ₫"
- [ ] Dot separator for thousands
- [ ] VND symbol

Result: ☐ PASS | ☐ FAIL | ☐ PAINFUL | ☐ MISSING
Notes: _________________________________________________
```

### VN-003: PDF Export with Vietnamese
```
Priority: P1

Steps:
1. Create report with Vietnamese text
2. Export to PDF

Expected Results:
- [ ] All diacritics render correctly
- [ ] No missing/garbled characters
- [ ] Font supports Vietnamese

Result: ☐ PASS | ☐ FAIL | ☐ PAINFUL | ☐ MISSING
Notes: _________________________________________________
```

### VN-004: Excel Import with Vietnamese Headers
```
Priority: P0

Steps:
1. Upload Excel with headers: "Mã SP", "Tên sản phẩm", "Đơn giá"
2. Run AI mapping

Expected Results:
- [ ] Headers recognized
- [ ] Mapped to: partNumber, description, unitPrice
- [ ] High confidence score

Result: ☐ PASS | ☐ FAIL | ☐ PAINFUL | ☐ MISSING
Notes: _________________________________________________
```

---

# EXECUTION TRACKING

## Test Execution Summary

| Date | Tester | Journey | Passed | Failed | Painful | Missing |
|------|--------|---------|--------|--------|---------|---------|
| | | | | | | |
| | | | | | | |

## Defects Log

| ID | Severity | Journey | Description | Status |
|----|----------|---------|-------------|--------|
| | | | | |
| | | | | |

## Coverage Score

| Journey | Total | Executed | Pass | Coverage % |
|---------|-------|----------|------|------------|
| J1 | 35 | | | |
| J2 | 40 | | | |
| J3 | 20 | | | |
| J4 | 25 | | | |
| J8 | 15 | | | |
| J12 | 15 | | | |
| **TOTAL** | **150** | | | |

## Release Gate Check

- [ ] All P0 tests PASS (100%)
- [ ] P1 tests PASS ≥ 95%
- [ ] P2 tests PASS ≥ 85%
- [ ] No regression from previous release
- [ ] Vietnamese localization verified
- [ ] Backup/Restore verified

---

> **L-ERP MRP E2E Test Suite v1.0**
> **150+ Test Cases**
> **Ready for Execution**
