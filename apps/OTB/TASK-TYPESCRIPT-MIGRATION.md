# ═══════════════════════════════════════════════════════════════════════════════
# 🔧 TASK: TypeScript Migration — OTBnonAI
# Priority: 🔴 CRITICAL
# Estimated: 3-4 hours
# ═══════════════════════════════════════════════════════════════════════════════

## 📋 TASK OVERVIEW

```
MỤC TIÊU: Chuyển đổi 100% codebase từ JavaScript sang TypeScript
─────────────────────────────────────────────────────────────────
BEFORE                           AFTER
├── *.jsx files                  ├── *.tsx files (100%)
├── *.js files                   ├── *.ts files (100%)
├── Implicit any types           ├── Explicit types
└── Runtime errors               └── Compile-time safety
```

---

## ⚡ STEP 1: Analyze Current State (5 min)

```bash
cd ~/OTBL-ERP/OTBnonAI

# Count files to migrate
echo "=== FILES TO MIGRATE ==="
echo "JSX files: $(find src -name '*.jsx' 2>/dev/null | wc -l)"
echo "JS files:  $(find src -name '*.js' -not -path '*/node_modules/*' 2>/dev/null | wc -l)"
echo ""
echo "=== ALREADY TYPESCRIPT ==="
echo "TSX files: $(find src -name '*.tsx' 2>/dev/null | wc -l)"
echo "TS files:  $(find src -name '*.ts' -not -name '*.d.ts' 2>/dev/null | wc -l)"

# List all JSX files
echo ""
echo "=== JSX FILES LIST ==="
find src -name '*.jsx' 2>/dev/null
```

**Expected Output Example:**
```
=== FILES TO MIGRATE ===
JSX files: 45
JS files:  12

=== ALREADY TYPESCRIPT ===
TSX files: 5
TS files:  3
```

**Báo cáo kết quả này trước khi tiếp tục!**

---

## ⚡ STEP 2: Create Backup (2 min)

```bash
cd ~/OTBL-ERP/OTBnonAI

# Create backup
mkdir -p .migration-backup
cp -r src .migration-backup/src_$(date +%Y%m%d_%H%M%S)

echo "✅ Backup created at .migration-backup/"
ls -la .migration-backup/
```

---

## ⚡ STEP 3: Create Type Definitions File (10 min)

Tạo file `src/types/index.ts`:

```bash
mkdir -p src/types
```

```typescript
// src/types/index.ts
// ═══════════════════════════════════════════════════════════════
// OTBnonAI — Shared Type Definitions
// ═══════════════════════════════════════════════════════════════

// ─── API Response Types ─────────────────────────────────────────

export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}

export interface ApiError {
  message: string;
  statusCode: number;
  error?: string;
}

// ─── User & Auth ────────────────────────────────────────────────

export type UserRole = 'admin' | 'buyer' | 'merchandiser' | 'manager' | 'finance';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

// ─── Budget ─────────────────────────────────────────────────────

export type BudgetStatus = 'draft' | 'submitted' | 'approved' | 'rejected';

export interface Budget {
  id: string;
  name: string;
  code: string;
  totalBudget: number;
  committedBudget: number;
  status: BudgetStatus;
  brandId: string;
  brand?: GroupBrand;
  fiscalYear: number;
  seasonGroup?: string;
  season?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BudgetDetail {
  id: string;
  budgetId: string;
  storeId: string;
  store?: Store;
  seasonGroup: string;
  season: string;
  rexAmount: number;
  ttpAmount: number;
  totalAmount: number;
}

export interface BudgetFilters {
  fiscalYear?: number;
  brandId?: string;
  status?: BudgetStatus;
  seasonGroup?: string;
  search?: string;
}

// ─── Planning ───────────────────────────────────────────────────

export type PlanningVersionType = 'V0' | 'V1' | 'V2' | 'V3' | 'FINAL';

export interface PlanningVersion {
  id: string;
  budgetId: string;
  budget?: Budget;
  version: PlanningVersionType;
  isFinal: boolean;
  totalPlanned: number;
  createdAt: string;
  updatedAt: string;
}

export interface PlanningDetail {
  id: string;
  planningVersionId: string;
  collectionId?: string;
  collection?: Collection;
  genderId?: string;
  gender?: Gender;
  categoryId?: string;
  category?: Category;
  percentage: number;
  amount: number;
}

// ─── Proposal ───────────────────────────────────────────────────

export type ProposalStatus = 'draft' | 'submitted' | 'approved' | 'rejected';

export interface Proposal {
  id: string;
  budgetId: string;
  budget?: Budget;
  planningVersionId: string;
  planningVersion?: PlanningVersion;
  status: ProposalStatus;
  totalValue: number;
  totalQuantity: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProposalProduct {
  id: string;
  proposalId: string;
  skuId: string;
  sku?: SkuCatalog;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

// ─── Master Data ────────────────────────────────────────────────

export interface GroupBrand {
  id: string;
  name: string;
  code: string;
  sortOrder: number;
  isActive: boolean;
}

export interface Store {
  id: string;
  name: string;
  code: string;
  type: 'REX' | 'TTP' | 'OUTLET';
  isActive: boolean;
}

export interface Collection {
  id: string;
  name: string;
  code: string;
}

export interface Gender {
  id: string;
  name: string;
  code: string;
}

export interface Category {
  id: string;
  name: string;
  code: string;
  parentId?: string;
  subCategories?: SubCategory[];
}

export interface SubCategory {
  id: string;
  name: string;
  code: string;
  categoryId: string;
}

export interface SkuCatalog {
  id: string;
  sku: string;
  name: string;
  brandId: string;
  brand?: GroupBrand;
  categoryId: string;
  category?: Category;
  genderId: string;
  gender?: Gender;
  unitPrice: number;
  imageUrl?: string;
  isActive: boolean;
}

// ─── Approval ───────────────────────────────────────────────────

export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

export interface Approval {
  id: string;
  entityType: 'budget' | 'planning' | 'proposal';
  entityId: string;
  status: ApprovalStatus;
  step: number;
  approverId?: string;
  approver?: User;
  comments?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApprovalWorkflowStep {
  id: string;
  step: number;
  name: string;
  role: UserRole;
  isRequired: boolean;
}

// ─── Ticket ─────────────────────────────────────────────────────

export type TicketStatus = 'draft' | 'submitted' | 'in_review' | 'approved' | 'rejected';

export interface Ticket {
  id: string;
  budgetId: string;
  budget?: Budget;
  status: TicketStatus;
  currentStep: number;
  submittedBy?: string;
  submittedAt?: string;
  approvalHistory: ApprovalHistoryItem[];
  createdAt: string;
  updatedAt: string;
}

export interface ApprovalHistoryItem {
  step: number;
  stepName: string;
  status: ApprovalStatus;
  approverId?: string;
  approverName?: string;
  comments?: string;
  timestamp: string;
}

// ─── UI & Component Types ───────────────────────────────────────

export interface SelectOption {
  value: string;
  label: string;
}

export interface TableColumn<T> {
  key: keyof T | string;
  header: string;
  width?: string;
  render?: (value: unknown, row: T) => React.ReactNode;
  sortable?: boolean;
}

export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface SortParams {
  field: string;
  direction: 'asc' | 'desc';
}

// ─── Event Handler Types ────────────────────────────────────────

export type InputChangeEvent = React.ChangeEvent<HTMLInputElement>;
export type SelectChangeEvent = React.ChangeEvent<HTMLSelectElement>;
export type TextareaChangeEvent = React.ChangeEvent<HTMLTextAreaElement>;
export type FormSubmitEvent = React.FormEvent<HTMLFormElement>;
export type ButtonClickEvent = React.MouseEvent<HTMLButtonElement>;
export type DivClickEvent = React.MouseEvent<HTMLDivElement>;

// ─── Utility Types ──────────────────────────────────────────────

export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type AsyncFunction<T> = () => Promise<T>;
```

---

## ⚡ STEP 4: Rename All Files (5 min)

```bash
cd ~/OTBL-ERP/OTBnonAI

# Rename .jsx → .tsx
find src -name "*.jsx" -exec bash -c 'mv "$0" "${0%.jsx}.tsx"' {} \;

# Rename .js → .ts (trong src folder, không phải config files)
find src -name "*.js" -not -path "*/node_modules/*" -exec bash -c 'mv "$0" "${0%.js}.ts"' {} \;

# Verify
echo "=== AFTER MIGRATION ==="
echo "JSX files: $(find src -name '*.jsx' 2>/dev/null | wc -l)"
echo "JS files:  $(find src -name '*.js' -not -path '*/node_modules/*' 2>/dev/null | wc -l)"
echo "TSX files: $(find src -name '*.tsx' 2>/dev/null | wc -l)"
echo "TS files:  $(find src -name '*.ts' -not -name '*.d.ts' 2>/dev/null | wc -l)"
```

**Expected Output:**
```
=== AFTER MIGRATION ===
JSX files: 0
JS files:  0
TSX files: 50
TS files:  15
```

---

## ⚡ STEP 5: Update Imports (5 min)

```bash
cd ~/OTBL-ERP/OTBnonAI

# Remove .jsx extensions from imports
find src -type f \( -name "*.tsx" -o -name "*.ts" \) -exec sed -i '' "s/from '\(.*\)\.jsx'/from '\1'/g" {} \; 2>/dev/null || \
find src -type f \( -name "*.tsx" -o -name "*.ts" \) -exec sed -i "s/from '\(.*\)\.jsx'/from '\1'/g" {} \;

# Remove .js extensions from imports
find src -type f \( -name "*.tsx" -o -name "*.ts" \) -exec sed -i '' "s/from '\(.*\)\.js'/from '\1'/g" {} \; 2>/dev/null || \
find src -type f \( -name "*.tsx" -o -name "*.ts" \) -exec sed -i "s/from '\(.*\)\.js'/from '\1'/g" {} \;

echo "✅ Imports updated"
```

---

## ⚡ STEP 6: Run TypeScript Check (10 min)

```bash
cd ~/OTBL-ERP/OTBnonAI

# Check errors
npx tsc --noEmit 2>&1 | tee typescript-errors.log

# Count errors
ERROR_COUNT=$(grep -c "error TS" typescript-errors.log || echo "0")
echo ""
echo "═══════════════════════════════════════"
echo "  Total TypeScript Errors: $ERROR_COUNT"
echo "═══════════════════════════════════════"

# Show error breakdown by type
echo ""
echo "Error breakdown:"
grep -oE "TS[0-9]+" typescript-errors.log | sort | uniq -c | sort -rn | head -10
```

**Báo cáo error count và breakdown trước khi tiếp tục!**

---

## ⚡ STEP 7: Fix Errors by Priority (2-3 hours)

### 7.1 Fix TS7006 — Implicit 'any' in Component Props (Highest Volume)

**Pattern to find:**
```bash
grep -n "TS7006" typescript-errors.log | head -20
```

**Fix Pattern:**
```tsx
// ❌ BEFORE
const BudgetCard = ({ title, value, status, onPress }) => {
  
// ✅ AFTER
interface BudgetCardProps {
  title: string;
  value: number;
  status: BudgetStatus;
  onPress?: () => void;
  className?: string;
}

const BudgetCard = ({ title, value, status, onPress, className }: BudgetCardProps) => {
```

### 7.2 Fix TS7006 — Event Handlers

**Fix Pattern:**
```tsx
// ❌ BEFORE
const handleClick = (e) => {
const handleChange = (e) => {

// ✅ AFTER
const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
const handleSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
```

### 7.3 Fix TS2345 — useState Type Mismatch

**Fix Pattern:**
```tsx
// ❌ BEFORE
const [budgets, setBudgets] = useState([]);
const [selected, setSelected] = useState(null);

// ✅ AFTER
import { Budget } from '@/types';

const [budgets, setBudgets] = useState<Budget[]>([]);
const [selected, setSelected] = useState<Budget | null>(null);
```

### 7.4 Fix TS2531 — Object Possibly Null

**Fix Pattern:**
```tsx
// ❌ BEFORE
const inputRef = useRef();
inputRef.current.focus();

// ✅ AFTER
const inputRef = useRef<HTMLInputElement>(null);
inputRef.current?.focus();
// or
if (inputRef.current) {
  inputRef.current.focus();
}
```

### 7.5 Fix TS2339 — Property Does Not Exist

**Fix Pattern:**
```tsx
// ❌ BEFORE
const data = await response.json();
setBudgets(data.items);

// ✅ AFTER
interface ApiResponse {
  items: Budget[];
  total: number;
}
const data: ApiResponse = await response.json();
setBudgets(data.items);
```

---

## ⚡ STEP 8: Iterative Fix Process

```bash
# After each batch of fixes, check remaining errors
npx tsc --noEmit 2>&1 | grep -c "error TS"

# When errors < 50, list them all
npx tsc --noEmit 2>&1 | grep "error TS"
```

**Target: 0 errors**

---

## ⚡ STEP 9: Verify Build (5 min)

```bash
cd ~/OTBL-ERP/OTBnonAI

# Run build
npm run build

# Expected: Build successful with 0 errors
```

---

## ⚡ STEP 10: Commit Changes (5 min)

```bash
cd ~/OTBL-ERP/OTBnonAI

# Stage all changes
git add -A

# Commit
git commit -m "chore: migrate codebase to TypeScript

- Rename all .jsx files to .tsx
- Rename all .js files to .ts  
- Add src/types/index.ts with shared type definitions
- Fix all TypeScript errors
- Update imports to remove file extensions

Breaking: None
Testing: npm run build passes"

# Push
git push origin main
```

---

## 📋 CHECKLIST

```
[ ] Step 1: Analyze - báo cáo file counts
[ ] Step 2: Backup created
[ ] Step 3: src/types/index.ts created
[ ] Step 4: All files renamed (.jsx → .tsx, .js → .ts)
[ ] Step 5: Imports updated
[ ] Step 6: Initial error count: ____
[ ] Step 7: Errors fixed iteratively
[ ] Step 8: Final error count: 0
[ ] Step 9: npm run build PASS
[ ] Step 10: Committed and pushed
```

---

## 📊 REPORT TEMPLATE

Sau khi hoàn thành, báo cáo theo format:

```
TYPESCRIPT MIGRATION REPORT
═══════════════════════════════════════
Date: ___________
Repo: OTBnonAI

FILES MIGRATED:
- .jsx → .tsx: ___ files
- .js → .ts: ___ files
- Total: ___ files

ERRORS FIXED:
- Initial: ___ errors
- Final: 0 errors

TYPE DEFINITIONS:
- src/types/index.ts: ___ lines
- Interfaces defined: ___

BUILD STATUS: [ ] PASS / [ ] FAIL

COMMIT: ___________
```

---

## ⚠️ TROUBLESHOOTING

### Nếu gặp lỗi "Cannot find module"
```bash
# Clear Next.js cache
rm -rf .next
npm run build
```

### Nếu gặp lỗi với node_modules types
```bash
npm install -D @types/react @types/node
```

### Nếu ESLint báo lỗi
```bash
# Temporarily disable for migration
npm run build -- --no-lint
# Fix lint sau khi build pass
```

---

**Priority:** 🔴 CRITICAL
**Deadline:** Hoàn thành trong ngày
**Contact:** Báo cáo progress mỗi 1 giờ
