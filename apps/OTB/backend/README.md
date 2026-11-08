# L-ERP OTB Backend API

> NestJS + PostgreSQL + Prisma backend for the OTB Planning Management System

## Quick Start

### 1. Start PostgreSQL

```bash
docker compose up -d
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Setup Environment

```bash
cp .env.example .env
# Edit .env if needed
```

### 4. Run Migrations & Seed

```bash
npx prisma generate
npx prisma migrate dev --name init
npm run prisma:seed
```

### 5. Start Dev Server

```bash
npm run start:dev
```

API runs at `http://localhost:4000/api/v1`
Swagger docs at `http://localhost:4000/api/docs`

## Default Users

| Email | Password | Role |
|-------|----------|------|
| admin@your-domain.com | lerp@2026 | System Admin |
| buyer@your-domain.com | lerp@2026 | Buyer |
| merch@your-domain.com | lerp@2026 | Merchandiser |
| manager@your-domain.com | lerp@2026 | Merch Manager (L1 Approver) |
| finance@your-domain.com | lerp@2026 | Finance Director (L2 Approver) |

## Project Structure

```
src/
├── main.ts                          # App bootstrap + Swagger
├── app.module.ts                    # Root module
├── prisma/
│   ├── prisma.service.ts            # Database connection
│   └── prisma.module.ts             # Global DB module
├── common/
│   └── guards/
│       ├── jwt-auth.guard.ts        # JWT authentication
│       └── permissions.guard.ts     # RBAC permission check
├── modules/
│   ├── auth/                        # Login, JWT, refresh token
│   ├── master-data/                 # Brands, stores, categories, SKU catalog
│   ├── budget/                      # Budget CRUD + business rules
│   ├── planning/                    # (Phase 3) OTB Planning + versions
│   ├── proposal/                    # (Phase 4) SKU Proposals (flat, no rails)
│   ├── approval/                    # (Phase 4) Multi-level workflow
│   └── audit/                       # (Phase 4) Change tracking
prisma/
├── schema.prisma                    # Database schema (12 tables)
├── seed.ts                          # Master data + default users
```

## Frontend Integration

Copy files from `fe-services-template/` into the React app's `src/services/` directory.
Split the combined file into individual service files per the comments.
