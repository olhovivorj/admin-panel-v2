import { NavLink } from 'react-router-dom'
import {
  HomeIcon,
  UsersIcon,
  CircleStackIcon,
  ShieldCheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline'
import { cn } from '@/utils/cn'
import { useSuperAdmin } from '@/hooks/useSuperAdmin'
import { useSidebar } from '@/contexts/SidebarContext'

const navigationItems = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'Usuários', href: '/users', icon: UsersIcon },
  { name: 'Roles & Permissões', href: '/roles', icon: ShieldCheckIcon, adminOnly: true },
  { name: 'Bases de Dados', href: '/bases', icon: CircleStackIcon, adminOnly: true },
]

export function Sidebar() {
  const { isAdmin } = useSuperAdmin()
  const { isCollapsed, toggleSidebar } = useSidebar()

  // Filtrar navegação baseado em permissões
  const navigation = navigationItems.filter(item => {
    if (item.adminOnly && !isAdmin) {
      return false
    }
    return true
  })

  return (
    <nav
      className={cn(
        'bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-all duration-300',
        isCollapsed ? 'w-16' : 'w-64'
      )}
    >
      <div className="h-16 flex items-center justify-center border-b border-gray-200 dark:border-gray-700 relative">
        {!isCollapsed && (
          <img src="/assets/invistto-logo.png" alt="INVISTTO" className="h-10" />
        )}
        {isCollapsed && (
          <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">I</span>
        )}
        <button
          onClick={toggleSidebar}
          className="absolute -right-3 top-1/2 -translate-y-1/2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full p-1 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm"
          title={isCollapsed ? 'Expandir sidebar' : 'Recolher sidebar'}
        >
          {isCollapsed ? (
            <ChevronRightIcon className="h-4 w-4 text-gray-600 dark:text-gray-400" />
          ) : (
            <ChevronLeftIcon className="h-4 w-4 text-gray-600 dark:text-gray-400" />
          )}
        </button>
      </div>

      <div className="p-4">
        <ul className="space-y-2">
          {navigation.map((item) => (
            <li key={item.name}>
              <NavLink
                to={item.href}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors relative group',
                    isActive
                      ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
                      : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700',
                    isCollapsed && 'justify-center'
                  )
                }
                title={isCollapsed ? item.name : ''}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                {!isCollapsed && <span>{item.name}</span>}
                {item.highlight && (
                  <span className="absolute top-1 right-1 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                  </span>
                )}
                {isCollapsed && (
                  <span className="absolute left-full ml-2 px-2 py-1 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                    {item.name}
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