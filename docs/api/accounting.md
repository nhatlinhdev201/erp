# Accounting API Reference

**Tham chiếu API kế toán / Accounting API Reference**

Comprehensive API reference for the L-ERP Accounting module. Full compliance with Vietnamese Accounting Standards (VAS) per Thông tư 200/2014/TT-BTC.

## Base URL / URL cơ sở

```
Development:  http://localhost:8000/api/v1/accounting
Production:   https://api.lerp.vn/api/v1/accounting
```

Direct module:
```
Development:  http://localhost:3007/api/v1
```

## Authentication / Xác thực

All endpoints require JWT Bearer token or API Key:

```bash
Authorization: Bearer <token>
X-Tenant-ID: <tenant-id>
```

Required permissions:
- `read:accounting` - View financial data
- `write:accounting` - Create/edit transactions
- `approve:accounting` - Approve journal entries
- `admin:accounting` - System configuration

## Chart of Accounts (COA) / Bảng tài khoản

### List Accounts / Liệt kê tài khoản

List all chart of accounts per TT200.

```bash
GET /accounting/accounts
```

**Parameters:**
- `accountType` - Filter by type (1-9 per TT200)
- `status` - Filter by status (active, inactive, closed)
- `search` - Search by code or name
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 50)

**Example:**

```bash
curl "http://localhost:8000/api/v1/accounting/accounts?accountType=1&status=active"
```

**Response (200 OK):**

```json
{
  "data": [
    {
      "id": "acc-131",
      "code": "131",
      "name": "Khách hàng tiền bán ngay (Customers - Cash Sales)",
      "nameEn": "Customers - Immediate Sales",
      "type": 1,
      "nature": "debit",
      "category": "Asset",
      "description": "Customer receivables for immediate sales",
      "isHeader": false,
      "status": "active",
      "createdAt": "2026-01-01T00:00:00Z"
    },
    {
      "id": "acc-132",
      "code": "132",
      "name": "Khách hàng tiền bán chịu (Customers - Credit Sales)",
      "nameEn": "Customers - Credit Sales",
      "type": 1,
      "nature": "debit",
      "category": "Asset",
      "status": "active",
      "createdAt": "2026-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 136,
    "pages": 3
  }
}
```

### Get Account Details / Lấy chi tiết tài khoản

```bash
GET /accounting/accounts/{accountCode}
```

**Example:**

```bash
curl http://localhost:8000/api/v1/accounting/accounts/131
```

**Response (200 OK):**

```json
{
  "data": {
    "id": "acc-131",
    "code": "131",
    "name": "Khách hàng tiền bán ngay",
    "type": 1,
    "nature": "debit",
    "balance": 250000000,
    "debitBalance": 250000000,
    "creditBalance": 0,
    "status": "active"
  }
}
```

## Journal Entries / Các bản ghi nhật ký

### Create Journal Entry / Tạo bản ghi nhật ký

Create a journal entry with debits and credits. Must balance (total debit = total credit).

```bash
POST /accounting/journals
```

**Request Body:**

```json
{
  "date": "2026-03-29",
  "referenceNumber": "HD-2026-001",
  "description": "Hóa đơn bán hàng cho khách ABC (Sales Invoice #001)",
  "type": "HD",
  "lines": [
    {
      "accountCode": "131",
      "debit": 11000000,
      "credit": 0,
      "description": "Khách hàng"
    },
    {
      "accountCode": "5111",
      "debit": 0,
      "credit": 10000000,
      "description": "Doanh thu"
    },
    {
      "accountCode": "33311",
      "debit": 0,
      "credit": 1000000,
      "description": "VAT 10%"
    }
  ],
  "attachments": [
    {
      "url": "s3://bucket/invoice.pdf",
      "type": "invoice"
    }
  ]
}
```

**Response (201 Created):**

```json
{
  "data": {
    "id": "je-123",
    "journalId": "JNL-2026-001",
    "date": "2026-03-29",
    "referenceNumber": "HD-2026-001",
    "description": "Hóa đơn bán hàng cho khách ABC",
    "type": "HD",
    "status": "draft",
    "totalDebit": 11000000,
    "totalCredit": 11000000,
    "lines": [
      {
        "id": "jel-1",
        "accountCode": "131",
        "accountName": "Khách hàng tiền bán ngay",
        "debit": 11000000,
        "credit": 0,
        "description": "Khách hàng"
      }
    ],
    "createdBy": "user-123",
    "createdAt": "2026-03-29T10:00:00Z"
  }
}
```

**Error Responses:**

```json
// 400 - Debits don't equal credits
{
  "error": {
    "code": "UNBALANCED_ENTRY",
    "message": "Total debits (11M) don't equal total credits (10M)"
  }
}

// 404 - Account not found
{
  "error": {
    "code": "ACCOUNT_NOT_FOUND",
    "message": "Account code 999 does not exist"
  }
}
```

### List Journal Entries / Liệt kê bản ghi nhật ký

```bash
GET /accounting/journals
```

**Parameters:**
- `period` - Filter by month (YYYY-MM)
- `type` - Filter by type (HD, PN, CT, etc.)
- `status` - Filter (draft, posted, closed)
- `search` - Search by description
- `dateFrom` - Start date (YYYY-MM-DD)
- `dateTo` - End date (YYYY-MM-DD)
- `page` - Page number

**Example:**

```bash
curl "http://localhost:8000/api/v1/accounting/journals?period=2026-03&status=posted"
```

### Get Journal Entry / Lấy bản ghi nhật ký

```bash
GET /accounting/journals/{journalId}
```

### Update Journal Entry / Cập nhật bản ghi nhật ký

```bash
PUT /accounting/journals/{journalId}
```

Only draft entries can be edited. Requires `write:accounting` permission.

### Delete Journal Entry / Xóa bản ghi nhật ký

```bash
DELETE /accounting/journals/{journalId}
```

Only draft entries can be deleted.

### Approve Journal Entry / Phê duyệt bản ghi nhật ký

```bash
POST /accounting/journals/{journalId}/approve
```

**Request Body:**

```json
{
  "comments": "Approved by CFO"
}
```

Requires `approve:accounting` permission. Moves entry from draft → posted.

## Invoices / Hóa đơn

### Create Invoice / Tạo hóa đơn

```bash
POST /accounting/invoices
```

**Request Body:**

```json
{
  "invoiceNumber": "HD-2026-0001",
  "invoiceDate": "2026-03-29",
  "customerId": "cust-123",
  "dueDate": "2026-04-29",
  "taxCode": "0123456789",
  "items": [
    {
      "description": "Sản phẩm A",
      "quantity": 10,
      "unitPrice": 100000,
      "taxRate": 10,
      "taxAmount": 100000,
      "amount": 1100000
    }
  ],
  "subtotal": 1000000,
  "taxTotal": 100000,
  "total": 1100000,
  "notes": "Thanh toán trong 30 ngày"
}
```

**Response (201):**

```json
{
  "data": {
    "id": "inv-123",
    "invoiceNumber": "HD-2026-0001",
    "status": "draft",
    "total": 1100000,
    "journalEntries": [
      {
        "journalId": "JNL-2026-001",
        "description": "Journal for invoice HD-2026-0001"
      }
    ]
  }
}
```

### List Invoices / Liệt kê hóa đơn

```bash
GET /accounting/invoices
```

**Parameters:**
- `status` - draft, issued, paid, cancelled
- `customerId` - Filter by customer
- `dateFrom`, `dateTo` - Date range
- `search` - Search by invoice number
- `page`, `limit` - Pagination

### Get Invoice / Lấy hóa đơn

```bash
GET /accounting/invoices/{invoiceId}
```

### Issue Invoice / Phát hành hóa đơn

```bash
POST /accounting/invoices/{invoiceId}/issue
```

Creates e-Invoice record and journal entries.

### Record Payment / Ghi nhận thanh toán

```bash
POST /accounting/invoices/{invoiceId}/payment
```

**Request Body:**

```json
{
  "amount": 1100000,
  "paymentDate": "2026-03-30",
  "paymentMethod": "bank_transfer",
  "referenceNumber": "TT-2026-001",
  "bankAccount": "123456789"
}
```

Automatically creates journal entries:
- Debit: Bank account
- Credit: Customer receivable (131)

## Tax Declarations / Khai báo thuế

### Calculate VAT / Tính toán VAT

```bash
POST /accounting/tax/vat/calculate
```

**Request:**

```json
{
  "period": "2026-03",
  "includeFilter": {
    "journalTypes": ["HD", "PN"]
  }
}
```

**Response:**

```json
{
  "data": {
    "period": "2026-03",
    "taxableIncome": 500000000,
    "inputVAT": 25000000,
    "outputVAT": 50000000,
    "vatPayable": 25000000,
    "taxRate": 10
  }
}
```

### Calculate PIT / Tính toán thuế TNCN

```bash
POST /accounting/tax/pit/calculate
```

Used for employee payroll calculations:

```json
{
  "grossSalary": 30000000,
  "socialInsurance": 2400000,
  "personalDeduction": 11000000,
  "dependentDeduction": 4400000,
  "otherDeductions": 0
}
```

**Response:**

```json
{
  "data": {
    "taxableIncome": 12200000,
    "taxAmount": 1220000,
    "netSalary": 25460000,
    "deductionBreakdown": {
      "socialInsurance": 2400000,
      "personalDeduction": 11000000,
      "dependentDeduction": 4400000,
      "incomeTax": 1220000
    }
  }
}
```

### Generate Tax Declaration / Tạo khai báo thuế

```bash
POST /accounting/tax-declarations
```

**Request:**

```json
{
  "declarationType": "vat",
  "period": "2026-03",
  "formType": "HTKK"
}
```

Generates HTKK-compatible XML for submission to Vietnam tax authorities.

## Financial Reports / Báo cáo tài chính

### Balance Sheet / Bảng cân đối kế toán

```bash
GET /accounting/reports/balance-sheet
```

**Parameters:**
- `asOfDate` - Report date (default: today)
- `compareTo` - Previous period for comparison
- `currency` - VND (default) or other

**Response:**

```json
{
  "data": {
    "reportDate": "2026-03-31",
    "assets": {
      "current": {
        "cash": 100000000,
        "accountsReceivable": 250000000,
        "inventory": 300000000,
        "total": 650000000
      },
      "fixed": {
        "ppe": 500000000,
        "accumulatedDepreciation": -100000000,
        "total": 400000000
      },
      "totalAssets": 1050000000
    },
    "liabilities": {
      "current": {
        "accountsPayable": 200000000,
        "shortTermDebt": 100000000,
        "total": 300000000
      },
      "longTerm": {
        "longTermDebt": 200000000,
        "total": 200000000
      },
      "totalLiabilities": 500000000
    },
    "equity": {
      "shareCapital": 500000000,
      "retainedEarnings": 50000000,
      "totalEquity": 550000000
    },
    "totalLiabilitiesAndEquity": 1050000000
  }
}
```

### Income Statement / Báo cáo kết quả hoạt động kinh doanh

```bash
GET /accounting/reports/income-statement
```

**Parameters:**
- `period` - Month or quarter (YYYY-MM or YYYY-Q1)
- `compareTo` - Previous period

### Cash Flow Statement / Báo cáo lưu chuyển tiền tệ

```bash
GET /accounting/reports/cash-flow
```

### Trial Balance / Bảng cân đối lưu chuyển

```bash
GET /accounting/reports/trial-balance
```

Returns all accounts with their balances for verification.

## Bank Reconciliation / Đối chiếu ngân hàng

### List Bank Transactions / Liệt kê giao dịch ngân hàng

```bash
GET /accounting/bank-reconciliation/transactions
```

**Parameters:**
- `bankAccountId`
- `dateFrom`, `dateTo`
- `status` - unmatched, matched, reconciled

### Match Transaction / Khớp giao dịch

```bash
POST /accounting/bank-reconciliation/match
```

**Request:**

```json
{
  "transactionId": "txn-123",
  "journalEntryId": "je-456"
}
```

Marks transaction as matched with journal entry.

### Reconcile Account / Đối chiếu tài khoản

```bash
POST /accounting/bank-reconciliation/reconcile
```

**Request:**

```json
{
  "bankAccountId": "ba-123",
  "statementDate": "2026-03-31",
  "statementBalance": 500000000,
  "reconcilledTransactions": [
    "txn-1", "txn-2", "txn-3"
  ]
}
```

## Account Status / Trạng thái tài khoản

### Account Balance / Số dư tài khoản

```bash
GET /accounting/accounts/{accountCode}/balance
```

**Parameters:**
- `asOfDate` - As of specific date
- `period` - Year or period

**Response:**

```json
{
  "data": {
    "accountCode": "131",
    "accountName": "Khách hàng tiền bán ngay",
    "beginningBalance": 200000000,
    "debitMovement": 150000000,
    "creditMovement": 100000000,
    "endingBalance": 250000000
  }
}
```

### Account Detail Ledger / Chi tiết sổ cái

```bash
GET /accounting/accounts/{accountCode}/ledger
```

Returns all journal entries posted to specific account.

## Error Codes / Mã lỗi

| Code | HTTP | Description |
|------|------|-------------|
| `UNBALANCED_ENTRY` | 400 | Journal entry debits ≠ credits |
| `ACCOUNT_NOT_FOUND` | 404 | Account code does not exist |
| `INVALID_DATE` | 400 | Date outside allowed period |
| `PERIOD_CLOSED` | 422 | Cannot post to closed period |
| `INSUFFICIENT_PERMISSION` | 403 | User lacks required role |
| `INVOICE_NOT_DRAFT` | 422 | Can only edit draft invoices |
| `DUPLICATE_INVOICE` | 409 | Invoice number already exists |
| `INVALID_TAX_RATE` | 400 | Tax rate not in allowed range |

## Common Patterns / Các mẫu thông thường

### Create Invoice & Post Entry / Tạo hóa đơn và ghi nhập

```typescript
import { ERPClient } from '@linkk/sdk';

const client = new ERPClient({
  baseUrl: 'https://api.lerp.vn',
  apiKey: process.env.ERP_API_KEY,
  tenantId: 'tenant-123',
});

// Create invoice
const invoice = await client.accounting.invoices.create({
  invoiceNumber: 'HD-2026-0001',
  customerId: 'cust-123',
  items: [
    {
      description: 'Product A',
      quantity: 10,
      unitPrice: 100000,
      taxRate: 10,
    },
  ],
});

// System automatically creates journal entries for:
// - Revenue (Debit: AR, Credit: Revenue)
// - Tax (Debit: AR, Credit: Tax Payable)

// Issue invoice (creates e-Invoice record)
await client.accounting.invoices.issue(invoice.id);
```

### Record Payment / Ghi nhận thanh toán

```typescript
// Record customer payment
await client.accounting.invoices.recordPayment(invoice.id, {
  amount: invoice.total,
  paymentDate: new Date(),
  paymentMethod: 'bank_transfer',
});

// Creates journal entry:
// Debit: Bank Account
// Credit: Accounts Receivable (131)
```

### Calculate & Submit Tax Declaration / Tính toán & Gửi khai báo thuế

```typescript
// Calculate VAT for period
const vatCalculation = await client.accounting.tax.vat.calculate({
  period: '2026-03',
});

// Generate HTKK declaration
const declaration = await client.accounting.taxDeclarations.generate({
  declarationType: 'vat',
  period: '2026-03',
  formType: 'HTKK',
});

// Download XML for submission
const xmlUrl = declaration.downloadUrl;
```

## Rate Limits / Giới hạn tốc độ

Accounting API specific limits:

| Endpoint | Limit |
|----------|-------|
| Journal creation | 100/min |
| Invoice creation | 50/min |
| Report generation | 10/min |
| Tax declarations | 5/min |

## Next Steps / Bước tiếp theo

- Review [Accounting Module Development](../guides/module-development.md)
- Explore [Testing Guide](../guides/testing.md) for test data
- Check [Contributing Guide](../guides/contributing.md) for extensions
