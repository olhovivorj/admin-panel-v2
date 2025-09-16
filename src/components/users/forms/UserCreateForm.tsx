import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { XMarkIcon, CheckIcon } from '@heroicons/react/24/outline'
import { UserBasicForm } from './UserBasicForm'
import { SysUserSelector } from './SysUserSelector'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { useBase } from '@/contexts/BaseContext'
import api from '@/services/api'
import toast from 'react-hot-toast'

const createUserSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  email: z.string().email('Email inválido').min(1, 'Email é obrigatório'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
  role: z.enum(['admin', 'user', 'operator'], {
    errorMap: () => ({ message: 'Selecione um perfil válido' }),
  }),
  tipo_usuario: z.enum(['NORMAL', 'API'], {
    errorMap: () => ({ message: 'Selecione o tipo de usuário' }),
  }),
  sysUserId: z.number().min(1, 'Selecione um usuário do sistema').optional(),
})

type CreateUserFormData = z.infer<typeof createUserSchema>

interface UserCreateFormProps {
  isOpen: boolean
  onClose: () => void
}

export function UserCreateForm({ isOpen, onClose }: UserCreateFormProps) {
  const { selectedBaseId } = useBase()
  const queryClient = useQueryClient()
  const [currentStep, setCurrentStep] = useState<'basic' | 'sys-user'>('basic')

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    setValue,
    watch,
    reset,
  } = useForm<CreateUserFormData>({
    resolver: zodResolver(createUserSchema),
    mode: 'onChange',
  })

  // Criar usuário
  const createUserMutation = useMutation({
    mutationFn: async (data: CreateUserFormData) => {
      const payload = {
        ...data,
        baseId: selectedBaseId,
        // tipo_usuario será definido pelo form
      }

      const response = await api.post('/usuarios', payload)
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
      console.error('Erro ao criar usuário:', error)
      const message = error.response?.data?.error?.message ||
                     error.response?.data?.message ||
                     error.message ||
                     'Erro ao criar usuário'
      toast.error(message)
    },
  })

  const handleClose = () => {
    reset()
    setCurrentStep('basic')
    onClose()
  }

  const onSubmit = (data: CreateUserFormData) => {
    createUserMutation.mutate(data)
  }

  const canProceedToNextStep = () => {
    const basicFields = ['name', 'email', 'password', 'role'] as const
    return basicFields.every(field => {
      const value = watch(field)
      return value && !errors[field]
    })
  }

  const steps = [
    { key: 'basic', label: 'Informações Básicas' },
    { key: 'sys-user', label: 'Vincular ao ERP' },
  ] as const

  if (!isOpen) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={handleClose} />

        <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Criar Novo Usuário
                </h3>
                <button
                  type="button"
                  onClick={handleClose}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  disabled={createUserMutation.isPending}
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              {/* Steps Navigator */}
              <div className="mb-6">
                <nav className="flex space-x-4">
                  {steps.map((step, index) => (
                    <button
                      key={step.key}
                      type="button"
                      onClick={() => setCurrentStep(step.key)}
                      className={`
                        flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors
                        ${currentStep === step.key
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                      : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                    }
                        ${step.key === 'sys-user' && !canProceedToNextStep()
                      ? 'opacity-50 cursor-not-allowed'
                      : 'cursor-pointer'
                    }
                      `}
                      disabled={step.key === 'sys-user' && !canProceedToNextStep()}
                    >
                      <span className={`
                        flex items-center justify-center w-6 h-6 rounded-full text-xs mr-2
                        ${currentStep === step.key
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-300 text-gray-600 dark:bg-gray-600 dark:text-gray-300'
                    }
                      `}>
                        {index + 1}
                      </span>
                      {step.label}
                    </button>
                  ))}
                </nav>
              </div>

              {/* Form Content */}
              <div className="space-y-6">
                {currentStep === 'basic' && (
                  <UserBasicForm register={register} errors={errors} />
                )}

                {currentStep === 'sys-user' && (
                  <SysUserSelector
                    selectedBaseId={selectedBaseId}
                    setValue={setValue}
                    watch={watch}
                    isOpen={isOpen}
                  />
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                type="submit"
                disabled={createUserMutation.isPending || !isValid}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {createUserMutation.isPending ? (
                  <div className="flex items-center">
                    <LoadingSpinner size="sm" />
                    <span className="ml-2">Criando...</span>
                  </div>
                ) : (
                  <div className="flex items-center">
                    <CheckIcon className="h-4 w-4 mr-2" />
                    Criar Usuário
                  </div>
                )}
              </button>

              {currentStep === 'sys-user' && (
                <button
                  type="button"
                  onClick={() => setCurrentStep('basic')}
                  disabled={createUserMutation.isPending}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-800 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Voltar
                </button>
              )}

              {currentStep === 'basic' && canProceedToNextStep() && (
                <button
                  type="button"
                  onClick={() => setCurrentStep('sys-user')}
                  disabled={createUserMutation.isPending}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-800 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Próximo
                </button>
              )}

              <button
                type="button"
                onClick={handleClose}
                disabled={createUserMutation.isPending}
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-800 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}