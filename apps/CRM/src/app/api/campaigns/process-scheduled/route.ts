import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser, AuthError } from '@/lib/auth/get-current-user'
import { canAccess } from '@/lib/auth/rbac'
import { Forbidden, Unauthorized, handleApiError } from '@/lib/api/errors'
import { apiSuccess } from '@/lib/api/response'
import { logger } from '@/lib/logger'

// POST /api/campaigns/process-scheduled — Process due scheduled campaigns
// Call via external cron job (e.g., every 5 minutes)
export async function POST(_req: NextRequest) {
  try {
    const user = await getCurrentUser()

    // ADMIN only
    if (!canAccess(user, 'manage_settings')) {
      throw Forbidden()
    }

    // Find scheduled campaigns that are due
    const dueCampaigns = await prisma.campaign.findMany({
      where: {
        status: 'SCHEDULED',
        scheduledAt: { lte: new Date() },
      },
      select: { id: true, name: true, scheduledAt: true },
    })

    if (dueCampaigns.length === 0) {
      return apiSuccess({ processed: 0, campaigns: [] })
    }

    // Trigger send for each (call the send endpoint internally)
    const results: Array<{ id: string; name: string; success: boolean; error?: string }> = []
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3013'

    for (const campaign of dueCampaigns) {
      try {
        // Forward cookies for auth
        const cookieHeader = _req.headers.get('cookie') || ''
        const res = await fetch(`${appUrl}/api/campaigns/${campaign.id}/send`, {
          method: 'POST',
          headers: { cookie: cookieHeader },
        })

        const data = await res.json()
        results.push({
          id: campaign.id,
          name: campaign.name,
          success: res.ok,
          error: res.ok ? undefined : data.message || 'Send failed',
        })
      } catch (err) {
        results.push({
          id: campaign.id,
          name: campaign.name,
          success: false,
          error: err instanceof Error ? err.message : 'Unknown error',
        })
      }
    }

    logger.audit('campaigns.process_scheduled', user.id, {
      total: dueCampaigns.length,
      results,
    })

    return apiSuccess({
      processed: dueCampaigns.length,
      campaigns: results,
    })
  } catch (error) {
    if (error instanceof AuthError) {
      return handleApiError(Unauthorized(error.message), '/api/campaigns/process-scheduled')
    }
    return handleApiError(error, '/api/campaigns/process-scheduled')
  }
}
