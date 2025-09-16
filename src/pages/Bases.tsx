import React, { useState, useEffect, useMemo } from 'react'
import {
  CircleStackIcon,
  CogIcon,
  EyeIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline'
import { basesService, BaseWithStats } from '@/services/bases'
import { FirebirdConfigModal } from '@/components/bases/FirebirdConfigModal'
import { LojasModal } from '@/components/bases/LojasModal'
import { logger } from '@/utils/logger'

export function Bases() {
  const [bases, setBases] = useState<BaseWithStats[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingStats, setLoadingStats] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedBase, setSelectedBase] = useState<BaseWithStats | null>(null)
  const [showFirebirdModal, setShowFirebirdModal] = useState(false)
  const [showLojasModal, setShowLojasModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [showOnlyWithData, setShowOnlyWithData] = useState(false)
  const [sortBy, setSortBy] = useState<'name' | 'users' | 'clients' | 'companies'>('companies')

  useEffect(() => {
    carregarBases()
  }, [])

  const carregarBases = async () => {
    try {
      setLoading(true)
      setError(null)

      // Primeira etapa: Carregar bases básicas (rápido)
      logger.info('Carregando bases básicas', 'BASE')
      const basesData = await basesService.getBasesSimples()

      // Mostrar bases sem estatísticas primeiro
      const basesComPlaceholder = basesData.map(base => ({
        ...base,
        total_usuarios: 0,
        total_clientes: 0,
        total_empresas: 0,
        total_pessoas: 0,
        total_fornecedores: 0,
        _calculandoStats: true, // Flag para mostrar loading nas estatísticas
      }))

      setBases(basesComPlaceholder)
      setLoading(false) // Interface já pode ser usada

      // Segunda etapa: Calcular estatísticas (mais lento)
      logger.info('Calculando estatísticas', 'BASE')
      setLoadingStats(true)

      // Recarregar com estatísticas completas
      const basesCompletas = await basesService.getBases()
      setBases(basesCompletas.map(base => ({
        ...base,
        _calculandoStats: false,
      })))

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar bases')
      setLoading(false)
    } finally {
      setLoadingStats(false)
    }
  }

  const handleEditFirebird = async (base: BaseWithStats) => {
    try {
      const config = await basesService.getFirebirdConfig(base.ID_BASE || base.baseId)
      setSelectedBase({ ...base, ...config })
      setShowFirebirdModal(true)
    } catch (err) {
      setSelectedBase(base)
      setShowFirebirdModal(true)
    }
  }

  const handleSaveFirebird = async (config: any) => {
    if (!selectedBase) {
      return
    }

    try {
      await basesService.updateFirebirdConfig(selectedBase.ID_BASE || selectedBase.baseId, config)
      await carregarBases() // Recarregar lista
      setShowFirebirdModal(false)
      setSelectedBase(null)
    } catch (err) {
      throw err
    }
  }

  const getStatusIcon = (base: BaseWithStats) => {
    if (base.firebird_status === 'CONFIGURED' && base.firebird_active) {
      return <CheckCircleIcon className="h-5 w-5 text-green-500" />
    } else if (base.firebird_status === 'PENDING_CONFIG') {
      return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />
    } else {
      return <XCircleIcon className="h-5 w-5 text-red-500" />
    }
  }

  const getStatusText = (base: BaseWithStats) => {
    if (base.firebird_status === 'CONFIGURED' && base.firebird_active) {
      return 'Configurado'
    } else if (base.firebird_status === 'PENDING_CONFIG') {
      return 'Pendente'
    } else {
      return 'Inativo'
    }
  }

  // Filtrar e ordenar bases com base no termo de busca, dados e ordenação
  const filteredBases = useMemo(() => {
    let filtered = bases

    // Filtro por dados (se ativado)
    if (showOnlyWithData) {
      filtered = filtered.filter(base => {
        const hasData = (base.total_usuarios || 0) > 0 ||
                       (base.total_clientes || 0) > 0 ||
                       (base.total_empresas || 0) > 0 ||
                       (base.total_pessoas || 0) > 0 ||
                       (base.total_fornecedores || 0) > 0
        return hasData
      })
    }

    // Filtro por busca
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase().trim()
      filtered = filtered.filter(base =>
        base.NOME?.toLowerCase().includes(search) ||
        base.BASE?.toLowerCase().includes(search) ||
        base.ID_BASE?.toString().includes(search) ||
        base.baseId?.toString().includes(search),
      )
    }

    // Ordenação
    filtered = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return (a.NOME || '').localeCompare(b.NOME || '')
        case 'users':
          return (b.total_usuarios || 0) - (a.total_usuarios || 0)
        case 'clients':
          return (b.total_clientes || 0) - (a.total_clientes || 0)
        case 'companies':
          return (b.total_empresas || 0) - (a.total_empresas || 0)
        default:
          return 0
      }
    })

    return filtered
  }, [bases, searchTerm, showOnlyWithData, sortBy])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Bases de Dados
          </h1>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-500 dark:text-gray-400">Carregando bases...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Bases de Dados
          </h1>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="text-center py-12">
            <XCircleIcon className="mx-auto h-12 w-12 text-red-500" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
              Erro ao carregar bases
            </h3>
            <p className="mt-1 text-sm text-red-600">{error}</p>
            <button
              onClick={carregarBases}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Tentar novamente
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Bases de Dados
        </h1>
        <div className="flex items-center gap-3">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {filteredBases.length} de {bases.length} bases
            {searchTerm && ` (busca: "${searchTerm}")`}
            {showOnlyWithData && ' (com dados)'}
          </div>
          {loadingStats && (
            <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
              <span>Calculando estatísticas...</span>
            </div>
          )}
        </div>
      </div>

      {/* Campo de busca e filtros */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <div className="space-y-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Buscar por nome, código ou ID da base..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
            {searchTerm && (
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                <button
                  onClick={() => setSearchTerm('')}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <XCircleIcon className="h-5 w-5" />
                </button>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center">
              <input
                id="showOnlyWithData"
                type="checkbox"
                checked={showOnlyWithData}
                onChange={(e) => setShowOnlyWithData(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded"
              />
              <label htmlFor="showOnlyWithData" className="ml-2 block text-sm text-gray-900 dark:text-white">
                Mostrar apenas bases com dados
              </label>
            </div>

            <div className="flex items-center gap-2">
              <label htmlFor="sortBy" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Ordenar por:
              </label>
              <select
                id="sortBy"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="companies">Maior número de empresas</option>
                <option value="users">Maior número de usuários</option>
                <option value="clients">Maior número de clientes</option>
                <option value="name">Nome da base (A-Z)</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Base
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Status Firebird
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Estatísticas
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredBases.map((base) => (
                <tr key={base.ID_BASE} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <CircleStackIcon className="h-8 w-8 text-gray-400 mr-3" />
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {base.NOME}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {base.BASE} (ID: {base.ID_BASE})
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getStatusIcon(base)}
                      <span className="ml-2 text-sm text-gray-900 dark:text-white">
                        {getStatusText(base)}
                      </span>
                    </div>
                    {base.firebird_database && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {base.firebird_host}:{base.firebird_port}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span>Empresas:</span>
                        {(base as any)._calculandoStats ? (
                          <div className="animate-pulse w-8 h-3 bg-gray-200 dark:bg-gray-600 rounded"></div>
                        ) : (
                          <span className="font-medium text-blue-600 dark:text-blue-400">{base.total_empresas || 0}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span>Usuários:</span>
                        {(base as any)._calculandoStats ? (
                          <div className="animate-pulse w-8 h-3 bg-gray-200 dark:bg-gray-600 rounded"></div>
                        ) : (
                          <span className="font-medium">{base.total_usuarios || 0}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span>Clientes:</span>
                        {(base as any)._calculandoStats ? (
                          <div className="animate-pulse w-8 h-3 bg-gray-200 dark:bg-gray-600 rounded"></div>
                        ) : (
                          <span className="font-medium">{base.total_clientes || 0}</span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => handleEditFirebird(base)}
                      className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-blue-700 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-300 dark:hover:bg-blue-800"
                    >
                      <CogIcon className="h-4 w-4 mr-1" />
                      Config Firebird
                    </button>
                    <button
                      onClick={() => {
                        setSelectedBase(base)
                        setShowLojasModal(true)
                      }}
                      className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-green-700 bg-green-100 hover:bg-green-200 dark:bg-green-900 dark:text-green-300 dark:hover:bg-green-800"
                    >
                      <EyeIcon className="h-4 w-4 mr-1" />
                      Ver Lojas
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showFirebirdModal && selectedBase && (
        <FirebirdConfigModal
          isOpen={showFirebirdModal}
          onClose={() => {
            setShowFirebirdModal(false)
            setSelectedBase(null)
          }}
          onSave={handleSaveFirebird}
          baseId={selectedBase.ID_BASE || selectedBase.baseId}
          baseName={selectedBase.NOME}
          initialConfig={selectedBase}
        />
      )}

      {showLojasModal && selectedBase && (
        <LojasModal
          isOpen={showLojasModal}
          onClose={() => {
            setShowLojasModal(false)
            setSelectedBase(null)
          }}
          baseId={selectedBase.ID_BASE || selectedBase.baseId}
          baseName={selectedBase.NOME}
        />
      )}
    </div>
  )
}