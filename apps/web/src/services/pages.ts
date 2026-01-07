import api from './api'

export interface Page {
  id: number
  name: string
  displayName: string
  path: string
  category?: string
  appId?: number
  app?: {
    id: number
    name: string
    displayName: string
  } | null
  icon?: string
  description?: string
  isActive: boolean
  order: number
  createdAt: string
  updatedAt: string
}

export interface PageWithDetails extends Page {
  roles: {
    id: number
    name: string
    displayName: string
    canAccess: boolean
    canEdit: boolean
    canDelete: boolean
  }[]
  plans: {
    id: number
    name: string
    displayName: string
  }[]
}

export interface CreatePageDto {
  name: string
  displayName: string
  path: string
  category?: string
  appId?: number
  icon?: string
  description?: string
  isActive?: boolean
  order?: number
}

export interface UpdatePageDto {
  name?: string
  displayName?: string
  path?: string
  category?: string
  appId?: number | null
  icon?: string
  description?: string
  isActive?: boolean
  order?: number
}

export const pagesService = {
  // Listar páginas
  async getPages(options: { appId?: number; includeInactive?: boolean } = {}): Promise<Page[]> {
    const params: any = {}
    if (options.appId) params.appId = options.appId
    if (options.includeInactive) params.includeInactive = 'true'

    const response = await api.get('/pages', { params })
    return response.data
  },

  // Buscar página por ID
  async getPage(id: number): Promise<PageWithDetails> {
    const response = await api.get(`/pages/${id}`)
    return response.data
  },

  // Criar página
  async createPage(data: CreatePageDto): Promise<PageWithDetails> {
    const response = await api.post('/pages', data)
    return response.data
  },

  // Atualizar página
  async updatePage(id: number, data: UpdatePageDto): Promise<PageWithDetails> {
    const response = await api.put(`/pages/${id}`, data)
    return response.data
  },

  // Deletar página
  async deletePage(id: number): Promise<{ message: string }> {
    const response = await api.delete(`/pages/${id}`)
    return response.data
  },

  // Toggle status
  async toggleStatus(id: number): Promise<{ id: number; isActive: boolean; message: string }> {
    const response = await api.patch(`/pages/${id}/toggle-status`)
    return response.data
  },

  // Reordenar páginas
  async reorder(pageIds: number[]): Promise<{ message: string }> {
    const response = await api.post('/pages/reorder', { pageIds })
    return response.data
  },
}
