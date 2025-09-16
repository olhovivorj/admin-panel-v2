import React, { useState, useEffect } from 'react'
import { 
  ShieldCheckIcon, 
  ClockIcon, 
  DocumentTextIcon,
  BuildingStorefrontIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline'
import { API_ENDPOINTS, EndpointConfig } from '@/config/api-endpoints.config'
import { Switch } from '@headlessui/react'
import { cn } from '@/utils/cn'

interface EndpointPermission {
  enabled: boolean
  rateLimit: {
    perHour: number
    perMinute: number
    maxRecords?: number
  }
  lojaRestrictions?: number[] // IDs das lojas permitidas
  firstLoadToken?: {
    enabled: boolean
    maxRecords: number
    expiresInHours: number
  }
}

interface Props {
  value: Record<string, EndpointPermission>
  onChange: (value: Record<string, EndpointPermission>) => void
  userId?: number
  userLojas?: number[] // Lojas que o usuário tem acesso
  className?: string
}

export function EndpointConfigurationPanel({ 
  value, 
  onChange, 
  userId,
  userLojas = [],
  className 
}: Props) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [showAdvanced, setShowAdvanced] = useState(false)

  // Agrupar endpoints por categoria
  const endpointsByCategory = Object.entries(API_ENDPOINTS).reduce((acc, [key, config]) => {
    if (!acc[config.category]) {
      acc[config.category] = []
    }
    acc[config.category].push({ key, ...config })
    return acc
  }, {} as Record<string, Array<EndpointConfig & { key: string }>>)

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories)
    if (newExpanded.has(category)) {
      newExpanded.delete(category)
    } else {
      newExpanded.add(category)
    }
    setExpandedCategories(newExpanded)
  }

  const updateEndpoint = (endpoint: string, updates: Partial<EndpointPermission>) => {
    onChange({
      ...value,
      [endpoint]: {
        ...value[endpoint],
        ...updates,
      },
    })
  }

  const toggleEndpoint = (endpoint: string) => {
    const current = value[endpoint]?.enabled ?? false
    updateEndpoint(endpoint, { enabled: !current })
  }

  const getCategoryStats = (category: string) => {
    const endpoints = endpointsByCategory[category] || []
    const enabled = endpoints.filter(e => value[e.key]?.enabled).length
    return { total: endpoints.length, enabled }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'crm': return '👥'
      case 'vendas': return '💰'
      case 'estoque': return '📦'
      case 'financeiro': return '💳'
      case 'relatorios': return '📊'
      default: return '📁'
    }
  }

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center gap-2">
          <ShieldCheckIcon className="h-5 w-5" />
          Configuração de Endpoints
        </h3>
        
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
        >
          {showAdvanced ? 'Ocultar' : 'Mostrar'} configurações avançadas
        </button>
      </div>

      {/* Estatísticas gerais */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
          <p className="text-sm text-blue-600 dark:text-blue-400">Endpoints Ativos</p>
          <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
            {Object.values(value).filter(v => v.enabled).length}
          </p>
        </div>
        
        <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
          <p className="text-sm text-green-600 dark:text-green-400">Rate Limit Total</p>
          <p className="text-2xl font-bold text-green-700 dark:text-green-300">
            {Object.values(value)
              .filter(v => v.enabled)
              .reduce((sum, v) => sum + (v.rateLimit?.perHour || 0), 0)}/h
          </p>
        </div>
        
        <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg">
          <p className="text-sm text-purple-600 dark:text-purple-400">Lojas Permitidas</p>
          <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">
            {userLojas.length || 'Todas'}
          </p>
        </div>
      </div>

      {/* Categorias de endpoints */}
      <div className="space-y-2">
        {Object.entries(endpointsByCategory).map(([category, endpoints]) => {
          const stats = getCategoryStats(category)
          const isExpanded = expandedCategories.has(category)
          
          return (
            <div key={category} className="border border-gray-200 dark:border-gray-700 rounded-lg">
              <button
                type="button"
                onClick={() => toggleCategory(category)}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{getCategoryIcon(category)}</span>
                  <div className="text-left">
                    <p className="font-medium text-gray-900 dark:text-white capitalize">
                      {category}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {stats.enabled} de {stats.total} endpoints ativos
                    </p>
                  </div>
                </div>
                
                <svg
                  className={cn(
                    'h-5 w-5 text-gray-400 transition-transform',
                    isExpanded && 'rotate-180'
                  )}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {isExpanded && (
                <div className="border-t border-gray-200 dark:border-gray-700 p-4 space-y-4">
                  {endpoints.map((endpoint) => {
                    const permission = value[endpoint.key] || {}
                    const isEnabled = permission.enabled ?? false
                    
                    return (
                      <div key={endpoint.key} className="space-y-3">
                        {/* Toggle principal */}
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={isEnabled}
                                onChange={() => toggleEndpoint(endpoint.key)}
                                className={cn(
                                  'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                                  isEnabled ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
                                )}
                              >
                                <span
                                  className={cn(
                                    'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                                    isEnabled ? 'translate-x-6' : 'translate-x-1'
                                  )}
                                />
                              </Switch>
                              <label className="font-medium text-gray-900 dark:text-white">
                                {endpoint.name}
                              </label>
                              {endpoint.sensitiveData && (
                                <ExclamationTriangleIcon className="h-4 w-4 text-yellow-500" title="Dados sensíveis" />
                              )}
                            </div>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                              {endpoint.description}
                            </p>
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                              {endpoint.path}
                            </p>
                          </div>
                        </div>
                        
                        {/* Configurações detalhadas */}
                        {isEnabled && showAdvanced && (
                          <div className="ml-11 space-y-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            {/* Rate Limits */}
                            <div className="grid grid-cols-3 gap-3">
                              <div>
                                <label className="text-xs text-gray-600 dark:text-gray-400">
                                  Por hora
                                </label>
                                <input
                                  type="number"
                                  value={permission.rateLimit?.perHour || endpoint.defaultLimits.perHour}
                                  onChange={(e) => updateEndpoint(endpoint.key, {
                                    rateLimit: {
                                      ...permission.rateLimit,
                                      perHour: parseInt(e.target.value) || 0,
                                    },
                                  })}
                                  className="mt-1 w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded"
                                />
                              </div>
                              
                              <div>
                                <label className="text-xs text-gray-600 dark:text-gray-400">
                                  Por minuto
                                </label>
                                <input
                                  type="number"
                                  value={permission.rateLimit?.perMinute || endpoint.defaultLimits.perMinute}
                                  onChange={(e) => updateEndpoint(endpoint.key, {
                                    rateLimit: {
                                      ...permission.rateLimit,
                                      perMinute: parseInt(e.target.value) || 0,
                                    },
                                  })}
                                  className="mt-1 w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded"
                                />
                              </div>
                              
                              <div>
                                <label className="text-xs text-gray-600 dark:text-gray-400">
                                  Máx. registros
                                </label>
                                <input
                                  type="number"
                                  value={permission.rateLimit?.maxRecords || endpoint.defaultLimits.maxRecords}
                                  onChange={(e) => updateEndpoint(endpoint.key, {
                                    rateLimit: {
                                      ...permission.rateLimit,
                                      maxRecords: parseInt(e.target.value) || 0,
                                    },
                                  })}
                                  className="mt-1 w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded"
                                />
                              </div>
                            </div>
                            
                            {/* Token de carga inicial */}
                            <div className="flex items-center justify-between p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
                              <div className="flex items-center gap-2">
                                <Switch
                                  checked={permission.firstLoadToken?.enabled ?? false}
                                  onChange={(enabled) => updateEndpoint(endpoint.key, {
                                    firstLoadToken: {
                                      ...permission.firstLoadToken,
                                      enabled,
                                      maxRecords: permission.firstLoadToken?.maxRecords || 50000,
                                      expiresInHours: permission.firstLoadToken?.expiresInHours || 48,
                                    },
                                  })}
                                  className={cn(
                                    'relative inline-flex h-5 w-9 items-center rounded-full transition-colors',
                                    permission.firstLoadToken?.enabled ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
                                  )}
                                >
                                  <span
                                    className={cn(
                                      'inline-block h-3 w-3 transform rounded-full bg-white transition-transform',
                                      permission.firstLoadToken?.enabled ? 'translate-x-5' : 'translate-x-1'
                                    )}
                                  />
                                </Switch>
                                <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                                  Token de carga inicial
                                </span>
                              </div>
                              
                              {permission.firstLoadToken?.enabled && (
                                <div className="flex items-center gap-2">
                                  <input
                                    type="number"
                                    value={permission.firstLoadToken.maxRecords}
                                    onChange={(e) => updateEndpoint(endpoint.key, {
                                      firstLoadToken: {
                                        ...permission.firstLoadToken!,
                                        maxRecords: parseInt(e.target.value) || 0,
                                      },
                                    })}
                                    className="w-20 px-2 py-1 text-xs border border-blue-300 dark:border-blue-600 rounded"
                                    placeholder="Máx"
                                  />
                                  <span className="text-xs text-blue-600 dark:text-blue-400">registros</span>
                                </div>
                              )}
                            </div>
                            
                            {/* Informações adicionais */}
                            <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                              {endpoint.supportsPagination && (
                                <p className="flex items-center gap-1">
                                  <CheckCircleIcon className="h-3 w-3 text-green-500" />
                                  Suporta paginação
                                </p>
                              )}
                              {endpoint.supportsFilters && (
                                <p className="flex items-center gap-1">
                                  <CheckCircleIcon className="h-3 w-3 text-green-500" />
                                  Suporta filtros
                                </p>
                              )}
                              {endpoint.requiredParams && (
                                <p className="flex items-center gap-1">
                                  <InformationCircleIcon className="h-3 w-3 text-blue-500" />
                                  Parâmetros: {endpoint.requiredParams.join(', ')}
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Aviso sobre lojas */}
      {userLojas.length > 0 && (
        <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
          <div className="flex items-start gap-2">
            <BuildingStorefrontIcon className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-yellow-800 dark:text-yellow-200">
                Restrição de lojas ativa
              </p>
              <p className="text-yellow-700 dark:text-yellow-300 mt-1">
                Este usuário só poderá acessar dados das {userLojas.length} loja(s) permitida(s).
                Os endpoints retornarão apenas dados dessas lojas.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}