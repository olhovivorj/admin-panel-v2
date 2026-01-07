import api from './api'

export interface Role {
  id: number
  name: string
  displayName: string
  description?: string
  priority: number
  createdAt?: string
  updatedAt?: string
  usersCount?: number
  permissionsCount?: number
}

export interface RoleWithDetails extends Role {
  permissions: {
    pageId: number
    pageName: string
    pagePath: string
    category?: string
    canAccess: boolean
    canEdit: boolean
    canDelete: boolean
  }[]
  users: {
    id: number
    nome: string
    email: string
  }[]
}

export interface CreateRoleDto {
  name: string
  displayName: string
  description?: string
  priority?: number
}

export interface UpdateRoleDto {
  name?: string
  displayName?: string
  description?: string
  priority?: number
}

export interface Permission {
  pageId: number
  canAccess?: boolean
  canEdit?: boolean
  canDelete?: boolean
}

export const rolesService = {
  // Listar roles
  async getRoles(): Promise<Role[]> {
    const response = await api.get('/roles')
    return response.data
  },

  // Buscar role por ID
  async getRole(id: number): Promise<RoleWithDetails> {
    const response = await api.get(`/roles/${id}`)
    return response.data
  },

  // Criar role
  async createRole(data: CreateRoleDto): Promise<RoleWithDetails> {
    const response = await api.post('/roles', data)
    return response.data
  },

  // Atualizar role
  async updateRole(id: number, data: UpdateRoleDto): Promise<RoleWithDetails> {
    const response = await api.put(`/roles/${id}`, data)
    return response.data
  },

  // Deletar role
  async deleteRole(id: number): Promise<{ message: string }> {
    const response = await api.delete(`/roles/${id}`)
    return response.data
  },

  // Listar permissões da role
  async getPermissions(id: number): Promise<Permission[]> {
    const response = await api.get(`/roles/${id}/permissions`)
    return response.data
  },

  // Atribuir permissões à role
  async setPermissions(id: number, permissions: Permission[]): Promise<Permission[]> {
    const response = await api.put(`/roles/${id}/permissions`, { permissions })
    return response.data
  },
}
