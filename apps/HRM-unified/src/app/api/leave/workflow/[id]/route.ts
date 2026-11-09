// src/app/api/leave/workflow/[id]/route.ts
// Update definition (toggle active / rename) + replace steps ordering

import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { withErrorHandler, Errors, successResponse } from '@/lib/errors'

export const PATCH = withErrorHandler(async (request: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
  const session = await auth()
  if (!session?.user?.tenantId) throw Errors.unauthorized()
  if (session.user.role !== 'ADMIN' && session.user.role !== 'HR_MANAGER') {
    throw Errors.forbidden('Chỉ ADMIN/HR mới được cấu hình workflow')
  }

  const { id } = await ctx.params
  const existing = await db.workflowDefinition.findFirst({
    where: { id, tenantId: session.user.tenantId },
  })
  if (!existing) throw Errors.notFound('Không tìm thấy workflow')

  const body = await request.json()
  const data: Record<string, unknown> = {}
  if (body.isActive !== undefined) data.isActive = Boolean(body.isActive)
  if (body.name !== undefined) data.name = body.name
  if (body.description !== undefined) data.description = body.description

  // Thay thế steps: update theo id (giữ FK lịch sử), create step mới,
  // chỉ delete step cũ KHÔNG còn được tham chiếu bởi approval_steps.
  if (Array.isArray(body.steps)) {
    const incoming = body.steps as Array<Record<string, unknown>>
    const keepIds = incoming.filter((s) => s.id).map((s) => s.id as string)

    // Steps cũ không còn trong danh sách — xoá nếu chưa có lịch sử duyệt
    const removable = await db.workflowStep.findMany({
      where: { definitionId: id, id: { notIn: keepIds } },
      include: { _count: { select: { approvals: true } } },
    })
    const blocked = removable.filter((s) => (s._count as { approvals: number }).approvals > 0)
    const deletableIds = removable.filter((s) => (s._count as { approvals: number }).approvals === 0).map((s) => s.id)
    if (deletableIds.length) {
      await db.workflowStep.deleteMany({ where: { id: { in: deletableIds } } })
    }

    for (let i = 0; i < incoming.length; i++) {
      const s = incoming[i]
      const payload = {
        stepOrder: i + 1,
        name: s.name as string,
        approverType: (s.approverType as string) ?? 'HR_MANAGER',
        specificRole: (s.specificRole as string) ?? null,
        slaHours: s.slaHours ? Number(s.slaHours) : null,
        canSkip: Boolean(s.canSkip),
        approvalMode: (s.approvalMode as string) ?? 'SEQUENTIAL',
      }
      if (s.id) {
        await db.workflowStep.update({ where: { id: s.id as string }, data: payload })
      } else {
        await db.workflowStep.create({ data: { definitionId: id, ...payload } })
      }
    }

    // Áp cả các field khác (isActive/name/description) rồi trả trạng thái mới nhất
    const definition0 = await db.workflowDefinition.update({
      where: { id },
      data,
      include: { steps: { orderBy: { stepOrder: 'asc' } } },
    })
    if (blocked.length) {
      console.warn(`[leave-workflow] ${blocked.length} bước đã có lịch sử duyệt, giữ nguyên thay vì xoá: ${blocked.map((b) => b.name).join(', ')}`)
    }
    return successResponse(definition0 as unknown as Record<string, unknown>, 200)
  }

  const definition = await db.workflowDefinition.update({
    where: { id },
    data,
    include: { steps: { orderBy: { stepOrder: 'asc' } } },
  })
  return successResponse(definition as unknown as Record<string, unknown>)
})

export const DELETE = withErrorHandler(async (_request: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
  const session = await auth()
  if (!session?.user?.tenantId) throw Errors.unauthorized()
  if (session.user.role !== 'ADMIN' && session.user.role !== 'HR_MANAGER') {
    throw Errors.forbidden('Chỉ ADMIN/HR mới được cấu hình workflow')
  }

  const { id } = await ctx.params
  const existing = await db.workflowDefinition.findFirst({
    where: { id, tenantId: session.user.tenantId },
    include: { _count: { select: { instances: true } } },
  })
  if (!existing) throw Errors.notFound('Không tìm thấy workflow')
  if (existing._count.instances > 0) {
    // Đang có instance chạy — chỉ deactivate, không xoá (giữ ràng buộc FK)
    await db.workflowDefinition.update({ where: { id }, data: { isActive: false } })
    throw Errors.badRequest(`Workflow đã có ${existing._count.instances} instance — đã chuyển sang vô hiệu hoá thay vì xoá`)
  }

  await db.workflowDefinition.delete({ where: { id } })
  return successResponse({ id } as Record<string, unknown>)
})
