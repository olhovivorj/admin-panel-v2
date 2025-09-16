import api from './api'

export interface SystemStatus {
  status: 'online' | 'offline' | 'maintenance'
  uptime: number
  version: string
  environment: string
  database: {
    connected: boolean
    host: string
  }
  memory: {
    used: number
    total: number
    percentage: number
  }
  cpu: {
    usage: number
    cores: number
  }
}

export interface DashboardStats {
  totalUsers: number
  activeUsers: number
  totalBases: number
  activeBases: number
  lastUpdate: string
}

export const systemService = {
  // Status do sistema
  async getSystemStatus(): Promise<SystemStatus> {
    const response = await api.get('/admin/sistema/status')
    return response.data
  },

  // Estatísticas do dashboard
  async getDashboardStats(): Promise<DashboardStats> {
    const response = await api.get('/admin/dashboard/stats')
    return response.data
  },

  // Health check simples
  async healthCheck() {
    const response = await api.get('/health')
    return response.data
  },
}