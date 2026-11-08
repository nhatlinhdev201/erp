# 🔒 L-ERP MRP STABILITY AUDIT
## Production Readiness - "Never Show Errors" Standard
## Date: 2026-01-09

---

## 🎯 MỤC TIÊU

Hệ thống thay thế Excel phải đảm bảo:
1. **NEVER hiển thị lỗi kỹ thuật** cho end user
2. **NEVER mất data** trong mọi tình huống
3. **ALWAYS có fallback** khi có vấn đề
4. **GRACEFUL degradation** - lỗi được xử lý êm đẹp

---

## 📋 PHASE 1: ERROR HANDLING AUDIT

### 1.1 API Routes - Error Boundaries

```bash
# Check tất cả API routes có try-catch
grep -rL "try {" src/app/api/ --include="*.ts" | head -20

# Check có handleError helper
grep -r "handleError\|catch" src/app/api/ --include="*.ts" | wc -l

# Check for unhandled promise rejections
grep -rn "async.*=>" src/app/api/ --include="*.ts" | grep -v "try\|catch" | head -10
```

**Checklist:**
- [ ] Tất cả API routes có try-catch wrapper
- [ ] Sử dụng handleError() helper nhất quán
- [ ] Không có unhandled async operations
- [ ] Error responses có format chuẩn { error: string, code: number }

### 1.2 Client Components - Error Boundaries

```bash
# Check React Error Boundaries
grep -rn "ErrorBoundary\|error boundary" src/components/ --include="*.tsx"

# Check for unhandled errors in useEffect
grep -rn "useEffect" src/components/ --include="*.tsx" | grep -v "try\|catch" | head -10

# Check async operations in components
grep -rn "await " src/components/ --include="*.tsx" | grep -v "try" | head -10
```

**Checklist:**
- [ ] Có global ErrorBoundary component
- [ ] Tất cả pages wrap trong ErrorBoundary
- [ ] useEffect với async có error handling
- [ ] fetch/API calls có try-catch

### 1.3 Form Validation

```bash
# Check form validation schemas
ls -la src/lib/validation/
ls -la src/components/*/\*-form-schema.ts

# Check zod schemas coverage
grep -rn "z.object\|z.string\|z.number" src/ --include="*.ts" | wc -l
```

**Checklist:**
- [ ] Tất cả forms có Zod validation schema
- [ ] Server-side validation cho tất cả inputs
- [ ] Client-side validation hiển thị lỗi thân thiện
- [ ] Không có field nào bỏ qua validation

---

## 📋 PHASE 2: UI/UX STABILITY

### 2.1 Loading States

```bash
# Check loading indicators
grep -rn "isLoading\|loading\|Loading\|Skeleton" src/components/ --include="*.tsx" | wc -l

# Check for missing loading states
grep -rn "useSWR\|useQuery\|fetch" src/ --include="*.tsx" | grep -v "isLoading\|loading" | head -10
```

**Checklist:**
- [ ] Tất cả data fetching có loading indicator
- [ ] Skeleton loaders cho initial load
- [ ] Button loading state khi submit
- [ ] Page transitions smooth

### 2.2 Empty States

```bash
# Check empty state handling
grep -rn "empty\|no data\|không có\|chưa có" src/components/ --include="*.tsx" | head -20

# Check for array length checks
grep -rn "\.length === 0\|\.length > 0\|!.*\.length" src/components/ --include="*.tsx" | head -10
```

**Checklist:**
- [ ] Tất cả lists có empty state message
- [ ] Empty state có actionable guidance
- [ ] Không hiển thị "undefined" hoặc "null"
- [ ] Tables có "No data" row

### 2.3 Error Display

```bash
# Check user-friendly error messages
grep -rn "toast\|Toast\|notification\|alert" src/ --include="*.tsx" | head -20

# Check for technical error exposure
grep -rn "error.message\|err.message\|\.stack" src/components/ --include="*.tsx" | head -10
```

**Checklist:**
- [ ] Lỗi hiển thị message thân thiện (không technical)
- [ ] Toast/notification cho actions
- [ ] Không hiển thị stack trace
- [ ] Có retry option cho recoverable errors

---

## 📋 PHASE 3: DATA INTEGRITY

### 3.1 Database Operations

```bash
# Check transaction usage
grep -rn "\$transaction" src/ --include="*.ts" | head -10

# Check for missing transactions in multi-step operations
grep -rn "prisma\." src/app/api/ --include="*.ts" | grep -c "create\|update\|delete"
```

**Checklist:**
- [ ] Multi-step operations dùng transactions
- [ ] Optimistic locking cho concurrent updates
- [ ] Soft delete thay vì hard delete
- [ ] Audit log cho data changes

### 3.2 Input Sanitization

```bash
# Check sanitization
grep -rn "sanitize\|escape\|encode" src/ --include="*.ts" | head -20

# Check for SQL injection vectors
grep -rn "prisma\.\$queryRaw\|prisma\.\$executeRaw" src/ --include="*.ts" | head -10
```

**Checklist:**
- [ ] Tất cả user inputs được sanitize
- [ ] Không có raw SQL queries với user input
- [ ] XSS prevention cho display
- [ ] File upload validation

### 3.3 Data Validation

```bash
# Check server-side validation
grep -rn "validateRequest\|zodResolver\|safeParse" src/app/api/ --include="*.ts" | head -20

# Check for type coercion issues
grep -rn "Number(\|parseInt\|parseFloat" src/ --include="*.ts" | grep -v "isNaN" | head -10
```

**Checklist:**
- [ ] Server validates ALL inputs (không trust client)
- [ ] Number parsing có NaN check
- [ ] Date parsing có invalid date check
- [ ] Enum values validated against allowed list

---

## 📋 PHASE 4: EDGE CASES

### 4.1 Null/Undefined Handling

```bash
# Check optional chaining usage
grep -rn "\?\." src/components/ --include="*.tsx" | wc -l

# Check for potential null errors
grep -rn "\.map\|\.filter\|\.find" src/components/ --include="*.tsx" | grep -v "?\." | head -10
```

**Checklist:**
- [ ] Optional chaining cho nested access
- [ ] Nullish coalescing cho defaults
- [ ] Array methods protected against undefined
- [ ] Object property access protected

### 4.2 Network Failures

```bash
# Check retry logic
grep -rn "retry\|Retry\|attempt" src/ --include="*.ts" | head -10

# Check timeout handling
grep -rn "timeout\|AbortController" src/ --include="*.ts" | head -10
```

**Checklist:**
- [ ] API calls có timeout
- [ ] Retry logic cho transient failures
- [ ] Offline detection
- [ ] Network error messages thân thiện

### 4.3 Concurrent Operations

```bash
# Check for race conditions
grep -rn "Promise.all\|Promise.race" src/ --include="*.ts" | head -10

# Check optimistic updates
grep -rn "optimistic\|mutate" src/ --include="*.ts" | head -10
```

**Checklist:**
- [ ] Concurrent requests handled properly
- [ ] Optimistic updates có rollback
- [ ] Stale data prevention
- [ ] Double-submit prevention

---

## 📋 PHASE 5: SPECIFIC MRP SCENARIOS

### 5.1 Inventory Operations

**Test Cases:**
- [ ] Receive goods với quantity = 0
- [ ] Issue goods vượt quá available
- [ ] Transfer giữa warehouses
- [ ] Negative inventory prevention
- [ ] Lot tracking với expired lots
- [ ] Concurrent inventory updates

### 5.2 Work Orders

**Test Cases:**
- [ ] Create WO với BOM rỗng
- [ ] Start WO khi inventory không đủ
- [ ] Complete WO với scrap > planned
- [ ] Cancel WO đã started
- [ ] Concurrent WO status updates

### 5.3 MRP Calculations

**Test Cases:**
- [ ] MRP với circular BOM
- [ ] MRP với missing lead times
- [ ] MRP với 0 safety stock
- [ ] MRP với infinite loop prevention
- [ ] Large scale MRP (10K+ parts)

### 5.4 Reports & Exports

**Test Cases:**
- [ ] Export empty dataset
- [ ] Export 100K+ records
- [ ] Report với date range invalid
- [ ] PDF generation timeout
- [ ] Excel với special characters

---

## 📋 PHASE 6: SPECIFIC ERROR MESSAGES

### Cần kiểm tra các lỗi này hiển thị THÂN THIỆN:

| Scenario | Technical Error | User-Friendly Message |
|----------|-----------------|----------------------|
| Network down | `ERR_NETWORK` | "Không thể kết nối. Vui lòng kiểm tra mạng." |
| Invalid input | `Zod validation error` | "Vui lòng kiểm tra lại thông tin nhập." |
| Not found | `404 Not Found` | "Không tìm thấy dữ liệu." |
| Server error | `500 Internal Server` | "Có lỗi xảy ra. Vui lòng thử lại sau." |
| Auth expired | `401 Unauthorized` | "Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại." |
| Duplicate | `Unique constraint` | "Mã này đã tồn tại. Vui lòng dùng mã khác." |
| Required field | `Required` | "Trường này bắt buộc." |
| Insufficient stock | `Insufficient quantity` | "Số lượng tồn kho không đủ." |

---

## 📋 PHASE 7: PERFORMANCE UNDER LOAD

### 7.1 Response Times

**Targets:**
- [ ] Page load: < 3 seconds
- [ ] API response: < 500ms (P95)
- [ ] Search: < 1 second
- [ ] Report generation: < 30 seconds

### 7.2 Memory Leaks

```bash
# Check for potential memory leaks
grep -rn "addEventListener\|setInterval\|setTimeout" src/components/ --include="*.tsx" | head -20

# Check cleanup in useEffect
grep -rn "return () =>" src/components/ --include="*.tsx" | wc -l
```

**Checklist:**
- [ ] useEffect có cleanup function
- [ ] Event listeners được remove
- [ ] Intervals/timeouts cleared
- [ ] Large arrays không giữ trong state

---

## ✅ FINAL CHECKLIST

### Critical (Must Have)

- [ ] **Zero unhandled errors** trong console
- [ ] **Zero technical messages** hiển thị cho user
- [ ] **Zero data loss** scenarios
- [ ] **All forms validated** client + server
- [ ] **All async operations** có loading state
- [ ] **All lists** có empty state
- [ ] **All API calls** có error handling

### Important (Should Have)

- [ ] Retry logic cho network failures
- [ ] Offline indicator
- [ ] Session timeout warning
- [ ] Auto-save for forms
- [ ] Undo for destructive actions

### Nice to Have

- [ ] Keyboard shortcuts
- [ ] Accessibility (ARIA)
- [ ] Print-friendly views
- [ ] Dark mode support

---

## 🔧 COMMANDS TO RUN

```bash
# 1. Check for console errors
npm run dev
# Open browser console, navigate all pages

# 2. Run type check
npx tsc --noEmit

# 3. Run linter
npm run lint

# 4. Run tests
npm run test

# 5. Check bundle size
npm run build
npx next-bundle-analyzer

# 6. Check for vulnerabilities
npm audit

# 7. Load test
k6 run enterprise/capacity-test/capacity-test.js
```

---

## 📊 SCORING

| Category | Weight | Score | Weighted |
|----------|--------|-------|----------|
| Error Handling | 25% | /100 | |
| UI/UX Stability | 20% | /100 | |
| Data Integrity | 25% | /100 | |
| Edge Cases | 15% | /100 | |
| Performance | 15% | /100 | |
| **TOTAL** | 100% | | **/100** |

**Minimum for Production: 90/100**

---

*Stability Audit Checklist v1.0*
*Standard: "Never Show Errors"*
*Target: Replace Excel with Zero Disruption*
