# Linkk-ERP Platform (L-ERP)

**Nền tảng ERP mã nguồn mở cho doanh nghiệp Việt Nam / Open-source ERP platform for Vietnamese enterprises**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14+-black?logo=next.js)](https://nextjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql)](https://www.postgresql.org/)

Linkk-ERP Platform (viết tắt: **L-ERP**) là hệ sinh thái ERP monorepo gồm 13 ứng dụng + 27 gói chia sẻ, xây dựng bằng TypeScript/Next.js, thiết kế cho thị trường Việt Nam (kế toán VAS TT200, thuế, BHXH, song ngữ Việt–Anh).

> **Nguồn gốc / Origin**: Fork đã dọn gọn từ [`nclamvn/Viet-ERP`](https://github.com/nclamvn/Viet-ERP) (MIT) — gỡ 4 app trùng/nặng (−400K dòng), vá 6 lỗ hổng bảo mật (A1–A6), tái thương hiệu sang **Linkk-ERP**, đồng bộ hạ tầng dev theo dải port riêng để chạy song song với các project khác trên cùng máy. Xem [AUDIT_REPORT.md](./AUDIT_REPORT.md).

---

## Chạy thử nhanh / Verified Quick Start

> Đường dẫn dưới đây đã được kiểm chứng end-to-end trên macOS (login thật, CRUD thật). Làm theo từng bước.

### 0. Yêu cầu / Prerequisites

- Node.js ≥ 20, npm ≥ 10
- Docker Desktop (chạy PostgreSQL/Redis/NATS/Kong/Keycloak)

### 1. Hạ tầng / Infrastructure (dải port riêng 1xxxx — không đụng 5432/6379 chuẩn)

```bash
git clone https://github.com/nhatlinhdev201/erp.git
cd erp
cp .env.example .env
docker compose up -d          # postgres 15432 · redis 16379 · nats 14222 · keycloak 18080 · kong 18000
```

Kiểm tra: `docker ps` → 5 container `lerp-*` healthy/running.

### 2. Cài dependencies

```bash
npm install --legacy-peer-deps
```

> Bắt buộc `--legacy-peer-deps` — một số package upstream khai báo peer-deps chồng chéo.

### 3. Chạy app HRM (ví dụ đã verify đầy đủ)

```bash
cd apps/HRM-unified

# .env cho app (đã có sẵn .env.example — trỏ DB về localhost:15432)
cp .env.example .env

# Tạo Prisma Client + đẩy schema (182 tables) vào DB
npx prisma generate
docker exec lerp-postgres psql -U lerp -d lerp_dev -c "CREATE DATABASE lerp_hr OWNER lerp;"
npx prisma db push

# Seed dữ liệu demo (498 nhân viên, chấm công, hợp đồng...)
SEED_DEMO_PASSWORD="ĐặtMậtKhẩuCủaBạn#2026" npx tsx prisma/seed.ts
```

> ⚠️ Schema `prisma/schema.prisma` trong repo này **đã được vá** (enum trùng, 13 relation thiếu opposite) — nếu bạn fork từ upstream gốc thì sẽ gặp lỗi P1012.

### 4. Khởi động + đăng nhập

```bash
cd ../..
npm run sys:run --no-infra hrm     # hoặc: npm run sys:run hrm (tự bật infra nếu chưa có)
```

Mở **http://localhost:3011** → đăng nhập:

| Tài khoản | Vai trò |
|---|---|
| `admin@demo.com` | Admin |
| `hr@demo.com` | HR Manager |
| `manager@demo.com` | Trưởng phòng |
| `employee@demo.com` | Nhân viên |

Mật khẩu = giá trị bạn đặt ở `SEED_DEMO_PASSWORD` khi seed (không lưu trong git).

---

## Quản trị hệ thống / System Manager

`scripts/system.js` (Node thuần, không dependency) — bảng điều khiển 13 app:

```bash
npm run sys:run [app...]      # start (vd: sys:run hrm crm, sys:run --no-infra hrm)
npm run sys:restart [app...]  # restart
npm run sys:kill [app...|all] # dừng theo port (dọn cả process mồ côi)
npm run sys:status            # bảng trạng thái 🟢/🔴 + PID + URL
npm run sys:clean [--keep-deps] [--volumes]   # dọn node_modules/.next/log
```

Alias ngắn: `hrm` `crm` `mrp` `acc` `pm` `tpm` `tpmweb` `xai` `eco` `otb` `docs` `landing` `liphoco`.

## Bản đồ port / Port Map

**Apps (3010–3022)** — dùng chung prefix HTTP, không xung đột các project khác:

| Port | App | Loại |
|---|---|---|
| 3010 | TPM-api-nestjs (BE) | NestJS |
| 3011 | HRM-unified | Next.js |
| 3012 | Accounting | Next.js |
| 3013 | CRM | Next.js |
| 3014 | Ecommerce | Next.js |
| 3015 | MRP | Next.js |
| 3016 | OTB | Next.js |
| 3017 | PM | Vite |
| 3018 | ExcelAI | Vite |
| 3019 | TPM-web | Vite |
| 3020 | docs | Next.js |
| 3021 | landing-page | Next.js |
| 3022 | liphoco | Next.js |

**Hạ tầng local (bind 127.0.0.1)**:

| Dịch vụ | Port | Container |
|---|---|---|
| PostgreSQL 16 | **15432** | `lerp-postgres` |
| Redis 7 | **16379** | `lerp-redis` |
| NATS (+monitor) | **14222** / 18222 | `lerp-nats` |
| Keycloak admin | **18080** | `lerp-keycloak` |
| Kong gateway | **18000** | `lerp-kong` |

> Tránh xung đột: nếu máy đã chạy PostgreSQL/Redis native (5432/6379), không cần dừng — L-ERP dùng dải 1xxxx riêng.
>
> **CORS liên module**: browser gọi chéo giữa các app đã được cấu hình allowlist (dev: `localhost:3010–3022` + Kong 18000; prod: set env `CORS_ALLOWED_ORIGINS` / `CORS_ORIGINS` / `CSP_CONNECT_EXTRA`).

## Các module / Modules

| Module | Mô tả | Trạng thái verify local |
|---|---|---|
| **HRM-unified** (3011) | Nhân sự: 182 models — profile, chấm công, hợp đồng, phép, lương, KPI, tuyển dụng | ✅ chạy + login + CRUD thật |
| **Accounting** (3012) | Kế toán VAS TT200 | ⚙️ chưa verify |
| **CRM** (3013) | Quan hệ khách hàng | ⚙️ chưa verify |
| **Ecommerce** (3014) | Thương mại điện tử | ⚙️ chưa verify |
| **MRP** (3015) | Sản xuất | ⚙️ chưa verify |
| **OTB** (3016) | Kế hoạch mua hàng | ⚙️ chưa verify |
| **TPM-api-nestjs** (3010) | TPM Backend | ⚙️ chưa verify |
| **TPM-web** (3019) | TPM Frontend | ⚙️ chưa verify |
| **PM** (3017) | Quản lý dự án | ⚙️ chưa verify |
| **ExcelAI** (3018) | Phân tích Excel bằng AI | ⚙️ chưa verify (BE ngoài repo :3001) |
| **docs** (3020) | Cổng tài liệu | ⚙️ chưa verify |
| **landing-page** (3021) | Trang giới thiệu | ⚙️ chưa verify |
| **liphoco** (3022) | Module Liphoco | ⚙️ chưa verify |

> Trung thực về độ hoàn thiện: codebase upstream khai báo "100%" nhưng audit thực tế cho thấy nhiều trang admin/CSDL dở dang (một số đã được bổ sung trong fork này: **Hợp đồng**, **Duyệt nghỉ phép**, **Cấu hình workflow nghỉ**). Đánh giá từng module trước khi dùng thật.

## Quy mô thực tế / Actual Scale (sau slim-down)

| Chỉ số | Giá trị |
|---|---|
| Ứng dụng | 13 |
| Gói chia sẻ `@linkk/*` | 27 |
| Prisma models | 544 (HRM: 182) |
| Next.js API routes | 878 (+ NestJS controllers) |
| Test files | ~560 |
| TypeScript LOC | ~261K |
| Dockerfiles | 15 |

## Công nghệ / Tech Stack

| Layer | Công nghệ |
|---|---|
| Frontend | Next.js 14, React 18, TypeScript 5, Tailwind CSS, Vite (app SPA) |
| Backend | Next.js API Routes, NestJS, Prisma ORM |
| Database | PostgreSQL 16 (multi-tenant) |
| Messaging | NATS JetStream |
| Auth | NextAuth (credentials) + Keycloak SSO + RBAC |
| Gateway | Kong (CORS + strip_path theo prefix `/api/{module}`) |
| Cache | Redis 7 |
| Monitoring | Prometheus + Grafana + Loki |
| Container | Docker, docker-compose (dev + prod), Kubernetes + Helm |
| IaC | Terraform (AWS/GCP/Azure — chưa rà lại) |

## Tính năng thị trường Việt Nam / Vietnamese Market Features

| Tính năng | Chi tiết |
|---|---|
| Kế toán VAS (TT200) | Hệ thống tài khoản chuẩn TT200, sổ nhật ký, BCTC |
| Hoá đơn điện tử (NĐ123) | Kết nối VNPT, Viettel, FPT, BKAV |
| Thuế GTGT / TNCN / TNDN | 0/5/8/10%; 7 bậc luỹ tiến 5–35%; 20%/10%/5% |
| BHXH / BHYT / BHTN | Tỷ lệ chuẩn VN (8%+17.5% / 1.5%+3% / 1%+1%) |
| VietQR + 20 ngân hàng | VCb, BIDV, TCB, MB... chuẩn NAPAS |
| Cổng thanh toán | VNPay, MoMo, ZaloPay |
| Song ngữ | Vi–En toàn giao diện |

## Cấu trúc dự án / Project Structure

```
erp/
├── apps/                    # 13 ứng dụng (xem bảng port ở trên)
│   └── HRM-unified/         # ← module đã verify chạy local đầy đủ
├── packages/                # 27 gói @linkk/* (auth, events, metrics, openapi,
│                            #   search, audit, notifications, vietnam, ...)
├── infrastructure/          # kong/ monitoring/ search/ terraform/
├── charts/lerp/             # Helm chart K8s
├── docs/                    # adr/ architecture/ guides/ api/ database/
├── scripts/                 # system.js (sys:*), rebrand.ts, ...
├── docker-compose.yml       # hạ tầng dev (port 1xxxx)
├── docker-compose.prod.yml  # triển khai prod
└── AUDIT_REPORT.md          # audit bảo mật + trạng thái D1–D13
```

## Lệnh thường dùng / Common Commands

| Lệnh | Mô tả |
|---|---|
| `npm run sys:status` | Trạng thái 13 app |
| `npm run sys:run <app>` | Start app cụ thể (ví dụ đã verify: `hrm`) |
| `npm run sys:kill all` | Dừng mọi app |
| `npm install --legacy-peer-deps` | Bắt buộc khi cài lại |
| `npx prisma db push` (trong app) | Đồng bộ schema (HRM) |
| `npm test` / `npm run test:e2e` | Tests |

## Khác biệt so với upstream / Notable Changes vs Upstream

Xem [CHANGELOG.md](./CHANGELOG.md) và [AUDIT_REPORT.md](./AUDIT_REPORT.md). Tóm tắt:

1. **Security A1–A6**: auth-bypass gate opt-in + loopback; auto-migrate opt-in; seed passwords env/random (không hardcode); safeExpression whitelist; PGPASSWORD qua env; compose bind 127.0.0.1
2. **Slim-down**: gỡ HRM cũ, HRM-AI, TPM-api cũ, TPM cũ (−400K dòng, giữ HRM-unified + TPM-api-nestjs)
3. **Rebrand**: Linkk-ERP Platform / L-ERP / `@linkk` / prefix `lerp`
4. **Dev infra**: dải port riêng (apps 3010+, hạ tầng 15432/16379/14222/18080/18000) + `scripts/system.js`
5. **HRM chạy được**: vá Prisma schema (P1012), gỡ `app/` dir mồ côi chặn `src/app`, fix require webpack `@prismy/sso`, bổ sung 3 tính năng thiếu (Hợp đồng, Duyệt nghỉ, Workflow nghỉ)

## Bảo mật / Security

Báo cáo lỗ hổng: xem [SECURITY.md](./SECURITY.md). Danh sách đã vá: [AUDIT_REPORT.md](./AUDIT_REPORT.md).

**Khi lên production (D12)**: đổi mọi mật khẩu admin/demo, xoá user demo, HTTPS + reverse proxy, `NODE_ENV=production`, set `CORS_ALLOWED_ORIGINS` tường minh, tắt `ALLOW_AUTH_BYPASS`.

## Giấy phép / License

MIT — giữ attribution MIT của upstream. Xem [LICENSE](./LICENSE).

---

Được xây dựng với tâm huyết cho doanh nghiệp Việt Nam.
