import api from './api'

// Tipo completo para compatibilidade com o backend
export interface UsuarioResponseDto {
  id: number
  name: string
  email: string
  telefone?: string
  obs?: string
  notes?: string
  // Backend retorna role como objeto (via JOIN com ari_roles)
  role: {
    id: number
    name: string
    displayName: string
  } | null
  funcao?: string  // Campo funcao da tabela ariusers
  status: 'active' | 'inactive'
  active?: boolean
  ativo?: boolean  // Campo do backend (boolean no MySQL tinyint)
  baseId: number
  baseName?: string
  createdAt: string
  updatedAt: string
  lastLogin?: string
  tipo_usuario?: 'NORMAL' | 'API'
  iduser?: number
  id_pessoa?: number  // FK para ge_pessoa (ERP)
  pessoaNome?: string  // Nome da pessoa vinculada
  pessoaCpf?: string   // CPF da pessoa vinculada
  sysUserData?: any
  permissions?: string[]
  ip_whitelist?: string[]
  rate_limit_per_hour?: number
  permissoes_endpoints?: any
  api_key?: string
  api_secret?: string
}

// Alias para compatibilidade
export type User = UsuarioResponseDto

export interface CreateUsuarioDto {
  name: string
  email: string
  password?: string
  role: 'admin' | 'user' | 'operator' | 'viewer'
  baseId: number
  telefone?: string
  obs?: string
  ativo?: boolean
  tipo_usuario?: 'NORMAL' | 'API'
  iduser?: number
  id_pessoa?: number   // Vincular com pessoa do ERP
  plano_id?: number    // Plano de acesso (basic, standard, premium, admin)
  permissions?: string[]
  ip_whitelist?: string[]
  rate_limit_per_hour?: number
  permissoes_endpoints?: any
}

// Alias para compatibilidade
export type CreateUserDto = CreateUsuarioDto

export interface UpdateUsuarioDto {
  // Campos que o backend espera (após conversões no frontend)
  nome?: string         // Backend espera 'nome' (não 'name')
  email?: string
  telefone?: string
  obs?: string
  funcao?: string       // Backend espera 'funcao' (não 'role')
  roleId?: number       // ID da role (ari_roles)
  planId?: number       // ID do plano (ari_plans)
  ativo?: boolean
  baseId?: number
  tipo_usuario?: 'NORMAL' | 'API'
  iduser?: number
  theme?: string
  language?: string
  // Campos API
  permissions?: string[]
  ip_whitelist?: string[]
  rate_limit_per_hour?: number
  permissoes_endpoints?: Record<string, any>
}

// Alias para compatibilidade
export type UpdateUserDto = UpdateUsuarioDto

export interface ChangePasswordDto {
  currentPassword: string
  newPassword: string
}

export interface LojaDisponivel {
  id: number
  nome: string
  cidade?: string
  uf?: string
}

export interface UsuarioLojaDto {
  lojaId: number
  lojaNome: string
  acessoTotal?: boolean
}

export interface UserStatsResponse {
  total: number
  active: number
  inactive: number
  byRole: Record<string, number>
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
    return response.data.data || response.data // Backend retorna direto, sem wrapper
  },

  // Criar usuário
  async createUser(data: CreateUsuarioDto) {
    const response = await api.post('/usuarios', data)
    return response.data.data || response.data // Retornar data se existir, senão response.data
  },

  // Atualizar usuário
  async updateUser(id: number, data: UpdateUsuarioDto) {
    const response = await api.put(`/usuarios/${id}`, data)
    return response.data.data || response.data // Retornar data se existir, senão response.data
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
  async checkEmailAvailability(email: string, excludeUserId?: number) {
    const params: any = { email }
    if (excludeUserId) params.excludeUserId = excludeUserId

    const response = await api.get('/usuarios/check-email', { params })
    return response.data.data.available
  },

  // Resetar senha
  async resetPassword(userId: number) {
    const response = await api.post(`/usuarios/${userId}/reset-password`)
    return response.data
  },

  // Buscar lojas de um sys-user
  async getLojasBySysUser(baseId: number, sysUserId: number) {
    const response = await api.get(`/usuarios/sys-users/${baseId}/user/${sysUserId}/lojas`)
    return response.data
  },

  // Buscar dados de uma pessoa do ERP para auto-preencher formulário
  async getPessoaData(idPessoa: number, baseId: number) {
    const response = await api.get(`/erp/pessoas/${idPessoa}`, {
      params: { baseId }
    })
    return response.data.data || response.data
  },

  // Buscar pessoas por nome/CPF para autocomplete
  async searchPessoas(term: string, baseId: number) {
    const response = await api.get('/erp/pessoas', {
      params: {
        baseId,
        search: term,
        limit: 10
      }
    })
    return response.data.data || response.data
  },

  // Listar roles (cargos) disponíveis
  async getRoles() {
    const response = await api.get('/roles')
    return response.data
  },

  // Buscar pessoas no ERP para vincular a novos usuários
  async searchPessoaErp(search?: string) {
    const response = await api.get('/erp/pessoas/disponiveis-vinculacao', {
      params: { search }
    })
    return response.data
  },

  // Regenerar API Key de um usuário API
  async regenerateApiKey(userId: number) {
    const response = await api.post(`/usuarios/${userId}/regenerate-api-key`)
    return response.data
  },

  // Listar tokens API de um usuário
  async listApiTokens(userId: number) {
    const response = await api.get(`/usuarios/${userId}/api-tokens`)
    return response.data
  },

  // Gerar token de carga inicial
  async generateInitialLoadToken(userId: number, data: { endpoint: string; description?: string }) {
    const response = await api.post(`/usuarios/${userId}/initial-load-token`, data)
    return response.data
  },

  // Revogar token API
  async revokeApiToken(tokenId: number) {
    const response = await api.delete(`/usuarios/api-tokens/${tokenId}`)
    return response.data
  },

  // Buscar lojas do usuário
  async getUserLojas(userId: number) {
    const response = await api.get(`/usuarios/${userId}/lojas`)
    return response.data
  },

  // Buscar lojas disponíveis
  async getAvailableLojas(baseId: number) {
    const response = await api.get(`/usuarios/lojas/available`, { params: { baseId } })
    return response.data
  },

  // Atualizar lojas do usuário
  async updateUserLojas(userId: number, lojas: number[]) {
    const response = await api.put(`/usuarios/${userId}/lojas`, { lojas })
    return response.data
  },

  // Buscar estatísticas de usuários
  async getUserStats(baseId?: number) {
    const response = await api.get(`/usuarios/stats`, { params: { baseId } })
    return response.data
  },
}