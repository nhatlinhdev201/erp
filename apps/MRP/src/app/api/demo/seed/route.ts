// =============================================================================
// L-ERP MRP - DEMO AUTO-SEED API
// Professional API to automatically create demo users and sample data
// GATED: Only available when NEXT_PUBLIC_DEMO_MODE=true or NODE_ENV !== 'production'
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { logger } from '@/lib/logger';
import { checkWriteEndpointLimit } from '@/lib/rate-limit';
import { withAuth } from '@/lib/api/with-auth';

// Environment gate: block demo routes in production unless explicitly enabled
const isDemoEnabled = process.env.NEXT_PUBLIC_DEMO_MODE === 'true' || process.env.NODE_ENV !== 'production';

function demoDisabledResponse() {
  return NextResponse.json(
    { success: false, error: 'Demo endpoints are disabled in production. Set NEXT_PUBLIC_DEMO_MODE=true to enable.' },
    { status: 403 }
  );
}

// =============================================================================
// CONFIGURATION
// =============================================================================

const BCRYPT_ROUNDS = 12;

const DEMO_USERS = [
  {
    email: 'admin@demo.your-domain.com',
    name: 'Demo Admin',
    password: 'Admin@Demo2026!',
    role: 'admin',
  },
  {
    email: 'manager@demo.your-domain.com',
    name: 'Demo Manager',
    password: 'Manager@Demo2026!',
    role: 'manager',
  },
  {
    email: 'operator@demo.your-domain.com',
    name: 'Demo Operator',
    password: 'Operator@Demo2026!',
    role: 'operator',
  },
  {
    email: 'viewer@demo.your-domain.com',
    name: 'Demo Viewer',
    password: 'Viewer@Demo2026!',
    role: 'viewer',
  },
];

const DEMO_CATEGORIES = [
  'Nguyên liệu',
  'Linh kiện',
  'Bao bì',
  'Thành phẩm',
  'Phụ tùng',
];

const DEMO_SUPPLIERS = [
  {
    code: 'SUP-001',
    name: 'Công ty TNHH Thép Việt',
    country: 'Vietnam',
    contactName: 'Nguyễn Văn A',
    contactEmail: 'contact@thepviet.com',
    contactPhone: '028-1234-5678',
    address: '123 Đường Công Nghiệp, Q.Bình Tân, TP.HCM',
    leadTimeDays: 7,
    rating: 4.5,
    category: 'Nguyên liệu',
    status: 'active',
  },
  {
    code: 'SUP-002',
    name: 'Công ty CP Nhựa Đông Nam',
    country: 'Vietnam',
    contactName: 'Trần Thị B',
    contactEmail: 'sales@nhuadongnam.vn',
    contactPhone: '028-8765-4321',
    address: '456 KCN Tân Tạo, Q.Bình Tân, TP.HCM',
    leadTimeDays: 5,
    rating: 4.8,
    category: 'Nguyên liệu',
    status: 'active',
  },
  {
    code: 'SUP-003',
    name: 'Công ty TNHH Điện tử Phương Nam',
    country: 'Vietnam',
    contactName: 'Lê Văn C',
    contactEmail: 'info@phuongnam-elec.com',
    contactPhone: '028-2468-1357',
    address: '789 KCN VSIP, Bình Dương',
    leadTimeDays: 14,
    rating: 4.0,
    category: 'Linh kiện',
    status: 'active',
  },
];

const DEMO_CUSTOMERS = [
  {
    code: 'CUS-001',
    name: 'Công ty TNHH ABC Manufacturing',
    type: 'manufacturer',
    country: 'Vietnam',
    contactName: 'Phạm Văn D',
    contactEmail: 'purchasing@abc-mfg.com',
    contactPhone: '028-1111-2222',
    billingAddress: '100 Đường Võ Văn Kiệt, Q.1, TP.HCM',
    paymentTerms: 'Net 30',
    creditLimit: 500000000,
    status: 'active',
  },
  {
    code: 'CUS-002',
    name: 'Công ty CP XYZ Trading',
    type: 'trading',
    country: 'Vietnam',
    contactName: 'Hoàng Thị E',
    contactEmail: 'order@xyz-trading.vn',
    contactPhone: '028-3333-4444',
    billingAddress: '200 Nguyễn Huệ, Q.1, TP.HCM',
    paymentTerms: 'Net 45',
    creditLimit: 300000000,
    status: 'active',
  },
  {
    code: 'CUS-003',
    name: 'Công ty TNHH Tech Solutions',
    type: 'technology',
    country: 'Vietnam',
    contactName: 'Vũ Văn F',
    contactEmail: 'info@techsolutions.vn',
    contactPhone: '028-5555-6666',
    billingAddress: '300 Lê Lợi, Q.1, TP.HCM',
    paymentTerms: 'Net 30',
    creditLimit: 200000000,
    status: 'active',
  },
];

const DEMO_WAREHOUSES = [
  {
    code: 'WH-MAIN',
    name: 'Main Warehouse',
    location: 'TP.HCM',
    type: 'MAIN',
    status: 'active',
  },
  {
    code: 'WH-RECEIVING',
    name: 'Receiving Area',
    location: 'Khu nhận hàng - Chờ kiểm tra QC',
    type: 'RECEIVING',
    status: 'active',
  },
  {
    code: 'WH-HOLD',
    name: 'Hold Area',
    location: 'Khu chờ xử lý - Hàng conditional',
    type: 'HOLD',
    status: 'active',
  },
  {
    code: 'WH-QUARANTINE',
    name: 'Quarantine',
    location: 'Khu cách ly - Hàng lỗi chờ xử lý',
    type: 'QUARANTINE',
    status: 'active',
  },
  {
    code: 'WH-SCRAP',
    name: 'Scrap Area',
    location: 'Khu phế liệu - Hàng hủy chờ xử lý',
    type: 'SCRAP',
    status: 'active',
  },
];

const DEMO_PARTS = [
  {
    partNumber: 'RM-001',
    name: 'Thép tấm 2mm',
    category: 'Nguyên liệu',
    unit: 'kg',
    unitCost: 25000,
    minStockLevel: 500,
    reorderPoint: 200,
    isCritical: true,
  },
  {
    partNumber: 'RM-002',
    name: 'Nhựa ABS nguyên sinh',
    category: 'Nguyên liệu',
    unit: 'kg',
    unitCost: 45000,
    minStockLevel: 300,
    reorderPoint: 100,
    isCritical: true,
  },
  {
    partNumber: 'CP-001',
    name: 'Bo mạch điều khiển v2.0',
    category: 'Linh kiện',
    unit: 'pcs',
    unitCost: 150000,
    minStockLevel: 100,
    reorderPoint: 50,
    isCritical: true,
  },
  {
    partNumber: 'CP-002',
    name: 'Motor DC 24V',
    category: 'Linh kiện',
    unit: 'pcs',
    unitCost: 85000,
    minStockLevel: 200,
    reorderPoint: 80,
    isCritical: false,
  },
  {
    partNumber: 'PK-001',
    name: 'Thùng carton 40x30x20',
    category: 'Bao bì',
    unit: 'pcs',
    unitCost: 12000,
    minStockLevel: 1000,
    reorderPoint: 500,
    isCritical: false,
  },
  {
    partNumber: 'FG-001',
    name: 'Sản phẩm A hoàn chỉnh',
    category: 'Thành phẩm',
    unit: 'pcs',
    unitCost: 450000,
    minStockLevel: 50,
    reorderPoint: 20,
    isCritical: false,
  },
  {
    partNumber: 'FG-002',
    name: 'Sản phẩm B Premium',
    category: 'Thành phẩm',
    unit: 'pcs',
    unitCost: 680000,
    minStockLevel: 30,
    reorderPoint: 15,
    isCritical: false,
  },
  {
    partNumber: 'SP-001',
    name: 'Vòng bi 6205',
    category: 'Phụ tùng',
    unit: 'pcs',
    unitCost: 35000,
    minStockLevel: 100,
    reorderPoint: 40,
    isCritical: false,
  },
];

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

interface SeedResult {
  entity: string;
  action: 'created' | 'updated' | 'skipped' | 'error';
  count: number;
  details?: string[];
  error?: string;
}

async function seedUsers(): Promise<SeedResult> {
  const details: string[] = [];
  let created = 0;
  let updated = 0;

  for (const user of DEMO_USERS) {
    try {
      const existing = await prisma.user.findUnique({
        where: { email: user.email },
      });

      const hashedPassword = await bcrypt.hash(user.password, BCRYPT_ROUNDS);

      if (existing) {
        await prisma.user.update({
          where: { email: user.email },
          data: {
            name: user.name,
            password: hashedPassword,
            role: user.role,
            status: 'active',
            failedLoginCount: 0,
            lockedUntil: null,
          },
        });
        details.push(`Updated: ${user.email}`);
        updated++;
      } else {
        await prisma.user.create({
          data: {
            email: user.email,
            name: user.name,
            password: hashedPassword,
            role: user.role,
            status: 'active',
          },
        });
        details.push(`Created: ${user.email}`);
        created++;
      }
    } catch (error) {
      details.push(`Error ${user.email}: ${error instanceof Error ? error.message : 'Unknown'}`);
    }
  }

  return {
    entity: 'Users',
    action: created > 0 ? 'created' : updated > 0 ? 'updated' : 'skipped',
    count: created + updated,
    details,
  };
}

async function seedSuppliers(): Promise<SeedResult> {
  const details: string[] = [];
  let created = 0;

  for (const supplier of DEMO_SUPPLIERS) {
    try {
      const existing = await prisma.supplier.findFirst({
        where: { code: supplier.code },
      });

      if (!existing) {
        await prisma.supplier.create({
          data: supplier,
        });
        details.push(`Created: ${supplier.code} - ${supplier.name}`);
        created++;
      } else {
        details.push(`Skipped (exists): ${supplier.code}`);
      }
    } catch (error) {
      details.push(`Error ${supplier.code}: ${error instanceof Error ? error.message : 'Unknown'}`);
    }
  }

  return {
    entity: 'Suppliers',
    action: created > 0 ? 'created' : 'skipped',
    count: created,
    details,
  };
}

async function seedCustomers(): Promise<SeedResult> {
  const details: string[] = [];
  let created = 0;

  for (const customer of DEMO_CUSTOMERS) {
    try {
      const existing = await prisma.customer.findFirst({
        where: { code: customer.code },
      });

      if (!existing) {
        await prisma.customer.create({
          data: customer,
        });
        details.push(`Created: ${customer.code} - ${customer.name}`);
        created++;
      } else {
        details.push(`Skipped (exists): ${customer.code}`);
      }
    } catch (error) {
      details.push(`Error ${customer.code}: ${error instanceof Error ? error.message : 'Unknown'}`);
    }
  }

  return {
    entity: 'Customers',
    action: created > 0 ? 'created' : 'skipped',
    count: created,
    details,
  };
}

async function seedWarehouses(): Promise<SeedResult> {
  const details: string[] = [];
  let created = 0;

  for (const warehouse of DEMO_WAREHOUSES) {
    try {
      const existing = await prisma.warehouse.findFirst({
        where: { code: warehouse.code },
      });

      if (!existing) {
        await prisma.warehouse.create({
          data: warehouse,
        });
        details.push(`Created: ${warehouse.code} - ${warehouse.name}`);
        created++;
      } else {
        details.push(`Skipped (exists): ${warehouse.code}`);
      }
    } catch (error) {
      details.push(`Error ${warehouse.code}: ${error instanceof Error ? error.message : 'Unknown'}`);
    }
  }

  return {
    entity: 'Warehouses',
    action: created > 0 ? 'created' : 'skipped',
    count: created,
    details,
  };
}

async function seedParts(): Promise<SeedResult> {
  const details: string[] = [];
  let created = 0;

  for (const part of DEMO_PARTS) {
    try {
      const existing = await prisma.part.findFirst({
        where: { partNumber: part.partNumber },
      });

      if (!existing) {
        await prisma.part.create({
          data: {
            ...part,
            status: 'active',
          },
        });
        details.push(`Created: ${part.partNumber} - ${part.name}`);
        created++;
      } else {
        details.push(`Skipped (exists): ${part.partNumber}`);
      }
    } catch (error) {
      details.push(`Error ${part.partNumber}: ${error instanceof Error ? error.message : 'Unknown'}`);
    }
  }

  return {
    entity: 'Parts',
    action: created > 0 ? 'created' : 'skipped',
    count: created,
    details,
  };
}

async function seedInventory(): Promise<SeedResult> {
  const details: string[] = [];
  let created = 0;

  try {
    // Get main warehouse
    const mainWarehouse = await prisma.warehouse.findFirst({
      where: { code: 'WH-MAIN' },
    });

    if (!mainWarehouse) {
      return {
        entity: 'Inventory',
        action: 'error',
        count: 0,
        error: 'Main warehouse not found',
      };
    }

    // Get all parts
    const parts = await prisma.part.findMany({
      include: {
        planning: true,
      },
    });

    for (const part of parts) {
      const existing = await prisma.inventory.findFirst({
        where: {
          partId: part.id,
          warehouseId: mainWarehouse.id,
        },
      });

      if (!existing) {
        const minStockLevel = part.planning?.minStockLevel || 0;
        const reorderPoint = part.planning?.reorderPoint || 0;
        const quantity = Math.floor(Math.random() * (minStockLevel * 2)) + reorderPoint;

        await prisma.inventory.create({
          data: {
            partId: part.id,
            warehouseId: mainWarehouse.id,
            quantity,
            reservedQty: 0,
            lotNumber: `LOT-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`,
          },
        });
        details.push(`Created inventory for: ${part.partNumber} (qty: ${quantity})`);
        created++;
      } else {
        details.push(`Skipped (exists): ${part.partNumber}`);
      }
    }
  } catch (error) {
    return {
      entity: 'Inventory',
      action: 'error',
      count: 0,
      error: 'Failed to seed inventory data',
    };
  }

  return {
    entity: 'Inventory',
    action: created > 0 ? 'created' : 'skipped',
    count: created,
    details,
  };
}

// =============================================================================
// API HANDLER
// =============================================================================

export const POST = withAuth(async (request, context, session) => {
  // Environment gate check
  if (!isDemoEnabled) return demoDisabledResponse();

  // Rate limiting
  const rateLimitResult = await checkWriteEndpointLimit(request);
  if (rateLimitResult) return rateLimitResult;

  const startTime = Date.now();

  try {
    // Parse options from request body
    let options = {
      users: true,
      suppliers: true,
      customers: true,
      warehouses: true,
      parts: true,
      inventory: true,
    };

    try {
      const seedBodySchema = z.object({
        users: z.boolean().optional(),
        suppliers: z.boolean().optional(),
        customers: z.boolean().optional(),
        warehouses: z.boolean().optional(),
        parts: z.boolean().optional(),
        inventory: z.boolean().optional(),
      });

      const rawBody = await request.json();
      const parseResult = seedBodySchema.safeParse(rawBody);
      if (parseResult.success) {
        options = { ...options, ...parseResult.data };
      }
    } catch {
      // Use default options if no body
    }

    const results: SeedResult[] = [];

    // Seed in order (respecting dependencies)
    if (options.users) {
      results.push(await seedUsers());
    }

    if (options.suppliers) {
      results.push(await seedSuppliers());
    }

    if (options.customers) {
      results.push(await seedCustomers());
    }

    if (options.warehouses) {
      results.push(await seedWarehouses());
    }

    if (options.parts) {
      results.push(await seedParts());
    }

    if (options.inventory) {
      results.push(await seedInventory());
    }

    const duration = Date.now() - startTime;

    // Summary
    const totalCreated = results.reduce((sum, r) => sum + (r.action === 'created' ? r.count : 0), 0);
    const totalUpdated = results.reduce((sum, r) => sum + (r.action === 'updated' ? r.count : 0), 0);
    const hasErrors = results.some((r) => r.action === 'error');

    return NextResponse.json({
      success: !hasErrors,
      timestamp: new Date().toISOString(),
      duration: `${duration}ms`,
      summary: {
        totalCreated,
        totalUpdated,
        entities: results.length,
        hasErrors,
      },
      results,
      demoAccounts: [
        'admin@demo.your-domain.com',
        'manager@demo.your-domain.com',
        'operator@demo.your-domain.com',
        'viewer@demo.your-domain.com',
      ],
    });
  } catch (error) {
    logger.logError(error instanceof Error ? error : new Error(String(error)), { context: 'POST /api/demo/seed' });
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to seed demo data',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
});

// GET method for simple trigger (no body needed) - also requires auth
export const GET = withAuth(async (request, context, session) => {
  // Delegate to POST handler logic by calling the wrapped handler
  return POST(request, context);
});
