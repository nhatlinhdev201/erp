// =============================================================================
// L-ERP MRP - AI Migration API
// /api/migration/analyze
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { AIMigrationEngine, DataTransformer, TARGET_SCHEMAS, type MigrationAnalysis, type ColumnMapping } from '@/lib/migration-engine';
import { logger } from '@/lib/logger';
import { withAuth } from '@/lib/api/with-auth';
import { z } from 'zod';

import { checkWriteEndpointLimit } from '@/lib/rate-limit';
const migrationEngine = new AIMigrationEngine();
const dataTransformer = new DataTransformer();

export const POST = withAuth(async (request: NextRequest, context, session) => {
    // Rate limiting
    const rateLimitResult = await checkWriteEndpointLimit(request);
    if (rateLimitResult) return rateLimitResult;

  try {
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'No files uploaded' },
        { status: 400 }
      );
    }

    const results = [];

    for (const file of files) {
      // Read Excel file
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'buffer' });

      const fileResult = {
        filename: file.name,
        sheets: [] as Array<{ name: string; rowCount: number; columns: string[]; analysis: MigrationAnalysis }>
      };

      // Analyze each sheet
      for (const sheetName of workbook.SheetNames) {
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as unknown[][];

        if (jsonData.length < 2) continue; // Skip empty sheets

        const headers = jsonData[0] as string[];
        const dataRows = jsonData.slice(1).filter(row => row.some(cell => cell != null));
        const sampleData = dataRows.slice(0, 5);

        // Analyze with rule-based engine
        const analysis = migrationEngine.analyzeFile(file.name, headers, sampleData);

        // Add sample data to mappings
        for (const mapping of analysis.mappings) {
          const colIndex = headers.indexOf(mapping.sourceColumn);
          if (colIndex >= 0) {
            (mapping as unknown as Record<string, unknown>).sampleValues = sampleData
              .map(row => row[colIndex])
              .filter(v => v != null)
              .slice(0, 3);
          }
        }

        fileResult.sheets.push({
          name: sheetName,
          rowCount: dataRows.length,
          columns: headers,
          analysis
        });
      }

      results.push(fileResult);
    }

    // Calculate overall stats
    const totalRecords = results.reduce((sum, f) =>
      sum + f.sheets.reduce((s, sheet) => s + sheet.rowCount, 0), 0
    );

    const allMappings = results.flatMap(f =>
      f.sheets.flatMap(s => s.analysis.mappings)
    );

    const mappedCount = allMappings.filter(m => m.targetField !== 'unmapped').length;
    const avgConfidence = allMappings.length > 0
      ? Math.round(allMappings.reduce((sum, m) => sum + m.confidence, 0) / allMappings.length)
      : 0;

    const warnings = results.flatMap(f =>
      f.sheets.flatMap(s => s.analysis.warnings)
    );

    const errors = results.flatMap(f =>
      f.sheets.flatMap(s => s.analysis.errors)
    );

    return NextResponse.json({
      success: true,
      data: {
        files: results,
        summary: {
          totalFiles: results.length,
          totalRecords,
          mappedFields: mappedCount,
          unmappedFields: allMappings.length - mappedCount,
          confidence: avgConfidence,
          warnings: warnings.length,
          errors: errors.length
        }
      }
    });

  } catch (error) {
    logger.logError(error instanceof Error ? error : new Error(String(error)), { context: '/api/migration/analyze' });
    return NextResponse.json(
      { error: 'Failed to analyze files', details: String(error) },
      { status: 500 }
    );
  }
});

// =============================================================================
// Transform & Preview endpoint
// =============================================================================
export const PUT = withAuth(async (request: NextRequest, context, session) => {
    // Rate limiting
    const rateLimitResult = await checkWriteEndpointLimit(request);
    if (rateLimitResult) return rateLimitResult;

  try {
    const bodySchema = z.object({
      fileData: z.array(z.record(z.string(), z.unknown())),
      mappings: z.array(z.record(z.string(), z.unknown())),
      targetTable: z.string(),
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
    const { fileData, mappings, targetTable } = body;

    if (!fileData || !mappings || !targetTable) {
      return NextResponse.json(
        { error: 'Missing required data' },
        { status: 400 }
      );
    }

    // Transform data
    const transformedRows = [];
    const issues = [];

    for (let i = 0; i < fileData.length; i++) {
      try {
        const transformed = dataTransformer.transformRow(
          fileData[i],
          mappings as unknown as ColumnMapping[],
          targetTable
        );
        transformedRows.push(transformed);
      } catch (error) {
        issues.push({
          row: i + 2, // Excel row number (1-indexed + header)
          error: String(error)
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        preview: transformedRows.slice(0, 10),
        totalRows: transformedRows.length,
        issues,
        targetSchema: TARGET_SCHEMAS[targetTable as keyof typeof TARGET_SCHEMAS]
      }
    });

  } catch (error) {
    logger.logError(error instanceof Error ? error : new Error(String(error)), { context: '/api/migration/analyze' });
    return NextResponse.json(
      { error: 'Failed to transform data', details: String(error) },
      { status: 500 }
    );
  }
});
