// src/app/api/contracts/route.ts
// Contracts API — list / create
// Bổ sung tính năng "Hợp đồng" (upstream chỉ có model + seed, thiếu API & UI)

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { withErrorHandler, Errors, successResponse } from '@/lib/errors'
import { safeParseInt } from '@/lib/api/parse-params'
import type { ContractStatus, ContractType, Prisma } from '@prisma/client'

export const GET = withErrorHandler(async (request: NextRequest) => {
  const session = await auth()
  if (!session?.user?.tenantId) throw Errors.unauthorized()

  const tenantId = session.user.tenantId
  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status') as ContractStatus | null
  const type = searchParams.get('type') as ContractType | null
  const search = searchParams.get('search')?.trim()
  const expiringInDays = safeParseInt(searchParams.get('expiringInDays'), 0)
  const page = safeParseInt(searchParams.get('page'), 1)
  const pageSize = safeParseInt(searchParams.get('pageSize'), 20)

  const where: Prisma.ContractWhereInput = { tenantId }
  if (status) where.status = status
  if (type) where.contractType = type
  if (search) {
    where.OR = [
      { contractNumber: { contains: search, mode: 'insensitive' } },
      { employee: { fullName: { contains: search, mode: 'insensitive' } } },
      { employee: { employeeCode: { contains: search, mode: 'insensitive' } } },
    ]
  }
  if (expiringInDays > 0) {
    const now = new Date()
    const until = new Date(now.getTime() + expiringInDays * 86400000)
    where.status = 'ACTIVE'
    where.endDate = { gte: now, lte: until }
  }

  const [total, contracts, stats] = await Promise.all([
    db.contract.count({ where }),
    db.contract.findMany({
      where,
      orderBy: [{ startDate: 'desc' }],
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        employee: {
          select: { id: true, employeeCode: true, fullName: true, position: { select: { name: true } } },
        },
      },
    }),
    db.contract.groupBy({
      by: ['status'],
      where: { tenantId },
      _count: { _all: true },
    }),
  ])

  // Sắp hết hạn trong 30 ngày
  const expiringCount = await db.contract.count({
    where: {
      tenantId,
      status: 'ACTIVE',
      endDate: { gte: new Date(), lte: new Date(Date.now() + 30 * 86400000) },
    },
  })

  const statusCounts: Record<string, number> = Object.fromEntries(
    stats.map((s) => [s.status, s._count._all])
  )

  // Trả JSON riêng để kèm cả stats (paginatedResponse mặc định chỉ có paging)
  return NextResponse.json({
    success: true,
    data: contracts,
    pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    meta: { statusCounts, expiringCount },
  })
})

export const POST = withErrorHandler(async (request: NextRequest) => {
  const session = await auth()
  if (!session?.user?.tenantId) throw Errors.unauthorized()
  const tenantId = session.user.tenantId

  const body = await request.json()
  const { employeeId, contractNumber, contractType, startDate, endDate, baseSalary, signedDate } = body ?? {}

  if (!employeeId || !contractNumber || !contractType || !startDate || !baseSalary) {
    throw Errors.badRequest('Thiếu trường bắt buộc: employeeId, contractNumber, contractType, startDate, baseSalary')
  }

  // Nhân viên phải thuộc tenant
  const employee = await db.employee.findFirst({ where: { id: employeeId, tenantId } })
  if (!employee) throw Errors.notFound('Không tìm thấy nhân viên')

  // Trùng số hợp đồng trong tenant
  const exists = await db.contract.findUnique({
    where: { tenantId_contractNumber: { tenantId, contractNumber } },
  })
  if (exists) throw Errors.badRequest(`Số hợp đồng "${contractNumber}" đã tồn tại`)

  const contract = await db.contract.create({
    data: {
      tenantId,
      employeeId,
      contractNumber,
      contractType,
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : null,
      signedDate: signedDate ? new Date(signedDate) : null,
      baseSalary,
      status: body.status ?? 'DRAFT',
      notes: body.notes ?? null,
    },
  })

  return successResponse(contract as unknown as Record<string, unknown>, 201)
})
