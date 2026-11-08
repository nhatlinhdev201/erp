# CRM API Reference

**Tham chiếu API quản lý khách hàng / CRM API Reference**

Complete API reference for the L-ERP Customer Relationship Management module.

## Base URL / URL cơ sở

```
Development:  http://localhost:8000/api/v1/crm
Production:   https://api.lerp.vn/api/v1/crm
```

Direct module:
```
Development:  http://localhost:3002/api/v1
```

## Authentication / Xác thực

All endpoints require authentication:

```bash
Authorization: Bearer <token>
X-Tenant-ID: <tenant-id>
```

Required permissions:
- `read:crm` - View customer data
- `write:crm` - Create/edit records
- `delete:crm` - Delete records
- `admin:crm` - System configuration

## Leads / Khách hàng tiềm năng

### Create Lead / Tạo khách hàng tiềm năng

```bash
POST /crm/leads
```

**Request Body:**

```json
{
  "firstName": "Nguyễn",
  "lastName": "Văn A",
  "email": "nguyenv@example.com",
  "phone": "+84912345678",
  "company": "Công ty ABC",
  "designation": "Sales Manager",
  "source": "website",
  "leadScore": 75,
  "status": "new",
  "notes": "Interested in enterprise plan",
  "tags": ["hot", "decision-maker"],
  "customFields": {
    "industry": "Technology",
    "budget": "5000000000"
  }
}
```

**Response (201 Created):**

```json
{
  "data": {
    "id": "lead-123",
    "firstName": "Nguyễn",
    "lastName": "Văn A",
    "email": "nguyenv@example.com",
    "fullName": "Nguyễn Văn A",
    "leadScore": 75,
    "status": "new",
    "source": "website",
    "createdAt": "2026-03-29T10:00:00Z",
    "owner": {
      "id": "user-123",
      "name": "Sales Agent"
    }
  }
}
```

### List Leads / Liệt kê khách hàng tiềm năng

```bash
GET /crm/leads
```

**Parameters:**
- `status` - new, contacted, qualified, proposal, won, lost
- `source` - website, referral, cold_call, email, etc.
- `scoreMin`, `scoreMax` - Filter by lead score
- `owner` - Filter by assigned sales person
- `search` - Search by name or email
- `tags` - Filter by tags
- `sortBy` - leadScore (default), createdAt, name
- `page`, `limit` - Pagination

**Example:**

```bash
curl "http://localhost:8000/api/v1/crm/leads?status=qualified&scoreMin=60&sortBy=-leadScore"
```

### Get Lead / Lấy khách hàng tiềm năng

```bash
GET /crm/leads/{leadId}
```

**Response:**

```json
{
  "data": {
    "id": "lead-123",
    "firstName": "Nguyễn",
    "lastName": "Văn A",
    "email": "nguyenv@example.com",
    "phone": "+84912345678",
    "company": "Công ty ABC",
    "leadScore": 75,
    "status": "qualified",
    "source": "website",
    "owner": {
      "id": "user-123",
      "name": "John Sales"
    },
    "interactions": [
      {
        "type": "email_opened",
        "timestamp": "2026-03-28T15:30:00Z"
      },
      {
        "type": "page_visited",
        "timestamp": "2026-03-28T14:00:00Z"
      }
    ],
    "activities": [
      {
        "id": "act-1",
        "type": "call",
        "subject": "Discovery call",
        "scheduledFor": "2026-03-30T10:00:00Z"
      }
    ],
    "notes": "Interested in enterprise plan",
    "createdAt": "2026-03-20T08:00:00Z"
  }
}
```

### Update Lead / Cập nhật khách hàng tiềm năng

```bash
PUT /crm/leads/{leadId}
```

### Convert Lead to Contact / Chuyển đổi khách hàng tiềm năng thành liên hệ

```bash
POST /crm/leads/{leadId}/convert
```

**Request:**

```json
{
  "accountId": "acc-123",
  "contactEmail": "nguyenv@example.com"
}
```

Creates Contact and Account records from Lead.

## Contacts / Liên hệ

### Create Contact / Tạo liên hệ

```bash
POST /crm/contacts
```

**Request:**

```json
{
  "firstName": "Nguyễn",
  "lastName": "Văn B",
  "email": "nguyenb@company.vn",
  "phone": "+84923456789",
  "jobTitle": "Procurement Manager",
  "department": "Operations",
  "accountId": "acc-123",
  "mailingAddress": {
    "street": "123 Nguyễn Huệ",
    "city": "Hồ Chí Minh",
    "state": "HCMC",
    "postalCode": "700000",
    "country": "Vietnam"
  },
  "notes": "Primary contact for all PO approvals"
}
```

**Response (201):**

```json
{
  "data": {
    "id": "contact-456",
    "firstName": "Nguyễn",
    "lastName": "Văn B",
    "fullName": "Nguyễn Văn B",
    "email": "nguyenb@company.vn",
    "phone": "+84923456789",
    "jobTitle": "Procurement Manager",
    "accountId": "acc-123",
    "isPrimary": true
  }
}
```

### List Contacts / Liệt kê liên hệ

```bash
GET /crm/contacts
```

**Parameters:**
- `accountId` - Filter by account
- `jobTitle` - Filter by job title
- `department` - Filter by department
- `search` - Search by name or email
- `page`, `limit` - Pagination

### Get Contact / Lấy liên hệ

```bash
GET /crm/contacts/{contactId}
```

### Update Contact / Cập nhật liên hệ

```bash
PUT /crm/contacts/{contactId}
```

## Accounts / Tài khoản/Công ty

### Create Account / Tạo tài khoản công ty

```bash
POST /crm/accounts
```

**Request:**

```json
{
  "name": "Công ty ABC Limited",
  "taxCode": "0123456789",
  "industry": "Technology",
  "annualRevenue": 500000000000,
  "numberOfEmployees": 500,
  "website": "https://abc.vn",
  "email": "contact@abc.vn",
  "phone": "+84289999999",
  "billingAddress": {
    "street": "456 Lê Lợi",
    "city": "Hà Nội",
    "state": "Hà Nội",
    "postalCode": "100000",
    "country": "Vietnam"
  },
  "shippingAddress": {
    "street": "789 Nguyễn Hữu Cảnh",
    "city": "Hồ Chí Minh",
    "state": "HCMC",
    "postalCode": "700000",
    "country": "Vietnam"
  },
  "owner": "user-123",
  "notes": "Key account - enterprise customer"
}
```

**Response (201):**

```json
{
  "data": {
    "id": "acc-123",
    "name": "Công ty ABC Limited",
    "taxCode": "0123456789",
    "industry": "Technology",
    "annualRevenue": 500000000000,
    "numberOfEmployees": 500,
    "rating": "cold",
    "stage": "prospecting",
    "owner": {
      "id": "user-123",
      "name": "Account Manager"
    },
    "createdAt": "2026-03-29T10:00:00Z"
  }
}
```

### List Accounts / Liệt kê tài khoản công ty

```bash
GET /crm/accounts
```

**Parameters:**
- `industry` - Filter by industry
- `rating` - hot, warm, cold
- `stage` - prospecting, negotiation, closed-won, closed-lost
- `owner` - Filter by account owner
- `search` - Search by name or tax code
- `sortBy` - name, annualRevenue, createdAt
- `page`, `limit` - Pagination

### Get Account / Lấy tài khoản

```bash
GET /crm/accounts/{accountId}
```

**Response:**

```json
{
  "data": {
    "id": "acc-123",
    "name": "Công ty ABC Limited",
    "taxCode": "0123456789",
    "industry": "Technology",
    "annualRevenue": 500000000000,
    "numberOfEmployees": 500,
    "rating": "hot",
    "stage": "negotiation",
    "owner": { "id": "user-123", "name": "Account Manager" },
    "contacts": [
      {
        "id": "contact-1",
        "fullName": "Nguyễn Văn A",
        "jobTitle": "Director",
        "isPrimary": true
      }
    ],
    "opportunities": [
      {
        "id": "opp-1",
        "name": "Enterprise License - 50 seats",
        "value": 5000000000,
        "stage": "proposal",
        "probability": 60
      }
    ],
    "interactions": [
      {
        "type": "call",
        "date": "2026-03-28T14:00:00Z",
        "notes": "Discussed features and pricing"
      }
    ]
  }
}
```

## Opportunities / Cơ hội bán hàng

### Create Opportunity / Tạo cơ hội bán hàng

```bash
POST /crm/opportunities
```

**Request:**

```json
{
  "name": "Enterprise License - 50 seats",
  "accountId": "acc-123",
  "contactId": "contact-456",
  "value": 5000000000,
  "probability": 30,
  "stage": "proposal",
  "closeDate": "2026-06-30",
  "description": "Enterprise license sale to ABC Corp",
  "nextStep": "Send proposal",
  "owner": "user-123",
  "customFields": {
    "contract_value": 5000000000,
    "number_of_seats": 50,
    "implementation_cost": 500000000
  }
}
```

**Response (201):**

```json
{
  "data": {
    "id": "opp-123",
    "name": "Enterprise License - 50 seats",
    "accountId": "acc-123",
    "value": 5000000000,
    "probability": 30,
    "expectedRevenue": 1500000000,
    "stage": "proposal",
    "closeDate": "2026-06-30",
    "daysInStage": 2,
    "owner": {
      "id": "user-123",
      "name": "Sales Rep"
    },
    "createdAt": "2026-03-27T10:00:00Z"
  }
}
```

### List Opportunities / Liệt kê cơ hội bán hàng

```bash
GET /crm/opportunities
```

**Parameters:**
- `stage` - prospecting, qualification, proposal, negotiation, closed-won, closed-lost
- `owner` - Filter by owner
- `accountId` - Filter by account
- `probabilityMin`, `probabilityMax` - Filter by probability
- `sortBy` - expectedRevenue (default), closeDate, createdAt
- `search` - Search by name

### Get Opportunity / Lấy cơ hội bán hàng

```bash
GET /crm/opportunities/{opportunityId}
```

### Update Opportunity / Cập nhật cơ hội bán hàng

```bash
PUT /crm/opportunities/{opportunityId}
```

### Move Opportunity to Next Stage / Chuyển cơ hội sang giai đoạn tiếp theo

```bash
POST /crm/opportunities/{opportunityId}/move-stage
```

**Request:**

```json
{
  "stage": "negotiation",
  "notes": "Customer agreed to demo"
}
```

## Activities / Hoạt động

### Create Activity / Tạo hoạt động

```bash
POST /crm/activities
```

**Request:**

```json
{
  "type": "call",
  "subject": "Follow-up on proposal",
  "description": "Discussed pricing details and timeline",
  "scheduledFor": "2026-03-30T10:00:00Z",
  "dueDate": "2026-03-30T10:00:00Z",
  "status": "scheduled",
  "priority": "high",
  "relatedTo": {
    "type": "opportunity",
    "id": "opp-123"
  },
  "attendees": ["contact-456", "user-789"],
  "reminders": [
    {
      "type": "email",
      "minutesBefore": 15
    }
  ]
}
```

**Activity Types:**
- `call` - Phone call
- `email` - Email message
- `meeting` - Face-to-face meeting
- `task` - To-do item
- `note` - Note or memo

**Response (201):**

```json
{
  "data": {
    "id": "act-789",
    "type": "call",
    "subject": "Follow-up on proposal",
    "status": "scheduled",
    "scheduledFor": "2026-03-30T10:00:00Z",
    "assignedTo": {
      "id": "user-789",
      "name": "Sales Rep"
    },
    "relatedTo": {
      "type": "opportunity",
      "id": "opp-123"
    }
  }
}
```

### List Activities / Liệt kê hoạt động

```bash
GET /crm/activities
```

**Parameters:**
- `type` - Filter by activity type
- `status` - scheduled, completed, overdue
- `priority` - low, medium, high
- `assignedTo` - Filter by assignee
- `relatedId` - Filter by related opportunity/contact
- `dueDateFrom`, `dueDateTo` - Date range

### Mark Activity Completed / Đánh dấu hoạt động hoàn thành

```bash
POST /crm/activities/{activityId}/complete
```

**Request:**

```json
{
  "notes": "Customer confirmed interest in proposal"
}
```

## Email Integration / Tích hợp email

### Send Email / Gửi email

```bash
POST /crm/communications/emails
```

**Request:**

```json
{
  "to": "contact@abc.vn",
  "subject": "Enterprise proposal for ABC Corp",
  "body": "Hi, Please find attached our proposal...",
  "attachments": [
    {
      "url": "s3://bucket/proposal.pdf",
      "name": "proposal.pdf"
    }
  ],
  "relatedTo": {
    "type": "opportunity",
    "id": "opp-123"
  },
  "trackOpens": true,
  "trackClicks": true
}
```

### List Emails / Liệt kê email

```bash
GET /crm/communications/emails
```

Returns sent and received emails for contacts/opportunities.

## Pipeline & Forecast / Đường ống & Dự báo

### Get Pipeline View / Lấy chế độ xem đường ống

```bash
GET /crm/pipeline
```

**Parameters:**
- `owner` - Filter by owner
- `timeframe` - current_month (default), current_quarter, current_year
- `groupBy` - stage (default), owner, source

**Response:**

```json
{
  "data": {
    "stages": [
      {
        "name": "proposal",
        "count": 5,
        "totalValue": 10000000000,
        "expectedRevenue": 3000000000,
        "opportunities": [
          {
            "id": "opp-1",
            "name": "Enterprise License",
            "value": 5000000000,
            "probability": 60
          }
        ]
      },
      {
        "name": "negotiation",
        "count": 3,
        "totalValue": 8000000000
      }
    ],
    "totalPipeline": 50000000000,
    "totalExpectedRevenue": 15000000000
  }
}
```

### Get Sales Forecast / Lấy dự báo bán hàng

```bash
GET /crm/forecast
```

**Parameters:**
- `period` - current_month, current_quarter, current_year
- `groupBy` - owner, region, industry

## Error Codes / Mã lỗi

| Code | HTTP | Description |
|------|------|-------------|
| `LEAD_NOT_FOUND` | 404 | Lead does not exist |
| `CONTACT_NOT_FOUND` | 404 | Contact does not exist |
| `ACCOUNT_NOT_FOUND` | 404 | Account does not exist |
| `OPPORTUNITY_NOT_FOUND` | 404 | Opportunity does not exist |
| `INVALID_STAGE_TRANSITION` | 422 | Cannot move to requested stage |
| `DUPLICATE_CONTACT` | 409 | Contact email already exists |
| `DUPLICATE_TAX_CODE` | 409 | Tax code already exists |
| `INVALID_PROBABILITY` | 400 | Probability must be 0-100 |

## Common Patterns / Các mẫu thông thường

### Lead to Opportunity Flow / Luồng từ khách hàng tiềm năng đến cơ hội

```typescript
import { ERPClient } from '@linkk/sdk';

const client = new ERPClient({
  apiKey: process.env.ERP_API_KEY,
  tenantId: 'tenant-123',
});

// 1. Create lead
const lead = await client.crm.leads.create({
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@company.vn',
  source: 'website',
});

// 2. Track interactions
await client.crm.activities.create({
  type: 'email',
  subject: 'Welcome to L-ERP',
  relatedTo: { type: 'lead', id: lead.id },
});

// 3. Qualify lead
await client.crm.leads.update(lead.id, {
  status: 'qualified',
  leadScore: 80,
});

// 4. Convert to contact
const { contact, account } = await client.crm.leads.convert(lead.id, {
  accountName: 'John\'s Company',
});

// 5. Create opportunity
const opportunity = await client.crm.opportunities.create({
  name: 'Enterprise License Sale',
  accountId: account.id,
  contactId: contact.id,
  value: 5000000000,
  stage: 'proposal',
});
```

### Track Email Engagement / Theo dõi sự tương tác email

```typescript
// Send tracked email
const email = await client.crm.communications.sendEmail({
  to: contact.email,
  subject: 'Your personalized demo',
  body: 'Hi, Check out your custom demo...',
  trackOpens: true,
  trackClicks: true,
  relatedTo: { type: 'opportunity', id: opportunity.id },
});

// System tracks:
// - Email opens
// - Link clicks
// - Updates lead/opportunity score automatically
```

## Next Steps / Bước tiếp theo

- Explore [CRM Development Guide](../guides/module-development.md)
- Review [Testing Guide](../guides/testing.md) for test scenarios
- Check [API Overview](./README.md) for global patterns
