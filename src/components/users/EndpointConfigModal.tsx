import { useState, useEffect } from 'react'
import { Dialog } from '@headlessui/react'
import { 
  XMarkIcon, 
  CogIcon, 
  ShieldCheckIcon,
  ChartBarIcon,
  ServerIcon,
  PlusIcon,
  TrashIcon 
} from '@heroicons/react/24/outline'
import { useQueryClient, useMutation } from '@tanstack/react-query'
import { Button } from '@/components/common/Button'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { UsuarioResponseDto, usersService } from '@/services/users'
import toast from 'react-hot-toast'
import { logger } from '@/utils/logger'

interface EndpointConfig {
  endpoint: string
  enabled: boolean
  rateLimit: {
    perHour: number
    perMinute: number
    maxRecords?: number
  }
  firstLoadToken?: {
    enabled: boolean
    maxRecords: number
    expiresInHours: number
  }
}

interface EndpointConfigModalProps {
  user: UsuarioResponseDto | null
  isOpen: boolean
  onClose: () => void
}

const AVAILABLE_ENDPOINTS = [
  { 
    endpoint: 'clientes', 
    name: 'Clientes', 
    category: 'CRM',
    defaultRateLimit: { perHour: 1000, perMinute: 50 }
  },
  { 
    endpoint: 'produtos', 
    name: 'Produtos', 
    category: 'CRM',
    defaultRateLimit: { perHour: 2000, perMinute: 100 }
  },
  { 
    endpoint: 'vendas', 
    name: 'Vendas', 
    category: 'CRM',
    defaultRateLimit: { perHour: 500, perMinute: 25 }
  },
  { 
    endpoint: 'vendas-itens', 
    name: 'Itens de Vendas', 
    category: 'CRM',
    defaultRateLimit: { perHour: 1000, perMinute: 50 }
  },
  { 
    endpoint: 'vendedores', 
    name: 'Vendedores', 
    category: 'CRM',
    defaultRateLimit: { perHour: 500, perMinute: 25 }
  },
  { 
    endpoint: 'lojas', 
    name: 'Lojas/Empresas', 
    category: 'CRM',
    defaultRateLimit: { perHour: 200, perMinute: 10 }
  },
]

export function EndpointConfigModal({ user, isOpen, onClose }: EndpointConfigModalProps) {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<'endpoints' | 'security'>('endpoints')
  const [endpointConfigs, setEndpointConfigs] = useState<Record<string, EndpointConfig>>({})
  const [ipWhitelist, setIpWhitelist] = useState<string[]>([])
  const [newIp, setNewIp] = useState('')
  const [isLoadingData, setIsLoadingData] = useState(false)

  useEffect(() => {
    if (user && isOpen) {
      // Buscar dados atualizados do usuário quando o modal abrir
      const loadUserData = async () => {
        setIsLoadingData(true)
        try {
          // Buscar dados atualizados via API
          const updatedUser = await usersService.getUser(user.id)
          
          // Carregar configurações existentes
          const configs: Record<string, EndpointConfig> = {}
          
          // Primeiro, inicializar todos os endpoints disponíveis como desabilitados
          AVAILABLE_ENDPOINTS.forEach(ep => {
            configs[ep.endpoint] = {
              endpoint: ep.endpoint,
              enabled: false,
              rateLimit: ep.defaultRateLimit
            }
          })
          
          // Depois, sobrescrever com as permissões existentes do usuário atualizado
          if (updatedUser.permissoes_endpoints && typeof updatedUser.permissoes_endpoints === 'object') {
            Object.entries(updatedUser.permissoes_endpoints).forEach(([endpoint, enabled]) => {
              if (configs[endpoint]) {
                configs[endpoint].enabled = enabled as boolean
              }
            })
          }
          
          logger.info('📋 Carregando configurações de endpoints:', {
            userId: updatedUser.id,
            userEmail: updatedUser.email,
            permissoes_raw: updatedUser.permissoes_endpoints,
            tipo_permissoes: typeof updatedUser.permissoes_endpoints,
            configsCarregadas: configs,
            endpoints_habilitados: Object.entries(configs).filter(([_, c]) => c.enabled).map(([k]) => k)
          })
          
          setEndpointConfigs(configs)
          
          // Carregar IP whitelist
          if (updatedUser.ip_whitelist && Array.isArray(updatedUser.ip_whitelist)) {
            setIpWhitelist(updatedUser.ip_whitelist)
          } else {
            setIpWhitelist([])
          }
        } catch (error) {
          logger.error('Erro ao carregar dados do usuário:', error)
          // Em caso de erro, usar dados do prop
          const configs: Record<string, EndpointConfig> = {}
          
          AVAILABLE_ENDPOINTS.forEach(ep => {
            configs[ep.endpoint] = {
              endpoint: ep.endpoint,
              enabled: false,
              rateLimit: ep.defaultRateLimit
            }
          })
          
          if (user.permissoes_endpoints && typeof user.permissoes_endpoints === 'object') {
            Object.entries(user.permissoes_endpoints).forEach(([endpoint, enabled]) => {
              if (configs[endpoint]) {
                configs[endpoint].enabled = enabled as boolean
              }
            })
          }
          
          setEndpointConfigs(configs)
          
          if (user.ip_whitelist && Array.isArray(user.ip_whitelist)) {
            setIpWhitelist(user.ip_whitelist)
          } else {
            setIpWhitelist([])
          }
        } finally {
          setIsLoadingData(false)
        }
      }
      
      loadUserData()
    }
  }, [user, isOpen])

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      if (!user) return
      return await usersService.updateUser(user.id, data)
    },
    onSuccess: (response) => {
      logger.info('✅ Configurações salvas com sucesso:', response)
      toast.success('Configurações atualizadas com sucesso!')
      queryClient.invalidateQueries({ queryKey: ['users'] })
      queryClient.invalidateQueries({ queryKey: ['user', user?.id] })
      onClose()
    },
    onError: (error: any) => {
      logger.error('Erro ao atualizar configurações:', error)
      toast.error('Erro ao atualizar configurações')
    },
  })

  const handleSave = () => {
    if (!user) return

    // Preparar dados para salvar - formato simplificado como boolean
    const permissoes_endpoints: any = {}
    Object.values(endpointConfigs).forEach(config => {
      if (config.enabled) {
        // Backend espera apenas true/false por enquanto
        permissoes_endpoints[config.endpoint] = true
      }
    })

    const data = {
      permissoes_endpoints: permissoes_endpoints,
      ip_whitelist: ipWhitelist.length > 0 ? ipWhitelist : null
    }

    logger.info('🔧 Salvando configurações de endpoints:', { 
      userId: user.id,
      userEmail: user.email,
      permissoes_enviadas: permissoes_endpoints,
      quantidade_habilitados: Object.keys(permissoes_endpoints).length,
      endpoints_habilitados: Object.keys(permissoes_endpoints),
      ipWhitelist: ipWhitelist,
      payload_completo: data
    })

    updateMutation.mutate(data)
  }

  const toggleEndpoint = (endpoint: string) => {
    setEndpointConfigs(prev => ({
      ...prev,
      [endpoint]: {
        ...prev[endpoint],
        enabled: !prev[endpoint]?.enabled
      }
    }))
  }

  const updateRateLimit = (endpoint: string, field: 'perHour' | 'perMinute', value: number) => {
    setEndpointConfigs(prev => ({
      ...prev,
      [endpoint]: {
        ...prev[endpoint],
        rateLimit: {
          ...prev[endpoint]?.rateLimit,
          [field]: value
        }
      }
    }))
  }

  const validateIp = (ip: string): boolean => {
    // Validação de IP v4
    const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/
    if (ipv4Regex.test(ip)) {
      const parts = ip.split('.')
      return parts.every(part => {
        const num = parseInt(part)
        return num >= 0 && num <= 255
      })
    }
    
    // Validação de CIDR (ex: 192.168.1.0/24)
    const cidrRegex = /^(\d{1,3}\.){3}\d{1,3}\/\d{1,2}$/
    if (cidrRegex.test(ip)) {
      const [ipPart, mask] = ip.split('/')
      const maskNum = parseInt(mask)
      if (maskNum < 0 || maskNum > 32) return false
      
      const parts = ipPart.split('.')
      return parts.every(part => {
        const num = parseInt(part)
        return num >= 0 && num <= 255
      })
    }
    
    return false
  }

  const addIp = () => {
    if (!newIp) return
    
    const trimmedIp = newIp.trim()
    
    if (!validateIp(trimmedIp)) {
      toast.error('IP inválido. Use formato: 192.168.1.100 ou 192.168.1.0/24')
      return
    }

    if (ipWhitelist.includes(trimmedIp)) {
      toast.error('Este IP já está na lista')
      return
    }

    setIpWhitelist([...ipWhitelist, trimmedIp])
    setNewIp('')
    toast.success('IP adicionado à whitelist')
  }

  const removeIp = (ip: string) => {
    setIpWhitelist(ipWhitelist.filter(i => i !== ip))
  }

  if (!user || user.tipo_usuario !== 'API') return null

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-4xl w-full max-h-[90vh] bg-white dark:bg-gray-800 rounded-xl shadow-xl flex flex-col">
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div>
              <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-white">
                Configurações Avançadas de API
              </Dialog.Title>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {user.name} - {user.email}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-200 dark:border-gray-700 px-6">
            <button
              onClick={() => setActiveTab('endpoints')}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'endpoints'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
              }`}
            >
              <ServerIcon className="h-4 w-4 inline mr-2" />
              Endpoints e Limites
            </button>
            <button
              onClick={() => setActiveTab('security')}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'security'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
              }`}
            >
              <ShieldCheckIcon className="h-4 w-4 inline mr-2" />
              Segurança
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {/* Tab: Endpoints */}
            {activeTab === 'endpoints' && (
              <div className="space-y-4">
                {isLoadingData && (
                  <div className="flex items-center justify-center py-8">
                    <LoadingSpinner />
                    <span className="ml-3 text-gray-600 dark:text-gray-400">Carregando configurações...</span>
                  </div>
                )}
                {!isLoadingData && (
                  <>
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                        Configuração de Endpoints
                      </h3>
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        Configure quais endpoints este usuário pode acessar e seus limites de requisições.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const allEnabled = AVAILABLE_ENDPOINTS.every(ep => endpointConfigs[ep.endpoint]?.enabled)
                        const newConfigs = { ...endpointConfigs }
                        AVAILABLE_ENDPOINTS.forEach(ep => {
                          newConfigs[ep.endpoint] = {
                            endpoint: ep.endpoint,
                            enabled: !allEnabled,
                            rateLimit: endpointConfigs[ep.endpoint]?.rateLimit || ep.defaultRateLimit
                          }
                        })
                        setEndpointConfigs(newConfigs)
                      }}
                      className="px-3 py-1 text-sm font-medium text-blue-700 dark:text-blue-300 hover:text-blue-900 dark:hover:text-blue-100 hover:bg-blue-100 dark:hover:bg-blue-800 rounded-md transition-colors"
                    >
                      {AVAILABLE_ENDPOINTS.every(ep => endpointConfigs[ep.endpoint]?.enabled) ? 'Desmarcar todos' : 'Marcar todos'}
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  {AVAILABLE_ENDPOINTS.map(ep => {
                    const config = endpointConfigs[ep.endpoint] || {
                      endpoint: ep.endpoint,
                      enabled: false,
                      rateLimit: ep.defaultRateLimit
                    }

                    return (
                      <div
                        key={ep.endpoint}
                        className={`border rounded-lg p-4 transition-colors ${
                          config.enabled
                            ? 'border-blue-300 dark:border-blue-600 bg-blue-50 dark:bg-blue-900/10'
                            : 'border-gray-200 dark:border-gray-600'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <input
                              type="checkbox"
                              checked={config.enabled}
                              onChange={() => toggleEndpoint(ep.endpoint)}
                              className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <div>
                              <div className="font-medium text-gray-900 dark:text-white">
                                {ep.name}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                /api/{ep.endpoint}
                              </div>
                            </div>
                          </div>

                          {config.enabled && (
                            <div className="flex gap-4 text-sm">
                              <div>
                                <label className="text-gray-600 dark:text-gray-400">Por hora</label>
                                <input
                                  type="number"
                                  value={config.rateLimit.perHour}
                                  onChange={(e) => updateRateLimit(ep.endpoint, 'perHour', parseInt(e.target.value))}
                                  className="w-20 px-2 py-1 border rounded dark:bg-gray-700 dark:border-gray-600"
                                  min="1"
                                  max="10000"
                                />
                              </div>
                              <div>
                                <label className="text-gray-600 dark:text-gray-400">Por minuto</label>
                                <input
                                  type="number"
                                  value={config.rateLimit.perMinute}
                                  onChange={(e) => updateRateLimit(ep.endpoint, 'perMinute', parseInt(e.target.value))}
                                  className="w-20 px-2 py-1 border rounded dark:bg-gray-700 dark:border-gray-600"
                                  min="1"
                                  max="1000"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
                  </>
                )}
              </div>
            )}

            {/* Tab: Segurança */}
            {activeTab === 'security' && (
              <div className="space-y-6">
                {/* IP Whitelist */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <ShieldCheckIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      IP Whitelist
                    </h3>
                  </div>
                  
                  <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg mb-4">
                    <p className="text-sm text-amber-800 dark:text-amber-200">
                      <strong>⚠️ Importante:</strong> Quando configurado, APENAS os IPs listados poderão acessar esta API.
                      Certifique-se de incluir todos os IPs necessários antes de ativar.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Adicionar IP ou Range
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newIp}
                          onChange={(e) => setNewIp(e.target.value)}
                          placeholder="Ex: 192.168.1.100 ou 192.168.1.0/24"
                          className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          onKeyPress={(e) => e.key === 'Enter' && addIp()}
                        />
                        <Button
                          variant="secondary"
                          onClick={addIp}
                          disabled={!newIp}
                        >
                          <PlusIcon className="h-4 w-4 mr-1" />
                          Adicionar
                        </Button>
                      </div>
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        Formatos aceitos: IP único (192.168.1.100) ou CIDR (192.168.1.0/24)
                      </p>
                    </div>

                    {ipWhitelist.length > 0 ? (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          IPs Autorizados ({ipWhitelist.length})
                        </h4>
                        <div className="space-y-2">
                          {ipWhitelist.map(ip => (
                            <div
                              key={ip}
                              className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                <span className="font-mono text-sm text-gray-900 dark:text-white">{ip}</span>
                                {ip.includes('/') && (
                                  <span className="text-xs text-gray-500 dark:text-gray-400">
                                    (Range)
                                  </span>
                                )}
                              </div>
                              <button
                                onClick={() => {
                                  removeIp(ip)
                                  toast.success('IP removido da whitelist')
                                }}
                                className="text-red-600 hover:text-red-700 dark:text-red-400 p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                                title="Remover IP"
                              >
                                <TrashIcon className="h-4 w-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8 bg-gray-50 dark:bg-gray-700/50 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
                        <ShieldCheckIcon className="h-12 w-12 mx-auto mb-3 text-gray-400 dark:text-gray-500" />
                        <p className="text-gray-600 dark:text-gray-300 font-medium">
                          Nenhuma restrição de IP configurada
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          Qualquer IP poderá acessar esta API
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Outras configurações de segurança */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                    Configurações Adicionais
                  </h3>
                  
                  <div className="space-y-4">
                    <label className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600">
                      <input
                        type="checkbox"
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        disabled
                      />
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 dark:text-white">
                          Autenticação em Dois Fatores
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Exigir código adicional para requisições críticas (em breve)
                        </p>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600">
                      <input
                        type="checkbox"
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        disabled
                      />
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 dark:text-white">
                          Notificar Acessos Suspeitos
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Alertar por email sobre tentativas de acesso não autorizadas (em breve)
                        </p>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* Footer */}
          <div className="flex justify-between items-center p-6 border-t border-gray-200 dark:border-gray-700">
            <div>
              <Button
                variant="outline"
                onClick={() => window.location.href = `/analytics?userId=${user.id}`}
                className="flex items-center gap-2"
              >
                <ChartBarIcon className="h-4 w-4" />
                Ver Analytics deste usuário
              </Button>
            </div>
            
            <div className="flex gap-3">
              <Button
                variant="secondary"
                onClick={onClose}
                disabled={updateMutation.isPending}
              >
                Cancelar
              </Button>
              <Button
                variant="primary"
                onClick={handleSave}
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Salvando...
                  </>
                ) : (
                  'Salvar Configurações'
                )}
              </Button>
            </div>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  )
}