# ═══════════════════════════════════════════════════════════════════════════════
#                    L-ERP MRP TABLE PRESERVATION RULES
#                    "Excel-First" Design Philosophy
# ═══════════════════════════════════════════════════════════════════════════════
#
#  ⚠️ CRITICAL: KHÔNG ĐƯỢC THAY ĐỔI CẤU TRÚC BẢNG HIỆN TẠI
#
#  Lý do: Người dùng MRP chủ yếu chuyển từ Excel sang
#  → Giao diện càng giống Excel càng dễ chấp nhận
#  → Tables hiện tại đã được thiết kế chuẩn mực
#
# ═══════════════════════════════════════════════════════════════════════════════

---

## 🔒 NGUYÊN TẮC BẢO TOÀN TUYỆT ĐỐI

### KHÔNG ĐƯỢC THAY ĐỔI:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  ❌ KHÔNG THAY ĐỔI                                                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  1. CỘT (Columns)                                                          │
│     • Số lượng cột                                                         │
│     • Thứ tự cột                                                           │
│     • Tên cột/header                                                       │
│     • Độ rộng cột đã set                                                   │
│                                                                             │
│  2. HÀNG (Rows)                                                            │
│     • Cấu trúc data trong mỗi row                                         │
│     • Logic hiển thị                                                       │
│     • Mapping data → columns                                               │
│                                                                             │
│  3. TÍNH NĂNG EXCEL-LIKE                                                   │
│     • Sort columns                                                         │
│     • Filter                                                               │
│     • Column resize (nếu có)                                              │
│     • Inline editing (nếu có)                                             │
│     • Keyboard navigation (nếu có)                                        │
│     • Selection (checkbox, row select)                                    │
│                                                                             │
│  4. DATA FORMATTING                                                        │
│     • Number formatting (1,234.56)                                        │
│     • Date formatting                                                      │
│     • Currency formatting                                                  │
│     • Percentage formatting                                                │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### CHỈ ĐƯỢC THAY ĐỔI:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  ✅ ĐƯỢC THAY ĐỔI (Visual styling only)                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  1. MÀU SẮC                                                                │
│     • Background colors (rows, headers)                                    │
│     • Border colors                                                        │
│     • Text colors                                                          │
│     • Hover/selected states                                                │
│                                                                             │
│  2. TYPOGRAPHY                                                             │
│     • Font family (nhưng giữ monospace cho số)                            │
│     • Font size (trong phạm vi hợp lý)                                    │
│     • Font weight                                                          │
│                                                                             │
│  3. SPACING (Cẩn thận)                                                     │
│     • Cell padding (nhưng không làm mất data)                             │
│     • Row height (nhưng không quá compact/quá loose)                      │
│                                                                             │
│  4. VISUAL EFFECTS                                                         │
│     • Hover effects                                                        │
│     • Selection highlight                                                  │
│     • Focus states                                                         │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 📊 EXCEL-LIKE FEATURES TO PRESERVE

### Bảng kiểm tra trước khi redesign:

| Feature | Giữ nguyên | Ghi chú |
|---------|------------|---------|
| Fixed header khi scroll | ✅ BẮT BUỘC | Người dùng Excel quen |
| Sort indicators (▲▼) | ✅ BẮT BUỘC | Click header to sort |
| Column borders visible | ✅ BẮT BUỘC | Grid lines như Excel |
| Right-align numbers | ✅ BẮT BUỘC | Chuẩn Excel |
| Monospace font cho số | ✅ BẮT BUỘC | Số thẳng hàng |
| Row hover highlight | ✅ BẮT BUỘC | Dễ theo dõi |
| Checkbox column | ✅ NẾU CÓ | Multi-select |
| Action column | ✅ NẾU CÓ | Edit/Delete/View |
| Pagination | ✅ NẾU CÓ | Hoặc infinite scroll |
| Search/Filter | ✅ NẾU CÓ | Toolbar position |
| Column resize | ✅ NẾU CÓ | Drag handles |
| Inline edit | ✅ NẾU CÓ | Double-click to edit |

---

## 🎨 TABLE STYLING CHO INDUSTRIAL PRECISION

### Áp dụng theme MỚI nhưng GIỮ structure CŨ:

```css
/* ═══ TABLE STYLING - EXCEL-FIRST ═══ */

.mrp-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  font-family: var(--font-body);
}

/* Header - Giữ sticky, chỉ đổi màu */
.mrp-table th {
  position: sticky;
  top: 0;
  z-index: 10;
  
  /* NEW: Industrial colors */
  background: var(--gunmetal);         /* Thay vì white/gray */
  color: var(--text-muted);            /* Thay vì black */
  border: 1px solid var(--border-default);
  
  /* PRESERVE: Excel-like formatting */
  text-align: left;
  font-weight: 500;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 8px 12px;
  white-space: nowrap;
}

/* Cells - Giữ structure, đổi visual */
.mrp-table td {
  /* NEW: Industrial colors */
  background: transparent;              /* Thay vì white */
  color: var(--text-primary);          /* Thay vì black */
  border: 1px solid var(--border-default);
  
  /* PRESERVE: Padding, alignment */
  padding: 8px 12px;
  vertical-align: middle;
}

/* PRESERVE: Numeric alignment */
.mrp-table td.numeric,
.mrp-table th.numeric {
  text-align: right;
  font-family: var(--font-mono);       /* Monospace cho số */
}

/* NEW: Hover effect */
.mrp-table tr:hover td {
  background: rgba(61, 68, 80, 0.3);
}

/* NEW: Selected row */
.mrp-table tr.selected td {
  background: var(--info-cyan-dim);
  border-left-color: var(--info-cyan);
}

/* PRESERVE: Sort indicators */
.mrp-table th.sortable {
  cursor: pointer;
  user-select: none;
}

.mrp-table th.sortable:hover {
  background: var(--slate);
}

.mrp-table th .sort-icon {
  margin-left: 4px;
  opacity: 0.5;
}

.mrp-table th.sorted-asc .sort-icon,
.mrp-table th.sorted-desc .sort-icon {
  opacity: 1;
  color: var(--info-cyan);
}
```

---

## 📋 CHECKLIST TRƯỚC KHI MODIFY TABLE

Trước khi sửa BẤT KỲ table nào, phải kiểm tra:

```
□ Đã backup code table hiện tại chưa?
□ Có screenshot table trước khi sửa không?
□ Các columns có giữ nguyên thứ tự không?
□ Data formatting có giữ nguyên không?
□ Sort functionality còn hoạt động không?
□ Filter functionality còn hoạt động không?
□ Số liệu có căn phải không?
□ Số liệu có dùng monospace font không?
□ Header có sticky không?
□ Hover effect có hoạt động không?
□ Selection có hoạt động không?
□ Actions (edit/delete) có hoạt động không?
```

---

## 🔄 QUY TRÌNH REDESIGN TABLE AN TOÀN

### Step 1: Audit
```
1. Screenshot table hiện tại
2. Liệt kê tất cả columns
3. Liệt kê tất cả features (sort, filter, etc.)
4. Note data formatting rules
```

### Step 2: Style Only
```
1. Chỉ thay đổi CSS classes
2. KHÔNG sửa JSX/TSX structure
3. KHÔNG sửa data mapping
4. KHÔNG sửa column definitions
```

### Step 3: Verify
```
1. So sánh với screenshot
2. Test tất cả features
3. Check number alignment
4. Check responsive behavior
```

### Step 4: Commit
```
1. Commit riêng cho từng table
2. Message rõ ràng: "style: Update Parts table colors (preserve structure)"
3. Dễ rollback nếu có issue
```

---

## 📊 DANH SÁCH TABLES CẦN BẢO TOÀN

| Module | Table | Columns | Notes |
|--------|-------|---------|-------|
| Parts | Parts List | ID, PN, Name, Category, Stock, UoM, Status, Actions | Main table |
| BOM | BOM List | ID, Name, Part, Qty, Version, Status, Actions | |
| BOM | BOM Items | Line, Part, Qty, UoM, Notes | Sub-table |
| Work Orders | WO List | WO#, Product, Qty, Start, Due, Progress, Status | |
| Work Orders | WO Items | Line, Part, Planned, Actual, Variance | |
| Purchase Orders | PO List | PO#, Supplier, Date, Total, Status | |
| Purchase Orders | PO Items | Line, Part, Qty, Price, Amount | |
| Sales Orders | SO List | SO#, Customer, Date, Total, Status | |
| Inventory | Stock List | Part, Location, Qty, Reserved, Available | |
| Inventory | Transactions | Date, Type, Part, Qty, Ref, User | |
| Quality | Inspections | ID, Lot, Date, Result, Inspector | |
| Quality | NCR List | NCR#, Date, Part, Issue, Status | |
| MRP | Demand | Part, Source, Qty, Date, Priority | |
| MRP | Supply | Part, Type, Qty, Date, Status | |

---

## ⚠️ CẢNH BÁO

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║   🚫 TUYỆT ĐỐI KHÔNG:                                                       ║
║                                                                              ║
║   • Xóa bất kỳ column nào                                                   ║
║   • Thay đổi thứ tự columns                                                 ║
║   • Đổi tên columns                                                         ║
║   • Thay đổi data type display                                              ║
║   • Xóa sort/filter functionality                                           ║
║   • Thay đổi number formatting                                              ║
║   • Convert table sang card layout                                          ║
║   • Ẩn columns mà không có user control                                     ║
║                                                                              ║
║   Nếu cần thay đổi structure → PHẢI có approval từ Chủ nhà                  ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

---

# ═══════════════════════════════════════════════════════════════════════════════
#                    END OF TABLE PRESERVATION RULES
# ═══════════════════════════════════════════════════════════════════════════════
