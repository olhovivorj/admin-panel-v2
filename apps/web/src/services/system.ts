import { api } from './api'

export interface ServiceHealth {
  name: string
  status: 'healthy' | 'unhealthy' | 'unknown'
  responseTimeMs: number
  details?: {
    isConnected?: boolean
    uptimeMs?: number
    reconnectAttempts?: number
    lastError?: string | null
    currentBackoffMs?: number
  }
  error?: string
}

export interface SystemHealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy'
  timestamp: string
  services: ServiceHealth[]
}

export const systemService = {
  async getSystemHealth(): Promise<SystemHealthResponse> {
    const response = await api.get<SystemHealthResponse>('/system/health')
    return response.data
  },
}
