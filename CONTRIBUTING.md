# Hướng dẫn Đóng góp / Contributing to Linkk-ERP Platform

Cảm ơn bạn đã quan tâm đến L-ERP! Tài liệu này sẽ giúp bạn bắt đầu đóng góp vào dự án.

Thank you for your interest in contributing to L-ERP! This guide will help you get started contributing to the project.

## Chào mừng / Welcome

Linkk-ERP Platform là một dự án mã nguồn mở hướng tới cộng đồng. Chúng tôi hoan nghênh mọi đóng góp từ:
- 🐛 Báo cáo và sửa lỗi / Bug reports and fixes
- ✨ Tính năng mới / New features
- 📚 Cải tiến tài liệu / Documentation improvements
- 🔍 Kiểm thử / Testing and QA
- 🌍 Dịch và bản địa hoá / Translations
- 💬 Feedback về thiết kế / Design feedback

Linkk-ERP Platform is an open-source community-driven project. We welcome contributions of all kinds:
- Bug reports and fixes
- New features and enhancements
- Documentation improvements
- Testing and quality assurance
- Translations and localization
- Design feedback

## Bắt đầu / Getting Started

### Prerequisites / Yêu cầu

- Node.js 20+ (download: https://nodejs.org/)
- npm 10+
- Docker & Docker Compose (optional, for local database)
- Git

### Quick Setup (Windows, macOS, Linux)

```bash
# 1. Fork và clone kho mã nguồn
git clone https://github.com/YOUR-USERNAME/Viet-ERP.git
cd Viet-ERP

# 2. Chạy setup tự động (cross-platform, hoạt động trên mọi OS)
npm run setup
```

Script `npm run setup` sẽ tự động: kiểm tra Node/npm/Docker, cài dependencies, tạo `.env`, khởi động Docker, và setup database.

The `npm run setup` script automatically: checks Node/npm/Docker, installs dependencies, creates `.env`, starts Docker, and sets up the database.

### Manual Setup / Thiết lập Thủ công

Nếu `npm run setup` gặp lỗi, bạn có thể chạy từng bước:

If `npm run setup` fails, you can run each step manually:

```bash
# 1. Cài đặt dependencies
npm install --legacy-peer-deps

# 2. Sao chép file environment
#    macOS/Linux:
cp .env.example .env
#    Windows (PowerShell):
Copy-Item .env.example .env

# 3. Khởi động PostgreSQL (Docker)
npm run docker:up

# 4. Setup database
npm run db:migrate

# 5. Khởi động development server
npm run dev
```

### Available Commands / Lệnh Khả dụng

Tất cả lệnh đều dùng `npm` — hoạt động trên **Windows, macOS, Linux** mà không cần cài thêm gì.

All commands use `npm` — works on **Windows, macOS, Linux** without extra tools.

| Lệnh / Command | Mô tả / Description |
|---|---|
| `npm run setup` | Setup toàn bộ môi trường / Full environment setup |
| `npm run dev` | Khởi động dev server / Start dev server |
| `npm run build` | Build tất cả modules / Build all modules |
| `npm test` | Chạy unit tests / Run unit tests |
| `npm run test:e2e` | Chạy E2E tests / Run E2E tests |
| `npm run lint` | Kiểm tra code / Lint code |
| `npm run typecheck` | Kiểm tra TypeScript / Type check |
| `npm run clean` | Xoá build artifacts / Remove build artifacts |
| `npm run docker:up` | Khởi động Docker services |
| `npm run docker:down` | Dừng Docker services |
| `npm run db:migrate` | Chạy database migrations |
| `npm run db:seed` | Seed dữ liệu mẫu / Seed sample data |

> **Note for macOS/Linux users**: `make` commands are also available (e.g., `make dev`, `make setup`). See `make help` for the full list.

## Quy trình Đóng góp / Contribution Workflow

### 1. Chọn Issue hoặc Tạo Issue / Pick an Issue or Create One

```bash
# Xem các issue cần trợ giúp
# https://github.com/lacviet-erp/Viet-ERP/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22

# Nếu bạn có ý tưởng mới, hãy tạo issue trước
# Để không trùng lặp công việc
```

### 2. Tạo Nhánh / Create a Branch

```bash
# Cập nhật main
git checkout main
git pull origin main

# Tạo nhánh tính năng từ issue (vd: issue #123)
git checkout -b feature/add-customer-segments-123

# Hoặc sửa lỗi
git checkout -b fix/incorrect-tax-calculation-124

# Hoặc cải tiến tài liệu
git checkout -b docs/update-migration-guide-125
```

**Quy ước đặt tên nhánh / Branch Naming Convention:**
- `feature/<description>-<issue-number>` — Tính năng mới
- `fix/<description>-<issue-number>` — Sửa lỗi
- `docs/<description>-<issue-number>` — Tài liệu
- `refactor/<description>-<issue-number>` — Tái cấu trúc
- `test/<description>-<issue-number>` — Kiểm thử
- `perf/<description>-<issue-number>` — Hiệu suất

### 3. Tạo Commits / Make Commits

Tuân theo Conventional Commits format:

```bash
git commit -m "feat(crm): add customer segmentation field

- Adds 'segments' field to Customer model
- Supports JSON array of segment IDs
- Includes database migration
- Resolves #123"
```

**Format Commit Message:**
```
<type>(<scope>): <description>

[optional body]

[optional footer: Resolves #issue-number]
```

**Types:**
- `feat` — Tính năng mới / New feature
- `fix` — Sửa lỗi / Bug fix
- `docs` — Tài liệu / Documentation
- `style` — Định dạng mã / Code style
- `refactor` — Tái cấu trúc / Code refactoring
- `perf` — Hiệu suất / Performance improvement
- `test` — Kiểm thử / Testing
- `chore` — Công việc khác / Maintenance
- `ci` — CI/CD

**Scopes:**
- `hrm` — Human Resource Management
- `crm` — Customer Relationship Management
- `mrp` — Manufacturing Resource Planning
- `accounting` — Accounting Module
- `ecommerce` — E-commerce Module
- `otb` — OTB Module
- `tpm` — TPM Module
- `pm` — Project Management
- `core` — Core framework
- `database` — Database schema/migrations
- `auth` — Authentication
- `branding` — Branding/UI

### 4. Kiểm thử / Test Your Changes

```bash
# Chạy linter
npm run lint

# Chạy type checking
npm run typecheck

# Chạy unit tests
npm run test

# Chạy E2E tests (nếu có)
npm run test:e2e

# Kiểm thử module cụ thể
npx turbo test --filter=CRM

# Kiểm thử database migrations
npx prisma migrate status
npx prisma db push
```

**Test Coverage Requirements:**
- 80%+ code coverage for new features
- All public APIs must be tested
- E2E tests for critical user flows

### 5. Cập nhật Tài liệu / Update Documentation

Nếu thay đổi API hoặc tính năng, cập nhật:
- README.md cho repository
- docs/ folder cho detailed documentation
- Inline code comments cho complex logic
- CHANGELOG.md (sẽ được tự động tạo)

### 6. Push và Tạo Pull Request / Push and Create PR

```bash
# Push nhánh
git push origin feature/add-customer-segments-123

# Tạo PR trên GitHub
# https://github.com/lacviet-erp/Viet-ERP/compare

# Hoặc sử dụng GitHub CLI
gh pr create \
  --title "feat(crm): add customer segmentation" \
  --body "Adds support for customer segmentation with database migration"
```

**PR Template / Mẫu Pull Request:**
```markdown
## 📝 Description
Brief description of changes

## 🔗 Related Issue
Resolves #issue-number

## 🧪 Testing Done
- [ ] Unit tests added/updated
- [ ] E2E tests added/updated
- [ ] Manual testing completed

## 📸 Screenshots (if UI change)
Add screenshots for frontend changes

## ✅ Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No breaking changes (or documented)
- [ ] No new warnings
```

## Tiêu chuẩn Mã nguồn / Code Standards

### TypeScript Best Practices

```typescript
// ✅ DO - Use strict types, avoid any
const getCustomer = (id: string): Promise<Customer> => {
  // ...
};

// ❌ DON'T - Avoid any type
const getCustomer = (id: any): Promise<any> => {
  // ...
};

// ✅ DO - Export interfaces for public APIs
export interface CreateCustomerInput {
  name: string;
  email: string;
  code: string;
}

// ✅ DO - Use Prisma types
import { Customer, Prisma } from '@prisma/client';

// ✅ DO - Prefer const over let
const customer = { name: 'ABC Inc' };

// ❌ DON'T - Reassign variables unnecessarily
let customer = { name: 'ABC Inc' };
customer = { name: 'XYZ Inc' };
```

### File Organization / Tổ chức Tệp

```
src/
├── components/          # React components
│   ├── CustomerForm.tsx
│   └── CustomerForm.test.tsx  # Test file next to source
├── services/           # Business logic
│   ├── customerService.ts
│   └── customerService.test.ts
├── types/              # Type definitions
│   └── customer.ts
├── utils/              # Utility functions
│   ├── validation.ts
│   └── validation.test.ts
└── index.ts            # Barrel export
```

### Database Schema

```prisma
model Customer {
  id        String   @id @default(cuid())
  /// Customer code (unique per tenant)
  code      String
  name      String
  email     String?
  tenantId  String
  tenant    Tenant   @relation(fields: [tenantId], references: [id])
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([code, tenantId])
  @@index([tenantId, createdAt])
  @@map("customers")
}
```

**Schema Best Practices:**
- Add comments on important fields
- Use appropriate field types (never TEXT for codes/IDs)
- Include indexes for foreign keys and filtering
- Keep schemas aligned with business logic

### Styling with Tailwind CSS

```typescript
// ✅ DO - Use Tailwind utilities
<div className="flex items-center justify-between gap-4 p-4 bg-white rounded-lg shadow">
  <h1 className="text-xl font-semibold text-gray-900">Customers</h1>
  <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
    Add
  </button>
</div>

// ✅ DO - Support dark mode
<div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">

// ❌ DON'T - Use inline styles
<div style={{ display: 'flex', justifyContent: 'space-between' }}>

// ❌ DON'T - Use custom CSS
<div className="custom-card">
```

### Internationalization / Đa ngôn ngữ

```typescript
// ✅ DO - Use bilingual labels
import { labels } from '@linkk/branding';

<label>{labels.customer.name}</label>
// Renders: "Tên khách hàng / Customer Name"

// ✅ DO - Define strings in label system
// @linkk/branding/src/labels/customer.ts
export const customerLabels = {
  name: 'Tên khách hàng / Customer Name',
  email: 'Email / Email',
  phone: 'Điện thoại / Phone Number',
};

// ❌ DON'T - Hardcode UI text
<label>Customer Name</label>
<label>Tên khách hàng</label>
```

## Testing / Kiểm thử

### Unit Tests

```typescript
// Example: customerService.test.ts
import { describe, it, expect } from 'vitest';
import { createCustomer } from './customerService';

describe('CustomerService', () => {
  it('should create customer with valid input', async () => {
    const result = await createCustomer({
      code: 'CUST001',
      name: 'ABC Inc',
      tenantId: 'tenant-1',
    });

    expect(result.id).toBeDefined();
    expect(result.code).toBe('CUST001');
  });

  it('should reject duplicate customer code', async () => {
    // Existing customer
    await createCustomer({ code: 'CUST001', name: 'ABC', tenantId: 't1' });

    // Should fail
    expect(
      createCustomer({ code: 'CUST001', name: 'XYZ', tenantId: 't1' })
    ).rejects.toThrow('Duplicate code');
  });
});
```

### E2E Tests

```typescript
// Example: customer-flow.e2e.ts
import { test, expect } from '@playwright/test';

test.describe('Customer Management', () => {
  test('should create and view customer', async ({ page }) => {
    // Navigate to customer page
    await page.goto('/crm/customers');

    // Create new customer
    await page.click('button:has-text("Add Customer")');
    await page.fill('input[placeholder="Customer Code"]', 'CUST001');
    await page.fill('input[placeholder="Customer Name"]', 'ABC Inc');
    await page.click('button:has-text("Save")');

    // Verify customer created
    await expect(page.locator('text=ABC Inc')).toBeVisible();
  });
});
```

## Database Migrations / Migration Cơ sở dữ liệu

```bash
# Tạo migration
npx prisma migrate dev --name add_customer_segments

# Kiểm tra status
npx prisma migrate status

# Deploy migrations
npx prisma migrate deploy
```

Xem [Migration Guide](./docs/database/migrations.md) cho chi tiết.

## Pull Request Review Process / Quy trình Xem xét PR

### Before Submitting

- ✅ All tests pass
- ✅ Code is linted
- ✅ Types are correct
- ✅ Documentation is updated
- ✅ No console.log in production code
- ✅ No secrets in code

### Code Review

- Maintainers will review within 2-5 business days
- Constructive feedback will be provided
- Author should respond to comments within reasonable time
- Once approved, maintainer will merge

### Merge Requirements

- ✅ All checks pass
- ✅ At least 1 approval
- ✅ No unresolved conversations
- ✅ Branch is up to date with main

## Recognition / Vinh danh

Chúng tôi vinh danh tất cả những đóng góp! Contributors sẽ được:
- Liệt kê trong [CONTRIBUTORS.md](./CONTRIBUTORS.md)
- Được ghi tên trong release notes
- Nhận badge "Contributor" trên GitHub profile
- Mời vào Discord community

## Community / Cộng đồng

### Liên hệ / Reach Out

- 💬 [GitHub Discussions](https://github.com/lacviet-erp/Viet-ERP/discussions)
- 🤝 [Discord Community](https://discord.gg/lerp)
- 📧 Email: hello@lerp.dev
- 🐦 Twitter: [@L-ERPDev](https://twitter.com/L-ERPDev)

### Quy tắc Ứng xử / Code of Conduct

Dự án này tuân theo [Contributor Covenant Code of Conduct](./CODE_OF_CONDUCT.md).

Tóm tắt: Hãy tôn trọng nhau, không có hành vi quấy rối hoặc kỳ thị.

## Câu hỏi Thường gặp / FAQs

**Q: Tôi có thể đóng góp nếu lần đầu tiên sử dụng L-ERP không?**
A: Chắc chắn! Chúng tôi mong chờ nhất những đóng góp từ người dùng thực tế. Hãy bắt đầu với tài liệu hoặc bug reports nhỏ.

**Q: Tôi cần phải xin phép trước khi bắt đầu làm việc?**
A: Không, nhưng nên comment trên issue để tránh trùng lặp công việc.

**Q: PR của tôi bị reject. Nó có nghĩa là gì?**
A: Không! Đôi khi chúng tôi chỉ cần thay đổi nhỏ hoặc cần hiểu rõ hơn. Hãy thảo luận với reviewer.

**Q: Làm thế nào để thêm một tính năng mới lớn?**
A: Hãy mở Discussion trước để đề xuất. Chúng tôi thích thảo luận ý tưởng lớn trước khi viết code.

## Cảm ơn! / Thank You!

Cảm ơn bạn đã dành thời gian để đóng góp vào Linkk-ERP Platform! 🙏

Contributions are what make L-ERP better for everyone. We truly appreciate your effort!
