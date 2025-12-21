export interface EndpointConfig {
  name: string
  path: string
  category: 'crm' | 'vendas' | 'estoque' | 'financeiro' | 'relatorios'
  description: string
  requiredParams?: string[]
  optionalParams?: string[]
  defaultLimits: {
    perHour: number
    perMinute: number
    maxRecords?: number
  }
  supportsPagination: boolean
  supportsFilters: boolean
  sensitiveData?: boolean
}

export const API_ENDPOINTS: Record<string, EndpointConfig> = {
  // CRM Endpoints
  'crm.clientes': {
    name: 'Clientes',
    path: '/api/crm/clientes',
    category: 'crm',
    description: 'Lista e gerencia clientes do sistema',
    optionalParams: ['search', 'cidade', 'uf', 'ativo', 'limit', 'offset'],
    defaultLimits: {
      perHour: 1000,
      perMinute: 60,
      maxRecords: 5000,
    },
    supportsPagination: true,
    supportsFilters: true,
    sensitiveData: true,
  },
  
  'crm.clientes.detalhes': {
    name: 'Cliente Detalhado',
    path: '/api/crm/clientes/:id',
    category: 'crm',
    description: 'Busca informações completas de um cliente específico',
    requiredParams: ['id'],
    defaultLimits: {
      perHour: 5000,
      perMinute: 100,
    },
    supportsPagination: false,
    supportsFilters: false,
    sensitiveData: true,
  },

  'crm.vendedores': {
    name: 'Vendedores',
    path: '/api/crm/vendedores',
    category: 'crm',
    description: 'Lista vendedores e suas informações',
    optionalParams: ['ativo', 'limit', 'offset'],
    defaultLimits: {
      perHour: 2000,
      perMinute: 50,
      maxRecords: 1000,
    },
    supportsPagination: true,
    supportsFilters: true,
  },

  // Vendas Endpoints
  'vendas.pedidos': {
    name: 'Pedidos de Venda',
    path: '/api/vendas/pedidos',
    category: 'vendas',
    description: 'Lista pedidos de venda com filtros de data',
    requiredParams: ['dataInicio', 'dataFim'],
    optionalParams: ['status', 'vendedorId', 'lojaId', 'limit', 'offset'],
    defaultLimits: {
      perHour: 2000,
      perMinute: 100,
      maxRecords: 10000,
    },
    supportsPagination: true,
    supportsFilters: true,
    sensitiveData: true,
  },

  'vendas.resumo': {
    name: 'Resumo de Vendas',
    path: '/api/vendas/resumo',
    category: 'vendas',
    description: 'Resumo consolidado de vendas por período',
    requiredParams: ['dataInicio', 'dataFim'],
    optionalParams: ['lojaId', 'vendedorId'],
    defaultLimits: {
      perHour: 1000,
      perMinute: 20,
    },
    supportsPagination: false,
    supportsFilters: true,
  },

  'vendas.itens': {
    name: 'Itens de Venda',
    path: '/api/vendas/itens',
    category: 'vendas',
    description: 'Lista detalhada de itens vendidos',
    requiredParams: ['dataInicio', 'dataFim'],
    optionalParams: ['produtoId', 'categoriaId', 'limit', 'offset'],
    defaultLimits: {
      perHour: 1000,
      perMinute: 50,
      maxRecords: 20000,
    },
    supportsPagination: true,
    supportsFilters: true,
  },

  // Estoque Endpoints
  'estoque.produtos': {
    name: 'Produtos',
    path: '/api/estoque/produtos',
    category: 'estoque',
    description: 'Catálogo completo de produtos',
    optionalParams: ['search', 'categoriaId', 'emEstoque', 'ativo', 'limit', 'offset'],
    defaultLimits: {
      perHour: 500,
      perMinute: 30,
      maxRecords: 10000,
    },
    supportsPagination: true,
    supportsFilters: true,
  },

  'estoque.movimento': {
    name: 'Movimento de Estoque',
    path: '/api/estoque/movimento',
    category: 'estoque',
    description: 'Movimentações de entrada e saída de estoque',
    requiredParams: ['dataInicio', 'dataFim'],
    optionalParams: ['tipo', 'produtoId', 'lojaId', 'limit', 'offset'],
    defaultLimits: {
      perHour: 1000,
      perMinute: 50,
      maxRecords: 15000,
    },
    supportsPagination: true,
    supportsFilters: true,
  },

  'estoque.posicao': {
    name: 'Posição de Estoque',
    path: '/api/estoque/posicao',
    category: 'estoque',
    description: 'Saldo atual de produtos em estoque',
    optionalParams: ['produtoId', 'lojaId', 'apenasPositivo'],
    defaultLimits: {
      perHour: 500,
      perMinute: 20,
      maxRecords: 5000,
    },
    supportsPagination: true,
    supportsFilters: true,
  },

  // Financeiro Endpoints
  'financeiro.contas.receber': {
    name: 'Contas a Receber',
    path: '/api/financeiro/contas-receber',
    category: 'financeiro',
    description: 'Títulos a receber de clientes',
    optionalParams: ['clienteId', 'vencimentoInicio', 'vencimentoFim', 'status', 'limit', 'offset'],
    defaultLimits: {
      perHour: 1000,
      perMinute: 50,
      maxRecords: 10000,
    },
    supportsPagination: true,
    supportsFilters: true,
    sensitiveData: true,
  },

  'financeiro.contas.pagar': {
    name: 'Contas a Pagar',
    path: '/api/financeiro/contas-pagar',
    category: 'financeiro',
    description: 'Títulos a pagar para fornecedores',
    optionalParams: ['fornecedorId', 'vencimentoInicio', 'vencimentoFim', 'status', 'limit', 'offset'],
    defaultLimits: {
      perHour: 1000,
      perMinute: 50,
      maxRecords: 10000,
    },
    supportsPagination: true,
    supportsFilters: true,
    sensitiveData: true,
  },

  // Relatórios Endpoints
  'relatorios.vendas.analitico': {
    name: 'Relatório Analítico de Vendas',
    path: '/api/relatorios/vendas/analitico',
    category: 'relatorios',
    description: 'Relatório detalhado de vendas por período',
    requiredParams: ['dataInicio', 'dataFim'],
    optionalParams: ['lojaId', 'vendedorId', 'produtoId', 'formato'],
    defaultLimits: {
      perHour: 100,
      perMinute: 5,
    },
    supportsPagination: false,
    supportsFilters: true,
  },

  'relatorios.clientes.ranking': {
    name: 'Ranking de Clientes',
    path: '/api/relatorios/clientes/ranking',
    category: 'relatorios',
    description: 'Ranking de clientes por faturamento',
    requiredParams: ['dataInicio', 'dataFim'],
    optionalParams: ['limite', 'lojaId'],
    defaultLimits: {
      perHour: 200,
      perMinute: 10,
    },
    supportsPagination: false,
    supportsFilters: true,
  },
}

// Helper para obter configuração de um endpoint
export function getEndpointConfig(path: string): EndpointConfig | undefined {
  return Object.values(API_ENDPOINTS).find(config => {
    // Remove parâmetros da URL para comparação
    const cleanPath = path.split('?')[0]
    const configPath = config.path.replace(/:[\w]+/g, '[^/]+')
    const regex = new RegExp(`^${configPath}$`)
    return regex.test(cleanPath)
  })
}

// Helper para obter limites padrão
export function getDefaultLimits(path: string) {
  const config = getEndpointConfig(path)
  return config?.defaultLimits || {
    perHour: 1000,
    perMinute: 60,
    maxRecords: 5000,
  }
}