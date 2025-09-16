/**
 * Tipos Prisma compartilhados para ari-admin-panel
 *
 * CONFORMIDADE CONTRATO V2.1:
 * ✅ Schema Prisma como fonte única de verdade
 * ✅ Tipos TypeScript compartilhados
 * ✅ Interface para Admin Panel
 */

// Tipos básicos das entidades (extraídos do Prisma)
export interface AriUser {
  id: number;
  baseId: number;
  email: string;
  name: string;
  password: string;
  role: string;
  active: boolean;
  permissions?: any;
  preferences?: any;
  theme?: string;
  language?: string;
  lastAccess?: Date;
  accessCount?: number;
  iduser?: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export interface SysUsers {
  id: number;
  baseId: number;
  nome?: string;
  login?: string;
  senha?: string;
  perfil?: string;
  ativo?: boolean;
  idPessoa?: number;
  dataCadastro?: Date;
  dataAlteracao?: Date;
}

export interface GeEmpresa {
  idEmpresa: number;
  baseId: number;
  bloqueada?: boolean;
  codigo?: string;
  nome?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  uf?: string;
  pais?: string;
  cep?: string;
  email?: string;
  telefone1?: string;
  telefone2?: string;
  telefone3?: string;
}

export interface AnalyticsRfm {
  id: number;
  idCliente: number;
  nome: string;
  tipoPessoa: string;
  cnpjCpf: string;
  email?: string;
  celular?: string;
  cidade?: string;
  bairro?: string;
  uf?: string;
  dtCadastro: Date;
  ultimaCompra?: Date;
  diasDesdeUltimaCompra: number;
  qtdCompras: number;
  valorTotalCompras: number;
  valorMedioCompras: number;
  primeiraCompra?: Date;
  rScore: number;
  fScore: number;
  mScore: number;
  rfmScore: string;
  segmento: string;
  statusAtividade: string;
  ltv: number;
  dataReferencia: Date;
  baseId: number;
  idEmpresa?: number;
  sincronizadoMcp: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export interface UsuarioConfiguracao {
  id: number;
  usuarioId: number;
  periodoDashboard: number;
  periodoRelatorios: number;
  periodoAnalitico: number;
  periodoMaximo: number;
  limitDashboard: number;
  limitProdutos: number;
  limitVendedores: number;
  limitClientes: number;
  limitMaximo: number;
  cacheDashboard: number;
  cacheVendas: number;
  cacheProdutos: number;
  cacheClientes: number;
  cacheRelatorios: number;
  timeoutQuery: number;
  cacheHabilitado: boolean;
  otimizacoesHabilitadas: boolean;
  preferencasEditor?: any;
  permissoes?: any;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

// Tipos específicos para Admin Panel

export interface UserWithRelations extends AriUser {
  configuracoes?: UsuarioConfiguracao[];
}

export interface UserCreateInput {
  baseId: number;
  email: string;
  name: string;
  password: string;
  role: string;
  active?: boolean;
  permissions?: any;
  preferences?: any;
  theme?: string;
  language?: string;
}

export interface UserUpdateInput {
  email?: string;
  name?: string;
  role?: string;
  active?: boolean;
  permissions?: any;
  preferences?: any;
  theme?: string;
  language?: string;
}

export interface BaseInfo {
  baseId: number;
  nome: string;
  totalUsuarios: number;
  usuariosAtivos: number;
  ultimaAtividade?: Date;
}

export interface DashboardStats {
  totalUsuarios: number;
  usuariosAtivos: number;
  totalBases: number;
  basesAtivas: number;
  ultimosLogins: UserLastLogin[];
  distribuicaoRoles: RoleDistribution[];
}

export interface UserLastLogin {
  id: number;
  name: string;
  email: string;
  lastAccess?: Date;
  baseId: number;
}

export interface RoleDistribution {
  role: string;
  count: number;
  percentage: number;
}

export interface AnalyticsSummary {
  totalClientes: number;
  clientesAtivos: number;
  valorTotalVendas: number;
  valorMedioTicket: number;
  segmentosRfm: SegmentRfmSummary[];
}

export interface SegmentRfmSummary {
  segmento: string;
  total: number;
  valorTotal: number;
  percentual: number;
}

// Filtros e paginação

export interface UserFilters {
  search?: string;
  role?: string;
  active?: boolean;
  baseId?: number;
  lastAccessFrom?: Date;
  lastAccessTo?: Date;
}

export interface PaginationParams {
  page: number;
  limit: number;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// API Response types

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
  metadata?: {
    pagination?: any;
    performance?: any;
  };
}

// Validadores de tipo

export const isValidUser = (user: any): user is AriUser => {
  return (
    user &&
    typeof user.id === 'number' &&
    typeof user.baseId === 'number' &&
    typeof user.email === 'string' &&
    typeof user.name === 'string' &&
    typeof user.role === 'string'
  )
}

export const isValidUserCreate = (input: any): input is UserCreateInput => {
  return (
    input &&
    typeof input.baseId === 'number' &&
    typeof input.email === 'string' &&
    typeof input.name === 'string' &&
    typeof input.password === 'string' &&
    typeof input.role === 'string'
  )
}

// Constantes relacionadas aos tipos

export const USER_ROLES = {
  ADMIN: 'admin',
  SUPERVISOR: 'supervisor',
  USER: 'user',
  READONLY: 'readonly',
} as const

export const USER_THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
  AUTO: 'auto',
} as const

export const USER_LANGUAGES = {
  PT_BR: 'pt-BR',
  EN_US: 'en-US',
} as const

export const RFM_SEGMENTS = {
  CAMPEOES: 'Campeões',
  CLIENTES_LEAIS: 'Clientes Leais',
  POTENCIAL_LEALDADE: 'Potencial Lealdade',
  NOVOS_CLIENTES: 'Novos Clientes',
  PROMISSORES: 'Promissores',
  NECESSITAM_ATENCAO: 'Necessitam Atenção',
  PRESTES_A_DORMIR: 'Prestes a Dormir',
  EM_RISCO: 'Em Risco',
  NAO_PODE_PERDELOS: 'Não Pode Perdê-los',
  HIBERNANDO: 'Hibernando',
  PERDIDOS: 'Perdidos',
} as const