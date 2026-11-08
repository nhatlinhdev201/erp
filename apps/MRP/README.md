# L-ERP MRP — Hệ thống Hoạch định Nguồn lực Sản xuất

> **Hệ thống MRP (Material Requirements Planning) toàn diện** dành cho doanh nghiệp sản xuất product và thiết bị công nghệ cao, tích hợp AI/ML để dự báo nhu cầu và tối ưu hoạch định.

---

## Mục lục

- [Tổng quan](#tổng-quan)
- [Kiến trúc hệ thống](#kiến-trúc-hệ-thống)
- [Công nghệ sử dụng](#công-nghệ-sử-dụng)
- [Các module chính](#các-module-chính)
- [Cài đặt và Triển khai](#cài-đặt-và-triển-khai)
- [Biến môi trường](#biến-môi-trường)
- [Cấu trúc dự án](#cấu-trúc-dự-án)
- [Cơ sở dữ liệu](#cơ-sở-dữ-liệu)
- [Kiểm thử](#kiểm-thử)
- [Triển khai Production](#triển-khai-production)
- [Tài khoản Demo](#tài-khoản-demo)
- [Bản quyền](#bản-quyền)

---

## Tổng quan

L-ERP MRP là hệ thống quản lý sản xuất thế hệ mới, được xây dựng trên nền tảng Next.js 15 với kiến trúc App Router hiện đại. Hệ thống cung cấp giải pháp đầu-cuối cho quy trình sản xuất:

- **Hoạch định nhu cầu vật tư (MRP)** với ATP/CTP, Pegging, Simulation
- **Quản lý sản xuất** với Work Orders, Routing, Capacity Planning, OEE
- **Quản lý chất lượng** theo tiêu chuẩn ISO với NCR, CAPA, Inspection Plans
- **Dự báo AI/ML** sử dụng Google Gemini và OpenAI
- **Ứng dụng di động PWA** hỗ trợ quét mã vạch và làm việc ngoại tuyến
- **Dashboard thời gian thực** với biểu đồ tương tác và cảnh báo tự động

### Thống kê dự án

| Chỉ số | Giá trị |
|--------|---------|
| Tổng dòng mã (LOC) | ~378,000 |
| Số lượng commit | 277+ |
| Prisma Models | 158 |
| API Routes | 291 |
| Trang (Pages) | 181 |
| Components | 357 |
| File kiểm thử | 102 |
| Test cases | 2,695 |

---

## Kiến trúc hệ thống

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND LAYER                        │
│  React 19 + TypeScript 5.x + Tailwind CSS + Shadcn/UI  │
│  Framer Motion + Recharts + PWA (next-pwa)              │
├─────────────────────────────────────────────────────────┤
│                   APPLICATION LAYER                      │
│  Next.js 15 App Router + API Routes + Middleware        │
│  NextAuth.js 5 + Zod Validation + Rate Limiting        │
├─────────────────────────────────────────────────────────┤
│                    SERVICE LAYER                         │
│  MRP Engine + AI/ML Services + Quality Workflows        │
│  BullMQ Queue + Redis Cache + Email Service             │
├─────────────────────────────────────────────────────────┤
│                     DATA LAYER                           │
│  Prisma ORM + PostgreSQL + Redis (Upstash)              │
└─────────────────────────────────────────────────────────┘
```

---

## Công nghệ sử dụng

| Tầng | Công nghệ | Phiên bản |
|------|-----------|-----------|
| Framework | Next.js (App Router) | 15.x |
| Ngôn ngữ | TypeScript | 5.x |
| Giao diện | React | 19.x |
| CSS | Tailwind CSS | 3.x |
| UI Components | Shadcn/UI | latest |
| Animation | Framer Motion | latest |
| Biểu đồ | Recharts | latest |
| ORM | Prisma | 6.x |
| CSDL | PostgreSQL | 16.x |
| Xác thực | NextAuth.js | 5.x |
| AI/ML | Google Gemini, OpenAI, Vercel AI SDK | latest |
| Cache | Redis (Upstash) / In-memory fallback | — |
| Hàng đợi | BullMQ pattern (in-memory) | — |
| PWA | next-pwa | latest |
| Kiểm thử | Vitest + Playwright | latest |
| Triển khai | Render (Singapore) | — |

---

## Các module chính

### 1. Quản lý Vật tư & Kho (Inventory)
- Quản lý danh mục vật tư đa cấp (Thành phẩm, Bán thành phẩm, Nguyên vật liệu, Bao bì)
- Theo dõi tồn kho thời gian thực theo từng kho/vị trí
- Điều chuyển kho, kiểm kê, điều chỉnh số lượng
- Cảnh báo tồn kho tối thiểu (Reorder Point)

### 2. Cấu trúc Sản phẩm (BOM - Bill of Materials)
- BOM đa cấp với số lượng và hệ số tiêu hao
- So sánh phiên bản BOM
- Tính toán chi phí sản phẩm tự động
- Truy xuất nguồn gốc nguyên liệu (Traceability)

### 3. Hoạch định Nhu cầu Vật tư (MRP)
- **MRP Run**: Tính toán nhu cầu ròng dựa trên đơn hàng và tồn kho
- **ATP (Available-to-Promise)**: Kiểm tra khả năng đáp ứng đơn hàng
- **CTP (Capable-to-Promise)**: Đánh giá năng lực sản xuất
- **Pegging**: Truy vết nhu cầu từ đơn hàng đến nguyên vật liệu
- **Simulation**: Mô phỏng kịch bản "What-if" cho hoạch định

### 4. Quản lý Sản xuất (Production)
- **Work Orders**: Tạo, theo dõi, hoàn thành lệnh sản xuất
- **Routing**: Định nghĩa quy trình sản xuất với các công đoạn
- **Capacity Planning**: Hoạch định năng lực sản xuất theo máy/nhân công
- **OEE (Overall Equipment Effectiveness)**: Đo lường hiệu suất thiết bị
- **Scheduling**: Lập lịch sản xuất tự động với AI

### 5. Quản lý Mua hàng (Purchasing)
- Quản lý nhà cung cấp với hệ thống đánh giá (A/B/C/D)
- Tạo và quản lý đơn đặt hàng (Purchase Orders)
- Theo dõi tiến độ giao hàng
- So sánh giá và chọn nhà cung cấp tối ưu

### 6. Quản lý Đơn hàng (Sales Orders)
- Quản lý đơn hàng bán với hệ thống phân loại khách hàng (Platinum/Gold/Silver/Bronze)
- Theo dõi trạng thái đơn hàng từ tiếp nhận đến giao hàng
- Tích hợp kiểm tra tồn kho và hoạch định sản xuất

### 7. Quản lý Chất lượng (Quality Management)
- **NCR (Non-Conformance Report)**: Báo cáo sự không phù hợp với quy trình xử lý
- **CAPA (Corrective & Preventive Actions)**: Hành động khắc phục và phòng ngừa
- **Inspection Plans**: Kế hoạch kiểm tra chất lượng theo tiêu chuẩn
- **Quality Alerts**: Cảnh báo chất lượng tự động
- **SPC (Statistical Process Control)**: Kiểm soát quá trình thống kê

### 8. Tài chính & Chi phí (Finance)
- Tính giá thành sản phẩm (Standard/Actual Costing)
- Sổ cái tổng hợp (General Ledger)
- Quản lý hóa đơn (Invoicing)
- Báo cáo tài chính

### 9. AI/ML & Trí tuệ Nhân tạo
- **Dự báo nhu cầu**: Sử dụng Google Gemini để dự báo xu hướng đặt hàng
- **Dự đoán thời gian giao hàng**: ML model dự báo lead time nhà cung cấp
- **Lập lịch thông minh**: AI tối ưu lịch trình sản xuất
- **Chatbot hỗ trợ**: Trợ lý AI hỗ trợ tra cứu và phân tích dữ liệu
- **Phân tích chất lượng**: AI phát hiện xu hướng lỗi sản phẩm

### 10. Ứng dụng Di động (Mobile PWA)
- Quét mã vạch để tra cứu vật tư
- Nhập kho trực tiếp từ điện thoại
- Điều chỉnh tồn kho nhanh
- Kiểm kê bằng thiết bị di động
- Hỗ trợ làm việc ngoại tuyến (Offline mode)

### 11. Nhập/Xuất Excel
- Nhập dữ liệu hàng loạt từ file Excel
- Xuất báo cáo ra Excel với định dạng chuyên nghiệp
- Mẫu nhập liệu chuẩn (Master Data Templates)
- Kiểm tra dữ liệu tự động trước khi nhập (Validation)

### 12. Dashboard & Báo cáo
- Dashboard tổng quan với biểu đồ tương tác (Recharts)
- Báo cáo tồn kho, sản xuất, chất lượng, tài chính
- Bộ lọc nâng cao và tìm kiếm toàn văn
- Xuất báo cáo PDF/Excel

---

## Cài đặt và Triển khai

### Yêu cầu hệ thống

- **Node.js** >= 18.x
- **npm** >= 9.x hoặc **pnpm** >= 8.x
- **PostgreSQL** >= 15.x (hoặc SQLite cho phát triển)
- **Redis** (tùy chọn, có fallback in-memory)

### Cài đặt môi trường phát triển

```bash
# 1. Clone repository
git clone https://github.com/linkk/lerp-mrp.git
cd lerp-mrp

# 2. Cài đặt dependencies
npm install

# 3. Sao chép file cấu hình môi trường
cp .env.example .env.local

# 4. Cập nhật các biến môi trường trong .env.local (xem phần Biến môi trường)

# 5. Khởi tạo cơ sở dữ liệu
npx prisma generate
npx prisma db push

# 6. Tạo dữ liệu mẫu (tùy chọn)
npx prisma db seed

# 7. Chạy server phát triển
npm run dev
```

Ứng dụng sẽ khởi chạy tại: `http://localhost:3000`

---

## Biến môi trường

Tạo file `.env.local` với các biến sau:

```env
# === Cơ sở dữ liệu ===
DATABASE_URL="postgresql://user:password@localhost:5432/rtr_mrp"

# === Xác thực ===
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="chuoi-bi-mat-ngau-nhien-cua-ban"

# === AI/ML (tùy chọn) ===
GOOGLE_GENERATIVE_AI_API_KEY="your-gemini-api-key"
OPENAI_API_KEY="your-openai-api-key"

# === Redis Cache (tùy chọn — có fallback in-memory) ===
UPSTASH_REDIS_REST_URL="your-upstash-url"
UPSTASH_REDIS_REST_TOKEN="your-upstash-token"

# === Email SMTP (tùy chọn) ===
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
EMAIL_FROM="noreply@your-domain.com"
```

---

## Cấu trúc dự án

```
lerp-mrp/
├── prisma/
│   ├── schema.prisma          # 158 models — cấu trúc CSDL đầy đủ
│   └── seed.ts                # Dữ liệu mẫu ban đầu
├── src/
│   ├── app/                   # Next.js 15 App Router
│   │   ├── (auth)/            # Trang đăng nhập, đăng ký
│   │   ├── (dashboard)/       # Trang quản lý chính (được bảo vệ)
│   │   │   ├── inventory/     # Quản lý tồn kho
│   │   │   ├── production/    # Quản lý sản xuất
│   │   │   ├── quality/       # Quản lý chất lượng
│   │   │   ├── purchasing/    # Quản lý mua hàng
│   │   │   ├── sales/         # Quản lý bán hàng
│   │   │   ├── mrp/           # Hoạch định nhu cầu
│   │   │   ├── finance/       # Tài chính
│   │   │   └── settings/      # Cấu hình hệ thống
│   │   ├── api/               # 291 API routes
│   │   │   ├── ai/            # API trí tuệ nhân tạo
│   │   │   ├── inventory/     # API tồn kho
│   │   │   ├── mobile/        # API ứng dụng di động
│   │   │   ├── mrp/           # API hoạch định
│   │   │   ├── quality/       # API chất lượng
│   │   │   └── v2/            # API phiên bản 2
│   │   └── mobile/            # Giao diện PWA di động
│   ├── components/            # 357 React components
│   │   ├── ui/                # Shadcn/UI components cơ bản
│   │   ├── forms/             # Form components tái sử dụng
│   │   ├── charts/            # Biểu đồ và dashboard
│   │   └── [feature]/         # Components theo tính năng
│   ├── lib/                   # Logic nghiệp vụ & tiện ích
│   │   ├── ai/                # Tích hợp AI (Gemini, OpenAI)
│   │   ├── mrp/               # MRP engines (ATP, Pegging, Simulation)
│   │   ├── mrp-engine/        # Core MRP calculation engine
│   │   ├── quality/           # NCR/CAPA workflows
│   │   ├── cache/             # Redis/In-memory caching
│   │   ├── security/          # Rate limiting, RBAC
│   │   ├── mobile/            # Xử lý mã vạch, offline sync
│   │   └── utils/             # Hàm tiện ích dùng chung
│   ├── hooks/                 # Custom React hooks
│   └── types/                 # TypeScript type definitions
├── docs/                      # Tài liệu kỹ thuật
├── public/                    # Tài nguyên tĩnh (icons, images)
├── vitest.config.ts           # Cấu hình kiểm thử
├── tailwind.config.ts         # Cấu hình Tailwind CSS
├── next.config.ts             # Cấu hình Next.js
└── package.json               # Dependencies và scripts
```

---

## Cơ sở dữ liệu

### Prisma Schema — 158 Models

Các nhóm model chính:

| Nhóm | Models tiêu biểu | Mô tả |
|------|-------------------|--------|
| Vật tư | Part, BOM, BOMLine | Danh mục vật tư và cấu trúc sản phẩm |
| Kho | Inventory, Warehouse, LotTransaction | Tồn kho và giao dịch nhập xuất |
| Sản xuất | WorkOrder, Routing, Operation | Lệnh sản xuất và quy trình |
| Mua hàng | PurchaseOrder, Supplier, SupplierRating | Đơn đặt hàng và nhà cung cấp |
| Bán hàng | SalesOrder, Customer, CustomerTier | Đơn bán hàng và khách hàng |
| Chất lượng | NCR, CAPA, Inspection, QualityAlert | Quản lý chất lượng toàn diện |
| Tài chính | GLEntry, Invoice, CostRecord | Sổ cái và chi phí |
| MRP | MRPRun, PlannedOrder, Demand | Kết quả hoạch định |
| Thiết bị | Equipment, MaintenanceRecord | Quản lý thiết bị và bảo trì |
| AI/ML | ForecastResult, AIModel, ChatHistory | Dữ liệu AI và lịch sử trò chuyện |

### Migration

```bash
# Tạo migration mới sau khi thay đổi schema
npx prisma migrate dev --name ten_migration

# Áp dụng migration trên production
npx prisma migrate deploy

# Xem trạng thái migration
npx prisma migrate status

# Mở Prisma Studio (giao diện quản lý CSDL)
npx prisma studio
```

---

## Kiểm thử

Dự án sử dụng **Vitest** cho kiểm thử đơn vị (unit) và tích hợp (integration), **Playwright** cho kiểm thử end-to-end.

### Chạy kiểm thử

```bash
# Chạy toàn bộ kiểm thử
npm run test

# Chạy với giao diện theo dõi (watch mode)
npm run test -- --watch

# Chạy kiểm thử với báo cáo độ phủ (coverage)
npm run test -- --coverage

# Chạy kiểm thử cho một file cụ thể
npm run test -- src/app/api/__tests__/mobile-routes.test.ts
```

### Thống kê kiểm thử hiện tại

| Chỉ số | Giá trị |
|--------|---------|
| Tổng file kiểm thử | 102 |
| Tổng test cases | 2,695 |
| Tỷ lệ pass | 100% (2,695/2,695) |
| Độ phủ câu lệnh (Statement) | 66.55% |
| Độ phủ nhánh (Branch) | 55.78% |
| Độ phủ hàm (Function) | 56.27% |

### Phân loại kiểm thử

- **API Routes**: Kiểm thử tất cả endpoint (GET, POST, PATCH, DELETE)
- **Business Logic**: MRP engine, chất lượng, tài chính
- **AI/ML**: Dự báo, lập lịch, chatbot
- **Mobile**: Quét mã vạch, nhập kho, kiểm kê
- **Security**: Xác thực, phân quyền, rate limiting

---

## Triển khai Production

### Render (Hiện tại)

Hệ thống được triển khai trên **Render** tại khu vực Singapore:

- **URL**: [https://mrp.prismy.in](https://mrp.prismy.in)
- **Khu vực**: Singapore (gần Việt Nam)
- **Gói dịch vụ**: Standard
- **CSDL**: PostgreSQL managed trên Render

### Cấu hình triển khai

File `render.yaml` chứa cấu hình triển khai tự động:

```bash
# Build command
npm install && npx prisma generate && npm run build

# Start command
npm start
```

### Triển khai thủ công

```bash
# Build ứng dụng
npm run build

# Kiểm tra build
npm start

# Triển khai (tự động qua Git push)
git push origin main
```

---

## Tài khoản Demo

```
Email:    admin@your-domain.com
Mật khẩu: admin123456@
```

---

## Scripts hữu ích

```bash
npm run dev          # Chạy server phát triển (port 3000)
npm run build        # Build ứng dụng production
npm start            # Chạy server production
npm run test         # Chạy toàn bộ kiểm thử
npm run lint         # Kiểm tra code style
npx prisma studio    # Mở giao diện quản lý CSDL
npx prisma generate  # Tạo Prisma Client từ schema
```

---

## Đóng góp

Dự án tuân theo quy trình phát triển với hệ thống TIP (Task Implementation Plan). Mọi thay đổi cần:

1. Tạo branch mới từ `main`
2. Implement theo đúng TIP specification
3. Viết kiểm thử cho code mới
4. Tạo Pull Request với mô tả chi tiết
5. Review và merge

### Quy ước đặt tên Commit

```
feat(module): thêm [tính năng] — TIP-XXX
fix(module): sửa [vấn đề] — TIP-XXX
refactor(module): tái cấu trúc [phần] — TIP-XXX
test(module): thêm kiểm thử cho [tính năng] — TIP-XXX
docs(module): cập nhật tài liệu [phần] — TIP-XXX
```

---

## Bản quyền / License

MIT License — xem [LICENSE](../../LICENSE) tại root repository. Module này là một phần của nền tảng L-ERP (fork theo MIT).

---

> Fork từ nền tảng L-ERP (MIT). Được phát triển với sự hỗ trợ từ AI.
