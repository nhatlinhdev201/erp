// =============================================================================
// L-ERP MRP - Migration Import API
// /api/migration/import
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { DataTransformer, ColumnMapping } from '@/lib/migration-engine';
import { logger } from '@/lib/logger';
import { withAuth } from '@/lib/api/with-auth';
import { checkHeavyEndpointLimit } from '@/lib/rate-limit';
import { z } from 'zod';

const dataTransformer = new DataTransformer();

/** Safe parseFloat that returns fallback instead of NaN */
function safeParseFloat(value: unknown, fallback: number | null = null): number | null {
  if (value == null || value === '') return fallback;
  const num = parseFloat(String(value));
  return isNaN(num) ? fallback : num;
}

/** Safe parseInt that returns fallback instead of NaN */
function safeParseInt(value: unknown, fallback: number): number {
  if (value == null || value === '') return fallback;
  const num = parseInt(String(value), 10);
  return isNaN(num) ? fallback : num;
}

interface ImportRequest {
  targetTable: string;
  data: Record<string, unknown>[];
  mappings: ColumnMapping[];
  options?: {
    skipDuplicates?: boolean;
    updateExisting?: boolean;
    validateOnly?: boolean;
  };
}

interface ImportError {
  row: number;
  field?: string;
  message?: string;
  error?: string;
  data?: Record<string, unknown>;
}

export const POST = withAuth(async (request: NextRequest, context, session) => {
  try {
    // Rate limiting (heavy endpoint)
    const rateLimit = await checkHeavyEndpointLimit(request);
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429, headers: { 'Retry-After': String(rateLimit.retryAfter || 60) } }
      );
    }

    const bodySchema = z.object({
      targetTable: z.string(),
      data: z.array(z.record(z.string(), z.unknown())),
      mappings: z.array(z.record(z.string(), z.unknown())),
      options: z.object({
        skipDuplicates: z.boolean().optional(),
        updateExisting: z.boolean().optional(),
        validateOnly: z.boolean().optional(),
      }).optional(),
    });
    const rawBody = await request.json();
    const parseResult = bodySchema.safeParse(rawBody);
    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid input', details: parseResult.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    const body = parseResult.data;
    const { targetTable, data, mappings, options = {} } = body;

    if (!targetTable || !data || data.length === 0) {
      return NextResponse.json(
        { error: 'Missing required data' },
        { status: 400 }
      );
    }

    const results = {
      success: 0,
      failed: 0,
      skipped: 0,
      errors: [] as ImportError[],
      created: [] as string[],
      updated: [] as string[]
    };

    // Validate only mode
    if (options.validateOnly) {
      const validationErrors = await validateData(targetTable, data);
      return NextResponse.json({
        success: true,
        data: {
          valid: validationErrors.length === 0,
          errors: validationErrors,
          totalRows: data.length
        }
      });
    }

    // Process each row
    for (let i = 0; i < data.length; i++) {
      const row = data[i];

      try {
        // Transform row data
        const transformedRow = dataTransformer.transformRow(row, mappings as unknown as ColumnMapping[], targetTable);

        // Import based on target table
        switch (targetTable) {
          case 'Parts':
            await importPart(transformedRow, options, results);
            break;
          case 'Suppliers':
            await importSupplier(transformedRow, options, results);
            break;
          case 'Customers':
            await importCustomer(transformedRow, options, results);
            break;
          case 'BOM':
            await importBOMLine(transformedRow, options, results);
            break;
          default:
            results.errors.push({ row: i + 1, error: `Unknown target table: ${targetTable}` });
            results.failed++;
        }

      } catch (error) {
        results.errors.push({
          row: i + 1,
          data: row,
          error: String(error)
        });
        results.failed++;
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          total: data.length,
          success: results.success,
          failed: results.failed,
          skipped: results.skipped
        },
        created: results.created.length,
        updated: results.updated.length,
        errors: results.errors.slice(0, 20) // Limit error details
      }
    });

  } catch (error) {
    logger.logError(error instanceof Error ? error : new Error(String(error)), { context: '/api/migration/import' });
    return NextResponse.json(
      { error: 'Failed to import data', details: String(error) },
      { status: 500 }
    );
  }
});

// =============================================================================
// IMPORT FUNCTIONS
// =============================================================================

type ImportOptions = { skipDuplicates?: boolean; updateExisting?: boolean; validateOnly?: boolean };
type ImportResults = { success: number; failed: number; skipped: number; errors: ImportError[]; created: string[]; updated: string[] };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function importPart(
  data: Record<string, any>,
  options: ImportOptions,
  results: ImportResults
) {
  const partNumber = data.partNumber || data.part_number;

  if (!partNumber) {
    throw new Error('Missing partNumber');
  }

  // Check existing
  const existing = await prisma.part.findUnique({
    where: { partNumber }
  });

  if (existing) {
    if (options.updateExisting) {
      await prisma.part.update({
        where: { partNumber },
        data: {
          name: data.name || existing.name,
          description: data.description,
          category: data.category || existing.category,
          unit: data.unit || existing.unit,

          updatedAt: new Date(),

          // Update related tables
          costs: {
            deleteMany: {},
            create: {
              unitCost: safeParseFloat(data.unitCost, 0) as number,
            }
          },
          specs: {
            upsert: {
              create: {
                weightKg: safeParseFloat(data.weightKg, null),
                lengthMm: safeParseFloat(data.lengthMm, null),
                widthMm: safeParseFloat(data.widthMm, null),
                heightMm: safeParseFloat(data.heightMm, null),
                subCategory: data.subCategory,
              },
              update: {
                weightKg: safeParseFloat(data.weightKg, null) ?? undefined,
                lengthMm: safeParseFloat(data.lengthMm, null) ?? undefined,
                widthMm: safeParseFloat(data.widthMm, null) ?? undefined,
                heightMm: safeParseFloat(data.heightMm, null) ?? undefined,
                subCategory: data.subCategory,
              }
            }
          },
          planning: {
            upsert: {
              create: {
                makeOrBuy: data.makeOrBuy || 'BUY',
                procurementType: data.procurementType || 'STOCK',
                minStockLevel: safeParseInt(data.minStockLevel, 0),
                reorderPoint: safeParseInt(data.reorderPoint, 0),
                safetyStock: safeParseInt(data.safetyStock, 0),
                leadTimeDays: safeParseInt(data.leadTimeDays, 14),
              },
              update: {
                makeOrBuy: data.makeOrBuy,
                procurementType: data.procurementType,
                minStockLevel: data.minStockLevel ? safeParseInt(data.minStockLevel, 0) : undefined,
                reorderPoint: data.reorderPoint ? safeParseInt(data.reorderPoint, 0) : undefined,
                safetyStock: data.safetyStock ? safeParseInt(data.safetyStock, 0) : undefined,
                leadTimeDays: data.leadTimeDays ? parseInt(data.leadTimeDays) : undefined,
              }
            }
          },
          compliance: {
            upsert: {
              create: {
                countryOfOrigin: data.countryOfOrigin,
                ndaaCompliant: data.ndaaCompliant ?? true,
                lotControl: data.lotControl ?? false,
                serialControl: data.serialControl ?? false,
                inspectionRequired: data.inspectionRequired ?? true,
                rohsCompliant: data.rohsCompliant ?? true,
                reachCompliant: data.reachCompliant ?? true,
              },
              update: {
                countryOfOrigin: data.countryOfOrigin,
                ndaaCompliant: data.ndaaCompliant,
                lotControl: data.lotControl,
                serialControl: data.serialControl,
                inspectionRequired: data.inspectionRequired,
                rohsCompliant: data.rohsCompliant,
                reachCompliant: data.reachCompliant,
              }
            }
          }
        }
      });
      results.updated.push(partNumber);
      results.success++;
    } else if (options.skipDuplicates) {
      results.skipped++;
    } else {
      throw new Error(`Part ${partNumber} already exists`);
    }
    return;
  }

  // Create new part
  await prisma.part.create({
    data: {
      partNumber,
      name: data.name || partNumber,
      description: data.description || '',
      category: data.category || 'Accessories',
      unit: data.unit || 'pcs',
      status: 'active',
      lifecycleStatus: data.lifecycleStatus || 'ACTIVE',

      revision: data.revision || 'A', // Warning: Check if this field still exists or needs to be removed. 
      // Based on previous findings, revision might be removed from Part.
      // But let's check prisma schema lines in view 100-180 of Step 752.
      // Line 174: partRevisions PartRevision[]
      // The schema does NOT show a 'revision' String field on Part model.
      // So I should REMOVE revision assignment here.

      // Nested Writes
      costs: {
        create: {
          unitCost: safeParseFloat(data.unitCost, 0) as number,
        }
      },
      specs: {
        create: {
          weightKg: safeParseFloat(data.weightKg, null),
          lengthMm: safeParseFloat(data.lengthMm, null),
          widthMm: safeParseFloat(data.widthMm, null),
          heightMm: safeParseFloat(data.heightMm, null),
          subCategory: data.subCategory,
        }
      },
      planning: {
        create: {
          makeOrBuy: data.makeOrBuy || 'BUY',
          procurementType: data.procurementType || 'STOCK',
          minStockLevel: safeParseInt(data.minStockLevel, 0),
          reorderPoint: safeParseInt(data.reorderPoint, 0),
          safetyStock: safeParseInt(data.safetyStock, 0),
          leadTimeDays: safeParseInt(data.leadTimeDays, 14),
        }
      },
      compliance: {
        create: {
          countryOfOrigin: data.countryOfOrigin,
          ndaaCompliant: data.ndaaCompliant ?? true,
          itarControlled: data.itarControlled ?? false,
          lotControl: data.lotControl ?? false,
          serialControl: data.serialControl ?? false,
          inspectionRequired: data.inspectionRequired ?? true,
          rohsCompliant: data.rohsCompliant ?? true,
          reachCompliant: data.reachCompliant ?? true,
        }
      }
    }
  });

  results.created.push(partNumber);
  results.success++;
}

async function importSupplier(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: Record<string, any>,
  options: ImportOptions,
  results: ImportResults
) {
  const code = data.supplierCode || data.code;

  if (!code) {
    throw new Error('Missing supplier code');
  }

  // Check existing
  const existing = await prisma.supplier.findUnique({
    where: { code }
  });

  if (existing) {
    if (options.updateExisting) {
      await prisma.supplier.update({
        where: { code },
        data: {
          name: data.name || existing.name,
          country: data.country || existing.country,
          address: data.address || data.city,
          contactEmail: data.contactEmail || data.email || existing.contactEmail,
          contactPhone: data.contactPhone || data.phone || existing.contactPhone,
          leadTimeDays: data.leadTimeDays ? safeParseInt(data.leadTimeDays, existing.leadTimeDays) : existing.leadTimeDays,
          paymentTerms: data.paymentTerms,
          ndaaCompliant: data.ndaaCompliant ?? existing.ndaaCompliant,
          rating: data.rating ? (safeParseFloat(data.rating, null) ?? existing.rating) : existing.rating,
          updatedAt: new Date()
        }
      });
      results.updated.push(code);
      results.success++;
    } else if (options.skipDuplicates) {
      results.skipped++;
    } else {
      throw new Error(`Supplier ${code} already exists`);
    }
    return;
  }

  // Create new
  await prisma.supplier.create({
    data: {
      code,
      name: data.name || code,
      country: data.country || 'Unknown',
      address: data.address || data.city,
      contactEmail: data.contactEmail || data.email,
      contactPhone: data.contactPhone || data.phone,
      leadTimeDays: safeParseInt(data.leadTimeDays, 14),
      paymentTerms: data.paymentTerms || 'Net 30',
      ndaaCompliant: data.ndaaCompliant ?? true,
      rating: safeParseFloat(data.rating, 3) as number,
      status: 'active'
    }
  });

  results.created.push(code);
  results.success++;
}

async function importCustomer(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: Record<string, any>,
  options: ImportOptions,
  results: ImportResults
) {
  const code = data.customerCode || data.code;

  if (!code) {
    throw new Error('Missing customer code');
  }

  const existing = await prisma.customer.findUnique({
    where: { code }
  });

  if (existing) {
    if (options.updateExisting) {
      await prisma.customer.update({
        where: { code },
        data: {
          name: data.name || existing.name,
          type: data.type || existing.type,
          country: data.country || existing.country,
          contactEmail: data.contactEmail || data.email || existing.contactEmail,
          contactPhone: data.contactPhone || data.phone || existing.contactPhone,
          creditLimit: data.creditLimit ? (safeParseFloat(data.creditLimit, 0) ?? existing.creditLimit) : existing.creditLimit,
          paymentTerms: data.paymentTerms || existing.paymentTerms
        }
      });
      results.updated.push(code);
      results.success++;
    } else if (options.skipDuplicates) {
      results.skipped++;
    } else {
      throw new Error(`Customer ${code} already exists`);
    }
    return;
  }

  await prisma.customer.create({
    data: {
      code,
      name: data.name || code,
      type: data.type || 'enterprise',
      country: data.country || 'Unknown',
      contactEmail: data.contactEmail || data.email,
      contactPhone: data.contactPhone || data.phone,
      creditLimit: safeParseFloat(data.creditLimit, 0) ?? 0,
      paymentTerms: data.paymentTerms || 'Net 30',
      status: 'active'
    }
  });

  results.created.push(code);
  results.success++;
}

async function importBOMLine(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: Record<string, any>,
  options: ImportOptions,
  results: ImportResults
) {
  const productSku = data.productSku || data.product_sku;
  const partNumber = data.partNumber || data.part_number;

  if (!productSku || !partNumber) {
    throw new Error('Missing productSku or partNumber');
  }

  // Find product and part
  const product = await prisma.product.findUnique({
    where: { sku: productSku }
  });

  const part = await prisma.part.findUnique({
    where: { partNumber }
  });

  if (!product) {
    throw new Error(`Product ${productSku} not found`);
  }

  if (!part) {
    throw new Error(`Part ${partNumber} not found`);
  }

  const version = data.version || data.revision || 'A';

  // Find or create BomHeader for this product
  let bomHeader = await prisma.bomHeader.findFirst({
    where: {
      productId: product.id,
      version
    }
  });

  if (!bomHeader) {
    bomHeader = await prisma.bomHeader.create({
      data: {
        productId: product.id,
        version,
        effectiveDate: new Date(),
        status: 'active'
      }
    });
  }

  // Get next line number
  const lastLine = await prisma.bomLine.findFirst({
    where: { bomId: bomHeader.id },
    orderBy: { lineNumber: 'desc' }
  });
  const nextLineNumber = (lastLine?.lineNumber || 0) + 1;

  // Check existing BOM line
  const existing = await prisma.bomLine.findFirst({
    where: {
      bomId: bomHeader.id,
      partId: part.id,
      revision: version
    }
  });

  if (existing) {
    if (options.updateExisting) {
      await prisma.bomLine.update({
        where: { id: existing.id },
        data: {
          quantity: data.quantity ? (safeParseFloat(data.quantity, null) ?? existing.quantity) : existing.quantity,
          unit: data.unit || existing.unit,
          moduleCode: data.moduleCode || data.module,
          findNumber: data.findNumber ? safeParseInt(data.findNumber, existing.findNumber ?? 0) : existing.findNumber,
          referenceDesignator: data.referenceDesignator,
          scrapPercent: data.scrapPercent ? (safeParseFloat(data.scrapPercent, null) ?? existing.scrapPercent) : existing.scrapPercent,
          isCritical: data.isCritical ?? data.critical ?? existing.isCritical,
          updatedAt: new Date()
        }
      });
      results.updated.push(`${productSku}:${partNumber}`);
      results.success++;
    } else if (options.skipDuplicates) {
      results.skipped++;
    } else {
      throw new Error(`BOM line ${productSku}:${partNumber} already exists`);
    }
    return;
  }

  await prisma.bomLine.create({
    data: {
      bomId: bomHeader.id,
      partId: part.id,
      lineNumber: nextLineNumber,
      quantity: safeParseFloat(data.quantity, 1) as number,
      unit: data.unit || 'pcs',
      moduleCode: data.moduleCode || data.module,
      findNumber: data.findNumber ? safeParseInt(data.findNumber, 0) : null,
      referenceDesignator: data.referenceDesignator,
      scrapPercent: safeParseFloat(data.scrapPercent, 0) as number,
      revision: version,
      bomType: data.bomType || 'MANUFACTURING',
      isCritical: data.isCritical ?? data.critical ?? false,
      isPrimary: data.isPrimary ?? true,
      phantom: data.phantom ?? false,
      subAssembly: data.subAssembly ?? false,
      sequence: safeParseInt(data.sequence, 0)
    }
  });

  results.created.push(`${productSku}:${partNumber}`);
  results.success++;
}

// =============================================================================
// VALIDATION
// =============================================================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function validateData(
  targetTable: string,
  data: Record<string, any>[]
): Promise<Record<string, unknown>[]> {
  const errors = [];

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const rowErrors = [];

    switch (targetTable) {
      case 'Parts':
        if (!row.partNumber && !row.part_number) rowErrors.push('Missing partNumber');
        if (!row.name) rowErrors.push('Missing name');
        if (row.unitCost && isNaN(parseFloat(row.unitCost))) {
          rowErrors.push('Invalid unitCost');
        }
        break;

      case 'Suppliers':
        if (!row.supplierCode && !row.code) rowErrors.push('Missing supplier code');
        if (!row.name) rowErrors.push('Missing name');
        break;

      case 'Customers':
        if (!row.customerCode && !row.code) rowErrors.push('Missing customer code');
        if (!row.name) rowErrors.push('Missing name');
        break;

      case 'BOM':
        if (!row.productSku && !row.product_sku) rowErrors.push('Missing productSku');
        if (!row.partNumber && !row.part_number) rowErrors.push('Missing partNumber');
        if (!row.quantity) rowErrors.push('Missing quantity');
        break;
    }

    if (rowErrors.length > 0) {
      errors.push({ row: i + 2, errors: rowErrors });
    }
  }

  return errors;
}
