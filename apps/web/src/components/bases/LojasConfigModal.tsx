/**
 * LojasConfigModal - Configuração de Lojas/Empresas para integração Zeiss
 *
 * Gerencia flags de integração por loja:
 * - ZEISS_USA_CATALOGO: Recebe catálogo/preços (sync batch)
 * - ZEISS_USA_SAO: Envio de pedidos produção
 * - ZEISS_USA_ZVC: Compliance/sellout (franquias)
 * - ZEISS_USA_MARKETPLACE: Marketplace Zeiss (requer ZVC)
 */

import React, { useState, useEffect, useCallback } from 'react'
import {
  XMarkIcon,
  BuildingStorefrontIcon,
  ArrowPathIcon,
  CheckIcon,
  XCircleIcon,
  CheckCircleIcon,
  MagnifyingGlassIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import api from '@/services/api'
import toast from 'react-hot-toast'

// Icons para os serviços (usando heroicons)
import {
  CubeIcon,        // Catálogo
  ShoppingCartIcon, // SAO
  ChartBarIcon,    // ZVC
  BuildingOfficeIcon, // Marketplace
} from '@heroicons/react/24/outline'

interface LojaConfig {
  id?: number
  ZEISS_USA_CATALOGO: string
  ZEISS_USA_SAO: string
  ZEISS_USA_ZVC: string
  ZEISS_USA_MARKETPLACE: string
  ZEISS_CODIGO_LOJA: string | null
  ativo: string
}

interface Loja {
  id_empresa: number
  nome: string
  razao_social: string
  config: LojaConfig | null
  modificada?: boolean
}

interface Stats {
  total: number
  configuradas: number
  catalogo: number
  sao: number
  zvc: number
  marketplace: number
}

interface LojasConfigModalProps {
  isOpen: boolean
  onClose: () => void
  baseId: number
  baseName: string
}

// Componente de botão de flag
const FlagButton: React.FC<{
  ativo: boolean
  onClick: () => void
  icon: React.ElementType
  label: string
  disabled?: boolean
  tooltip?: string
}> = React.memo(({ ativo, onClick, icon: Icon, label, disabled, tooltip }) => (
  <button
    type="button"
    onClick={(e) => {
      e.preventDefault()
      e.stopPropagation()
      onClick()
    }}
    disabled={disabled}
    title={tooltip || label}
    className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors ${
      ativo
        ? 'bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400'
        : 'bg-gray-100 text-gray-500 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-400'
    } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
  >
    <Icon className="w-3.5 h-3.5" />
    {ativo ? <CheckIcon className="w-3 h-3" /> : <XMarkIcon className="w-3 h-3" />}
  </button>
))

export function LojasConfigModal({ isOpen, onClose, baseId, baseName }: LojasConfigModalProps) {
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [lojas, setLojas] = useState<Loja[]>([])
  const [stats, setStats] = useState<Stats>({ total: 0, configuradas: 0, catalogo: 0, sao: 0, zvc: 0, marketplace: 0 })
  const [filtro, setFiltro] = useState('')
  const [savingId, setSavingId] = useState<number | null>(null)

  const carregarDados = useCallback(async () => {
    setLoading(true)
    try {
      const response = await api.get(`/bases/${baseId}/lojas/config`)
      const data = response.data

      setLojas(data.lojas || [])
      setStats(data.stats || { total: 0, configuradas: 0, catalogo: 0, sao: 0, zvc: 0, marketplace: 0 })
    } catch (error: any) {
      console.error('Erro ao carregar lojas:', error)
      toast.error(error.response?.data?.message || 'Erro ao carregar lojas')
    } finally {
      setLoading(false)
    }
  }, [baseId])

  useEffect(() => {
    if (isOpen && baseId) {
      carregarDados()
    }
  }, [isOpen, baseId, carregarDados])

  const toggleFlag = useCallback((
    idEmpresa: number,
    flag: 'ZEISS_USA_CATALOGO' | 'ZEISS_USA_SAO' | 'ZEISS_USA_ZVC' | 'ZEISS_USA_MARKETPLACE'
  ) => {
    setLojas(prev =>
      prev.map(loja => {
        if (loja.id_empresa !== idEmpresa) return loja

        // Cria config se não existir
        const currentConfig: LojaConfig = loja.config ? { ...loja.config } : {
          ZEISS_USA_CATALOGO: 'N',
          ZEISS_USA_SAO: 'N',
          ZEISS_USA_ZVC: 'N',
          ZEISS_USA_MARKETPLACE: 'N',
          ZEISS_CODIGO_LOJA: null,
          ativo: 'S',
        }

        const newValue = currentConfig[flag] === 'S' ? 'N' : 'S'
        const updatedConfig: LojaConfig = { ...currentConfig, [flag]: newValue }

        // Regra: Marketplace requer ZVC
        if (flag === 'ZEISS_USA_MARKETPLACE' && newValue === 'S' && currentConfig.ZEISS_USA_ZVC !== 'S') {
          updatedConfig.ZEISS_USA_ZVC = 'S'
        }
        // Se desativar ZVC, desativa Marketplace também
        if (flag === 'ZEISS_USA_ZVC' && newValue === 'N') {
          updatedConfig.ZEISS_USA_MARKETPLACE = 'N'
        }

        return { ...loja, config: updatedConfig, modificada: true }
      })
    )
  }, [])

  const updateCodigoZeiss = (idEmpresa: number, codigo: string) => {
    setLojas(prev =>
      prev.map(loja => {
        if (loja.id_empresa !== idEmpresa) return loja

        const currentConfig: LojaConfig = loja.config || {
          ZEISS_USA_CATALOGO: 'N',
          ZEISS_USA_SAO: 'N',
          ZEISS_USA_ZVC: 'N',
          ZEISS_USA_MARKETPLACE: 'N',
          ZEISS_CODIGO_LOJA: null,
          ativo: 'S',
        }

        return {
          ...loja,
          config: { ...currentConfig, ZEISS_CODIGO_LOJA: codigo || null },
          modificada: true,
        }
      })
    )
  }

  const salvarLoja = async (loja: Loja) => {
    if (!loja.config) return

    setSavingId(loja.id_empresa)
    try {
      const response = await api.post(`/bases/${baseId}/lojas/config`, {
        id_empresa: loja.id_empresa,
        nome_empresa: loja.nome,
        ZEISS_USA_CATALOGO: loja.config.ZEISS_USA_CATALOGO,
        ZEISS_USA_SAO: loja.config.ZEISS_USA_SAO,
        ZEISS_USA_ZVC: loja.config.ZEISS_USA_ZVC,
        ZEISS_USA_MARKETPLACE: loja.config.ZEISS_USA_MARKETPLACE,
        ZEISS_CODIGO_LOJA: loja.config.ZEISS_CODIGO_LOJA,
        ativo: 'S',
      })

      // Atualizar loja local
      setLojas(prev =>
        prev.map(l =>
          l.id_empresa === loja.id_empresa
            ? { ...l, config: response.data, modificada: false }
            : l
        )
      )

      toast.success('Configuração salva!')
    } catch (error: any) {
      console.error('Erro ao salvar:', error)
      toast.error(error.response?.data?.message || 'Erro ao salvar')
    } finally {
      setSavingId(null)
    }
  }

  const salvarTodas = async () => {
    const modificadas = lojas.filter(l => l.modificada && l.config)
    if (modificadas.length === 0) return

    setSaving(true)
    let successCount = 0
    let errorCount = 0

    for (const loja of modificadas) {
      try {
        await salvarLoja(loja)
        successCount++
      } catch {
        errorCount++
      }
    }

    setSaving(false)

    if (errorCount > 0) {
      toast.error(`${errorCount} lojas falharam ao salvar`)
    } else {
      toast.success(`${successCount} lojas salvas!`)
    }

    // Recarregar para atualizar stats
    carregarDados()
  }

  const lojasFiltradas = lojas.filter(loja => {
    if (!filtro) return true
    const termo = filtro.toLowerCase()
    return (
      loja.nome?.toLowerCase().includes(termo) ||
      loja.razao_social?.toLowerCase().includes(termo) ||
      loja.id_empresa.toString().includes(termo)
    )
  })

  const temModificacoes = lojas.some(l => l.modificada)

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={onClose} />

        <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-5xl sm:w-full">
          {/* Header */}
          <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center">
                <BuildingStorefrontIcon className="h-6 w-6 text-blue-600 dark:text-blue-400 mr-2" />
                <div>
                  <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                    Configurar Lojas - {baseName}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Configurar serviços Zeiss por loja
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={carregarDados}
                  disabled={loading}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50"
                >
                  <ArrowPathIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  Atualizar
                </button>
                {temModificacoes && (
                  <button
                    onClick={salvarTodas}
                    disabled={saving}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                  >
                    <CheckIcon className={`w-4 h-4 ${saving ? 'animate-spin' : ''}`} />
                    Salvar Todas ({lojas.filter(l => l.modificada).length})
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="bg-white dark:bg-gray-800 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
            </div>

            {/* Estatísticas */}
            <div className="mt-4 grid grid-cols-6 gap-2">
              <div className="bg-gray-50 dark:bg-gray-700 rounded p-2 text-center">
                <div className="text-lg font-bold text-gray-800 dark:text-gray-100">{stats.total}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Total</div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 rounded p-2 text-center">
                <div className="text-lg font-bold text-green-600 dark:text-green-400">{stats.configuradas}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Configuradas</div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 rounded p-2 text-center">
                <div className="text-lg font-bold text-blue-600 dark:text-blue-400">{stats.catalogo}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center justify-center gap-1">
                  <CubeIcon className="w-3 h-3" /> Catálogo
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 rounded p-2 text-center">
                <div className="text-lg font-bold text-purple-600 dark:text-purple-400">{stats.sao}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center justify-center gap-1">
                  <ShoppingCartIcon className="w-3 h-3" /> SAO
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 rounded p-2 text-center">
                <div className="text-lg font-bold text-orange-600 dark:text-orange-400">{stats.zvc}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center justify-center gap-1">
                  <ChartBarIcon className="w-3 h-3" /> ZVC
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 rounded p-2 text-center">
                <div className="text-lg font-bold text-teal-600 dark:text-teal-400">{stats.marketplace}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center justify-center gap-1">
                  <BuildingOfficeIcon className="w-3 h-3" /> Market
                </div>
              </div>
            </div>

            {/* Filtro */}
            <div className="mt-4 relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Filtrar por nome ou ID..."
                value={filtro}
                onChange={e => setFiltro(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Tabela de lojas */}
            <div className="mt-4 max-h-96 overflow-y-auto">
              {loading ? (
                <div className="flex justify-center items-center py-12">
                  <LoadingSpinner size="lg" />
                </div>
              ) : lojasFiltradas.length === 0 ? (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  <BuildingStorefrontIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Nenhuma loja encontrada</p>
                </div>
              ) : (
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Loja</th>
                      <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase" title="Catálogo de preços">
                        <CubeIcon className="w-4 h-4 mx-auto" />
                      </th>
                      <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase" title="Pedidos SAO">
                        <ShoppingCartIcon className="w-4 h-4 mx-auto" />
                      </th>
                      <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase" title="Compliance ZVC">
                        <ChartBarIcon className="w-4 h-4 mx-auto" />
                      </th>
                      <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase" title="Marketplace">
                        <BuildingOfficeIcon className="w-4 h-4 mx-auto" />
                      </th>
                      <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Cód. Zeiss</th>
                      <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {lojasFiltradas.map((loja) => {
                      const isSaving = savingId === loja.id_empresa
                      const isModificada = loja.modificada

                      return (
                        <tr
                          key={loja.id_empresa}
                          className={`${isModificada ? 'bg-yellow-50 dark:bg-yellow-900/20' : ''} hover:bg-gray-50 dark:hover:bg-gray-700/50`}
                        >
                          <td className="px-3 py-2">
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-400 dark:text-gray-500">#{loja.id_empresa}</span>
                              <span className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-xs">
                                {loja.nome || `Loja ${loja.id_empresa}`}
                              </span>
                              {isModificada && (
                                <span className="text-xs text-yellow-700 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/40 px-1.5 py-0.5 rounded">
                                  modificado
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-3 py-2 text-center">
                            <FlagButton
                              ativo={loja.config?.ZEISS_USA_CATALOGO === 'S'}
                              onClick={() => toggleFlag(loja.id_empresa, 'ZEISS_USA_CATALOGO')}
                              icon={CubeIcon}
                              label="Catálogo"
                              tooltip="Recebe catálogo e preços"
                            />
                          </td>
                          <td className="px-3 py-2 text-center">
                            <FlagButton
                              ativo={loja.config?.ZEISS_USA_SAO === 'S'}
                              onClick={() => toggleFlag(loja.id_empresa, 'ZEISS_USA_SAO')}
                              icon={ShoppingCartIcon}
                              label="SAO"
                              tooltip="Envio de pedidos SAO"
                            />
                          </td>
                          <td className="px-3 py-2 text-center">
                            <FlagButton
                              ativo={loja.config?.ZEISS_USA_ZVC === 'S'}
                              onClick={() => toggleFlag(loja.id_empresa, 'ZEISS_USA_ZVC')}
                              icon={ChartBarIcon}
                              label="ZVC"
                              tooltip="Compliance/sellout (franquia)"
                            />
                          </td>
                          <td className="px-3 py-2 text-center">
                            <FlagButton
                              ativo={loja.config?.ZEISS_USA_MARKETPLACE === 'S'}
                              onClick={() => toggleFlag(loja.id_empresa, 'ZEISS_USA_MARKETPLACE')}
                              icon={BuildingOfficeIcon}
                              label="Marketplace"
                              disabled={loja.config?.ZEISS_USA_ZVC !== 'S'}
                              tooltip="Marketplace (requer ZVC)"
                            />
                          </td>
                          <td className="px-3 py-2 text-center">
                            <input
                              type="text"
                              placeholder="Código"
                              value={loja.config?.ZEISS_CODIGO_LOJA || ''}
                              onChange={e => updateCodigoZeiss(loja.id_empresa, e.target.value)}
                              className="w-24 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-blue-500"
                            />
                          </td>
                          <td className="px-3 py-2 text-center">
                            {isModificada && (
                              <button
                                onClick={() => salvarLoja(loja)}
                                disabled={isSaving}
                                className="p-1.5 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                                title="Salvar"
                              >
                                {isSaving ? (
                                  <ArrowPathIcon className="w-4 h-4 animate-spin" />
                                ) : (
                                  <CheckIcon className="w-4 h-4" />
                                )}
                              </button>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {/* Aviso de modificações não salvas */}
            {temModificacoes && (
              <div className="mt-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-3 flex items-center gap-2">
                <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                <span className="text-sm text-yellow-800 dark:text-yellow-300">
                  Você tem {lojas.filter(l => l.modificada).length} alterações não salvas.
                  Clique em "Salvar Todas" ou salve individualmente.
                </span>
              </div>
            )}

            {/* Legenda */}
            <div className="mt-4 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-lg p-3">
              <div className="text-xs text-gray-600 dark:text-gray-300 space-y-1">
                <div className="flex items-center gap-2">
                  <CubeIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span><strong>Catálogo:</strong> Recebe sync de lentes e preços</span>
                </div>
                <div className="flex items-center gap-2">
                  <ShoppingCartIcon className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  <span><strong>SAO:</strong> Envio de pedidos de produção para Zeiss</span>
                </div>
                <div className="flex items-center gap-2">
                  <ChartBarIcon className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                  <span><strong>ZVC:</strong> Compliance/sellout - envio de clientes, vendedores, vendas (franquias)</span>
                </div>
                <div className="flex items-center gap-2">
                  <BuildingOfficeIcon className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                  <span><strong>Marketplace:</strong> Venda de armações no marketplace Zeiss (requer ZVC)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              onClick={onClose}
              className="w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-800 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:w-auto sm:text-sm"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
