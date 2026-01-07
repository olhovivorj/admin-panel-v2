import api from './api'

export interface App {
  id: number
  name: string
  displayName: string
  icon?: string
  description?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  pagesCount: number
  activePagesCount: number
}

export interface AppPage {
  id: number
  name: string
  displayName: string
  path: string
  category?: string
  icon?: string
  description?: string
  isActive: boolean
  order: number
  createdAt?: string
  updatedAt?: string
}

export interface AppWithPages extends App {
  pages: AppPage[]
}

export interface CreateAppDto {
  name: string
  displayName: string
  icon?: string
  description?: string
  isActive?: boolean
}

export interface UpdateAppDto {
  name?: string
  displayName?: string
  icon?: string
  description?: string
  isActive?: boolean
}

export const appsService = {
  // Listar apps
  async getApps(includeInactive = false): Promise<App[]> {
    const response = await api.get('/apps', {
      params: { includeInactive: includeInactive ? 'true' : undefined }
    })
    return response.data
  },

  // Buscar app por ID
  async getApp(id: number): Promise<AppWithPages> {
    const response = await api.get(`/apps/${id}`)
    return response.data
  },

  // Criar app
  async createApp(data: CreateAppDto): Promise<AppWithPages> {
    const response = await api.post('/apps', data)
    return response.data
  },

  // Atualizar app
  async updateApp(id: number, data: UpdateAppDto): Promise<AppWithPages> {
    const response = await api.put(`/apps/${id}`, data)
    return response.data
  },

  // Deletar app
  async deleteApp(id: number): Promise<{ message: string }> {
    const response = await api.delete(`/apps/${id}`)
    return response.data
  },

  // Toggle status
  async toggleStatus(id: number): Promise<{ id: number; isActive: boolean; message: string }> {
    const response = await api.patch(`/apps/${id}/toggle-status`)
    return response.data
  },

  // Listar páginas do app
  async getAppPages(id: number): Promise<AppPage[]> {
    const response = await api.get(`/apps/${id}/pages`)
    return response.data
  },
}
