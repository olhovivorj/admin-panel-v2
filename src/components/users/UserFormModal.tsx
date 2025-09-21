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
import { SysUserSelector } from './forms/SysUserSelector'
import { LojaSelector } from './forms/LojaSelector'
import { PersonSelectorMobile } from './forms/PersonSelectorMobile'
import { PlanSelectorMobile } from './forms/PlanSelectorMobile'
import { EndpointRateLimitConfig } from './EndpointRateLimitConfig'
// import { EndpointConfigurationPanel } from './EndpointConfigurationPanel'
import { ApiTokenManager } from './ApiTokenManager'
import { useSuperAdmin } from '@/hooks/useSuperAdmin'
// import { useOperationToast } from '@/hooks/useOperationToast' // Remover importação não utilizada
import toast from 'react-hot-toast'
import { logger } from '@/utils/logger'
import api from '@/services/api'

// Função para validar telefone brasileiro
const validatePhone = (phone: string | undefined) => {
  if (!phone) return true // Opcional
  const cleaned = phone.replace(/\D/g, '')
  return cleaned.length === 10 || cleaned.length === 11
}

const userSchema = z.object({
  name: z.string()
    .min(3, 'Nome deve ter pelo menos 3 caracteres')
    .max(100, 'Nome muito longo'),
  email: z.string()
    .email('Email inválido')
    .min(1, 'Email é obrigatório')
    .max(100, 'Email muito longo')
    .refine(val => !val.includes(' '), 'Email não pode conter espaços')
    .refine(val => val === val.toLowerCase(), 'Email deve estar em minúsculas'),
  telefone: z.string()
    .optional()
    .refine(validatePhone, 'Telefone inválido (10 ou 11 dígitos)'),
  obs: z.string()
    .max(500, 'Observações muito longas')
    .optional(),
  password: z.string()
    .min(6, 'Senha deve ter pelo menos 6 caracteres')
    .max(50, 'Senha muito longa')
    .optional(),
  role: z.enum(['admin', 'user', 'operator', 'viewer']).optional(),
  baseId: z.number().optional(),
  active: z.boolean().optional(),
  // Campos para usuários API
  tipo_usuario: z.enum(['NORMAL', 'API']).optional(),
  sysUserId: z.number().optional(),
  iduser: z.number().optional(),
  ID_PESSOA: z.number().optional(), // Novo: vincular com pessoa do ERP
  plano_id: z.number().optional(),   // Novo: plano de acesso
  permissions: z.array(z.string()).optional(),
  ip_whitelist: z.array(z.string()).optional(),
  rate_limit_per_hour: z.number().min(1).max(10000).optional(),
  permissoes_endpoints: z.record(z.any()).optional(),
  lojas: z.array(z.number()).optional(),
})

type UserFormData = z.infer<typeof userSchema>

interface UserFormModalProps {
  user: UsuarioResponseDto | null
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function UserFormModal({ user, isOpen, onClose, onSuccess }: UserFormModalProps) {
  // Debug no início do componente
  logger.info('🔍 UserFormModal - Props recebidas:', 'FORM', {
    user,
    isOpen,
    hasUser: !!user,
    userId: user?.id,
    userName: user?.name,
    userEmail: user?.email,
    userTipo: user?.tipo_usuario
  })

  const queryClient = useQueryClient()
  const { selectedBaseId } = useBase()
  const { isSuperAdmin, canChangeUserType } = useSuperAdmin()
  const isEditing = !!user
  const [showPassword, setShowPassword] = useState(false)
  const [checkingEmail, setCheckingEmail] = useState(false)
  const [selectedLojas, setSelectedLojas] = useState<number[]>([])
  const [debugMode, setDebugMode] = useState(() => {
    // Carregar preferência do localStorage
    return localStorage.getItem('userFormDebugMode') === 'true'
  })

  // Função para verificar se email já existe
  const checkEmailExists = async (email: string): Promise<boolean> => {
    if (!email) return false
    
    setCheckingEmail(true)
    try {
      const isAvailable = await usersService.checkEmailAvailability(
        email, 
        isEditing && user ? user.id : undefined
      )
      return !isAvailable // Retorna true se email já existe
    } catch (error) {
      logger.error('Erro ao verificar email:', error)
      return false
    } finally {
      setCheckingEmail(false)
    }
  }

  logger.info('🎯 UserFormModal - Admin check', 'FORM', { isSuperAdmin, canChangeUserType, isEditing })

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    setError,
    formState: { errors },
  } = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
  })

  const tipoUsuario = watch('tipo_usuario')
  
  // Para edição, sempre usar o tipo do usuário carregado
  // Para criação, usar o tipo do watch (que vem do localStorage)
  const [effectiveTipoUsuario, setEffectiveTipoUsuario] = useState<'NORMAL' | 'API'>(() => {
    if (isEditing && user) {
      // IMPORTANTE: Não fazer fallback para NORMAL aqui!
      return user.tipo_usuario === 'API' ? 'API' : 'NORMAL'
    }
    return localStorage.getItem('newUserType') as 'NORMAL' | 'API' || 'NORMAL'
  })
  
  // Atualizar quando o usuário mudar
  useEffect(() => {
    if (isEditing && user) {
      // IMPORTANTE: Verificar explicitamente se é API
      const tipo = user.tipo_usuario === 'API' ? 'API' : 'NORMAL'
      setEffectiveTipoUsuario(tipo)
      
      // Log específico para debug
      if (user.email === 'pontomarket@dnp.com.br') {
        logger.error('🚨 PONTOMARKET - Tipo detectado:', 'FORM', {
          user_tipo_usuario: user.tipo_usuario,
          tipo_calculado: tipo,
          user_completo: user
        })
      }
    }
  }, [isEditing, user])
  
  const isApiUser = effectiveTipoUsuario === 'API'
  
  // LOG CRÍTICO: Rastrear renderização do SysUserSelector
  useEffect(() => {
    if (user?.email === 'pontomarket@dnp.com.br') {
      logger.error('🔴 PONTOMARKET - Estado do componente:', 'FORM', {
        isApiUser,
        effectiveTipoUsuario,
        shouldShowSysUser: !isApiUser && effectiveTipoUsuario !== 'API',
        userTipoUsuario: user?.tipo_usuario,
        isEditing,
        isOpen,
        selectedBaseId
      })
    }
  }, [isApiUser, effectiveTipoUsuario, user, isEditing, isOpen, selectedBaseId])
  
  // Debug para verificar tipo_usuario
  logger.info('🔍 DEBUG - Tipo de usuário:', 'FORM', {
    isEditing,
    userTipoUsuario: user?.tipo_usuario,
    watchedTipoUsuario: tipoUsuario,
    effectiveTipoUsuario,
    isApiUser,
    userId: user?.id,
    userName: user?.name,
    email: user?.email,
  })
  
  // Log específico para pontomarket
  if (user?.email === 'pontomarket@dnp.com.br') {
    logger.warn('🎯 PONTOMARKET DETECTADO:', 'FORM', {
      tipo_usuario: user.tipo_usuario,
      isApiUser,
      willShowSysUserSelector: !isApiUser,
    })
  }

  // Buscar bases disponíveis
  // const { data: bases = [] } = useQuery({
  //   queryKey: ['bases'],
  //   queryFn: () => basesService.getBases(),
  // })

  // Mutation para criar usuário
  const createMutation = useMutation({
    mutationFn: usersService.createUser,
    onSuccess: (response) => {
      logger.info('✅ Usuário criado com sucesso:', 'FORM', response)
      toast.success('Usuário criado com sucesso!')
      // Invalidar cache para forçar atualização da lista
      queryClient.invalidateQueries({ queryKey: ['users'] })
      queryClient.invalidateQueries({ queryKey: ['user-stats'] })
      
      // Forçar refetch imediato
      queryClient.refetchQueries({
        queryKey: ['users'],
        type: 'active',
      })
      
      onSuccess()
    },
    onError: (error) => {
      const errorResponse = error as { response?: { data?: { message?: string } } }
      const errorMsg = typeof errorResponse.response?.data?.message === 'string'
        ? errorResponse.response.data.message
        : 'Erro ao criar usuário'

      // DEBUG: Mostrar erro detalhado
      const debugMode = localStorage.getItem('userFormDebugMode') === 'true'
      if (debugMode) {
        const debugError = `
❌ ERRO - Criação de Usuário
================================
${errorMsg}

Status: ${error.response?.status || 'N/A'}
Detalhes: ${JSON.stringify(error.response?.data, null, 2)}
================================

💡 Dica: Para desativar estes alertas, desmarque
"Modo Debug" no topo do formulário.
        `
        alert(debugError)
      }

      toast.error(errorMsg)
    },
  })

  // Mutation para atualizar usuário
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateUsuarioDto }) =>
      usersService.updateUser(id, data),
    onSuccess: (response) => {
      // DEBUG: Mostrar resposta do servidor
      if (debugMode) {
        const debugResponse = `
✅ SUCESSO - Resposta do Servidor
================================
Usuário atualizado com sucesso!

DADOS RETORNADOS:
Nome: ${response?.name || 'N/A'}
Email: ${response?.email || 'N/A'}
Telefone: ${response?.telefone || '(vazio)'}
Obs: ${response?.obs || '(vazio)'}
================================

💡 Dica: Para desativar estes alertas, desmarque
"Modo Debug" no topo do formulário.
        `
        alert(debugResponse)
      }

      toast.success('Usuário atualizado com sucesso!')
      // Invalidar cache para forçar atualização IMEDIATA da lista
      queryClient.invalidateQueries({ queryKey: ['users'] })
      queryClient.invalidateQueries({ queryKey: ['user-stats'] })
      
      // PROTEÇÃO: Só invalidar sys-users se NÃO for usuário API
      if (effectiveTipoUsuario !== 'API' && !isApiUser) {
        queryClient.invalidateQueries({ queryKey: ['sys-users-available'] })
      }
      
      // Removido: invalidateQueries para 'auth-user' - pode causar logout indesejado
      queryClient.invalidateQueries({ queryKey: ['bases'] }) // Invalidar bases se usuário mudou

      // Forçar refetch imediato da lista atual
      queryClient.refetchQueries({
        queryKey: ['users'],
        type: 'active', // Apenas queries ativas na tela
      })

      onSuccess()
    },
    onError: (error) => {
      const errorResponse = error as { response?: { data?: { message?: string } } }
      const errorMsg = typeof errorResponse.response?.data?.message === 'string'
        ? errorResponse.response.data.message
        : 'Erro ao atualizar usuário'

      // DEBUG: Mostrar erro detalhado
      if (debugMode) {
        const debugError = `
❌ ERRO - Resposta do Servidor
================================
${errorMsg}

Status: ${error.response?.status || 'N/A'}
Detalhes: ${JSON.stringify(error.response?.data, null, 2)}
================================

💡 Dica: Para desativar estes alertas, desmarque
"Modo Debug" no topo do formulário.
        `
        alert(debugError)
      }

      toast.error(errorMsg)
    },
  })

  // Carregar lojas do usuário ao editar
  useEffect(() => {
    const loadUserLojas = async () => {
      if (user?.id && user.tipo_usuario !== 'API') {
        try {
          const response = await api.get(`/usuarios/${user.id}/lojas`)
          if (response.data?.data) {
            const lojaIds = response.data.data.map((loja: any) => loja.id)
            setSelectedLojas(lojaIds)
            logger.info('🏢 Lojas do usuário carregadas:', 'FORM', lojaIds)
          }
        } catch (error) {
          logger.error('❌ Erro ao carregar lojas do usuário:', 'FORM', error)
        }
      }
    }
    loadUserLojas()
  }, [user])

  useEffect(() => {
    if (user) {
      logger.info('🔄 Carregando dados do usuário para edição:', 'FORM', {
        userId: user.id,
        tipo_usuario: user.tipo_usuario,
        tipoUsuarioIsAPI: user.tipo_usuario === 'API',
        telefone: user.telefone,
        obs: user.obs,
        notes: user.notes,
        permissoes_endpoints_raw: user.permissoes_endpoints,
        full_user: user,
      })
      
      // LOG CRÍTICO: Verificar pontomarket especificamente
      if (user.email === 'pontomarket@dnp.com.br') {
        logger.error('🚨 PONTOMARKET DETECTADO NO useEffect:', 'FORM', {
          tipo_usuario_raw: user.tipo_usuario,
          tipo_usuario_is_api: user.tipo_usuario === 'API',
          tipo_usuario_type: typeof user.tipo_usuario,
          user_completo: user
        })
      }
      
      reset({
        name: user.name,
        email: user.email,
        telefone: user.telefone || '', // Campo telefone
        obs: user.obs || user.notes || '', // Campo observações (obs ou notes)
        role: user.role || 'user',
        baseId: user.baseId,
        active: user.status === 'active', // Converter status para active boolean
        tipo_usuario: user.tipo_usuario as 'NORMAL' | 'API', // Não fazer fallback aqui
        sysUserId: user.iduser || undefined,
        permissions: Array.isArray(user.permissions) ? user.permissions : [],
        ip_whitelist: Array.isArray(user.ip_whitelist) ? user.ip_whitelist : [],
        rate_limit_per_hour: user.rate_limit_per_hour || 1000,
        permissoes_endpoints: (() => {
          try {
            let endpoints = {}
            if (typeof user.permissoes_endpoints === 'string') {
              endpoints = JSON.parse(user.permissoes_endpoints)
            } else {
              endpoints = user.permissoes_endpoints || {}
            }
            logger.info('🔍 Carregando permissões de endpoints:', 'FORM', {
              userId: user.id,
              raw: user.permissoes_endpoints,
              parsed: endpoints
            })
            return endpoints
          } catch (error) {
            logger.error('❌ Erro ao parsear permissões:', 'FORM', error)
            return {}
          }
        })(),
      })
    } else {
      reset({
        name: '',
        email: '',
        telefone: '', // Campo telefone
        obs: '', // Campo observações
        password: '',
        role: 'viewer',
        baseId: selectedBaseId,
        active: true, // Boolean para ativo
        tipo_usuario: (localStorage.getItem('newUserType') as 'NORMAL' | 'API') || 'NORMAL',
        sysUserId: undefined,
        permissions: [],
        ip_whitelist: [],
        rate_limit_per_hour: 1000,
        permissoes_endpoints: {},
      })
    }
  }, [user, reset, selectedBaseId])

  // Limpar localStorage quando o modal fechar
  useEffect(() => {
    if (!isOpen) {
      localStorage.removeItem('newUserType')
    }
  }, [isOpen])

  // Não precisamos registrar manualmente - já está no reset() acima

  const onSubmit = async (data: UserFormData) => {
    logger.info('🚀 Form sendo submetido!', 'FORM', data)
    logger.info('🔍 Debug - Form submit', 'FORM', {
      isSuperAdmin,
      isEditing,
      tipo_usuario_old: user?.tipo_usuario,
      tipo_usuario_new: data.tipo_usuario,
      canChangeUserType,
      permissoes_endpoints: data.permissoes_endpoints,
    })

    // Validação de email único
    if (!isEditing || (isEditing && data.email !== user?.email)) {
      const emailExists = await checkEmailExists(data.email)
      if (emailExists) {
        setError('email', {
          type: 'manual',
          message: 'Este email já está em uso'
        })
        toast.error('⚠️ Este email já está em uso')
        return
      }
    }

    // Validação: usuários NORMAIS precisam ter sys-user selecionado (API não precisa)
    if (!isEditing && data.tipo_usuario === 'NORMAL' && !data.sysUserId) {
      toast.error('⚠️ Usuários NORMAIS precisam vincular um usuário do ERP')
      return
    }

    // Se está editando e tentando alterar tipo de usuário, verificar permissão
    if (isEditing && user?.tipo_usuario !== data.tipo_usuario && !canChangeUserType) {
      toast.error('⚠️ Apenas administradores podem alterar o tipo de usuário')
      return
    }

    const payload = {
      ...data,
      baseId: data.baseId || selectedBaseId, // Garantir que baseId seja fornecido
      // Limpar formatação do telefone se existir
      telefone: data.telefone ? data.telefone.replace(/\D/g, '') : data.telefone,
      // Converter active para ativo (backend espera ativo)
      ativo: data.active,
      // Garantir que permissoes_endpoints seja sempre um objeto
      permissoes_endpoints: data.permissoes_endpoints || {},
      // Adicionar lojas selecionadas para usuários NORMAL
      lojas: data.tipo_usuario !== 'API' ? selectedLojas : undefined,
    }
    // Remover active do payload pois backend espera ativo
    delete payload.active

    // Converter sysUserId para iduser (campo esperado pelo backend)
    if (data.sysUserId) {
      payload.iduser = data.sysUserId
      delete payload.sysUserId
    }

    // Log para debug
    logger.info('🚀 Payload enviado', 'FORM', payload)
    logger.info('🔍 CAMPOS ESPECÍFICOS:', 'FORM', {
      name: data.name,
      email: data.email,
      telefone: data.telefone,
      telefone_raw: data.telefone,
      telefone_payload: payload.telefone,
      obs: data.obs,
      obs_payload: payload.obs,
      tipo_usuario: data.tipo_usuario,
      tipo_usuario_payload: payload.tipo_usuario,
      active: data.active,
      sysUserId: data.sysUserId,
      iduser: payload.iduser,
      isEditing,
      isSuperAdmin,
      canChangeUserType,
    })

    if (!isEditing) {
      // Na criação, remover tipo_usuario (backend auto-detecta)
      delete payload.tipo_usuario
    } else {
      // Na edição, apenas admin pode alterar tipo_usuario
      if (!isSuperAdmin) {
        logger.warn('⚠️ Removendo tipo_usuario - usuário não é admin', 'FORM')
        delete payload.tipo_usuario
      } else {
        logger.info('✅ Mantendo tipo_usuario - usuário é admin', 'FORM', { tipo_usuario: payload.tipo_usuario })
      }
      delete payload.iduser // Não pode alterar vinculação sys_user
    }

    logger.info('🚀 Payload enviado', 'FORM', payload)
    logger.info('🔍 CAMPOS ESPECÍFICOS:', 'FORM', {
      name: payload.name,
      email: payload.email,
      telefone: payload.telefone,
      obs: payload.obs,
      tipo_usuario: payload.tipo_usuario,
      active: payload.active,
      isEditing,
      isSuperAdmin,
      canChangeUserType,
    })

    if (isEditing && user) {
      logger.info('📤 Enviando atualização:', 'FORM', { id: user.id, payload })

      // DEBUG: Mostrar o que está sendo enviado
      if (debugMode) {
        const debugInfo = `
🔍 DEBUG - Atualizando Usuário
================================
ID: ${user.id}
Nome: ${payload.name}
Email: ${payload.email}
Telefone: ${payload.telefone || '(vazio)'}
Obs: ${payload.obs || '(vazio)'}
Role: ${payload.role}
Ativo: ${payload.active}
Tipo: ${payload.tipo_usuario}
================================
Clique OK para enviar a atualização

💡 Dica: Para desativar estes alertas, desmarque
"Modo Debug" no topo do formulário.
        `

        if (confirm(debugInfo)) {
          updateMutation.mutate({ id: user.id, data: payload })
        }
      } else {
        updateMutation.mutate({ id: user.id, data: payload })
      }
    } else {
      logger.info('📤 Criando novo usuário:', 'FORM', payload)
      // DEBUG para criação
      if (debugMode) {
        const debugCreate = `
🆕 DEBUG - Criando Novo Usuário
================================
Nome: ${payload.name}
Email: ${payload.email}
Senha: ${payload.password ? '******' : '(sem senha)'}
Telefone: ${payload.telefone || '(vazio)'}
Obs: ${payload.obs || '(vazio)'}
Role: ${payload.role}
Base: ${payload.baseId}
Tipo: ${payload.tipo_usuario || 'NORMAL'}
SysUser ID: ${payload.iduser || '(nenhum)'}
================================
Clique OK para criar o usuário
        `

        if (confirm(debugCreate)) {
          createMutation.mutate(payload as CreateUsuarioDto)
        }
      } else {
        createMutation.mutate(payload as CreateUsuarioDto)
      }
    }
  }

  const isLoading = createMutation.isPending || updateMutation.isPending

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4 overflow-y-auto">
        <Dialog.Panel className="w-full max-w-2xl bg-white dark:bg-gray-800 rounded-lg shadow-xl my-8 max-h-screen overflow-y-auto">
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <Dialog.Title className="text-lg font-medium text-gray-900 dark:text-white">
              {isEditing ? 'Editar Usuário' : 'Novo Usuário'}
            </Dialog.Title>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={(e) => {
            logger.info('📝 Form submit event triggered', 'FORM')
            handleSubmit(
              onSubmit,
              (formErrors) => {
                logger.error('❌ Erros de validação:', 'FORM', formErrors)
                // Mostrar primeiro erro encontrado
                const firstError = Object.values(formErrors)[0]
                if (firstError && 'message' in firstError) {
                  toast.error(`Erro: ${firstError.message}`)
                }
              },
            )(e)
          }} className="p-6 space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto">

            {/* Mostrar erros de validação */}
            {Object.keys(errors).length > 0 && (
              <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-red-800 dark:text-red-200 mb-2">
                  Erros de validação:
                </h4>
                <ul className="text-sm text-red-700 dark:text-red-300 space-y-1">
                  {Object.entries(errors).map(([field, error]) => (
                    <li key={field}>
                      <strong>{field}:</strong> {error?.message || 'Erro desconhecido'}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Mostrar tipo de usuário como informação read-only */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tipo de Usuário
              </label>
              <div className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                {isApiUser ? '🔗 Usuário API' : '👤 Usuário Normal'}
              </div>
            </div>

            {/* Seletor de sys-user - SEGUNDO CAMPO (só para usuários normais) */}
            {(() => {
              // PROTEÇÃO MÁXIMA: Primeiro verificar se é edição de usuário API
              if (isEditing && user && user.tipo_usuario === 'API') {
                logger.info('🛡️ Editando usuário API - NÃO mostrar SysUserSelector', 'FORM', {
                  userId: user.id,
                  email: user.email,
                  tipo: user.tipo_usuario
                })
                return false
              }
              
              // PROTEÇÃO CRÍTICA: Verificar múltiplas condições
              const isDefinitelyApiUser = 
                isApiUser || 
                effectiveTipoUsuario === 'API' || 
                (user && user.tipo_usuario === 'API') ||
                (user && user.api_key && user.api_key.length > 0)
              
              const shouldShowSysUser = !isDefinitelyApiUser
              
              if (user?.email === 'pontomarket@dnp.com.br') {
                logger.error('🎯 PONTOMARKET - SysUserSelector decision FINAL:', 'FORM', {
                  shouldShow: shouldShowSysUser,
                  isApiUser,
                  effectiveTipoUsuario,
                  userTipoUsuario: user?.tipo_usuario,
                  isDefinitelyApiUser,
                  hasApiKey: !!(user?.api_key)
                })
              }
              
              // PROTEÇÃO FINAL: Se for pontomarket ou sturm, NUNCA mostrar
              if (user?.email === 'pontomarket@dnp.com.br' || user?.email === 'sturm@invistto.com.br') {
                logger.error('🛡️ PROTEÇÃO ESPECIAL: Bloqueando SysUserSelector para usuário API', 'FORM', {
                  email: user?.email,
                  tipo: user?.tipo_usuario
                })
                return false
              }
              
              // PROTEÇÃO ADICIONAL: Verificar se é sturm por outros meios
              const isSturm = user?.email?.toLowerCase().includes('sturm') || 
                             user?.name?.toLowerCase().includes('sturm')
              
              if (isSturm && user?.tipo_usuario === 'API') {
                logger.error('🛡️ PROTEÇÃO STURM: Bloqueando SysUserSelector', 'FORM')
                return false
              }
              
              return shouldShowSysUser
            })() && (
              <>
                <SysUserSelector
                  selectedBaseId={selectedBaseId}
                  setValue={setValue}
                  watch={watch}
                  isOpen={isOpen}
                  allowEmpty={false} // Usuários normais DEVEM ter sys-user
                  isEditing={isEditing} // Para mostrar read-only na edição
                  currentSysUserId={user?.iduser} // ID do sys_user atual
                  currentSysUserData={user?.sysUserData} // Dados do sys_user se disponível
                />

                {/* Seletor de Lojas - apenas para usuários NORMAL */}
                <LojaSelector
                  userId={user?.id}
                  baseId={selectedBaseId || user?.baseId || 0}
                  selectedLojas={selectedLojas}
                  onChange={setSelectedLojas}
                  isEditing={isEditing}
                />
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nome
              </label>
              <input
                {...register('name')}
                type="text"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Nome completo"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email
              </label>
              <div className="relative">
                <input
                  {...register('email')}
                  type="email"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="email@exemplo.com"
                  onChange={(e) => {
                    // Remover espaços e converter para minúsculas automaticamente
                    const cleanEmail = e.target.value.toLowerCase().replace(/\s+/g, '')
                    e.target.value = cleanEmail
                    setValue('email', cleanEmail, { shouldValidate: true })
                  }}
                  onBlur={async (e) => {
                    const email = e.target.value
                    if (email && email !== user?.email) {
                      const exists = await checkEmailExists(email)
                      if (exists) {
                        setError('email', {
                          type: 'manual',
                          message: 'Este email já está em uso'
                        })
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

            {!isEditing && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Senha {isApiUser && <span className="text-xs text-gray-500">(temporária para primeiro acesso)</span>}
                </label>
                <div className="relative">
                  <input
                    {...register('password')}
                    type={showPassword ? 'text' : 'password'}
                    className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder={isApiUser ? 'Senha temporária' : 'Senha (mínimo 6 caracteres)'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="h-5 w-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
                    ) : (
                      <EyeIcon className="h-5 w-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.password.message}</p>
                )}
                {isApiUser && (
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Usuários API autenticam via API Key/Secret, mas uma senha temporária é necessária para criação.
                  </p>
                )}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Perfil
              </label>
              <select
                {...register('role')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="admin">👑 Administrador - Acesso total ao sistema</option>
                <option value="user">👤 Usuário - Acesso padrão às funcionalidades</option>
                <option value="operator">⚙️ Operador - Acesso operacional completo</option>
                <option value="viewer">👁️ Visualizador - Apenas visualização de dados</option>
              </select>
              {errors.role && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.role.message}</p>
              )}
            </div>

            {/* Selector de Pessoa do ERP - Mobile optimized */}
            <div className="col-span-2">
              <PersonSelectorMobile
                baseId={selectedBaseId || 60}
                value={watch('ID_PESSOA')}
                onChange={(personId) => setValue('ID_PESSOA', personId || undefined)}
                required={false} // Por enquanto opcional, depois será obrigatório para novos
                disabled={isEditing} // Não permite mudar pessoa após criar
                tipoUsuario={watch('tipo_usuario')}
              />
            </div>

            {/* Selector de Plano de Acesso - Mobile optimized */}
            <div className="col-span-2">
              <PlanSelectorMobile
                value={watch('plano_id')}
                onChange={(planId) => setValue('plano_id', planId)}
                disabled={false}
                required={false}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Telefone
              </label>
              <InputMask
                mask="(99) 99999-9999"
                maskChar="_"
                {...register('telefone')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="(11) 99999-9999"
              />
              {errors.telefone && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.telefone.message}</p>
              )}
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                {...register('active')}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                Usuário ativo
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Observações
              </label>
              <textarea
                {...register('obs')}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Observações sobre o usuário..."
              />
              {errors.obs && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.obs.message}</p>
              )}
            </div>

            {/* SysUserSelector movido para cima com mais protagonismo */}

            {/* Campos específicos para usuários API */}
            {isApiUser && (
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-4">
                <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                  🔧 Configurações de API
                </h3>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Rate Limit (requisições por hora)
                  </label>
                  <input
                    {...register('rate_limit_per_hour', { valueAsNumber: true })}
                    type="number"
                    min="1"
                    max="10000"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="1000"
                  />
                  {errors.rate_limit_per_hour && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.rate_limit_per_hour.message}</p>
                  )}
                </div>

                {/* Configuração de Rate Limit por Endpoint */}
                <EndpointRateLimitConfig
                  value={watch('permissoes_endpoints') || {}}
                  onChange={(value) => {
                    logger.info('🔄 Atualizando permissões de endpoints:', 'FORM', value)
                    setValue('permissoes_endpoints', value, { shouldValidate: true, shouldDirty: true })
                  }}
                  className="mt-4"
                />

                {/* API Keys para usuários existentes */}
                {isEditing && user?.api_key && (
                  <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-medium text-green-800 dark:text-green-200 flex items-center">
                        <KeyIcon className="h-4 w-4 mr-2" />
                        Credenciais API
                      </h4>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={async () => {
                          try {
                            const response = await api.post(`/usuarios/${user.id}/regenerate-api-key`)
                            if (response.data.success) {
                              toast.success('🔄 Novas credenciais geradas!')
                              // Mostrar as novas credenciais
                              alert(`Nova API Key: ${response.data.data.api_key}\nNovo Secret: ${response.data.data.api_secret}`)
                            }
                          } catch {
                            toast.error('Erro ao regenerar credenciais')
                          }
                        }}
                      >
                        <ArrowPathIcon className="h-3 w-3 mr-1" />
                        Regenerar
                      </Button>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-green-700 dark:text-green-300 font-medium">API Key:</span>
                        <code className="ml-2 px-2 py-1 bg-green-100 dark:bg-green-800 rounded text-xs">
                          {user.api_key}
                        </code>
                      </div>
                      <p className="text-xs text-green-600 dark:text-green-400">
                        ⚠️ Guarde essas credenciais em local seguro. O Secret completo só é visível na criação.
                      </p>
                    </div>
                  </div>
                )}

                {/* Mensagem para novos usuários */}
                {!isEditing && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      💡 <strong>API Key e Secret</strong> serão gerados automaticamente após criar o usuário.
                    </p>
                  </div>
                )}

                {/* Gerenciador de Tokens de Carga Inicial */}
                {isEditing && user && (
                  <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-600">
                    <ApiTokenManager
                      userId={user.id}
                      baseId={user.baseId}
                      permissoesEndpoints={watch('permissoes_endpoints') || {}}
                    />
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
              {/* Debug Mode */}
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={debugMode}
                  onChange={(e) => {
                    setDebugMode(e.target.checked)
                    localStorage.setItem('userFormDebugMode', e.target.checked.toString())
                  }}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mr-2"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  🐛 Modo Debug (mostra detalhes técnicos)
                </span>
              </label>

              {/* Botões */}
              <div className="flex space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={isLoading}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="flex items-center gap-2"
                >
                  {isLoading && <LoadingSpinner size="sm" />}
                  {isEditing ? 'Atualizar' : 'Criar'}
                </Button>
              </div>
            </div>
          </form>
        </Dialog.Panel>
      </div>
    </Dialog>
  )
}