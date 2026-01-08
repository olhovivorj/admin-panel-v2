import { UseFormRegister, useWatch, Control, Controller } from 'react-hook-form'
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

  // Debug: observar valor atual do role_id no form
  const currentRoleId = useWatch({ control, name: 'role_id' })

  useEffect(() => {
    console.log('🔍 PermissoesTab - role_id atual:', currentRoleId)
  }, [currentRoleId])

  useEffect(() => {
    const loadRoles = async () => {
      try {
        const response = await usersService.getRoles()
        // getRoles() já retorna response.data (array de roles)
        const rolesData = Array.isArray(response) ? response : (response.data || response || [])
        console.log('🔍 PermissoesTab - roles carregadas:', rolesData)
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
          <Controller
            name="role_id"
            control={control}
            render={({ field }) => {
              // HTML select usa strings, então converter para string
              const selectValue = field.value !== undefined && field.value !== null
                ? String(field.value)
                : ''
              console.log('🔍 PermissoesTab render - field.value:', field.value, '→ selectValue:', selectValue)

              return (
                <select
                  value={selectValue}
                  onChange={(e) => {
                    const val = e.target.value
                    console.log('🔍 PermissoesTab - selecionado:', val)
                    field.onChange(val ? Number(val) : undefined)
                  }}
                  onBlur={field.onBlur}
                  name={field.name}
                  ref={field.ref}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white text-gray-900 dark:bg-gray-700 dark:text-white"
                >
                  <option value="">-- Selecione um cargo --</option>
                  {roles.map((role) => (
                    <option key={role.id} value={String(role.id)}>
                      {role.displayName} {role.description ? `- ${role.description}` : ''}
                    </option>
                  ))}
                </select>
              )
            }}
          />
        )}
        <p className="mt-1 text-xs text-gray-500">
          Define as permissões de acesso do usuário às páginas do sistema.
        </p>
      </div>
    </div>
  )
}
