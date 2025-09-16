// Auth Types
export interface User {
  id: number
  email: string
  name: string
  role: 'admin' | 'manager' | 'supervisor' | 'analyst' | 'operator'
  baseId: number
  basesPermitidas: number[]
  active: boolean
  createdAt: string
  updatedAt: string
  lastAccess?: string
  accessCount?: number
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface AuthResponse {
  access_token: string
  user: User
}

// User CRUD Types
export interface CreateUserRequest {
  email: string
  name: string
  password: string
  role: 'admin' | 'manager' | 'supervisor' | 'analyst' | 'operator'
  baseId: number
  basesPermitidas: number[]
}

export interface UpdateUserRequest {
  email?: string
  name?: string
  password?: string
  role?: 'admin' | 'manager' | 'supervisor' | 'analyst' | 'operator'
  baseId?: number
  basesPermitidas?: number[]
  active?: boolean
}

export interface UsersListResponse {
  data: User[]
  total: number
  page: number
  limit: number
}

export interface UserStatsResponse {
  total: number
  active: number
  byRole: Record<string, number>
  byBase: Record<string, number>
  lastWeekRegistrations: number
}

export interface UserFilters {
  search?: string
  role?: string
  active?: boolean
  dateFrom?: string
  dateTo?: string
  tipo_usuario?: 'NORMAL' | 'API' // Filtro por tipo de usuário unificado
  isActive?: boolean // Alias para active
  orderBy?: string // Campo de ordenação
  lastLoginPeriod?: string // Período do último login (7, 30, 90, 'never')
  hasApiLimit?: string // Filtro por limite de API
}

// User Configuration Types
export interface UserConfiguration {
  id: number
  userId: number
  configuracao: Record<string, any>
  presetId?: number
  createdAt: string
  updatedAt: string
}

export interface ConfigPreset {
  id: number
  nome: string
  descricao: string
  configuracao: Record<string, any>
  isDefault: boolean
}

// Base Types
export interface Base {
  baseId: number
  NOME: string
  BASE: string
  TOKEN?: string
}

// API Response Types
export interface ApiResponse<T = any> {
  data: T
  message?: string
  success: boolean
  total?: number
  page?: number
  limit?: number
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

// Service Status Types
export interface ServiceStatus {
  name: string
  status: 'online' | 'offline' | 'starting' | 'error'
  port: number
  url: string
  responseTime?: number
  version?: string
  lastCheck: string
  description?: string
}

// Config Types
export interface ConfigItem {
  key: string
  value: string
  description?: string
  type: 'string' | 'number' | 'boolean' | 'password' | 'json'
  category: string
  required: boolean
  readonly?: boolean
}

// Dashboard Stats
export interface DashboardStats {
  totalUsers: number
  activeClients: number
  totalBases: number
  servicesOnline: number
  systemHealth: 'healthy' | 'warning' | 'critical'
  uptime: string
}

// Endpoint Test Types
export interface EndpointTest {
  id: string
  name: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  path: string
  params?: Record<string, any>
  body?: any
  headers?: Record<string, string>
  description?: string
  category: string
  timeout?: number
}

export interface TestResult {
  success: boolean
  status: number
  responseTime: number
  data?: any
  error?: string
  headers?: Record<string, string>
}

// Environment Variable Types
export interface EnvVariable {
  key: string
  value: string
  description?: string
  type: 'string' | 'number' | 'boolean' | 'password'
  category: string
  required: boolean
  sensitive: boolean
}

// Form Types
export interface FormField {
  name: string
  label: string
  type: 'text' | 'email' | 'password' | 'number' | 'select' | 'textarea' | 'checkbox'
  placeholder?: string
  required?: boolean
  options?: { value: string; label: string }[]
  validation?: any
}

// Tipos legacy removidos - migrados para interface unificada

// Generic Types
export type Status = 'idle' | 'loading' | 'success' | 'error'

export interface SelectOption {
  value: string | number
  label: string
  disabled?: boolean
}