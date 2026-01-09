import React, { useState, useEffect, useMemo } from 'react'
import {
  CircleStackIcon,
  CogIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline'
import { basesService, BaseWithStats } from '@/services/bases'
import { FirebirdConfigModal } from '@/components/bases/FirebirdConfigModal'
import { LojasConfigModal } from '@/components/bases/LojasConfigModal'
import { BaseConfigModal } from '@/components/bases/BaseConfigModal'
import { logger } from '@/utils/logger'

export function Bases() {
  const [bases, setBases] = useState<BaseWithStats[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedBase, setSelectedBase] = useState<BaseWithStats | null>(null)
  const [showFirebirdModal, setShowFirebirdModal] = useState(false)
  const [showLojasModal, setShowLojasModal] = useState(false)
  const [showBaseConfigModal, setShowBaseConfigModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<'name'>('name')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')

  useEffect(() => {
    carregarBases()
  }, [])

  const carregarBases = async () => {
    try {
      setLoading(true)
      setError(null)

      logger.info('Carregando bases', 'BASE')
      const basesData = await basesService.getBases()
      setBases(basesData)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar bases')
    } finally {
      setLoading(false)
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

  // Filtrar e ordenar bases com base no termo de busca e ordenação
  const filteredBases = useMemo(() => {
    let filtered = bases

    // Filtro por status (ativo/inativo)
    if (statusFilter === 'active') {
      filtered = filtered.filter(base =>
        base.firebird_status === 'CONFIGURED' && base.firebird_active
      )
    } else if (statusFilter === 'inactive') {
      filtered = filtered.filter(base =>
        base.firebird_status !== 'CONFIGURED' || !base.firebird_active
      )
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

    // Ordenação por nome
    filtered = [...filtered].sort((a, b) => {
      return (a.NOME || '').localeCompare(b.NOME || '')
    })

    return filtered
  }, [bases, searchTerm, sortBy, statusFilter])

  // Contagem por status
  const statusCounts = useMemo(() => {
    const active = bases.filter(b => b.firebird_status === 'CONFIGURED' && b.firebird_active).length
    return {
      all: bases.length,
      active,
      inactive: bases.length - active,
    }
  }, [bases])

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
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {filteredBases.length} de {bases.length} bases
          {searchTerm && ` (busca: "${searchTerm}")`}
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

          {/* Filtro por status */}
          <div className="flex gap-2">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                statusFilter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              Todas ({statusCounts.all})
            </button>
            <button
              onClick={() => setStatusFilter('active')}
              className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                statusFilter === 'active'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              Ativas ({statusCounts.active})
            </button>
            <button
              onClick={() => setStatusFilter('inactive')}
              className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                statusFilter === 'inactive'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              Inativas ({statusCounts.inactive})
            </button>
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
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => handleEditFirebird(base)}
                      className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-blue-700 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-300 dark:hover:bg-blue-800"
                    >
                      <CogIcon className="h-4 w-4 mr-1" />
                      Firebird
                    </button>
                    <button
                      onClick={() => {
                        setSelectedBase(base)
                        setShowLojasModal(true)
                      }}
                      className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-green-700 bg-green-100 hover:bg-green-200 dark:bg-green-900 dark:text-green-300 dark:hover:bg-green-800"
                    >
                      <CogIcon className="h-4 w-4 mr-1" />
                      Lojas
                    </button>
                    <button
                      onClick={() => {
                        setSelectedBase(base)
                        setShowBaseConfigModal(true)
                      }}
                      className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-purple-700 bg-purple-100 hover:bg-purple-200 dark:bg-purple-900 dark:text-purple-300 dark:hover:bg-purple-800"
                    >
                      <CogIcon className="h-4 w-4 mr-1" />
                      Base
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
        <LojasConfigModal
          isOpen={showLojasModal}
          onClose={() => {
            setShowLojasModal(false)
            setSelectedBase(null)
          }}
          baseId={selectedBase.ID_BASE || selectedBase.baseId}
          baseName={selectedBase.NOME}
        />
      )}

      {showBaseConfigModal && selectedBase && (
        <BaseConfigModal
          isOpen={showBaseConfigModal}
          onClose={() => {
            setShowBaseConfigModal(false)
            setSelectedBase(null)
          }}
          baseId={selectedBase.ID_BASE || selectedBase.baseId}
          baseName={selectedBase.NOME}
        />
      )}
    </div>
  )
}