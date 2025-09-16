import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { BuildingStorefrontIcon, CheckIcon } from '@heroicons/react/24/outline'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import api from '@/services/api'

interface Loja {
  id: number
  nome: string
  razaoSocial?: string
  cidade?: string
  uf?: string
}

interface LojaFilterSelectorProps {
  baseId: number | null
  onChange: (lojasIds: number[] | undefined) => void
  className?: string
}

export function LojaFilterSelector({ baseId, onChange, className = '' }: LojaFilterSelectorProps) {
  const [selectedLojas, setSelectedLojas] = useState<number[]>([])
  const [selectAll, setSelectAll] = useState(true)

  // Buscar lojas disponíveis
  const { data: lojas = [], isLoading } = useQuery({
    queryKey: ['lojas-disponiveis', baseId],
    queryFn: async () => {
      if (!baseId) {
        return []
      }

      console.log('🏪 Buscando lojas para base:', baseId)

      // Usar endpoint de empresas
      const response = await api.get(`/empresas/${baseId}/selecao`)
      console.log('✅ Lojas carregadas:', response.data)

      // Mapear para o formato esperado
      return response.data.data?.map((emp: any) => ({
        id: emp.ID_EMPRESA,
        nome: emp.NOME_REDUZIDO || emp.nome,
        razaoSocial: emp.razaoSocial,
        cidade: emp.cidade,
        uf: emp.uf,
      })) || []
    },
    enabled: !!baseId,
  })

  // Quando mudar seleção
  useEffect(() => {
    if (selectAll) {
      onChange(undefined) // undefined = todas as lojas
    } else {
      onChange(selectedLojas.length > 0 ? selectedLojas : undefined)
    }
  }, [selectedLojas, selectAll, onChange])

  const handleSelectAll = () => {
    setSelectAll(true)
    setSelectedLojas([])
  }

  const handleSelectSpecific = () => {
    setSelectAll(false)
  }

  const toggleLoja = (lojaId: number) => {
    setSelectedLojas(prev => {
      if (prev.includes(lojaId)) {
        return prev.filter(id => id !== lojaId)
      } else {
        return [...prev, lojaId]
      }
    })
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          <BuildingStorefrontIcon className="h-4 w-4 inline mr-1" />
          Filtrar Usuários por Loja
        </label>
      </div>

      {/* Opções de seleção */}
      <div className="space-y-2">
        <label className="flex items-center cursor-pointer">
          <input
            type="radio"
            checked={selectAll}
            onChange={handleSelectAll}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
          />
          <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
            Mostrar usuários de todas as lojas
          </span>
        </label>

        <label className="flex items-center cursor-pointer">
          <input
            type="radio"
            checked={!selectAll}
            onChange={handleSelectSpecific}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
          />
          <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
            Filtrar por lojas específicas
          </span>
        </label>
      </div>

      {/* Lista de lojas (só mostra se não for "todas") */}
      {!selectAll && (
        <div className="mt-3">
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <LoadingSpinner size="sm" />
              <span className="ml-2 text-sm text-gray-500">Carregando lojas...</span>
            </div>
          ) : lojas.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400 italic">
              Nenhuma loja encontrada para esta base
            </p>
          ) : (
            <div className="max-h-48 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-lg p-2">
              <div className="space-y-1">
                {lojas.map(loja => (
                  <label
                    key={loja.id}
                    className="flex items-center p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedLojas.includes(loja.id)}
                      onChange={() => toggleLoja(loja.id)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-3 flex-1">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {loja.nome}
                      </div>
                      {loja.cidade && (
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {loja.cidade}{loja.uf ? ` - ${loja.uf}` : ''}
                        </div>
                      )}
                    </span>
                    {selectedLojas.includes(loja.id) && (
                      <CheckIcon className="h-4 w-4 text-blue-600" />
                    )}
                  </label>
                ))}
              </div>
            </div>
          )}

          {selectedLojas.length > 0 && (
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              {selectedLojas.length} loja{selectedLojas.length > 1 ? 's' : ''} selecionada{selectedLojas.length > 1 ? 's' : ''}
            </p>
          )}
        </div>
      )}
    </div>
  )
}