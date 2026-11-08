# 🗄️ DATABASE INTEGRATION GUIDE
## L-ERP MRP - Hướng dẫn kết nối Database thật

**Trạng thái hiện tại:** APIs đã có Prisma queries hoàn chỉnh, chỉ cần kết nối database thật
**Thời gian ước tính:** 1-2 ngày

---

## 📊 TỔNG QUAN

### Điều đã có sẵn ✅
```
✅ 34 Prisma Models (1,380 lines schema)
✅ 30 Enums định nghĩa đầy đủ
✅ 38 API Routes với Prisma queries
✅ Zod validation schemas
✅ Error handling
✅ Audit logging
```

### Cần làm 🔧
```
🔧 Chuyển từ SQLite → PostgreSQL
🔧 Setup DATABASE_URL
🔧 Run migrations
🔧 Tạo seed data
🔧 Test APIs
```

---

## 🚀 BƯỚC 1: SETUP DATABASE

### Option A: PostgreSQL Local (Development)

```bash
# 1. Cài PostgreSQL (macOS)
brew install postgresql@15
brew services start postgresql@15

# 2. Tạo database
createdb rtr_mrp

# 3. Tạo user (optional)
psql -d rtr_mrp -c "CREATE USER rtr_admin WITH PASSWORD 'your_password';"
psql -d rtr_mrp -c "GRANT ALL PRIVILEGES ON DATABASE rtr_mrp TO rtr_admin;"
```

### Option B: Docker (Recommended for Development)

```bash
# docker-compose.yml đã có sẵn trong project
docker-compose up -d postgres

# Hoặc chạy trực tiếp
docker run -d \
  --name rtr-postgres \
  -e POSTGRES_DB=rtr_mrp \
  -e POSTGRES_USER=rtr_admin \
  -e POSTGRES_PASSWORD=your_secure_password \
  -p 5432:5432 \
  -v rtr_postgres_data:/var/lib/postgresql/data \
  postgres:15-alpine
```

### Option C: Cloud Database (Production)

**Supabase (Free tier):**
```bash
# 1. Tạo project tại https://supabase.com
# 2. Lấy connection string từ Settings > Database
# 3. Connection string format:
postgresql://postgres:[PASSWORD]@db.[PROJECT-ID].supabase.co:5432/postgres
```

**Neon (Serverless PostgreSQL):**
```bash
# 1. Tạo project tại https://neon.tech
# 2. Lấy connection string
# 3. Thêm ?sslmode=require cho Prisma
```

**AWS RDS:**
```bash
# Production-ready option
# Connection string format:
postgresql://username:password@endpoint.region.rds.amazonaws.com:5432/rtr_mrp
```

---

## 🔧 BƯỚC 2: CẤU HÌNH PRISMA

### 2.1 Update schema.prisma

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  // THAY ĐỔI: sqlite → postgresql
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ... rest of schema unchanged
```

### 2.2 Cập nhật .env

```env
# .env.local (development)
DATABASE_URL="postgresql://rtr_admin:your_password@localhost:5432/rtr_mrp"

# .env.production
DATABASE_URL="postgresql://user:pass@host:5432/rtr_mrp?sslmode=require"
```

### 2.3 Update Prisma cho PostgreSQL

Một số thay đổi nhỏ trong schema cho PostgreSQL:

```prisma
// Thêm các features PostgreSQL-specific (optional)

model Part {
  id            String   @id @default(cuid())
  // ... existing fields
  
  // PostgreSQL full-text search (optional enhancement)
  @@index([partNumber, partName])
}

model SalesOrder {
  id            String   @id @default(cuid())
  // ... existing fields
  
  // Index for common queries
  @@index([status, orderDate])
  @@index([customerId])
}

model Inventory {
  id            String   @id @default(cuid())
  // ... existing fields
  
  @@index([partId, warehouseId])
}
```

---

## 📦 BƯỚC 3: MIGRATIONS

### 3.1 Generate Migration

```bash
# Trong thư mục project
cd lerp-mrp-app

# Reset Prisma client (nếu đã có từ SQLite)
rm -rf node_modules/.prisma
rm -rf prisma/migrations

# Generate migration mới
npx prisma migrate dev --name init

# Output:
# ✔ Generated Prisma Client
# ✔ Migration 20260105_init created
# ✔ Applied migration
```

### 3.2 Verify Tables

```bash
# Connect vào database để verify
psql -d rtr_mrp -c "\dt"

# Expected output:
#              List of relations
#  Schema |        Name         | Type  
# --------+---------------------+-------
#  public | Part                | table
#  public | Supplier            | table
#  public | Customer            | table
#  public | Inventory           | table
#  public | SalesOrder          | table
#  public | SalesOrderItem      | table
#  public | PurchaseOrder       | table
#  public | PurchaseOrderItem   | table
#  public | WorkOrder           | table
#  public | WorkOrderItem       | table
#  public | BOM                 | table
#  public | BOMItem             | table
#  public | Warehouse           | table
#  public | WorkCenter          | table
#  public | Equipment           | table
#  public | QualityRecord       | table
#  public | NCR                 | table
#  public | User                | table
#  public | _prisma_migrations  | table
#  ... (34 tables total)
```

---

## 🌱 BƯỚC 4: SEED DATA

### 4.1 Tạo Seed Script

```typescript
// prisma/seed.ts

import { PrismaClient, PartCategory, OrderStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // ============================================
  // 1. WAREHOUSES
  // ============================================
  const warehouses = await Promise.all([
    prisma.warehouse.upsert({
      where: { code: 'WH-MAIN' },
      update: {},
      create: {
        code: 'WH-MAIN',
        name: 'Kho chính',
        type: 'MAIN',
        address: '123 Nguyễn Văn Linh, Q7',
        city: 'Ho Chi Minh',
        status: 'active',
      },
    }),
    prisma.warehouse.upsert({
      where: { code: 'WH-RAW' },
      update: {},
      create: {
        code: 'WH-RAW',
        name: 'Kho nguyên liệu',
        type: 'RAW_MATERIAL',
        address: '456 Lê Văn Việt, Q9',
        city: 'Ho Chi Minh',
        status: 'active',
      },
    }),
    prisma.warehouse.upsert({
      where: { code: 'WH-FG' },
      update: {},
      create: {
        code: 'WH-FG',
        name: 'Kho thành phẩm',
        type: 'FINISHED_GOODS',
        address: '789 Võ Văn Kiệt, Q1',
        city: 'Ho Chi Minh',
        status: 'active',
      },
    }),
  ]);
  console.log(`✅ Created ${warehouses.length} warehouses`);

  // ============================================
  // 2. SUPPLIERS
  // ============================================
  const suppliers = await Promise.all([
    prisma.supplier.upsert({
      where: { code: 'SUP-001' },
      update: {},
      create: {
        code: 'SUP-001',
        name: 'Công ty TNHH Kim loại ABC',
        contactPerson: 'Nguyễn Văn A',
        email: 'sales@abc-metal.vn',
        phone: '028-1234-5678',
        address: '123 KCN Tân Bình',
        city: 'Ho Chi Minh',
        country: 'Vietnam',
        leadTime: 7,
        rating: 4.5,
        paymentTerms: 'Net 30',
      },
    }),
    prisma.supplier.upsert({
      where: { code: 'SUP-002' },
      update: {},
      create: {
        code: 'SUP-002',
        name: 'Nhựa Việt Nam',
        contactPerson: 'Trần Thị B',
        email: 'order@nhuavn.com',
        phone: '028-8765-4321',
        address: '456 KCN Biên Hòa',
        city: 'Dong Nai',
        country: 'Vietnam',
        leadTime: 5,
        rating: 4.8,
        paymentTerms: 'Net 15',
      },
    }),
    prisma.supplier.upsert({
      where: { code: 'SUP-003' },
      update: {},
      create: {
        code: 'SUP-003',
        name: 'Linh kiện điện tử Đông Á',
        contactPerson: 'Lê Văn C',
        email: 'info@dongaelec.com',
        phone: '028-5555-6666',
        address: '789 KCN Long Thành',
        city: 'Dong Nai',
        country: 'Vietnam',
        leadTime: 14,
        rating: 4.2,
        paymentTerms: 'Net 45',
      },
    }),
  ]);
  console.log(`✅ Created ${suppliers.length} suppliers`);

  // ============================================
  // 3. CUSTOMERS
  // ============================================
  const customers = await Promise.all([
    prisma.customer.upsert({
      where: { code: 'CUS-001' },
      update: {},
      create: {
        code: 'CUS-001',
        name: 'Công ty XYZ Manufacturing',
        contactPerson: 'Phạm Văn D',
        email: 'purchasing@xyz-mfg.vn',
        phone: '028-1111-2222',
        address: '111 KCN Tân Thuận',
        city: 'Ho Chi Minh',
        country: 'Vietnam',
        taxCode: '0301234567',
        creditLimit: 500000000,
        paymentTerms: 'Net 30',
      },
    }),
    prisma.customer.upsert({
      where: { code: 'CUS-002' },
      update: {},
      create: {
        code: 'CUS-002',
        name: 'Samsung Vietnam',
        contactPerson: 'Park Min Soo',
        email: 'procurement@samsung.vn',
        phone: '024-3333-4444',
        address: 'KCN Yên Phong',
        city: 'Bac Ninh',
        country: 'Vietnam',
        taxCode: '2300123456',
        creditLimit: 2000000000,
        paymentTerms: 'Net 60',
      },
    }),
    prisma.customer.upsert({
      where: { code: 'CUS-003' },
      update: {},
      create: {
        code: 'CUS-003',
        name: 'Foxconn Industrial',
        contactPerson: 'Chen Wei',
        email: 'supply@foxconn.vn',
        phone: '024-5555-6666',
        address: 'KCN VSIP',
        city: 'Bac Ninh',
        country: 'Vietnam',
        taxCode: '2300789012',
        creditLimit: 3000000000,
        paymentTerms: 'Net 45',
      },
    }),
  ]);
  console.log(`✅ Created ${customers.length} customers`);

  // ============================================
  // 4. PARTS (Materials)
  // ============================================
  const parts = await Promise.all([
    // Raw Materials
    prisma.part.upsert({
      where: { partNumber: 'RM-STEEL-001' },
      update: {},
      create: {
        partNumber: 'RM-STEEL-001',
        partName: 'Thép tấm 2mm',
        description: 'Thép tấm mạ kẽm 2mm x 1220mm x 2440mm',
        category: 'RAW_MATERIAL',
        unit: 'tấm',
        unitCost: 850000,
        leadTime: 7,
        minOrderQty: 10,
        supplierId: suppliers[0].id,
      },
    }),
    prisma.part.upsert({
      where: { partNumber: 'RM-PLASTIC-001' },
      update: {},
      create: {
        partNumber: 'RM-PLASTIC-001',
        partName: 'Hạt nhựa ABS',
        description: 'Hạt nhựa ABS nguyên sinh, màu trắng',
        category: 'RAW_MATERIAL',
        unit: 'kg',
        unitCost: 45000,
        leadTime: 5,
        minOrderQty: 100,
        supplierId: suppliers[1].id,
      },
    }),
    
    // Components
    prisma.part.upsert({
      where: { partNumber: 'CMP-PCB-001' },
      update: {},
      create: {
        partNumber: 'CMP-PCB-001',
        partName: 'PCB Main Board v2.0',
        description: 'Bo mạch chính 4 lớp, FR4',
        category: 'COMPONENT',
        unit: 'pcs',
        unitCost: 125000,
        leadTime: 14,
        minOrderQty: 50,
        supplierId: suppliers[2].id,
      },
    }),
    prisma.part.upsert({
      where: { partNumber: 'CMP-MOTOR-001' },
      update: {},
      create: {
        partNumber: 'CMP-MOTOR-001',
        partName: 'Motor DC 12V 3000RPM',
        description: 'Motor DC 12V, 3000RPM, 50W',
        category: 'COMPONENT',
        unit: 'pcs',
        unitCost: 85000,
        leadTime: 10,
        minOrderQty: 20,
        supplierId: suppliers[2].id,
      },
    }),
    
    // Semi-finished
    prisma.part.upsert({
      where: { partNumber: 'SF-CASE-001' },
      update: {},
      create: {
        partNumber: 'SF-CASE-001',
        partName: 'Vỏ máy (bán thành phẩm)',
        description: 'Vỏ máy nhựa ABS đã ép khuôn',
        category: 'SEMI_FINISHED',
        unit: 'pcs',
        unitCost: 75000,
        leadTime: 3,
        minOrderQty: 50,
      },
    }),
    
    // Finished Goods
    prisma.part.upsert({
      where: { partNumber: 'FG-PROD-001' },
      update: {},
      create: {
        partNumber: 'FG-PROD-001',
        partName: 'Sản phẩm A - Complete',
        description: 'Sản phẩm hoàn chỉnh loại A',
        category: 'FINISHED_GOOD',
        unit: 'pcs',
        unitCost: 450000,
        sellingPrice: 750000,
        leadTime: 5,
        minOrderQty: 10,
      },
    }),
    prisma.part.upsert({
      where: { partNumber: 'FG-PROD-002' },
      update: {},
      create: {
        partNumber: 'FG-PROD-002',
        partName: 'Sản phẩm B - Premium',
        description: 'Sản phẩm cao cấp loại B',
        category: 'FINISHED_GOOD',
        unit: 'pcs',
        unitCost: 680000,
        sellingPrice: 1200000,
        leadTime: 7,
        minOrderQty: 5,
      },
    }),
  ]);
  console.log(`✅ Created ${parts.length} parts`);

  // ============================================
  // 5. INVENTORY
  // ============================================
  const inventory = await Promise.all([
    prisma.inventory.upsert({
      where: { partId: parts[0].id },
      update: {},
      create: {
        partId: parts[0].id,
        warehouseId: warehouses[1].id, // Kho nguyên liệu
        quantity: 150,
        reservedQty: 20,
        minStock: 50,
        maxStock: 300,
        reorderPoint: 80,
        location: 'A-01-01',
      },
    }),
    prisma.inventory.upsert({
      where: { partId: parts[1].id },
      update: {},
      create: {
        partId: parts[1].id,
        warehouseId: warehouses[1].id,
        quantity: 500,
        reservedQty: 100,
        minStock: 200,
        maxStock: 1000,
        reorderPoint: 300,
        location: 'A-02-01',
      },
    }),
    prisma.inventory.upsert({
      where: { partId: parts[2].id },
      update: {},
      create: {
        partId: parts[2].id,
        warehouseId: warehouses[0].id, // Kho chính
        quantity: 200,
        reservedQty: 50,
        minStock: 100,
        maxStock: 500,
        reorderPoint: 150,
        location: 'B-01-01',
      },
    }),
    prisma.inventory.upsert({
      where: { partId: parts[5].id },
      update: {},
      create: {
        partId: parts[5].id,
        warehouseId: warehouses[2].id, // Kho thành phẩm
        quantity: 75,
        reservedQty: 25,
        minStock: 30,
        maxStock: 200,
        reorderPoint: 50,
        location: 'C-01-01',
      },
    }),
  ]);
  console.log(`✅ Created ${inventory.length} inventory records`);

  // ============================================
  // 6. WORK CENTERS
  // ============================================
  const workCenters = await Promise.all([
    prisma.workCenter.upsert({
      where: { code: 'WC-CUT' },
      update: {},
      create: {
        code: 'WC-CUT',
        name: 'Trạm cắt',
        description: 'Trạm cắt nguyên liệu',
        type: 'MACHINE',
        capacity: 8, // giờ/ngày
        efficiency: 0.85,
        hourlyRate: 150000,
        setupTime: 30, // phút
        status: 'active',
      },
    }),
    prisma.workCenter.upsert({
      where: { code: 'WC-MOLD' },
      update: {},
      create: {
        code: 'WC-MOLD',
        name: 'Trạm ép khuôn',
        description: 'Máy ép nhựa',
        type: 'MACHINE',
        capacity: 16,
        efficiency: 0.90,
        hourlyRate: 200000,
        setupTime: 45,
        status: 'active',
      },
    }),
    prisma.workCenter.upsert({
      where: { code: 'WC-ASSY' },
      update: {},
      create: {
        code: 'WC-ASSY',
        name: 'Trạm lắp ráp',
        description: 'Dây chuyền lắp ráp',
        type: 'ASSEMBLY_LINE',
        capacity: 16,
        efficiency: 0.88,
        hourlyRate: 180000,
        setupTime: 15,
        status: 'active',
      },
    }),
    prisma.workCenter.upsert({
      where: { code: 'WC-QC' },
      update: {},
      create: {
        code: 'WC-QC',
        name: 'Trạm QC',
        description: 'Kiểm tra chất lượng',
        type: 'INSPECTION',
        capacity: 8,
        efficiency: 0.95,
        hourlyRate: 120000,
        setupTime: 5,
        status: 'active',
      },
    }),
  ]);
  console.log(`✅ Created ${workCenters.length} work centers`);

  // ============================================
  // 7. BOM (Bill of Materials)
  // ============================================
  const bom1 = await prisma.bOM.upsert({
    where: { partId: parts[5].id }, // FG-PROD-001
    update: {},
    create: {
      partId: parts[5].id,
      version: '1.0',
      status: 'active',
      effectiveDate: new Date('2026-01-01'),
      items: {
        create: [
          {
            childPartId: parts[4].id, // SF-CASE-001
            quantity: 1,
            unit: 'pcs',
            sequence: 1,
          },
          {
            childPartId: parts[2].id, // CMP-PCB-001
            quantity: 1,
            unit: 'pcs',
            sequence: 2,
          },
          {
            childPartId: parts[3].id, // CMP-MOTOR-001
            quantity: 2,
            unit: 'pcs',
            sequence: 3,
          },
        ],
      },
    },
    include: { items: true },
  });
  console.log(`✅ Created BOM with ${bom1.items.length} items`);

  // ============================================
  // 8. SALES ORDERS
  // ============================================
  const salesOrders = await Promise.all([
    prisma.salesOrder.upsert({
      where: { soNumber: 'SO-000001' },
      update: {},
      create: {
        soNumber: 'SO-000001',
        customerId: customers[0].id,
        orderDate: new Date('2026-01-02'),
        requestedDate: new Date('2026-01-15'),
        status: 'CONFIRMED',
        priority: 'normal',
        totalAmount: 7500000,
        currency: 'VND',
        paymentTerms: 'Net 30',
        shippingAddress: customers[0].address,
        items: {
          create: [
            {
              partId: parts[5].id,
              quantity: 10,
              unitPrice: 750000,
              lineTotal: 7500000,
              status: 'PENDING',
            },
          ],
        },
      },
    }),
    prisma.salesOrder.upsert({
      where: { soNumber: 'SO-000002' },
      update: {},
      create: {
        soNumber: 'SO-000002',
        customerId: customers[1].id,
        orderDate: new Date('2026-01-03'),
        requestedDate: new Date('2026-01-20'),
        status: 'PENDING',
        priority: 'high',
        totalAmount: 24000000,
        currency: 'VND',
        paymentTerms: 'Net 60',
        shippingAddress: customers[1].address,
        items: {
          create: [
            {
              partId: parts[6].id,
              quantity: 20,
              unitPrice: 1200000,
              lineTotal: 24000000,
              status: 'PENDING',
            },
          ],
        },
      },
    }),
  ]);
  console.log(`✅ Created ${salesOrders.length} sales orders`);

  // ============================================
  // 9. WORK ORDERS
  // ============================================
  const workOrders = await Promise.all([
    prisma.workOrder.upsert({
      where: { woNumber: 'WO-000001' },
      update: {},
      create: {
        woNumber: 'WO-000001',
        partId: parts[5].id,
        quantity: 50,
        completedQty: 25,
        scrappedQty: 2,
        status: 'IN_PROGRESS',
        priority: 'normal',
        plannedStart: new Date('2026-01-05'),
        plannedEnd: new Date('2026-01-10'),
        actualStart: new Date('2026-01-05'),
        workCenterId: workCenters[2].id,
        notes: 'Đơn hàng cho Samsung',
      },
    }),
    prisma.workOrder.upsert({
      where: { woNumber: 'WO-000002' },
      update: {},
      create: {
        woNumber: 'WO-000002',
        partId: parts[6].id,
        quantity: 30,
        completedQty: 0,
        scrappedQty: 0,
        status: 'RELEASED',
        priority: 'high',
        plannedStart: new Date('2026-01-08'),
        plannedEnd: new Date('2026-01-15'),
        workCenterId: workCenters[2].id,
        notes: 'Đơn hàng gấp cho Foxconn',
      },
    }),
  ]);
  console.log(`✅ Created ${workOrders.length} work orders`);

  // ============================================
  // 10. USERS
  // ============================================
  const users = await Promise.all([
    prisma.user.upsert({
      where: { email: 'admin@rtr.vn' },
      update: {},
      create: {
        email: 'admin@rtr.vn',
        name: 'Admin User',
        password: '$2b$10$hash_here', // bcrypt hash of password
        role: 'admin',
        department: 'IT',
        isActive: true,
      },
    }),
    prisma.user.upsert({
      where: { email: 'planner@rtr.vn' },
      update: {},
      create: {
        email: 'planner@rtr.vn',
        name: 'Planner User',
        password: '$2b$10$hash_here',
        role: 'planner',
        department: 'Planning',
        isActive: true,
      },
    }),
    prisma.user.upsert({
      where: { email: 'operator@rtr.vn' },
      update: {},
      create: {
        email: 'operator@rtr.vn',
        name: 'Operator User',
        password: '$2b$10$hash_here',
        role: 'operator',
        department: 'Production',
        isActive: true,
      },
    }),
  ]);
  console.log(`✅ Created ${users.length} users`);

  console.log('\n✨ Seed completed successfully!');
  console.log(`
📊 Summary:
   - Warehouses: ${warehouses.length}
   - Suppliers: ${suppliers.length}
   - Customers: ${customers.length}
   - Parts: ${parts.length}
   - Inventory: ${inventory.length}
   - Work Centers: ${workCenters.length}
   - BOMs: 1
   - Sales Orders: ${salesOrders.length}
   - Work Orders: ${workOrders.length}
   - Users: ${users.length}
  `);
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

### 4.2 Cấu hình package.json

```json
// package.json
{
  "prisma": {
    "seed": "ts-node --compiler-options {\"module\":\"CommonJS\"} prisma/seed.ts"
  }
}
```

### 4.3 Chạy Seed

```bash
# Chạy seed
npx prisma db seed

# Output:
# 🌱 Starting seed...
# ✅ Created 3 warehouses
# ✅ Created 3 suppliers
# ✅ Created 3 customers
# ✅ Created 7 parts
# ✅ Created 4 inventory records
# ✅ Created 4 work centers
# ✅ Created BOM with 3 items
# ✅ Created 2 sales orders
# ✅ Created 2 work orders
# ✅ Created 3 users
# ✨ Seed completed successfully!
```

---

## ✅ BƯỚC 5: VERIFY & TEST

### 5.1 Check Database

```bash
# Prisma Studio - UI để xem database
npx prisma studio

# Mở browser tại http://localhost:5555
```

### 5.2 Test API Endpoints

```bash
# Start dev server
npm run dev

# Test Dashboard API
curl http://localhost:3000/api/v2/dashboard \
  -H "Authorization: Bearer your_token"

# Test Inventory API
curl http://localhost:3000/api/v2/inventory

# Test Sales API
curl http://localhost:3000/api/v2/sales
```

### 5.3 Expected Results

```json
// GET /api/v2/dashboard
{
  "success": true,
  "data": {
    "kpis": {
      "inventory": {
        "totalParts": 7,
        "lowStockParts": 0,
        "outOfStockParts": 0,
        "totalValue": 12500000
      },
      "sales": {
        "totalOrders": 2,
        "pendingOrders": 2,
        "monthlyRevenue": 31500000,
        "revenueTrend": 0
      },
      "production": {
        "activeWorkOrders": 2,
        "completedMTD": 0
      }
    },
    "recentOrders": [...],
    "recentWorkOrders": [...]
  }
}
```

---

## 🔧 BƯỚC 6: PRODUCTION SETUP

### 6.1 Connection Pooling

```typescript
// lib/prisma.ts (updated for production)

import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' 
    ? ['query', 'error', 'warn'] 
    : ['error'],
  // Connection pool settings
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;
```

### 6.2 Environment Variables

```env
# .env.production
DATABASE_URL="postgresql://user:pass@host:5432/rtr_mrp?connection_limit=10&pool_timeout=10"

# For Supabase/Neon (serverless)
DATABASE_URL="postgresql://user:pass@host:5432/db?pgbouncer=true&connection_limit=1"
```

### 6.3 Migration in Production

```bash
# Generate migration (dev)
npx prisma migrate dev --name production_ready

# Apply migration (production)
npx prisma migrate deploy

# Reset if needed (DANGER - deletes data!)
npx prisma migrate reset
```

---

## 📋 CHECKLIST

### Development Setup
- [ ] PostgreSQL installed hoặc Docker running
- [ ] DATABASE_URL configured
- [ ] Schema updated (sqlite → postgresql)
- [ ] `npx prisma migrate dev` successful
- [ ] `npx prisma db seed` successful
- [ ] Prisma Studio shows data
- [ ] API endpoints return real data

### Production Setup
- [ ] Cloud database provisioned
- [ ] Connection string secure
- [ ] `npx prisma migrate deploy` successful
- [ ] Connection pooling configured
- [ ] Backup strategy in place
- [ ] Monitoring configured

---

## 🆘 TROUBLESHOOTING

### Error: P1001 - Can't reach database server
```bash
# Check if PostgreSQL is running
pg_isready -h localhost -p 5432

# Check connection string
echo $DATABASE_URL
```

### Error: P2002 - Unique constraint violation
```bash
# Reset database (dev only)
npx prisma migrate reset

# Or delete specific records
npx prisma db execute --stdin <<< "TRUNCATE TABLE \"Part\" CASCADE;"
```

### Error: P2021 - Table does not exist
```bash
# Re-run migrations
npx prisma migrate deploy
```

---

## 📚 REFERENCES

- [Prisma Documentation](https://www.prisma.io/docs)
- [PostgreSQL on Docker](https://hub.docker.com/_/postgres)
- [Supabase](https://supabase.com/docs)
- [Neon Serverless](https://neon.tech/docs)

---

*Document created: 05/01/2026*
*L-ERP MRP Database Integration Guide v1.0*
