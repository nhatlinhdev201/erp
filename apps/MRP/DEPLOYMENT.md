# Huong Dan Triển Khai L-ERP-MRP (Hệ Thống Quản Lý Sản Xuất)

> Tài liệu dành cho phòng IT - Phiên bản cập nhật: 2026-03-14

---

## Mục lục

1. [Tổng quan ứng dụng](#1-tổng-quan-ứng-dụng)
2. [Yêu cầu hệ thống](#2-yêu-cầu-hệ-thống)
3. [Hướng dẫn cài đặt từng bước](#3-hướng-dẫn-cài-đặt-từng-bước)
4. [Cấu hình biến môi trường (.env)](#4-cấu-hình-biến-môi-trường-env)
5. [Hướng dẫn lấy API Keys](#5-hướng-dẫn-lấy-api-keys)
6. [Cài đặt ML Service (Python)](#6-cài-đặt-ml-service-python)
7. [Docker deployment](#7-docker-deployment)
8. [Chạy production với PM2](#8-chạy-production-với-pm2)
9. [Cấu hình Nginx](#9-cấu-hình-nginx)
10. [Backup & Monitoring](#10-backup--monitoring)
11. [Cập nhật ứng dụng](#11-cập-nhật-ứng-dụng)
12. [Xử lý sự cố](#12-xử-lý-sự-cố)
13. [Health Check](#13-health-check)

---

## 1. Tổng quan ứng dụng

### Mô tả

L-ERP-MRP là hệ thống **Quản lý Hoạch định Tài nguyên Sản xuất (Manufacturing Resource Planning)** được thiết kế chuyên biệt cho sản xuất product. Hệ thống giúp quản lý toàn bộ quy trình sản xuất từ quản lý nguyên vật liệu đến kiểm soát chất lượng.

### Tech Stack

| Thành phần       | Công nghệ                          |
|-------------------|-------------------------------------|
| Frontend          | Next.js 14, React, TypeScript       |
| Styling           | Tailwind CSS                        |
| Backend           | Next.js API Routes + Custom Server  |
| Realtime          | Socket.io (tích hợp trong server.ts)|
| Database          | PostgreSQL 15+ (Prisma ORM)         |
| Cache / Queue     | Redis 7+                            |
| ML Service        | Python FastAPI + scikit-learn        |
| AI/LLM            | Anthropic Claude, OpenAI GPT-4, Google Gemini |
| Authentication    | NextAuth.js                         |
| Containerization  | Docker + Docker Compose              |

### Tính năng chính

- **BOM (Bill of Materials):** Quản lý cấu trúc sản phẩm đa cấp, tính toán chi phí tự động
- **Inventory (Kho):** Theo dõi tồn kho thời gian thực, cảnh báo tồn kho thấp, quản lý nhiều kho
- **Work Orders (Lệnh sản xuất):** Tạo, theo dõi tiến độ sản xuất, gán nguồn lực
- **Quality NCR/CAPA:** Quản lý báo cáo không phù hợp (NCR) và hành động khắc phục (CAPA)
- **AI/ML Predictions:** Dự đoán nhu cầu, phân tích xu hướng, tối ưu hóa sản xuất
- **Real-time Socket.io:** Cập nhật dữ liệu thời gian thực không cần refresh trang
- **PWA Offline:** Hoạt động offline, đồng bộ khi có kết nối trở lại
- **Smart Import:** Nhập dữ liệu từ Excel/CSV với AI hỗ trợ mapping
- **Purchasing:** Quản lý đơn mua hàng, theo dõi nhà cung cấp
- **Dashboard:** Tổng quan sản xuất, biểu đồ Gantt, KPI

### Cấu trúc thư mục quan trọng

```
L-ERP-MRP/
  lerp-mrp/                  <-- THU MUC CHINH CHUA CODE UNG DUNG
    src/                    <-- Source code Next.js
    prisma/                 <-- Schema database & seed data
    server.ts               <-- Custom server (Socket.io)
    ml-service/             <-- Python ML microservice
    docker/                 <-- Dockerfile, Nginx config
    docker-compose.yml      <-- Docker Compose config
    scripts/                <-- Utility scripts
    backups/                <-- Database backups
```

> **LUU Y QUAN TRONG:** Toan bo code ung dung nam trong thu muc `lerp-mrp/`, KHONG phai o thu muc goc.

---

## 2. Yêu cầu hệ thống

### Phần cứng tối thiểu (Production)

| Thông số   | Tối thiểu      | Khuyến nghị      |
|------------|-----------------|-------------------|
| CPU        | 4 cores         | 8 cores           |
| RAM        | 8 GB            | 16 GB             |
| Disk       | 50 GB SSD       | 100 GB NVMe SSD   |
| Network    | 100 Mbps        | 1 Gbps            |

### Phần mềm bắt buộc

| Phần mềm          | Phiên bản tối thiểu | Kiểm tra                       |
|--------------------|----------------------|---------------------------------|
| Node.js            | 20.x LTS             | `node --version`               |
| npm                | 10.x                 | `npm --version`                |
| PostgreSQL         | 15+ (khuyến nghị 16) | `psql --version`               |
| Redis              | 7.x                  | `redis-server --version`       |
| Python             | 3.11+                | `python3 --version`            |
| Git                | 2.x                  | `git --version`                |
| Docker (tùy chọn)  | 24.x                 | `docker --version`             |
| Docker Compose     | 2.x                  | `docker compose version`       |

### Hệ điều hành hỗ trợ

- Ubuntu 22.04 LTS / 24.04 LTS (khuyến nghị)
- Debian 12+
- CentOS / RHEL 9+
- macOS 13+ (development)
- Windows Server 2022 + WSL2 (development)

---

## 3. Hướng dẫn cài đặt từng bước

### 3.1. Cài đặt thủ công (không Docker)

#### Bước 1: Clone repository

```bash
git clone <repository-url> /opt/lerp-mrp
cd /opt/lerp-mrp
```

#### Bước 2: Di chuyển vào thư mục ứng dụng

```bash
# LUU Y: Code nam trong thu muc lerp-mrp/
cd lerp-mrp
```

#### Bước 3: Cài đặt PostgreSQL

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install -y postgresql-16 postgresql-contrib-16

# Khởi động PostgreSQL
sudo systemctl enable postgresql
sudo systemctl start postgresql

# Tạo database và user
sudo -u postgres psql <<EOF
CREATE USER rtr WITH PASSWORD 'mat-khau-manh-cua-ban';
CREATE DATABASE rtr_mrp OWNER rtr;
GRANT ALL PRIVILEGES ON DATABASE rtr_mrp TO rtr;
\q
EOF
```

#### Bước 4: Cài đặt Redis

```bash
# Ubuntu/Debian
sudo apt install -y redis-server

# Cấu hình Redis
sudo sed -i 's/^# maxmemory .*/maxmemory 256mb/' /etc/redis/redis.conf
sudo sed -i 's/^# maxmemory-policy .*/maxmemory-policy allkeys-lru/' /etc/redis/redis.conf
sudo sed -i 's/^appendonly no/appendonly yes/' /etc/redis/redis.conf

sudo systemctl enable redis-server
sudo systemctl restart redis-server
```

#### Bước 5: Cấu hình biến môi trường

```bash
# Tao file .env tu template
cp .env.example .env

# Chinh sua file .env
nano .env
```

Xem chi tiết cấu hình tại [Mục 4](#4-cấu-hình-biến-môi-trường-env).

#### Bước 6: Cài đặt Node.js dependencies

```bash
npm ci --production=false
```

#### Bước 7: Khởi tạo database

```bash
# Tạo schema database
npx prisma generate
npx prisma db push

# (Tùy chọn) Seed dữ liệu mẫu
npx prisma db seed

# (Tùy chọn) Đảm bảo warehouses mặc định
npx tsx scripts/ensure-warehouses.ts
```

#### Bước 8: Build ứng dụng

```bash
npm run build
```

Lệnh này sẽ tự động:
1. Chạy `prisma generate` (tạo Prisma Client)
2. Chạy `prisma db push` (đồng bộ schema)
3. Chạy `ensure-warehouses.ts` (tạo kho mặc định)
4. Build Next.js (`next build`)
5. Compile TypeScript server (`tsc -p tsconfig.server.json`)

#### Bước 9: Khởi chạy ứng dụng

```bash
# Chạy production
npm run start
# Hoặc chỉ định port
PORT=3001 npm run start
```

Ứng dụng sẽ chạy tại `http://localhost:3001` (hoặc port bạn cấu hình).

---

## 4. Cấu hình biến môi trường (.env)

Tạo file `.env` trong thư mục `lerp-mrp/` với nội dung sau:

### 4.1. Cơ sở dữ liệu (BẮT BUỘC)

```env
# Connection string tới PostgreSQL
# Format: postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public
DATABASE_URL="postgresql://rtr:mat-khau-manh@localhost:5432/rtr_mrp?schema=public"

# Thông tin riêng lẻ (dùng cho Docker Compose)
POSTGRES_USER=rtr
POSTGRES_PASSWORD=mat-khau-manh-cua-ban
POSTGRES_DB=rtr_mrp
```

### 4.2. Authentication (BẮT BUỘC)

```env
# Secret key cho NextAuth - BẮT BUỘC phải thay đổi trong production
# Tạo bằng lệnh: openssl rand -base64 32
NEXTAUTH_SECRET="ket-qua-tu-lenh-openssl-rand"

# URL của ứng dụng - BẮT BUỘC đúng domain production
NEXTAUTH_URL="https://mrp.congty.vn"

# Auth secret (dùng chung giá trị với NEXTAUTH_SECRET)
AUTH_SECRET="ket-qua-tu-lenh-openssl-rand"
```

### 4.3. Redis (BẮT BUỘC)

```env
# Redis connection URL
REDIS_URL="redis://localhost:6379"

# Hoặc cấu hình riêng lẻ
REDIS_HOST="localhost"
REDIS_PORT="6379"
```

### 4.4. AI/LLM APIs (TUY CHON - cho tính năng dự đoán & phân tích thông minh)

```env
# Anthropic Claude AI - Cho phân tích thông minh, hỗ trợ quyết định
# Lấy tại: https://console.anthropic.com
ANTHROPIC_API_KEY="sk-ant-api03-..."

# OpenAI GPT-4 - Cho phân tích, dự đoán
# Lấy tại: https://platform.openai.com
OPENAI_API_KEY="sk-..."

# Google Gemini AI - Cho forecast, email parsing
# Lấy tại: https://aistudio.google.com
GOOGLE_AI_API_KEY="AIza..."
GEMINI_API_KEY="AIza..."
```

> **Lưu ý:** Các API key AI là TUY CHON. Ứng dụng vẫn hoạt động bình thường không có chúng, chỉ thiếu tính năng AI/dự đoán thông minh. Xem [Mục 5](#5-hướng-dẫn-lấy-api-keys) để biết cách lấy API keys.

### 4.5. ML Service

```env
# URL của Python ML microservice
# Mặc định: http://localhost:8000 (chạy thủ công)
# Docker: http://ml-service:8000
ML_SERVICE_URL="http://localhost:8000"
```

### 4.6. Email (TUY CHON)

```env
# SMTP Server
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="email@congty.vn"
SMTP_PASS="mat-khau-ung-dung"
SMTP_SECURE=true
SMTP_FROM="noreply@congty.vn"

# Hoặc dùng dịch vụ email chuyên dụng (chọn 1)
RESEND_API_KEY="re_..."
SENDGRID_API_KEY="SG...."

# Thông tin người gửi
EMAIL_FROM_ADDRESS="noreply@congty.vn"
EMAIL_FROM_NAME="L-ERP MRP"
EMAIL_PROVIDER="smtp"   # smtp | resend | sendgrid | ses
```

### 4.7. Monitoring

```env
# Sentry error tracking (TUY CHON - rất khuyến nghị cho production)
SENTRY_DSN="https://xxx@sentry.io/xxx"

# Mức độ log: debug, info, warn, error
LOG_LEVEL="info"
LOG_FORMAT="json"
```

### 4.8. Ứng dụng

```env
# Môi trường
NODE_ENV="production"

# Port ứng dụng
APP_PORT=3001
PORT=3001

# URL công khai của ứng dụng
NEXT_PUBLIC_APP_URL="https://mrp.congty.vn"

# Secret cho cron jobs (bảo vệ API cron khỏi truy cập trái phép)
# Tạo bằng: openssl rand -hex 32
CRON_SECRET="chuoi-ngau-nhien-dai"

# Tên service (cho logging)
SERVICE_NAME="lerp-mrp"

# Demo mode (tắt trong production)
NEXT_PUBLIC_DEMO_MODE=false
```

### 4.9. Docker Compose Ports

```env
# Các port cho Docker Compose (chỉ cần khi dùng Docker)
DB_PORT=5432
REDIS_PORT=6379
ML_SERVICE_PORT=8000
```

### 4.10. Backup

```env
# Số ngày giữ backup
BACKUP_RETENTION_DAYS=30
BACKUP_DIR="/var/backups/lerp-mrp"
```

### 4.11. AWS S3 (TUY CHON - lưu trữ file)

```env
AWS_REGION="ap-southeast-1"
AWS_ACCESS_KEY_ID="AKIA..."
AWS_SECRET_ACCESS_KEY="..."
S3_BUCKET="lerp-files-mrp"
```

### File .env mẫu hoàn chỉnh (Production)

```env
# === DATABASE (BAT BUOC) ===
DATABASE_URL="postgresql://rtr:MatKhauManh123!@localhost:5432/rtr_mrp?schema=public"
POSTGRES_USER=rtr
POSTGRES_PASSWORD=MatKhauManh123!
POSTGRES_DB=rtr_mrp

# === AUTH (BAT BUOC) ===
NEXTAUTH_SECRET="thay-bang-ket-qua-openssl-rand-base64-32"
NEXTAUTH_URL="https://mrp.congty.vn"
AUTH_SECRET="thay-bang-ket-qua-openssl-rand-base64-32"

# === REDIS (BAT BUOC) ===
REDIS_URL="redis://localhost:6379"
REDIS_HOST="localhost"
REDIS_PORT="6379"

# === APP ===
NODE_ENV=production
PORT=3001
APP_PORT=3001
NEXT_PUBLIC_APP_URL="https://mrp.congty.vn"
CRON_SECRET="thay-bang-ket-qua-openssl-rand-hex-32"
SERVICE_NAME=lerp-mrp
NEXT_PUBLIC_DEMO_MODE=false
LOG_LEVEL=info

# === ML SERVICE ===
ML_SERVICE_URL="http://localhost:8000"

# === AI (TUY CHON) ===
# ANTHROPIC_API_KEY="sk-ant-api03-..."
# OPENAI_API_KEY="sk-..."
# GOOGLE_AI_API_KEY="AIza..."

# === EMAIL (TUY CHON) ===
# SMTP_HOST="smtp.gmail.com"
# SMTP_PORT=587
# SMTP_USER="email@congty.vn"
# SMTP_PASS="mat-khau"

# === MONITORING (TUY CHON) ===
# SENTRY_DSN="https://xxx@sentry.io/xxx"

# === BACKUP ===
BACKUP_RETENTION_DAYS=30
```

---

## 5. Hướng dẫn lấy API Keys

### 5.1. Anthropic (Claude AI)

Claude AI được sử dụng cho các tính năng phân tích thông minh, hỗ trợ quyết định sản xuất.

**Bước 1:** Truy cập https://console.anthropic.com

**Bước 2:** Đăng ký tài khoản
- Click "Sign Up"
- Sử dụng email công ty (ví dụ: it@congty.vn)
- Xác nhận email và hoàn tất đăng ký

**Bước 3:** Tạo API Key
- Đăng nhập vào Console
- Vào menu **Settings** (biểu tượng bánh răng)
- Chọn **API Keys**
- Click **Create Key**
- Đặt tên key (ví dụ: "L-ERP-MRP Production")
- Copy key ngay lập tức (key chỉ hiển thị 1 lần!)

**Bước 4:** Lưu API Key
- Key có dạng: `sk-ant-api03-xxxxxxxxxxxx...`
- Dán vào file `.env` dòng `ANTHROPIC_API_KEY`

**Bước 5:** Thiết lập thanh toán
- Vào **Settings** -> **Billing**
- Thêm thẻ tín dụng hoặc phương thức thanh toán
- **Khuyến nghị:** Set spending limit $50/tháng ban đầu tại **Settings** -> **Limits**

**Chi phí tham khảo:**
- Claude Sonnet: ~$3/1M input tokens, ~$15/1M output tokens
- Với mức sử dụng MRP thông thường: ước tính $10-30/tháng

---

### 5.2. OpenAI (GPT-4)

GPT-4 được sử dụng cho phân tích dữ liệu, dự đoán, và xử lý ngôn ngữ tự nhiên.

**Bước 1:** Truy cập https://platform.openai.com

**Bước 2:** Đăng ký/Đăng nhập
- Click "Sign Up" hoặc "Log In"
- Có thể dùng Google account hoặc email

**Bước 3:** Tạo API Key
- Sau khi đăng nhập, vào **Dashboard**
- Click menu bên trái: **API Keys**
- Click **Create new secret key**
- Đặt tên key (ví dụ: "L-ERP-MRP")
- Chọn permissions: **All** (hoặc tùy chỉnh nếu cần)
- Click **Create secret key**
- Copy key ngay (key chỉ hiển thị 1 lần!)

**Bước 4:** Lưu API Key
- Key có dạng: `sk-proj-xxxxxxxxxxxx...`
- Dán vào file `.env` dòng `OPENAI_API_KEY`

**Bước 5:** Thiết lập thanh toán
- Vào **Settings** -> **Billing**
- Click **Add payment method**
- Thêm thẻ tín dụng
- **Khuyến nghị:** Vào **Settings** -> **Limits** -> Set monthly usage limit

**Chi phí tham khảo:**
- GPT-4o: ~$2.50/1M input tokens, ~$10/1M output tokens
- GPT-4o-mini: ~$0.15/1M input tokens, ~$0.60/1M output tokens
- Với mức sử dụng MRP thông thường: ước tính $5-20/tháng

---

### 5.3. Google AI (Gemini)

Google Gemini được sử dụng cho dự đoán nhu cầu (forecast) và phân tích email tự động.

**Bước 1:** Truy cập https://aistudio.google.com/apikey

**Bước 2:** Đăng nhập
- Sử dụng tài khoản Google (nên dùng Google Workspace của công ty)

**Bước 3:** Tạo API Key
- Click **Create API Key**
- Chọn Google Cloud project hiện có, hoặc click **Create API key in new project** để tạo project mới
- Đợi vài giây để hệ thống tạo key

**Bước 4:** Copy API Key
- Key có dạng: `AIzaSy...`
- Dán vào file `.env` cả hai dòng:
  - `GOOGLE_AI_API_KEY`
  - `GEMINI_API_KEY`
  (hai biến dùng chung giá trị)

**Bước 5:** Kiểm tra quota
- Truy cập https://console.cloud.google.com/apis/dashboard
- Chọn project vừa tạo
- Xem quota và usage

**Chi phí tham khảo:**
- Free tier: 15 requests/phút (RPM), đủ cho development và sử dụng nhẹ
- Gemini Flash: ~$0.075/1M tokens (rất rẻ)
- Gemini Pro: ~$1.25/1M input tokens, ~$5/1M output tokens
- Với mức sử dụng MRP thông thường: có thể miễn phí hoặc $1-5/tháng

---

### 5.4. Lưu ý chung về API Keys

| Quy tắc | Chi tiết |
|----------|----------|
| **KHONG commit vào git** | File `.env` đã có trong `.gitignore`. Tuyệt đối không push API keys lên repository |
| **Tách biệt môi trường** | Tạo API keys riêng cho Development, Staging, Production |
| **Monitor usage** | Kiểm tra chi phí hàng tuần/tháng trên dashboard của từng provider |
| **Set spending limits** | Luôn đặt giới hạn chi tiêu để tránh phát sinh ngoài dự kiến |
| **Rotate định kỳ** | Đổi API keys mỗi 3-6 tháng cho bảo mật |
| **Ít nhất 1 key** | Nên có ít nhất 1 AI API key (khuyến nghị Anthropic) để dùng tính năng AI |
| **Không bắt buộc** | Hệ thống MRP vẫn hoạt động đầy đủ mà không cần AI keys, chỉ thiếu tính năng dự đoán/phân tích thông minh |

---

## 6. Cài đặt ML Service (Python)

ML Service là microservice chạy riêng biệt, cung cấp các tính năng machine learning (dự đoán nhu cầu, phát hiện bất thường, tối ưu hóa).

### 6.1. Cài đặt thủ công

```bash
# Di chuyển vào thư mục ML service
cd /opt/lerp-mrp/lerp-mrp/ml-service

# Tạo Python virtual environment
python3 -m venv venv

# Kích hoạt virtual environment
source venv/bin/activate

# Cài đặt dependencies
pip install --upgrade pip
pip install -r requirements.txt

# Kiểm tra cài đặt
python -c "import fastapi; import sklearn; print('OK')"
```

### 6.2. Cấu hình ML Service

Tạo file `.env` trong thư mục `ml-service/`:

```env
DATABASE_URL="postgresql://rtr:mat-khau@localhost:5432/rtr_mrp"
MODEL_DIR="/opt/lerp-mrp/lerp-mrp/ml-service/models"
DEBUG=false
ALLOWED_ORIGINS="https://mrp.congty.vn,http://localhost:3001"
```

### 6.3. Chạy ML Service

```bash
# Development
cd /opt/lerp-mrp/lerp-mrp/ml-service
source venv/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

# Production (với workers)
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

### 6.4. Kiểm tra ML Service

```bash
# Health check
curl http://localhost:8000/health

# Kết quả mong đợi:
# {"status": "healthy", ...}
```

---

## 7. Docker Deployment

Docker là cách triển khai **khuyến nghị** cho production vì tự động hóa toàn bộ quá trình.

### 7.1. Chuẩn bị

```bash
# Di chuyển vào thư mục ứng dụng
cd /opt/lerp-mrp/lerp-mrp

# Tạo file .env (xem Muc 4 để điền đầy đủ)
cp .env.example .env
nano .env
```

### 7.2. Khởi chạy toàn bộ hệ thống

```bash
# Chạy tất cả services: App + PostgreSQL + Redis + ML Service
docker compose up -d

# Xem logs
docker compose logs -f

# Xem trạng thái
docker compose ps
```

### 7.3. Chạy với Nginx (khuyến nghị cho production)

```bash
# Bao gồm cả Nginx reverse proxy
docker compose --profile with-nginx up -d
```

### 7.4. Khởi tạo database lần đầu

```bash
# Chạy migration/push schema
docker compose exec app npx prisma db push

# (Tùy chọn) Seed dữ liệu mẫu
docker compose exec app npx prisma db seed

# (Tùy chọn) Thêm tài khoản demo
docker compose exec app npx tsx scripts/add-demo-user.ts
```

### 7.5. Backup database với Docker

```bash
# Chạy backup thủ công
docker compose --profile backup run --rm backup /scripts/backup-db.sh

# Kiểm tra file backup
ls -la backups/
```

### 7.6. Các lệnh Docker hữu ích

```bash
# Khởi động lại ứng dụng
docker compose restart app

# Dừng toàn bộ
docker compose down

# Dừng và xóa data (CẢNH BÁO: mất dữ liệu!)
docker compose down -v

# Rebuild image sau khi cập nhật code
docker compose build --no-cache app
docker compose up -d app

# Xem log của từng service
docker compose logs -f app
docker compose logs -f db
docker compose logs -f redis
docker compose logs -f ml-service

# Truy cập shell trong container
docker compose exec app sh
docker compose exec db psql -U rtr -d rtr_mrp
docker compose exec redis redis-cli
```

---

## 8. Chạy Production với PM2

PM2 là process manager cho Node.js, giúp ứng dụng chạy ổn định, tự khởi động lại khi crash.

### 8.1. Cài đặt PM2

```bash
npm install -g pm2
```

### 8.2. Tạo file cấu hình PM2

Tạo file `ecosystem.config.js` trong thư mục `lerp-mrp/`:

```javascript
module.exports = {
  apps: [
    {
      name: 'lerp-mrp-app',
      script: 'dist/server.js',
      cwd: '/opt/lerp-mrp/lerp-mrp',
      instances: 1,                    // Socket.io cần chạy 1 instance
      exec_mode: 'fork',              // fork mode cho Socket.io
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
      max_memory_restart: '1G',
      error_file: '/var/log/lerp-mrp/app-error.log',
      out_file: '/var/log/lerp-mrp/app-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      restart_delay: 5000,
      max_restarts: 10,
      min_uptime: '10s',
      watch: false,
    },
    {
      name: 'lerp-mrp-ml',
      script: 'venv/bin/uvicorn',
      args: 'app.main:app --host 0.0.0.0 --port 8000 --workers 2',
      cwd: '/opt/lerp-mrp/lerp-mrp/ml-service',
      interpreter: 'none',
      env: {
        DATABASE_URL: 'postgresql://rtr:mat-khau@localhost:5432/rtr_mrp',
        MODEL_DIR: '/opt/lerp-mrp/lerp-mrp/ml-service/models',
        DEBUG: 'false',
      },
      max_memory_restart: '512M',
      error_file: '/var/log/lerp-mrp/ml-error.log',
      out_file: '/var/log/lerp-mrp/ml-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      restart_delay: 5000,
      max_restarts: 10,
    },
  ],
};
```

### 8.3. Tạo thư mục log

```bash
sudo mkdir -p /var/log/lerp-mrp
sudo chown $USER:$USER /var/log/lerp-mrp
```

### 8.4. Khởi chạy với PM2

```bash
cd /opt/lerp-mrp/lerp-mrp

# Build ứng dụng trước
npm run build

# Khởi chạy
pm2 start ecosystem.config.js

# Lưu cấu hình để tự khởi động khi reboot
pm2 save

# Thiết lập tự khởi động khi server boot
pm2 startup systemd
# Chạy lệnh mà PM2 in ra (sudo env PATH=...)
```

### 8.5. Các lệnh PM2 hữu ích

```bash
# Xem trạng thái
pm2 status

# Xem logs
pm2 logs lerp-mrp-app
pm2 logs lerp-mrp-ml

# Khởi động lại
pm2 restart lerp-mrp-app
pm2 restart lerp-mrp-ml

# Xem metrics
pm2 monit

# Dừng
pm2 stop all

# Xóa khỏi PM2
pm2 delete all
```

---

## 9. Cấu hình Nginx

### 9.1. Cài đặt Nginx

```bash
sudo apt install -y nginx
sudo systemctl enable nginx
```

### 9.2. Cấu hình Nginx cho L-ERP-MRP

Tạo file `/etc/nginx/sites-available/lerp-mrp`:

```nginx
# Redirect HTTP -> HTTPS
server {
    listen 80;
    server_name mrp.congty.vn;
    return 301 https://$server_name$request_uri;
}

# Main HTTPS server
server {
    listen 443 ssl http2;
    server_name mrp.congty.vn;

    # SSL certificates (Let's Encrypt hoặc tự cấp)
    ssl_certificate     /etc/letsencrypt/live/mrp.congty.vn/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/mrp.congty.vn/privkey.pem;

    # SSL settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml text/javascript image/svg+xml;

    # Upload size limit
    client_max_body_size 50M;

    # Proxy timeouts
    proxy_connect_timeout 60s;
    proxy_send_timeout 60s;
    proxy_read_timeout 60s;

    # Next.js application (port 3001)
    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Socket.io WebSocket support
    location /api/socket {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 86400s;    # 24 giờ cho WebSocket
        proxy_send_timeout 86400s;
    }

    # ML Service API (nếu cần expose trực tiếp)
    location /ml-api/ {
        proxy_pass http://127.0.0.1:8000/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Static files caching
    location /_next/static/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_cache_valid 200 365d;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }

    # Favicon & robots
    location = /favicon.ico {
        proxy_pass http://127.0.0.1:3001;
        access_log off;
        log_not_found off;
    }

    # Logs
    access_log /var/log/nginx/lerp-mrp-access.log;
    error_log  /var/log/nginx/lerp-mrp-error.log;
}
```

### 9.3. Kích hoạt cấu hình

```bash
# Tạo symlink
sudo ln -s /etc/nginx/sites-available/lerp-mrp /etc/nginx/sites-enabled/

# Xóa cấu hình mặc định (nếu cần)
sudo rm -f /etc/nginx/sites-enabled/default

# Kiểm tra cấu hình
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

### 9.4. Cài đặt SSL với Let's Encrypt

```bash
# Cài certbot
sudo apt install -y certbot python3-certbot-nginx

# Tạo certificate (tạm thời comment block ssl trong nginx config)
sudo certbot --nginx -d mrp.congty.vn

# Tự động renew
sudo systemctl enable certbot.timer
```

---

## 10. Backup & Monitoring

### 10.1. Backup PostgreSQL

#### Backup thủ công

```bash
# Tạo thư mục backup
sudo mkdir -p /var/backups/lerp-mrp
sudo chown $USER:$USER /var/backups/lerp-mrp

# Backup full database
pg_dump -U rtr -h localhost -d rtr_mrp -Fc -f /var/backups/lerp-mrp/rtr_mrp_$(date +%Y%m%d_%H%M%S).dump

# Restore từ backup
pg_restore -U rtr -h localhost -d rtr_mrp --clean --if-exists /var/backups/lerp-mrp/rtr_mrp_20260314.dump
```

#### Backup tự động (cron)

```bash
# Mở crontab
crontab -e

# Thêm dòng sau (backup lúc 2:00 sáng mỗi ngày)
0 2 * * * pg_dump -U rtr -h localhost -d rtr_mrp -Fc -f /var/backups/lerp-mrp/rtr_mrp_$(date +\%Y\%m\%d).dump && find /var/backups/lerp-mrp -name "*.dump" -mtime +30 -delete
```

#### Backup với Docker

```bash
# Sử dụng service backup tích hợp
docker compose --profile backup run --rm backup /scripts/backup-db.sh
```

### 10.2. Backup Redis

```bash
# Redis tự động lưu snapshot (RDB) và append-only file (AOF)
# Backup thủ công:
redis-cli BGSAVE

# Copy file backup
cp /var/lib/redis/dump.rdb /var/backups/lerp-mrp/redis_$(date +%Y%m%d).rdb

# Cron job cho Redis backup (lúc 3:00 sáng)
0 3 * * * redis-cli BGSAVE && sleep 5 && cp /var/lib/redis/dump.rdb /var/backups/lerp-mrp/redis_$(date +\%Y\%m\%d).rdb
```

### 10.3. Monitoring với Sentry

1. Đăng ký tại https://sentry.io (có free tier)
2. Tạo project mới (chọn Next.js)
3. Copy DSN vào biến môi trường `SENTRY_DSN`
4. Sentry sẽ tự động bắt lỗi runtime và báo qua email

### 10.4. Monitoring hệ thống

#### Kiểm tra services

```bash
#!/bin/bash
# /opt/lerp-mrp/scripts/check-health.sh

echo "=== L-ERP-MRP Health Check ==="
echo ""

# App
echo -n "App (port 3001): "
curl -sf http://localhost:3001/api/health > /dev/null && echo "OK" || echo "FAIL"

# ML Service
echo -n "ML Service (port 8000): "
curl -sf http://localhost:8000/health > /dev/null && echo "OK" || echo "FAIL"

# PostgreSQL
echo -n "PostgreSQL: "
pg_isready -h localhost -U rtr > /dev/null 2>&1 && echo "OK" || echo "FAIL"

# Redis
echo -n "Redis: "
redis-cli ping > /dev/null 2>&1 && echo "OK" || echo "FAIL"

# Disk usage
echo ""
echo "=== Disk Usage ==="
df -h / | tail -1

# Memory
echo ""
echo "=== Memory ==="
free -h | head -2
```

```bash
chmod +x /opt/lerp-mrp/scripts/check-health.sh
```

#### Cron job kiểm tra sức khỏe (mỗi 5 phút)

```bash
# Crontab
*/5 * * * * /opt/lerp-mrp/scripts/check-health.sh >> /var/log/lerp-mrp/health.log 2>&1
```

### 10.5. Log rotation

Tạo file `/etc/logrotate.d/lerp-mrp`:

```
/var/log/lerp-mrp/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 root root
    sharedscripts
    postrotate
        pm2 reloadLogs > /dev/null 2>&1 || true
    endscript
}
```

---

## 11. Cập nhật ứng dụng

### 11.1. Quy trình cập nhật (không Docker)

```bash
cd /opt/lerp-mrp

# 1. Backup database trước khi cập nhật
pg_dump -U rtr -h localhost -d rtr_mrp -Fc -f /var/backups/lerp-mrp/pre-update_$(date +%Y%m%d_%H%M%S).dump

# 2. Pull code mới
git pull origin main

# 3. Di chuyển vào thư mục ứng dụng
cd lerp-mrp

# 4. Cài đặt dependencies mới
npm ci

# 5. Cập nhật database schema
npx prisma db push

# 6. Build lại ứng dụng
npm run build

# 7. Khởi động lại services
pm2 restart lerp-mrp-app

# 8. (Nếu ML service thay đổi)
cd ml-service
source venv/bin/activate
pip install -r requirements.txt
pm2 restart lerp-mrp-ml

# 9. Kiểm tra
curl http://localhost:3001/api/health
curl http://localhost:8000/health
```

### 11.2. Quy trình cập nhật (Docker)

```bash
cd /opt/lerp-mrp/lerp-mrp

# 1. Backup database
docker compose --profile backup run --rm backup /scripts/backup-db.sh

# 2. Pull code mới
cd /opt/lerp-mrp
git pull origin main
cd lerp-mrp

# 3. Rebuild và khởi động lại
docker compose build --no-cache app ml-service
docker compose up -d

# 4. Cập nhật database schema
docker compose exec app npx prisma db push

# 5. Kiểm tra
docker compose ps
docker compose logs --tail=50 app
```

### 11.3. Rollback khi có sự cố

```bash
# Nếu cập nhật thất bại, rollback:

# 1. Quay về code cũ
cd /opt/lerp-mrp
git log --oneline -5          # Xem lịch sử commit
git checkout <commit-hash>    # Quay về phiên bản cũ

# 2. Restore database
cd lerp-mrp
pg_restore -U rtr -h localhost -d rtr_mrp --clean --if-exists /var/backups/lerp-mrp/pre-update_YYYYMMDD.dump

# 3. Rebuild và khởi động lại
npm ci && npm run build
pm2 restart all
```

---

## 12. Xử lý sự cố

### 12.1. Bảng lỗi thường gặp

| Lỗi | Nguyên nhân | Cách khắc phục |
|------|-------------|----------------|
| `ECONNREFUSED 127.0.0.1:5432` | PostgreSQL chưa chạy | `sudo systemctl start postgresql` |
| `ECONNREFUSED 127.0.0.1:6379` | Redis chưa chạy | `sudo systemctl start redis-server` |
| `P1001: Can't reach database server` | Sai DATABASE_URL hoặc DB chưa chạy | Kiểm tra `.env` và trạng thái PostgreSQL |
| `P2002: Unique constraint failed` | Dữ liệu trùng lặp | Kiểm tra logic nghiệp vụ, không seed trùng |
| `NEXTAUTH_SECRET is not set` | Thiếu biến môi trường | Thêm `NEXTAUTH_SECRET` vào `.env` |
| `Error: ENOSPC` | Hết dung lượng ổ đĩa | Dọn log, xóa backup cũ: `df -h` |
| `Error: ENOMEM` | Hết bộ nhớ RAM | Tăng RAM hoặc tăng swap |
| `502 Bad Gateway` (Nginx) | App chưa chạy hoặc sai port | Kiểm tra PM2: `pm2 status`, kiểm tra port |
| `WebSocket connection failed` | Nginx chưa cấu hình WebSocket | Thêm block `/api/socket` trong Nginx (xem Mục 9) |
| `Module not found: prisma` | Chưa chạy `prisma generate` | `npx prisma generate` |
| `Port 3001 already in use` | Port đang bị chiếm | `lsof -i :3001` rồi `kill <PID>` |
| `ML service connection refused` | ML service chưa chạy | Kiểm tra: `curl http://localhost:8000/health` |
| `CORS error` | Frontend gọi sai domain | Kiểm tra `NEXT_PUBLIC_APP_URL` và `ALLOWED_ORIGINS` |
| `prisma db push` timeout | Database quá lớn hoặc kết nối chậm | Thêm `?connect_timeout=60` vào DATABASE_URL |
| Container `unhealthy` | Service bên trong container lỗi | `docker compose logs <service>` |
| `npm ci` thất bại | Node.js version sai hoặc thiếu `package-lock.json` | Kiểm tra `node --version`, đảm bảo có file lock |

### 12.2. Lệnh chẩn đoán

```bash
# Kiểm tra tất cả services
pm2 status

# Kiểm tra port đang sử dụng
sudo lsof -i -P -n | grep LISTEN

# Kiểm tra kết nối database
psql -U rtr -h localhost -d rtr_mrp -c "SELECT 1;"

# Kiểm tra Redis
redis-cli ping
redis-cli info memory

# Kiểm tra logs ứng dụng
pm2 logs lerp-mrp-app --lines 100

# Kiểm tra logs Nginx
sudo tail -50 /var/log/nginx/lerp-mrp-error.log

# Kiểm tra dung lượng ổ đĩa
df -h

# Kiểm tra bộ nhớ
free -h

# Kiểm tra CPU
top -bn1 | head -20

# Kiểm tra kết nối mạng
ss -tlnp

# Docker: kiểm tra chi tiết container
docker compose ps
docker compose logs --tail=100 app
docker inspect lerp-mrp-app | grep -A5 "Health"
```

### 12.3. Reset hoàn toàn database (CHỈ khi cần thiết)

```bash
# CẢNH BÁO: Lệnh này XÓA TOÀN BỘ DỮ LIỆU!
# Chỉ dùng khi cần thiết lập lại từ đầu.

cd /opt/lerp-mrp/lerp-mrp

# Backup trước
pg_dump -U rtr -h localhost -d rtr_mrp -Fc -f /var/backups/lerp-mrp/before-reset_$(date +%Y%m%d).dump

# Reset
npm run db:reset
# Lệnh này sẽ: force-reset schema + chạy seed data
```

---

## 13. Health Check

### 13.1. Endpoints kiểm tra sức khỏe

| Service      | URL                           | Method | Mô tả                          |
|-------------|-------------------------------|--------|----------------------------------|
| App         | `http://localhost:3001/api/health` | GET    | Kiểm tra Next.js app + DB + Redis |
| ML Service  | `http://localhost:8000/health`     | GET    | Kiểm tra ML FastAPI service       |

### 13.2. Kiểm tra App

```bash
curl -s http://localhost:3001/api/health | python3 -m json.tool
```

Kết quả mong đợi:
```json
{
  "status": "healthy",
  "timestamp": "2026-03-14T10:00:00.000Z",
  "services": {
    "database": "connected",
    "redis": "connected"
  }
}
```

### 13.3. Kiểm tra ML Service

```bash
curl -s http://localhost:8000/health | python3 -m json.tool
```

Kết quả mong đợi:
```json
{
  "status": "healthy",
  "database": "connected",
  "models_loaded": true
}
```

### 13.4. Script kiểm tra toàn diện

```bash
#!/bin/bash
# Kiểm tra toàn bộ hệ thống L-ERP-MRP
# Sử dụng: bash check-all.sh

RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'

echo "============================================"
echo "  L-ERP-MRP System Health Check"
echo "  $(date '+%Y-%m-%d %H:%M:%S')"
echo "============================================"

check() {
    local name=$1
    local cmd=$2
    echo -n "  $name: "
    if eval "$cmd" > /dev/null 2>&1; then
        echo -e "${GREEN}OK${NC}"
    else
        echo -e "${RED}FAIL${NC}"
    fi
}

echo ""
echo "[Services]"
check "PostgreSQL" "pg_isready -h localhost -U rtr"
check "Redis" "redis-cli ping"
check "App (3001)" "curl -sf http://localhost:3001/api/health"
check "ML Service (8000)" "curl -sf http://localhost:8000/health"
check "Nginx" "curl -sf http://localhost:80"

echo ""
echo "[Resources]"
echo "  Disk: $(df -h / | tail -1 | awk '{print $5 " used (" $4 " free)"}')"
echo "  Memory: $(free -h | awk '/^Mem:/{print $3 "/" $2 " used"}')"
echo "  Load: $(uptime | awk -F'load average:' '{print $2}')"

echo ""
echo "[Database]"
echo "  Size: $(psql -U rtr -h localhost -d rtr_mrp -t -c "SELECT pg_size_pretty(pg_database_size('rtr_mrp'));" 2>/dev/null || echo 'N/A')"

echo ""
echo "============================================"
```

### 13.5. Monitoring tự động với cron

```bash
# Crontab: kiểm tra mỗi 5 phút, gửi email nếu có lỗi
*/5 * * * * curl -sf http://localhost:3001/api/health > /dev/null || echo "L-ERP-MRP App DOWN at $(date)" | mail -s "ALERT: L-ERP-MRP" it@congty.vn
*/5 * * * * curl -sf http://localhost:8000/health > /dev/null || echo "L-ERP-MRP ML Service DOWN at $(date)" | mail -s "ALERT: ML Service" it@congty.vn
```

---

## Phụ lục: Tóm tắt các port

| Service        | Port | Giao thức      |
|----------------|------|----------------|
| Next.js App    | 3001 | HTTP + WebSocket |
| ML Service     | 8000 | HTTP            |
| PostgreSQL     | 5432 | TCP             |
| Redis          | 6379 | TCP             |
| Nginx          | 80   | HTTP            |
| Nginx SSL      | 443  | HTTPS           |

## Phụ lục: Firewall (UFW)

```bash
# Cho phép SSH
sudo ufw allow 22/tcp

# Cho phép HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# KHÔNG mở port 3001, 5432, 6379, 8000 ra ngoài
# Các port nội bộ chỉ truy cập qua Nginx

# Kích hoạt firewall
sudo ufw enable
sudo ufw status
```

---

> Tài liệu được tạo cho phòng IT - L-ERP-MRP v0.1.0
> Cập nhật lần cuối: 2026-03-14
