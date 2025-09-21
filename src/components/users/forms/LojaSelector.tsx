import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { BuildingStorefrontIcon, CheckIcon } from '@heroicons/react/24/outline'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import api from '@/services/api'
import { logger } from '@/utils/logger'

interface Loja {
  id: number
  nome: string
  cidade?: string | null
  uf?: string | null
  ativa?: boolean
}

interface LojaSelectorProps {
  userId?: number
  baseId: number
  selectedLojas: number[]
  onChange: (lojas: number[]) => void
  isEditing?: boolean
}

export function LojaSelector({ userId, baseId, selectedLojas, onChange, isEditing }: LojaSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('')

  // Buscar todas as lojas disponíveis
  const { data: lojasResponse, isLoading } = useQuery({
    queryKey: ['lojas-disponíveis', baseId],
    queryFn: async () => {
      logger.info('🏢 Buscando lojas disponíveis para base:', 'LOJA', { baseId })
      const response = await api.get('/usuarios/lojas/available', {
        params: { baseId }
      })
      return response.data
    },
    enabled: !!baseId,
  })

  const lojas: Loja[] = lojasResponse?.data || lojasResponse || []

  // Filtrar lojas baseado na busca
  const filteredLojas = lojas.filter(loja =>
    loja.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    loja.cidade?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    loja.uf?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleToggleLoja = (lojaId: number) => {
    if (selectedLojas.includes(lojaId)) {
      onChange(selectedLojas.filter(id => id !== lojaId))
    } else {
      onChange([...selectedLojas, lojaId])
    }
  }

  const handleSelectAll = () => {
    if (selectedLojas.length === lojas.length) {
      onChange([])
    } else {
      onChange(lojas.map(l => l.id))
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <LoadingSpinner size="sm" />
        <span className="ml-2 text-sm text-gray-500">Carregando lojas...</span>
      </div>
    )
  }

  if (!lojas || lojas.length === 0) {
    return (
      <div className="text-sm text-gray-500 dark:text-gray-400 py-4 text-center">
        Nenhuma loja disponível para esta base
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Lojas Permitidas
        </label>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
          Selecione as lojas em que este usuário pode atuar
        </p>
      </div>

      {/* Barra de busca e ações */}
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Buscar loja..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        <button
          type="button"
          onClick={handleSelectAll}
          className="px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        >
          {selectedLojas.length === lojas.length ? 'Desmarcar todas' : 'Selecionar todas'}
        </button>
      </div>

      {/* Contador de seleção */}
      <div className="text-sm text-gray-600 dark:text-gray-400">
        {selectedLojas.length} de {lojas.length} loja{lojas.length > 1 ? 's' : ''} selecionada{selectedLojas.length !== 1 ? 's' : ''}
      </div>

      {/* Lista de lojas */}
      <div className="max-h-64 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg">
        {filteredLojas.map((loja) => (
          <div
            key={loja.id}
            onClick={() => handleToggleLoja(loja.id)}
            className={`
              flex items-center justify-between p-3 cursor-pointer transition-colors
              hover:bg-gray-50 dark:hover:bg-gray-700
              ${selectedLojas.includes(loja.id)
                ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500'
                : 'border-l-4 border-transparent'
              }
            `}
          >
            <div className="flex items-center gap-3">
              <BuildingStorefrontIcon className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {loja.nome}
                </p>
                {(loja.cidade || loja.uf) && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {[loja.cidade, loja.uf].filter(Boolean).join(' - ')}
                  </p>
                )}
              </div>
            </div>

            {selectedLojas.includes(loja.id) && (
              <CheckIcon className="h-5 w-5 text-blue-500" />
            )}
          </div>
        ))}
      </div>

      {filteredLojas.length === 0 && searchTerm && (
        <div className="text-sm text-gray-500 dark:text-gray-400 py-4 text-center">
          Nenhuma loja encontrada com "{searchTerm}"
        </div>
      )}
    </div>
  )
}