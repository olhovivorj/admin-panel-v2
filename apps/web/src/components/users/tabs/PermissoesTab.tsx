import { UseFormRegister, useWatch, Control, Controller, UseFormSetValue } from 'react-hook-form'
import { useState, useEffect } from 'react'
import { usersService } from '../../../services/users'
import { logger } from '../../../utils/logger'
import api from '@/services/api'

interface Role {
  id: number
  name: string
  displayName: string // Backend usa camelCase
  description: string
  priority: number
}

interface Plan {
  id: number
  name: string
  displayName: string
  description?: string
}

interface PermissoesTabProps {
  register: UseFormRegister<any>
  control: Control<any>
  watch: (name: string) => any
  setValue: UseFormSetValue<any>
}

export const PermissoesTab = ({ register, control, watch, setValue }: PermissoesTabProps) => {
  const [roles, setRoles] = useState<Role[]>([])
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingPlans, setLoadingPlans] = useState(true)

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

  // Carregar planos
  useEffect(() => {
    const loadPlans = async () => {
      try {
        const response = await api.get('/plans')
        const plansData = response.data?.items || response.data || []
        console.log('🔍 PermissoesTab - planos carregados:', plansData)
        setPlans(plansData)
      } catch (error) {
        logger.error('Erro ao carregar planos:', error)
        setPlans([])
      } finally {
        setLoadingPlans(false)
      }
    }
    loadPlans()
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

      {/* Seletor de Plano de Acesso */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Plano de Acesso
        </label>
        {loadingPlans ? (
          <select
            disabled
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-800 text-gray-500 animate-pulse"
          >
            <option>Carregando...</option>
          </select>
        ) : (
          <Controller
            name="plano_id"
            control={control}
            render={({ field }) => {
              const selectValue = field.value !== undefined && field.value !== null
                ? String(field.value)
                : ''
              return (
                <select
                  value={selectValue}
                  onChange={(e) => {
                    const val = e.target.value
                    field.onChange(val ? Number(val) : undefined)
                  }}
                  onBlur={field.onBlur}
                  name={field.name}
                  ref={field.ref}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white text-gray-900 dark:bg-gray-700 dark:text-white"
                >
                  <option value="">-- Selecione um plano --</option>
                  {plans.map((plan) => (
                    <option key={plan.id} value={String(plan.id)}>
                      {plan.displayName || plan.name}
                    </option>
                  ))}
                </select>
              )
            }}
          />
        )}
        <p className="mt-1 text-xs text-gray-500">
          Define o nível de acesso e funcionalidades disponíveis.
        </p>
      </div>

      {/* Observações */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Observações
        </label>
        <textarea
          {...register('obs')}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white text-gray-900 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Observações sobre o usuário..."
        />
        <p className="mt-1 text-xs text-gray-500">
          Notas internas sobre este usuário (não visíveis para o usuário).
        </p>
      </div>
    </div>
  )
}
