# 🚀 X-RAY AUDIT - QUICK START

## Paste đoạn này vào session mới:

---

**ROLE:** Bạn là Senior Technical Auditor. Thực hiện X-ray toàn diện dự án L-ERP MRP.

**PROJECT:** `/home/claude/lerp-mrp-app` - Next.js 14 + Prisma + PostgreSQL

**PROBLEM:** Dự án có dấu hiệu context drift, schema mismatch, API inconsistency.

**MISSION:** 
1. Đọc file `/mnt/user-data/outputs/XRAY_AUDIT_MASTER_PROMPT.md`
2. Execute 10 phases audit
3. Generate detailed report

**CRITICAL CHECKS:**
- Part field: `partName` hay `name`?
- Inventory field: `onHand` hay `quantity`?
- Inventory key: `partId` unique hay composite với warehouse?
- API routes: `/api/*` hay `/api/v2/*`?

**START:** 
```bash
cat /mnt/user-data/outputs/XRAY_AUDIT_MASTER_PROMPT.md
```

Sau đó thực hiện audit theo instructions.

---

