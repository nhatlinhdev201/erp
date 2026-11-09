// src/app/api/contracts/[id]/route.ts
// Contracts API — update / delete từng hợp đồng

import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { withErrorHandler, Errors, successResponse } from '@/lib/errors'
import type { ContractStatus } from '@prisma/client'

export const PATCH = withErrorHandler(async (request: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
  const session = await auth()
  if (!session?.user?.tenantId) throw Errors.unauthorized()

  const { id } = await ctx.params
  const body = await request.json()
  const { status, terminationDate, terminationReason, endDate, notes, baseSalary } = body ?? {}

  const existing = await db.contract.findFirst({
    where: { id, tenantId: session.user.tenantId },
  })
  if (!existing) throw Errors.notFound('Không tìm thấy hợp đồng')

  const data: Record<string, unknown> = {}
  if (status !== undefined) data.status = status as ContractStatus
  if (endDate !== undefined) data.endDate = endDate ? new Date(endDate) : null
  if (notes !== undefined) data.notes = notes
  if (baseSalary !== undefined) data.baseSalary = baseSalary
  if (status === 'TERMINATED') {
    data.terminationDate = terminationDate ? new Date(terminationDate) : new Date()
    data.terminationReason = terminationReason ?? null
  }

  const contract = await db.contract.update({ where: { id }, data })
  return successResponse(contract as unknown as Record<string, unknown>)
})

export const DELETE = withErrorHandler(async (_request: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
  const session = await auth()
  if (!session?.user?.tenantId) throw Errors.unauthorized()

  const { id } = await ctx.params
  const existing = await db.contract.findFirst({
    where: { id, tenantId: session.user.tenantId },
  })
  if (!existing) throw Errors.notFound('Không tìm thấy hợp đồng')

  await db.contract.delete({ where: { id } })
  return successResponse({ id } as Record<string, unknown>)
})
