// =============================================================================
// L-ERP MRP - VALIDATION SCHEMAS UNIT TESTS
// Tests for Zod validation schemas
// =============================================================================

import { describe, it, expect } from 'vitest';
import {
  PaginationSchema,
  SortSchema,
  IdSchema,
  DateRangeSchema,
  PartFiltersSchema,
  PartCreateSchema,
  SalesOrderCreateSchema,
  WorkOrderCreateSchema,
  NCRCreateSchema,
  InventoryActionSchema,
  BOMLineCreateSchema,
} from '@/lib/validation/schemas';

import {
  EquipmentCreateSchema,
  MaintenanceCreateSchema,
  CustomerCreateSchema,
  AIChatSchema,
  MRPRunSchema,
} from '@/lib/validations/additional-schemas';

// =============================================================================
// COMMON SCHEMAS TESTS
// =============================================================================

describe('Common Validation Schemas', () => {
  describe('PaginationSchema', () => {
    it('should use default values when not provided', () => {
      const result = PaginationSchema.parse({});
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(20);
    });

    it('should coerce string numbers', () => {
      const result = PaginationSchema.parse({ page: '5', pageSize: '50' });
      expect(result.page).toBe(5);
      expect(result.pageSize).toBe(50);
    });

    it('should reject invalid page numbers', () => {
      expect(() => PaginationSchema.parse({ page: 0 })).toThrow();
      expect(() => PaginationSchema.parse({ page: -1 })).toThrow();
    });

    it('should limit pageSize to 100', () => {
      expect(() => PaginationSchema.parse({ pageSize: 101 })).toThrow();
    });
  });

  describe('SortSchema', () => {
    it('should default sortOrder to asc', () => {
      const result = SortSchema.parse({});
      expect(result.sortOrder).toBe('asc');
    });

    it('should accept valid sort orders', () => {
      expect(SortSchema.parse({ sortOrder: 'asc' }).sortOrder).toBe('asc');
      expect(SortSchema.parse({ sortOrder: 'desc' }).sortOrder).toBe('desc');
    });

    it('should reject invalid sort orders', () => {
      expect(() => SortSchema.parse({ sortOrder: 'invalid' })).toThrow();
    });
  });

  describe('IdSchema', () => {
    it('should validate non-empty id', () => {
      const result = IdSchema.parse({ id: 'abc123' });
      expect(result.id).toBe('abc123');
    });

    it('should reject empty id', () => {
      expect(() => IdSchema.parse({ id: '' })).toThrow();
    });

    it('should reject too long id', () => {
      expect(() => IdSchema.parse({ id: 'a'.repeat(51) })).toThrow();
    });
  });

  describe('DateRangeSchema', () => {
    it('should accept valid date range', () => {
      const start = new Date('2024-01-01');
      const end = new Date('2024-12-31');
      const result = DateRangeSchema.parse({ startDate: start, endDate: end });
      expect(result.startDate).toEqual(start);
      expect(result.endDate).toEqual(end);
    });

    it('should reject invalid date range (start > end)', () => {
      expect(() => DateRangeSchema.parse({
        startDate: new Date('2024-12-31'),
        endDate: new Date('2024-01-01'),
      })).toThrow();
    });
  });
});

// =============================================================================
// PART SCHEMAS TESTS
// =============================================================================

describe('Part Validation Schemas', () => {
  describe('PartFiltersSchema', () => {
    it('should accept valid filters', () => {
      const result = PartFiltersSchema.parse({
        category: 'Electronics',
        status: 'ACTIVE',
        type: 'BUY',
      });
      expect(result.category).toBe('Electronics');
      expect(result.status).toBe('ACTIVE');
    });

    it('should reject invalid status', () => {
      expect(() => PartFiltersSchema.parse({ status: 'INVALID' })).toThrow();
    });
  });
});

// =============================================================================
// ADDITIONAL SCHEMAS TESTS
// =============================================================================

describe('Additional Validation Schemas', () => {
  describe('EquipmentCreateSchema', () => {
    it('should accept valid equipment data', () => {
      const result = EquipmentCreateSchema.parse({
        code: 'EQ-001',
        name: 'CNC Machine',
      });
      expect(result.code).toBe('EQ-001');
      expect(result.name).toBe('CNC Machine');
    });
  });

  describe('MaintenanceCreateSchema', () => {
    it('should accept valid maintenance data', () => {
      const result = MaintenanceCreateSchema.parse({
        equipmentId: 'eq-001',
        type: 'PREVENTIVE',
        title: 'Monthly inspection',
      });
      expect(result.type).toBe('PREVENTIVE');
    });

    it('should reject invalid type', () => {
      expect(() => MaintenanceCreateSchema.parse({
        equipmentId: 'eq-001',
        type: 'INVALID',
        title: 'Test',
      })).toThrow();
    });
  });

  describe('CustomerCreateSchema', () => {
    it('should accept valid customer data', () => {
      const result = CustomerCreateSchema.parse({
        code: 'CUST-001',
        name: 'Acme Corp',
      });
      expect(result.currency).toBe('USD');
    });

    it('should validate email format', () => {
      expect(() => CustomerCreateSchema.parse({
        code: 'CUST-001',
        name: 'Acme Corp',
        email: 'invalid-email',
      })).toThrow();
    });
  });

  describe('AIChatSchema', () => {
    it('should accept valid chat message', () => {
      const result = AIChatSchema.parse({
        message: 'What is the current inventory level?',
      });
      expect(result.message).toBeDefined();
    });

    it('should reject empty message', () => {
      expect(() => AIChatSchema.parse({ message: '' })).toThrow();
    });

    it('should reject too long message', () => {
      expect(() => AIChatSchema.parse({
        message: 'a'.repeat(5001),
      })).toThrow();
    });
  });

  describe('MRPRunSchema', () => {
    it('should accept valid MRP run parameters', () => {
      const result = MRPRunSchema.parse({});
      expect(result.planningHorizon).toBe(30);
      expect(result.includeDemand).toBe(true);
    });

    it('should reject invalid planning horizon', () => {
      expect(() => MRPRunSchema.parse({
        planningHorizon: 400,
      })).toThrow();
    });
  });
});
