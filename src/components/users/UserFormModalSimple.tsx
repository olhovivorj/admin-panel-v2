import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Dialog } from '@headlessui/react'
import {
  XMarkIcon,
  EyeIcon,
  EyeSlashIcon,
  UserIcon,
  CogIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline'
import { useQueryClient, useMutation } from '@tanstack/react-query'
import InputMask from 'react-input-mask'
import { Button } from '@/components/common/Button'
import { TabPanel } from '@/components/common/TabPanel'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { UsuarioResponseDto, CreateUsuarioDto, UpdateUsuarioDto, usersService } from '@/services/users'
import { useBase } from '@/contexts/BaseContext'
import { PersonSelectorMobile } from './forms/PersonSelectorMobile'
import { PlanDropdown } from './forms/PlanDropdown'
import toast from 'react-hot-toast'

// Schema de validação
const userSchema = z.object({
  // Dados básicos
  name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres').optional(),
  telefone: z.string().optional(),

  // Configurações
  role: z.enum(['admin', 'user', 'operator', 'viewer']),
  active: z.boolean(),
  tipo_usuario: z.enum(['NORMAL', 'API']).optional(),

  // Vinculações
  ID_PESSOA: z.number().optional(),
  plano_id: z.number().optional(),
  baseId: z.number().optional(),

  // Observações
  obs: z.string().max(500).optional(),
})

type UserFormData = z.infer<typeof userSchema>

interface UserFormModalSimpleProps {
  user: UsuarioResponseDto | null
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function UserFormModalSimple({ user, isOpen, onClose, onSuccess }: UserFormModalSimpleProps) {
  const queryClient = useQueryClient()
  const { selectedBaseId } = useBase()
  const isEditing = !!user
  const [showPassword, setShowPassword] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors }
  } = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      active: true,
      role: 'user',
      tipo_usuario: 'NORMAL',
      baseId: selectedBaseId || 60,
    }
  })

  // Preencher dados ao editar
  useEffect(() => {
    if (user) {
      reset({
        name: user.name,
        email: user.email,
        telefone: user.telefone || '',
        obs: user.obs || '',
        role: user.role || 'user',
        active: user.active ?? true,
        tipo_usuario: user.tipo_usuario || 'NORMAL',
        ID_PESSOA: user.ID_PESSOA,
        plano_id: user.plano_id,
        baseId: user.baseId || selectedBaseId,
      })
    }
  }, [user, reset, selectedBaseId])

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: CreateUsuarioDto) => usersService.create(data),
    onSuccess: () => {
      toast.success('Usuário criado com sucesso!')
      queryClient.invalidateQueries({ queryKey: ['users'] })
      onSuccess()
      onClose()
      reset()
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao criar usuário')
    }
  })

  const updateMutation = useMutation({
    mutationFn: (data: UpdateUsuarioDto) => usersService.update(user!.id, data),
    onSuccess: () => {
      toast.success('Usuário atualizado com sucesso!')
      queryClient.invalidateQueries({ queryKey: ['users'] })
      onSuccess()
      onClose()
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao atualizar usuário')
    }
  })

  const onSubmit = (data: UserFormData) => {
    const payload: any = {
      ...data,
      baseId: selectedBaseId || user?.baseId || 60,
      ativo: data.active, // Backend espera 'ativo'
    }

    // Remover campo active
    delete payload.active

    if (isEditing) {
      updateMutation.mutate(payload)
    } else {
      createMutation.mutate(payload)
    }
  }

  // Abas do formulário
  const tabs = [
    { id: 'basic', label: 'Dados Básicos', icon: <UserIcon className="h-4 w-4" /> },
    { id: 'config', label: 'Configurações', icon: <CogIcon className="h-4 w-4" /> },
    { id: 'access', label: 'Acessos', icon: <ShieldCheckIcon className="h-4 w-4" /> },
  ]

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex justify-between items-center p-6 border-b">
            <Dialog.Title className="text-xl font-semibold text-gray-900">
              {isEditing ? 'Editar Usuário' : 'Novo Usuário'}
            </Dialog.Title>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Formulário com Abas */}
          <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto p-6">
            <TabPanel tabs={tabs}>
              {/* Aba 1: Dados Básicos */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome Completo *
                  </label>
                  <input
                    {...register('name')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Digite o nome completo"
                  />
                  {errors.name && (
                    <p className="text-sm text-red-600 mt-1">{errors.name.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <input
                    {...register('email')}
                    type="email"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="email@exemplo.com"
                  />
                  {errors.email && (
                    <p className="text-sm text-red-600 mt-1">{errors.email.message}</p>
                  )}
                </div>

                {!isEditing && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Senha *
                    </label>
                    <div className="relative">
                      <input
                        {...register('password')}
                        type={showPassword ? 'text' : 'password'}
                        className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="Mínimo 6 caracteres"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2 top-2.5 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="text-sm text-red-600 mt-1">{errors.password.message}</p>
                    )}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Telefone
                  </label>
                  <InputMask
                    mask="(99) 99999-9999"
                    maskChar="_"
                    {...register('telefone')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="(11) 99999-9999"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Observações
                  </label>
                  <textarea
                    {...register('obs')}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Observações sobre o usuário..."
                  />
                </div>
              </div>

              {/* Aba 2: Configurações */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo de Usuário
                  </label>
                  <select
                    {...register('tipo_usuario')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="NORMAL">👤 Usuário Normal</option>
                    <option value="API">🔗 Usuário API</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Perfil de Acesso
                  </label>
                  <select
                    {...register('role')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="viewer">👁️ Visualizador</option>
                    <option value="user">👤 Usuário</option>
                    <option value="operator">⚙️ Operador</option>
                    <option value="admin">👑 Administrador</option>
                  </select>
                </div>

                <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                  <input
                    type="checkbox"
                    {...register('active')}
                    className="h-4 w-4 text-blue-600 rounded"
                  />
                  <label className="text-sm font-medium text-gray-700">
                    Usuário Ativo
                  </label>
                </div>
              </div>

              {/* Aba 3: Acessos */}
              <div className="space-y-4">
                {/* Vinculação com Pessoa */}
                <PersonSelectorMobile
                  baseId={selectedBaseId || 60}
                  value={watch('ID_PESSOA')}
                  onChange={(personId) => setValue('ID_PESSOA', personId || undefined)}
                  required={false}
                  disabled={isEditing}
                  tipoUsuario={watch('tipo_usuario')}
                />

                {/* Plano de Acesso */}
                <PlanDropdown
                  value={watch('plano_id')}
                  onChange={(planId) => setValue('plano_id', planId)}
                  required={false}
                />
              </div>
            </TabPanel>
          </form>

          {/* Footer */}
          <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              onClick={handleSubmit(onSubmit)}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {createMutation.isPending || updateMutation.isPending ? (
                <LoadingSpinner size="small" />
              ) : isEditing ? (
                'Atualizar'
              ) : (
                'Criar Usuário'
              )}
            </Button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  )
}