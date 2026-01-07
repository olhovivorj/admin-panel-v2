import { UserStatsResponse } from '@/types'
import {
  UsersIcon,
  UserPlusIcon,
  ShieldCheckIcon,
  EyeIcon,
} from '@heroicons/react/24/outline'

interface UserStatsProps {
  stats: UserStatsResponse
}

export function UserStats({ stats }: UserStatsProps) {
  const statCards = [
    {
      title: 'Total de Usuários',
      value: Number(stats.total) || 0,
      icon: UsersIcon,
      color: 'bg-blue-500',
    },
    {
      title: 'Usuários Ativos',
      value: Number(stats.active) || 0,
      icon: ShieldCheckIcon,
      color: 'bg-green-500',
    },
    {
      title: 'Inativos',
      value: (stats as any).inactive || 0,
      icon: UserPlusIcon,
      color: 'bg-purple-500',
    },
    {
      title: 'Perfis',
      value: stats.byRole ? (typeof stats.byRole === 'object' ? Object.keys(stats.byRole).length : 1) : 0,
      icon: EyeIcon,
      color: 'bg-gray-500',
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {statCards.map((stat, index) => (
        <div
          key={index}
          className="bg-white dark:bg-gray-800 rounded-lg shadow p-6"
        >
          <div className="flex items-center">
            <div className={`p-3 rounded-lg ${stat.color} bg-opacity-10`}>
              <stat.icon className={`h-6 w-6 ${stat.color.replace('bg-', 'text-')}`} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                {stat.title}
              </p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {stat.value}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}