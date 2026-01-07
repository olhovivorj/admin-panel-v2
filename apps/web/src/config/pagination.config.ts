/**
 * Configuração de Paginação Universal
 * Permite customizar comportamento mantendo compatibilidade com PontoMarket
 */

export interface PaginationConfig {
  defaultPageSize: number
  minPageSize: number
  maxPageSize: number
  streamingThreshold: number
  maxTotalRecords: number
  defaultStrategy: 'auto' | 'single' | 'streaming'
}

// Configuração padrão (pode ser sobrescrita por localStorage ou env vars)
export const DEFAULT_PAGINATION_CONFIG: PaginationConfig = {
  defaultPageSize: 1000,        // Tamanho padrão da página
  minPageSize: 100,            // Mínimo permitido
  maxPageSize: 20000,          // Máximo por request (20k para admin)
  streamingThreshold: 5000,    // Acima disso, forçar streaming
  maxTotalRecords: 2000000,    // Limite de 2 milhões conforme solicitado
  defaultStrategy: 'auto',      // auto, single ou streaming
}

// Configurações específicas por endpoint (opcional)
export const ENDPOINT_CONFIGS: Record<string, Partial<PaginationConfig>> = {
  '/clientes': {
    defaultPageSize: 1000,
    streamingThreshold: 3000,
  },
  '/vendas': {
    defaultPageSize: 500,     // Vendas são mais pesadas
    streamingThreshold: 2000,
  },
  '/produtos': {
    defaultPageSize: 2000,    // Produtos são mais leves
    streamingThreshold: 10000,
  },
  '/lojas': {
    defaultPageSize: 500,
    defaultStrategy: 'single', // Sempre carregar tudo
  },
  '/vendedores': {
    defaultPageSize: 1000,
    defaultStrategy: 'single', // Sempre carregar tudo
  },
  '/itens-vendas': {
    defaultPageSize: 1000,    // Itens de vendas podem ser volumosos
    streamingThreshold: 5000,
    // Sem maxPageSize - igual aos clientes
  },
}

// Classe para gerenciar configurações
export class PaginationManager {
  private _config: PaginationConfig

  constructor() {
    this._config = this.loadConfig()
  }

  // Getter público para config
  get config(): PaginationConfig {
    return this._config
  }

  // Carregar configuração (localStorage > env > default)
  private loadConfig(): PaginationConfig {
    // Tentar carregar do localStorage
    const stored = localStorage.getItem('@ari:paginationConfig')
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        return { ...DEFAULT_PAGINATION_CONFIG, ...parsed }
      } catch (e) {
        console.warn('Config de paginação inválida no localStorage')
      }
    }

    // Tentar carregar de env vars
    const envConfig: Partial<PaginationConfig> = {}
    if (import.meta.env.VITE_DEFAULT_PAGE_SIZE) {
      envConfig.defaultPageSize = parseInt(import.meta.env.VITE_DEFAULT_PAGE_SIZE)
    }
    if (import.meta.env.VITE_MAX_PAGE_SIZE) {
      envConfig.maxPageSize = parseInt(import.meta.env.VITE_MAX_PAGE_SIZE)
    }

    return { ...DEFAULT_PAGINATION_CONFIG, ...envConfig }
  }

  // Salvar configuração
  saveConfig(updates: Partial<PaginationConfig>) {
    this._config = { ...this._config, ...updates }
    localStorage.setItem('@ari:paginationConfig', JSON.stringify(this._config))
  }

  // Obter configuração para endpoint específico
  getEndpointConfig(endpoint: string): PaginationConfig {
    const endpointOverrides = ENDPOINT_CONFIGS[endpoint] || {}
    return { ...this._config, ...endpointOverrides }
  }

  // Calcular parâmetros de paginação
  calculatePagination(endpoint: string, userParams?: any) {
    const config = this.getEndpointConfig(endpoint)

    // Respeitar parâmetros do usuário se fornecidos
    const pageSize = userParams?.limit
      ? Math.min(Math.max(userParams.limit, config.minPageSize), config.maxPageSize)
      : config.defaultPageSize

    const offset = userParams?.offset || 0

    // Detectar se deve usar streaming
    const shouldStream =
      config.defaultStrategy === 'streaming' ||
      (config.defaultStrategy === 'auto' && !userParams?.limit)

    return {
      limit: pageSize,
      offset,
      shouldStream,
      config,
    }
  }

  // Helpers para UI
  getPageSizeOptions(): number[] {
    // Verificar se é admin para mostrar opções maiores
    // ✅ SEGURANÇA: User em sessionStorage (expira ao fechar navegador)
    const userString = sessionStorage.getItem('@ari:user')
    let isAdmin = false

    if (userString) {
      try {
        const user = JSON.parse(userString)
        // Novo sistema: verificar rolePriority >= 80
        isAdmin = user?.rolePriority ? user.rolePriority >= 80 : user?.isMaster === true
      } catch (e) {
        // Ignorar erro de parse
      }
    }

    const standardOptions = [100, 500, 1000, 2000, 5000]
    const adminOptions = [100, 500, 1000, 2000, 5000, 10000, 20000]

    const options = isAdmin ? adminOptions : standardOptions

    return options.filter(
      size => size >= this._config.minPageSize && size <= this._config.maxPageSize,
    )
  }

  // Validar se precisa streaming baseado no total
  needsStreaming(total: number): boolean {
    return total > this._config.streamingThreshold
  }
}

// Singleton
export const paginationManager = new PaginationManager()

// Hook React para usar em componentes
export function usePaginationConfig() {
  return {
    config: paginationManager.config,
    updateConfig: (updates: Partial<PaginationConfig>) => paginationManager.saveConfig(updates),
    getEndpointConfig: (endpoint: string) => paginationManager.getEndpointConfig(endpoint),
    calculatePagination: (endpoint: string, params?: any) => paginationManager.calculatePagination(endpoint, params),
    pageSizeOptions: paginationManager.getPageSizeOptions(),
  }
}