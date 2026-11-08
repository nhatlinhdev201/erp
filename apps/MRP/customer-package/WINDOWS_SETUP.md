# ═══════════════════════════════════════════════════════════════════════════════
# L-ERP MRP - HƯỚNG DẪN CÀI ĐẶT TRÊN WINDOWS 10
# Windows 10 Local Installation Guide
# ═══════════════════════════════════════════════════════════════════════════════

## 📋 MỤC LỤC

1. [Yêu cầu hệ thống](#1-yêu-cầu-hệ-thống)
2. [Phương án cài đặt](#2-phương-án-cài-đặt)
3. [Cài đặt Method A: Docker Desktop (Khuyến nghị)](#3-method-a-docker-desktop)
4. [Cài đặt Method B: Native Installation](#4-method-b-native-installation)
5. [Khởi chạy ứng dụng](#5-khởi-chạy-ứng-dụng)
6. [Truy cập hệ thống](#6-truy-cập-hệ-thống)
7. [Troubleshooting](#7-troubleshooting)

---

## 1. YÊU CẦU HỆ THỐNG

### Phần cứng tối thiểu

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| **CPU** | 2 cores | 4+ cores |
| **RAM** | 4 GB | 8+ GB |
| **Disk** | 10 GB free | 20+ GB SSD |
| **OS** | Windows 10 (64-bit) | Windows 10/11 Pro |

### Phần mềm cần thiết

| Software | Version | Download |
|----------|---------|----------|
| **Git** | Latest | https://git-scm.com/download/win |
| **Node.js** | 18.x LTS | https://nodejs.org/ |
| **PostgreSQL** | 15.x | https://www.postgresql.org/download/windows/ |
| **VS Code** (optional) | Latest | https://code.visualstudio.com/ |

---

## 2. PHƯƠNG ÁN CÀI ĐẶT

### So sánh các phương án

| Phương án | Độ khó | Thời gian | Phù hợp cho |
|-----------|--------|-----------|-------------|
| **A: Docker Desktop** | ⭐ Dễ | 15 phút | Mọi người |
| **B: Native Install** | ⭐⭐ TB | 30 phút | Developer |

**Khuyến nghị**: Dùng **Method A (Docker)** nếu máy có 8GB+ RAM

---

## 3. METHOD A: DOCKER DESKTOP (Khuyến nghị)

### Bước 3.1: Cài Docker Desktop

1. **Download Docker Desktop**:
   - Truy cập: https://www.docker.com/products/docker-desktop/
   - Click **"Download for Windows"**

2. **Cài đặt**:
   - Chạy file `Docker Desktop Installer.exe`
   - Tick chọn: ✅ "Use WSL 2 instead of Hyper-V"
   - Click **"Ok"** → Chờ cài đặt

3. **Khởi động lại máy** (Restart required)

4. **Mở Docker Desktop**:
   - Chờ Docker khởi động (biểu tượng cá voi ở taskbar)
   - Accept Terms of Service

### Bước 3.2: Clone Repository

Mở **Command Prompt** hoặc **PowerShell**:

```powershell
# Di chuyển đến thư mục muốn cài
cd C:\Projects

# Clone repository
git clone https://github.com/linkk/lerp-mrp.git

# Vào thư mục dự án
cd lerp-mrp
```

### Bước 3.3: Tạo file Docker Compose

Tạo file `docker-compose.yml` trong thư mục `lerp-mrp`:

```yaml
version: '3.8'

services:
  # PostgreSQL Database
  db:
    image: postgres:15-alpine
    container_name: lerp-mrp-db
    restart: always
    environment:
      POSTGRES_USER: rtr_admin
      POSTGRES_PASSWORD: rtr_secure_2024
      POSTGRES_DB: rtr_mrp
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U rtr_admin -d rtr_mrp"]
      interval: 10s
      timeout: 5s
      retries: 5

  # L-ERP MRP Application
  app:
    build: .
    container_name: lerp-mrp-app
    restart: always
    depends_on:
      db:
        condition: service_healthy
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://rtr_admin:rtr_secure_2024@db:5432/rtr_mrp
      NEXTAUTH_SECRET: your-super-secret-key-change-this-in-production
      NEXTAUTH_URL: http://localhost:3000
    ports:
      - "3000:3000"
    volumes:
      - ./data:/app/data

volumes:
  postgres_data:
```

### Bước 3.4: Tạo Dockerfile

Tạo file `Dockerfile` trong thư mục `lerp-mrp`:

```dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]
```

### Bước 3.5: Cập nhật next.config.js

Thêm `output: 'standalone'` vào `next.config.js`:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  // ... other config
};

module.exports = nextConfig;
```

### Bước 3.6: Khởi chạy với Docker

```powershell
# Build và chạy containers
docker-compose up -d --build

# Xem logs
docker-compose logs -f

# Chạy database migration
docker-compose exec app npx prisma migrate deploy

# Seed dữ liệu mẫu (optional)
docker-compose exec app npx prisma db seed
```

### Bước 3.7: Kiểm tra

- Mở trình duyệt: **http://localhost:3000**
- Health check: **http://localhost:3000/api/health**

---

## 4. METHOD B: NATIVE INSTALLATION

### Bước 4.1: Cài Git

1. Download từ: https://git-scm.com/download/win
2. Chạy installer, chọn các default options
3. Verify: Mở Command Prompt, gõ `git --version`

### Bước 4.2: Cài Node.js

1. Download từ: https://nodejs.org/ (chọn LTS version)
2. Chạy installer
3. Verify:
   ```powershell
   node --version    # Should show v18.x.x
   npm --version     # Should show 9.x.x or 10.x.x
   ```

### Bước 4.3: Cài PostgreSQL

1. **Download PostgreSQL 15**:
   - https://www.postgresql.org/download/windows/
   - Chọn "Download the installer"

2. **Chạy installer**:
   - Installation Directory: `C:\Program Files\PostgreSQL\15`
   - Select Components: ✅ PostgreSQL Server, ✅ pgAdmin 4, ✅ Command Line Tools
   - Data Directory: `C:\Program Files\PostgreSQL\15\data`
   - **Password**: Nhập password cho user `postgres` (VD: `postgres123`)
   - Port: `5432` (default)
   - Locale: `[Default locale]`

3. **Tạo Database**:
   - Mở **pgAdmin 4** (từ Start Menu)
   - Kết nối đến server localhost
   - Right-click "Databases" → "Create" → "Database"
   - Database name: `rtr_mrp`
   - Owner: `postgres`
   - Click "Save"

### Bước 4.4: Clone và Setup Project

```powershell
# Clone repository
cd C:\Projects
git clone https://github.com/linkk/lerp-mrp.git
cd lerp-mrp

# Cài dependencies
npm install

# Generate Prisma Client
npx prisma generate
```

### Bước 4.5: Cấu hình Environment

Tạo file `.env` trong thư mục `lerp-mrp`:

```env
# Database
DATABASE_URL="postgresql://postgres:postgres123@localhost:5432/rtr_mrp"

# NextAuth
NEXTAUTH_SECRET="your-super-secret-key-generate-with-openssl"
NEXTAUTH_URL="http://localhost:3000"

# App
NODE_ENV="development"
```

**Generate NEXTAUTH_SECRET**:
```powershell
# Mở PowerShell và chạy:
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

### Bước 4.6: Database Migration

```powershell
# Chạy migrations
npx prisma migrate deploy

# (Optional) Mở Prisma Studio để xem database
npx prisma studio
```

### Bước 4.7: Build và Chạy

```powershell
# Build production
npm run build

# Chạy production server
npm start

# HOẶC chạy development mode
npm run dev
```

---

## 5. KHỞI CHẠY ỨNG DỤNG

### Với Docker (Method A)

```powershell
# Khởi động
docker-compose up -d

# Dừng
docker-compose down

# Xem logs
docker-compose logs -f app

# Restart
docker-compose restart
```

### Với Native (Method B)

```powershell
# Development mode (có hot reload)
npm run dev

# Production mode
npm run build
npm start
```

### Tạo Shortcut khởi động

Tạo file `start-mrp.bat` trên Desktop:

```batch
@echo off
echo Starting L-ERP MRP System...
cd C:\Projects\lerp-mrp
npm start
pause
```

---

## 6. TRUY CẬP HỆ THỐNG

### URLs

| Page | URL |
|------|-----|
| **Landing Page** | http://localhost:3000 |
| **Dashboard** | http://localhost:3000/v2/dashboard |
| **Inventory** | http://localhost:3000/v2/inventory |
| **Sales Orders** | http://localhost:3000/v2/sales |
| **Production** | http://localhost:3000/v2/production |
| **Quality** | http://localhost:3000/v2/quality |
| **BOM** | http://localhost:3000/v2/bom |
| **Analytics** | http://localhost:3000/v2/analytics |
| **Settings** | http://localhost:3000/v2/settings |
| **Health Check** | http://localhost:3000/api/health |

### Database Access

**pgAdmin 4**:
- Host: `localhost`
- Port: `5432`
- Database: `rtr_mrp`
- Username: `postgres`
- Password: (password đã đặt khi cài)

**Prisma Studio** (GUI cho database):
```powershell
npx prisma studio
# Mở http://localhost:5555
```

---

## 7. TROUBLESHOOTING

### ❌ Lỗi: "Port 3000 already in use"

```powershell
# Tìm process đang dùng port 3000
netstat -ano | findstr :3000

# Kill process (thay PID bằng số tìm được)
taskkill /PID <PID> /F
```

### ❌ Lỗi: "Cannot connect to PostgreSQL"

1. Kiểm tra PostgreSQL service đang chạy:
   - Mở **Services** (services.msc)
   - Tìm "postgresql-x64-15"
   - Đảm bảo Status = "Running"

2. Kiểm tra firewall:
   - Windows Defender Firewall → Allow app through firewall
   - Thêm PostgreSQL nếu chưa có

### ❌ Lỗi: "Prisma migration failed"

```powershell
# Reset database (XÓA HẾT DỮ LIỆU!)
npx prisma migrate reset

# Hoặc force push schema
npx prisma db push --force-reset
```

### ❌ Lỗi: Docker "WSL 2 installation is incomplete"

1. Mở PowerShell as Administrator
2. Chạy: `wsl --install`
3. Restart máy
4. Mở Docker Desktop lại

### ❌ Lỗi: "EACCES permission denied"

```powershell
# Chạy PowerShell as Administrator
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

---

## 📞 HỖ TRỢ

Nếu gặp vấn đề:
1. Chụp màn hình lỗi
2. Copy log từ terminal
3. Gửi email: support@rtr.vn

---

## ✅ CHECKLIST CÀI ĐẶT

```
□ Cài Git
□ Cài Node.js 18.x
□ Cài PostgreSQL 15 (hoặc Docker)
□ Clone repository
□ Tạo file .env
□ Chạy npm install
□ Chạy prisma migrate
□ Build và start
□ Truy cập http://localhost:3000
□ Kiểm tra health check
```

---

**Version**: 1.0  
**Last Updated**: 2025-12-31  
**Author**: L-ERP MRP Team
