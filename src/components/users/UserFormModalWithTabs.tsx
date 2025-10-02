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

const userSchema = z
  .object({
    name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres').max(100),
    email: z
      .string()
      .email('Email inválido')
      .refine((val) => !val.includes(' '), 'Email não pode conter espaços')
      .refine((val) => val === val.toLowerCase(), 'Email deve estar em minúsculas'),
    telefone: z.string().optional().refine(validatePhone, 'Telefone inválido'),
    password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres').optional(),
    role_id: z.number().optional(), // FK para ari_roles
    id_pessoa: z.number().optional(), // FK para ge_pessoa - OBRIGATÓRIO para NORMAL
    tipo_usuario: z.enum(['NORMAL', 'API']).optional(),
    active: z.boolean().optional(),
    // API fields
    rate_limit_per_hour: z.number().min(1).max(10000).optional(),
    ip_whitelist: z.array(z.string()).optional(),
  })
  .refine(
    (data) => {
      // Se tipo_usuario é NORMAL, id_pessoa é OBRIGATÓRIO
      if (data.tipo_usuario === 'NORMAL' && !data.id_pessoa) {
        return false
      }
      return true
    },
    {
      message: 'Usuários do tipo NORMAL devem ter uma pessoa vinculada (id_pessoa)',
      path: ['id_pessoa'],
    }
  )

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
      reset({
        name: user.name,
        email: user.email,
        telefone: user.telefone || '',
        role_id: user.role_id || undefined,
        id_pessoa: user.id_pessoa || undefined,
        tipo_usuario: user.tipo_usuario || 'NORMAL',
        active: user.active ?? true,
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
      if (isEditing) {
        return usersService.updateUser(user.id, data)
      } else {
        return usersService.createUser({ ...data, baseId: selectedBaseId })
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
    mutation.mutate(data)
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
          <form onSubmit={handleSubmit(onSubmit)}>
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
                  <PermissoesTab register={register} control={control} />
                </Tab.Panel>

                {watch('tipo_usuario') === 'API' && (
                  <Tab.Panel>
                    <LimitesAcessoTab register={register} errors={errors} />
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