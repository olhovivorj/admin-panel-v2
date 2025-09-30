import { UseFormRegister, useWatch, Control } from 'react-hook-form'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { usersService } from '../../../services/users'
import { logger } from '../../../utils/logger'

interface Role {
  id: number
  name: string
  display_name: string
  description: string
  priority: number
}

interface PermissoesTabProps {
  register: UseFormRegister<any>
  control: Control<any>
}

export const PermissoesTab = ({ register, control }: PermissoesTabProps) => {
  const navigate = useNavigate()
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  const selectedRoleId = useWatch({ control, name: 'role_id' })

  useEffect(() => {
    const loadRoles = async () => {
      try {
        setLoading(true)
        const response = await usersService.getRoles()
        setRoles(response.data || [])
      } catch (error) {
        logger.error('Erro ao carregar roles:', error)
        setRoles([])
      } finally {
        setLoading(false)
      }
    }
    loadRoles()
  }, [])

  const handleManagePermissions = () => {
    if (selectedRoleId) {
      navigate(`/roles/${selectedRoleId}/permissions`)
    } else {
      alert('Selecione um cargo primeiro')
    }
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
        Permissões e Acesso
      </h3>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Cargo (Role) *
        </label>
        {loading ? (
          <div className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-800 text-gray-500">
            Carregando roles...
          </div>
        ) : (
          <select
            {...register('role_id', { valueAsNumber: true })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white text-gray-900 dark:bg-gray-700 dark:text-white"
          >
            <option value="">-- Selecione um cargo --</option>
            {roles.map((role) => (
              <option key={role.id} value={role.id}>
                {role.display_name} - {role.description}
              </option>
            ))}
          </select>
        )}
        <p className="mt-1 text-xs text-gray-500">
          Define as permissões de acesso do usuário às páginas do sistema.
        </p>
      </div>

      {selectedRoleId && (
        <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-md">
          <button
            type="button"
            onClick={handleManagePermissions}
            className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium"
          >
            → Gerenciar permissões deste cargo
          </button>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
            Configure quais páginas este cargo pode acessar
          </p>
        </div>
      )}
    </div>
  )
}
