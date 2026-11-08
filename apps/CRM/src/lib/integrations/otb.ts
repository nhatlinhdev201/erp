import { callModule } from '@/lib/integration'

export async function syncPipelineToOtb(forecast: {
  period: string
  totalPipeline: number
  weightedRevenue: number
  wonRevenue: number
  dealsByCategory: Array<{
    category: string
    value: number
    probability: number
  }>
}): Promise<boolean> {
  try {
    await callModule('otb', '/api/internal/demand-signals', {
      method: 'POST',
      body: JSON.stringify({
        source: 'lerp-crm',
        type: 'pipeline-forecast',
        ...forecast,
      }),
    })
    return true
  } catch {
    return false
  }
}

export async function getOtbBudgetInfo(budgetRef: string): Promise<any | null> {
  try {
    return await callModule('otb', `/api/internal/budgets/${budgetRef}`)
  } catch {
    return null
  }
}
