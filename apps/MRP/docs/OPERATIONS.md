# L-ERP MRP System - Operations Runbook

## Daily Operations

### Health Check

```bash
# Quick health check
curl -s http://localhost:3000/api/health | jq

# Expected output
{
  "status": "healthy",
  "checks": {
    "database": { "status": "pass" },
    "cache": { "status": "pass" }
  }
}
```

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f app
docker-compose logs -f db
docker-compose logs -f redis

# Last N lines
docker-compose logs --tail=100 app
```

### Check Resource Usage

```bash
# Container stats
docker stats

# Disk usage
docker system df
df -h
```

## Backup Procedures

### Manual Backup

```bash
./scripts/backup/backup-db.sh manual-$(date +%Y%m%d)
```

### Verify Backup

```bash
# List backups
ls -la backups/

# Test backup integrity
gunzip -t backups/latest.sql.gz
```

### Restore from Backup

```bash
# Interactive restore
./scripts/backup/restore-db.sh backups/backup-20240115.dump

# From SQL file
gunzip -c backups/backup-20240115.sql.gz | docker-compose exec -T db psql -U rtr -d rtr_mrp
```

## Common Tasks

### Restart Services

```bash
# Restart all
docker-compose restart

# Restart specific service
docker-compose restart app
```

### Clear Cache

```bash
./scripts/maintenance/clear-cache.sh
```

### Run Database Migration

```bash
docker-compose exec app npx prisma migrate deploy
```

### Access Database

```bash
# PostgreSQL CLI
docker-compose exec db psql -U rtr -d rtr_mrp

# Run SQL query
docker-compose exec db psql -U rtr -d rtr_mrp -c "SELECT COUNT(*) FROM users"
```

### Access Redis

```bash
docker-compose exec redis redis-cli

# Check memory
docker-compose exec redis redis-cli INFO memory
```

## Common Issues

### Application Not Starting

1. **Check logs:**
   ```bash
   docker-compose logs app
   ```

2. **Check database connection:**
   ```bash
   docker-compose exec app npx prisma db execute --stdin <<< "SELECT 1"
   ```

3. **Check environment variables:**
   ```bash
   docker-compose exec app env | grep -E "(DATABASE|REDIS|NEXTAUTH)"
   ```

4. **Restart services:**
   ```bash
   docker-compose restart
   ```

### Database Issues

1. **Check PostgreSQL status:**
   ```bash
   docker-compose exec db pg_isready
   ```

2. **Check connections:**
   ```bash
   docker-compose exec db psql -U rtr -d rtr_mrp -c "SELECT count(*) FROM pg_stat_activity"
   ```

3. **Vacuum database (maintenance):**
   ```bash
   docker-compose exec db vacuumdb -U rtr -d rtr_mrp --analyze
   ```

### High Memory Usage

1. **Check container memory:**
   ```bash
   docker stats --no-stream
   ```

2. **Clear Redis cache:**
   ```bash
   docker-compose exec redis redis-cli FLUSHALL
   ```

3. **Restart application:**
   ```bash
   docker-compose restart app
   ```

### Slow Performance

1. **Check database slow queries:**
   ```bash
   docker-compose exec db psql -U rtr -d rtr_mrp -c "
     SELECT pid, now() - pg_stat_activity.query_start AS duration, query
     FROM pg_stat_activity
     WHERE state = 'active' AND now() - pg_stat_activity.query_start > interval '5 seconds'
   "
   ```

2. **Check Redis memory:**
   ```bash
   docker-compose exec redis redis-cli INFO memory
   ```

3. **Check disk I/O:**
   ```bash
   iostat -x 1 5
   ```

## Emergency Procedures

### Complete System Restart

```bash
docker-compose down
docker-compose up -d
```

### Database Recovery

```bash
# Stop app to prevent writes
docker-compose stop app

# Restore from backup
./scripts/backup/restore-db.sh backups/latest.dump

# Start app
docker-compose start app
```

### Rollback Deployment

```bash
./scripts/deploy/rollback.sh
```

## Monitoring Alerts

### Set Up Uptime Monitoring

1. Configure health check endpoint: `https://mrp.yourcompany.com/api/health`
2. Alert if:
   - Response time > 5 seconds
   - Status code != 200
   - `status` != "healthy"

### Log Alerts

Monitor logs for:
- `[ERROR]` entries
- `status: 500` responses
- `Rate limit exceeded` messages

## Contact Information

- **On-call**: [Your contact information]
- **Escalation**: [Manager contact]
- **Vendor Support**: [If applicable]
