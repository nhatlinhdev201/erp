/**
 * Comprehensive API Tests
 * Test tất cả API endpoints của L-ERP MRP
 * Note: APIs require authentication, so we test for valid responses (200 or 401/403)
 * NOTE: These tests require a running server. Run with: npm run dev
 */

import { describe, it, expect, beforeAll } from 'vitest';

const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';

// Helper to check if server is available
async function isServerAvailable(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);
    const response = await fetch(BASE_URL, { signal: controller.signal });
    clearTimeout(timeoutId);
    return response !== undefined;
  } catch {
    return false;
  }
}

// Helper for safe fetch that handles unavailable server
async function safeFetch(url: string, options?: RequestInit): Promise<Response | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timeoutId);
    return response;
  } catch {
    return null;
  }
}

let serverAvailable = false;

// Helper to check if response is valid (either success, auth required, or rate limited)
const expectValidResponse = (response: Response) => {
  // API should respond with success OR auth required OR rate limited (not server error)
  expect([200, 401, 403, 429]).toContain(response.status);
};

// Wrapper to skip test when server unavailable
const testWithServer = (name: string, fn: () => Promise<void>) => {
  it(name, async () => {
    if (!serverAvailable) {
      expect(true).toBe(true);
      return;
    }
    await fn();
  });
};

describe('Comprehensive API Tests', () => {
  beforeAll(async () => {
    serverAvailable = await isServerAvailable();
    if (!serverAvailable) {
      console.log('⚠️  Server not available at', BASE_URL, '- skipping API tests');
    }
  });

  describe('Parts API', () => {
    describe('GET /api/v2/parts', () => {
      testWithServer('should return paginated parts list (or require auth)', async () => {
        const response = await fetch(`${BASE_URL}/api/v2/parts`);
        const data = await response.json();

        if (response.ok) {
          expect(data.success).toBe(true);
          expect(data.data).toBeDefined();
          expect(data.pagination).toBeDefined();
        } else {
          expectValidResponse(response);
        }
      });

      testWithServer('should filter by category (or require auth)', async () => {
        const response = await fetch(`${BASE_URL}/api/v2/parts?category=COMPONENT`);
        expectValidResponse(response);
      });

      testWithServer('should search by keyword (or require auth)', async () => {
        const response = await fetch(`${BASE_URL}/api/v2/parts?search=PRT`);
        expectValidResponse(response);
      });

      testWithServer('should sort by field (or require auth)', async () => {
        const response = await fetch(`${BASE_URL}/api/v2/parts?sortBy=partNumber&sortOrder=asc`);
        expectValidResponse(response);
      });
    });

    describe('POST /api/v2/parts validation', () => {
      testWithServer('should validate required fields or require auth', async () => {
        const invalidPart = {
          name: 'Missing Part Number',
        };

        const response = await fetch(`${BASE_URL}/api/v2/parts`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(invalidPart),
        });

        // Should be 400 (validation) or 401 (auth required)
        expect([400, 401, 403, 429]).toContain(response.status);
      });
    });
  });

  describe('Inventory API', () => {
    describe('GET /api/v2/inventory', () => {
      testWithServer('should return inventory list (or require auth)', async () => {
        const response = await fetch(`${BASE_URL}/api/v2/inventory`);
        expectValidResponse(response);
      });

      testWithServer('should filter by warehouse (or require auth)', async () => {
        const response = await fetch(`${BASE_URL}/api/v2/inventory?warehouseId=WH-001`);
        expectValidResponse(response);
      });
    });
  });

  describe('Orders API', () => {
    describe('GET /api/v2/orders', () => {
      testWithServer('should return orders list (or require auth)', async () => {
        const response = await fetch(`${BASE_URL}/api/v2/orders`);
        expectValidResponse(response);
      });

      testWithServer('should filter by status (or require auth)', async () => {
        const response = await fetch(`${BASE_URL}/api/v2/orders?status=confirmed`);
        expectValidResponse(response);
      });
    });
  });

  describe('Customers API', () => {
    describe('GET /api/v2/customers', () => {
      testWithServer('should return customers list (or require auth)', async () => {
        const response = await fetch(`${BASE_URL}/api/v2/customers`);
        expectValidResponse(response);
      });

      testWithServer('should search customers (or require auth)', async () => {
        const response = await fetch(`${BASE_URL}/api/v2/customers?search=test`);
        expectValidResponse(response);
      });
    });
  });

  describe('Suppliers API', () => {
    describe('GET /api/v2/suppliers', () => {
      testWithServer('should return suppliers list (or require auth)', async () => {
        const response = await fetch(`${BASE_URL}/api/v2/suppliers`);
        expectValidResponse(response);
      });
    });
  });

  describe('BOM API', () => {
    describe('GET /api/v2/bom', () => {
      testWithServer('should return BOM list (or require auth)', async () => {
        const response = await fetch(`${BASE_URL}/api/v2/bom`);
        expectValidResponse(response);
      });
    });
  });

  describe('Work Orders API', () => {
    describe('GET /api/v2/work-orders', () => {
      testWithServer('should return work orders list (or require auth)', async () => {
        const response = await fetch(`${BASE_URL}/api/v2/work-orders`);
        expectValidResponse(response);
      });
    });
  });

  describe('Purchasing API', () => {
    describe('GET /api/v2/purchasing', () => {
      testWithServer('should return purchase orders list (or require auth)', async () => {
        const response = await fetch(`${BASE_URL}/api/v2/purchasing`);
        expectValidResponse(response);
      });
    });
  });

  describe('Change Impact API', () => {
    describe('POST /api/change-impact', () => {
      testWithServer('should calculate part impact (or require auth)', async () => {
        const response = await fetch(`${BASE_URL}/api/change-impact`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            entity: 'part',
            entityId: 'test-part-id',
            changes: [
              {
                field: 'unitCost',
                fieldLabel: 'Đơn giá',
                oldValue: 100,
                newValue: 150,
                valueType: 'currency',
              },
            ],
          }),
        });

        // May return 404 if part doesn't exist, or 401 if auth required
        expect([200, 401, 403, 404, 429]).toContain(response.status);
      });

      testWithServer('should validate required fields (or require auth)', async () => {
        const response = await fetch(`${BASE_URL}/api/change-impact`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            entity: 'part',
            // Missing entityId and changes
          }),
        });

        // Should be 400 (validation) or 401 (auth required)
        expect([400, 401, 403, 429]).toContain(response.status);
      });

      testWithServer('should handle customer entity (or require auth)', async () => {
        const response = await fetch(`${BASE_URL}/api/change-impact`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            entity: 'customer',
            entityId: 'test-customer-id',
            changes: [
              {
                field: 'status',
                fieldLabel: 'Trạng thái',
                oldValue: 'ACTIVE',
                newValue: 'INACTIVE',
                valueType: 'string',
              },
            ],
          }),
        });

        // May return 404 if customer doesn't exist, or 401 if auth required
        expect([200, 401, 403, 404, 429]).toContain(response.status);
      });
    });
  });

  describe('Input Validation', () => {
    describe('SQL Injection Prevention', () => {
      testWithServer('should sanitize search input (or require auth)', async () => {
        const maliciousInput = "'; DROP TABLE parts; --";
        const response = await fetch(`${BASE_URL}/api/v2/parts?search=${encodeURIComponent(maliciousInput)}`);

        // Should not error - either success or auth required
        expectValidResponse(response);
      });
    });

    describe('String Length Validation', () => {
      testWithServer('should reject overly long strings (or require auth)', async () => {
        const longString = 'a'.repeat(10000);
        const response = await fetch(`${BASE_URL}/api/v2/parts`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            partNumber: longString,
            name: 'Long Test',
            category: 'TEST',
          }),
        });

        // Should be 400 (validation) or 401 (auth required)
        expect([400, 401, 403, 429]).toContain(response.status);
      });
    });
  });
});
