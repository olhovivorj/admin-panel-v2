import { useState } from 'react'
import { UseFormRegister, FieldErrors } from 'react-hook-form'
import { UserIcon, EnvelopeIcon, LockClosedIcon, ShieldCheckIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline'
import { useSuperAdmin } from '@/hooks/useSuperAdmin'

interface CreateUserFormData {
  name: string
  email: string
  password: string
  role: 'admin' | 'user' | 'operator'
  tipo_usuario: 'NORMAL' | 'API'
  sysUserId?: number
  telefone?: string
}

interface UserBasicFormProps {
  register: UseFormRegister<CreateUserFormData>
  errors: FieldErrors<CreateUserFormData>
  isEditing?: boolean
  currentUserData?: any
}

const roles = [
  { value: 'admin', label: 'Administrador', description: 'Acesso total ao sistema' },
  { value: 'operator', label: 'Operador', description: 'Acesso às operações principais' },
  { value: 'user', label: 'Usuário', description: 'Acesso limitado às funcionalidades básicas' },
] as const

export function UserBasicForm({ register, errors, isEditing = false, currentUserData }: UserBasicFormProps) {
  const { isSuperAdmin, canCreateAdmins, canEditProtectedFields } = useSuperAdmin()
  const [showPassword, setShowPassword] = useState(false)

  // Função para formatar telefone brasileiro
  const formatPhoneBR = (value: string) => {
    if (!value) {
      return value
    }

    // Remove todos os caracteres não numéricos
    const phoneNumber = value.replace(/[^\d]/g, '')

    // Aplica a formatação baseada no tamanho
    if (phoneNumber.length <= 2) {
      return `(${phoneNumber}`
    } else if (phoneNumber.length <= 6) {
      return `(${phoneNumber.slice(0, 2)}) ${phoneNumber.slice(2)}`
    } else if (phoneNumber.length <= 10) {
      return `(${phoneNumber.slice(0, 2)}) ${phoneNumber.slice(2, 6)}-${phoneNumber.slice(6)}`
    } else {
      // Celular com 9 dígitos
      return `(${phoneNumber.slice(0, 2)}) ${phoneNumber.slice(2, 7)}-${phoneNumber.slice(7, 11)}`
    }
  }

  // Filtrar roles baseado nas permissões
  const availableRoles = roles.filter(role => {
    if (role.value === 'admin') {
      return canCreateAdmins // Apenas super admin pode criar/editar admins
    }
    return true
  })

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
        Informações Básicas
      </h3>

      {/* Nome */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Nome Completo *
        </label>
        <div className="relative">
          <UserIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
          <input
            type="text"
            {...register('name')}
            className={`
              w-full pl-10 pr-3 py-2 border rounded-md
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
              dark:bg-gray-700 dark:border-gray-600 dark:text-white
              ${errors.name
      ? 'border-red-300 focus:ring-red-500'
      : 'border-gray-300 dark:border-gray-600'
    }
            `}
            placeholder="Digite o nome completo"
          />
        </div>
        {errors.name && (
          <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
        )}
      </div>

      {/* Email */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Email * {!canEditProtectedFields && isEditing && (
            <span className="text-xs text-amber-600 dark:text-amber-400">
              (Apenas super admin pode editar)
            </span>
          )}
        </label>
        <div className="relative">
          <EnvelopeIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
          <input
            type="email"
            {...register('email', {
              setValueAs: (value: string) => value?.trim()?.toLowerCase() || '',
            })}
            disabled={!canEditProtectedFields && isEditing}
            className={`
              w-full pl-10 pr-3 py-2 border rounded-md
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
              dark:bg-gray-700 dark:border-gray-600 dark:text-white
              ${!canEditProtectedFields && isEditing ? 'bg-gray-100 dark:bg-gray-800 cursor-not-allowed' : ''}
              ${errors.email
      ? 'border-red-300 focus:ring-red-500'
      : 'border-gray-300 dark:border-gray-600'
    }
            `}
            placeholder="exemplo@empresa.com"
          />
        </div>
        {errors.email && (
          <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
        )}
      </div>

      {/* Telefone */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Telefone
        </label>
        <div className="relative">
          <UserIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
          <input
            type="tel"
            {...register('telefone', {
              onChange: (e) => {
                e.target.value = formatPhoneBR(e.target.value)
              },
            })}
            className={`
              w-full pl-10 pr-3 py-2 border rounded-md
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
              dark:bg-gray-700 dark:border-gray-600 dark:text-white
              ${errors.telefone
      ? 'border-red-300 focus:ring-red-500'
      : 'border-gray-300 dark:border-gray-600'
    }
            `}
            placeholder="(11) 99999-9999"
            maxLength={15}
          />
        </div>
        {errors.telefone && (
          <p className="mt-1 text-sm text-red-600">{errors.telefone.message}</p>
        )}
      </div>

      {/* Senha */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Senha *
        </label>
        <div className="relative">
          <LockClosedIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
          <input
            type={showPassword ? 'text' : 'password'}
            {...register('password')}
            autoComplete="new-password"
            className={`
              w-full pl-10 pr-12 py-2 border rounded-md
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
              dark:bg-gray-700 dark:border-gray-600 dark:text-white
              ${errors.password
      ? 'border-red-300 focus:ring-red-500'
      : 'border-gray-300 dark:border-gray-600'
    }
            `}
            placeholder="Mínimo 6 caracteres"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            {showPassword ? (
              <EyeSlashIcon className="h-5 w-5" />
            ) : (
              <EyeIcon className="h-5 w-5" />
            )}
          </button>
        </div>
        {errors.password && (
          <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
        )}
      </div>

      {/* Tipo de Usuário */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Tipo de Usuário *
        </label>

        <div className="grid grid-cols-2 gap-4">
          <label className="flex items-start space-x-3 cursor-pointer p-3 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700">
            <input
              type="radio"
              value="NORMAL"
              {...register('tipo_usuario')}
              className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
            />
            <div className="flex-1">
              <div className="text-sm font-medium text-gray-900 dark:text-white">
                👤 Usuário Normal
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Acesso via interface web, vinculado ao ERP
              </div>
            </div>
          </label>

          <label className="flex items-start space-x-3 cursor-pointer p-3 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700">
            <input
              type="radio"
              value="API"
              {...register('tipo_usuario')}
              className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
            />
            <div className="flex-1">
              <div className="text-sm font-medium text-gray-900 dark:text-white">
                🔗 Usuário API
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Acesso via API, para integrações
              </div>
            </div>
          </label>
        </div>
        {errors.tipo_usuario && (
          <p className="mt-1 text-sm text-red-600">{errors.tipo_usuario.message}</p>
        )}
      </div>

      {/* Perfil/Role */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Perfil de Acesso * {!canEditProtectedFields && isEditing && (
            <span className="text-xs text-amber-600 dark:text-amber-400">
              (Apenas super admin pode editar)
            </span>
          )}
        </label>

        {isSuperAdmin && (
          <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
            <div className="flex items-center">
              <ShieldCheckIcon className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-2" />
              <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                Super Administrador
              </span>
            </div>
            <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
              Você pode criar administradores e alterar qualquer campo de usuário
            </p>
          </div>
        )}

        <div className="space-y-2">
          {availableRoles.map((role) => (
            <label key={role.value} className="flex items-start space-x-3 cursor-pointer">
              <input
                type="radio"
                value={role.value}
                {...register('role')}
                disabled={!canEditProtectedFields && isEditing}
                className={`
                  mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300
                  ${!canEditProtectedFields && isEditing ? 'cursor-not-allowed opacity-50' : ''}
                `}
              />
              <div className="flex-1">
                <div className={`text-sm font-medium ${!canEditProtectedFields && isEditing ? 'text-gray-400' : 'text-gray-900 dark:text-white'}`}>
                  {role.label}
                  {role.value === 'admin' && !canCreateAdmins && (
                    <span className="ml-2 text-xs text-red-600 dark:text-red-400">
                      (Requer super admin)
                    </span>
                  )}
                </div>
                <div className={`text-xs ${!canEditProtectedFields && isEditing ? 'text-gray-400' : 'text-gray-500 dark:text-gray-400'}`}>
                  {role.description}
                </div>
              </div>
            </label>
          ))}
        </div>
        {errors.role && (
          <p className="mt-1 text-sm text-red-600">{errors.role.message}</p>
        )}
      </div>
    </div>
  )
}