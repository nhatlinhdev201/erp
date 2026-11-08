# L-ERP MRP - Manufacturing Resource Planning System

<p align="center">
  <img src="/icons/icon.svg" alt="MRP Logo" width="96" height="96">
</p>

<p align="center">
  <strong>Enterprise Manufacturing Resource Planning System</strong><br>
  <em>Hệ thống Hoạch định Tài nguyên Sản xuất Doanh nghiệp</em>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/version-2.0.0-blue.svg" alt="Version">
  <img src="https://img.shields.io/badge/license-MIT-green.svg" alt="License">
  <img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg" alt="PRs Welcome">
</p>

---

## 📋 Table of Contents | Mục lục

- [Overview | Tổng quan](#overview--tổng-quan)
- [Features | Tính năng](#features--tính-năng)
- [Tech Stack | Công nghệ](#tech-stack--công-nghệ)
- [Quick Start | Bắt đầu nhanh](#quick-start--bắt-đầu-nhanh)
- [Documentation | Tài liệu](#documentation--tài-liệu)
- [Project Structure | Cấu trúc dự án](#project-structure--cấu-trúc-dự-án)

---

## Overview | Tổng quan

### English

L-ERP MRP is a comprehensive Manufacturing Resource Planning system designed for product manufacturing companies. It provides end-to-end management of inventory, sales orders, production, quality control, and analytics.

**Key Capabilities:**
- Real-time inventory tracking with multi-warehouse support
- Sales order management with customer integration
- Production planning and work order tracking
- Quality management with NCR (Non-Conformance Report) tracking
- Bill of Materials (BOM) management
- Comprehensive analytics and reporting
- AI-powered copilot for intelligent assistance

### Tiếng Việt

L-ERP MRP là hệ thống Hoạch định Tài nguyên Sản xuất toàn diện được thiết kế cho các công ty sản xuất product. Hệ thống cung cấp quản lý đầu-cuối cho tồn kho, đơn hàng, sản xuất, kiểm soát chất lượng và phân tích.

**Khả năng chính:**
- Theo dõi tồn kho thời gian thực với hỗ trợ đa kho
- Quản lý đơn hàng với tích hợp khách hàng
- Lập kế hoạch sản xuất và theo dõi lệnh sản xuất
- Quản lý chất lượng với theo dõi NCR (Báo cáo Không phù hợp)
- Quản lý Danh mục Vật tư (BOM)
- Phân tích và báo cáo toàn diện
- Trợ lý AI thông minh

---

## Features | Tính năng

### Core Modules | Các module chính

| Module | English | Tiếng Việt |
|--------|---------|------------|
| 📊 Dashboard | Real-time KPIs and alerts | KPIs và cảnh báo thời gian thực |
| 📦 Inventory | Multi-warehouse stock management | Quản lý tồn kho đa kho |
| 🔧 Parts Master | Component and material catalog | Danh mục linh kiện và vật tư |
| 🛒 Sales Orders | Order processing and tracking | Xử lý và theo dõi đơn hàng |
| 🏭 Production | Work order management | Quản lý lệnh sản xuất |
| ✅ Quality | NCR and CAPA management | Quản lý NCR và CAPA |
| 📈 Analytics | Reports and insights | Báo cáo và phân tích |
| 📋 BOM | Bill of Materials tree view | Cây Danh mục Vật tư |
| 🤖 AI Copilot | Intelligent assistant | Trợ lý thông minh |

### Technical Features | Tính năng kỹ thuật

| Feature | English | Tiếng Việt |
|---------|---------|------------|
| 🌙 Dark Mode | Light/Dark/System themes | Chế độ Sáng/Tối/Hệ thống |
| 📱 PWA | Installable, offline support | Cài đặt được, hỗ trợ offline |
| 🔐 Security | RBAC, input validation | Phân quyền, xác thực đầu vào |
| ⚡ Performance | Optimized caching | Tối ưu bộ nhớ đệm |
| 🎨 Animations | Smooth micro-interactions | Hiệu ứng chuyển động mượt |

---

## Tech Stack | Công nghệ

### Frontend

| Technology | Purpose | Mục đích |
|------------|---------|----------|
| Next.js 14 | React framework | Framework React |
| TypeScript | Type safety | An toàn kiểu dữ liệu |
| Tailwind CSS | Styling | Tạo kiểu giao diện |
| SWR | Data fetching | Lấy dữ liệu |
| Recharts | Charts | Biểu đồ |

### Backend

| Technology | Purpose | Mục đích |
|------------|---------|----------|
| Next.js API | REST API | API REST |
| Prisma | ORM | Công cụ ORM |
| PostgreSQL | Database | Cơ sở dữ liệu |
| Zod | Validation | Xác thực |

---

## Quick Start | Bắt đầu nhanh

```bash
# 1. Clone repository | Clone kho mã nguồn
git clone https://github.com/rtr/mrp-system.git
cd mrp-system

# 2. Install dependencies | Cài đặt thư viện
npm install

# 3. Setup environment | Thiết lập môi trường
cp .env.example .env.local

# 4. Setup database | Thiết lập database
npx prisma migrate dev
npx prisma db seed

# 5. Start development server | Khởi động server
npm run dev
```

---

## Documentation | Tài liệu

| Document | Description | Mô tả |
|----------|-------------|-------|
| [API Reference](./API.md) | REST API documentation | Tài liệu REST API |
| [Setup Guide](./SETUP.md) | Installation & configuration | Hướng dẫn cài đặt |
| [Architecture](./ARCHITECTURE.md) | System design | Thiết kế hệ thống |
| [Components](./COMPONENTS.md) | UI component library | Thư viện component UI |

---

## Project Structure | Cấu trúc dự án

```
lerp-mrp-app/
├── app/                    # Next.js App Router
│   ├── api/v2/            # API routes | Các route API
│   ├── v2/                # Page routes | Các route trang
│   └── offline/           # Offline page | Trang offline
├── components/            # React components
│   ├── layout/           # Layout components
│   ├── ui/               # UI primitives
│   ├── providers/        # Context providers
│   └── pwa/              # PWA components
├── lib/                   # Utilities
│   ├── hooks/            # Custom hooks
│   ├── security/         # Security utilities
│   └── types/            # TypeScript types
├── prisma/               # Database schema
├── public/               # Static assets
├── styles/               # Global styles
├── tests/                # Test files
└── docs/                 # Documentation
```

---

<p align="center">
  Made with ❤️ by RTR Team<br>
  <em>Được tạo với ❤️ bởi Đội ngũ RTR</em>
</p>
