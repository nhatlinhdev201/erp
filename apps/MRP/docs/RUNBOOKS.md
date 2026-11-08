# 📖 L-ERP MRP RUNBOOKS
## Operational Procedures for Production

---

## 🚨 INCIDENT RESPONSE

### High Error Rate (>5%)

**Alert:** `HighErrorRate`
**Severity:** Critical

**Steps:**
1. Check Grafana dashboard for error patterns
2. Identify affected endpoints: 
   ```
   sum(rate(rtr_mrp_http_requests_total{status=~"5.."}[5m])) by (path)
   ```
3. Check application logs:
   ```bash
   kubectl logs -l app=lerp-mrp --tail=1000 | grep -i error
   ```
4. Check database connectivity:
   ```bash
   kubectl exec -it $(kubectl get pod -l app=lerp-mrp -o jsonpath='{.items[0].metadata.name}') -- curl localhost:3000/api/health/ready
   ```
5. If database issue, see [Database Recovery](#database-recovery)
6. If application issue, consider rolling back:
   ```bash
   kubectl rollout undo deployment/lerp-mrp
   ```

---

### High Latency (P95 > 1s)

**Alert:** `HighLatency`
**Severity:** Warning

**Steps:**
1. Check for slow queries:
   ```
   histogram_quantile(0.95, sum(rate(rtr_mrp_db_query_duration_seconds_bucket[5m])) by (le, model))
   ```
2. Check Redis hit rate:
   ```
   rtr_mrp_cache_hit_rate
   ```
3. Check for resource constraints:
   ```bash
   kubectl top pods -l app=lerp-mrp
   ```
4. If CPU/Memory high, scale up:
   ```bash
   kubectl scale deployment/lerp-mrp --replicas=5
   ```
5. Check for N+1 queries in logs
6. Review recent deployments

---

### Application Down

**Alert:** `ApplicationDown`
**Severity:** Critical

**Steps:**
1. Check pod status:
   ```bash
   kubectl get pods -l app=lerp-mrp
   kubectl describe pod -l app=lerp-mrp
   ```
2. Check for OOMKilled or CrashLoopBackOff
3. Check events:
   ```bash
   kubectl get events --sort-by='.lastTimestamp' | grep lerp-mrp
   ```
4. Check logs from previous container:
   ```bash
   kubectl logs -l app=lerp-mrp --previous
   ```
5. If OOMKilled, increase memory limits
6. If CrashLoopBackOff, check init containers and secrets
7. Force restart if needed:
   ```bash
   kubectl rollout restart deployment/lerp-mrp
   ```

---

### Database Connection Failed

**Alert:** `DatabaseConnectionFailed`
**Severity:** Critical

**Steps:**
1. Check database status:
   ```bash
   kubectl get pods -l app=postgres
   kubectl exec -it postgres-0 -- pg_isready
   ```
2. Check connection pool:
   ```bash
   kubectl exec -it postgres-0 -- psql -c "SELECT count(*) FROM pg_stat_activity;"
   ```
3. If pool exhausted, restart application pods
4. Check for blocking queries:
   ```sql
   SELECT * FROM pg_stat_activity WHERE state = 'active' AND wait_event IS NOT NULL;
   ```
5. Kill long-running queries if needed:
   ```sql
   SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE duration > interval '5 minutes';
   ```

---

## 🔧 COMMON OPERATIONS

### Scaling Application

**Scale up:**
```bash
kubectl scale deployment/lerp-mrp --replicas=5
```

**Scale down:**
```bash
kubectl scale deployment/lerp-mrp --replicas=2
```

**Enable HPA:**
```bash
kubectl apply -f k8s/base/hpa.yaml
```

---

### Database Maintenance

**Create manual backup:**
```bash
kubectl exec -it postgres-0 -- pg_dump -Fc rtr_mrp > backup-$(date +%Y%m%d).dump
```

**Restore from backup:**
```bash
kubectl exec -i postgres-0 -- pg_restore -d rtr_mrp < backup-YYYYMMDD.dump
```

**Analyze tables:**
```bash
kubectl exec -it postgres-0 -- psql -d rtr_mrp -c "ANALYZE VERBOSE;"
```

**Vacuum database:**
```bash
kubectl exec -it postgres-0 -- psql -d rtr_mrp -c "VACUUM ANALYZE;"
```

---

### Cache Operations

**Clear all cache:**
```bash
kubectl exec -it redis-0 -- redis-cli FLUSHALL
```

**Clear tenant cache:**
```bash
kubectl exec -it redis-0 -- redis-cli KEYS "tenant:TENANT_ID:*" | xargs redis-cli DEL
```

**Check cache stats:**
```bash
kubectl exec -it redis-0 -- redis-cli INFO stats
```

---

### Deployment

**Deploy new version:**
```bash
# Update image
kubectl set image deployment/lerp-mrp lerp-mrp=ghcr.io/your-org/lerp-mrp:v1.2.3

# Or apply full manifest
kubectl apply -f k8s/overlays/production/
```

**Rollback:**
```bash
# Rollback to previous version
kubectl rollout undo deployment/lerp-mrp

# Rollback to specific revision
kubectl rollout undo deployment/lerp-mrp --to-revision=2
```

**Check rollout status:**
```bash
kubectl rollout status deployment/lerp-mrp
```

---

### Log Access

**Stream logs:**
```bash
kubectl logs -f -l app=lerp-mrp --all-containers
```

**Search logs:**
```bash
kubectl logs -l app=lerp-mrp --tail=10000 | grep "error"
```

**Export logs:**
```bash
kubectl logs -l app=lerp-mrp --since=1h > logs-$(date +%Y%m%d-%H%M).txt
```

---

## 💾 DATABASE RECOVERY

### Point-in-Time Recovery

1. Stop application:
   ```bash
   kubectl scale deployment/lerp-mrp --replicas=0
   ```

2. Restore from backup + WAL:
   ```bash
   # Restore base backup
   kubectl exec -it postgres-0 -- pg_restore -d rtr_mrp_new < base_backup.dump
   
   # Apply WAL until target time
   kubectl exec -it postgres-0 -- psql -c "SELECT pg_wal_replay_resume();"
   ```

3. Verify data:
   ```bash
   kubectl exec -it postgres-0 -- psql -d rtr_mrp -c "SELECT COUNT(*) FROM parts;"
   ```

4. Restart application:
   ```bash
   kubectl scale deployment/lerp-mrp --replicas=3
   ```

---

### Failover to Read Replica

1. Promote replica:
   ```bash
   kubectl exec -it postgres-replica-0 -- pg_ctl promote
   ```

2. Update connection string in secrets:
   ```bash
   kubectl edit secret lerp-mrp-secrets
   # Update DATABASE_URL to point to new primary
   ```

3. Restart application:
   ```bash
   kubectl rollout restart deployment/lerp-mrp
   ```

---

## 📊 MONITORING QUERIES

### Top slow endpoints:
```promql
topk(10, histogram_quantile(0.95, sum(rate(rtr_mrp_http_request_duration_seconds_bucket[5m])) by (le, path)))
```

### Error rate by endpoint:
```promql
sum(rate(rtr_mrp_http_requests_total{status=~"5.."}[5m])) by (path) 
/ sum(rate(rtr_mrp_http_requests_total[5m])) by (path)
```

### Memory usage trend:
```promql
process_resident_memory_bytes{job="lerp-mrp"} / 1024 / 1024
```

### Active tenants with high load:
```promql
topk(5, sum(rate(rtr_mrp_http_requests_total[5m])) by (tenant))
```

---

## 📞 ESCALATION

| Severity | Response Time | Notify |
|----------|---------------|--------|
| Critical | 5 min | On-call + Team Lead |
| Warning | 30 min | On-call |
| Info | Next business day | Team |

**On-call contact:** Check PagerDuty/OpsGenie
**Slack channel:** #lerp-mrp-alerts

---

*Last updated: January 2026*
