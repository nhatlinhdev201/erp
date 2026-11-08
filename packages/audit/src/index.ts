/**
 * @linkk/audit v1.0.0
 * Comprehensive audit trail system for L-ERP
 *
 * Re-exports all audit trail functionality
 */

// Types
export {
  AuditAction,
} from "./types";
export type {
  AuditEntry,
  AuditQueryOptions,
  AuditContext,
  Change,
} from "./types";

// Differ utilities
export { computeDiff, maskSensitiveData } from "./differ";

// Middleware
export { AuditMiddleware, withAudit } from "./middleware";

// Store implementations
export type { AuditStore } from "./store";
export { PrismaAuditStore, FileAuditStore } from "./store";

// Query helpers
export {
  queryAuditLog,
  getEntityHistory,
  getUserActivity,
  getModuleActivity,
  getActivityTimeline,
  countByAction,
  countByModule,
  getMostActiveUsers,
  getApprovalRequests,
  exportAuditLog,
  purgeOldEntries,
} from "./query";
