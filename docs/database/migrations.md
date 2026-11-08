# Database Migration Guide / Hướng dẫn Migration Cơ sở dữ liệu

Hướng dẫn toàn diện về quản lý database migrations trong Linkk-ERP Platform sử dụng Prisma.

Comprehensive guide to managing database migrations in Linkk-ERP Platform using Prisma.

## Giới thiệu / Introduction

**Migration** là quá trình kiểm soát phiên bản các thay đổi schema cơ sở dữ liệu. Mỗi migration:
- Được tạo tự động từ thay đổi `schema.prisma`
- Được lưu trữ dưới dạng file SQL trong `prisma/migrations/`
- Được theo dõi trong `_prisma_migrations` table
- Có thể áp dụng lên bất kỳ environment nào

A **migration** is the process of version-controlling database schema changes. Each migration:
- Is auto-generated from changes to `schema.prisma`
- Is stored as SQL files in `prisma/migrations/`
- Is tracked in the `_prisma_migrations` table
- Can be applied to any environment

## Chu kỳ Phát triển / Development Workflow

### 1. Thay đổi Schema / Modify Schema

Chỉnh sửa `schema.prisma` để mô tả cấu trúc mới:

```prisma
model Customer {
  id        String   @id @default(cuid())
  code      String
  name      String
  email     String?
  phone     String?
  segments  String?  // NEW FIELD - Thêm trường mới
  tenantId  String
  tenant    Tenant   @relation(fields: [tenantId], references: [id])
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([code, tenantId])
  @@map("customers")
}
```

### 2. Tạo Migration / Create Migration

```bash
# Tạo migration từ thay đổi schema
npx prisma migrate dev --name add_customer_segments

# Ví dụ khác / Other examples:
npx prisma migrate dev --name rename_field_to_new_name
npx prisma migrate dev --name create_inventory_table
npx prisma migrate dev --name add_unique_constraint_on_email
```

Lệnh này:
1. ✅ Phát hiện sự thay đổi so với cơ sở dữ liệu
2. ✅ Tạo SQL file migration trong `prisma/migrations/[timestamp]_[name]/migration.sql`
3. ✅ Áp dụng migration vào development database
4. ✅ Cập nhật Prisma client types

### 3. Kiểm thử Migration / Test Migration

```bash
# Chạy kiểm thử cơ sở dữ liệu
npm run test:db

# Kiểm thử với seed data
npx prisma db seed
```

### 4. Xem xét SQL / Review SQL

Kiểm tra file SQL được tạo trước khi commit:

```bash
cat prisma/migrations/20260329120000_add_customer_segments/migration.sql
```

**Ví dụ output:**
```sql
-- AddColumn
ALTER TABLE "customers" ADD COLUMN "segments" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "customers_code_tenantId_key" ON "customers"("code", "tenantId");
```

**Quy tắc kiểm tra:**
- ✅ Syntax SQL chính xác
- ✅ Tên field/table khớp với schema
- ✅ Constraints được thêm đúng
- ❌ Không có `CASCADE DELETE` không cần thiết
- ❌ Không có dữ liệu hardcode

### 5. Commit Changes / Cam kết Thay đổi

```bash
# Commit cả schema.prisma và migration file
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat(database): add customer segments field"
```

**Commit message format:**
```
feat(database): add customer segments field

- Adds new `segments` field to Customer model
- Stores customer segmentation data
- Migration applied successfully in dev
```

## Deployment to Staging/Production / Triển khai Staging/Production

### Chạy Migration / Apply Migrations

```bash
# Non-interactive mode (cho CI/CD)
npx prisma migrate deploy

# Kiểm tra status trước
npx prisma migrate status
```

**Quy trình dự kiến:**

```
2026-03-29 10:00:00 UTC  Migration Status Check
2026-03-29 10:01:00 UTC  Backup database...  ✓
2026-03-29 10:02:00 UTC  Apply pending migrations...
2026-03-29 10:02:15 UTC  Migration 20260328120000_initial applied  ✓
2026-03-29 10:02:30 UTC  Migration 20260329100000_add_customer_segments applied  ✓
2026-03-29 10:03:00 UTC  All migrations applied successfully  ✓
```

## Migration Best Practices / Các Quy tắc Tốt nhất

### ✅ DO (Nên)

**1. Tên Migration Rõ ràng**
```bash
# ✅ Tốt
npx prisma migrate dev --name add_customer_segments
npx prisma migrate dev --name rename_user_fullname_to_name
npx prisma migrate dev --name create_accounting_journal_tables

# ❌ Xấu
npx prisma migrate dev --name update
npx prisma migrate dev --name fix
npx prisma migrate dev --name changes
```

**2. Migration Nhỏ (Atomic)**
```
Một migration = Một thay đổi logic
Tránh kết hợp nhiều thay đổi không liên quan
```

**3. Kiểm thử Trước Deploying**
```bash
# 1. Test locally
npx prisma migrate dev

# 2. Test with seed data
npx prisma db seed

# 3. Run test suite
npm run test

# 4. Deploy to staging
npx prisma migrate deploy --skip-generate
```

**4. Viết Descriptive Schema Comments**
```prisma
model Account {
  id String @id @default(cuid())
  /// Vietnamese account code (VAS format: 111, 1111, 131)
  accountNumber String
  /// Account name in Vietnamese
  name String
  /// Account type per VAS classification
  accountType AccountType

  @@unique([accountNumber, tenantId])
  @@map("acc_accounts")
}
```

**5. Kiểm tra Data Compatibility**

Trước khi migration với dữ liệu lớn, kiểm tra:
```sql
-- Đếm records sẽ được ảnh hưởng
SELECT COUNT(*) FROM customers WHERE segments IS NULL;

-- Kiểm tra index performance
EXPLAIN ANALYZE SELECT * FROM customers WHERE code = '...';
```

**6. Tạo Index cho Performance**
```prisma
model Account {
  id String @id @default(cuid())
  accountNumber String
  tenantId String
  status AccountStatus

  @@unique([accountNumber, tenantId])
  @@index([tenantId, status])  // Composite index for filtering
  @@index([tenantId, createdAt])  // For time-based queries
}
```

### ❌ DON'T (Không)

**1. Không Chỉnh Schema Trực tiếp**
```bash
# ❌ NEVER
ALTER TABLE customers ADD COLUMN segments TEXT;
# → Commit migration SQL mà không có schema.prisma update
# → Prisma client sẽ out-of-sync

# ✅ DO THIS
# 1. Edit schema.prisma
# 2. Run: npx prisma migrate dev --name add_segments
```

**2. Không Xoá Migration Files**
```bash
# ❌ NEVER
rm prisma/migrations/20260329120000_add_segments/migration.sql

# ✅ Nếu cần undo, tạo migration reverse:
npx prisma migrate dev --name remove_segments
# → Tạo migration mới xoá field
```

**3. Không Merge Conflicting Migrations**
```
Nếu hai branch có migrations cùng timestamp:
1. Rebase branch vào main
2. Rename timestamp của branch migrations (Prisma sẽ suggest)
3. Re-generate Prisma client
```

**4. Không Hardcode Data trong Migration**
```sql
-- ❌ BAD
INSERT INTO accounts VALUES ('123', 'Revenue', ...);

-- ✅ GOOD: Use seed script instead
# prisma/seed.ts
const revenue = await prisma.account.create({
  data: { accountNumber: '5...' }
});
```

**5. Không Skip Migration Deploy**
```bash
# ❌ NEVER skip in production
npx prisma migrate deploy --skip-validate

# ✅ Luôn validate
npx prisma migrate deploy
```

**6. Không Remove Constraints Cần thiết**
```prisma
# ❌ BAD: Removing unique constraint without reason
// @@unique([code, tenantId])  // removed!

# ✅ GOOD: Keep constraints, only change if needed
// Renaming field but keeping constraint
@@unique([newCode, tenantId])
```

## Quay lại / Rolling Back

### Development Environment

Quay lại migration cuối cùng:

```bash
# Reset database (xoá toàn bộ dữ liệu, re-run migrations)
npx prisma migrate reset

# Xác nhận reset
? Are you sure? › (y/N) y

# Chạy seed sau reset
npx prisma db seed
```

### Staging/Production Environment

**Không có built-in rollback** — Phải tạo migration reverse:

```bash
# 1. Tạo migration undo
npx prisma migrate dev --name undo_add_customer_segments

# 2. Edit migration file để reverse thay đổi
cat prisma/migrations/20260329130000_undo_add_customer_segments/migration.sql

# Output:
# -- DropColumn
# ALTER TABLE "customers" DROP COLUMN "segments";

# 3. Deploy undo migration
npx prisma migrate deploy
```

**Best Practice:**
- Luôn có plan B trước deploying
- Backup database trước migration lớn
- Có migration reverse sẵn sàng
- Kiểm tra staging trước production

## Seeding / Hạt giống Dữ liệu

### Seed File

Tạo `prisma/seed.ts`:

```typescript
import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // 1. Tạo Tenant / Create tenant
  const tenant = await prisma.tenant.upsert({
    where: { slug: 'demo-tenant' },
    update: {},
    create: {
      name: 'Demo Tenant',
      slug: 'demo-tenant',
      tier: 'BASIC',
    },
  });
  console.log('✓ Tenant created:', tenant.id);

  // 2. Tạo User / Create user
  const user = await prisma.user.upsert({
    where: { email_tenantId: { email: 'admin@demo.vn', tenantId: tenant.id } },
    update: {},
    create: {
      email: 'admin@demo.vn',
      name: 'Admin User',
      role: 'ADMIN',
      tenantId: tenant.id,
    },
  });
  console.log('✓ User created:', user.email);

  // 3. Tạo Customers / Create customers
  const customers = await Promise.all([
    prisma.customer.upsert({
      where: { code_tenantId: { code: 'CUST001', tenantId: tenant.id } },
      update: {},
      create: {
        code: 'CUST001',
        name: 'ABC Company',
        email: 'info@abc.vn',
        type: 'COMPANY',
        tenantId: tenant.id,
      },
    }),
    prisma.customer.upsert({
      where: { code_tenantId: { code: 'CUST002', tenantId: tenant.id } },
      update: {},
      create: {
        code: 'CUST002',
        name: 'XYZ Corporation',
        email: 'contact@xyz.vn',
        type: 'COMPANY',
        tenantId: tenant.id,
      },
    }),
  ]);
  console.log('✓ Customers created:', customers.length);

  // 4. Tạo Products / Create products
  const products = await Promise.all([
    prisma.product.upsert({
      where: { code_tenantId: { code: 'PROD001', tenantId: tenant.id } },
      update: {},
      create: {
        code: 'PROD001',
        name: 'Laptop Dell XPS 13',
        price: new Decimal('25000000'),
        cost: new Decimal('15000000'),
        unit: 'PCS',
        tenantId: tenant.id,
      },
    }),
  ]);
  console.log('✓ Products created:', products.length);

  console.log('✅ Seed completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

### Chạy Seed / Run Seed

```bash
# Seed database
npx prisma db seed

# Output:
# 🌱 Starting seed...
# ✓ Tenant created: clnk2a...
# ✓ User created: admin@demo.vn
# ✓ Customers created: 2
# ✓ Products created: 1
# ✅ Seed completed!
```

### Configure Seed / Cấu hình Seed

**package.json:**
```json
{
  "prisma": {
    "seed": "ts-node --transpile-only prisma/seed.ts"
  }
}
```

## Xem Migration History / Xem Lịch sử Migration

### Check Migration Status

```bash
npx prisma migrate status

# Output:
# Your database schema is up to date! All migrations have been applied.
#
# Migrations in database (2):
# ✔ 20260328120000_initial
# ✔ 20260329120000_add_customer_segments
#
# New migrations detected (0):
# None
```

### View Applied Migrations

```sql
-- Query _prisma_migrations table
SELECT
  id,
  checksum,
  finished_at,
  execution_time
FROM _prisma_migrations
ORDER BY finished_at DESC;
```

## CI/CD Integration / Tích hợp CI/CD

### GitHub Actions Example

```yaml
# .github/workflows/db-migrate.yml
name: Database Migration
on:
  workflow_dispatch:
  push:
    branches: [main]
    paths:
      - 'packages/database/prisma/**'
      - '.github/workflows/db-migrate.yml'

jobs:
  migrate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Check migration status
        env:
          DATABASE_URL: ${{ secrets.STAGING_DATABASE_URL }}
        run: npx prisma migrate status

      - name: Deploy migrations
        env:
          DATABASE_URL: ${{ secrets.STAGING_DATABASE_URL }}
        run: npx prisma migrate deploy

      - name: Run seed (optional)
        if: github.event_name == 'workflow_dispatch'
        env:
          DATABASE_URL: ${{ secrets.STAGING_DATABASE_URL }}
        run: npx prisma db seed
```

## Troubleshooting / Khắc phục Sự cố

### Migration Stuck

```bash
# Kiểm tra status
npx prisma migrate status

# Nếu migration stuck ở "Pending":
# 1. Check database connection
# 2. View migration SQL
cat prisma/migrations/[timestamp]_[name]/migration.sql

# 3. Kiểm tra lỗi trong database log
psql -d lerp_db -c "SELECT * FROM _prisma_migrations WHERE finished_at IS NULL;"

# 4. Manually apply migration
psql -d lerp_db -f prisma/migrations/[timestamp]_[name]/migration.sql
```

### Schema Out of Sync

```bash
# Reset development database
npx prisma migrate reset

# Regenerate Prisma client
npx prisma generate

# Verify schema
npx prisma db validate
```

### Duplicate Index Error

```sql
-- Error: Duplicate index name
-- Solution: Remove old index manually
DROP INDEX IF EXISTS "customers_tenantId_status_idx";

-- Then retry migration
npx prisma migrate deploy
```

## Performance Considerations / Xem xét Hiệu suất

### Large Table Migrations

Khi thêm column vào bảng lớn (100M+ rows):

```bash
# 1. Tạo column với NOT NULL sau
ALTER TABLE big_table ADD COLUMN new_field VARCHAR NULL;

# 2. Cập nhật dữ liệu trong batch
UPDATE big_table SET new_field = 'default' LIMIT 100000;

# 3. Thêm NOT NULL constraint
ALTER TABLE big_table ALTER COLUMN new_field SET NOT NULL;
```

### Index Creation

```prisma
# Tạo index trước khi large SELECT queries
model Account {
  id String @id
  accountNumber String
  status AccountStatus
  createdAt DateTime

  # Composite index for filtering
  @@index([status, createdAt])
}
```

## Documentation / Tài liệu

- Prisma Migrate: https://www.prisma.io/docs/orm/prisma-migrate/overview
- Best Practices: https://www.prisma.io/docs/guides/database/development-environment-setup
- Troubleshooting: https://www.prisma.io/docs/orm/reference/error-reference

## Support / Hỗ trợ

Nếu cần giúp với migration, vui lòng:
1. Mở GitHub Discussion
2. Tag [@builder-team](https://github.com/builder-team)
3. Cung cấp: error message, migration name, database size
