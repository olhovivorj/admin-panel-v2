// Configurações da aplicação
export interface AppConfig {
  // Base de dados padrão quando nenhuma foi selecionada anteriormente
  defaultBaseId: number

  // Tempo de cache para consultas (em minutos)
  cacheStaleTime: number

  // Intervalo de atualização do dashboard (em segundos)
  dashboardRefreshInterval: number

  // Configurações de paginação
  defaultPageSize: number
  pageSizeOptions: number[]

  // Configurações de autenticação
  tokenKey: string
  userKey: string
  selectedBaseKey: string
  selectedBaseIdKey: string
}

// Configurações padrão da aplicação
export const appConfig: AppConfig = {
  // Base QUALINA como padrão
  defaultBaseId: 49,

  // Cache de 5 minutos
  cacheStaleTime: 5,

  // Atualizar dashboard a cada 30 segundos
  dashboardRefreshInterval: 30,

  // Paginação
  defaultPageSize: 10,
  pageSizeOptions: [10, 25, 50, 100],

  // Chaves do localStorage
  tokenKey: '@ari:token',
  userKey: '@ari:user',
  selectedBaseKey: '@ari:selectedBase',
  selectedBaseIdKey: '@ari:selectedBaseId',
}

// Função para obter configuração do backend (futura implementação)
export async function loadRemoteConfig(): Promise<Partial<AppConfig>> {
  try {
    const response = await fetch('/api/config/app')
    if (response.ok) {
      return await response.json()
    }
  } catch (error) {
    console.warn('Não foi possível carregar configuração remota, usando padrões locais')
  }
  return {}
}

// Função para mesclar configurações
export async function getAppConfig(): Promise<AppConfig> {
  const remoteConfig = await loadRemoteConfig()
  return {
    ...appConfig,
    ...remoteConfig,
  }
}