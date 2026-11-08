# L-ERP MRP System - Backup & Restore Procedures

## Overview

The L-ERP MRP System uses automated daily backups with a 30-day retention policy. Backups are stored locally and can optionally be uploaded to S3/cloud storage.

## Backup Types

| Type | Format | Use Case |
|------|--------|----------|
| `.dump` | PostgreSQL custom format | Fast restore, compressed |
| `.sql.gz` | Gzipped SQL | Portable, human-readable |

## Automated Backups

### Schedule

- **Daily backup**: 2:00 AM UTC (via GitHub Actions)
- **Retention**: 30 days
- **Pre-deploy backup**: Before each deployment

### Configuration

Edit `.env` to configure:

```bash
BACKUP_RETENTION_DAYS=30
```

## Manual Backup

### Create Backup

```bash
# Default name (backup-YYYYMMDD-HHMMSS)
./scripts/backup/backup-db.sh

# Custom name
./scripts/backup/backup-db.sh my-backup-name
```

### Backup Output

```
========================================
  L-ERP MRP Database Backup
========================================
Backup name: backup-20240115-103045
Target dir: /opt/lerp-mrp/backups

Creating backup...
Creating SQL backup...

========================================
  Backup completed successfully!
========================================
Files created:
  - backup-20240115-103045.dump (15M)
  - backup-20240115-103045.sql.gz (12M)
```

## Restore Procedures

### List Available Backups

```bash
ls -la backups/
```

### Restore from Backup

```bash
# Interactive restore (recommended)
./scripts/backup/restore-db.sh backups/backup-20240115-103045.dump
```

### Restore Confirmation

The restore script will:
1. Show backup details
2. Ask for confirmation
3. Create backup of current state
4. Restore the selected backup

### Manual Restore

For SQL backups:

```bash
# Stop application first
docker-compose stop app

# Restore
gunzip -c backups/backup-20240115.sql.gz | docker-compose exec -T db psql -U rtr -d rtr_mrp

# Start application
docker-compose start app
```

## Point-in-Time Recovery

For production systems requiring point-in-time recovery:

1. Enable WAL archiving in PostgreSQL
2. Configure continuous archiving
3. Use `pg_basebackup` for base backups

## Backup Verification

### Test Backup Integrity

```bash
# Test gzip integrity
gunzip -t backups/backup-20240115.sql.gz

# Verify dump format
pg_restore --list backups/backup-20240115.dump > /dev/null
```

### Restore to Test Environment

```bash
# Create test database
docker-compose exec db createdb -U rtr rtr_mrp_test

# Restore to test
pg_restore -U rtr -d rtr_mrp_test backups/backup-20240115.dump

# Verify data
docker-compose exec db psql -U rtr -d rtr_mrp_test -c "SELECT COUNT(*) FROM products"

# Cleanup
docker-compose exec db dropdb -U rtr rtr_mrp_test
```

## Cloud Backup (Optional)

### AWS S3

1. Configure AWS credentials:
   ```bash
   AWS_ACCESS_KEY_ID=your-access-key
   AWS_SECRET_ACCESS_KEY=your-secret-key
   AWS_S3_BUCKET=your-backup-bucket
   AWS_REGION=us-east-1
   ```

2. Run S3 backup:
   ```bash
   ./scripts/backup/backup-to-s3.sh
   ```

### Backup-to-S3 Script

Create `scripts/backup/backup-to-s3.sh`:

```bash
#!/bin/bash
set -e

BACKUP_DIR="${BACKUP_DIR:-/opt/lerp-mrp/backups}"
LATEST_BACKUP=$(ls -t "$BACKUP_DIR"/*.dump | head -1)

if [ -z "$AWS_S3_BUCKET" ]; then
  echo "AWS_S3_BUCKET not configured"
  exit 1
fi

aws s3 cp "$LATEST_BACKUP" "s3://$AWS_S3_BUCKET/backups/$(basename $LATEST_BACKUP)"
aws s3 cp "${LATEST_BACKUP%.dump}.sql.gz" "s3://$AWS_S3_BUCKET/backups/"

echo "Backup uploaded to S3"
```

## Disaster Recovery

### Recovery Time Objective (RTO)

- Target: < 1 hour
- Typical restore time: 10-30 minutes

### Recovery Point Objective (RPO)

- Daily backups: Up to 24 hours data loss
- With WAL archiving: Minutes of data loss

### Disaster Recovery Steps

1. **Assess situation**
   - Identify cause of failure
   - Determine last known good backup

2. **Provision new environment**
   ```bash
   git clone https://github.com/your-org/lerp-mrp.git
   cd lerp-mrp
   docker-compose up -d db redis
   ```

3. **Restore backup**
   ```bash
   ./scripts/backup/restore-db.sh backups/latest.dump
   ```

4. **Start application**
   ```bash
   docker-compose up -d app
   ```

5. **Verify**
   ```bash
   curl http://localhost:3000/api/health
   ```

## Troubleshooting

### Backup Failed

1. Check disk space: `df -h`
2. Check PostgreSQL status: `docker-compose exec db pg_isready`
3. Check permissions: `ls -la backups/`

### Restore Failed

1. Check backup file: `file backups/backup-name.dump`
2. Check PostgreSQL version compatibility
3. Try SQL restore instead of pg_restore

### Large Database Performance

For databases > 10GB:
- Use parallel pg_dump: `--jobs=4`
- Use compression: Already enabled
- Schedule during off-hours
