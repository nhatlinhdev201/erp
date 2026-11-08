# Cơ sở dữ liệu / Database Documentation

## Tổng quan / Overview

Linkk-ERP Platform sử dụng **PostgreSQL 16** làm hệ thống quản lý cơ sở dữ liệu chính, với **Prisma ORM** làm lớp trích xuất dữ liệu. Kiến trúc cơ sở dữ liệu được thiết kế hỗ trợ đa tenant, đa module và mở rộng theo kiểu enterprise.

Linkk-ERP Platform uses **PostgreSQL 16** as the primary database management system, with **Prisma ORM** as the data abstraction layer. The database architecture is designed to support multi-tenancy, multiple modules, and enterprise-scale expansion.

## Yêu cầu kỹ thuật / Technical Requirements

- **PostgreSQL 16+** — Relational database
- **Prisma 5.0+** — ORM and migration management
- **Node.js 18+** — Runtime for migration scripts
- **npm/yarn** — Package management

## Kiến trúc đa Schema / Multi-Schema Architecture

L-ERP sử dụng mô hình **một schema cho một module**, cho phép:
- Tách biệt logic nghiệp vụ rõ ràng
- Quản lý phiên bản schema độc lập
- Giảm xung đột merge khi phát triển song song
- Dễ dàng kiểm tra schema-specific

L-ERP uses a **one schema per module** model, enabling:
- Clear business logic separation
- Independent schema versioning
- Reduced merge conflicts in parallel development
- Easy schema-specific testing

### Danh sách Schemas / Schema List

| Module | Schema | Chủ yếu / Primary Entities |
|--------|--------|---------------------------|
| Shared / Master Data | `public` | Tenants, Users, Customers, Products, Employees, Suppliers, Warehouses |
| Accounting | `accounting` | Accounts, JournalEntries, Invoices, Tax Declarations, Bank Transactions |
| CRM | `crm` | Leads, Contacts, Accounts, Opportunities, Activities, Campaigns |
| Ecommerce | `ecommerce` | Products, Categories, Orders, Carts, Payments, Shipping |
| HRM | `hrm` | Employees, Departments, Positions, Attendance, Payroll, Leaves |
| MRP | `mrp` | BOM, ProductionOrders, QualityChecks, Inventory, Machines |

## Prisma ORM

### Cấu hình / Configuration

Mỗi module có file `prisma/schema.prisma` riêng:
- **packages/database/prisma/schema.prisma** — Shared master data
- **apps/Accounting/prisma/schema.prisma** — Accounting module schema
- **apps/CRM/prisma/schema.prisma** — CRM module schema
- Tương tự cho các module khác / Similar for other modules

### Kết nối / Connection

```bash
# Thiết lập DATABASE_URL trong .env
# Set DATABASE_URL in .env
export DATABASE_URL="postgresql://user:password@localhost:5432/lerp_db"

# Tạo Prisma client
npx prisma generate
```

### ORM Features

- **Type-safe queries** — Full TypeScript support
- **Migrations** — Version-controlled schema changes
- **Seeding** — Populate test data
- **Query optimization** — Built-in relationship loading
- **SQL injection prevention** — Parameterized queries automatically

## Chiến lược Migration / Migration Strategy

### Tạo Migration / Creating a Migration

```bash
# Tạo migration từ thay đổi schema
npx prisma migrate dev --name add_feature_name

# Ví dụ / Example:
npx prisma migrate dev --name add_customer_segments
```

Câu lệnh này:
1. Kiểm tra sự thay đổi schema (`schema.prisma`)
2. Tạo file SQL migration trong `prisma/migrations/`
3. Áp dụng migration vào development database
4. Tạo lại Prisma client

### Áp dụng Migration / Deploying Migrations

**Development Environment:**
```bash
npx prisma migrate dev
```

**Staging/Production Environment:**
```bash
# Không tương tác / Non-interactive
npx prisma migrate deploy
```

**Kiểm tra status migration / Check Migration Status:**
```bash
npx prisma migrate status
```

### Quay lại Migration / Rolling Back

**Development:**
```bash
# Hoàn tác migration cuối cùng (không được áp dụng thực tế)
npx prisma migrate resolve --rolled-back migration_name
```

**Production:**
Không có built-in rollback — phải tạo migration inverse thủ công.

### Best Practices

1. **Tên migration rõ ràng** — `add_customer_segments`, `rename_order_status`, không phải `update`
2. **Migration nhỏ** — Một thay đổi logic trên một migration
3. **Kiểm thử migration** — Chạy trên staging trước production
4. **Giữ .sql files** — Không xoá thư mục `migrations/`
5. **Mô tả thay đổi** — Thêm comment trong SQL migration
6. **Không chỉnh schema trực tiếp** — Luôn tạo migration, không chỉnh production database

## Seeding Dữ liệu / Data Seeding

### Seed File

Tạo `prisma/seed.ts`:

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Tạo dữ liệu test / Create test data
  const tenant = await prisma.tenant.create({
    data: {
      name: 'Demo Tenant',
      slug: 'demo-tenant',
    },
  });

  console.log(`Seeded tenant: ${tenant.id}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

### Chạy Seeding / Running Seed

```bash
npx prisma db seed
```

**package.json:**
```json
{
  "prisma": {
    "seed": "ts-node prisma/seed.ts"
  }
}
```

## Sao lưu và Phục hồi / Backup & Restore

### Sao lưu PostgreSQL / PostgreSQL Backup

```bash
# Full backup
pg_dump -U postgres -d lerp_db -f backup_$(date +%Y%m%d_%H%M%S).sql

# Custom format (nén) / Compressed format
pg_dump -U postgres -d lerp_db -F c -f backup_$(date +%Y%m%d_%H%M%S).dump
```

### Phục hồi / Restore

```bash
# Từ SQL dump / From SQL dump
psql -U postgres -d lerp_db -f backup_20260329_120000.sql

# Từ custom format / From custom format
pg_restore -U postgres -d lerp_db backup_20260329_120000.dump
```

### Tự động sao lưu / Automated Backup

Sử dụng cron job:

```bash
# Mỗi ngày lúc 2 AM
0 2 * * * pg_dump -U postgres lerp_db | gzip > /backups/lerp_$(date +\%Y\%m\%d).sql.gz
```

## Hiệu suất và Tối ưu / Performance & Optimization

### Indexing

**Các index hiện có / Existing indexes:**
- `tenantId` — Multi-tenant queries
- `status` fields — Filter operations
- `createdAt` — Time-based sorting
- Foreign keys — Relationship lookups

**Thêm index tuỳ chỉnh / Custom indexes:**

```prisma
model Account {
  id String @id @default(cuid())
  accountNumber String
  tenantId String

  @@unique([accountNumber, tenantId])  // Unique constraint
  @@index([tenantId, status])          // Composite index for filtering
}
```

### Query Optimization

1. **Sử dụng include/select** để tránh N+1 queries
2. **Batch queries** khi có thể
3. **Sử dụng `$queryRaw`** cho các query phức tạp
4. **Limit results** với pagination

```typescript
// ❌ Bad: N+1 queries
const accounts = await prisma.account.findMany();
for (const account of accounts) {
  const lines = await prisma.journalLine.findMany({
    where: { accountId: account.id },
  });
}

// ✅ Good: Include relationship
const accounts = await prisma.account.findMany({
  include: { journalLines: true },
});
```

### Connection Pooling

Prisma sử dụng connection pooling built-in. Cấu hình trong `.env`:

```
DATABASE_URL="postgresql://user:pass@localhost:5432/lerp_db?schema=public"
# Pool size (default: 2 for development, 10 for production)
# Prisma tự động điều chỉnh / Prisma auto-adjusts
```

## Bảo mật / Security

### Các biện pháp / Measures

1. **Parameterized queries** — Prisma sử dụng tự động
2. **Role-based access** — PostgreSQL roles cho mỗi application user
3. **Encryption at rest** — Cấu hình ở database server level
4. **Audit logs** — Tất cả thay đổi được ghi lại
5. **Least privilege** — Application user chỉ có quyền cần thiết

### Database User Setup

```sql
-- Tạo application user
CREATE USER lerp_app WITH PASSWORD 'secure_password';

-- Grant rights
GRANT CONNECT ON DATABASE lerp_db TO lerp_app;
GRANT USAGE ON SCHEMA public TO lerp_app;
GRANT ALL ON ALL TABLES IN SCHEMA public TO lerp_app;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO lerp_app;
```

## Giám sát / Monitoring

### Các chỉ số quan trọng / Key Metrics

1. **Query performance** — Slow query log
2. **Connection count** — Active connections
3. **Disk space** — Database size
4. **Replication lag** — If using replication

### Câu lệnh Monitoring / Monitoring Queries

```sql
-- Kích thước database / Database size
SELECT pg_database.datname,
       pg_size_pretty(pg_database_size(pg_database.datname)) AS size
FROM pg_database
WHERE datname LIKE 'lerp%';

-- Active queries / Active queries
SELECT pid, usename, application_name, state, query
FROM pg_stat_activity
WHERE state != 'idle';

-- Table sizes / Table sizes
SELECT schemaname, tablename,
       pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

## Tài liệu chi tiết / Detailed Documentation

- [Database Schemas](./schemas.md) — Chi tiết từng module schema
- [ER Diagram](./er-diagram.mermaid) — Biểu đồ thực thể quan hệ
- [Migration Guide](./migrations.md) — Hướng dẫn migration chi tiết

## Liên hệ / Support

Nếu có câu hỏi về cơ sở dữ liệu, vui lòng mở GitHub Discussion hoặc tạo issue.

For database questions, please open a GitHub Discussion or create an issue.
