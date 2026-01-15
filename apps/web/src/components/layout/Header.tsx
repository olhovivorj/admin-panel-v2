import { useAuth } from '@invistto/auth-react'
import { BaseSelector } from '@/components/BaseSelector'
import { EnvironmentSelector } from '@/components/EnvironmentSelector'
import { SimpleThemeToggle } from '@/components/ui/ThemeToggle'
import { ArrowRightOnRectangleIcon, UserCircleIcon } from '@heroicons/react/24/outline'

export function Header() {
  const { user, logout } = useAuth()

  // Função para limpar cache e fazer logout
  const handleLogout = () => {
    localStorage.clear()
    logout()
  }

  return (
    <header className="h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-4 sm:px-6 relative z-40">
      <div className="h-full flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <BaseSelector />
          <EnvironmentSelector />
        </div>

        <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
          {/* Toggle de tema */}
          <SimpleThemeToggle />

          {/* Perfil do usuário */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-2">
              <UserCircleIcon className="h-8 w-8 text-gray-400 dark:text-gray-500" />
              <div className="text-right hidden sm:block">
                <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{user?.name}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">{user?.email}</div>
              </div>
            </div>
          </div>

          {/* Botão de logout */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-2 sm:px-3 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            title="Fazer logout e limpar cache"
          >
            <ArrowRightOnRectangleIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Sair</span>
          </button>
        </div>
      </div>
    </header>
  )
}