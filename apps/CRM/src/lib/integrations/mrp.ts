import { callModule } from '@/lib/integration'

export interface MrpPartAvailability {
  partId: string
  partNumber: string
  inStock: number
  reserved: number
  available: number
  unit: string
  lastUpdated: string
}

export async function checkMrpAvailability(
  mrpPartId: string
): Promise<MrpPartAvailability | null> {
  try {
    return await callModule('mrp', `/api/internal/parts/${mrpPartId}/availability`)
  } catch {
    return null
  }
}

export async function createMrpWorkOrder(dealData: {
  dealId: string
  title: string
  products: Array<{ mrpPartId: string; quantity: number }>
  companyName: string
  expectedDate: string
}): Promise<{ workOrderId: string } | null> {
  try {
    return await callModule('mrp', '/api/internal/work-orders', {
      method: 'POST',
      body: JSON.stringify({
        source: 'lerp-crm',
        sourceDealId: dealData.dealId,
        title: `[CRM] ${dealData.title}`,
        items: dealData.products,
        customer: dealData.companyName,
        dueDate: dealData.expectedDate,
      }),
    })
  } catch {
    return null
  }
}

export async function getMrpParts(search?: string): Promise<any[]> {
  try {
    const query = search ? `?search=${encodeURIComponent(search)}` : ''
    const data = await callModule('mrp', `/api/internal/parts${query}`)
    return data?.parts || []
  } catch {
    return []
  }
}
