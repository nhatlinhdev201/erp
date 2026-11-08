# Setup Guide | Hướng dẫn Cài đặt

> Installation and configuration guide for L-ERP MRP System  
> Hướng dẫn cài đặt và cấu hình Hệ thống L-ERP MRP

---

## Table of Contents | Mục lục

- [Prerequisites | Yêu cầu hệ thống](#prerequisites--yêu-cầu-hệ-thống)
- [Installation | Cài đặt](#installation--cài-đặt)
- [Configuration | Cấu hình](#configuration--cấu-hình)
- [Database Setup | Thiết lập Database](#database-setup--thiết-lập-database)
- [Running the Application | Chạy ứng dụng](#running-the-application--chạy-ứng-dụng)
- [Docker Setup | Thiết lập Docker](#docker-setup--thiết-lập-docker)
- [Production Deployment | Triển khai Production](#production-deployment--triển-khai-production)
- [Troubleshooting | Xử lý sự cố](#troubleshooting--xử-lý-sự-cố)

---

## Prerequisites | Yêu cầu hệ thống

### Required Software | Phần mềm yêu cầu

| Software | Version | Download |
|----------|---------|----------|
| Node.js | ≥ 18.0.0 | [nodejs.org](https://nodejs.org) |
| npm | ≥ 9.0.0 | Included with Node.js |
| PostgreSQL | ≥ 14.0 | [postgresql.org](https://postgresql.org) |
| Git | ≥ 2.0 | [git-scm.com](https://git-scm.com) |

### Optional Software | Phần mềm tùy chọn

| Software | Version | Purpose | Mục đích |
|----------|---------|---------|----------|
| Docker | ≥ 20.0 | Containerization | Container hóa |
| Docker Compose | ≥ 2.0 | Multi-container | Đa container |
| Redis | ≥ 6.0 | Caching (optional) | Bộ nhớ đệm |

### System Requirements | Yêu cầu phần cứng

| Requirement | Minimum | Recommended |
|-------------|---------|-------------|
| CPU | 2 cores | 4 cores |
| RAM | 4 GB | 8 GB |
| Storage | 10 GB | 50 GB SSD |

---

## Installation | Cài đặt

### Step 1: Clone Repository | Bước 1: Clone kho mã nguồn

```bash
# Clone via HTTPS | Clone qua HTTPS
git clone https://github.com/rtr/mrp-system.git

# Or clone via SSH | Hoặc clone qua SSH
git clone git@github.com:rtr/mrp-system.git

# Navigate to project directory | Di chuyển vào thư mục dự án
cd mrp-system
```

### Step 2: Install Dependencies | Bước 2: Cài đặt thư viện

```bash
# Using npm | Sử dụng npm
npm install

# Or using yarn | Hoặc sử dụng yarn
yarn install

# Or using pnpm | Hoặc sử dụng pnpm
pnpm install
```

### Step 3: Setup Environment | Bước 3: Thiết lập môi trường

```bash
# Copy environment template | Sao chép mẫu môi trường
cp .env.example .env.local

# Edit environment file | Chỉnh sửa file môi trường
nano .env.local
# or | hoặc
code .env.local
```

---

## Configuration | Cấu hình

### Environment Variables | Biến môi trường

Create `.env.local` file with the following variables:  
Tạo file `.env.local` với các biến sau:

```bash
# =============================================================================
# DATABASE | CƠ SỞ DỮ LIỆU
# =============================================================================

# PostgreSQL connection string
# Chuỗi kết nối PostgreSQL
DATABASE_URL="postgresql://username:password@localhost:5432/rtr_mrp"

# =============================================================================
# AUTHENTICATION | XÁC THỰC
# =============================================================================

# Secret key for JWT tokens (generate with: openssl rand -base64 32)
# Khóa bí mật cho JWT token
NEXTAUTH_SECRET="your-secret-key-here"

# Application URL
# URL ứng dụng
NEXTAUTH_URL="http://localhost:3000"

# =============================================================================
# API CONFIGURATION | CẤU HÌNH API
# =============================================================================

# API base URL
# URL cơ sở API
API_BASE_URL="http://localhost:3000/api/v2"

# API rate limit (requests per minute)
# Giới hạn tốc độ API (yêu cầu mỗi phút)
API_RATE_LIMIT="100"

# =============================================================================
# FEATURES | TÍNH NĂNG
# =============================================================================

# Enable AI Copilot
# Bật Trợ lý AI
ENABLE_AI_COPILOT="true"

# Enable push notifications
# Bật thông báo đẩy
ENABLE_PUSH_NOTIFICATIONS="false"

# VAPID keys for push notifications (optional)
# Khóa VAPID cho thông báo đẩy
NEXT_PUBLIC_VAPID_PUBLIC_KEY=""
VAPID_PRIVATE_KEY=""

# =============================================================================
# LOGGING | GHI LOG
# =============================================================================

# Log level: debug, info, warn, error
# Mức log
LOG_LEVEL="info"

# Enable audit logging
# Bật ghi log kiểm toán
ENABLE_AUDIT_LOG="true"

# =============================================================================
# OPTIONAL SERVICES | DỊCH VỤ TÙY CHỌN
# =============================================================================

# Redis URL (for caching)
# URL Redis (cho bộ nhớ đệm)
REDIS_URL="redis://localhost:6379"

# Email service (for notifications)
# Dịch vụ email
SMTP_HOST=""
SMTP_PORT=""
SMTP_USER=""
SMTP_PASSWORD=""
```

### Generating Secrets | Tạo khóa bí mật

```bash
# Generate NEXTAUTH_SECRET
# Tạo NEXTAUTH_SECRET
openssl rand -base64 32

# Generate VAPID keys (for push notifications)
# Tạo khóa VAPID (cho thông báo đẩy)
npx web-push generate-vapid-keys
```

---

## Database Setup | Thiết lập Database

### Option 1: Local PostgreSQL | PostgreSQL cục bộ

#### macOS (using Homebrew)

```bash
# Install PostgreSQL | Cài đặt PostgreSQL
brew install postgresql@14

# Start service | Khởi động dịch vụ
brew services start postgresql@14

# Create database | Tạo database
createdb rtr_mrp

# Create user | Tạo user
createuser -P rtr_user
# Enter password when prompted | Nhập mật khẩu khi được hỏi
```

#### Ubuntu/Debian

```bash
# Install PostgreSQL | Cài đặt PostgreSQL
sudo apt update
sudo apt install postgresql postgresql-contrib

# Start service | Khởi động dịch vụ
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database and user | Tạo database và user
sudo -u postgres psql
```

```sql
-- In PostgreSQL shell | Trong shell PostgreSQL
CREATE USER rtr_user WITH PASSWORD 'your_password';
CREATE DATABASE rtr_mrp OWNER rtr_user;
GRANT ALL PRIVILEGES ON DATABASE rtr_mrp TO rtr_user;
\q
```

#### Windows

1. Download PostgreSQL installer from [postgresql.org](https://www.postgresql.org/download/windows/)
2. Run installer and follow prompts
3. Use pgAdmin to create database `rtr_mrp`

### Option 2: Docker PostgreSQL | PostgreSQL với Docker

```bash
# Create and start PostgreSQL container
# Tạo và khởi động container PostgreSQL
docker run -d \
  --name rtr-postgres \
  -e POSTGRES_USER=rtr_user \
  -e POSTGRES_PASSWORD=your_password \
  -e POSTGRES_DB=rtr_mrp \
  -p 5432:5432 \
  -v rtr_postgres_data:/var/lib/postgresql/data \
  postgres:14-alpine

# Check container is running | Kiểm tra container đang chạy
docker ps
```

### Run Migrations | Chạy Migration

```bash
# Generate Prisma client | Tạo Prisma client
npx prisma generate

# Run migrations | Chạy migration
npx prisma migrate dev

# Seed database with sample data | Seed dữ liệu mẫu
npx prisma db seed
```

### Verify Database | Xác minh Database

```bash
# Open Prisma Studio | Mở Prisma Studio
npx prisma studio
# Opens browser at http://localhost:5555
```

---

## Running the Application | Chạy ứng dụng

### Development Mode | Chế độ phát triển

```bash
# Start development server | Khởi động server phát triển
npm run dev

# Server runs at | Server chạy tại
# http://localhost:3000
```

### Production Mode | Chế độ production

```bash
# Build application | Build ứng dụng
npm run build

# Start production server | Khởi động server production
npm run start

# Or with PM2 | Hoặc với PM2
pm2 start npm --name "lerp-mrp" -- start
```

### Available Scripts | Các script có sẵn

| Script | Description | Mô tả |
|--------|-------------|-------|
| `npm run dev` | Start dev server | Khởi động server dev |
| `npm run build` | Build for production | Build cho production |
| `npm run start` | Start production server | Khởi động server production |
| `npm run lint` | Run ESLint | Chạy ESLint |
| `npm run test` | Run tests | Chạy test |
| `npm run test:coverage` | Run tests with coverage | Chạy test với coverage |

---

## Docker Setup | Thiết lập Docker

### Using Docker Compose | Sử dụng Docker Compose

Create `docker-compose.yml`:  
Tạo file `docker-compose.yml`:

```yaml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://rtr_user:password@db:5432/rtr_mrp
      - NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
      - NEXTAUTH_URL=http://localhost:3000
    depends_on:
      - db
    restart: unless-stopped

  db:
    image: postgres:14-alpine
    environment:
      - POSTGRES_USER=rtr_user
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB=rtr_mrp
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
```

### Start Services | Khởi động dịch vụ

```bash
# Start all services | Khởi động tất cả dịch vụ
docker-compose up -d

# View logs | Xem log
docker-compose logs -f

# Stop services | Dừng dịch vụ
docker-compose down

# Stop and remove volumes | Dừng và xóa volume
docker-compose down -v
```

---

## Production Deployment | Triển khai Production

### Environment Setup | Thiết lập môi trường

1. Set `NODE_ENV=production`
2. Use secure `NEXTAUTH_SECRET`
3. Configure proper `DATABASE_URL`
4. Enable HTTPS
5. Set up reverse proxy (nginx)

### Nginx Configuration | Cấu hình Nginx

```nginx
server {
    listen 80;
    server_name mrp.rtr.vn;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name mrp.rtr.vn;

    ssl_certificate /etc/letsencrypt/live/mrp.rtr.vn/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/mrp.rtr.vn/privkey.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### PM2 Process Manager

```bash
# Install PM2 | Cài đặt PM2
npm install -g pm2

# Start application | Khởi động ứng dụng
pm2 start npm --name "lerp-mrp" -- start

# Save process list | Lưu danh sách process
pm2 save

# Setup startup script | Thiết lập script khởi động
pm2 startup

# Monitor | Giám sát
pm2 monit
```

---

## Troubleshooting | Xử lý sự cố

### Common Issues | Vấn đề thường gặp

#### Database Connection Error | Lỗi kết nối Database

```
Error: Can't reach database server at `localhost`:`5432`
```

**Solution | Giải pháp:**

```bash
# Check if PostgreSQL is running | Kiểm tra PostgreSQL đang chạy
sudo systemctl status postgresql

# Start if not running | Khởi động nếu chưa chạy
sudo systemctl start postgresql

# Check connection string | Kiểm tra chuỗi kết nối
echo $DATABASE_URL
```

#### Port Already in Use | Port đã được sử dụng

```
Error: Port 3000 is already in use
```

**Solution | Giải pháp:**

```bash
# Find process using port | Tìm process sử dụng port
lsof -i :3000

# Kill process | Dừng process
kill -9 <PID>

# Or use different port | Hoặc dùng port khác
PORT=3001 npm run dev
```

#### Prisma Client Error | Lỗi Prisma Client

```
Error: @prisma/client did not initialize yet
```

**Solution | Giải pháp:**

```bash
# Regenerate Prisma client | Tạo lại Prisma client
npx prisma generate

# If still failing, clear node_modules | Nếu vẫn lỗi, xóa node_modules
rm -rf node_modules
npm install
npx prisma generate
```

#### Build Errors | Lỗi Build

```
Error: Cannot find module 'X'
```

**Solution | Giải pháp:**

```bash
# Clear cache and reinstall | Xóa cache và cài lại
rm -rf .next
rm -rf node_modules
npm install
npm run build
```

### Getting Help | Nhận trợ giúp

| Channel | Link | Description |
|---------|------|-------------|
| 📖 Documentation | [docs/](.) | Full documentation |
| 🐛 GitHub Issues | [Issues](https://github.com/rtr/mrp-system/issues) | Report bugs |
| 💬 Discussions | [Discussions](https://github.com/rtr/mrp-system/discussions) | Ask questions |
| 📧 Email | support@rtr.vn | Direct support |

---

<p align="center">
  <em>Need help? Contact us at support@rtr.vn</em><br>
  <em>Cần hỗ trợ? Liên hệ chúng tôi tại support@rtr.vn</em>
</p>
