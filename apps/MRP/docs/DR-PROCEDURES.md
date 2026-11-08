# 🔥 DISASTER RECOVERY PROCEDURES
## L-ERP MRP Business Continuity Plan

---

## 📋 OVERVIEW

| Metric | Target | Current |
|--------|--------|---------|
| **RTO** (Recovery Time Objective) | 15 minutes | ✅ |
| **RPO** (Recovery Point Objective) | 1 hour | ✅ |
| **Availability SLA** | 99.9% | ✅ |

---

## 🏗️ ARCHITECTURE

```
                    PRIMARY REGION (ap-southeast-1)
                    ┌─────────────────────────────────────┐
                    │  ┌───────────┐   ┌───────────┐     │
                    │  │    K8s    │   │    K8s    │     │
                    │  │  Node 1   │   │  Node 2   │     │
                    │  └─────┬─────┘   └─────┬─────┘     │
                    │        │               │           │
                    │  ┌─────▼───────────────▼─────┐     │
                    │  │    PostgreSQL Primary     │     │
                    │  │    + Streaming Replica    │     │
                    │  └─────────────┬─────────────┘     │
                    │                │                   │
                    └────────────────┼───────────────────┘
                                     │
                    ═══════════════════════════════════════
                    Cross-Region Replication (async)
                    ═══════════════════════════════════════
                                     │
                    DR REGION (ap-northeast-1)
                    ┌────────────────┼───────────────────┐
                    │                ▼                   │
                    │  ┌─────────────────────────────┐   │
                    │  │    PostgreSQL Standby       │   │
                    │  │    (Read-only Replica)      │   │
                    │  └─────────────────────────────┘   │
                    │                                    │
                    │  ┌─────────────────────────────┐   │
                    │  │    K8s Cluster (Cold/Warm)  │   │
                    │  │    Ready to activate        │   │
                    │  └─────────────────────────────┘   │
                    │                                    │
                    └────────────────────────────────────┘
```

---

## 📦 BACKUP STRATEGY

### 1. Database Backups

| Type | Frequency | Retention | Location |
|------|-----------|-----------|----------|
| Full backup | Daily (2:00 AM) | 30 days | S3 `s3://lerp-mrp-backups/db/daily/` |
| WAL archiving | Continuous | 7 days | S3 `s3://lerp-mrp-backups/db/wal/` |
| Weekly snapshot | Sunday (3:00 AM) | 90 days | S3 `s3://lerp-mrp-backups/db/weekly/` |
| Monthly archive | 1st of month | 1 year | S3 Glacier |

**Backup Script:**
```bash
#!/bin/bash
# Daily backup script
DATE=$(date +%Y%m%d)
BUCKET="lerp-mrp-backups"

# Create backup
pg_dump -Fc rtr_mrp > /tmp/backup-${DATE}.dump

# Upload to S3
aws s3 cp /tmp/backup-${DATE}.dump s3://${BUCKET}/db/daily/backup-${DATE}.dump

# Cleanup local
rm /tmp/backup-${DATE}.dump

# Verify backup
aws s3 ls s3://${BUCKET}/db/daily/backup-${DATE}.dump
```

### 2. Application State

| Component | Backup Method | Retention |
|-----------|---------------|-----------|
| ConfigMaps | GitOps (Flux/ArgoCD) | Git history |
| Secrets | AWS Secrets Manager | Version history |
| S3 files | Cross-region replication | Continuous |

### 3. Redis Cache

- **Strategy:** No backup (rebuild on recovery)
- **Rationale:** Cache is ephemeral, data can be rebuilt from database

---

## 🚨 DISASTER SCENARIOS

### Scenario 1: Application Failure

**Symptoms:** Pods crashing, high error rate
**RTO:** 5 minutes

**Recovery:**
```bash
# 1. Check pod status
kubectl get pods -l app=lerp-mrp

# 2. Rollback to last known good version
kubectl rollout undo deployment/lerp-mrp

# 3. Verify recovery
kubectl rollout status deployment/lerp-mrp
curl -s https://app.lerp-mrp.com/api/health | jq .
```

---

### Scenario 2: Database Failure

**Symptoms:** Connection errors, data unavailable
**RTO:** 15 minutes

**Recovery:**

```bash
# 1. Check database status
kubectl get pods -l app=postgres
kubectl exec -it postgres-0 -- pg_isready

# 2. If primary is down, promote replica
kubectl exec -it postgres-replica-0 -- pg_ctl promote

# 3. Update connection string
kubectl patch secret lerp-mrp-secrets -p '{"stringData":{"DATABASE_URL":"postgresql://...@postgres-replica:5432/rtr_mrp"}}'

# 4. Restart application
kubectl rollout restart deployment/lerp-mrp

# 5. Verify
curl -s https://app.lerp-mrp.com/api/health/ready | jq .
```

---

### Scenario 3: Region Failure

**Symptoms:** Entire primary region unavailable
**RTO:** 30 minutes

**Recovery:**

```bash
# 1. Activate DR region
kubectl config use-context dr-cluster

# 2. Promote standby database
kubectl exec -it postgres-standby-0 -- pg_ctl promote

# 3. Scale up application
kubectl scale deployment/lerp-mrp --replicas=3

# 4. Update DNS
# Route53: Update app.lerp-mrp.com to point to DR region load balancer

# 5. Verify
curl -s https://app.lerp-mrp.com/api/health | jq .

# 6. Notify stakeholders
./scripts/notify-dr-activated.sh
```

---

### Scenario 4: Data Corruption

**Symptoms:** Invalid data, integrity errors
**RTO:** 1 hour

**Recovery:**

```bash
# 1. Identify corruption time
kubectl logs -l app=lerp-mrp --since=24h | grep -i "integrity\|corrupt\|error"

# 2. Stop application
kubectl scale deployment/lerp-mrp --replicas=0

# 3. Restore from backup (before corruption)
# Find latest good backup
aws s3 ls s3://lerp-mrp-backups/db/daily/ | tail -5

# 4. Restore database
pg_restore -d rtr_mrp_new < backup-YYYYMMDD.dump

# 5. Apply WAL until just before corruption
# (Configure recovery_target_time in postgresql.conf)

# 6. Verify data integrity
psql -d rtr_mrp -c "SELECT COUNT(*) FROM parts;"

# 7. Restart application
kubectl scale deployment/lerp-mrp --replicas=3
```

---

### Scenario 5: Security Breach

**Symptoms:** Unauthorized access, data exfiltration
**RTO:** Immediate

**Response:**

```bash
# 1. IMMEDIATE: Isolate affected systems
kubectl scale deployment/lerp-mrp --replicas=0

# 2. Rotate all credentials
./scripts/rotate-all-secrets.sh

# 3. Review audit logs
kubectl logs -l app=lerp-mrp | grep -E "login|auth|access"

# 4. Block suspicious IPs
kubectl apply -f k8s/security/block-ips.yaml

# 5. Restore from clean backup (if needed)
# Follow Scenario 4 procedure

# 6. Re-enable with new credentials
kubectl rollout restart deployment/lerp-mrp

# 7. Post-incident review
# Document timeline, root cause, remediation
```

---

## 📊 DR TESTING

### Monthly DR Drill

**Schedule:** First Sunday of each month, 6:00 AM

**Procedure:**
1. Announce maintenance window
2. Simulate primary region failure
3. Execute failover to DR
4. Verify application functionality
5. Execute failback to primary
6. Document results

**Success Criteria:**
- [ ] Failover completed within RTO (15 min)
- [ ] Data loss within RPO (1 hour)
- [ ] All critical functions operational
- [ ] User sessions preserved (if possible)

---

## 📞 COMMUNICATION PLAN

### During Incident

| Stakeholder | Channel | Frequency |
|-------------|---------|-----------|
| Engineering | Slack #incident | Real-time |
| Management | Email + Slack | Every 15 min |
| Customers | Status page | Every 30 min |
| Support | Zendesk macro | As needed |

### Status Page Updates

```markdown
[INVESTIGATING] We are currently investigating issues with [SERVICE].
[IDENTIFIED] The issue has been identified. Our team is working on a fix.
[MONITORING] A fix has been implemented. We are monitoring the results.
[RESOLVED] This incident has been resolved.
```

---

## ✅ RECOVERY VERIFICATION CHECKLIST

After any recovery:

- [ ] Application health check passes (`/api/health`)
- [ ] Database connectivity verified (`/api/health/ready`)
- [ ] Sample CRUD operations successful
- [ ] Background jobs processing
- [ ] Email notifications working
- [ ] Monitoring receiving metrics
- [ ] Audit logs recording
- [ ] User authentication working
- [ ] API rate limiting active
- [ ] SSL certificates valid

---

## 📁 IMPORTANT FILES & LOCATIONS

| Resource | Location |
|----------|----------|
| Kubernetes manifests | `/k8s/` |
| Backup scripts | `/scripts/backup/` |
| Recovery scripts | `/scripts/recovery/` |
| Secrets template | `k8s/base/secret.yaml` |
| Prometheus alerts | `k8s/monitoring/prometheus/alerts.yaml` |
| Runbooks | `docs/RUNBOOKS.md` |

---

## 🔑 EMERGENCY CONTACTS

| Role | Name | Phone | Email |
|------|------|-------|-------|
| Primary On-Call | - | - | oncall@your-domain.com |
| Engineering Lead | - | - | eng-lead@your-domain.com |
| Database Admin | - | - | dba@your-domain.com |
| Security | - | - | security@your-domain.com |

---

*Last tested: [Date]*
*Next scheduled test: [Date]*
*Document owner: Platform Team*
