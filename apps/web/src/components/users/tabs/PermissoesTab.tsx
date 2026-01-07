import { UseFormRegister, useWatch, Control } from 'react-hook-form'
import { useState, useEffect } from 'react'
import { usersService } from '../../../services/users'
import { logger } from '../../../utils/logger'

interface Role {
  id: number
  name: string
  displayName: string // Backend usa camelCase
  description: string
  priority: number
}

interface PermissoesTabProps {
  register: UseFormRegister<any>
  control: Control<any>
}

export const PermissoesTab = ({ register, control }: PermissoesTabProps) => {
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadRoles = async () => {
      try {
        const response = await usersService.getRoles()
        // getRoles() já retorna response.data (array de roles)
        const rolesData = Array.isArray(response) ? response : (response.data || response || [])
        setRoles(rolesData)
      } catch (error) {
        logger.error('Erro ao carregar roles:', error)
        setRoles([])
      } finally {
        setLoading(false)
      }
    }
    loadRoles()
  }, [])

  return (
    <div className="space-y-3">
      <h3 className="text-base font-medium text-gray-900 dark:text-white mb-2">
        Permissões e Acesso
      </h3>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Cargo (Role) *
        </label>
        {loading ? (
          <select
            disabled
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-800 text-gray-500 animate-pulse"
          >
            <option>Carregando...</option>
          </select>
        ) : (
          <select
            {...register('role_id', { valueAsNumber: true })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white text-gray-900 dark:bg-gray-700 dark:text-white"
          >
            <option value="">-- Selecione um cargo --</option>
            {roles.map((role) => (
              <option key={role.id} value={role.id}>
                {role.displayName} - {role.description}
              </option>
            ))}
          </select>
        )}
        <p className="mt-1 text-xs text-gray-500">
          Define as permissões de acesso do usuário às páginas do sistema.
        </p>
      </div>
    </div>
  )
}
