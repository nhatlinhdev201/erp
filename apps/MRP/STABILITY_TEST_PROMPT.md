# 🔒 STABILITY TEST MASTER PROMPT
## Dành cho Thợ - Kiểm tra ổn định trước khi go-live

---

## 🎯 MỤC TIÊU

Hệ thống L-ERP MRP phải đạt tiêu chuẩn **"NEVER SHOW ERRORS"** để thay thế Excel.

**Yêu cầu:**
1. User KHÔNG BAO GIỜ thấy lỗi kỹ thuật
2. Data KHÔNG BAO GIỜ bị mất
3. UI LUÔN hiển thị trạng thái rõ ràng
4. Lỗi được xử lý êm đẹp với thông báo thân thiện

---

## 📋 TASK 1: ERROR HANDLING CHECK

### 1.1 Kiểm tra API Routes

```bash
cd /Users/mac/AnhQuocLuong/lerp-mrp

# Tìm API routes KHÔNG có try-catch
echo "=== API routes missing try-catch ==="
for file in $(find src/app/api -name "route.ts"); do
  if ! grep -q "try {" "$file"; then
    echo "⚠️ Missing try-catch: $file"
  fi
done

# Đếm error handling
echo ""
echo "=== Error handling coverage ==="
echo "Routes with handleError: $(grep -rl "handleError" src/app/api --include="*.ts" | wc -l)"
echo "Routes with try-catch: $(grep -rl "try {" src/app/api --include="*.ts" | wc -l)"
echo "Total routes: $(find src/app/api -name "route.ts" | wc -l)"
```

**Báo cáo:**
- [ ] Tất cả routes có try-catch? Y/N
- [ ] Số routes missing: ___

### 1.2 Kiểm tra Error Boundaries

```bash
# Check React Error Boundaries
echo "=== Error Boundary check ==="
grep -rn "ErrorBoundary" src/components/ --include="*.tsx"
grep -rn "error boundary" src/ --include="*.tsx"

# Check if pages are wrapped
grep -rn "ErrorBoundary" src/app/ --include="*.tsx"
```

**Báo cáo:**
- [ ] Có ErrorBoundary component? Y/N
- [ ] Tất cả pages được wrap? Y/N

---

## 📋 TASK 2: UI STABILITY CHECK

### 2.1 Loading States

```bash
# Check loading indicators
echo "=== Loading state coverage ==="
echo "Components with loading: $(grep -rl "isLoading\|loading\|Loading" src/components/ --include="*.tsx" | wc -l)"
echo "Components with Skeleton: $(grep -rl "Skeleton" src/components/ --include="*.tsx" | wc -l)"

# Find missing loading states
echo ""
echo "=== Potential missing loading states ==="
grep -rn "useSWR\|useQuery" src/ --include="*.tsx" | grep -v "isLoading" | head -10
```

**Báo cáo:**
- [ ] Components có loading indicator: ___ / total
- [ ] Missing loading states: ___

### 2.2 Empty States

```bash
# Check empty state handling
echo "=== Empty state check ==="
grep -rn "length === 0\|không có\|chưa có\|No data\|empty" src/components/ --include="*.tsx" | wc -l

# Check tables specifically
grep -rn "No.*found\|Không.*tìm" src/components/ --include="*.tsx" | head -10
```

**Báo cáo:**
- [ ] Tables có empty state? Y/N
- [ ] Lists có empty state? Y/N

---

## 📋 TASK 3: DATA INTEGRITY CHECK

### 3.1 Validation Coverage

```bash
# Check validation schemas
echo "=== Validation schema coverage ==="
ls -la src/lib/validation/
echo ""
echo "Zod schemas: $(grep -rl "z.object" src/ --include="*.ts" | wc -l)"

# Check server-side validation
echo ""
echo "Routes with validation: $(grep -rl "safeParse\|validateRequest" src/app/api/ --include="*.ts" | wc -l)"
```

**Báo cáo:**
- [ ] Tất cả forms có validation schema? Y/N
- [ ] Server validates inputs? Y/N

### 3.2 Sanitization

```bash
# Check input sanitization
echo "=== Sanitization check ==="
grep -rn "sanitize" src/ --include="*.ts" | wc -l

# Check for raw SQL (dangerous)
echo ""
echo "=== Raw SQL check (should be 0 or carefully reviewed) ==="
grep -rn "\$queryRaw\|\$executeRaw" src/ --include="*.ts"
```

**Báo cáo:**
- [ ] Inputs sanitized? Y/N
- [ ] Raw SQL count: ___ (review nếu > 0)

---

## 📋 TASK 4: MANUAL UI TESTING

### 4.1 Critical Flows - Test từng bước

Mở app ở http://localhost:3000 và test:

#### Flow 1: Parts Management
```
1. [ ] Vào Parts list - có loading? có empty state nếu rỗng?
2. [ ] Search parts - loading indicator?
3. [ ] Create new part - validation errors hiển thị thân thiện?
4. [ ] Submit form rỗng - error message?
5. [ ] Submit duplicate partNumber - error message?
6. [ ] Edit part - pre-fill đúng?
7. [ ] Delete part - confirmation dialog?
```

#### Flow 2: Inventory
```
1. [ ] Vào Inventory - loading state?
2. [ ] Receive goods - validation?
3. [ ] Receive với quantity 0 - error?
4. [ ] Issue vượt available - error message thân thiện?
5. [ ] Transfer between warehouses - works?
```

#### Flow 3: Work Orders
```
1. [ ] Create Work Order - BOM validation?
2. [ ] Start WO khi không đủ material - warning?
3. [ ] Complete WO - quantity validation?
4. [ ] Cancel WO - confirmation?
```

#### Flow 4: MRP
```
1. [ ] Run MRP - loading indicator?
2. [ ] MRP với data lớn - timeout handling?
3. [ ] MRP results - display correctly?
```

#### Flow 5: Reports
```
1. [ ] Generate report - loading?
2. [ ] Export empty data - handles gracefully?
3. [ ] Export large dataset - progress indicator?
```

### 4.2 Error Scenarios - Cố ý gây lỗi

```
1. [ ] Disconnect network - error message thân thiện?
2. [ ] Submit invalid data - validation message?
3. [ ] Navigate to non-existent page - 404 page?
4. [ ] Double-click submit - prevented?
5. [ ] Refresh during operation - no data loss?
```

---

## 📋 TASK 5: CONSOLE ERROR CHECK

### 5.1 Clean Console Test

```bash
# Start dev server
npm run dev

# Open browser, open DevTools (F12)
# Navigate through ALL pages
# Check Console tab for ANY red errors
```

**Pages to visit:**
- [ ] Dashboard - no errors
- [ ] Parts list - no errors
- [ ] Inventory - no errors
- [ ] Work Orders - no errors
- [ ] MRP - no errors
- [ ] Reports - no errors
- [ ] Settings - no errors

**Báo cáo:**
- [ ] Total console errors found: ___
- [ ] Critical errors: ___

### 5.2 Network Errors

```
# In DevTools Network tab, check for:
- [ ] No 4xx errors (except intentional)
- [ ] No 5xx errors
- [ ] All API calls succeed
```

---

## 📋 TASK 6: SPECIFIC BUG HUNT

### 6.1 Common Issues to Check

```bash
# Check for undefined/null display
grep -rn "undefined\|null" src/components/ --include="*.tsx" | grep -v "typeof\|===\|!==\|\?\." | head -20

# Check for missing optional chaining
grep -rn "\.map\|\.filter" src/components/ --include="*.tsx" | grep -v "\?\." | head -10
```

### 6.2 Error Message Quality

Kiểm tra các error messages KHÔNG hiển thị:
- [ ] Stack traces
- [ ] Database errors
- [ ] Technical codes
- [ ] Internal paths
- [ ] API keys/secrets

---

## 📋 TASK 7: PERFORMANCE QUICK CHECK

### 7.1 Load Time

```
Measure với DevTools Network tab:
- [ ] Dashboard load: < 3s ?
- [ ] Parts list (100 items): < 2s ?
- [ ] Search response: < 1s ?
```

### 7.2 Memory

```
Monitor với DevTools Memory tab:
- [ ] No memory leaks after navigation?
- [ ] Memory stable after 5 minutes?
```

---

## 📊 BÁO CÁO TỔNG HỢP

### Template báo cáo cho Architect:

```markdown
# L-ERP MRP STABILITY TEST REPORT
Date: 2026-01-09
Tester: [Name]

## Summary
- Error Handling: ___/100
- UI Stability: ___/100  
- Data Integrity: ___/100
- Manual Test Pass: ___/total

## Critical Issues Found
1. [Issue] - [Location] - [Severity]
2. ...

## Console Errors
- Total: ___
- Critical: ___
- List: [...]

## Manual Test Results
- Parts flow: PASS/FAIL
- Inventory flow: PASS/FAIL
- Work Orders: PASS/FAIL
- MRP: PASS/FAIL
- Reports: PASS/FAIL

## Error Messages Quality
- User-friendly: Y/N
- No technical leaks: Y/N

## Performance
- Dashboard: ___ms
- Parts list: ___ms
- Search: ___ms

## Overall Score: ___/100
## Ready for Production: Y/N
```

---

## ⚠️ CRITICAL CHECKLIST

Trước khi báo cáo "Ready", xác nhận:

- [ ] **ZERO** unhandled exceptions trong console
- [ ] **ZERO** technical error messages hiển thị cho user
- [ ] **ALL** forms có validation
- [ ] **ALL** async operations có loading state
- [ ] **ALL** empty states handled
- [ ] **ALL** error scenarios có friendly message
- [ ] **NO** data loss trong bất kỳ scenario nào

---

## 📞 ESCALATION

Nếu phát hiện issues:
1. Chụp screenshot
2. Copy console error (nếu có)
3. Ghi rõ steps to reproduce
4. Báo cáo ngay cho Architect

**Priority levels:**
- 🔴 Critical: Gây mất data hoặc crash
- 🟡 High: User thấy lỗi kỹ thuật
- 🟢 Medium: UX không smooth
- ⚪ Low: Cosmetic issues

---

*Stability Test Master Prompt v1.0*
*Target: "Never Show Errors" Standard*
*Project: L-ERP MRP Production Readiness*
