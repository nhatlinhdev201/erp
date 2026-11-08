# Promo Master V3 - Backend API

Enterprise-grade Trade Promotion Management System API built with NestJS.

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         PROMO MASTER V3 BACKEND                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  📦 33 Modules                          🔐 JWT Authentication               │
│  ├── Core: Auth, Budgets, Promotions    ├── Access Token (15m)             │
│  ├── Claims, Customers, Products        ├── Refresh Token (7d)             │
│  ├── V3: Contracts, AI, Monitoring      └── Role-based Access              │
│  ├── Finance: Settlements, Payments                                         │
│  ├── Planning: Targets, Execution       📊 257 API Endpoints               │
│  └── Support: Analytics, Reports        └── Matches MSW Contracts          │
│                                                                             │
│  🗄️ PostgreSQL + Prisma ORM             🐳 Docker Ready                    │
│  📮 Redis for caching                   📚 Swagger Documentation           │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- Docker & Docker Compose
- npm or yarn

### Development Setup

```bash
# 1. Install dependencies
npm install

# 2. Start infrastructure (PostgreSQL, Redis, MinIO)
docker-compose up -d db redis minio

# 3. Setup environment
cp .env.example .env

# 4. Generate Prisma client
npx prisma generate

# 5. Run migrations
npx prisma migrate dev

# 6. Seed database (optional)
npx prisma db seed

# 7. Start development server
npm run start:dev
```

### With Docker (Full Stack)

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f api
```

### Access Points

- **API**: http://localhost:3000
- **Swagger Docs**: http://localhost:3000/api/docs
- **Health Check**: http://localhost:3000/api/health
- **Adminer (DB UI)**: http://localhost:8080
- **MinIO Console**: http://localhost:9001

## 📂 Project Structure

```
src/
├── common/                 # Shared utilities
│   ├── decorators/        # Custom decorators
│   ├── dto/               # Common DTOs
│   ├── filters/           # Exception filters
│   ├── guards/            # Auth guards
│   └── interceptors/      # Request/response interceptors
├── config/                 # Configuration
├── database/               # Prisma setup
├── modules/                # Feature modules
│   ├── auth/              # Authentication
│   ├── budgets/           # Budget management
│   ├── promotions/        # Promotion management
│   ├── claims/            # Claims processing
│   ├── contracts/         # Volume contracts (V3)
│   ├── customers/         # Customer management
│   ├── products/          # Product catalog
│   ├── ai/                # AI suggestions (V3)
│   ├── monitoring/        # Live monitoring (V3)
│   └── ...                # 33 total modules
├── app.module.ts           # Root module
└── main.ts                 # Entry point
```

## 🔑 API Authentication

```bash
# Login
POST /api/auth/login
{
  "email": "admin@example.com",
  "password": "password123"
}

# Response
{
  "user": { "id": "...", "email": "...", "role": "ADMIN" },
  "accessToken": "eyJ...",
  "refreshToken": "eyJ..."
}

# Use in requests
Authorization: Bearer <accessToken>
```

## 📊 API Response Format

### Success Response

```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "timestamp": "2024-01-15T10:30:00.000Z",
    "requestId": "abc123"
  }
}
```

### Paginated Response

```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "pageSize": 10,
    "total": 100,
    "totalPages": 10
  }
}
```

### Error Response

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [...]
  },
  "meta": {
    "timestamp": "2024-01-15T10:30:00.000Z",
    "path": "/api/budgets"
  }
}
```

## 🧪 Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Coverage
npm run test:cov
```

## 📦 Deployment

### Build

```bash
# Build for production
npm run build

# Start production server
npm run start:prod
```

### Docker

```bash
# Build production image
docker build -t lerp-tpm-api:latest --target production .

# Run
docker run -p 3000:3000 lerp-tpm-api:latest
```

## 🔗 Related Documents

- [API Specification](../docs/api/API-SPECIFICATION.md)
- [API Contracts](../docs/api/api-contracts.json)
- [Endpoint Checklist](../docs/api/endpoint-checklist.md)

## 📄 License

MIT
