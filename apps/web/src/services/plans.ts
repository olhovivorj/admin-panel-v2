import api from './api'

export interface Plan {
  id: number
  name: string
  displayName: string
  description?: string
  price: number
  isActive: boolean
  features?: Record<string, any>
  limits?: Record<string, any>
  createdAt: string
  updatedAt: string
  pagesCount: number
  usersCount: number
}

export interface PlanWithDetails extends Plan {
  pages: {
    id: number
    name: string
    displayName: string
    path: string
    category?: string
    appName?: string
    appDisplayName?: string
  }[]
  users: {
    id: number
    nome: string
    email: string
  }[]
}

export interface CreatePlanDto {
  name: string
  displayName: string
  description?: string
  price?: number
  isActive?: boolean
  features?: Record<string, any>
  limits?: Record<string, any>
}

export interface UpdatePlanDto {
  name?: string
  displayName?: string
  description?: string
  price?: number
  isActive?: boolean
  features?: Record<string, any>
  limits?: Record<string, any>
}

export const plansService = {
  // Listar planos
  async getPlans(includeInactive = false): Promise<Plan[]> {
    const response = await api.get('/plans', {
      params: { includeInactive: includeInactive ? 'true' : undefined }
    })
    return response.data
  },

  // Buscar plano por ID
  async getPlan(id: number): Promise<PlanWithDetails> {
    const response = await api.get(`/plans/${id}`)
    return response.data
  },

  // Criar plano
  async createPlan(data: CreatePlanDto): Promise<PlanWithDetails> {
    const response = await api.post('/plans', data)
    return response.data
  },

  // Atualizar plano
  async updatePlan(id: number, data: UpdatePlanDto): Promise<PlanWithDetails> {
    const response = await api.put(`/plans/${id}`, data)
    return response.data
  },

  // Deletar plano
  async deletePlan(id: number): Promise<{ message: string }> {
    const response = await api.delete(`/plans/${id}`)
    return response.data
  },

  // Toggle status
  async toggleStatus(id: number): Promise<{ id: number; isActive: boolean; message: string }> {
    const response = await api.patch(`/plans/${id}/toggle-status`)
    return response.data
  },

  // Listar páginas do plano
  async getPages(id: number): Promise<any[]> {
    const response = await api.get(`/plans/${id}/pages`)
    return response.data
  },

  // Atribuir páginas ao plano
  async setPages(id: number, pageIds: number[]): Promise<any[]> {
    const response = await api.put(`/plans/${id}/pages`, { pageIds })
    return response.data
  },
}
