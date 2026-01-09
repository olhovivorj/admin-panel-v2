import React, { useState, useEffect } from 'react'
import {
  XMarkIcon,
  BuildingStorefrontIcon,
  CalendarDaysIcon,
  IdentificationIcon,
  PhotoIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import api from '@/services/api'
import toast from 'react-hot-toast'

interface Loja {
  id_empresa: number
  codigo: string
  razao_social: string
  nome_fantasia: string
  cnpj: string
  logo_url: string
  data_inicio: string
  ativo: boolean
}

interface LojasModalProps {
  isOpen: boolean
  onClose: () => void
  baseId: number
  baseName: string
}

export function LojasModal({ isOpen, onClose, baseId, baseName }: LojasModalProps) {
  const [lojas, setLojas] = useState<Loja[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  const formatCNPJ = (cnpj: string) => {
    if (!cnpj) {
      return ''
    }

    try {
      const cleaned = cnpj.replace(/\D/g, '')
      if (cleaned.length !== 14) {
        return cnpj
      }

      return cleaned.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
    } catch {
      return cnpj
    }
  }

  useEffect(() => {
    if (isOpen && baseId) {
      fetchLojas()
    }
  }, [isOpen, baseId])

  const fetchLojas = async () => {
    setIsLoading(true)
    console.log('🔍 Iniciando busca de lojas para baseId:', baseId)

    try {
      const url = `/bases/${baseId}/lojas`
      console.log('🌐 URL da requisição:', url)

      const response = await api.get(url)
      console.log('✅ Response completa:', response)
      console.log('📦 Response.data:', response.data)

      const data = response.data?.data || response.data
      console.log('📊 Data extraída:', data)

      // Mapear dados do endpoint /bases/:id/lojas para o formato esperado
      const lojasFormatadas = Array.isArray(data) ? data.map((empresa: any) => {
        console.log('🏪 Mapeando empresa:', empresa)
        return {
          id_empresa: empresa.ID_EMPRESA || empresa.id_empresa,
          codigo: (empresa.ID_EMPRESA || empresa.id_empresa)?.toString() || '',
          razao_social: empresa.RAZAO_SOCIAL || empresa.razao_social || empresa.NOME_EMPRESA || 'Sem nome',
          nome_fantasia: empresa.NOME_FANTASIA || empresa.nome_fantasia || empresa.NOME_EMPRESA || 'Sem nome',
          cnpj: empresa.CNPJ || empresa.cnpj || '',
          logo_url: empresa.LOGO_URL || empresa.logo_url || '',
          data_inicio: empresa.DATA_INICIO || empresa.data_inicio || new Date().toISOString(),
          ativo: empresa.ATIVO === 1 || empresa.ATIVO === true || empresa.ativo === true || empresa.ativo === 1,
          atividade: empresa.ATIVIDADE || empresa.atividade || '',
        }
      }) : []

      console.log('✨ Lojas formatadas final:', lojasFormatadas)
      console.log('📈 Total de lojas:', lojasFormatadas.length)
      setLojas(lojasFormatadas)

      if (lojasFormatadas.length === 0) {
        toast('Nenhuma loja encontrada nesta base', { icon: 'ℹ️' })
      }
    } catch (error: any) {
      console.error('❌ Erro completo:', error)
      console.error('❌ Error.response:', error.response)
      console.error('❌ Error.message:', error.message)
      toast.error(error.response?.data?.message || 'Erro ao carregar lojas')
      setLojas([])
    } finally {
      setIsLoading(false)
    }
  }

  const filteredLojas = Array.isArray(lojas) ? lojas.filter(loja => {
    if (!searchTerm) {
      return true
    }
    const search = searchTerm.toLowerCase()
    return (
      loja.nome_fantasia?.toLowerCase().includes(search) ||
      loja.razao_social?.toLowerCase().includes(search) ||
      loja.codigo?.toLowerCase().includes(search) ||
      loja.cnpj?.includes(search)
    )
  }) : []

  if (!isOpen) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={onClose} />

        <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center">
                <BuildingStorefrontIcon className="h-6 w-6 text-blue-600 dark:text-blue-400 mr-2" />
                <div>
                  <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                    Lojas da Base {baseName}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    ID Base: {baseId}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="bg-white dark:bg-gray-800 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            {/* Search - fixo */}
            <div className="mt-4 sticky top-0 bg-white dark:bg-gray-800 pb-2 z-10">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Buscar por nome, código ou CNPJ..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Content - scroll apenas aqui */}
            <div className="max-h-80 overflow-y-auto mt-2">
              {isLoading ? (
                <div className="flex justify-center items-center py-12">
                  <LoadingSpinner size="lg" />
                </div>
              ) : filteredLojas.length === 0 ? (
                <div className="text-center py-12">
                  <BuildingStorefrontIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                    {searchTerm ? 'Nenhuma loja encontrada com este critério' : 'Nenhuma loja cadastrada nesta base'}
                  </p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {filteredLojas.map((loja) => (
                    <div
                      key={loja.id_empresa}
                      className={`p-4 border rounded-lg ${
                        loja.ativo
                          ? 'border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-700'
                          : 'border-gray-200 bg-gray-50 dark:bg-gray-700 dark:border-gray-600'
                      }`}
                    >
                      <div className="flex items-start space-x-4">
                        {/* Logo */}
                        <div className="flex-shrink-0">
                          {loja.logo_url ? (
                            <img
                              src={loja.logo_url}
                              alt={`Logo ${loja.nome_fantasia}`}
                              className="h-16 w-16 object-contain rounded-lg border border-gray-200 dark:border-gray-600"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none'
                                e.currentTarget.nextElementSibling?.classList.remove('hidden')
                              }}
                            />
                          ) : null}
                          <div className={`h-16 w-16 flex items-center justify-center bg-gray-100 dark:bg-gray-600 rounded-lg ${loja.logo_url ? 'hidden' : ''}`}>
                            <PhotoIcon className="h-8 w-8 text-gray-400" />
                          </div>
                        </div>

                        {/* Informações */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                              {loja.nome_fantasia || loja.razao_social}
                            </h4>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              loja.ativo
                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                                : 'bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-300'
                            }`}>
                              {loja.ativo ? 'Ativa' : 'Inativa'}
                            </span>
                          </div>

                          {loja.nome_fantasia && loja.razao_social && loja.nome_fantasia !== loja.razao_social && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {loja.razao_social}
                            </p>
                          )}

                          <div className="mt-2 space-y-1">
                            <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                              <IdentificationIcon className="h-4 w-4 mr-1 flex-shrink-0" />
                              <span>Código: {loja.codigo}</span>
                            </div>

                            {loja.cnpj && (
                              <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                                <span className="text-xs mr-1">#</span>
                                <span>CNPJ: {formatCNPJ(loja.cnpj)}</span>
                              </div>
                            )}

                            <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                              <CalendarDaysIcon className="h-4 w-4 mr-1 flex-shrink-0" />
                              <span>Início: {new Date(loja.data_inicio).toLocaleDateString('pt-BR')}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {lojas.length > 0 && (
              <div className="mt-4 text-sm text-gray-500 dark:text-gray-400 text-center">
                {lojas.filter(l => l.ativo).length} de {lojas.length} lojas ativas
              </div>
            )}
          </div>

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