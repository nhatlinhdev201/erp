# MRP API Reference

**Tham chiếu API quản lý sản xuất / MRP API Reference**

Complete API reference for the L-ERP Manufacturing Resource Planning module.

## Base URL / URL cơ sở

```
Development:  http://localhost:8000/api/v1/mrp
Production:   https://api.lerp.vn/api/v1/mrp
```

Direct module:
```
Development:  http://localhost:3003/api/v1
```

## Authentication / Xác thực

All endpoints require authentication:

```bash
Authorization: Bearer <token>
X-Tenant-ID: <tenant-id>
```

Required permissions:
- `read:mrp` - View manufacturing data
- `write:mrp` - Create/edit records
- `manage:inventory` - Inventory operations
- `approve:production` - Approve production orders

## Bill of Materials (BOM) / Hóa đơn vật liệu

### Create BOM / Tạo hóa đơn vật liệu

```bash
POST /mrp/boms
```

**Request:**

```json
{
  "productId": "prd-laptop-123",
  "name": "Laptop Pro 15 - Standard Configuration",
  "code": "BOM-LAPTOP-001",
  "version": "1.0",
  "description": "BOM for laptop assembly",
  "lines": [
    {
      "componentCode": "CPU-INTEL-I7",
      "componentName": "Intel Core i7 Processor",
      "quantity": 1,
      "unit": "piece",
      "wastePercentage": 0,
      "leadTime": 5
    },
    {
      "componentCode": "RAM-16GB",
      "componentName": "RAM 16GB DDR4",
      "quantity": 2,
      "unit": "piece",
      "wastePercentage": 2,
      "leadTime": 3
    },
    {
      "componentCode": "SSD-512GB",
      "componentName": "SSD 512GB NVMe",
      "quantity": 1,
      "unit": "piece",
      "wastePercentage": 1,
      "leadTime": 3
    }
  ],
  "isActive": true,
  "effectiveDate": "2026-01-01"
}
```

**Response (201):**

```json
{
  "data": {
    "id": "bom-123",
    "productId": "prd-laptop-123",
    "code": "BOM-LAPTOP-001",
    "version": "1.0",
    "status": "active",
    "lines": [
      {
        "id": "bom-line-1",
        "componentCode": "CPU-INTEL-I7",
        "quantity": 1,
        "leadTime": 5
      }
    ],
    "createdAt": "2026-03-29T10:00:00Z"
  }
}
```

### List BOMs / Liệt kê hóa đơn vật liệu

```bash
GET /mrp/boms
```

**Parameters:**
- `productId` - Filter by product
- `status` - active, inactive, obsolete
- `search` - Search by code or name
- `page`, `limit` - Pagination

### Get BOM / Lấy hóa đơn vật liệu

```bash
GET /mrp/boms/{bomId}
```

### Update BOM / Cập nhật hóa đơn vật liệu

```bash
PUT /mrp/boms/{bomId}
```

### Create BOM Version / Tạo phiên bản BOM

```bash
POST /mrp/boms/{bomId}/versions
```

**Request:**

```json
{
  "version": "2.0",
  "description": "Updated BOM with new components",
  "lines": [
    {
      "componentCode": "CPU-INTEL-I9",
      "componentName": "Intel Core i9 Processor",
      "quantity": 1,
      "unit": "piece"
    }
  ],
  "effectiveDate": "2026-04-01"
}
```

## Inventory / Hàng tồn kho

### Get Stock Balance / Lấy số dư hàng tồn kho

```bash
GET /mrp/inventory/stock/{productCode}
```

**Response:**

```json
{
  "data": {
    "productCode": "CPU-INTEL-I7",
    "productName": "Intel Core i7 Processor",
    "warehouseId": "wh-1",
    "warehouseName": "Main Warehouse",
    "currentStock": 500,
    "reservedStock": 150,
    "availableStock": 350,
    "minimumStock": 100,
    "maximumStock": 1000,
    "reorderPoint": 200,
    "lastUpdate": "2026-03-29T15:00:00Z"
  }
}
```

### List Stock by Warehouse / Liệt kê hàng tồn kho theo kho

```bash
GET /mrp/inventory/stock
```

**Parameters:**
- `warehouseId` - Filter by warehouse
- `productCode` - Search by product code
- `lowStock` - true/false - Show only low stock items
- `category` - Filter by category
- `page`, `limit` - Pagination

### Transfer Stock / Chuyển hàng tồn kho

```bash
POST /mrp/inventory/transfers
```

**Request:**

```json
{
  "fromWarehouseId": "wh-1",
  "toWarehouseId": "wh-2",
  "lines": [
    {
      "productCode": "CPU-INTEL-I7",
      "quantity": 100
    }
  ],
  "reason": "Stock balancing",
  "transferDate": "2026-03-29"
}
```

### Adjust Stock / Điều chỉnh hàng tồn kho

```bash
POST /mrp/inventory/adjustments
```

**Request:**

```json
{
  "warehouseId": "wh-1",
  "adjustmentDate": "2026-03-29",
  "lines": [
    {
      "productCode": "CPU-INTEL-I7",
      "currentQuantity": 500,
      "adjustedQuantity": 480,
      "reason": "Physical count discrepancy"
    }
  ]
}
```

## Production Orders / Đơn đặt hàng sản xuất

### Create Production Order / Tạo đơn đặt hàng sản xuất

```bash
POST /mrp/production-orders
```

**Request:**

```json
{
  "productCode": "LAPTOP-PRO-15",
  "productName": "Laptop Pro 15",
  "quantity": 100,
  "unit": "piece",
  "bomId": "bom-123",
  "dueDate": "2026-04-30",
  "priority": "high",
  "productionLine": "line-1",
  "startDate": "2026-04-01",
  "notes": "Urgent order for customer XYZ",
  "customAttributes": {
    "color": "Silver",
    "storage": "512GB"
  }
}
```

**Response (201):**

```json
{
  "data": {
    "id": "po-789",
    "orderNumber": "PO-2026-001",
    "productCode": "LAPTOP-PRO-15",
    "quantity": 100,
    "status": "pending",
    "dueDate": "2026-04-30",
    "createdAt": "2026-03-29T10:00:00Z",
    "componentRequirements": [
      {
        "componentCode": "CPU-INTEL-I7",
        "requiredQuantity": 100,
        "availableQuantity": 350,
        "shortfall": 0
      }
    ]
  }
}
```

### List Production Orders / Liệt kê đơn đặt hàng sản xuất

```bash
GET /mrp/production-orders
```

**Parameters:**
- `status` - pending, scheduled, in_progress, completed, cancelled
- `priority` - low, medium, high, urgent
- `dateFrom`, `dateTo` - Date range
- `search` - Search by order number
- `page`, `limit` - Pagination

### Get Production Order / Lấy đơn đặt hàng sản xuất

```bash
GET /mrp/production-orders/{orderId}
```

**Response:**

```json
{
  "data": {
    "id": "po-789",
    "orderNumber": "PO-2026-001",
    "status": "in_progress",
    "productCode": "LAPTOP-PRO-15",
    "quantity": 100,
    "dueDate": "2026-04-30",
    "schedule": {
      "startDate": "2026-04-01",
      "endDate": "2026-04-28"
    },
    "progress": {
      "plannedQuantity": 100,
      "completedQuantity": 35,
      "progressPercentage": 35,
      "actualCost": 3500000000,
      "budgetedCost": 10000000000
    },
    "operations": [
      {
        "sequenceNumber": 1,
        "operation": "Assembly",
        "workCenter": "Assembly Line 1",
        "planHours": 20,
        "actualHours": 8,
        "status": "in_progress"
      }
    ]
  }
}
```

### Approve Production Order / Phê duyệt đơn đặt hàng sản xuất

```bash
POST /mrp/production-orders/{orderId}/approve
```

**Request:**

```json
{
  "comments": "Approved for production",
  "scheduledStartDate": "2026-04-02"
}
```

### Complete Production Order / Hoàn thành đơn đặt hàng sản xuất

```bash
POST /mrp/production-orders/{orderId}/complete
```

**Request:**

```json
{
  "actualQuantityProduced": 100,
  "defectiveQuantity": 0,
  "completionDate": "2026-04-28"
}
```

## Quality Control / Kiểm soát chất lượng

### Create Inspection Plan / Tạo kế hoạch kiểm tra

```bash
POST /mrp/quality-control/inspection-plans
```

**Request:**

```json
{
  "productionOrderId": "po-789",
  "inspectionType": "incoming",
  "inspectionDate": "2026-04-02",
  "inspector": "user-qc-123",
  "samplingSize": 10,
  "samplingPercentage": 10,
  "acceptanceCriteria": [
    {
      "characteristic": "Dimension Length",
      "lowerLimit": 354,
      "upperLimit": 356,
      "unit": "mm"
    },
    {
      "characteristic": "Screen Resolution",
      "expectedValue": "1920x1080",
      "tolerance": "±1%"
    }
  ]
}
```

### Record Inspection Results / Ghi nhận kết quả kiểm tra

```bash
POST /mrp/quality-control/inspection-results
```

**Request:**

```json
{
  "inspectionPlanId": "ip-123",
  "inspectionDate": "2026-04-02",
  "inspectionResults": [
    {
      "sampleNumber": 1,
      "measurements": {
        "dimension_length": 355,
        "screen_resolution": "1920x1080"
      },
      "status": "pass"
    }
  ],
  "overallStatus": "pass",
  "numberOfDefects": 0,
  "notes": "All samples passed inspection"
}
```

### Report Quality Issue / Báo cáo vấn đề chất lượng

```bash
POST /mrp/quality-control/issues
```

**Request:**

```json
{
  "productionOrderId": "po-789",
  "issueType": "defect",
  "severity": "critical",
  "description": "Screen flickering detected on 5 units",
  "defectiveQuantity": 5,
  "rootCause": "Faulty LCD supplier",
  "correctionAction": "Return units to supplier, source from backup supplier"
}
```

## Demand Planning / Kế hoạch nhu cầu

### Get Demand Forecast / Lấy dự báo nhu cầu

```bash
GET /mrp/demand-planning/forecast
```

**Parameters:**
- `forecastPeriod` - 2026-04, 2026-Q2
- `productCode` - Filter by product
- `scenario` - base_case, pessimistic, optimistic

**Response:**

```json
{
  "data": [
    {
      "period": "2026-04",
      "productCode": "LAPTOP-PRO-15",
      "demand": 500,
      "upperBound": 600,
      "lowerBound": 400,
      "confidenceLevel": 95
    }
  ]
}
```

### Create Production Plan / Tạo kế hoạch sản xuất

```bash
POST /mrp/demand-planning/production-plans
```

**Request:**

```json
{
  "planPeriod": "2026-04",
  "planningHorizon": 3,
  "demandForecast": [
    {
      "productCode": "LAPTOP-PRO-15",
      "demand": 500
    }
  ]
}
```

**Response (201):**

```json
{
  "data": {
    "id": "plan-456",
    "planPeriod": "2026-04",
    "status": "draft",
    "productionOrders": [
      {
        "productCode": "LAPTOP-PRO-15",
        "plannedQuantity": 500,
        "scheduledStartDate": "2026-03-20",
        "scheduledEndDate": "2026-04-20"
      }
    ]
  }
}
```

## Supplier Management / Quản lý nhà cung cấp

### Create Supplier / Tạo nhà cung cấp

```bash
POST /mrp/suppliers
```

**Request:**

```json
{
  "supplierCode": "SUP-001",
  "name": "Intel Vietnam",
  "country": "Vietnam",
  "city": "Hà Nội",
  "email": "contact@intel-vn.com",
  "phone": "+84289999999",
  "leadTime": 5,
  "minimumOrderQuantity": 100,
  "paymentTerms": "30 days",
  "rating": 5,
  "isActive": true,
  "certifications": ["ISO 9001", "ISO 14001"],
  "supplyCategories": ["Processors", "Semiconductors"]
}
```

### List Suppliers / Liệt kê nhà cung cấp

```bash
GET /mrp/suppliers
```

**Parameters:**
- `supplyCategory` - Filter by category
- `rating` - Filter by rating (1-5)
- `isActive` - true/false
- `search` - Search by name or code
- `page`, `limit` - Pagination

## Purchase Orders / Đơn đặt mua

### Create Purchase Order / Tạo đơn đặt mua

```bash
POST /mrp/purchase-orders
```

**Request:**

```json
{
  "supplierId": "sup-123",
  "poNumber": "PO-SUP-2026-001",
  "poDate": "2026-03-29",
  "requiredDate": "2026-04-10",
  "lines": [
    {
      "componentCode": "CPU-INTEL-I7",
      "quantity": 500,
      "unitPrice": 5000000,
      "unit": "piece",
      "description": "Intel Core i7 Processor"
    }
  ],
  "totalAmount": 2500000000,
  "notes": "Please send ASN before delivery"
}
```

### Track Shipment / Theo dõi lô hàng

```bash
POST /mrp/purchase-orders/{poId}/track-shipment
```

**Request:**

```json
{
  "asnNumber": "ASN-123",
  "shipmentDate": "2026-04-05",
  "expectedDeliveryDate": "2026-04-10",
  "trackingNumber": "TRACK-123",
  "carrier": "DHL"
}
```

## Error Codes / Mã lỗi

| Code | HTTP | Description |
|------|------|-------------|
| `BOM_NOT_FOUND` | 404 | BOM doesn't exist |
| `INSUFFICIENT_STOCK` | 422 | Not enough stock to produce |
| `PRODUCTION_ORDER_NOT_FOUND` | 404 | Order doesn't exist |
| `INVALID_STATUS_TRANSITION` | 422 | Cannot transition to requested status |
| `QUALITY_INSPECTION_FAILED` | 422 | Quality inspection did not pass |
| `SUPPLIER_NOT_FOUND` | 404 | Supplier doesn't exist |
| `LEAD_TIME_EXCEEDED` | 422 | Cannot meet delivery due to lead time |

## Integration with Accounting / Tích hợp với kế toán

Production activities create accounting entries:

**On Production Order Completion:**
- Debit: Work in Progress Inventory (154)
- Credit: Materials Consumed (632)

**On Receiving Materials:**
- Debit: Raw Materials (151)
- Credit: Accounts Payable (312)

**On Cost Allocation:**
- Debit: Work in Progress (154)
- Credit: Manufacturing Overhead (627)

## Next Steps / Bước tiếp theo

- Review [MRP Development Guide](../guides/module-development.md)
- Explore [Testing Guide](../guides/testing.md)
- Check [API Overview](./README.md) for patterns
