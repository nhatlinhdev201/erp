# System Architecture | Kiến trúc Hệ thống

> Technical architecture overview of L-ERP MRP System  
> Tổng quan kiến trúc kỹ thuật của Hệ thống L-ERP MRP

---

## Table of Contents | Mục lục

- [High-Level Architecture | Kiến trúc tổng quan](#high-level-architecture--kiến-trúc-tổng-quan)
- [Technology Stack | Công nghệ](#technology-stack--công-nghệ)
- [Application Layers | Các tầng ứng dụng](#application-layers--các-tầng-ứng-dụng)
- [Data Flow | Luồng dữ liệu](#data-flow--luồng-dữ-liệu)
- [Database Schema | Schema Database](#database-schema--schema-database)
- [Security Architecture | Kiến trúc bảo mật](#security-architecture--kiến-trúc-bảo-mật)
- [Caching Strategy | Chiến lược Cache](#caching-strategy--chiến-lược-cache)
- [PWA Architecture | Kiến trúc PWA](#pwa-architecture--kiến-trúc-pwa)

---

## High-Level Architecture | Kiến trúc tổng quan

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           CLIENT LAYER                                       │
│                         (Tầng Client)                                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │   Browser   │  │   Mobile    │  │  Desktop    │  │  PWA App    │        │
│  │  (Chrome,   │  │   (iOS,     │  │   (PWA)     │  │ (Installed) │        │
│  │   Firefox)  │  │  Android)   │  │             │  │             │        │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘        │
│         │                │                │                │                │
│         └────────────────┴────────────────┴────────────────┘                │
│                                   │                                          │
│                            HTTPS/WSS                                         │
└───────────────────────────────────┼─────────────────────────────────────────┘
                                    │
┌───────────────────────────────────┼─────────────────────────────────────────┐
│                         APPLICATION LAYER                                    │
│                         (Tầng Ứng dụng)                                      │
│                                   │                                          │
│  ┌────────────────────────────────┴────────────────────────────────────┐    │
│  │                      NEXT.JS APPLICATION                             │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐               │    │
│  │  │   React UI   │  │  API Routes  │  │   Service    │               │    │
│  │  │  Components  │  │   (/api/v2)  │  │   Worker     │               │    │
│  │  └──────────────┘  └──────────────┘  └──────────────┘               │    │
│  │         │                 │                  │                       │    │
│  │  ┌──────┴─────────────────┴──────────────────┴───────┐              │    │
│  │  │              MIDDLEWARE LAYER                      │              │    │
│  │  │  ┌─────────┐  ┌─────────┐  ┌─────────┐           │              │    │
│  │  │  │  Auth   │  │  RBAC   │  │  Rate   │           │              │    │
│  │  │  │ Verify  │  │  Check  │  │  Limit  │           │              │    │
│  │  │  └─────────┘  └─────────┘  └─────────┘           │              │    │
│  │  └───────────────────────────────────────────────────┘              │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
└───────────────────────────────────┼─────────────────────────────────────────┘
                                    │
┌───────────────────────────────────┼─────────────────────────────────────────┐
│                          DATA LAYER                                          │
│                         (Tầng Dữ liệu)                                       │
│                                   │                                          │
│  ┌────────────────────────────────┴────────────────────────────────────┐    │
│  │                         PRISMA ORM                                   │    │
│  └────────────────────────────────┬────────────────────────────────────┘    │
│                                   │                                          │
│  ┌─────────────────┐  ┌──────────┴──────────┐  ┌─────────────────┐         │
│  │    PostgreSQL   │  │       Redis         │  │   File Storage  │         │
│  │   (Primary DB)  │  │   (Cache/Session)   │  │    (Uploads)    │         │
│  └─────────────────┘  └─────────────────────┘  └─────────────────┘         │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Technology Stack | Công nghệ

### Frontend Technologies | Công nghệ Frontend

| Technology | Version | Purpose | Mục đích |
|------------|---------|---------|----------|
| **Next.js** | 14.x | React framework | Framework React |
| **React** | 18.x | UI library | Thư viện UI |
| **TypeScript** | 5.x | Type safety | An toàn kiểu |
| **Tailwind CSS** | 3.x | Styling | Tạo kiểu |
| **SWR** | 2.x | Data fetching | Lấy dữ liệu |
| **Recharts** | 2.x | Charts | Biểu đồ |
| **Lucide React** | - | Icons | Biểu tượng |

### Backend Technologies | Công nghệ Backend

| Technology | Version | Purpose | Mục đích |
|------------|---------|---------|----------|
| **Next.js API** | 14.x | REST API | API REST |
| **Prisma** | 5.x | ORM | Công cụ ORM |
| **PostgreSQL** | 14+ | Database | Cơ sở dữ liệu |
| **Zod** | 3.x | Validation | Xác thực |
| **bcrypt** | - | Password hashing | Mã hóa mật khẩu |

### DevOps & Tools | DevOps & Công cụ

| Technology | Purpose | Mục đích |
|------------|---------|----------|
| **Vitest** | Unit testing | Kiểm thử đơn vị |
| **Docker** | Containerization | Container hóa |
| **GitHub Actions** | CI/CD | CI/CD |
| **ESLint** | Linting | Kiểm tra code |
| **Prettier** | Formatting | Format code |

---

## Application Layers | Các tầng ứng dụng

### 1. Presentation Layer | Tầng Trình bày

```
components/
├── layout/                 # Layout components
│   ├── app-shell-v2.tsx   # Main app shell with sidebar/topbar
│   └── page-layout.tsx    # Page wrapper
│
├── ui/                     # UI primitives
│   ├── button-animated.tsx # Button with ripple
│   ├── card-animated.tsx   # Card with hover effects
│   ├── animations.tsx      # Animation components
│   └── ...
│
├── providers/              # Context providers
│   ├── theme-provider.tsx  # Dark/light mode
│   └── index.tsx           # Root providers
│
└── pwa/                    # PWA components
    ├── index.tsx           # Install prompt, offline indicator
    └── meta-tags.tsx       # PWA meta tags
```

### 2. Business Logic Layer | Tầng Logic nghiệp vụ

```
lib/
├── hooks/                  # Custom React hooks
│   ├── use-data.ts        # Data fetching hooks (SWR)
│   └── use-pwa.ts         # PWA hooks
│
├── security/              # Security utilities
│   ├── sanitize.ts        # Input sanitization
│   ├── validation.ts      # Schema validation
│   └── rbac.ts           # Role-based access
│
├── utils.ts               # Utility functions
├── error-handler.ts       # Error handling
└── logger.ts              # Logging utility
```

### 3. API Layer | Tầng API

```
app/api/v2/
├── dashboard/route.ts     # Dashboard endpoints
├── parts/route.ts         # Parts CRUD
├── inventory/route.ts     # Inventory management
├── sales/route.ts         # Sales orders
├── production/route.ts    # Work orders
├── quality/route.ts       # NCR management
├── bom/route.ts          # Bill of Materials
└── analytics/route.ts     # Analytics data
```

### 4. Data Access Layer | Tầng Truy cập dữ liệu

```
prisma/
├── schema.prisma          # Database schema
├── migrations/            # Migration files
└── seed.ts               # Seed data

lib/
├── prisma.ts             # Prisma client singleton
└── db/                   # Database utilities
```

---

## Data Flow | Luồng dữ liệu

### Read Operation | Thao tác Đọc

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Browser    │────▶│  SWR Hook    │────▶│  API Route   │
│              │     │ (use-data)   │     │ (/api/v2/*)  │
└──────────────┘     └──────────────┘     └──────┬───────┘
       ▲                    ▲                     │
       │                    │                     ▼
       │             ┌──────┴───────┐     ┌──────────────┐
       │             │    Cache     │◀────│   Prisma     │
       │             │   (SWR)      │     │    Query     │
       │             └──────────────┘     └──────┬───────┘
       │                                         │
       │                                         ▼
       │                                  ┌──────────────┐
       └──────────────────────────────────│  PostgreSQL  │
           (Cached Response)              │   Database   │
                                          └──────────────┘
```

### Write Operation | Thao tác Ghi

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Browser    │────▶│  Mutation    │────▶│  API Route   │
│   (Form)     │     │   Hook       │     │   (POST)     │
└──────────────┘     └──────────────┘     └──────┬───────┘
                                                  │
                                                  ▼
                                          ┌──────────────┐
                                          │  Validation  │
                                          │   (Zod)      │
                                          └──────┬───────┘
                                                  │
                                                  ▼
                                          ┌──────────────┐
                                          │ Sanitization │
                                          └──────┬───────┘
                                                  │
                                                  ▼
                                          ┌──────────────┐
                                          │   Prisma     │
                                          │   Mutation   │
                                          └──────┬───────┘
                                                  │
                                                  ▼
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Revalidate │◀────│  Response    │◀────│  PostgreSQL  │
│   SWR Cache  │     │              │     │              │
└──────────────┘     └──────────────┘     └──────────────┘
```

---

## Database Schema | Schema Database

### Entity Relationship | Quan hệ thực thể

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│    Customer     │       │   SalesOrder    │       │  SalesOrderLine │
├─────────────────┤       ├─────────────────┤       ├─────────────────┤
│ id              │◀──────│ customerId      │       │ id              │
│ code            │       │ soNumber        │◀──────│ salesOrderId    │
│ name            │       │ status          │       │ productId       │
│ email           │       │ totalAmount     │       │ quantity        │
└─────────────────┘       └─────────────────┘       │ unitPrice       │
                                                     └────────┬────────┘
                                                              │
                                 ┌────────────────────────────┘
                                 ▼
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│    Product      │       │    WorkOrder    │       │     BOMLine     │
├─────────────────┤       ├─────────────────┤       ├─────────────────┤
│ id              │◀──────│ productId       │       │ id              │
│ sku             │       │ woNumber        │       │ productId       │──▶│Product│
│ name            │◀──────│ quantity        │       │ partId          │──▶│Part   │
│ revision        │       │ status          │       │ quantity        │
└────────┬────────┘       └─────────────────┘       │ parentId        │──▶│self   │
         │                                           └─────────────────┘
         │
         ▼
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│     Part        │       │   Inventory     │       │    Warehouse    │
├─────────────────┤       ├─────────────────┤       ├─────────────────┤
│ id              │◀──────│ partId          │       │ id              │
│ partNumber      │       │ warehouseId     │◀──────│ code            │
│ name            │       │ quantity        │       │ name            │
│ category        │       │ reservedQty     │       │ type            │
│ unitCost        │       └─────────────────┘       └─────────────────┘
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│      NCR        │
├─────────────────┤
│ id              │
│ partId          │
│ ncrNumber       │
│ description     │
│ severity        │
│ status          │
└─────────────────┘
```

### Key Tables | Các bảng chính

| Table | English | Tiếng Việt |
|-------|---------|------------|
| `Customer` | Customer master | Danh mục khách hàng |
| `Product` | Finished goods | Thành phẩm |
| `Part` | Parts and materials | Linh kiện và vật tư |
| `SalesOrder` | Sales orders | Đơn hàng |
| `WorkOrder` | Production orders | Lệnh sản xuất |
| `Inventory` | Stock levels | Mức tồn kho |
| `Warehouse` | Warehouse locations | Vị trí kho |
| `BOMLine` | Bill of Materials | Danh mục vật tư |
| `NCR` | Non-conformance | Báo cáo không phù hợp |

---

## Security Architecture | Kiến trúc bảo mật

### Authentication Flow | Luồng xác thực

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  Client  │────▶│  Login   │────▶│  Verify  │────▶│  Issue   │
│          │     │  Request │     │ Password │     │   JWT    │
└──────────┘     └──────────┘     └──────────┘     └────┬─────┘
                                                        │
      ┌─────────────────────────────────────────────────┘
      ▼
┌──────────┐     ┌──────────┐     ┌──────────┐
│  Store   │────▶│  Include │────▶│  Verify  │
│  Token   │     │  in Req  │     │  on API  │
└──────────┘     └──────────┘     └──────────┘
```

### Role-Based Access Control | Phân quyền theo vai trò

```
┌─────────────────────────────────────────────────────────────┐
│                    PERMISSION MATRIX                         │
├──────────────┬──────────┬──────────┬──────────┬────────────┤
│   Resource   │  Admin   │ Manager  │ Operator │  Viewer    │
├──────────────┼──────────┼──────────┼──────────┼────────────┤
│ Parts        │  CRUD    │  CRUD    │   R      │   R        │
│ Inventory    │  CRUD    │  CRUD    │  CRU     │   R        │
│ Sales Orders │  CRUD    │  CRUD    │  CRU     │   R        │
│ Work Orders  │  CRUD    │  CRUD    │  CRU     │   R        │
│ Quality/NCR  │  CRUD    │  CRUD    │  CRU     │   R        │
│ Analytics    │   R      │   R      │   R      │   R        │
│ Settings     │  CRUD    │   R      │   -      │   -        │
│ Users        │  CRUD    │   R      │   -      │   -        │
└──────────────┴──────────┴──────────┴──────────┴────────────┘

Legend: C=Create, R=Read, U=Update, D=Delete
```

### Security Layers | Các lớp bảo mật

```
┌─────────────────────────────────────────┐
│           INPUT VALIDATION               │
│  • Zod schema validation                 │
│  • Type checking                         │
│  • Required fields                       │
└─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│           INPUT SANITIZATION             │
│  • XSS prevention (escapeHtml)          │
│  • SQL injection prevention             │
│  • URL sanitization                      │
└─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│           AUTHENTICATION                 │
│  • JWT token verification               │
│  • Session management                    │
│  • Token refresh                         │
└─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│           AUTHORIZATION (RBAC)           │
│  • Role verification                     │
│  • Permission checking                   │
│  • Resource-level access                 │
└─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│           AUDIT LOGGING                  │
│  • User actions                          │
│  • Data changes                          │
│  • Security events                       │
└─────────────────────────────────────────┘
```

---

## Caching Strategy | Chiến lược Cache

### Client-Side (SWR)

```typescript
// Automatic caching with SWR
// Cache tự động với SWR
const { data, error, isLoading, mutate } = useSWR(
  '/api/v2/parts',
  fetcher,
  {
    revalidateOnFocus: true,      // Revalidate khi focus
    revalidateOnReconnect: true,  // Revalidate khi reconnect
    dedupingInterval: 2000,       // Dedupe requests
    refreshInterval: 30000,       // Auto refresh 30s
  }
);
```

### Service Worker Cache

```
┌─────────────────────────────────────────────────────────────┐
│                  CACHING STRATEGIES                          │
├──────────────────┬──────────────────────────────────────────┤
│  Cache First     │  Static assets (CSS, JS, images)         │
│                  │  • /_next/static/*                        │
│                  │  • *.png, *.jpg, *.svg                    │
├──────────────────┼──────────────────────────────────────────┤
│  Network First   │  API calls                               │
│                  │  • /api/*                                 │
│                  │  Falls back to cache when offline        │
├──────────────────┼──────────────────────────────────────────┤
│  Stale While     │  Page navigation                         │
│  Revalidate      │  • /v2/*                                 │
│                  │  Show cache, update in background        │
└──────────────────┴──────────────────────────────────────────┘
```

---

## PWA Architecture | Kiến trúc PWA

```
┌─────────────────────────────────────────────────────────────┐
│                    PWA COMPONENTS                            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────────┐  ┌─────────────────┐                   │
│  │  Web App        │  │  Service        │                   │
│  │  Manifest       │  │  Worker         │                   │
│  │  (manifest.json)│  │  (sw.js)        │                   │
│  └────────┬────────┘  └────────┬────────┘                   │
│           │                    │                             │
│           ▼                    ▼                             │
│  ┌─────────────────────────────────────────┐                │
│  │            BROWSER APIs                  │                │
│  │  • Cache API      • Push API            │                │
│  │  • IndexedDB      • Background Sync     │                │
│  │  • Notifications  • beforeinstallprompt │                │
│  └─────────────────────────────────────────┘                │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│                    REACT HOOKS                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ useService   │  │ useNetwork   │  │ useInstall   │      │
│  │ Worker       │  │ Status       │  │ Prompt       │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐                        │
│  │ usePush      │  │ usePWA       │                        │
│  │ Notifications│  │ (Combined)   │                        │
│  └──────────────┘  └──────────────┘                        │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│                    UI COMPONENTS                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Install      │  │ Offline      │  │ Update       │      │
│  │ Prompt       │  │ Indicator    │  │ Notification │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Offline Data Flow | Luồng dữ liệu Offline

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   User       │────▶│   Create     │────▶│   Save to    │
│   Action     │     │   Order      │     │   IndexedDB  │
│  (Offline)   │     │              │     │  (pending)   │
└──────────────┘     └──────────────┘     └──────┬───────┘
                                                  │
                                                  │ (When online)
                                                  ▼
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Remove     │◀────│   Sync to    │◀────│  Background  │
│   from       │     │   Server     │     │   Sync       │
│   IndexedDB  │     │              │     │   Event      │
└──────────────┘     └──────────────┘     └──────────────┘
```

---

<p align="center">
  <em>Architecture documentation v2.0</em><br>
  <em>Tài liệu kiến trúc v2.0</em>
</p>
