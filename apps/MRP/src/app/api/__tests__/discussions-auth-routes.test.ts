/**
 * Discussions Sub-Routes & Auth Routes Tests
 * Tests for:
 *   - GET /api/discussions/entities/search
 *   - PATCH/DELETE /api/discussions/messages/[messageId]
 *   - GET /api/discussions/threads/list
 *   - POST /api/auth/forgot-password
 *   - GET/POST /api/auth/reset-password
 */

import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// =============================================================================
// MOCKS - use vi.hoisted so mock references are available in hoisted vi.mock
// =============================================================================

const {
  mockEmailSend,
  mockValidateResetToken,
  mockValidateResetTokenWithUser,
} = vi.hoisted(() => ({
  mockEmailSend: vi.fn(),
  mockValidateResetToken: vi.fn(),
  mockValidateResetTokenWithUser: vi.fn(),
}));

// --- Prisma ---
vi.mock('@/lib/prisma', () => {
  const p = {
    part: { findMany: vi.fn() },
    bomHeader: { findMany: vi.fn() },
    workOrder: { findMany: vi.fn() },
    purchaseOrder: { findMany: vi.fn() },
    salesOrder: { findMany: vi.fn() },
    supplier: { findMany: vi.fn() },
    customer: { findMany: vi.fn() },
    inventory: { findMany: vi.fn() },
    message: {
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    messageEditHistory: { create: vi.fn() },
    conversationThread: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
    threadParticipant: { findFirst: vi.fn() },
    $transaction: vi.fn(),
    user: { findUnique: vi.fn(), update: vi.fn() },
    passwordResetToken: {
      create: vi.fn(),
      updateMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  };
  return { prisma: p, default: p };
});

// --- Auth ---
vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}));

// --- Rate limit ---
vi.mock('@/lib/rate-limit', () => ({
  checkReadEndpointLimit: vi.fn().mockResolvedValue(null),
  checkWriteEndpointLimit: vi.fn().mockResolvedValue(null),
  checkHeavyEndpointLimit: vi.fn().mockResolvedValue({ success: true, limit: 100, remaining: 99, retryAfter: 0 }),
}));

// --- Logger ---
vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    logError: vi.fn(),
  },
}));

// --- Socket.io broadcasts ---
vi.mock('@/lib/socket/emit', () => ({
  broadcastMessageUpdate: vi.fn(),
  broadcastMessageDelete: vi.fn(),
}));

// --- Discussion types ---
vi.mock('@/types/discussions', () => ({
  LinkedEntityType: {},
  ENTITY_CONFIG: {
    PART: { label: 'Part' },
    BOM: { label: 'BOM' },
    WORK_ORDER: { label: 'Work Order' },
    PURCHASE_ORDER: { label: 'Purchase Order' },
    SALES_ORDER: { label: 'Sales Order' },
    SUPPLIER: { label: 'Supplier' },
    CUSTOMER: { label: 'Customer' },
    INVENTORY: { label: 'Inventory' },
    QC_REPORT: { label: 'QC Report' },
    MRP_RUN: { label: 'MRP Run' },
  },
}));

// --- Email service ---
vi.mock('@/lib/email/email-service', () => ({
  emailService: {
    send: (...args: unknown[]) => mockEmailSend(...args),
  },
}));

// --- Password reset utils ---
vi.mock('@/lib/auth/password-reset-utils', () => ({
  validateResetToken: (...args: unknown[]) => mockValidateResetToken(...args),
  validateResetTokenWithUser: (...args: unknown[]) => mockValidateResetTokenWithUser(...args),
  TokenValidationError: class TokenValidationError extends Error {
    code: string;
    constructor(message: string, code: string) {
      super(message);
      this.name = 'TokenValidationError';
      this.code = code;
    }
  },
}));

// --- bcryptjs ---
vi.mock('bcryptjs', () => ({
  default: {
    compare: vi.fn(),
    hash: vi.fn().mockResolvedValue('$2a$12$hashedpassword'),
  },
}));

// =============================================================================
// ROUTE IMPORTS (after mocks)
// =============================================================================

import { GET as ENTITY_SEARCH_GET } from '../discussions/entities/search/route';
import { PATCH as MESSAGE_PATCH, DELETE as MESSAGE_DELETE } from '../discussions/messages/[messageId]/route';
import { GET as THREADS_LIST_GET } from '../discussions/threads/list/route';
import { POST as FORGOT_PASSWORD_POST } from '../auth/forgot-password/route';
import { GET as RESET_PASSWORD_GET, POST as RESET_PASSWORD_POST } from '../auth/reset-password/route';

// =============================================================================
// HELPERS
// =============================================================================

// Cast prisma to any for easy mock access
const mockPrisma = prisma as unknown as Record<string, Record<string, Mock>>;

const mockContext = { params: Promise.resolve({}) };
const mockMessageContext = { params: Promise.resolve({ messageId: 'msg-1' }) };

const mockSession = {
  user: { id: 'user1', email: 'test@test.com', role: 'ADMIN', name: 'Test User' },
};

// =============================================================================
// TESTS: Discussion Entity Search
// =============================================================================

describe('Discussion Entity Search API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (auth as Mock).mockResolvedValue(mockSession);
  });

  it('should return 401 when not authenticated', async () => {
    (auth as Mock).mockResolvedValue(null);

    const request = new NextRequest('http://localhost:3000/api/discussions/entities/search?type=PART&q=test');
    const response = await ENTITY_SEARCH_GET(request, mockContext);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('should return 400 for invalid entity type', async () => {
    const request = new NextRequest('http://localhost:3000/api/discussions/entities/search?type=INVALID&q=test');
    const response = await ENTITY_SEARCH_GET(request, mockContext);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid entity type');
  });

  it('should search parts successfully', async () => {
    (mockPrisma.part.findMany as Mock).mockResolvedValue([
      {
        id: 'part-1',
        partNumber: 'PN-001',
        name: 'Widget A',
        category: 'Raw Material',
        unit: 'EA',
        lifecycleStatus: 'active',
        updatedAt: new Date(),
      },
    ]);

    const request = new NextRequest('http://localhost:3000/api/discussions/entities/search?type=PART&q=Widget');
    const response = await ENTITY_SEARCH_GET(request, mockContext);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.results).toHaveLength(1);
    expect(data.results[0].type).toBe('PART');
    expect(data.results[0].title).toContain('PN-001');
  });

  it('should return empty results for QC_REPORT type', async () => {
    const request = new NextRequest('http://localhost:3000/api/discussions/entities/search?type=QC_REPORT&q=test');
    const response = await ENTITY_SEARCH_GET(request, mockContext);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.results).toHaveLength(0);
  });
});

// =============================================================================
// TESTS: Discussion Messages
// =============================================================================

describe('Discussion Messages API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (auth as Mock).mockResolvedValue(mockSession);
  });

  it('PATCH should return 404 when message not found', async () => {
    (mockPrisma.message.findUnique as Mock).mockResolvedValue(null);

    const request = new NextRequest('http://localhost:3000/api/discussions/messages/msg-1', {
      method: 'PATCH',
      body: JSON.stringify({ content: 'Updated content' }),
    });
    const response = await MESSAGE_PATCH(request, mockMessageContext);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Message not found');
  });

  it('PATCH should return 403 when user is not the sender', async () => {
    (mockPrisma.message.findUnique as Mock).mockResolvedValue({
      id: 'msg-1',
      senderId: 'other-user',
      content: 'Original content',
      thread: { status: 'ACTIVE' },
    });

    const request = new NextRequest('http://localhost:3000/api/discussions/messages/msg-1', {
      method: 'PATCH',
      body: JSON.stringify({ content: 'Updated content' }),
    });
    const response = await MESSAGE_PATCH(request, mockMessageContext);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe('You can only edit your own messages');
  });

  it('PATCH should return 403 when thread is archived', async () => {
    (mockPrisma.message.findUnique as Mock).mockResolvedValue({
      id: 'msg-1',
      senderId: 'user1',
      content: 'Original content',
      thread: { status: 'ARCHIVED' },
    });

    const request = new NextRequest('http://localhost:3000/api/discussions/messages/msg-1', {
      method: 'PATCH',
      body: JSON.stringify({ content: 'Updated content' }),
    });
    const response = await MESSAGE_PATCH(request, mockMessageContext);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe('Cannot edit messages in archived thread');
  });

  it('PATCH should update message successfully', async () => {
    (mockPrisma.message.findUnique as Mock).mockResolvedValue({
      id: 'msg-1',
      senderId: 'user1',
      content: 'Original content',
      threadId: 'thread-1',
      thread: { status: 'ACTIVE' },
    });

    const updatedMessage = {
      id: 'msg-1',
      content: 'Updated content',
      senderId: 'user1',
      sender: { id: 'user1', name: 'Test User', email: 'test@test.com' },
      attachments: [],
      editHistory: [],
      entityLinks: [],
      isEdited: true,
      editedAt: new Date(),
      createdAt: new Date(),
    };

    (mockPrisma.$transaction as unknown as Mock).mockResolvedValue([{}, updatedMessage]);

    const request = new NextRequest('http://localhost:3000/api/discussions/messages/msg-1', {
      method: 'PATCH',
      body: JSON.stringify({ content: 'Updated content' }),
    });
    const response = await MESSAGE_PATCH(request, mockMessageContext);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.message).toBeDefined();
    expect(data.message.content).toBe('Updated content');
  });

  it('DELETE should return 404 when message not found', async () => {
    (mockPrisma.message.findUnique as Mock).mockResolvedValue(null);

    const request = new NextRequest('http://localhost:3000/api/discussions/messages/msg-1', {
      method: 'DELETE',
    });
    const response = await MESSAGE_DELETE(request, mockMessageContext);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Message not found');
  });

  it('DELETE should return 403 when user is not the sender', async () => {
    (mockPrisma.message.findUnique as Mock).mockResolvedValue({
      id: 'msg-1',
      senderId: 'other-user',
      thread: { status: 'ACTIVE' },
    });

    const request = new NextRequest('http://localhost:3000/api/discussions/messages/msg-1', {
      method: 'DELETE',
    });
    const response = await MESSAGE_DELETE(request, mockMessageContext);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe('You can only delete your own messages');
  });

  it('DELETE should delete message successfully', async () => {
    (mockPrisma.message.findUnique as Mock).mockResolvedValue({
      id: 'msg-1',
      senderId: 'user1',
      threadId: 'thread-1',
      thread: { status: 'ACTIVE' },
    });
    (mockPrisma.message.delete as Mock).mockResolvedValue({});

    const request = new NextRequest('http://localhost:3000/api/discussions/messages/msg-1', {
      method: 'DELETE',
    });
    const response = await MESSAGE_DELETE(request, mockMessageContext);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(mockPrisma.message.delete).toHaveBeenCalledWith({ where: { id: 'msg-1' } });
  });
});

// =============================================================================
// TESTS: Discussion Threads List
// =============================================================================

describe('Discussion Threads List API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (auth as Mock).mockResolvedValue(mockSession);
  });

  it('should return 401 when not authenticated', async () => {
    (auth as Mock).mockResolvedValue(null);

    const request = new NextRequest('http://localhost:3000/api/discussions/threads/list');
    const response = await THREADS_LIST_GET(request, mockContext);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('should return paginated threads list', async () => {
    const mockThreads = [
      {
        id: 'thread-1',
        title: 'Test Thread',
        contextType: 'PART',
        contextTitle: 'Widget A',
        status: 'ACTIVE',
        createdById: 'user1',
        createdBy: { id: 'user1', name: 'Test User', email: 'test@test.com' },
        participants: [],
        messages: [{
          id: 'msg-1',
          content: 'Last message',
          createdAt: new Date(),
          sender: { id: 'user1', name: 'Test User', email: 'test@test.com' },
        }],
        _count: { messages: 5, participants: 2 },
        lastMessageAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    (mockPrisma.conversationThread as unknown as { findMany: Mock; count: Mock }).findMany.mockResolvedValue(mockThreads);
    (mockPrisma.conversationThread as unknown as { findMany: Mock; count: Mock }).count.mockResolvedValue(1);
    (mockPrisma.threadParticipant as unknown as { findFirst: Mock }).findFirst.mockResolvedValue({
      userId: 'user1',
      lastReadAt: new Date(Date.now() - 86400000), // 1 day ago
    });
    (mockPrisma.message.count as Mock).mockResolvedValue(2);

    const request = new NextRequest('http://localhost:3000/api/discussions/threads/list?page=1&limit=20');
    const response = await THREADS_LIST_GET(request, mockContext);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.threads).toHaveLength(1);
    expect(data.pagination).toBeDefined();
    expect(data.pagination.total).toBe(1);
    expect(data.pagination.page).toBe(1);
    expect(data.threads[0].unreadCount).toBe(2);
  });
});

// =============================================================================
// TESTS: Auth - Forgot Password
// =============================================================================

describe('Auth Forgot Password API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 400 for invalid email', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email: 'not-an-email' }),
    });
    const response = await FORGOT_PASSWORD_POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
  });

  it('should return success even when user not found (prevent enumeration)', async () => {
    (mockPrisma.user.findUnique as Mock).mockResolvedValue(null);

    const request = new NextRequest('http://localhost:3000/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email: 'nonexistent@example.com' }),
    });
    const response = await FORGOT_PASSWORD_POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    // Should not have attempted to create a token
    expect(mockPrisma.passwordResetToken.create).not.toHaveBeenCalled();
  });

  it('should create reset token and send email for valid user', async () => {
    (mockPrisma.user.findUnique as Mock).mockResolvedValue({
      id: 'user1',
      email: 'user@example.com',
      name: 'Test User',
      status: 'active',
    });
    (mockPrisma.passwordResetToken as unknown as { updateMany: Mock }).updateMany.mockResolvedValue({ count: 0 });
    (mockPrisma.passwordResetToken.create as Mock).mockResolvedValue({
      id: 'token-1',
      token: 'abc123',
      userId: 'user1',
    });
    mockEmailSend.mockResolvedValue({ success: true });

    const request = new NextRequest('http://localhost:3000/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email: 'user@example.com' }),
    });
    const response = await FORGOT_PASSWORD_POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(mockPrisma.passwordResetToken.create).toHaveBeenCalled();
    expect(mockEmailSend).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'user@example.com',
        subject: expect.stringContaining('L-ERP MRP'),
      })
    );
  });
});

// =============================================================================
// TESTS: Auth - Reset Password
// =============================================================================

describe('Auth Reset Password API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('GET should return 400 when token is missing', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/reset-password');
    const response = await RESET_PASSWORD_GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
  });

  it('GET should return success for valid token', async () => {
    mockValidateResetToken.mockResolvedValue({
      id: 'token-1',
      token: 'valid-token',
      userId: 'user1',
      expiresAt: new Date(Date.now() + 3600000),
    });

    const request = new NextRequest('http://localhost:3000/api/auth/reset-password?token=valid-token');
    const response = await RESET_PASSWORD_GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.valid).toBe(true);
  });

  it('GET should return 400 for invalid/expired token', async () => {
    // Import the mock class to throw it
    const { TokenValidationError } = await import('@/lib/auth/password-reset-utils');
    mockValidateResetToken.mockRejectedValue(new TokenValidationError('Token da het han', 'EXPIRED'));

    const request = new NextRequest('http://localhost:3000/api/auth/reset-password?token=expired-token');
    const response = await RESET_PASSWORD_GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toContain('Token da het han');
  });

  it('POST should return 400 when validation fails (weak password)', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({
        token: 'valid-token',
        newPassword: 'short',
        confirmPassword: 'short',
      }),
    });
    const response = await RESET_PASSWORD_POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
  });

  it('POST should return 400 when passwords do not match', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({
        token: 'valid-token',
        newPassword: 'StrongP@ssw0rd!',
        confirmPassword: 'Different@ssw0rd!',
      }),
    });
    const response = await RESET_PASSWORD_POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
  });

  it('POST should reset password successfully', async () => {
    const bcrypt = await import('bcryptjs');
    (bcrypt.default.compare as Mock).mockResolvedValue(false); // new password is different

    mockValidateResetTokenWithUser.mockResolvedValue({
      id: 'token-1',
      token: 'valid-token',
      userId: 'user1',
      expiresAt: new Date(Date.now() + 3600000),
      user: {
        id: 'user1',
        email: 'user@example.com',
        password: '$2a$12$oldhashpassword',
      },
    });

    (mockPrisma.$transaction as unknown as Mock).mockResolvedValue([{}, {}]);

    const request = new NextRequest('http://localhost:3000/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({
        token: 'valid-token',
        newPassword: 'NewStr0ng!Pass#',
        confirmPassword: 'NewStr0ng!Pass#',
      }),
    });
    const response = await RESET_PASSWORD_POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toContain('thành công');
    expect(mockValidateResetTokenWithUser).toHaveBeenCalledWith('valid-token');
  });

  it('POST should return 400 when new password is same as old', async () => {
    const bcrypt = await import('bcryptjs');
    (bcrypt.default.compare as Mock).mockResolvedValue(true); // same password

    mockValidateResetTokenWithUser.mockResolvedValue({
      id: 'token-1',
      token: 'valid-token',
      userId: 'user1',
      expiresAt: new Date(Date.now() + 3600000),
      user: {
        id: 'user1',
        email: 'user@example.com',
        password: '$2a$12$existinghash',
      },
    });

    const request = new NextRequest('http://localhost:3000/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({
        token: 'valid-token',
        newPassword: 'NewStr0ng!Pass#',
        confirmPassword: 'NewStr0ng!Pass#',
      }),
    });
    const response = await RESET_PASSWORD_POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toContain('trùng');
  });
});
