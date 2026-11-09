// src/app/api/leave/requests/[id]/approve/route.ts
// Phê duyệt đơn nghỉ (admin/HR) — PENDING → APPROVED

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { leaveRequestService } from '@/services/leave-request.service'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    // TODO rbac: chỉ ADMIN/HR_MANAGER — hiện cho mọi user đã đăng nhập của tenant
    const { id } = await params
    const body = await request.json().catch(() => ({}))

    const result = await leaveRequestService.approve(
      session.user.tenantId,
      id,
      session.user.id,
      body?.notes
    )
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error approving leave request:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Không thể phê duyệt đơn nghỉ' },
      { status: 400 }
    )
  }
}
