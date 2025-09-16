import api from './api'

// Tipos simplificados
export interface User {
  id: number
  name: string
  email: string
  telefone?: string
  obs?: string
  role: 'admin' | 'user' | 'viewer'
  active: boolean
  baseId: number
  baseName?: string
  createdAt: string
  updatedAt: string
  lastLogin?: string
}

export interface CreateUserDto {
  name: string
  email: string
  password: string
  role: 'admin' | 'user' | 'viewer'
  baseId: number
  telefone?: string
  obs?: string
}

export interface UpdateUserDto {
  name?: string
  email?: string
  telefone?: string
  obs?: string
  role?: 'admin' | 'user' | 'viewer'
  active?: boolean
}

export interface ChangePasswordDto {
  currentPassword: string
  newPassword: string
}

export const usersService = {
  // Listar usuários
  async getUsers(params?: {
    page?: number
    limit?: number
    search?: string
    baseId?: number
    role?: string
    active?: boolean
  }) {
    const searchParams = new URLSearchParams()
    if (params?.page) searchParams.append('page', params.page.toString())
    if (params?.limit) searchParams.append('limit', params.limit.toString())
    if (params?.search) searchParams.append('search', params.search)
    if (params?.baseId) searchParams.append('baseId', params.baseId.toString())
    if (params?.role) searchParams.append('role', params.role)
    if (params?.active !== undefined) searchParams.append('active', params.active.toString())

    const response = await api.get(`/usuarios?${searchParams}`)
    return response.data
  },

  // Buscar usuário por ID
  async getUser(id: number) {
    const response = await api.get(`/usuarios/${id}`)
    return response.data
  },

  // Criar usuário
  async createUser(data: CreateUserDto) {
    const response = await api.post('/usuarios', data)
    return response.data
  },

  // Atualizar usuário
  async updateUser(id: number, data: UpdateUserDto) {
    const response = await api.put(`/usuarios/${id}`, data)
    return response.data
  },

  // Deletar usuário
  async deleteUser(id: number) {
    const response = await api.delete(`/usuarios/${id}`)
    return response.data
  },

  // Trocar senha
  async changePassword(id: number, data: ChangePasswordDto) {
    await api.put(`/usuarios/${id}/change-password`, data)
  },

  // Toggle ativo/inativo
  async toggleUserStatus(id: number, active: boolean) {
    const response = await api.put(`/usuarios/${id}`, { active })
    return response.data
  },

  // Listar bases disponíveis para o usuário
  async getUserBases() {
    const response = await api.get('/usuarios/bases')
    return response.data
  },

  // Verificar email disponível
  async checkEmailAvailable(email: string, excludeUserId?: number) {
    const params: any = { email }
    if (excludeUserId) params.excludeUserId = excludeUserId

    const response = await api.get('/usuarios/check-email', { params })
    return response.data.data.available
  },
}