# 🔧 L-ERP MRP SCHEMA SYNC - ACTION PLAN
## Dành cho Thợ - Thực hiện ngay

---

## 📋 TÌNH TRẠNG

Phát hiện **2 versions schema khác nhau:**

| | Container | Local (Your Machine) |
|-|-----------|----------------------|
| Location | `/home/claude/lerp-mrp-app` | `/Users/mac/AnhQuocLuong/lerp-mrp` |
| Models | 34 | 123 |
| Part field | `partName` | `name` |
| Inventory field | `onHand` | `quantity` |
| Warehouse | ❌ Missing | ✅ Exists |
| Status | ❌ Broken | ✅ Working |

**Kết luận:** LOCAL VERSION là đúng và production-ready.

---

## ✅ TASK 1: VERIFY LOCAL SCHEMA

Chạy trên máy local của bạn:

```bash
cd /Users/mac/AnhQuocLuong/lerp-mrp

# 1. Check Part model
echo "=== PART MODEL ===" 
grep -A 20 "^model Part " prisma/schema.prisma

# 2. Check Inventory model
echo "=== INVENTORY MODEL ==="
grep -A 25 "^model Inventory " prisma/schema.prisma

# 3. Check Warehouse model
echo "=== WAREHOUSE MODEL ==="
grep -A 15 "^model Warehouse " prisma/schema.prisma

# 4. Count models
echo "=== TOTAL MODELS ==="
grep -c "^model " prisma/schema.prisma
```

**Báo cáo kết quả về cho Architect!**

---

## ✅ TASK 2: VERIFY API WORKS

```bash
# Start dev server
npm run dev

# Test APIs (new terminal)
curl http://localhost:3000/api/v2/parts | head -50
curl http://localhost:3000/api/v2/inventory | head -50
curl http://localhost:3000/api/health
```

**Chụp screenshot kết quả!**

---

## ✅ TASK 3: EXPORT CORRECT SCHEMA

```bash
# Format and export
npx prisma format

# Copy to safe location
cp prisma/schema.prisma ~/Desktop/schema-production-2026-01-09.prisma

# Also export as documentation
npx prisma generate
```

---

## ✅ TASK 4: FIX ENTERPRISE MIGRATION TOOL

File cần sửa: `enterprise/migration/migrate.ts`

### 4.1 Part Migration (around line 250-300)

**TÌM:**
```typescript
partName: transformed.partName,
// hoặc
partName: partName,
```

**SỬA THÀNH:**
```typescript
name: transformed.partName || transformed.name,
```

### 4.2 Inventory Migration (around line 480-530)

**TÌM:**
```typescript
onHand: onHand,
onOrder: ...,
allocated: ...,
```

**SỬA THÀNH:**
```typescript
quantity: onHand || transformed.quantity,
warehouseId: transformed.warehouseId, // REQUIRED!
lotNumber: transformed.lotNumber || null,
```

---

## ✅ TASK 5: UPDATE DOCUMENTATION

### HANDOVER.md - Sửa phần field names:

**TÌM (sai):**
```markdown
- Part.partName (NOT name)
- Inventory.onHand (NOT quantity)
- Inventory.partId is UNIQUE
```

**SỬA THÀNH (đúng):**
```markdown
- Part.name (NOT partName)
- Inventory.quantity (NOT onHand)
- Inventory has composite key: [partId, warehouseId, lotNumber]
- Warehouse model EXISTS and is required
```

---

## ✅ TASK 6: VERIFY FIXES

```bash
# 1. Regenerate Prisma
npx prisma generate

# 2. Test migration tool (dry run)
npx ts-node enterprise/migration/migrate.ts parts test.csv --dry-run

# 3. Run tests
npm run test

# 4. Build
npm run build
```

---

## 📊 CHECKLIST BÁO CÁO

Gửi lại cho Architect:

- [ ] Part model có field `name` (không phải `partName`)? Y/N
- [ ] Inventory model có field `quantity` (không phải `onHand`)? Y/N
- [ ] Inventory có composite key `[partId, warehouseId, lotNumber]`? Y/N
- [ ] Warehouse model tồn tại? Y/N
- [ ] Tổng số models: ___
- [ ] API /api/v2/parts hoạt động? Y/N
- [ ] API /api/v2/inventory hoạt động? Y/N
- [ ] npm run build thành công? Y/N

---

## ⚠️ LƯU Ý QUAN TRỌNG

1. **KHÔNG SỬA SCHEMA** - Schema local đã đúng
2. **CHỈ SỬA TOOLS & DOCS** - Migration tool và documentation sai
3. **BACKUP TRƯỚC KHI LÀM** - `cp -r . ../lerp-mrp-backup`
4. **BÁO CÁO MỌI LỖI** - Nếu gặp vấn đề, dừng và báo cáo

---

## 📞 ESCALATION

Nếu gặp vấn đề:
1. Chụp screenshot error
2. Copy error message
3. Ghi rõ bước đang làm
4. Báo cáo ngay cho Architect

---

*Action Plan v1.0 - 2026-01-09*
*Priority: HIGH - Thực hiện trong ngày*
