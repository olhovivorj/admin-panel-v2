import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Switch } from '@headlessui/react'
import {
  XMarkIcon,
  UserIcon,
  EnvelopeIcon,
  LockClosedIcon,
  ShieldCheckIcon,
  InformationCircleIcon,
  ExclamationTriangleIcon,
  PencilIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { SearchableSelect, SelectOption } from '@/components/common/SearchableSelect'
import { useBase } from '@/contexts/BaseContext'
import api from '@/services/api'
import toast from 'react-hot-toast'
import { cn } from '@/utils/cn'

const createUserSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  email: z.string()
    .email('Email inválido')
    .min(1, 'Email é obrigatório')
    .refine(val => !val.includes(' '), 'Email não pode conter espaços')
    .refine(val => val === val.toLowerCase(), 'Email deve estar em minúsculas'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
  role: z.enum(['admin', 'user', 'operator', 'viewer'], { errorMap: () => ({ message: 'Selecione um perfil válido' }) }),
  sysUserId: z.number().min(1, 'Selecione um usuário do sistema').optional(),
})

type CreateUserFormData = z.infer<typeof createUserSchema>

interface UserCreateModalProps {
  isOpen: boolean
  onClose: () => void
}

interface SysUser {
  baseId: number
  idUser: number
  name: string
  completeName: string
  supervisor: boolean
  grupo: string
  email?: string
  hasAriUser: boolean
}

export function UserCreateModal({ isOpen, onClose }: UserCreateModalProps) {
  const { selectedBaseId } = useBase()
  const queryClient = useQueryClient()
  const [selectedSysUser, setSelectedSysUser] = useState<SysUser | null>(null)
  const [editSysUser, setEditSysUser] = useState(false)
  const [sysUserData, setSysUserData] = useState({
    completeName: '',
    email: '',
    grupo: '',
    supervisor: false,
  })

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<CreateUserFormData>({
    resolver: zodResolver(createUserSchema),
  })

  const watchedSysUserId = watch('sysUserId')

  // Buscar sys_users disponíveis
  const { data: sysUsers, isLoading: loadingSysUsers } = useQuery({
    queryKey: ['sys-users-available', selectedBaseId],
    queryFn: async () => {
      const response = await api.get('/usuarios/sys-users/available', {
        params: { baseId: selectedBaseId },
      })
      return response.data.data as SysUser[]
    },
    enabled: isOpen && !!selectedBaseId,
  })

  // Criar usuário - NOVO ENDPOINT
  const createUserMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.post('/usuarios', data)
      return response.data
    },
    onSuccess: (data) => {
      toast.success(data.message || 'Usuário criado com sucesso!')
      queryClient.invalidateQueries({ queryKey: ['users'] })
      queryClient.invalidateQueries({ queryKey: ['ari-users'] })
      queryClient.invalidateQueries({ queryKey: ['sys-users-available'] })
      handleClose()
    },
    onError: (error: any) => {
      const message = error.response?.data?.error?.message || error.response?.data?.message || 'Erro ao criar usuário'
      toast.error(message)
    },
  })

  // Limpar formulário quando modal abrir
  useEffect(() => {
    if (isOpen) {
      reset()
      setSelectedSysUser(null)
      setEditSysUser(false)
      setSysUserData({
        completeName: '',
        email: '',
        grupo: '',
        supervisor: false,
      })
    }
  }, [isOpen, reset])

  // Atualizar dados quando sys_user é selecionado
  useEffect(() => {
    if (watchedSysUserId && sysUsers) {
      const sysUser = sysUsers.find(u => u.idUser === Number(watchedSysUserId))
      if (sysUser) {
        setSelectedSysUser(sysUser)

        // Preencher dados do sys_user para edição
        setSysUserData({
          completeName: sysUser.completeName || '',
          email: sysUser.email || '',
          grupo: sysUser.grupo || '',
          supervisor: sysUser.supervisor || false,
        })

        // Pré-preencher campos
        setValue('name', sysUser.completeName || sysUser.name)
        const suggestedEmail = (sysUser.email || `${sysUser.name.toLowerCase().replace(/\s+/g, '.')}@base${selectedBaseId}.com`)
          .toLowerCase()
          .replace(/\s+/g, '') // Remove todos os espaços
        setValue('email', suggestedEmail)

        // Inferir role (mapeando para os novos valores)
        let suggestedRole: 'admin' | 'user' | 'operator' | 'viewer' = 'viewer'
        if (sysUser.grupo?.toUpperCase().includes('ADMIN')) {
          suggestedRole = 'admin'
        } else if (sysUser.supervisor) {
          suggestedRole = 'operator'
        } else if (sysUser.grupo?.toUpperCase().includes('VENDEDOR') || sysUser.grupo?.toUpperCase().includes('OPERADOR')) {
          suggestedRole = 'operator'
        } else {
          suggestedRole = 'user'
        }
        setValue('role', suggestedRole)
        setValue('sysUserId', sysUser.idUser)
      }
    } else {
      setSelectedSysUser(null)
    }
  }, [watchedSysUserId, sysUsers, setValue, selectedBaseId])

  const handleClose = () => {
    reset()
    setSelectedSysUser(null)
    setEditSysUser(false)
    setSysUserData({
      completeName: '',
      email: '',
      grupo: '',
      supervisor: false,
    })
    onClose()
  }

  const onSubmit = (data: CreateUserFormData) => {
    // VALIDAÇÃO: Verificar se sys_user foi selecionado
    if (!selectedSysUser) {
      toast.error('Por favor, selecione um usuário do sistema válido.')
      return
    }

    const payload = {
      name: data.name,
      email: data.email,
      password: data.password,
      role: data.role,
      baseId: selectedBaseId,
      status: 'active',
      notes: selectedSysUser ? `Criado a partir do sys_user ${selectedSysUser.idUser} (${selectedSysUser.completeName})` : undefined,
    }

    createUserMutation.mutate(payload)
  }

  const roleOptions = [
    { value: 'admin', label: 'Administrador', description: 'Acesso completo ao sistema' },
    { value: 'user', label: 'Usuário', description: 'Acesso padrão ao sistema' },
    { value: 'operator', label: 'Operador', description: 'Acesso operacional completo' },
    { value: 'viewer', label: 'Visualizador', description: 'Apenas visualização' },
  ]

  if (!isOpen) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={handleClose} />

        <div className="relative transform overflow-hidden rounded-lg bg-white dark:bg-gray-800 px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl sm:p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <UserIcon className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Criar Novo Usuário ARI
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Vincular usuário do sistema ao painel administrativo
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="rounded-md text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

            {/* Seleção de SysUser */}
            <div>
              {loadingSysUsers ? (
                <div className="flex items-center justify-center py-4">
                  <LoadingSpinner size="sm" />
                  <span className="ml-2 text-sm text-gray-500">Carregando usuários...</span>
                </div>
              ) : (
                <SearchableSelect
                  label="Usuário do Sistema *"
                  options={sysUsers?.map(user => ({
                    value: user.idUser,
                    label: `${user.completeName} (${user.name})`,
                    subtitle: `${user.email || 'Sem email'} | ${user.supervisor ? 'Supervisor' : user.grupo || 'Usuário'}`,
                    ...user,
                  })) || []}
                  value={selectedSysUser ? {
                    value: selectedSysUser.idUser,
                    label: `${selectedSysUser.completeName} (${selectedSysUser.name})`,
                    subtitle: `${selectedSysUser.email || 'Sem email'} | ${selectedSysUser.supervisor ? 'Supervisor' : selectedSysUser.grupo || 'Usuário'}`,
                    ...selectedSysUser,
                  } : null}
                  onChange={(option: SelectOption | null) => {
                    if (option) {
                      const user = sysUsers?.find(u => u.idUser === option.value)
                      setSelectedSysUser(user || null)
                      setValue('sysUserId', option.value)
                    } else {
                      setSelectedSysUser(null)
                    }
                  }}
                  placeholder="Digite para pesquisar usuário..."
                  searchThreshold={2}
                  isLoading={loadingSysUsers}
                  error={errors.sysUserId?.message}
                  required
                />
              )}
            </div>

            {/* Preview do SysUser selecionado */}
            {selectedSysUser && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <InformationCircleIcon className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100">
                        Dados do Usuário Selecionado
                      </h4>
                      <button
                        type="button"
                        onClick={() => setEditSysUser(!editSysUser)}
                        className="flex items-center text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                      >
                        <PencilIcon className="h-3 w-3 mr-1" />
                        {editSysUser ? 'Cancelar edição' : 'Editar dados'}
                      </button>
                    </div>

                    {!editSysUser ? (
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-blue-700 dark:text-blue-300">Nome:</span>
                          <span className="ml-2 text-blue-900 dark:text-blue-100">{selectedSysUser.completeName}</span>
                        </div>
                        <div>
                          <span className="text-blue-700 dark:text-blue-300">Supervisor:</span>
                          <span className="ml-2 text-blue-900 dark:text-blue-100">{selectedSysUser.supervisor ? 'Sim' : 'Não'}</span>
                        </div>
                        <div>
                          <span className="text-blue-700 dark:text-blue-300">Grupo:</span>
                          <span className="ml-2 text-blue-900 dark:text-blue-100">{selectedSysUser.grupo || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-blue-700 dark:text-blue-300">Email sys_user:</span>
                          <span className="ml-2 text-blue-900 dark:text-blue-100">{selectedSysUser.email || 'Não possui'}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-medium text-blue-700 dark:text-blue-300 mb-1">
                            Nome Completo
                          </label>
                          <input
                            type="text"
                            value={sysUserData.completeName}
                            onChange={(e) => setSysUserData({ ...sysUserData, completeName: e.target.value })}
                            className="w-full px-2 py-1 text-sm border border-blue-300 dark:border-blue-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-blue-700 dark:text-blue-300 mb-1">
                            Email (sys_user)
                          </label>
                          <input
                            type="email"
                            value={sysUserData.email}
                            onChange={(e) => setSysUserData({ ...sysUserData, email: e.target.value })}
                            className="w-full px-2 py-1 text-sm border border-blue-300 dark:border-blue-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            placeholder="Email no sys_users"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-blue-700 dark:text-blue-300 mb-1">
                            Grupo
                          </label>
                          <input
                            type="text"
                            value={sysUserData.grupo}
                            onChange={(e) => setSysUserData({ ...sysUserData, grupo: e.target.value })}
                            className="w-full px-2 py-1 text-sm border border-blue-300 dark:border-blue-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            placeholder="Ex: VENDEDOR, ADMIN"
                          />
                        </div>
                        <div className="flex items-center">
                          <Switch
                            checked={sysUserData.supervisor}
                            onChange={(checked) => setSysUserData({ ...sysUserData, supervisor: checked })}
                            className={cn(
                              'relative inline-flex h-5 w-9 items-center rounded-full transition-colors',
                              sysUserData.supervisor ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600',
                            )}
                          >
                            <span
                              className={cn(
                                'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                                sysUserData.supervisor ? 'translate-x-5' : 'translate-x-1',
                              )}
                            />
                          </Switch>
                          <label className="ml-2 text-xs font-medium text-blue-700 dark:text-blue-300">
                            Supervisor
                          </label>
                        </div>
                        <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                          ⚠️ Estas alterações serão salvas na tabela sys_users
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Nome */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <UserIcon className="h-4 w-4 inline mr-1" />
                Nome Completo *
              </label>
              <input
                {...register('name')}
                type="text"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Nome completo do usuário"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <EnvelopeIcon className="h-4 w-4 inline mr-1" />
                Email para Login *
              </label>
              <input
                {...register('email')}
                type="email"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="email@exemplo.com"
                onChange={(e) => {
                  // Remover espaços e converter para minúsculas automaticamente
                  const cleanEmail = e.target.value.toLowerCase().replace(/\s+/g, '')
                  e.target.value = cleanEmail
                  setValue('email', cleanEmail, { shouldValidate: true })
                }}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                💡 Espaços serão removidos automaticamente e convertidos para minúsculas
              </p>
            </div>

            {/* Senha */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <LockClosedIcon className="h-4 w-4 inline mr-1" />
                Senha *
              </label>
              <input
                {...register('password')}
                type="password"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Mínimo 6 caracteres"
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>

            {/* Perfil */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <ShieldCheckIcon className="h-4 w-4 inline mr-1" />
                Perfil de Acesso *
              </label>
              <select
                {...register('role')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">Selecione um perfil</option>
                {roleOptions.map(role => (
                  <option key={role.value} value={role.value}>
                    {role.label} - {role.description}
                  </option>
                ))}
              </select>
              {errors.role && (
                <p className="mt-1 text-sm text-red-600">{errors.role.message}</p>
              )}
            </div>

            {/* Avisos */}
            {sysUsers && sysUsers.length === 0 && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium text-yellow-900 dark:text-yellow-100">
                      ✅ Nenhum usuário disponível para criação
                    </h4>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                      Todos os usuários do sistema (sys_users) já possuem acesso ao painel ARI.
                      <br />
                      <strong>O servidor já filtrou automaticamente os disponíveis.</strong>
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Info sobre filtro preventivo */}
            {sysUsers && sysUsers.length > 0 && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                <div className="flex items-start space-x-2">
                  <InformationCircleIcon className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5" />
                  <p className="text-xs text-blue-700 dark:text-blue-300">
                    🛡️ <strong>Filtro automático:</strong> O servidor já filtrou e mostra apenas usuários que ainda não possuem acesso ARI.
                  </p>
                </div>
              </div>
            )}

            {/* Botões */}
            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={createUserMutation.isPending}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {createUserMutation.isPending ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Criando...
                  </>
                ) : (
                  <>
                    <CheckCircleIcon className="h-4 w-4 mr-2" />
                    Criar Usuário
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}