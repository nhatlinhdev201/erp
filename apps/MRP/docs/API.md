# API Reference | Tài liệu API

> REST API documentation for L-ERP MRP System  
> Tài liệu REST API cho Hệ thống L-ERP MRP

---

## Table of Contents | Mục lục

- [Overview | Tổng quan](#overview--tổng-quan)
- [Authentication | Xác thực](#authentication--xác-thực)
- [Response Format | Định dạng phản hồi](#response-format--định-dạng-phản-hồi)
- [Endpoints | Các endpoint](#endpoints--các-endpoint)
  - [Dashboard](#dashboard)
  - [Parts](#parts--linh-kiện)
  - [Inventory](#inventory--tồn-kho)
  - [Sales Orders](#sales-orders--đơn-hàng)
  - [Production](#production--sản-xuất)
  - [Quality](#quality--chất-lượng)
  - [BOM](#bom--danh-mục-vật-tư)
  - [Analytics](#analytics--phân-tích)
- [Error Codes | Mã lỗi](#error-codes--mã-lỗi)

---

## Overview | Tổng quan

### Base URL

```
Production:  https://api.rtr.vn/v2
Development: http://localhost:3000/api/v2
```

### API Versioning | Phiên bản API

| Version | Status | Description |
|---------|--------|-------------|
| v2 | ✅ Current | Latest stable version / Phiên bản ổn định mới nhất |
| v1 | ⚠️ Deprecated | Legacy support only / Chỉ hỗ trợ legacy |

---

## Authentication | Xác thực

### English

All API requests require authentication using Bearer token in the Authorization header.

### Tiếng Việt

Tất cả các yêu cầu API đều yêu cầu xác thực bằng Bearer token trong header Authorization.

```http
Authorization: Bearer <your-access-token>
```

### Example | Ví dụ

```bash
curl -X GET "https://api.rtr.vn/v2/parts" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -H "Content-Type: application/json"
```

---

## Response Format | Định dạng phản hồi

### Success Response | Phản hồi thành công

```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful"
}
```

### Paginated Response | Phản hồi phân trang

```json
{
  "success": true,
  "data": {
    "items": [ ... ],
    "total": 100,
    "page": 1,
    "pageSize": 20,
    "totalPages": 5
  }
}
```

### Error Response | Phản hồi lỗi

```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": { ... }
}
```

---

## Endpoints | Các endpoint

---

### Dashboard

#### GET /dashboard

Get dashboard overview with KPIs and recent activities.  
Lấy tổng quan dashboard với KPIs và hoạt động gần đây.

**Response | Phản hồi:**

```json
{
  "success": true,
  "data": {
    "kpis": {
      "inventory": {
        "totalParts": 1250,
        "lowStockParts": 23,
        "outOfStockParts": 5,
        "totalValue": 2500000
      },
      "sales": {
        "totalOrders": 156,
        "pendingOrders": 12,
        "monthlyRevenue": 450000,
        "revenueTrend": 8.5
      },
      "production": {
        "activeWorkOrders": 18,
        "completedMTD": 42
      },
      "quality": {
        "openNCRs": 7
      }
    },
    "recentOrders": [ ... ],
    "recentWorkOrders": [ ... ],
    "inventoryByCategory": [ ... ]
  }
}
```

---

### Parts | Linh kiện

#### GET /parts

Get list of parts with filtering and pagination.  
Lấy danh sách linh kiện với lọc và phân trang.

**Query Parameters | Tham số truy vấn:**

| Parameter | Type | Description | Mô tả |
|-----------|------|-------------|-------|
| `page` | number | Page number (default: 1) | Số trang |
| `pageSize` | number | Items per page (default: 20) | Số item mỗi trang |
| `search` | string | Search by part number or name | Tìm theo mã hoặc tên |
| `category` | string | Filter by category | Lọc theo danh mục |
| `status` | string | Filter by status | Lọc theo trạng thái |
| `sortBy` | string | Sort field | Trường sắp xếp |
| `sortOrder` | string | Sort direction (asc/desc) | Hướng sắp xếp |

**Example | Ví dụ:**

```bash
GET /api/v2/parts?page=1&pageSize=20&category=Electronics&search=motor
```

**Response | Phản hồi:**

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "part_001",
        "partNumber": "MTR-U15-II",
        "name": "Motor U15 II KV100",
        "category": "Electronics",
        "subCategory": "Motors",
        "unit": "pcs",
        "onHand": 150,
        "available": 145,
        "minStock": 20,
        "unitCost": 89.99,
        "stockStatus": "IN_STOCK",
        "lifecycleStatus": "ACTIVE"
      }
    ],
    "total": 1250,
    "page": 1,
    "pageSize": 20,
    "totalPages": 63,
    "categories": ["Electronics", "Mechanical", "Hardware"]
  }
}
```

#### GET /parts/:id

Get single part details.  
Lấy chi tiết một linh kiện.

#### POST /parts

Create new part.  
Tạo linh kiện mới.

**Request Body | Body yêu cầu:**

```json
{
  "partNumber": "MTR-U20-III",
  "name": "Motor U20 III KV150",
  "description": "High performance brushless motor",
  "category": "Electronics",
  "subCategory": "Motors",
  "unit": "pcs",
  "minStock": 10,
  "maxStock": 200,
  "reorderPoint": 25,
  "unitCost": 129.99,
  "leadTimeDays": 14,
  "ndaaCompliant": true,
  "rohsCompliant": true
}
```

#### PUT /parts/:id

Update existing part.  
Cập nhật linh kiện.

#### DELETE /parts/:id

Delete part (soft delete).  
Xóa linh kiện (xóa mềm).

---

### Inventory | Tồn kho

#### GET /inventory

Get inventory list with stock levels.  
Lấy danh sách tồn kho với mức tồn.

**Query Parameters | Tham số truy vấn:**

| Parameter | Type | Description | Mô tả |
|-----------|------|-------------|-------|
| `page` | number | Page number | Số trang |
| `pageSize` | number | Items per page | Số item mỗi trang |
| `warehouseId` | string | Filter by warehouse | Lọc theo kho |
| `stockStatus` | string | Filter by stock status | Lọc theo trạng thái tồn |
| `category` | string | Filter by category | Lọc theo danh mục |

**Stock Status Values | Giá trị trạng thái tồn:**

| Value | English | Tiếng Việt |
|-------|---------|------------|
| `IN_STOCK` | In stock | Còn hàng |
| `LOW_STOCK` | Low stock | Tồn thấp |
| `CRITICAL` | Critical | Nguy hiểm |
| `OUT_OF_STOCK` | Out of stock | Hết hàng |
| `OVERSTOCK` | Overstock | Tồn dư |

#### POST /inventory/actions

Perform inventory action (receive, issue, adjust, transfer).  
Thực hiện hành động tồn kho (nhập, xuất, điều chỉnh, chuyển).

**Request Body | Body yêu cầu:**

```json
{
  "action": "receive",
  "partId": "part_001",
  "warehouseId": "wh_001",
  "quantity": 100,
  "reference": "PO-2024-0156",
  "notes": "Received from supplier"
}
```

**Action Types | Loại hành động:**

| Action | English | Tiếng Việt |
|--------|---------|------------|
| `receive` | Receive stock | Nhập kho |
| `issue` | Issue stock | Xuất kho |
| `adjust` | Adjust quantity | Điều chỉnh |
| `transfer` | Transfer between warehouses | Chuyển kho |

---

### Sales Orders | Đơn hàng

#### GET /sales

Get sales orders list.  
Lấy danh sách đơn hàng.

**Query Parameters | Tham số truy vấn:**

| Parameter | Type | Description | Mô tả |
|-----------|------|-------------|-------|
| `page` | number | Page number | Số trang |
| `pageSize` | number | Items per page | Số item mỗi trang |
| `status` | string | Filter by status | Lọc theo trạng thái |
| `customerId` | string | Filter by customer | Lọc theo khách hàng |
| `dateFrom` | string | Filter from date | Lọc từ ngày |
| `dateTo` | string | Filter to date | Lọc đến ngày |

**Status Values | Giá trị trạng thái:**

| Value | English | Tiếng Việt |
|-------|---------|------------|
| `DRAFT` | Draft | Nháp |
| `PENDING` | Pending | Chờ xử lý |
| `CONFIRMED` | Confirmed | Đã xác nhận |
| `IN_PRODUCTION` | In production | Đang sản xuất |
| `READY` | Ready to ship | Sẵn sàng giao |
| `SHIPPED` | Shipped | Đã giao |
| `DELIVERED` | Delivered | Đã nhận |
| `CANCELLED` | Cancelled | Đã hủy |

#### GET /sales/:id

Get single sales order with line items.  
Lấy chi tiết đơn hàng với các dòng sản phẩm.

#### POST /sales

Create new sales order.  
Tạo đơn hàng mới.

**Request Body | Body yêu cầu:**

```json
{
  "customerId": "cust_001",
  "requestedDate": "2024-04-15",
  "priority": "high",
  "notes": "Urgent order",
  "lines": [
    {
      "productId": "prod_001",
      "quantity": 10,
      "unitPrice": 2500.00
    }
  ]
}
```

#### PUT /sales/:id

Update sales order.  
Cập nhật đơn hàng.

#### PUT /sales/:id/status

Update order status.  
Cập nhật trạng thái đơn hàng.

```json
{
  "status": "CONFIRMED",
  "notes": "Approved by manager"
}
```

---

### Production | Sản xuất

#### GET /production

Get work orders list.  
Lấy danh sách lệnh sản xuất.

**Query Parameters | Tham số truy vấn:**

| Parameter | Type | Description | Mô tả |
|-----------|------|-------------|-------|
| `page` | number | Page number | Số trang |
| `pageSize` | number | Items per page | Số item mỗi trang |
| `status` | string | Filter by status | Lọc theo trạng thái |
| `priority` | string | Filter by priority | Lọc theo độ ưu tiên |

**Status Values | Giá trị trạng thái:**

| Value | English | Tiếng Việt |
|-------|---------|------------|
| `DRAFT` | Draft | Nháp |
| `PLANNED` | Planned | Đã lên kế hoạch |
| `RELEASED` | Released | Đã phát hành |
| `IN_PROGRESS` | In progress | Đang thực hiện |
| `COMPLETED` | Completed | Hoàn thành |
| `CANCELLED` | Cancelled | Đã hủy |

#### GET /production/:id

Get work order details with operations and materials.  
Lấy chi tiết lệnh sản xuất với công đoạn và vật tư.

#### POST /production

Create new work order.  
Tạo lệnh sản xuất mới.

**Request Body | Body yêu cầu:**

```json
{
  "productId": "prod_001",
  "quantity": 50,
  "startDate": "2024-04-01",
  "dueDate": "2024-04-15",
  "priority": "normal",
  "salesOrderId": "so_001"
}
```

#### PUT /production/:id/progress

Update work order progress.  
Cập nhật tiến độ lệnh sản xuất.

```json
{
  "completedQty": 25,
  "scrapQty": 2,
  "notes": "First batch completed"
}
```

---

### Quality | Chất lượng

#### GET /quality

Get NCR (Non-Conformance Report) list.  
Lấy danh sách NCR (Báo cáo Không phù hợp).

**Query Parameters | Tham số truy vấn:**

| Parameter | Type | Description | Mô tả |
|-----------|------|-------------|-------|
| `page` | number | Page number | Số trang |
| `pageSize` | number | Items per page | Số item mỗi trang |
| `status` | string | Filter by status | Lọc theo trạng thái |
| `severity` | string | Filter by severity | Lọc theo mức độ |
| `type` | string | Filter by type | Lọc theo loại |

**Severity Values | Giá trị mức độ:**

| Value | English | Tiếng Việt |
|-------|---------|------------|
| `minor` | Minor | Nhẹ |
| `major` | Major | Nghiêm trọng |
| `critical` | Critical | Nguy hiểm |

#### POST /quality

Create new NCR.  
Tạo NCR mới.

**Request Body | Body yêu cầu:**

```json
{
  "partId": "part_001",
  "workOrderId": "wo_001",
  "description": "Surface defect found during inspection",
  "type": "In-Process",
  "source": "production",
  "quantityAffected": 5,
  "severity": "minor",
  "rootCause": "Tool wear"
}
```

---

### BOM | Danh mục Vật tư

#### GET /bom

Get list of products with BOM.  
Lấy danh sách sản phẩm có BOM.

#### GET /bom/:productId

Get BOM tree for a product.  
Lấy cây BOM cho một sản phẩm.

**Response | Phản hồi:**

```json
{
  "success": true,
  "data": {
    "product": {
      "id": "prod_001",
      "sku": "DRONE-X1",
      "name": "Product X1 Professional"
    },
    "lines": [
      {
        "id": "bom_001",
        "findNumber": 1,
        "partId": "part_001",
        "partNumber": "FRM-001",
        "partName": "Main Frame Assembly",
        "quantity": 1,
        "unit": "pcs",
        "children": [
          {
            "id": "bom_002",
            "findNumber": 1.1,
            "partId": "part_002",
            "partNumber": "ARM-001",
            "partName": "Carbon Fiber Arm",
            "quantity": 4,
            "unit": "pcs"
          }
        ]
      }
    ],
    "summary": {
      "totalLines": 45,
      "totalCost": 1250.00,
      "maxDepth": 3
    }
  }
}
```

#### POST /bom

Add BOM line.  
Thêm dòng BOM.

```json
{
  "productId": "prod_001",
  "partId": "part_003",
  "parentId": "bom_001",
  "quantity": 2,
  "findNumber": 1.2,
  "scrapPercent": 5
}
```

#### PUT /bom/:id

Update BOM line.  
Cập nhật dòng BOM.

#### DELETE /bom/:id

Delete BOM line.  
Xóa dòng BOM.

---

### Analytics | Phân tích

#### GET /analytics

Get analytics data based on tab and period.  
Lấy dữ liệu phân tích theo tab và khoảng thời gian.

**Query Parameters | Tham số truy vấn:**

| Parameter | Type | Description | Mô tả |
|-----------|------|-------------|-------|
| `tab` | string | Analytics tab | Tab phân tích |
| `period` | number | Period in days | Khoảng thời gian (ngày) |

**Tab Values | Giá trị tab:**

| Value | English | Tiếng Việt |
|-------|---------|------------|
| `overview` | Overview | Tổng quan |
| `inventory` | Inventory | Tồn kho |
| `sales` | Sales | Doanh số |
| `production` | Production | Sản xuất |
| `quality` | Quality | Chất lượng |

---

## Error Codes | Mã lỗi

| Code | HTTP | English | Tiếng Việt |
|------|------|---------|------------|
| `VALIDATION_ERROR` | 400 | Invalid input data | Dữ liệu đầu vào không hợp lệ |
| `AUTHENTICATION_ERROR` | 401 | Authentication required | Yêu cầu xác thực |
| `AUTHORIZATION_ERROR` | 403 | Permission denied | Không có quyền truy cập |
| `NOT_FOUND` | 404 | Resource not found | Không tìm thấy tài nguyên |
| `CONFLICT` | 409 | Resource already exists | Tài nguyên đã tồn tại |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests | Quá nhiều yêu cầu |
| `INTERNAL_ERROR` | 500 | Internal server error | Lỗi máy chủ |

---

## Rate Limits | Giới hạn tốc độ

| Endpoint Type | Limit | Window |
|---------------|-------|--------|
| Read (GET) | 1000 requests | 1 minute |
| Write (POST/PUT/DELETE) | 100 requests | 1 minute |
| Bulk operations | 10 requests | 1 minute |

---

## Webhooks | Webhook

### Available Events | Các sự kiện có sẵn

| Event | Description | Mô tả |
|-------|-------------|-------|
| `order.created` | New order created | Đơn hàng mới được tạo |
| `order.status_changed` | Order status changed | Trạng thái đơn hàng thay đổi |
| `inventory.low_stock` | Stock below threshold | Tồn kho dưới ngưỡng |
| `production.completed` | Work order completed | Lệnh sản xuất hoàn thành |
| `quality.ncr_created` | New NCR created | NCR mới được tạo |

### Webhook Payload | Payload Webhook

```json
{
  "event": "order.created",
  "timestamp": "2024-03-15T10:30:00Z",
  "data": {
    "id": "so_001",
    "soNumber": "SO-2024-0156"
  }
}
```

---

<p align="center">
  <em>Last updated: March 2024 | Cập nhật lần cuối: Tháng 3/2024</em>
</p>
