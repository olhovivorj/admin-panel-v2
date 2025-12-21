import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { usersService } from '@/services/users'
import { ShieldCheckIcon } from '@heroicons/react/24/outline'
import { logger } from '@/utils/logger'

interface Role {
  id: number
  name: string
  display_name: string
  description: string | null
  priority: number
}

export function Roles() {
  const navigate = useNavigate()

  const { data: rolesData, isLoading } = useQuery({
    queryKey: ['roles'],
    queryFn: async () => {
      const response = await usersService.getRoles()
      logger.debug('Roles carregadas:', response)
      return response.data || []
    },
  })

  const roles: Role[] = rolesData || []

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Roles & Permissões
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Gerencie os cargos do sistema e suas permissões de acesso
        </p>
      </div>

      <div className="grid gap-4">
        {roles.map((role) => (
          <div
            key={role.id}
            className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900/50 p-6 hover:shadow-md dark:hover:shadow-gray-900/70 transition-shadow cursor-pointer border border-gray-200 dark:border-gray-700"
            onClick={() => navigate(`/roles/${role.id}/permissions`)}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-4">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <ShieldCheckIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {role.display_name}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                    {role.description || 'Sem descrição'}
                  </p>
                  <div className="flex items-center gap-4 mt-2">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      Código: <span className="font-mono text-gray-700 dark:text-gray-300">{role.name}</span>
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      Prioridade: <span className="font-semibold text-gray-700 dark:text-gray-300">{role.priority}</span>
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  navigate(`/roles/${role.id}/permissions`)
                }}
                className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
              >
                Gerenciar Permissões →
              </button>
            </div>
          </div>
        ))}
      </div>

      {roles.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <ShieldCheckIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">
            Nenhuma role encontrada
          </p>
        </div>
      )}
    </div>
  )
}
