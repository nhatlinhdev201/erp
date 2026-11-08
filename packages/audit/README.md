# @linkk/audit

Comprehensive audit trail system for L-ERP. Automatically tracks all data changes across all modules with detailed change history, user activity, and flexible query capabilities.

## Features

- **Automatic Change Tracking**: Logs CREATE, UPDATE, DELETE operations via Prisma middleware
- **Detailed Change History**: Captures before/after state with field-level diffs
- **Multiple Actions**: Supports CREATE, UPDATE, DELETE, READ, LOGIN, LOGOUT, EXPORT, IMPORT, APPROVE, REJECT
- **Sensitive Data Masking**: Automatically masks passwords, tokens, and secrets
- **Flexible Storage**: Prisma (database) or file-based (JSONL) storage backends
- **Advanced Querying**: Query by module, entity, user, action, date range with pagination
- **Export/Import**: Export audit logs to JSON or CSV format
- **Batch Writing**: Efficient batching with configurable flush intervals
- **Vietnamese Support**: Full support for Vietnamese characters and localization

## Installation

```bash
npm install @linkk/audit
```

## Quick Start

### 1. Update Prisma Schema

Add the AuditLog model to your main `prisma/schema.prisma`:

```prisma
model AuditLog {
  id        String   @id @default(cuid())
  timestamp DateTime @default(now())
  userId    String
  userName  String
  module    String
  entity    String
  entityId  String
  action    AuditAction
  changes   Json?
  oldValue  Json?
  newValue  Json?
  ipAddress String?
  userAgent String?
  metadata  Json?

  @@index([userId])
  @@index([module])
  @@index([entity])
  @@index([entityId])
  @@index([timestamp])
  @@index([action])
}

enum AuditAction {
  CREATE
  UPDATE
  DELETE
  READ
  LOGIN
  LOGOUT
  EXPORT
  IMPORT
  APPROVE
  REJECT
}
```

Run migration:
```bash
npx prisma migrate dev --name add_audit_log
```

### 2. Initialize Audit in Your Application

```typescript
import {
  PrismaAuditStore,
  withAudit,
  queryAuditLog,
} from "@linkk/audit";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Create audit store
const auditStore = new PrismaAuditStore(prisma);

// Apply audit middleware
const auditMiddleware = withAudit(prisma, auditStore, {
  userId: "user-123",
  userName: "John Doe",
  ipAddress: req.ip,
  userAgent: req.get("user-agent"),
});

// Later: cleanup when needed
// auditMiddleware.stop();
```

### 3. Query Audit Log

```typescript
import { queryAuditLog, getEntityHistory, getUserActivity } from "@linkk/audit";

// Query with filters
const { entries, total } = await queryAuditLog(auditStore, {
  module: "users",
  entity: "User",
  dateFrom: new Date("2026-01-01"),
  dateTo: new Date("2026-12-31"),
  limit: 50,
  offset: 0,
});

// Get full history for an entity
const history = await getEntityHistory(auditStore, "User", "user-123");

// Get all user activity
const { entries: userActivities } = await getUserActivity(auditStore, "user-123", {
  dateFrom: new Date("2026-01-01"),
  limit: 100,
});
```

## API Reference

### Types

#### AuditAction
Enum of supported audit actions:
- `CREATE` - Record created
- `UPDATE` - Record updated
- `DELETE` - Record deleted
- `READ` - Record read/viewed
- `LOGIN` - User login
- `LOGOUT` - User logout
- `EXPORT` - Data exported
- `IMPORT` - Data imported
- `APPROVE` - Record approved
- `REJECT` - Record rejected

#### AuditEntry
```typescript
interface AuditEntry {
  id: string;
  timestamp: Date;
  userId: string;
  userName: string;
  module: string;
  entity: string;
  entityId: string;
  action: AuditAction;
  changes: Change[];
  oldValue?: Record<string, unknown> | null;
  newValue?: Record<string, unknown> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, unknown> | null;
}
```

#### Change
```typescript
interface Change {
  field: string;
  oldValue: unknown;
  newValue: unknown;
}
```

### Stores

#### PrismaAuditStore
Database-backed storage using Prisma:

```typescript
const store = new PrismaAuditStore(prisma);
```

#### FileAuditStore
File-based storage (JSONL format):

```typescript
const store = new FileAuditStore("./audit-logs.jsonl");
```

### Query Functions

#### queryAuditLog
```typescript
const { entries, total } = await queryAuditLog(store, {
  module?: "users",
  entity?: "User",
  userId?: "user-123",
  action?: AuditAction.UPDATE,
  dateFrom?: new Date("2026-01-01"),
  dateTo?: new Date("2026-12-31"),
  limit: 50,
  offset: 0,
});
```

#### getEntityHistory
```typescript
const history = await getEntityHistory(
  store,
  "User",      // entity type
  "user-123",  // entity id
  100          // limit (optional)
);
```

#### getUserActivity
```typescript
const { entries, total } = await getUserActivity(store, "user-123", {
  dateFrom?: new Date("2026-01-01"),
  dateTo?: new Date("2026-12-31"),
  action?: AuditAction.UPDATE,
  limit: 100,
  offset: 0,
});
```

#### getModuleActivity
```typescript
const { entries, total } = await getModuleActivity(store, "users", {
  dateFrom?: new Date("2026-01-01"),
  dateTo?: new Date("2026-12-31"),
  limit: 100,
  offset: 0,
});
```

#### getActivityTimeline
```typescript
const { entries, total } = await getActivityTimeline(
  store,
  new Date("2026-01-01"),
  new Date("2026-12-31"),
  {
    module?: "users",
    userId?: "user-123",
    limit: 100,
    offset: 0,
  }
);
```

#### countByAction
```typescript
const counts = await countByAction(
  store,
  new Date("2026-01-01"),
  new Date("2026-12-31")
);
// Result: { CREATE: 45, UPDATE: 120, DELETE: 5, ... }
```

#### getMostActiveUsers
```typescript
const users = await getMostActiveUsers(
  store,
  10, // limit
  new Date("2026-01-01"),
  new Date("2026-12-31")
);
// Result: [
//   { userId: "user-1", userName: "Alice", count: 340 },
//   { userId: "user-2", userName: "Bob", count: 210 },
// ]
```

#### exportAuditLog
```typescript
// Export to JSON
const json = await exportAuditLog(store, "json", {
  dateFrom: new Date("2026-01-01"),
  dateTo: new Date("2026-12-31"),
});

// Export to CSV
const csv = await exportAuditLog(store, "csv", {
  dateFrom: new Date("2026-01-01"),
  dateTo: new Date("2026-12-31"),
});
```

#### purgeOldEntries
```typescript
const purged = await purgeOldEntries(store, new Date("2025-01-01"));
console.log(`Purged ${purged} entries older than 2025-01-01`);
```

## Sensitive Data Handling

Sensitive fields are automatically masked with `***`:

- `password`
- `token`
- `secret`
- `apiKey`
- `refreshToken`
- `accessToken`
- `privateKey`
- `sessionToken`

To add custom sensitive fields, modify the `SENSITIVE_FIELDS` set in `src/differ.ts`.

## Batch Writing

Audit entries are automatically batched for efficient writing:

- Flushes when buffer reaches 100 entries, or
- Flushes every 5 seconds (whichever comes first)

Configure batch settings in `src/middleware.ts`:
```typescript
private readonly BATCH_SIZE = 100;
private readonly BATCH_TIMEOUT = 5000; // 5 seconds
```

## Performance Considerations

1. **Indexing**: The AuditLog table includes optimized indexes:
   - `(userId)` - For user activity queries
   - `(module)` - For module activity queries
   - `(entity, entityId)` - For entity history queries
   - `(timestamp)` - For time-based queries
   - `(action)` - For action-based filtering
   - `(module, entity, entityId)` - For composite queries

2. **Purging**: Periodically purge old entries to maintain performance:
   ```typescript
   // Purge entries older than 1 year
   const oneYearAgo = new Date();
   oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
   await purgeOldEntries(store, oneYearAgo);
   ```

3. **Export for Archive**: Use file-based export for long-term archival:
   ```typescript
   const json = await exportAuditLog(store, "json");
   // Save to archive storage
   ```

## Examples

### Compliance Reporting

```typescript
// Get all changes to sensitive entities in the past 3 months
const threeMonthsAgo = new Date();
threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

const { entries } = await queryAuditLog(store, {
  entity: "Customer",
  dateFrom: threeMonthsAgo,
  limit: 1000,
  offset: 0,
});

// Export for audit purposes
const csv = await exportAuditLog(store, "csv", { dateFrom: threeMonthsAgo });
```

### User Accountability

```typescript
// Track changes made by a specific user
const { entries } = await getUserActivity(store, "user-123", {
  limit: 50,
  offset: 0,
});

entries.forEach((entry) => {
  console.log(`${entry.timestamp}: ${entry.action} on ${entry.entity}`);
});
```

### Change History

```typescript
// Get full change history for a customer
const history = await getEntityHistory(store, "Customer", "cust-456", 100);

history.forEach((entry) => {
  console.log(`${entry.timestamp}: ${entry.action}`);
  entry.changes.forEach((change) => {
    console.log(`  ${change.field}: ${change.oldValue} -> ${change.newValue}`);
  });
});
```

## License

Part of L-ERP ecosystem. All rights reserved.

## Contributing

See CONTRIBUTING.md in the main repository.
