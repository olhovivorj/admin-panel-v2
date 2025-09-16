import { useQuery } from '@tanstack/react-query'
import { systemService } from '@/services/system'
import { usersService } from '@/services/users'
import { basesService } from '@/services/bases'
import {
  UsersIcon,
  CircleStackIcon,
  ServerIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline'

export function Dashboard() {
  // Buscar estatísticas
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      // Buscar dados em paralelo
      const [users, bases, status] = await Promise.all([
        usersService.getUsers({ limit: 1 }), // Só para pegar o total
        basesService.getBases(),
        systemService.getSystemStatus(),
      ])

      return {
        totalUsers: users.total || users.data?.length || 0,
        activeUsers: users.data?.filter((u: any) => u.active).length || 0,
        totalBases: bases.length,
        activeBases: bases.filter((b: any) => b.ativo).length,
        systemStatus: status,
      }
    },
    refetchInterval: 60000, // Atualizar a cada minuto
  })

  // Cards de estatísticas
  const statsCards = [
    {
      title: 'Usuários Total',
      value: stats?.totalUsers || 0,
      icon: UsersIcon,
      color: 'bg-blue-500',
    },
    {
      title: 'Usuários Ativos',
      value: stats?.activeUsers || 0,
      icon: UsersIcon,
      color: 'bg-green-500',
    },
    {
      title: 'Bases Total',
      value: stats?.totalBases || 0,
      icon: CircleStackIcon,
      color: 'bg-purple-500',
    },
    {
      title: 'Bases Ativas',
      value: stats?.activeBases || 0,
      icon: CircleStackIcon,
      color: 'bg-indigo-500',
    },
  ]

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        Dashboard
      </h1>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statsCards.map((card) => (
          <div
            key={card.title}
            className="bg-white dark:bg-gray-800 rounded-lg shadow p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {card.title}
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                  {statsLoading ? '...' : card.value}
                </p>
              </div>
              <div className={`${card.color} p-3 rounded-lg`}>
                <card.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Status do Sistema */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Status do Sistema
        </h2>

        {statsLoading ? (
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Status Geral */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <ServerIcon className="w-5 h-5 text-gray-500" />
                <span className="text-gray-700 dark:text-gray-300">
                  Servidor
                </span>
              </div>
              <div className="flex items-center space-x-2">
                {stats?.systemStatus?.status === 'online' ? (
                  <>
                    <CheckCircleIcon className="w-5 h-5 text-green-500" />
                    <span className="text-green-500 font-medium">Online</span>
                  </>
                ) : (
                  <>
                    <XCircleIcon className="w-5 h-5 text-red-500" />
                    <span className="text-red-500 font-medium">Offline</span>
                  </>
                )}
              </div>
            </div>

            {/* Banco de Dados */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <CircleStackIcon className="w-5 h-5 text-gray-500" />
                <span className="text-gray-700 dark:text-gray-300">
                  Banco de Dados
                </span>
              </div>
              <div className="flex items-center space-x-2">
                {stats?.systemStatus?.database?.connected ? (
                  <>
                    <CheckCircleIcon className="w-5 h-5 text-green-500" />
                    <span className="text-green-500 font-medium">
                      Conectado
                    </span>
                  </>
                ) : (
                  <>
                    <XCircleIcon className="w-5 h-5 text-red-500" />
                    <span className="text-red-500 font-medium">
                      Desconectado
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Informações do Sistema */}
            {stats?.systemStatus && (
              <>
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">
                        Versão:
                      </span>
                      <span className="ml-2 text-gray-900 dark:text-white">
                        {stats.systemStatus.version || 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">
                        Ambiente:
                      </span>
                      <span className="ml-2 text-gray-900 dark:text-white">
                        {stats.systemStatus.environment || 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">
                        Memória:
                      </span>
                      <span className="ml-2 text-gray-900 dark:text-white">
                        {stats.systemStatus.memory?.percentage?.toFixed(1) || 0}%
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">
                        CPU:
                      </span>
                      <span className="ml-2 text-gray-900 dark:text-white">
                        {stats.systemStatus.cpu?.usage?.toFixed(1) || 0}%
                      </span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}