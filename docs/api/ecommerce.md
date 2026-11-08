# E-commerce API Reference

**Tham chiếu API thương mại điện tử / E-commerce API Reference**

Complete API reference for the L-ERP E-commerce module supporting B2B and B2C sales.

## Base URL / URL cơ sở

```
Development:  http://localhost:8000/api/v1/ecommerce
Production:   https://api.lerp.vn/api/v1/ecommerce
```

Direct module:
```
Development:  http://localhost:3008/api/v1
```

## Authentication / Xác thực

All endpoints require authentication:

```bash
Authorization: Bearer <token>
X-Tenant-ID: <tenant-id>
```

## Products / Sản phẩm

### Create Product / Tạo sản phẩm

```bash
POST /ecommerce/products
```

**Request:**

```json
{
  "sku": "PRD-001",
  "name": "Laptop Pro 15",
  "description": "High-performance laptop for professionals",
  "category": "electronics",
  "price": 25000000,
  "cost": 15000000,
  "tax": 2500000,
  "quantity": 50,
  "isActive": true,
  "images": [
    {
      "url": "s3://bucket/laptop-1.jpg",
      "alt": "Front view",
      "isPrimary": true
    }
  ],
  "attributes": {
    "brand": "Dell",
    "color": "Silver",
    "storage": "512GB SSD"
  },
  "metaData": {
    "title": "Laptop Pro 15 | L-ERP",
    "description": "Buy Laptop Pro 15 online"
  }
}
```

**Response (201):**

```json
{
  "data": {
    "id": "prd-123",
    "sku": "PRD-001",
    "name": "Laptop Pro 15",
    "price": 25000000,
    "currency": "VND",
    "images": [{ "url": "s3://...", "isPrimary": true }],
    "inStock": true,
    "quantity": 50,
    "createdAt": "2026-03-29T10:00:00Z"
  }
}
```

### List Products / Liệt kê sản phẩm

```bash
GET /ecommerce/products
```

**Parameters:**
- `category` - Filter by category
- `priceMin`, `priceMax` - Filter by price range
- `inStock` - true/false
- `search` - Search by name or SKU
- `sort` - price, popularity, newest
- `page`, `limit` - Pagination

**Example:**

```bash
curl "http://localhost:8000/api/v1/ecommerce/products?category=electronics&inStock=true&sort=price"
```

### Get Product / Lấy sản phẩm

```bash
GET /ecommerce/products/{productId}
```

### Update Product / Cập nhật sản phẩm

```bash
PUT /ecommerce/products/{productId}
```

## Shopping Cart / Giỏ hàng

### Create Cart / Tạo giỏ hàng

```bash
POST /ecommerce/carts
```

**Response:**

```json
{
  "data": {
    "cartId": "cart-abc123",
    "items": [],
    "subtotal": 0,
    "tax": 0,
    "total": 0,
    "expiresAt": "2026-04-05T10:00:00Z"
  }
}
```

### Add to Cart / Thêm vào giỏ hàng

```bash
POST /ecommerce/carts/{cartId}/items
```

**Request:**

```json
{
  "productId": "prd-123",
  "quantity": 2,
  "selectedVariants": {
    "color": "Silver",
    "storage": "512GB"
  }
}
```

### Get Cart / Lấy giỏ hàng

```bash
GET /ecommerce/carts/{cartId}
```

**Response:**

```json
{
  "data": {
    "cartId": "cart-abc123",
    "items": [
      {
        "id": "item-1",
        "productId": "prd-123",
        "productName": "Laptop Pro 15",
        "quantity": 2,
        "unitPrice": 25000000,
        "tax": 5000000,
        "subtotal": 50000000,
        "total": 55000000
      }
    ],
    "subtotal": 50000000,
    "tax": 5000000,
    "shipping": 500000,
    "discount": 0,
    "total": 55500000
  }
}
```

### Update Cart Item / Cập nhật mục trong giỏ hàng

```bash
PUT /ecommerce/carts/{cartId}/items/{itemId}
```

**Request:**

```json
{
  "quantity": 3
}
```

### Remove Cart Item / Xóa mục khỏi giỏ hàng

```bash
DELETE /ecommerce/carts/{cartId}/items/{itemId}
```

### Apply Coupon / Áp dụng mã giảm giá

```bash
POST /ecommerce/carts/{cartId}/coupons
```

**Request:**

```json
{
  "couponCode": "SAVE20"
}
```

## Checkout / Thanh toán

### Create Order / Tạo đơn hàng

```bash
POST /ecommerce/orders
```

**Request:**

```json
{
  "cartId": "cart-abc123",
  "customerId": "cust-456",
  "billingAddress": {
    "firstName": "Nguyễn",
    "lastName": "Văn A",
    "email": "nguyenv@example.com",
    "phone": "+84912345678",
    "street": "123 Nguyễn Huệ",
    "city": "Hồ Chí Minh",
    "state": "HCMC",
    "postalCode": "700000",
    "country": "Vietnam"
  },
  "shippingAddress": {
    "firstName": "Nguyễn",
    "lastName": "Văn A",
    "street": "456 Lê Lợi",
    "city": "Hà Nội",
    "state": "Hà Nội",
    "postalCode": "100000",
    "country": "Vietnam"
  },
  "shippingMethod": "ghn_standard",
  "paymentMethod": "vnpay"
}
```

**Response (201):**

```json
{
  "data": {
    "id": "ord-789",
    "orderNumber": "ORD-2026-001",
    "status": "pending_payment",
    "subtotal": 50000000,
    "tax": 5000000,
    "shipping": 500000,
    "total": 55500000,
    "paymentUrl": "https://payment-gateway.com/...",
    "createdAt": "2026-03-29T10:00:00Z"
  }
}
```

### Get Order / Lấy đơn hàng

```bash
GET /ecommerce/orders/{orderId}
```

**Response:**

```json
{
  "data": {
    "id": "ord-789",
    "orderNumber": "ORD-2026-001",
    "customer": {
      "id": "cust-456",
      "name": "Nguyễn Văn A",
      "email": "nguyenv@example.com"
    },
    "items": [
      {
        "productId": "prd-123",
        "productName": "Laptop Pro 15",
        "quantity": 2,
        "unitPrice": 25000000,
        "subtotal": 50000000
      }
    ],
    "status": "confirmed",
    "paymentStatus": "paid",
    "shippingStatus": "processing",
    "tracking": {
      "carrier": "GHN",
      "trackingNumber": "123456789",
      "estimatedDelivery": "2026-04-01"
    },
    "timeline": [
      {
        "status": "pending_payment",
        "timestamp": "2026-03-29T10:00:00Z"
      },
      {
        "status": "payment_confirmed",
        "timestamp": "2026-03-29T11:00:00Z"
      },
      {
        "status": "processing",
        "timestamp": "2026-03-29T13:00:00Z"
      }
    ]
  }
}
```

### List Orders / Liệt kê đơn hàng

```bash
GET /ecommerce/orders
```

**Parameters:**
- `status` - pending, confirmed, processing, shipped, delivered, cancelled
- `paymentStatus` - pending, paid, failed, refunded
- `customerId` - Filter by customer
- `dateFrom`, `dateTo` - Date range
- `search` - Search by order number
- `page`, `limit` - Pagination

## Payments / Thanh toán

### Get Payment Methods / Lấy phương thức thanh toán

```bash
GET /ecommerce/payment-methods
```

**Response:**

```json
{
  "data": [
    {
      "id": "pm-vnpay",
      "name": "VNPay",
      "type": "card",
      "isActive": true,
      "description": "Credit card via VNPay",
      "logo": "https://..."
    },
    {
      "id": "pm-momo",
      "name": "MoMo",
      "type": "wallet",
      "isActive": true,
      "description": "MoMo e-wallet"
    },
    {
      "id": "pm-bank",
      "name": "Bank Transfer",
      "type": "transfer",
      "isActive": true,
      "description": "Direct bank transfer"
    },
    {
      "id": "pm-cod",
      "name": "Cash on Delivery",
      "type": "cash",
      "isActive": true,
      "description": "Pay when receiving"
    }
  ]
}
```

### Create Payment / Tạo thanh toán

```bash
POST /ecommerce/payments
```

**Request:**

```json
{
  "orderId": "ord-789",
  "paymentMethod": "vnpay",
  "amount": 55500000,
  "currency": "VND",
  "returnUrl": "https://your-app.com/checkout/success"
}
```

**Response:**

```json
{
  "data": {
    "id": "pay-123",
    "orderId": "ord-789",
    "amount": 55500000,
    "status": "pending",
    "paymentGatewayUrl": "https://sandbox.vnpayment.vn/paygate/...",
    "expiresAt": "2026-03-30T10:00:00Z"
  }
}
```

### Verify Payment / Xác minh thanh toán

```bash
POST /ecommerce/payments/{paymentId}/verify
```

**Request:**

```json
{
  "transactionId": "VNP-123456",
  "responseCode": "00"
}
```

## Shipping / Vận chuyển

### Get Shipping Methods / Lấy phương thức vận chuyển

```bash
GET /ecommerce/shipping-methods
```

**Response:**

```json
{
  "data": [
    {
      "id": "ship-ghn-std",
      "provider": "GHN",
      "name": "Standard Delivery",
      "estimatedDays": 3,
      "price": 500000,
      "isActive": true
    },
    {
      "id": "ship-ghn-exp",
      "provider": "GHN",
      "name": "Express Delivery",
      "estimatedDays": 1,
      "price": 1000000,
      "isActive": true
    },
    {
      "id": "ship-ghtk",
      "provider": "GHTK",
      "name": "GHTK Standard",
      "estimatedDays": 2,
      "price": 450000,
      "isActive": true
    }
  ]
}
```

### Calculate Shipping / Tính toán vận chuyển

```bash
POST /ecommerce/shipping/calculate
```

**Request:**

```json
{
  "toDistrict": "quân 1",
  "toProvince": "Hồ Chí Minh",
  "weight": 2500,
  "items": [
    { "productId": "prd-123", "quantity": 2 }
  ]
}
```

**Response:**

```json
{
  "data": [
    {
      "id": "ship-ghn-std",
      "provider": "GHN",
      "name": "Standard",
      "estimatedDays": 3,
      "price": 500000
    },
    {
      "id": "ship-ghn-exp",
      "provider": "GHN",
      "name": "Express",
      "estimatedDays": 1,
      "price": 1000000
    }
  ]
}
```

### Track Shipment / Theo dõi gửi hàng

```bash
GET /ecommerce/shipments/{shipmentId}/tracking
```

**Response:**

```json
{
  "data": {
    "shipmentId": "ship-789",
    "trackingNumber": "GHN-123456789",
    "provider": "GHN",
    "status": "delivering",
    "currentLocation": "Quận 1, Hồ Chí Minh",
    "estimatedDelivery": "2026-04-01",
    "events": [
      {
        "timestamp": "2026-03-31T08:00:00Z",
        "status": "picked_up",
        "location": "HCM Warehouse"
      },
      {
        "timestamp": "2026-03-31T14:00:00Z",
        "status": "in_transit",
        "location": "In transit to Quận 1"
      }
    ]
  }
}
```

## Returns & Refunds / Trả hàng & Hoàn tiền

### Create Return Request / Tạo yêu cầu trả hàng

```bash
POST /ecommerce/returns
```

**Request:**

```json
{
  "orderId": "ord-789",
  "reason": "defective",
  "description": "Laptop has screen issues",
  "images": [
    "s3://bucket/damage-1.jpg"
  ]
}
```

**Response:**

```json
{
  "data": {
    "id": "ret-123",
    "orderId": "ord-789",
    "status": "submitted",
    "reason": "defective",
    "returnedItems": [
      {
        "productId": "prd-123",
        "quantity": 1,
        "refundAmount": 25000000
      }
    ],
    "totalRefund": 25000000,
    "createdAt": "2026-03-29T10:00:00Z"
  }
}
```

### Get Return Status / Lấy trạng thái trả hàng

```bash
GET /ecommerce/returns/{returnId}
```

### Approve Return / Phê duyệt trả hàng

```bash
POST /ecommerce/returns/{returnId}/approve
```

**Request:**

```json
{
  "approvedAmount": 25000000
}
```

### Process Refund / Xử lý hoàn tiền

```bash
POST /ecommerce/refunds
```

**Request:**

```json
{
  "returnId": "ret-123",
  "refundMethod": "original_payment",
  "notes": "Defective product - full refund approved"
}
```

## Analytics & Reporting / Phân tích & Báo cáo

### Get Sales Dashboard / Lấy bảng điều khiển bán hàng

```bash
GET /ecommerce/analytics/sales-dashboard
```

**Parameters:**
- `dateFrom`, `dateTo` - Date range
- `groupBy` - day, week, month
- `currency` - VND (default)

**Response:**

```json
{
  "data": {
    "period": {
      "from": "2026-03-01",
      "to": "2026-03-31"
    },
    "totalOrders": 250,
    "totalRevenue": 1250000000,
    "totalShippingCost": 50000000,
    "totalTax": 100000000,
    "avgOrderValue": 5000000,
    "conversionRate": 3.5,
    "topProducts": [
      {
        "productId": "prd-123",
        "name": "Laptop Pro 15",
        "unitsSold": 45,
        "revenue": 1125000000
      }
    ],
    "topRegions": [
      {
        "region": "Hồ Chí Minh",
        "orders": 120,
        "revenue": 600000000
      }
    ]
  }
}
```

## Error Codes / Mã lỗi

| Code | HTTP | Description |
|------|------|-------------|
| `PRODUCT_NOT_FOUND` | 404 | Product doesn't exist |
| `CART_EXPIRED` | 400 | Cart has expired |
| `INSUFFICIENT_STOCK` | 422 | Not enough items in stock |
| `INVALID_PAYMENT_METHOD` | 400 | Payment method not available |
| `PAYMENT_FAILED` | 422 | Payment processing failed |
| `SHIPPING_UNAVAILABLE` | 422 | Shipping not available to location |
| `COUPON_INVALID` | 400 | Coupon code is invalid or expired |
| `ORDER_NOT_FOUND` | 404 | Order doesn't exist |

## Integration with Accounting / Tích hợp với kế toán

Orders automatically create accounting journal entries:

**On Order Confirmed:**
- Debit: Accounts Receivable (131)
- Credit: Sales Revenue (5111) + Tax Payable (33311)

**On Payment Received:**
- Debit: Bank Account
- Credit: Accounts Receivable (131)

**On Return/Refund:**
- Debit: Sales Returns (5212)
- Credit: Accounts Receivable (131)

## Next Steps / Bước tiếp theo

- Review [E-commerce Development Guide](../guides/module-development.md)
- Explore [Testing Guide](../guides/testing.md)
- Check [API Overview](./README.md) for patterns
