# L-ERP OTB Platform — Full-Stack

He thong quan ly Open-To-Buy (OTB) cho L-ERP. **Frontend** (Next.js 16) + **Backend** (NestJS) trong cung 1 repo.

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| **Frontend** | Next.js (App Router) | 16.1.6 |
| UI Library | React | 19.x |
| Styling | Tailwind CSS | 3.4.x |
| Icons | lucide-react | latest |
| Charts | Recharts | 3.7.x |
| HTTP Client | Axios | 1.13.x |
| **Backend** | NestJS | 10.3.x |
| ORM | Prisma | 5.8.x |
| Database | PostgreSQL | 16 |
| Auth | JWT (Passport) | — |

## Cau truc thu muc

```
lerp-otb/
├── src/                    # FRONTEND (Next.js 16, React 19)
│   ├── app/                # App Router routes (16 routes)
│   ├── screens/            # 15 screen components
│   ├── components/         # UI components (Layout, Common, AI)
│   ├── contexts/           # AuthContext, AppContext, LanguageContext
│   ├── hooks/              # useBudget, usePlanning, useProposal
│   ├── services/           # API services (10 files)
│   ├── locales/            # i18n EN/VN translations
│   └── utils/              # Formatters, constants, routeMap
├── backend/                # BACKEND (NestJS)
│   ├── src/modules/        # 7 API modules
│   │   ├── auth/           # Login, JWT, refresh token
│   │   ├── budget/         # Budget CRUD + 2-level approval
│   │   ├── planning/       # Planning versions + dimensions
│   │   ├── proposal/       # SKU proposals + products
│   │   ├── master-data/    # Brands, stores, categories, SKU catalog
│   │   ├── ai/             # Size curve, alerts, allocation, risk, SKU recommend
│   │   └── approval-workflow/ # Workflow config per brand
│   ├── prisma/             # DB schema (29 tables) + seed
│   └── docker-compose.yml  # PostgreSQL 16
├── public/                 # Static assets
├── HANDOVER.md             # Full-stack documentation (chi tiet)
└── package.json            # Frontend dependencies
```

## Quick Start

### 1. Start Database (PostgreSQL)

```bash
cd backend
docker compose up -d
```

### 2. Start Backend (NestJS - port 4000)

```bash
cd backend
npm install
npx prisma generate
npx prisma migrate dev
npm run prisma:seed       # Tao demo accounts + master data
npm run start:dev
```

> API: http://localhost:4000/api/v1
> Swagger: http://localhost:4000/api/docs

### 3. Start Frontend (Next.js - port 3006)

```bash
# Tu root folder
cp .env.example .env.local
npm install
npm run dev
```

> App: http://localhost:3006

## Demo Accounts

| Email | Password | Role |
|-------|----------|------|
| admin@your-domain.com | lerp@2026 | System Admin |
| buyer@your-domain.com | lerp@2026 | Buyer |
| merch@your-domain.com | lerp@2026 | Merchandiser |
| manager@your-domain.com | lerp@2026 | Merch Manager (L1 Approver) |
| finance@your-domain.com | lerp@2026 | Finance Director (L2 Approver) |

## Frontend Routes

| URL | Man hinh | Mo ta |
|-----|----------|-------|
| `/login` | LoginScreen | Dang nhap |
| `/` | HomeScreen | Dashboard KPI |
| `/budget-management` | BudgetManagementScreen | Quan ly ngan sach |
| `/planning` | BudgetAllocateScreen | Phan bo ngan sach |
| `/planning/[id]` | PlanningDetailPage | Chi tiet ke hoach |
| `/otb-analysis` | OTBAnalysisScreen | Phan tich OTB |
| `/proposal` | SKUProposalScreen | De xuat SKU |
| `/proposal/[id]` | ProposalDetailPage | Chi tiet de xuat |
| `/tickets` | TicketScreen | Danh sach ticket |
| `/tickets/[id]` | TicketDetailPage | Chi tiet ticket |
| `/profile` | ProfileScreen | Ho so ca nhan |
| `/settings` | SettingsScreen | Cai dat |
| `/master-data/[type]` | MasterDataScreen | Master data |
| `/approval-config` | ApprovalWorkflowScreen | Cau hinh duyet |

## Backend API (port 4000)

| Module | Base Path | Endpoints |
|--------|-----------|-----------|
| Auth | `/auth` | login, refresh, me |
| Budget | `/budgets` | CRUD + submit + approve L1/L2 |
| Planning | `/planning` | CRUD + copy + submit + approve + finalize |
| Proposal | `/proposals` | CRUD + products + bulk + submit + approve |
| Master Data | `/master` | brands, stores, collections, categories, SKU catalog |
| AI | `/ai` | size-curve, alerts, allocation, risk, sku-recommend |
| Approval Workflow | `/approval-workflow` | CRUD + reorder per brand |

## Environment Variables

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
```

### Backend (backend/.env)
```
DATABASE_URL="postgresql://lerp:lerp2026@localhost:5432/lerp_otb?schema=public"
JWT_SECRET="your-secret-key"
PORT=4000
CORS_ORIGIN="http://localhost:3006"
```

## Approval Workflow

```
DRAFT → SUBMITTED → LEVEL1_APPROVED → APPROVED
                  ↘                 ↗
                    → REJECTED ←
```

- **L1**: Merch Manager duyet
- **L2**: Finance Director duyet
- Ap dung cho: Budget, Planning, Proposal

## Documentation

Xem **HANDOVER.md** de biet chi tiet ve:
- Kien truc frontend/backend
- API endpoints day du
- Database schema
- Authentication flow
- i18n, Dark/Light mode
- Huong dan startup chi tiet
