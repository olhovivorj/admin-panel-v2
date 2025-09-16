import React, { useState } from 'react'
import { KeyIcon, ClipboardDocumentIcon, TrashIcon, PlusIcon } from '@heroicons/react/24/outline'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { toast } from 'react-hot-toast'
import { usersService } from '@/services/users'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

interface EndpointPermission {
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

interface ApiTokenManagerProps {
  userId: number
  baseId: number
  permissoesEndpoints: Record<string, EndpointPermission>
}

interface Token {
  token: string
  endpoint: string
  maxRecords: number
  recordsUsed: number
  expiresAt: string
  createdAt: string
  usedAt?: string
  status: 'active' | 'expired' | 'consumed' | 'unused'
  description?: string
}

interface InitialLoadTokenResponse {
  token: string
  expiresAt: Date
  endpoint: string
  maxRecords: number
  url: string
  example: {
    curl: string
    javascript: string
  }
}

export const ApiTokenManager: React.FC<ApiTokenManagerProps> = ({
  userId,
  baseId,
  permissoesEndpoints,
}) => {
  const [showGenerateModal, setShowGenerateModal] = useState(false)
  const [selectedEndpoint, setSelectedEndpoint] = useState('')
  const [tokenDescription, setTokenDescription] = useState('')
  const [generatedToken, setGeneratedToken] = useState<InitialLoadTokenResponse | null>(null)
  const queryClient = useQueryClient()

  // Buscar tokens existentes
  const { data: tokens = [], isLoading } = useQuery({
    queryKey: ['api-tokens', userId, baseId],
    queryFn: () => usersService.listApiTokens(userId, baseId),
    refetchInterval: 30000, // Atualizar a cada 30s
  })

  // Mutation para gerar token
  const generateTokenMutation = useMutation({
    mutationFn: (data: { endpoint: string; description?: string }) =>
      usersService.generateInitialLoadToken(userId, data),
    onSuccess: (data) => {
      setGeneratedToken(data)
      queryClient.invalidateQueries(['api-tokens', userId, baseId])
      toast.success('Token gerado com sucesso!')
    },
    onError: (error) => {
      const errorMessage = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Erro ao gerar token'
      toast.error(errorMessage)
    },
  })

  // Mutation para revogar token
  const revokeTokenMutation = useMutation({
    mutationFn: (token: string) => usersService.revokeApiToken(userId, token),
    onSuccess: () => {
      queryClient.invalidateQueries(['api-tokens', userId, baseId])
      toast.success('Token revogado com sucesso')
    },
    onError: () => {
      toast.error('Erro ao revogar token')
    },
  })

  // Endpoints habilitados com token de carga inicial
  const enabledEndpoints = Object.entries(permissoesEndpoints)
    .filter(([_, config]: [string, any]) => config.enabled && config.firstLoadToken?.enabled)
    .map(([endpoint, config]) => ({
      endpoint,
      ...config.firstLoadToken,
    }))

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast.success(`${label} copiado!`)
  }

  const getStatusBadge = (status: string) => {
    const badges = {
      active: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      expired: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      consumed: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
      unused: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    }

    const labels = {
      active: 'Ativo',
      expired: 'Expirado',
      consumed: 'Consumido',
      unused: 'Não usado',
    }

    return (
      <span className={`px-2 py-1 text-xs rounded-full ${badges[status]}`}>
        {labels[status]}
      </span>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <KeyIcon className="h-5 w-5 text-gray-500" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Tokens de Carga Inicial
          </h3>
        </div>
        {enabledEndpoints.length > 0 && (
          <button
            onClick={() => setShowGenerateModal(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
          >
            <PlusIcon className="h-4 w-4" />
            Gerar Token
          </button>
        )}
      </div>

      {/* Lista de endpoints habilitados */}
      {enabledEndpoints.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <KeyIcon className="h-12 w-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
          <p>Nenhum endpoint habilitado para carga inicial</p>
          <p className="text-sm mt-1">Configure os endpoints primeiro</p>
        </div>
      ) : (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
            Endpoints com Carga Inicial Habilitada
          </h4>
          <div className="space-y-1 text-sm text-blue-800 dark:text-blue-200">
            {enabledEndpoints.map(ep => (
              <div key={ep.endpoint} className="flex justify-between">
                <span className="font-mono">/{ep.endpoint}</span>
                <span>{ep.maxRecords.toLocaleString()} registros, {ep.expiresInHours}h validade</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lista de tokens */}
      {isLoading ? (
        <div className="text-center py-4">Carregando tokens...</div>
      ) : !Array.isArray(tokens) || tokens.length === 0 ? (
        <div className="text-center py-4 text-gray-500">
          Nenhum token gerado ainda
        </div>
      ) : (
        <div className="space-y-3">
          {(Array.isArray(tokens) ? tokens : []).map((token: Token) => (
            <div
              key={token.token}
              className="border border-gray-200 dark:border-gray-600 rounded-lg p-4"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-mono text-sm bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                      /{token.endpoint}
                    </span>
                    {getStatusBadge(token.status)}
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 dark:text-gray-400">
                    <div>
                      <span className="font-medium">Criado:</span>{' '}
                      {format(new Date(token.createdAt), 'dd/MM/yyyy \'às\' HH:mm', { locale: ptBR })}
                    </div>
                    <div>
                      <span className="font-medium">Expira:</span>{' '}
                      {format(new Date(token.expiresAt), 'dd/MM/yyyy \'às\' HH:mm', { locale: ptBR })}
                    </div>
                    <div>
                      <span className="font-medium">Uso:</span>{' '}
                      {token.recordsUsed.toLocaleString()} / {token.maxRecords.toLocaleString()} registros
                    </div>
                    {token.usedAt && (
                      <div>
                        <span className="font-medium">Último uso:</span>{' '}
                        {format(new Date(token.usedAt), 'dd/MM/yyyy \'às\' HH:mm', { locale: ptBR })}
                      </div>
                    )}
                  </div>

                  {token.description && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                      {token.description}
                    </p>
                  )}

                  {token.status === 'active' && (
                    <div className="mt-3 flex items-center gap-2">
                      <button
                        onClick={() => copyToClipboard(token.token, 'Token')}
                        className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        <ClipboardDocumentIcon className="h-4 w-4" />
                        Copiar Token
                      </button>
                    </div>
                  )}
                </div>

                {token.status === 'active' && (
                  <button
                    onClick={() => {
                      if (confirm('Tem certeza que deseja revogar este token?')) {
                        revokeTokenMutation.mutate(token.token)
                      }
                    }}
                    className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de geração */}
      {showGenerateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            {!generatedToken ? (
              <>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Gerar Token de Carga Inicial
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Endpoint
                    </label>
                    <select
                      value={selectedEndpoint}
                      onChange={(e) => setSelectedEndpoint(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="">Selecione um endpoint</option>
                      {enabledEndpoints.map(ep => (
                        <option key={ep.endpoint} value={ep.endpoint}>
                          /{ep.endpoint} - até {ep.maxRecords.toLocaleString()} registros
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Descrição (opcional)
                    </label>
                    <input
                      type="text"
                      value={tokenDescription}
                      onChange={(e) => setTokenDescription(e.target.value)}
                      placeholder="Ex: Importação inicial de clientes"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>

                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-md p-4">
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                      <strong>⚠️ Atenção:</strong> Este token permite uma única requisição com grande volume de dados.
                      Use com cuidado e apenas para importação inicial de dados.
                    </p>
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <button
                    onClick={() => {
                      setShowGenerateModal(false)
                      setSelectedEndpoint('')
                      setTokenDescription('')
                    }}
                    className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => {
                      if (!selectedEndpoint) {
                        toast.error('Selecione um endpoint')
                        return
                      }
                      generateTokenMutation.mutate({
                        endpoint: selectedEndpoint,
                        description: tokenDescription || undefined,
                      })
                    }}
                    disabled={!selectedEndpoint || generateTokenMutation.isLoading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {generateTokenMutation.isLoading ? 'Gerando...' : 'Gerar Token'}
                  </button>
                </div>
              </>
            ) : (
              <>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  ✅ Token Gerado com Sucesso!
                </h3>

                <div className="space-y-4">
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-green-800 dark:text-green-200">
                        Token de Acesso
                      </span>
                      <button
                        onClick={() => copyToClipboard(generatedToken.token, 'Token')}
                        className="text-green-600 dark:text-green-400 hover:text-green-700"
                      >
                        <ClipboardDocumentIcon className="h-5 w-5" />
                      </button>
                    </div>
                    <code className="block p-2 bg-white dark:bg-gray-800 rounded text-xs break-all">
                      {generatedToken.token}
                    </code>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-700 dark:text-gray-300">Endpoint:</span>
                      <p className="text-gray-900 dark:text-white">/{generatedToken.endpoint}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700 dark:text-gray-300">Máximo de Registros:</span>
                      <p className="text-gray-900 dark:text-white">{generatedToken.maxRecords.toLocaleString()}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700 dark:text-gray-300">Validade:</span>
                      <p className="text-gray-900 dark:text-white">
                        {format(new Date(generatedToken.expiresAt), 'dd/MM/yyyy \'às\' HH:mm', { locale: ptBR })}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700 dark:text-gray-300">URL:</span>
                      <p className="text-gray-900 dark:text-white font-mono text-xs">{generatedToken.url}</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-medium text-gray-900 dark:text-white">Exemplos de Uso:</h4>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">cURL</span>
                        <button
                          onClick={() => copyToClipboard(generatedToken.example.curl, 'Comando cURL')}
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-700"
                        >
                          <ClipboardDocumentIcon className="h-4 w-4" />
                        </button>
                      </div>
                      <pre className="p-3 bg-gray-100 dark:bg-gray-700 rounded-md text-xs overflow-x-auto">
                        {generatedToken.example.curl}
                      </pre>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">JavaScript</span>
                        <button
                          onClick={() => copyToClipboard(generatedToken.example.javascript, 'Código JavaScript')}
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-700"
                        >
                          <ClipboardDocumentIcon className="h-4 w-4" />
                        </button>
                      </div>
                      <pre className="p-3 bg-gray-100 dark:bg-gray-700 rounded-md text-xs overflow-x-auto">
                        {generatedToken.example.javascript}
                      </pre>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end mt-6">
                  <button
                    onClick={() => {
                      setShowGenerateModal(false)
                      setSelectedEndpoint('')
                      setTokenDescription('')
                      setGeneratedToken(null)
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Fechar
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default ApiTokenManager