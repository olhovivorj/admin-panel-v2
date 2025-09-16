import { useState } from 'react'
import { MagnifyingGlassIcon, FunnelIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { UserFilters as IUserFilters } from '@/types'
import { Button } from '@/components/common/Button'

interface UserFiltersProps {
  filters: IUserFilters
  onFiltersChange: (filters: IUserFilters) => void
}

export function UserFilters({ filters, onFiltersChange }: UserFiltersProps) {
  const [search, setSearch] = useState(filters.search || '')
  const [showAdvanced, setShowAdvanced] = useState(false)

  const handleSearchChange = (value: string) => {
    setSearch(value)
    onFiltersChange({ ...filters, search: value })
  }

  const handleFilterChange = (key: keyof IUserFilters, value: any) => {
    onFiltersChange({ ...filters, [key]: value })
  }

  const clearFilters = () => {
    setSearch('')
    setShowAdvanced(false)
    onFiltersChange({})
  }

  // Contar filtros ativos
  const activeFiltersCount = Object.keys(filters).filter(key => 
    filters[key as keyof IUserFilters] !== undefined && 
    filters[key as keyof IUserFilters] !== ''
  ).length

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-4">
        <div className="flex-1 relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Buscar por nome ou email..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="relative">
          <Button
            variant="outline"
            icon={FunnelIcon}
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={showAdvanced ? 'ring-2 ring-blue-500' : ''}
          >
            Filtros
            {activeFiltersCount > 0 && (
              <span className="ml-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-blue-600 rounded-full">
                {activeFiltersCount}
              </span>
            )}
          </Button>
        </div>
      </div>

      {showAdvanced && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Tipo de Usuário
            </label>
            <select
              value={filters.tipo_usuario || ''}
              onChange={(e) => handleFilterChange('tipo_usuario', e.target.value || undefined)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Todos</option>
              <option value="NORMAL">👤 Usuário Normal</option>
              <option value="API">🔗 Usuário API</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Perfil
            </label>
            <select
              value={filters.role || ''}
              onChange={(e) => handleFilterChange('role', e.target.value || undefined)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Todos</option>
              <option value="admin">👑 Administrador</option>
              <option value="user">👤 Usuário</option>
              <option value="viewer">👁️ Visualizador</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Status
            </label>
            <select
              value={filters.isActive === undefined ? '' : filters.isActive.toString()}
              onChange={(e) => handleFilterChange('isActive', e.target.value === '' ? undefined : e.target.value === 'true')}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Todos</option>
              <option value="true">✅ Ativos</option>
              <option value="false">❌ Inativos</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Ordenar por
            </label>
            <select
              value={filters.orderBy || 'createdAt'}
              onChange={(e) => handleFilterChange('orderBy', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="name">Nome (A-Z)</option>
              <option value="-name">Nome (Z-A)</option>
              <option value="email">Email (A-Z)</option>
              <option value="-email">Email (Z-A)</option>
              <option value="createdAt">Mais antigos</option>
              <option value="-createdAt">Mais recentes</option>
              <option value="lastLogin">Último acesso (antigo)</option>
              <option value="-lastLogin">Último acesso (recente)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Com acesso há
            </label>
            <select
              value={filters.lastLoginPeriod || ''}
              onChange={(e) => handleFilterChange('lastLoginPeriod', e.target.value || undefined)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Qualquer período</option>
              <option value="7">Últimos 7 dias</option>
              <option value="30">Últimos 30 dias</option>
              <option value="90">Últimos 90 dias</option>
              <option value="never">Nunca acessou</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Limite de API
            </label>
            <select
              value={filters.hasApiLimit || ''}
              onChange={(e) => handleFilterChange('hasApiLimit', e.target.value || undefined)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Todos</option>
              <option value="true">Com limite configurado</option>
              <option value="false">Sem limite</option>
            </select>
          </div>

          <div className="md:col-span-3 flex items-center justify-between">
            <div className="flex flex-wrap gap-2">
              {activeFiltersCount > 0 && (
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {activeFiltersCount} filtro{activeFiltersCount !== 1 ? 's' : ''} ativo{activeFiltersCount !== 1 ? 's' : ''}:
                </span>
              )}
              {filters.tipo_usuario && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                  Tipo: {filters.tipo_usuario === 'API' ? '🔗 API' : '👤 Normal'}
                  <button
                    onClick={() => handleFilterChange('tipo_usuario', undefined)}
                    className="ml-1 hover:text-blue-600"
                  >
                    <XMarkIcon className="h-3 w-3" />
                  </button>
                </span>
              )}
              {filters.role && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                  Perfil: {filters.role}
                  <button
                    onClick={() => handleFilterChange('role', undefined)}
                    className="ml-1 hover:text-green-600"
                  >
                    <XMarkIcon className="h-3 w-3" />
                  </button>
                </span>
              )}
              {filters.isActive !== undefined && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                  Status: {filters.isActive ? 'Ativo' : 'Inativo'}
                  <button
                    onClick={() => handleFilterChange('isActive', undefined)}
                    className="ml-1 hover:text-purple-600"
                  >
                    <XMarkIcon className="h-3 w-3" />
                  </button>
                </span>
              )}
            </div>
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              Limpar Todos
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}