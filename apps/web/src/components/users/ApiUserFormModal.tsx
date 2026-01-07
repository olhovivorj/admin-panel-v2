import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Dialog } from '@headlessui/react'
import { XMarkIcon, EyeIcon, EyeSlashIcon, KeyIcon, ArrowPathIcon } from '@heroicons/react/24/outline'
import { useQueryClient, useMutation } from '@tanstack/react-query'
import InputMask from 'react-input-mask'
import { Button } from '@/components/common/Button'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { UsuarioResponseDto, CreateUsuarioDto, UpdateUsuarioDto, usersService } from '@/services/users'
import { useBase } from '@/contexts/BaseContext'
import { EndpointRateLimitConfig } from './EndpointRateLimitConfig'
import { ApiCredentialsDisplay } from './ApiCredentialsDisplay'
import { useSuperAdmin } from '@/hooks/useSuperAdmin'
import toast from 'react-hot-toast'
import { logger } from '@/utils/logger'

// Schema de validação específico para usuários API
const apiUserSchema = z.object({
  name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  email: z.string().email('Email inválido').transform(val => val.toLowerCase()),
  telefone: z.string().optional(),
  obs: z.string().optional(),
  role: z.enum(['admin', 'user', 'operator', 'viewer']).default('operator'),
  active: z.boolean().default(true),
  rate_limit_per_hour: z.number().min(1).max(100000).default(1000),
  permissions: z.any().optional(), // Objeto com endpoints como chaves
})

type ApiUserFormData = z.infer<typeof apiUserSchema>

interface ApiUserFormModalProps {
  user: UsuarioResponseDto | null
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function ApiUserFormModal({ user, isOpen, onClose, onSuccess }: ApiUserFormModalProps) {
  const queryClient = useQueryClient()
  const { selectedBaseId } = useBase()
  const { isSuperAdmin } = useSuperAdmin()
  const [showPassword, setShowPassword] = useState(false)
  const [checkingEmail, setCheckingEmail] = useState(false)
  const [generatedCredentials, setGeneratedCredentials] = useState<{
    api_key: string
    api_secret: string
  } | null>(null)
  
  const isEditing = !!user

  logger.info('🔗 ApiUserFormModal - Renderizando', 'API_FORM', {
    isEditing,
    userId: user?.id,
    userEmail: user?.email,
  })

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    setError,
    formState: { errors },
  } = useForm<ApiUserFormData>({
    resolver: zodResolver(apiUserSchema),
    defaultValues: {
      role: 'operator',
      active: true,
      rate_limit_per_hour: 1000,
    }
  })

  // Resetar formulário quando abrir/fechar ou mudar usuário
  useEffect(() => {
    if (isOpen) {
      if (user) {
        // Editando usuário existente
        reset({
          name: user.name || '',
          email: user.email || '',
          telefone: user.telefone || '',
          obs: user.obs || '',
          role: user.role as any || 'operator',
          active: user.ativo ?? true,
          rate_limit_per_hour: user.rate_limit_per_hour || 1000,
          permissions: user.permissions || {},
        })
      } else {
        // Novo usuário
        reset({
          name: '',
          email: '',
          telefone: '',
          obs: '',
          role: 'operator',
          active: true,
          rate_limit_per_hour: 1000,
          permissions: {},
        })
      }
      setGeneratedCredentials(null)
    }
  }, [isOpen, user, reset])

  // Mutation para criar usuário
  const createMutation = useMutation({
    mutationFn: async (data: CreateUsuarioDto) => {
      const response = await usersService.createUser(data)
      return response
    },
    onSuccess: (response) => {
      logger.info('✅ Usuário API criado com sucesso', 'API_FORM', response)
      
      // Guardar credenciais geradas
      // A resposta vem como { id, email, api_key, api_secret, ... }
      if (response?.api_key && response?.api_secret) {
        setGeneratedCredentials({
          api_key: response.api_key,
          api_secret: response.api_secret,
        })
        logger.info('🔑 Credenciais API geradas', 'API_FORM', {
          api_key: response.api_key,
          api_secret: response.api_secret.substring(0, 10) + '...'
        })
      } else {
        logger.warn('⚠️ Credenciais não retornadas na resposta', 'API_FORM', response)
      }
      
      toast.success('Usuário API criado com sucesso!')
      queryClient.invalidateQueries({ queryKey: ['users'] })
      queryClient.invalidateQueries({ queryKey: ['user-stats'] })
      
      // Se não tem credenciais para mostrar, fechar o modal
      if (!response?.api_key || !response?.api_secret) {
        onSuccess()
        onClose()
      } else {
        // Com credenciais, manter aberto para o usuário copiar
        onSuccess()
      }
    },
    onError: (error: any) => {
      logger.error('❌ Erro ao criar usuário API:', 'API_FORM', error)
      const message = error.response?.data?.message || 'Erro ao criar usuário'
      toast.error(message)
    },
  })

  // Mutation para atualizar usuário
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: UpdateUsuarioDto }) => {
      return await usersService.updateUser(id, data)
    },
    onSuccess: () => {
      logger.info('✅ Usuário API atualizado com sucesso', 'API_FORM')
      toast.success('Usuário API atualizado com sucesso!')
      queryClient.invalidateQueries({ queryKey: ['users'] })
      queryClient.invalidateQueries({ queryKey: ['user-stats'] })
      onSuccess()
      onClose()
    },
    onError: (error: any) => {
      logger.error('❌ Erro ao atualizar usuário API:', 'API_FORM', error)
      const message = error.response?.data?.message || 'Erro ao atualizar usuário'
      toast.error(message)
    },
  })

  const onSubmit = async (data: ApiUserFormData) => {
    logger.info('📤 Submetendo formulário API', 'API_FORM', { isEditing, data })

    // Validação de email único
    if (!isEditing || (isEditing && data.email !== user?.email)) {
      setCheckingEmail(true)
      try {
        const isAvailable = await usersService.checkEmailAvailability(
          data.email,
          isEditing && user ? user.id : undefined
        )
        if (!isAvailable) {
          setError('email', {
            type: 'manual',
            message: 'Este email já está em uso'
          })
          toast.error('⚠️ Este email já está em uso')
          return
        }
      } catch (error) {
        logger.error('Erro ao verificar email:', error)
        // Em caso de erro, continuar com o fluxo
      } finally {
        setCheckingEmail(false)
      }
    }

    const payload: any = {
      name: data.name,
      email: data.email,
      telefone: data.telefone,
      obs: data.obs,
      role: data.role,
      active: data.active,
      tipo_usuario: 'API', // Sempre API
      baseId: selectedBaseId,
      rate_limit_per_hour: data.rate_limit_per_hour,
      permissions: data.permissions,
    }

    if (isEditing && user) {
      updateMutation.mutate({ id: user.id, data: payload })
    } else {
      createMutation.mutate(payload)
    }
  }

  const isLoading = createMutation.isPending || updateMutation.isPending

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-2xl w-full max-h-[90vh] bg-white dark:bg-gray-800 rounded-xl shadow-xl flex flex-col">
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
            <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-white">
              {isEditing ? 'Editar Usuário API' : 'Novo Usuário API'}
            </Dialog.Title>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4 overflow-y-auto flex-1">
            {/* Indicador de tipo */}
            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
              <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                <KeyIcon className="h-5 w-5" />
                <span className="font-medium">Usuário API</span>
              </div>
              <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                Este usuário utilizará autenticação via API Key/Secret
              </p>
            </div>

            {/* Nome */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nome *
              </label>
              <input
                type="text"
                {...register('name')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Nome do usuário ou sistema"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.name.message}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email *
              </label>
              <div className="relative">
                <input
                  type="email"
                  {...register('email')}
                  disabled={isEditing}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed"
                  placeholder="email@exemplo.com"
                  onBlur={async (e) => {
                    const email = e.target.value
                    if (email && !isEditing) {
                      setCheckingEmail(true)
                      try {
                        const isAvailable = await usersService.checkEmailAvailability(email)
                        if (!isAvailable) {
                          setError('email', {
                            type: 'manual',
                            message: 'Este email já está em uso'
                          })
                        }
                      } catch (error) {
                        logger.error('Erro ao verificar email:', error)
                      } finally {
                        setCheckingEmail(false)
                      }
                    }
                  }}
                />
                {checkingEmail && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <LoadingSpinner size="sm" />
                  </div>
                )}
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.email.message}</p>
              )}
            </div>

            {/* Telefone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Telefone
              </label>
              <InputMask
                mask="(99) 99999-9999"
                {...register('telefone')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="(11) 99999-9999"
              />
            </div>

            {/* Observações */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Observações
              </label>
              <textarea
                {...register('obs')}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Observações sobre o usuário API..."
              />
            </div>

            {/* Configurações da API */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-4">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                Configurações da API
              </h3>

              {/* Rate Limit */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Limite de Requisições por Hora
                </label>
                <input
                  type="number"
                  {...register('rate_limit_per_hour', { valueAsNumber: true })}
                  min="1"
                  max="100000"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Número máximo de requisições permitidas por hora
                </p>
              </div>

              {/* Endpoints Permitidos */}
              <EndpointRateLimitConfig
                value={watch('permissions') || {}}
                onChange={(permissions) => setValue('permissions', permissions)}
              />
            </div>

            {/* Status e Role (apenas admin) */}
            {isSuperAdmin && (
              <div className="grid grid-cols-2 gap-4 border-t border-gray-200 dark:border-gray-700 pt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Perfil
                  </label>
                  <select
                    {...register('role')}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="operator">Operador</option>
                    <option value="viewer">Visualizador</option>
                    <option value="user">Usuário</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Status
                  </label>
                  <div className="flex items-center h-[42px]">
                    <label className="inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        {...register('active')}
                        className="sr-only peer"
                      />
                      <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                      <span className="ml-3 text-sm font-medium text-gray-900 dark:text-gray-300">
                        {watch('active') ? 'Ativo' : 'Inativo'}
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Credenciais Geradas (apenas para novos usuários) */}
            {!isEditing && generatedCredentials && (
              <ApiCredentialsDisplay
                apiKey={generatedCredentials.api_key}
                apiSecret={generatedCredentials.api_secret}
                userName={watch('name')}
              />
            )}

            {/* Botões */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button
                type="button"
                variant="secondary"
                onClick={onClose}
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    {isEditing ? 'Salvando...' : 'Criando...'}
                  </>
                ) : (
                  <>
                    {isEditing ? 'Salvar Alterações' : 'Criar Usuário API'}
                  </>
                )}
              </Button>
            </div>
          </form>
        </Dialog.Panel>
      </div>
    </Dialog>
  )
}
