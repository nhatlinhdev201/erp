# Integration Examples

## Setup Examples

### Example 1: Basic Setup with Prisma

```typescript
// lib/audit.ts
import { PrismaClient } from "@prisma/client";
import { PrismaAuditStore, withAudit } from "@linkk/audit";

export const prisma = new PrismaClient();
export const auditStore = new PrismaAuditStore(prisma);

export function setupAudit(userId: string, userName: string, ipAddress?: string) {
  return withAudit(prisma, auditStore, {
    userId,
    userName,
    ipAddress,
    userAgent: undefined, // Set from middleware
  });
}
```

### Example 2: Express Middleware Integration

```typescript
// middleware/audit.ts
import { Request, Response, NextFunction } from "express";
import { setupAudit } from "../lib/audit";

export function auditMiddleware(req: Request, res: Response, next: NextFunction) {
  const userId = req.user?.id || "anonymous";
  const userName = req.user?.name || "Guest";
  const ipAddress = req.ip;

  const middleware = setupAudit(userId, userName, ipAddress);

  // Attach to request for use in route handlers
  (req as any).auditMiddleware = middleware;

  // Cleanup after response
  res.on("finish", () => {
    middleware.stop();
  });

  next();
}
```

### Example 3: NestJS Integration

```typescript
// audit/audit.interceptor.ts
import { Injectable } from "@nestjs/common";
import { PrismaAuditStore, withAudit } from "@linkk/audit";
import { PrismaService } from "../database/prisma.service";

@Injectable()
export class AuditInterceptor {
  constructor(private prisma: PrismaService) {}

  async setupAudit(userId: string, userName: string, ipAddress?: string) {
    const auditStore = new PrismaAuditStore(this.prisma);
    return withAudit(this.prisma, auditStore, {
      userId,
      userName,
      ipAddress,
    });
  }
}
```

## Query Examples

### Example 1: Get User Activity Report

```typescript
// services/audit.service.ts
import { getUserActivity, exportAuditLog } from "@linkk/audit";
import { auditStore } from "../lib/audit";

async function generateUserActivityReport(userId: string) {
  const { entries, total } = await getUserActivity(auditStore, userId, {
    dateFrom: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
    limit: 1000,
  });

  console.log(`${userName} performed ${total} actions in last 30 days`);

  entries.forEach((entry) => {
    console.log(`[${entry.timestamp.toISOString()}] ${entry.action} on ${entry.entity}`);
  });

  return entries;
}
```

### Example 2: Entity Change History

```typescript
// services/history.service.ts
import { getEntityHistory } from "@linkk/audit";
import { auditStore } from "../lib/audit";

async function trackCustomerChanges(customerId: string) {
  const history = await getEntityHistory(auditStore, "Customer", customerId, 100);

  // Build a timeline
  for (const entry of history) {
    if (entry.action === "UPDATE") {
      console.log(`\n${entry.timestamp.toISOString()} - Updated by ${entry.userName}:`);
      for (const change of entry.changes) {
        console.log(`  ${change.field}: "${change.oldValue}" → "${change.newValue}"`);
      }
    } else if (entry.action === "CREATE") {
      console.log(`\n${entry.timestamp.toISOString()} - Created by ${entry.userName}`);
    } else if (entry.action === "DELETE") {
      console.log(`\n${entry.timestamp.toISOString()} - Deleted by ${entry.userName}`);
    }
  }

  return history;
}
```

### Example 3: Compliance Report

```typescript
// services/compliance.service.ts
import { queryAuditLog, exportAuditLog } from "@linkk/audit";
import { auditStore } from "../lib/audit";

async function generateComplianceReport(startDate: Date, endDate: Date) {
  // Get all sensitive entity changes
  const sensitiveEntities = ["User", "Customer", "Invoice", "BankAccount"];
  const allEntries = [];

  for (const entity of sensitiveEntities) {
    const { entries } = await queryAuditLog(auditStore, {
      entity,
      dateFrom: startDate,
      dateTo: endDate,
      limit: 10000,
      offset: 0,
    });
    allEntries.push(...entries);
  }

  // Export as CSV for compliance
  const csv = await exportAuditLog(auditStore, "csv", {
    dateFrom: startDate,
    dateTo: endDate,
  });

  // Save to file
  const fs = require("fs").promises;
  await fs.writeFile(
    `compliance-report-${startDate.toISOString().split("T")[0]}.csv`,
    csv
  );

  return {
    totalChanges: allEntries.length,
    entities: sensitiveEntities,
    dateRange: { startDate, endDate },
  };
}
```

### Example 4: Access Control Audit

```typescript
// services/access-audit.service.ts
import { queryAuditLog, AuditAction } from "@linkk/audit";
import { auditStore } from "../lib/audit";

async function auditLoginAttempts(userId: string, days: number = 7) {
  const dateFrom = new Date();
  dateFrom.setDate(dateFrom.getDate() - days);

  const { entries, total } = await queryAuditLog(auditStore, {
    userId,
    action: AuditAction.LOGIN,
    dateFrom,
    limit: 1000,
    offset: 0,
  });

  console.log(`Login attempts for ${userId} in last ${days} days: ${total}`);

  if (total > 100) {
    console.warn("⚠️  Suspicious login activity detected!");
  }

  return entries;
}

async function auditDataExports(days: number = 30) {
  const dateFrom = new Date();
  dateFrom.setDate(dateFrom.getDate() - days);

  const { entries } = await queryAuditLog(auditStore, {
    action: AuditAction.EXPORT,
    dateFrom,
    limit: 10000,
    offset: 0,
  });

  // Group by user
  const byUser = new Map<string, number>();
  for (const entry of entries) {
    byUser.set(entry.userId, (byUser.get(entry.userId) || 0) + 1);
  }

  console.log("Data exports by user:");
  for (const [userId, count] of byUser) {
    console.log(`  ${userId}: ${count} exports`);
  }

  return entries;
}
```

### Example 5: Analytics and Metrics

```typescript
// services/analytics.service.ts
import { getMostActiveUsers, countByAction, countByModule } from "@linkk/audit";
import { auditStore } from "../lib/audit";

async function getSystemMetrics(dateFrom: Date, dateTo: Date) {
  // User activity
  const topUsers = await getMostActiveUsers(auditStore, 20, dateFrom, dateTo);

  // Action distribution
  const actionCounts = await countByAction(auditStore, dateFrom, dateTo);

  // Module activity
  const moduleCounts = await countByModule(auditStore, dateFrom, dateTo);

  return {
    period: { dateFrom, dateTo },
    topUsers,
    actionDistribution: actionCounts,
    moduleActivity: moduleCounts,
    totalActions: Object.values(actionCounts).reduce((a, b) => a + b, 0),
  };
}
```

## Maintenance Examples

### Example 1: Purge Old Entries

```typescript
// tasks/cleanup.ts
import { purgeOldEntries } from "@linkk/audit";
import { auditStore } from "../lib/audit";

export async function cleanupOldAuditLogs() {
  // Keep logs for 2 years
  const twoYearsAgo = new Date();
  twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);

  const purged = await purgeOldEntries(auditStore, twoYearsAgo);
  console.log(`Purged ${purged} audit entries older than 2 years`);
}

// Schedule this job
// * 2 * * * (runs daily at 2 AM)
```

### Example 2: Archive Old Logs

```typescript
// tasks/archive.ts
import { exportAuditLog } from "@linkk/audit";
import { auditStore } from "../lib/audit";
import * as fs from "fs/promises";
import * as path from "path";

export async function archiveMonthlyLogs() {
  const today = new Date();
  const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  const json = await exportAuditLog(auditStore, "json", {
    dateFrom: lastMonth,
    dateTo: thisMonth,
  });

  const archiveDir = path.join(process.cwd(), "audit-archives");
  await fs.mkdir(archiveDir, { recursive: true });

  const fileName = `audit-${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, "0")}.json`;
  const filePath = path.join(archiveDir, fileName);

  await fs.writeFile(filePath, json);
  console.log(`Archived ${filePath}`);
}
```

### Example 3: Backup Strategy

```typescript
// tasks/backup.ts
import { FileAuditStore } from "@linkk/audit";
import { PrismaAuditStore } from "@linkk/audit";
import { prisma, auditStore } from "../lib/audit";

export async function backupAuditLogs() {
  // Create backup store
  const backupPath = `./backups/audit-${new Date().toISOString().split("T")[0]}.jsonl`;
  const backupStore = new FileAuditStore(backupPath);

  // Export from Prisma, write to file
  const json = await auditStore.export("json");
  const fs = require("fs").promises;
  await fs.writeFile(backupPath, json);

  console.log(`Audit logs backed up to ${backupPath}`);
}
```

## API Endpoint Examples

### Example 1: Express Route

```typescript
// routes/audit.ts
import { Router } from "express";
import { queryAuditLog, getEntityHistory, getUserActivity } from "@linkk/audit";
import { auditStore } from "../lib/audit";

const router = Router();

// Get audit log with filters
router.get("/logs", async (req, res) => {
  try {
    const { module, entity, userId, action, limit = 50, offset = 0 } = req.query;

    const { entries, total } = await queryAuditLog(auditStore, {
      module: module as string,
      entity: entity as string,
      userId: userId as string,
      action: action as any,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
    });

    res.json({
      data: entries,
      pagination: { limit, offset, total },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get entity history
router.get("/history/:entity/:id", async (req, res) => {
  try {
    const { entity, id } = req.params;
    const entries = await getEntityHistory(auditStore, entity, id);
    res.json({ data: entries });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user activity
router.get("/users/:userId/activity", async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    const { entries, total } = await getUserActivity(auditStore, userId, {
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
    });

    res.json({
      data: entries,
      pagination: { limit, offset, total },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
```

### Example 2: GraphQL Resolver

```typescript
// resolvers/audit.resolver.ts
import { Resolver, Query, Arg } from "type-graphql";
import { queryAuditLog, getEntityHistory } from "@linkk/audit";
import { auditStore } from "../lib/audit";

@Resolver()
export class AuditResolver {
  @Query(() => [AuditEntryType])
  async auditLogs(
    @Arg("module", { nullable: true }) module?: string,
    @Arg("limit", { defaultValue: 50 }) limit: number,
    @Arg("offset", { defaultValue: 0 }) offset: number
  ) {
    const { entries } = await queryAuditLog(auditStore, {
      module,
      limit,
      offset,
    });
    return entries;
  }

  @Query(() => [AuditEntryType])
  async entityHistory(
    @Arg("entity") entity: string,
    @Arg("id") id: string
  ) {
    return getEntityHistory(auditStore, entity, id);
  }
}
```

## Dashboard Examples

### Example 1: Real-time Activity Feed

```typescript
// components/AuditFeed.tsx
import { useEffect, useState } from "react";
import { getActivityTimeline } from "@linkk/audit";

export function AuditFeed() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadActivity = async () => {
      const today = new Date();
      const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);

      const { entries } = await getActivityTimeline(auditStore, yesterday, today, {
        limit: 100,
      });

      setEntries(entries);
      setLoading(false);
    };

    loadActivity();
    const interval = setInterval(loadActivity, 60000); // Refresh every minute

    return () => clearInterval(interval);
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="audit-feed">
      {entries.map((entry) => (
        <div key={entry.id} className="audit-entry">
          <span className="timestamp">{entry.timestamp.toLocaleString()}</span>
          <span className="user">{entry.userName}</span>
          <span className="action">{entry.action}</span>
          <span className="entity">{entry.entity}</span>
        </div>
      ))}
    </div>
  );
}
```

---

These examples demonstrate common patterns for integrating @linkk/audit into a L-ERP application.
