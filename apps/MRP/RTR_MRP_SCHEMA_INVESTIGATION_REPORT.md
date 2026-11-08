# 🔬 L-ERP MRP SCHEMA INVESTIGATION REPORT
## Chief Architect Deep Analysis - 2026-01-09

---

## 📊 EXECUTIVE SUMMARY

**Tình trạng:** Dự án có **2 phiên bản schema hoàn toàn khác nhau** đang gây ra context drift nghiêm trọng.

| Aspect | Container Version | Local Version | Winner |
|--------|-------------------|---------------|--------|
| Models | 34 | 123 | 🏆 Local |
| Schema/API Sync | ❌ Mismatch | ✅ Matched | 🏆 Local |
| Prisma Generated | ❌ Broken | ✅ Working | 🏆 Local |
| MRP Features | Basic | Advanced | 🏆 Local |
| Warehouse Support | ❌ No | ✅ Yes | 🏆 Local |

**Kết luận:** LOCAL VERSION là phiên bản **production-ready**, Container version là **outdated/incomplete**.

---

## 🔍 CHI TIẾT ĐIỀU TRA

### CONTAINER VERSION (`/home/claude/lerp-mrp-app`)

#### Schema Stats
```
Total Models: 34
Total Enums: 30
Total Lines: 1380
```

#### Critical Fields
```prisma
model Part {
  partNumber    String   @unique
  partName      String    // ⚠️ API expects 'name'
  ...
}

model Inventory {
  partId        String   @unique  // ⚠️ API expects composite key
  onHand        Float             // ⚠️ API uses 'quantity'
  onOrder       Float             // ⚠️ API uses different field
  allocated     Float
  available     Float
  ...
}

// ❌ NO Warehouse model - but API calls prisma.warehouse!
```

#### API Implementation Issues
```typescript
// app/api/v2/inventory/route.ts

// Line 110: Uses 'name' but schema has 'partName'
{ name: { contains: sanitizedSearch, mode: 'insensitive' } }

// Line 166: Uses 'quantity' but schema has 'onHand'
const quantity = Number(inv.quantity);

// Line 123: Calls warehouse but NO model exists!
const warehouses = await prisma.warehouse.findMany({...});
```

#### Verdict: ❌ BROKEN
- Schema/API mismatch sẽ gây runtime errors
- Prisma client không được generate đúng (chỉ 110 lines)
- Thiếu Warehouse model mà API cần

---

### LOCAL VERSION (`/Users/mac/AnhQuocLuong/lerp-mrp`)

*Based on X-ray audit report*

#### Schema Stats
```
Total Models: 123
Includes: Warehouse, more advanced MRP models
```

#### Critical Fields
```prisma
model Part {
  partNumber    String   @unique
  name          String    // ✅ API uses 'name'
  ...
  minStock, maxStock, reorderPoint, safetyStock  // ✅ On Part model
}

model Inventory {
  partId        String
  warehouseId   String
  lotNumber     String?
  quantity      Float     // ✅ API uses 'quantity'
  ...
  @@unique([partId, warehouseId, lotNumber])  // ✅ Composite key
}

model Warehouse {  // ✅ EXISTS
  id, code, name, type, status
  ...
}
```

#### Verdict: ✅ PRODUCTION READY
- Schema matches API implementation
- Full Warehouse support
- Advanced MRP features
- Proper Prisma types generated

---

## 📋 SO SÁNH CHI TIẾT

### Field Mapping

| Entity | Field | Container | Local | API Uses |
|--------|-------|-----------|-------|----------|
| Part | Name | `partName` | `name` | `name` ✅ |
| Part | Stock fields | On Inventory | On Part | On Part ✅ |
| Inventory | Quantity | `onHand` | `quantity` | `quantity` ✅ |
| Inventory | Key | `partId @unique` | Composite | Composite ✅ |
| Warehouse | Model | ❌ Missing | ✅ Exists | Required ✅ |

### Feature Comparison

| Feature | Container | Local |
|---------|-----------|-------|
| Basic Parts CRUD | ⚠️ Broken | ✅ |
| Inventory Management | ⚠️ Broken | ✅ |
| Multi-Warehouse | ❌ | ✅ |
| Lot/Serial Tracking | ❌ | ✅ |
| Advanced MRP | Basic | ✅ Full |
| OEE/Quality | Basic | ✅ Full |
| Workforce Management | Basic | ✅ Full |

---

## 🎯 KHUYẾN NGHỊ

### Option 1: MIGRATE TO LOCAL VERSION (Recommended) ⭐

**Lý do:**
1. Local version đã match với API implementation
2. Có đầy đủ features cho Enterprise MRP
3. 123 models vs 34 = nhiều tính năng hơn
4. Không cần sửa API code

**Action:**
```bash
# Trên máy local của thợ
1. Backup current database
2. Verify prisma schema is correct
3. Run: npx prisma generate
4. Run: npx prisma db push (or migrate)
5. Verify all APIs work
```

### Option 2: FIX CONTAINER VERSION (Not Recommended)

**Requires:**
- Add Warehouse model
- Rename Part.partName → name
- Rename Inventory.onHand → quantity
- Change Inventory key to composite
- Add 89 missing models
- Regenerate Prisma client

**Effort:** ~40 hours

### Option 3: HYBRID (Complex)

Merge features từ cả hai, tạo schema mới.

**Effort:** ~80 hours

---

## 🔧 IMMEDIATE ACTIONS

### For Thợ (Local Machine):

```bash
# 1. Verify current schema is production-ready
cd /Users/mac/AnhQuocLuong/lerp-mrp
cat prisma/schema.prisma | grep -A 10 "model Part"
cat prisma/schema.prisma | grep -A 15 "model Inventory"
cat prisma/schema.prisma | grep -A 10 "model Warehouse"

# 2. Regenerate Prisma client
npx prisma generate

# 3. Test critical APIs
curl http://localhost:3000/api/v2/parts
curl http://localhost:3000/api/v2/inventory
curl http://localhost:3000/api/v2/reports

# 4. Export correct schema for documentation
npx prisma format
cp prisma/schema.prisma /backup/schema-production.prisma
```

### For Documentation:

Update HANDOVER.md với thông tin **CHÍNH XÁC** từ Local version:

```markdown
## CORRECT FIELD NAMES (Local/Production Version)

- Part.name (NOT partName)
- Part.minStock, Part.maxStock, Part.reorderPoint (ON Part, not Inventory)
- Inventory.quantity (NOT onHand)
- Inventory has composite key: [partId, warehouseId, lotNumber]
- Warehouse model EXISTS and is required
```

---

## 📊 ENTERPRISE MIGRATION TOOL FIX

File: `enterprise/migration/migrate.ts`

**CHANGE FROM:**
```typescript
// Line ~291
partName: partName,

// Line ~510
onHand: onHand,
onOrder: ...,
allocated: ...,
```

**CHANGE TO:**
```typescript
// Match Local schema
name: partName,  // API expects 'name'

// Inventory
quantity: onHand,  // API expects 'quantity'
warehouseId: warehouseId,  // Required for composite key
```

---

## ✅ VERIFICATION CHECKLIST

Sau khi thống nhất schema, verify:

- [ ] `npx prisma generate` chạy thành công
- [ ] `npx prisma db push` không có errors
- [ ] GET /api/v2/parts trả về data đúng
- [ ] GET /api/v2/inventory trả về data đúng
- [ ] POST /api/v2/inventory (receive) hoạt động
- [ ] Warehouse list hiển thị đúng
- [ ] MRP run không có errors
- [ ] Enterprise migration tool hoạt động

---

## 📝 ROOT CAUSE ANALYSIS

### Tại sao có 2 versions?

1. **Container environment** được tạo từ một snapshot cũ
2. **Local development** tiếp tục evolve với schema mới
3. **Không có sync mechanism** giữa 2 environments
4. **Documentation** được viết dựa trên Container (sai)

### Prevention

1. Single source of truth cho schema
2. Git-based schema versioning
3. CI/CD pipeline verify schema consistency
4. Schema documentation auto-generated từ Prisma

---

## 🏁 FINAL RECOMMENDATION

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   🏆 USE LOCAL VERSION AS PRODUCTION STANDARD                   │
│                                                                 │
│   - 123 models (full feature set)                               │
│   - Schema matches API implementation                           │
│   - Warehouse support included                                  │
│   - Composite keys for proper inventory tracking                │
│   - Enterprise-grade MRP features                               │
│                                                                 │
│   Container version should be DEPRECATED or SYNCED              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

*Investigation Report - Chief Architect*
*L-ERP MRP Schema Deep Analysis*
*2026-01-09*
