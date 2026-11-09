// src/app/api/leave/requests/[id]/reject/route.ts
// Từ chối đơn nghỉ (admin/HR) — PENDING → REJECTED (trả lại ngày đã giữ)

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
    const { id } = await params
    const body = await request.json().catch(() => ({}))
    if (!body?.reason?.trim()) {
      return NextResponse.json({ error: 'Cần lý do từ chối' }, { status: 400 })
    }

    const result = await leaveRequestService.reject(
      session.user.tenantId,
      id,
      session.user.id,
      body.reason
    )
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error rejecting leave request:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Không thể từ chối đơn nghỉ' },
      { status: 400 }
    )
  }
}
