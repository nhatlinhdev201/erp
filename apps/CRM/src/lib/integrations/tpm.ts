import { callModule } from '@/lib/integration'

export async function getActivePromotions(tpmCustomerId: string): Promise<any[]> {
  try {
    const data = await callModule('tpm', `/api/internal/promotions?customerId=${tpmCustomerId}`)
    return data?.promotions || []
  } catch {
    return []
  }
}

export async function syncCustomerSegments(segments: {
  enterprise: string[]
  highValue: string[]
  churning: string[]
}): Promise<boolean> {
  try {
    await callModule('tpm', '/api/internal/segments', {
      method: 'POST',
      body: JSON.stringify({ source: 'lerp-crm', ...segments }),
    })
    return true
  } catch {
    return false
  }
}
