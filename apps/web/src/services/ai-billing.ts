import api from './api'

export interface UsageStats {
  totalTokens: number
  totalCost: number
  totalQueries: number
  activeUsers: number
}

export interface UsageRecord {
  id: number
  request_id: string
  provider: 'anthropic' | 'openai' | 'azure-openai'
  model: string
  total_tokens: number
  cost_brl: number
  context: string
  status: 'success' | 'error'
  response_time_ms: number | null
  created_at: string
}

export interface StatsResponse {
  success: boolean
  data?: UsageStats
  error?: string
}

export interface UsageResponse {
  success: boolean
  data?: UsageRecord[]
  error?: string
}

export const aiBillingService = {
  /**
   * Busca estatisticas de uso de IA
   */
  async getStats(baseId: number, month?: string): Promise<UsageStats> {
    const params: Record<string, string> = { baseId: baseId.toString() }
    if (month) {
      params.month = month
    }
    const response = await api.get<StatsResponse>('/ai/billing/stats', { params })
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Erro ao buscar estatisticas')
    }
    return response.data.data
  },

  /**
   * Busca uso recente de IA
   */
  async getRecentUsage(baseId: number, limit = 50): Promise<UsageRecord[]> {
    const response = await api.get<UsageResponse>('/ai/billing/usage', {
      params: { baseId: baseId.toString(), limit: limit.toString() }
    })
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Erro ao buscar uso recente')
    }
    return response.data.data
  },

  /**
   * Busca estatisticas de varios meses
   */
  async getMonthlyStats(baseId: number, months: number = 6): Promise<{ month: string; stats: UsageStats }[]> {
    const results: { month: string; stats: UsageStats }[] = []
    const now = new Date()

    for (let i = 0; i < months; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const month = date.toISOString().substring(0, 7) // YYYY-MM

      try {
        const stats = await this.getStats(baseId, month)
        results.push({ month, stats })
      } catch {
        results.push({
          month,
          stats: { totalTokens: 0, totalCost: 0, totalQueries: 0, activeUsers: 0 }
        })
      }
    }

    return results.reverse() // Ordem cronologica
  },
}
