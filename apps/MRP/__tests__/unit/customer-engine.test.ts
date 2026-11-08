// =============================================================================
// CUSTOMER PORTAL ENGINE UNIT TESTS
// L-ERP MRP Test Suite
// =============================================================================

import { CustomerPortalEngine } from '@/lib/customer/customer-engine';

describe('CustomerPortalEngine', () => {
  // ===========================================================================
  // STATUS FUNCTIONS
  // ===========================================================================

  describe('Status Functions', () => {
    describe('getSOStatusColor', () => {
      it('should return correct color for all SO statuses', () => {
        const statuses = [
          'DRAFT', 'PENDING', 'CONFIRMED', 'IN_PRODUCTION',
          'READY', 'SHIPPED', 'DELIVERED', 'COMPLETED', 'CANCELLED'
        ] as const;

        statuses.forEach(status => {
          const color = CustomerPortalEngine.getSOStatusColor(status);
          expect(color).toBeDefined();
          expect(color.length).toBeGreaterThan(0);
          expect(color).toContain('bg-');
          expect(color).toContain('text-');
        });
      });

      it('should return specific colors for key statuses', () => {
        expect(CustomerPortalEngine.getSOStatusColor('PENDING')).toContain('yellow');
        expect(CustomerPortalEngine.getSOStatusColor('COMPLETED')).toContain('emerald');
        expect(CustomerPortalEngine.getSOStatusColor('CANCELLED')).toContain('red');
      });
    });

    describe('getSOStatusLabel', () => {
      it('should return Vietnamese labels for all statuses', () => {
        expect(CustomerPortalEngine.getSOStatusLabel('DRAFT')).toBe('Nháp');
        expect(CustomerPortalEngine.getSOStatusLabel('PENDING')).toBe('Chờ xác nhận');
        expect(CustomerPortalEngine.getSOStatusLabel('CONFIRMED')).toBe('Đã xác nhận');
        expect(CustomerPortalEngine.getSOStatusLabel('IN_PRODUCTION')).toBe('Đang sản xuất');
        expect(CustomerPortalEngine.getSOStatusLabel('READY')).toBe('Sẵn sàng giao');
        expect(CustomerPortalEngine.getSOStatusLabel('SHIPPED')).toBe('Đã gửi');
        expect(CustomerPortalEngine.getSOStatusLabel('DELIVERED')).toBe('Đã giao');
        expect(CustomerPortalEngine.getSOStatusLabel('COMPLETED')).toBe('Hoàn tất');
        expect(CustomerPortalEngine.getSOStatusLabel('CANCELLED')).toBe('Đã hủy');
      });
    });

    describe('getDeliveryStatusColor', () => {
      it('should return correct colors for delivery statuses', () => {
        expect(CustomerPortalEngine.getDeliveryStatusColor('PREPARING')).toContain('yellow');
        expect(CustomerPortalEngine.getDeliveryStatusColor('READY')).toContain('cyan');
        expect(CustomerPortalEngine.getDeliveryStatusColor('SHIPPED')).toContain('blue');
        expect(CustomerPortalEngine.getDeliveryStatusColor('IN_TRANSIT')).toContain('purple');
        expect(CustomerPortalEngine.getDeliveryStatusColor('DELIVERED')).toContain('green');
        expect(CustomerPortalEngine.getDeliveryStatusColor('RETURNED')).toContain('red');
      });
    });

    describe('getDeliveryStatusLabel', () => {
      it('should return Vietnamese labels for delivery statuses', () => {
        expect(CustomerPortalEngine.getDeliveryStatusLabel('PREPARING')).toBe('Đang chuẩn bị');
        expect(CustomerPortalEngine.getDeliveryStatusLabel('IN_TRANSIT')).toBe('Đang vận chuyển');
        expect(CustomerPortalEngine.getDeliveryStatusLabel('DELIVERED')).toBe('Đã giao');
      });
    });

    describe('getInvoiceStatusColor', () => {
      it('should return correct colors for invoice statuses', () => {
        expect(CustomerPortalEngine.getInvoiceStatusColor('PAID')).toContain('green');
        expect(CustomerPortalEngine.getInvoiceStatusColor('OVERDUE')).toContain('red');
        expect(CustomerPortalEngine.getInvoiceStatusColor('SENT')).toContain('blue');
      });
    });

    describe('getInvoiceStatusLabel', () => {
      it('should return Vietnamese labels for invoice statuses', () => {
        expect(CustomerPortalEngine.getInvoiceStatusLabel('DRAFT')).toBe('Nháp');
        expect(CustomerPortalEngine.getInvoiceStatusLabel('PAID')).toBe('Đã thanh toán');
        expect(CustomerPortalEngine.getInvoiceStatusLabel('OVERDUE')).toBe('Quá hạn');
      });
    });

    describe('getTicketStatusColor', () => {
      it('should return correct colors for ticket statuses', () => {
        expect(CustomerPortalEngine.getTicketStatusColor('OPEN')).toContain('blue');
        expect(CustomerPortalEngine.getTicketStatusColor('IN_PROGRESS')).toContain('yellow');
        expect(CustomerPortalEngine.getTicketStatusColor('RESOLVED')).toContain('green');
        expect(CustomerPortalEngine.getTicketStatusColor('CLOSED')).toContain('gray');
      });
    });

    describe('getTicketCategoryLabel', () => {
      it('should return Vietnamese labels for ticket categories', () => {
        expect(CustomerPortalEngine.getTicketCategoryLabel('ORDER')).toBe('Đơn hàng');
        expect(CustomerPortalEngine.getTicketCategoryLabel('DELIVERY')).toBe('Giao hàng');
        expect(CustomerPortalEngine.getTicketCategoryLabel('QUALITY')).toBe('Chất lượng');
        expect(CustomerPortalEngine.getTicketCategoryLabel('INVOICE')).toBe('Hóa đơn');
        expect(CustomerPortalEngine.getTicketCategoryLabel('GENERAL')).toBe('Khác');
      });
    });

    describe('getTierColor', () => {
      it('should return correct colors for customer tiers', () => {
        expect(CustomerPortalEngine.getTierColor('STANDARD')).toContain('gray');
        expect(CustomerPortalEngine.getTierColor('SILVER')).toContain('slate');
        expect(CustomerPortalEngine.getTierColor('GOLD')).toContain('yellow');
        expect(CustomerPortalEngine.getTierColor('PLATINUM')).toContain('purple');
      });
    });

    describe('getPriorityColor', () => {
      it('should return correct colors for priorities', () => {
        expect(CustomerPortalEngine.getPriorityColor('LOW')).toContain('gray');
        expect(CustomerPortalEngine.getPriorityColor('NORMAL')).toContain('blue');
        expect(CustomerPortalEngine.getPriorityColor('MEDIUM')).toContain('yellow');
        expect(CustomerPortalEngine.getPriorityColor('HIGH')).toContain('orange');
        expect(CustomerPortalEngine.getPriorityColor('URGENT')).toContain('red');
      });
    });
  });

  // ===========================================================================
  // CURRENCY FORMATTING
  // ===========================================================================

  describe('formatCurrency', () => {
    it('should format VND with billions', () => {
      const result = CustomerPortalEngine.formatCurrency(1500000000);
      expect(result).toBe('1.5 tỷ');
    });

    it('should format VND with millions', () => {
      const result = CustomerPortalEngine.formatCurrency(25000000);
      expect(result).toBe('25 tr');
    });

    it('should format VND with locale', () => {
      const result = CustomerPortalEngine.formatCurrency(500000);
      expect(result).toContain('₫');
    });

    it('should format USD correctly', () => {
      const result = CustomerPortalEngine.formatCurrency(1500, 'USD');
      expect(result).toContain('$');
      expect(result).toContain('1,500');
    });

    it('should handle zero', () => {
      const result = CustomerPortalEngine.formatCurrency(0);
      expect(result).toContain('0');
    });

    it('should handle large numbers', () => {
      const result = CustomerPortalEngine.formatCurrency(10000000000); // 10 billion
      expect(result).toBe('10 tỷ');
    });
  });

  // ===========================================================================
  // DATE CALCULATIONS
  // ===========================================================================

  describe('getDaysUntilDue', () => {
    it('should return OVERDUE for past dates', () => {
      const pastDate = new Date(Date.now() - 5 * 86400000).toISOString();
      const result = CustomerPortalEngine.getDaysUntilDue(pastDate);
      
      expect(result.status).toBe('OVERDUE');
      expect(result.days).toBeLessThan(0);
    });

    it('should return DUE_SOON for dates within 7 days', () => {
      const soonDate = new Date(Date.now() + 3 * 86400000).toISOString();
      const result = CustomerPortalEngine.getDaysUntilDue(soonDate);
      
      expect(result.status).toBe('DUE_SOON');
      expect(result.days).toBeGreaterThan(0);
      expect(result.days).toBeLessThanOrEqual(7);
    });

    it('should return OK for dates more than 7 days away', () => {
      const futureDate = new Date(Date.now() + 15 * 86400000).toISOString();
      const result = CustomerPortalEngine.getDaysUntilDue(futureDate);
      
      expect(result.status).toBe('OK');
      expect(result.days).toBeGreaterThan(7);
    });

    it('should handle edge case of exactly 7 days', () => {
      const exactlySevenDays = new Date(Date.now() + 7 * 86400000).toISOString();
      const result = CustomerPortalEngine.getDaysUntilDue(exactlySevenDays);
      
      expect(result.status).toBe('DUE_SOON');
    });
  });

  // ===========================================================================
  // ORDER CALCULATIONS
  // ===========================================================================

  describe('calculateOrderProgress', () => {
    it('should calculate correct progress percentage', () => {
      const items = [
        { quantity: 100, producedQty: 50 },
        { quantity: 200, producedQty: 200 },
      ] as any[];
      
      const progress = CustomerPortalEngine.calculateOrderProgress(items);
      
      expect(progress).toBe(83); // (50 + 200) / (100 + 200) * 100 = 83.33
    });

    it('should return 0 for empty items', () => {
      const progress = CustomerPortalEngine.calculateOrderProgress([]);
      expect(progress).toBe(0);
    });

    it('should return 0 for zero total quantity', () => {
      const items = [
        { quantity: 0, producedQty: 0 },
      ] as any[];
      
      const progress = CustomerPortalEngine.calculateOrderProgress(items);
      expect(progress).toBe(0);
    });

    it('should return 100 for fully produced orders', () => {
      const items = [
        { quantity: 100, producedQty: 100 },
        { quantity: 50, producedQty: 50 },
      ] as any[];
      
      const progress = CustomerPortalEngine.calculateOrderProgress(items);
      expect(progress).toBe(100);
    });

    it('should handle overproduction', () => {
      const items = [
        { quantity: 100, producedQty: 150 },
      ] as any[];
      
      const progress = CustomerPortalEngine.calculateOrderProgress(items);
      expect(progress).toBe(150);
    });
  });

  describe('getOrderStep', () => {
    it('should return correct step numbers for all statuses', () => {
      expect(CustomerPortalEngine.getOrderStep('DRAFT')).toBe(0);
      expect(CustomerPortalEngine.getOrderStep('PENDING')).toBe(1);
      expect(CustomerPortalEngine.getOrderStep('CONFIRMED')).toBe(2);
      expect(CustomerPortalEngine.getOrderStep('IN_PRODUCTION')).toBe(3);
      expect(CustomerPortalEngine.getOrderStep('READY')).toBe(4);
      expect(CustomerPortalEngine.getOrderStep('SHIPPED')).toBe(5);
      expect(CustomerPortalEngine.getOrderStep('DELIVERED')).toBe(6);
      expect(CustomerPortalEngine.getOrderStep('COMPLETED')).toBe(7);
      expect(CustomerPortalEngine.getOrderStep('CANCELLED')).toBe(-1);
    });

    it('should return incremental steps for normal flow', () => {
      const statuses = ['DRAFT', 'PENDING', 'CONFIRMED', 'IN_PRODUCTION', 'READY', 'SHIPPED', 'DELIVERED', 'COMPLETED'] as const;
      
      for (let i = 1; i < statuses.length; i++) {
        const currentStep = CustomerPortalEngine.getOrderStep(statuses[i]);
        const prevStep = CustomerPortalEngine.getOrderStep(statuses[i - 1]);
        expect(currentStep).toBeGreaterThan(prevStep);
      }
    });
  });
});
