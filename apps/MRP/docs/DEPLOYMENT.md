# L-ERP MRP System - Deployment Guide

## Prerequisites

- Docker & Docker Compose installed (v20.10+)
- Git access to repository
- Server with minimum 2GB RAM, 20GB disk
- Domain name (optional, for SSL)

## Quick Start

### 1. Clone Repository

```bash
git clone https://github.com/your-org/lerp-mrp.git
cd lerp-mrp
```

### 2. Configure Environment

```bash
cp .env.example .env
nano .env
```

**Required variables:**

| Variable | Description | Example |
|----------|-------------|---------|
| `POSTGRES_PASSWORD` | Strong database password | `SecureP@ssw0rd!` |
| `NEXTAUTH_SECRET` | Session encryption key | Generate with `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Application URL | `https://mrp.yourcompany.com` |

### 3. Start Services

```bash
cd docker
docker-compose up -d
```

### 4. Run Migrations

```bash
docker-compose exec app npx prisma migrate deploy
```

### 5. Seed Initial Data (Optional)

```bash
docker-compose exec app npx prisma db seed
```

### 6. Verify Deployment

```bash
curl http://localhost:3000/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "version": "1.0.0",
  "uptime": 120,
  "checks": {
    "database": { "status": "pass", "latency": 5 },
    "cache": { "status": "pass", "latency": 2 }
  }
}
```

## Production Deployment

### SSL Setup with Let's Encrypt

```bash
# Install certbot
apt install certbot

# Generate certificate
certbot certonly --standalone -d mrp.yourcompany.com

# Copy to nginx ssl directory
cp /etc/letsencrypt/live/mrp.yourcompany.com/fullchain.pem docker/nginx/ssl/
cp /etc/letsencrypt/live/mrp.yourcompany.com/privkey.pem docker/nginx/ssl/

# Start with nginx profile
docker-compose --profile with-nginx up -d
```

### Environment Variables (Production)

```bash
# Core
NODE_ENV=production
APP_PORT=3000

# Database
POSTGRES_USER=rtr
POSTGRES_PASSWORD=<strong-password>
POSTGRES_DB=rtr_mrp
DATABASE_URL=postgresql://rtr:<password>@db:5432/rtr_mrp

# Redis
REDIS_URL=redis://redis:6379

# Authentication
NEXTAUTH_URL=https://mrp.yourcompany.com
NEXTAUTH_SECRET=<generated-secret>

# Monitoring (optional)
SENTRY_DSN=https://xxx@sentry.io/xxx
LOG_LEVEL=info

# Backup
BACKUP_RETENTION_DAYS=30
```

## Updating

### Standard Update

```bash
./scripts/deploy/deploy.sh
```

This script will:
1. Pull latest code
2. Create pre-deploy backup
3. Update containers
4. Run migrations
5. Verify health

### Rollback

If deployment fails:

```bash
./scripts/deploy/rollback.sh
```

## Scaling

### Horizontal Scaling (Multiple App Instances)

Update `docker-compose.yml`:

```yaml
app:
  deploy:
    replicas: 3
```

Or use Docker Swarm/Kubernetes for production scaling.

### Database Scaling

For high-traffic production:
1. Use managed PostgreSQL (AWS RDS, Google Cloud SQL)
2. Configure connection pooling with PgBouncer
3. Set up read replicas

## Monitoring

### Health Endpoints

- **Liveness**: `HEAD /api/health` - Returns 200 if app is running
- **Readiness**: `OPTIONS /api/health` - Returns 200 if database is connected
- **Full check**: `GET /api/health` - Returns detailed health status

### Logs

```bash
# View all logs
docker-compose logs -f

# View specific service
docker-compose logs -f app

# View last 100 lines
docker-compose logs --tail=100 app
```

### Metrics

Configure `SENTRY_DSN` for error tracking and performance monitoring.

## Troubleshooting

See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for common issues and solutions.
