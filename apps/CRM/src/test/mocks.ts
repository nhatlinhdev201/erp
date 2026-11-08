import { vi } from 'vitest'

// ── Mock Prisma Client ──────────────────────────────────────────────

function createModelMock() {
  return {
    findMany: vi.fn().mockResolvedValue([]),
    findUnique: vi.fn().mockResolvedValue(null),
    findFirst: vi.fn().mockResolvedValue(null),
    create: vi.fn().mockResolvedValue({}),
    update: vi.fn().mockResolvedValue({}),
    delete: vi.fn().mockResolvedValue({}),
    count: vi.fn().mockResolvedValue(0),
    upsert: vi.fn().mockResolvedValue({}),
  }
}

export function mockPrismaClient() {
  return {
    contact: createModelMock(),
    company: createModelMock(),
    deal: createModelMock(),
    salesOrder: createModelMock(),
    orderStatusHistory: createModelMock(),
    supportTicket: createModelMock(),
    ticketMessage: createModelMock(),
    webhook: createModelMock(),
    webhookLog: createModelMock(),
    notification: createModelMock(),
    notificationPreference: createModelMock(),
    slaConfig: createModelMock(),
    user: createModelMock(),
    quote: createModelMock(),
    quoteItem: createModelMock(),
    tag: createModelMock(),
    $transaction: vi.fn(async (fn: any) => fn(mockPrismaClient())),
  }
}

// ── Mock User ───────────────────────────────────────────────────────

export function mockCurrentUser(overrides?: Partial<{
  id: string
  email: string
  name: string
  firstName: string
  lastName: string
  role: string
  organizationId: string
  avatarUrl: string | null
  createdAt: Date
  updatedAt: Date
}>) {
  return {
    id: 'user-1',
    email: 'test@your-domain.com',
    name: 'Test User',
    firstName: 'Test',
    lastName: 'User',
    role: 'MANAGER',
    organizationId: 'org-1',
    avatarUrl: null,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
    ...overrides,
  }
}

// ── Mock NextRequest ────────────────────────────────────────────────

export function mockRequest(options: {
  method?: string
  body?: unknown
  params?: Record<string, string>
  searchParams?: Record<string, string>
  url?: string
} = {}) {
  const url = new URL(options.url || 'http://localhost:3013/api/test')
  if (options.searchParams) {
    for (const [k, v] of Object.entries(options.searchParams)) {
      url.searchParams.set(k, v)
    }
  }

  return {
    method: options.method || 'GET',
    url: url.toString(),
    nextUrl: url,
    json: vi.fn().mockResolvedValue(options.body || {}),
    headers: new Headers(),
  } as any
}
