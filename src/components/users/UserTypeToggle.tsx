import { useSuperAdmin } from '@/hooks/useSuperAdmin'
import { ShieldCheckIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'

interface UserTypeToggleProps {
  currentType: 'NORMAL' | 'API'
  onChange: (newType: 'NORMAL' | 'API') => void
  disabled?: boolean
}

export function UserTypeToggle({ currentType, onChange, disabled = false }: UserTypeToggleProps) {
  const { canChangeUserType, isSuperAdmin } = useSuperAdmin()

  const canToggle = canChangeUserType && !disabled

  const getTypeLabel = (type: 'NORMAL' | 'API') => {
    return type === 'API' ? 'OPERADOR' : 'USUÁRIO'
  }

  const getTypeDescription = (type: 'NORMAL' | 'API') => {
    return type === 'API'
      ? 'Acesso via API para integrações'
      : 'Acesso via interface web'
  }

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        Tipo de Usuário
        {!canToggle && (
          <span className="text-xs text-amber-600 dark:text-amber-400 ml-1">
            (Apenas super admin pode alterar)
          </span>
        )}
      </label>

      {!isSuperAdmin && (
        <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-md">
          <div className="flex items-center">
            <ExclamationTriangleIcon className="h-5 w-5 text-amber-600 dark:text-amber-400 mr-2" />
            <span className="text-sm text-amber-800 dark:text-amber-200">
              Apenas o super administrador pode alterar o tipo de usuário
            </span>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <select
          value={currentType}
          onChange={(e) => canToggle && onChange(e.target.value as 'NORMAL' | 'API')}
          disabled={!canToggle}
          className={`
            w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm
            focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white
            ${!canToggle ? 'cursor-not-allowed opacity-50 bg-gray-100 dark:bg-gray-800' : ''}
          `}
        >
          <option value="NORMAL">👤 USUÁRIO - Acesso via interface web</option>
          <option value="API">🔗 OPERADOR - Acesso via API para integrações</option>
        </select>
      </div>

    </div>
  )
}