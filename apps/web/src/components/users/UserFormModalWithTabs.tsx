import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Dialog, Tab } from '@headlessui/react'
import {
  XMarkIcon,
  UserIcon,
  BuildingOfficeIcon,
  ShieldCheckIcon,
  KeyIcon,
} from '@heroicons/react/24/outline'
import { useQueryClient, useMutation } from '@tanstack/react-query'
import { Button } from '@/components/common/Button'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { UsuarioResponseDto, usersService } from '@/services/users'
import { useBase } from '@/contexts/BaseContext'
import toast from 'react-hot-toast'
import { logger } from '@/utils/logger'
import { DadosBasicosTab } from './tabs/DadosBasicosTab'
import { PermissoesTab } from './tabs/PermissoesTab'
import { LimitesAcessoTab } from './tabs/LimitesAcessoTab'

// Validação
const validatePhone = (phone: string | undefined) => {
  if (!phone) return true
  const cleaned = phone.replace(/\D/g, '')
  return cleaned.length === 10 || cleaned.length === 11
}

const userSchema = z.object({
  name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres').max(100),
  email: z
    .string()
    .email('Email inválido')
    .refine((val) => !val.includes(' '), 'Email não pode conter espaços')
    .refine((val) => val === val.toLowerCase(), 'Email deve estar em minúsculas'),
  telefone: z.string().optional(),
  password: z.string().optional(),
  role_id: z.any().optional(), // FK para ari_roles - flexível
  id_pessoa: z.any().optional(), // FK para ge_pessoa - flexível
  plano_id: z.any().optional(), // FK para ari_plans - Plano de acesso
  obs: z.string().optional(), // Observações sobre o usuário
  tipo_usuario: z.enum(['NORMAL', 'API']).optional(),
  active: z.boolean().optional(),
  rate_limit_per_hour: z.number().optional(),
  ip_whitelist: z.array(z.string()).optional(),
})

type UserFormData = z.infer<typeof userSchema>

interface UserFormModalWithTabsProps {
  user: UsuarioResponseDto | null
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function UserFormModalWithTabs({
  user,
  isOpen,
  onClose,
  onSuccess,
}: UserFormModalWithTabsProps) {
  const queryClient = useQueryClient()
  const { selectedBaseId } = useBase()
  const isEditing = !!user
  const [selectedTab, setSelectedTab] = useState(0)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
    watch,
    setValue,
    control,
  } = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      active: true,
      tipo_usuario: 'NORMAL',
    },
  })

  // Carregar dados ao editar
  useEffect(() => {
    if (user && isOpen) {
      // Backend retorna 'nome', frontend usa 'name'
      const userName = (user as any).nome || user.name || ''
      const ativoValue = user.ativo === true || (user.ativo as any) === 1

      console.log('🔍 DEBUG UserFormModalWithTabs:', {
        userId: user.id,
        userName_field: user.name,
        userNome_field: (user as any).nome,
        userName_used: userName,
        role: user.role,
        role_id: user.role?.id,
        ativo: ativoValue,
      })

      reset({
        name: userName,
        email: user.email,
        telefone: user.telefone || '',
        role_id: user.role?.id || undefined,
        id_pessoa: user.id_pessoa || undefined,
        plano_id: user.plan_id || user.plan?.id || (user as any).plano_id || undefined,
        obs: user.obs || '',
        tipo_usuario: user.tipo_usuario || 'NORMAL',
        active: ativoValue,
        rate_limit_per_hour: user.rate_limit_per_hour,
      })
    } else if (!user && isOpen) {
      reset({
        active: true,
        tipo_usuario: 'NORMAL',
      })
    }
  }, [user, isOpen, reset])

  // Mutation para criar/atualizar
  const mutation = useMutation({
    mutationFn: async (data: UserFormData) => {
      // Construir payload limpo - APENAS campos aceitos pelo backend DTO
      const payload: any = {}

      // Campos básicos (aceitos pelo UpdateUsuarioDto)
      if (data.name) payload.nome = data.name
      if (data.email) payload.email = data.email
      if (data.telefone) payload.telefone = data.telefone
      if (data.obs !== undefined) payload.obs = data.obs

      // role_id → roleId (backend espera camelCase)
      if (data.role_id !== undefined && data.role_id !== null) {
        payload.roleId = Number(data.role_id)
      }

      // plano_id → planId (backend espera camelCase)
      if (data.plano_id !== undefined && data.plano_id !== null) {
        payload.planId = Number(data.plano_id)
      }

      // active → ativo
      payload.ativo = data.active === true

      if (isEditing) {
        // UPDATE: Só envia campos aceitos pelo UpdateUsuarioDto
        // NÃO enviar: tipo_usuario, id_pessoa, password
        // Nota: Para mudar senha, usar endpoint específico /usuarios/:id/change-password
        logger.info('📦 Payload UPDATE para API:', 'MUTATION', payload)
        return usersService.updateUser(user.id, payload)
      } else {
        // CREATE: Pode enviar mais campos
        if (data.password) payload.password = data.password
        if (data.tipo_usuario) payload.tipo_usuario = data.tipo_usuario
        if (data.id_pessoa !== undefined && data.id_pessoa !== null && data.id_pessoa !== '') {
          payload.id_pessoa = Number(data.id_pessoa)
        }

        logger.info('📦 Payload CREATE para API:', 'MUTATION', { ...payload, baseId: selectedBaseId })
        return usersService.createUser({ ...payload, baseId: selectedBaseId })
      }
    },
    onSuccess: () => {
      toast.success(
        isEditing ? 'Usuário atualizado com sucesso!' : 'Usuário criado com sucesso!'
      )
      queryClient.invalidateQueries({ queryKey: ['users'] })
      onSuccess()
      onClose()
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Erro ao salvar usuário')
      logger.error('Erro ao salvar usuário:', error)
    },
  })

  const onSubmit = (data: UserFormData) => {
    logger.info('🚀 Form submit - dados válidos', 'FORM', data)
    mutation.mutate(data)
  }

  const onError = (errors: any) => {
    logger.error('❌ Erros de validação', 'FORM', errors)
    const firstError = Object.values(errors)[0] as any
    if (firstError?.message) {
      toast.error(`Erro: ${firstError.message}`)
    }
  }

  const tabs = [
    { name: 'Dados Básicos', icon: UserIcon },
    { name: 'Permissões', icon: ShieldCheckIcon },
    ...(watch('tipo_usuario') === 'API' ? [{ name: 'Configurações API', icon: KeyIcon }] : []),
  ]

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-[9999]">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50" aria-hidden="true" />

      {/* Modal Container */}
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-3xl w-full bg-white dark:bg-gray-800 rounded-lg shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <Dialog.Title className="text-xl font-semibold text-gray-900 dark:text-white">
              {isEditing ? 'Editar Usuário' : 'Novo Usuário'}
            </Dialog.Title>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit, onError)}>
            {/* Tabs */}
            <Tab.Group selectedIndex={selectedTab} onChange={setSelectedTab}>
              <Tab.List className="flex border-b border-gray-200 dark:border-gray-700 px-6">
                {tabs.map((tab) => (
                  <Tab
                    key={tab.name}
                    className={({ selected }) =>
                      `flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                        selected
                          ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                          : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
                      }`
                    }
                  >
                    <tab.icon className="h-5 w-5" />
                    {tab.name}
                  </Tab>
                ))}
              </Tab.List>

              <Tab.Panels className="p-6 max-h-[60vh] overflow-y-auto">
                <Tab.Panel>
                  <DadosBasicosTab
                    register={register}
                    errors={errors}
                    watch={watch}
                    setValue={setValue}
                    user={user}
                    isEditing={isEditing}
                    selectedBaseId={selectedBaseId}
                    isOpen={isOpen}
                  />
                </Tab.Panel>

                <Tab.Panel>
                  <PermissoesTab register={register} control={control} watch={watch} setValue={setValue} />
                </Tab.Panel>

                {watch('tipo_usuario') === 'API' && (
                  <Tab.Panel>
                    <LimitesAcessoTab register={register as any} errors={errors as any} />
                  </Tab.Panel>
                )}
              </Tab.Panels>
            </Tab.Group>

            {/* Footer com botões */}
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700">
              <Button type="button" variant="secondary" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" isLoading={isSubmitting}>
                {isEditing ? 'Salvar Alterações' : 'Criar Usuário'}
              </Button>
            </div>
          </form>
        </Dialog.Panel>
      </div>
    </Dialog>
  )
}