export type CrmEvent =
  | 'crm.deal.stage_changed'
  | 'crm.deal.won'
  | 'crm.deal.lost'
  | 'crm.order.created'
  | 'crm.contact.created'
  | 'crm.quote.accepted'

export interface WebhookPayload {
  event: CrmEvent
  timestamp: string
  data: Record<string, any>
  source: 'lerp-crm'
}

export async function emitEvent(event: CrmEvent, data: Record<string, any>): Promise<WebhookPayload> {
  const payload: WebhookPayload = {
    event,
    timestamp: new Date().toISOString(),
    data,
    source: 'lerp-crm',
  }

  console.log(`[CRM Event] ${event}`, JSON.stringify(payload))

  switch (event) {
    case 'crm.deal.won': {
      const { createMrpWorkOrder } = await import('@/lib/integrations/mrp')
      await createMrpWorkOrder({
        dealId: data.dealId,
        title: data.title,
        products: data.products || [],
        companyName: data.companyName,
        expectedDate: data.expectedDate,
      })
      break
    }
    case 'crm.deal.stage_changed': {
      const { syncPipelineToOtb } = await import('@/lib/integrations/otb')
      await syncPipelineToOtb({
        period: new Date().toISOString().slice(0, 7),
        totalPipeline: data.totalPipeline || 0,
        weightedRevenue: data.weightedRevenue || 0,
        wonRevenue: data.wonRevenue || 0,
        dealsByCategory: [],
      })
      break
    }
  }

  return payload
}
