// src/app/api/leave/workflow/route.ts
// Leave approval workflow settings — list definitions (LEAVE_REQUEST) + steps

import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { withErrorHandler, Errors, successResponse } from '@/lib/errors'

export const GET = withErrorHandler(async (_request: NextRequest) => {
  const session = await auth()
  if (!session?.user?.tenantId) throw Errors.unauthorized()

  const definitions = await db.workflowDefinition.findMany({
    where: { tenantId: session.user.tenantId, workflowType: 'LEAVE_REQUEST' },
    include: {
      steps: { orderBy: { stepOrder: 'asc' } },
      _count: { select: { instances: true } },
    },
    orderBy: { createdAt: 'asc' },
  })

  return successResponse(definitions as unknown as Record<string, unknown>[])
})

// Tạo workflow LEAVE_REQUEST mới (kèm steps)
export const POST = withErrorHandler(async (request: NextRequest) => {
  const session = await auth()
  if (!session?.user?.tenantId) throw Errors.unauthorized()
  if (session.user.role !== 'ADMIN' && session.user.role !== 'HR_MANAGER') {
    throw Errors.forbidden('Chỉ ADMIN/HR mới được cấu hình workflow')
  }

  const body = await request.json()
  const { name, code, description, steps } = body ?? {}
  if (!name || !code) throw Errors.badRequest('Cần name và code')

  const exists = await db.workflowDefinition.findUnique({
    where: { tenantId_code: { tenantId: session.user.tenantId, code } },
  })
  if (exists) throw Errors.badRequest(`Code "${code}" đã tồn tại`)

  const definition = await db.workflowDefinition.create({
    data: {
      tenantId: session.user.tenantId,
      name,
      code,
      description: description ?? null,
      workflowType: 'LEAVE_REQUEST',
      steps: {
        create: (steps ?? []).map((s: Record<string, unknown>, i: number) => ({
          stepOrder: i + 1,
          name: s.name as string,
          approverType: (s.approverType as string) ?? 'HR_MANAGER',
          slaHours: s.slaHours ? Number(s.slaHours) : null,
          canSkip: Boolean(s.canSkip),
          approvalMode: (s.approvalMode as string) ?? 'SEQUENTIAL',
        })),
      },
    },
    include: { steps: { orderBy: { stepOrder: 'asc' } } },
  })

  return successResponse(definition as unknown as Record<string, unknown>, 201)
})
