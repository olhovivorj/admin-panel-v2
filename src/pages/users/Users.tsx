import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { usersService } from '@/services/users'
import { UsersList } from '@/components/users/UsersList'
import { UserFilters } from '@/components/users/UserFilters'
import { UserStats } from '@/components/users/UserStats'
import { UserFilters as IUserFilters } from '@/types'
import { useBase } from '@/contexts/BaseContext'
import { useAuth } from '@/contexts/AuthContext'
import { isAdmin as checkIsAdmin } from '@/utils/roleHelpers'

export function Users() {
  const [filters, setFilters] = useState<IUserFilters>({})
  const { selectedBaseId, selectedBaseCode, isLoading: baseLoading } = useBase()
  const { user } = useAuth()

  const isAdmin = checkIsAdmin(user)

  // IMPORTANTE: Hooks devem sempre ser chamados na mesma ordem
  // Buscar estatísticas - admin pode ver todas as bases
  const { data: stats } = useQuery({
    queryKey: ['user-stats', selectedBaseId],
    queryFn: () => {
      console.log('📊 [UserStats] Buscando estatísticas para base:', selectedBaseId)
      return usersService.getUserStats(selectedBaseId || undefined)
    },
    enabled: !!selectedBaseId && !baseLoading, // Sempre precisa de base selecionada
    refetchOnMount: 'always',
    refetchOnWindowFocus: false,
  })

  // SEGURANÇA: Aguardar base estar carregada antes de renderizar
  if (baseLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Carregando base...
          </h2>
        </div>
      </div>
    )
  }

  // SEGURANÇA: Garantir que tem base selecionada
  if (!selectedBaseId) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Base não selecionada
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Selecione uma base para gerenciar usuários
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Usuários
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Gerenciamento de Usuários
          </p>
        </div>
      </div>

      {stats && <UserStats stats={stats} />}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <UserFilters filters={filters} onFiltersChange={setFilters} />
        </div>
      </div>

      <UsersList filters={filters} selectedBaseId={selectedBaseId} />
    </div>
  )
}