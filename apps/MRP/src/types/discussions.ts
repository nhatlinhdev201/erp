/**
 * Discussions Pro Type Definitions
 * L-ERP MRP Internal Chat System
 */

// =============================================================================
// ENUMS
// =============================================================================

export type ContextType =
  | 'WORK_ORDER'
  | 'BOM'
  | 'PART'
  | 'INVENTORY'
  | 'QC_REPORT'
  | 'MRP_RUN'
  | 'PURCHASE_ORDER'
  | 'SUPPLIER'
  | 'CUSTOMER'
  | 'SALES_ORDER'
  | 'GENERAL';

export type ThreadStatus = 'OPEN' | 'IN_PROGRESS' | 'WAITING' | 'RESOLVED' | 'ARCHIVED';

export type ThreadPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';

export type AttachmentType = 'IMAGE' | 'DOCUMENT' | 'FILE';

export type LinkedEntityType =
  | 'PART'
  | 'BOM'
  | 'WORK_ORDER'
  | 'PURCHASE_ORDER'
  | 'SALES_ORDER'
  | 'SUPPLIER'
  | 'CUSTOMER'
  | 'INVENTORY'
  | 'QC_REPORT'
  | 'MRP_RUN';

// =============================================================================
// BASE TYPES
// =============================================================================

export interface ConversationThread {
  id: string;
  contextType: ContextType;
  contextId: string;
  contextTitle?: string;
  title?: string;
  status: ThreadStatus;
  priority: ThreadPriority;
  createdById: string;
  createdBy?: UserBasic;
  messages?: Message[];
  participants?: ThreadParticipant[];
  createdAt: Date;
  updatedAt: Date;
  lastMessageAt?: Date;
  resolvedAt?: Date;
  resolvedById?: string;
  _count?: {
    messages: number;
    participants: number;
  };
}

export interface Message {
  id: string;
  threadId: string;
  senderId: string;
  sender?: UserBasic;
  content: string;
  isSystemMessage: boolean;
  isEdited: boolean;
  editedAt?: Date;
  mentions?: Mention[];
  attachments?: MessageAttachment[];
  editHistory?: MessageEditHistory[];
  entityLinks?: EntityLink[];
  createdAt: Date;
}

export interface ThreadParticipant {
  id: string;
  threadId: string;
  userId: string;
  user?: UserBasic;
  role?: string;
  joinedAt: Date;
  lastReadAt?: Date;
  lastReadMessageId?: string;
  isMuted: boolean;
}

export interface Mention {
  id: string;
  messageId: string;
  mentionType: 'USER' | 'ROLE' | 'ALL';
  userId?: string | null;
  user?: {
    id: string;
    name: string | null;
  } | null;
  roleName?: string | null;
  startIndex?: number | null;
  endIndex?: number | null;
  isRead: boolean;
  readAt?: Date;
  createdAt: Date;
}

export interface MessageAttachment {
  id: string;
  messageId: string;
  type: AttachmentType;
  filename: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  width?: number;
  height?: number;
  thumbnailUrl?: string;
  capturedContext?: string;
  uploadedById: string;
  uploadedAt: Date;
}

export interface MessageEditHistory {
  id: string;
  messageId: string;
  previousContent: string;
  editedById: string;
  editedAt: Date;
  reason?: string;
}

export interface EntityLink {
  id: string;
  messageId: string;
  entityType: LinkedEntityType;
  entityId: string;
  entityTitle: string;
  entitySubtitle?: string;
  entityIcon?: string;
  entityStatus?: string;
  startIndex?: number;
  endIndex?: number;
  createdAt: Date;
}

// =============================================================================
// HELPER TYPES
// =============================================================================

export interface UserBasic {
  id: string;
  name?: string | null;
  email: string;
}

export interface CapturedContext {
  page: string;
  id?: string;
  title?: string;
  url?: string;
  timestamp?: string;
}

// =============================================================================
// INPUT TYPES
// =============================================================================

export interface CreateThreadInput {
  contextType: ContextType;
  contextId: string;
  contextTitle?: string;
  title?: string;
  priority?: ThreadPriority;
  initialMessage?: string;
}

export interface CreateMessageInput {
  threadId: string;
  content: string;
  attachments?: AttachmentInput[];
  entityLinks?: EntityLinkInput[];
  mentionUserIds?: string[];
  mentionRoles?: string[];
}

export interface AttachmentInput {
  type: AttachmentType;
  filename: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  width?: number;
  height?: number;
  thumbnailUrl?: string;
  capturedContext?: CapturedContext;
}

export interface EntityLinkInput {
  entityType: LinkedEntityType;
  entityId: string;
  entityTitle: string;
  entitySubtitle?: string;
  entityIcon?: string;
  entityStatus?: string;
}

export interface UpdateMessageInput {
  content: string;
  reason?: string;
}

// =============================================================================
// SEARCH TYPES
// =============================================================================

export interface EntitySearchResult {
  id: string;
  type: LinkedEntityType;
  title: string;
  subtitle?: string;
  icon?: string;
  status?: string;
  url: string;
}

// =============================================================================
// DISPLAY CONFIG
// =============================================================================

export const ENTITY_CONFIG: Record<LinkedEntityType, {
  label: string;
  icon: string;
  color: string;
  urlPrefix: string;
}> = {
  PART: {
    label: 'Part',
    icon: 'Package',
    color: 'blue',
    urlPrefix: '/parts',
  },
  BOM: {
    label: 'BOM',
    icon: 'FileStack',
    color: 'purple',
    urlPrefix: '/bom',
  },
  WORK_ORDER: {
    label: 'Work Order',
    icon: 'ClipboardList',
    color: 'orange',
    urlPrefix: '/work-orders',
  },
  PURCHASE_ORDER: {
    label: 'Purchase Order',
    icon: 'ShoppingCart',
    color: 'green',
    urlPrefix: '/purchase-orders',
  },
  SALES_ORDER: {
    label: 'Sales Order',
    icon: 'Receipt',
    color: 'cyan',
    urlPrefix: '/sales-orders',
  },
  SUPPLIER: {
    label: 'Supplier',
    icon: 'Truck',
    color: 'indigo',
    urlPrefix: '/suppliers',
  },
  CUSTOMER: {
    label: 'Customer',
    icon: 'Users',
    color: 'pink',
    urlPrefix: '/customers',
  },
  INVENTORY: {
    label: 'Inventory',
    icon: 'Warehouse',
    color: 'amber',
    urlPrefix: '/inventory',
  },
  QC_REPORT: {
    label: 'QC Report',
    icon: 'CheckCircle',
    color: 'emerald',
    urlPrefix: '/quality',
  },
  MRP_RUN: {
    label: 'MRP Run',
    icon: 'Calculator',
    color: 'slate',
    urlPrefix: '/mrp',
  },
};

export const THREAD_STATUS_CONFIG: Record<ThreadStatus, {
  label: string;
  color: string;
  icon: string;
}> = {
  OPEN: { label: 'Open', color: 'blue', icon: 'CircleDot' },
  IN_PROGRESS: { label: 'In Progress', color: 'amber', icon: 'Clock' },
  WAITING: { label: 'Waiting', color: 'purple', icon: 'Hourglass' },
  RESOLVED: { label: 'Resolved', color: 'green', icon: 'CheckCircle' },
  ARCHIVED: { label: 'Archived', color: 'slate', icon: 'Archive' },
};

export const PRIORITY_CONFIG: Record<ThreadPriority, {
  label: string;
  color: string;
  icon: string;
}> = {
  LOW: { label: 'Low', color: 'slate', icon: 'ChevronDown' },
  NORMAL: { label: 'Normal', color: 'blue', icon: 'Minus' },
  HIGH: { label: 'High', color: 'orange', icon: 'ChevronUp' },
  URGENT: { label: 'Urgent', color: 'red', icon: 'AlertTriangle' },
};
