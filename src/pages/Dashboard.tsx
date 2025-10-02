import { useQuery } from '@tanstack/react-query'
import { usersService } from '@/services/users'
import { basesService } from '@/services/bases'
import {
  UsersIcon,
  CircleStackIcon,
} from '@heroicons/react/24/outline'

export function Dashboard() {
  // Buscar estatísticas
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      // Buscar dados em paralelo
      const [usersResponse, bases] = await Promise.all([
        usersService.getUsers({ page: 1, limit: 100 }), // Buscar primeiros 100 usuários para estatísticas
        basesService.getBases(),
      ])

      // Backend retorna: { users: [...], total, page, limit, totalPages }
      const users = usersResponse.data?.users || []
      const totalUsers = usersResponse.data?.total || 0

      return {
        totalUsers,
        activeUsers: users.filter((u: any) => u.active || u.ativo).length || 0,
        totalBases: bases.length,
        activeBases: bases.filter((b: any) => b.ativo).length,
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

    </div>
  )
}