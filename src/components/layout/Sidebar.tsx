import { NavLink } from 'react-router-dom'
import {
  HomeIcon,
  UsersIcon,
  CircleStackIcon,
} from '@heroicons/react/24/outline'
import { cn } from '@/utils/cn'
import { useSuperAdmin } from '@/hooks/useSuperAdmin'

const navigationItems = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'Usuários', href: '/users', icon: UsersIcon },
  { name: 'Bases de Dados', href: '/bases', icon: CircleStackIcon, adminOnly: true },
]

export function Sidebar() {
  const { isSuperAdmin } = useSuperAdmin()

  // Filtrar navegação baseado em permissões
  const navigation = navigationItems.filter(item => {
    if (item.adminOnly && !isSuperAdmin) {
      return false
    }
    return true
  })

  return (
    <nav className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
      <div className="h-16 flex items-center justify-center border-b border-gray-200 dark:border-gray-700">
        <img src="/assets/invistto-logo.png" alt="INVISTTO" className="h-10" />
      </div>

      <div className="p-4">
        <ul className="space-y-2">
          {navigation.map((item) => (
            <li key={item.name}>
              <NavLink
                to={item.href}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors relative',
                    isActive
                      ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
                      : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700',
                  )
                }
              >
                <item.icon className="h-5 w-5" />
                {item.name}
                {item.highlight && (
                  <span className="absolute top-1 right-1 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                  </span>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  )
}