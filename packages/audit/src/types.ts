/**
 * Audit Trail Types
 * @linkk/audit v1.0.0
 */

export enum AuditAction {
  CREATE = "CREATE",
  UPDATE = "UPDATE",
  DELETE = "DELETE",
  READ = "READ",
  LOGIN = "LOGIN",
  LOGOUT = "LOGOUT",
  EXPORT = "EXPORT",
  IMPORT = "IMPORT",
  APPROVE = "APPROVE",
  REJECT = "REJECT",
}

export interface Change {
  field: string;
  oldValue: unknown;
  newValue: unknown;
}

export interface AuditEntry {
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

export interface AuditQueryOptions {
  module?: string;
  entity?: string;
  userId?: string;
  action?: AuditAction;
  dateFrom?: Date;
  dateTo?: Date;
  limit: number;
  offset: number;
}

export interface AuditContext {
  userId: string;
  userName: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
}
