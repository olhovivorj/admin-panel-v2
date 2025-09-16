import { useState, useEffect } from 'react'
import { UseFormSetValue, UseFormWatch } from 'react-hook-form'
import { useQuery } from '@tanstack/react-query'
import {
  InformationCircleIcon,
  ExclamationTriangleIcon,
  PencilIcon,
  CheckCircleIcon,
  BuildingStorefrontIcon,
} from '@heroicons/react/24/outline'
import { SearchableSelect, SelectOption } from '@/components/common/SearchableSelect'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { useBase } from '@/contexts/BaseContext'
import { usersService } from '@/services/users'
import api from '@/services/api'
import { logger } from '@/utils/logger'

interface CreateUserFormData {
  name: string
  email: string
  password: string
  role: 'admin' | 'user' | 'viewer'
  sysUserId?: number
}

interface SysUser {
  baseId: number
  idUser: number
  idEmpresa?: number
  name: string
  completeName: string
  supervisor: boolean
  grupo: string
  email?: string
  hasAriUser: boolean
}

interface Loja {
  id: number
  nome: string
  cidade?: string | null
  uf?: string | null
}

interface SysUserSelectorProps {
  selectedBaseId: number | null
  setValue: UseFormSetValue<CreateUserFormData>
  watch: UseFormWatch<CreateUserFormData>
  isOpen: boolean
  allowEmpty?: boolean // Se permite criar usuário sem vincular ao ERP
  isEditing?: boolean // Se está editando (read-only)
  currentSysUserId?: number // ID do sys-user atual (para edição)
  currentSysUserData?: any // Dados do sys-user atual
}

export function SysUserSelector({ selectedBaseId, setValue, watch, isOpen, allowEmpty = false, isEditing = false, currentSysUserData }: SysUserSelectorProps) {
  const [selectedSysUser, setSelectedSysUser] = useState<SysUser | null>(null)
  const [editSysUser, setEditSysUser] = useState(false)
  const [sysUserData, setSysUserData] = useState({
    completeName: '',
    email: '',
    grupo: '',
    supervisor: false,
  })
  const [loadedSysUser, setLoadedSysUser] = useState<any>(null)
  const { bases } = useBase()

  const watchedSysUserId = watch('sysUserId') || watch('iduser')

  // PROTEÇÃO: Verificar se o componente deve estar visível
  // Este componente só deve ser usado para usuários NORMAL
  const [shouldBeVisible, setShouldBeVisible] = useState(true)
  
  // PROTEÇÃO CRÍTICA: Verificar email pontomarket
  const watchedEmail = watch('email')
  const isPontomarket = watchedEmail === 'pontomarket@dnp.com.br'
  
  useEffect(() => {
    // Verificar no localStorage se estamos editando um usuário API
    const editingUserType = watch('tipo_usuario')
    if (editingUserType === 'API' || isPontomarket) {
      logger.error('⚠️ SysUserSelector renderizado para usuário API! Isto não deveria acontecer.')
      setShouldBeVisible(false)
    }
  }, [watch, isPontomarket])

  // PROTEÇÃO CRÍTICA: Determinar se deve estar habilitado
  const isEnabled = shouldBeVisible && !isPontomarket && 
                   watch('tipo_usuario') !== 'API' &&
                   !watch('email')?.toLowerCase().includes('sturm')
  
  // Buscar sys_users disponíveis (SEM filtro de loja)
  const { data: sysUsers, isLoading: loadingSysUsers, error } = useQuery({
    queryKey: ['sys-users-available', selectedBaseId],
    queryFn: async () => {
      logger.info('🔍 Carregando sys-users para baseId:', selectedBaseId)
      
      // PROTEÇÃO ADICIONAL
      if (!shouldBeVisible || !isEnabled) {
        logger.warn('⚠️ SysUserSelector não deveria estar fazendo requisições!')
        return []
      }
      
      try {
        const params: any = { baseId: selectedBaseId }
        const response = await api.get('/usuarios/sys-users/available', { params })
        logger.info('✅ Sys-users carregados:', response.data.data)
        return response.data.data as SysUser[]
      } catch (error) {
        logger.warn('⚠️ Erro ao carregar sys-users:', error)
        
        // Se for 401, propagar o erro para redirecionar ao login
        if ((error as any).response?.status === 401) {
          throw error
        }
        
        // Para outros erros (403, 400, etc), retornar array vazio
        logger.info('💡 Retornando array vazio devido ao erro')
        return []
      }
    },
    enabled: isOpen && !!selectedBaseId && shouldBeVisible && isEnabled,
    refetchOnMount: true, // Sempre recarregar ao montar
    retry: false, // Não tentar novamente se der erro
  })

  // Buscar lojas do sys_user selecionado
  const { data: sysUserLojas, isLoading: loadingLojas } = useQuery({
    queryKey: ['sys-user-lojas', selectedBaseId, selectedSysUser?.idUser],
    queryFn: async () => {
      if (!selectedBaseId || !selectedSysUser?.idUser) return []
      
      logger.info('🏢 Buscando lojas do sys_user:', selectedSysUser.idUser)
      const response = await usersService.getLojasBySysUser(selectedBaseId, selectedSysUser.idUser)
      logger.info('✅ Lojas carregadas:', response.data)
      return response.data as Loja[]
    },
    enabled: !!selectedBaseId && !!selectedSysUser?.idUser,
  })

  // Debug da query
  logger.debug('🔍 SysUserSelector Debug:', {
    isOpen,
    selectedBaseId,
    enabled: isOpen && !!selectedBaseId && shouldBeVisible && isEnabled,
    shouldBeVisible,
    loadingSysUsers,
    sysUsersCount: sysUsers?.length || 0,
    error: error?.message,
    tipoUsuario: watch('tipo_usuario'),
  })
  
  // PROTEÇÃO FINAL: Se não deve ser visível ou é pontomarket ou é API, retornar null
  if (!shouldBeVisible || isPontomarket || !isEnabled || watch('tipo_usuario') === 'API') {
    logger.warn('⚠️ SysUserSelector retornando null - usuário API detectado!', {
      shouldBeVisible,
      isPontomarket,
      isEnabled,
      tipo: watch('tipo_usuario'),
      email: watch('email')
    })
    return null
  }

  // Buscar dados do sys-user quando editando
  useEffect(() => {
    if (isEditing && watchedSysUserId && sysUsers && sysUsers.length > 0) {
      // Procurar nos sys-users carregados
      const foundUser = sysUsers.find(u => u.idUser === watchedSysUserId)
      if (foundUser) {
        setLoadedSysUser(foundUser)
        setSelectedSysUser(foundUser) // Também definir como selecionado para buscar lojas
      } else if (currentSysUserData) {
        // Se não encontrar nos disponíveis mas temos dados do prop, usar eles
        const basicUser = {
          idUser: watchedSysUserId,
          name: currentSysUserData.name || `Usuário ERP ${watchedSysUserId}`,
          completeName: currentSysUserData.completeName || currentSysUserData.name || `Usuário ERP ${watchedSysUserId}`,
          grupo: currentSysUserData.grupo || '',
          supervisor: currentSysUserData.supervisor || false,
          email: currentSysUserData.email || '',
        }
        setLoadedSysUser(basicUser)
        setSelectedSysUser(basicUser as SysUser)
      } else {
        // Se não encontrar e não temos dados, criar um objeto básico
        const basicUser = {
          idUser: watchedSysUserId,
          name: `Usuário ERP ${watchedSysUserId}`,
          completeName: `Usuário ERP ${watchedSysUserId}`,
          grupo: '',
          supervisor: false,
        }
        setLoadedSysUser(basicUser)
        setSelectedSysUser(basicUser as SysUser)
      }
    }
  }, [isEditing, watchedSysUserId, sysUsers, currentSysUserData])

  // Converter sys_users para opções do select
  const sysUserOptions: SelectOption[] = [
    // Adicionar opção "Nenhum" se permitido (para usuários API)
    ...(allowEmpty ? [{
      value: '',
      label: 'Nenhum (usuário API externo)',
      description: 'Não vincular a nenhum usuário do ERP',
      disabled: false,
    }] : []),
    // Sys-users disponíveis
    ...(sysUsers || [])
      .map(user => {
        // Buscar nome da base
        const baseName = bases.find(base => base.baseId === user.baseId)?.NOME || bases.find(base => base.baseId === user.baseId)?.nome || `Base ${user.baseId}`

        return {
          value: user.idUser.toString(),
          label: user.completeName || user.name,
          description: `${user.name} • ${baseName} • ${user.grupo}${user.supervisor ? ' • Supervisor' : ''}${user.hasAriUser ? ' • JÁ POSSUI USUÁRIO ARI' : ''}`,
          disabled: user.hasAriUser,
        }
      }),
  ]

  const handleSysUserChange = (option: SelectOption | null) => {
    if (!option || option.value === '') {
      setSelectedSysUser(null)
      setValue('sysUserId', undefined)
      return
    }

    const sysUser = sysUsers?.find(u => u.idUser.toString() === option.value)
    if (sysUser) {
      setSelectedSysUser(sysUser)
      setValue('sysUserId', sysUser.idUser)

      // Preencher dados se não estão preenchidos
      if (!watch('name')) {
        setValue('name', sysUser.completeName || sysUser.name)
      }
      if (!watch('email') && sysUser.email) {
        setValue('email', sysUser.email)
      }

      // Definir dados para edição
      setSysUserData({
        completeName: sysUser.completeName || '',
        email: sysUser.email || '',
        grupo: sysUser.grupo || '',
        supervisor: sysUser.supervisor || false,
      })
    }
  }

  const handleSysUserDataChange = (field: string, value: any) => {
    setSysUserData(prev => ({ ...prev, [field]: value }))
  }

  const handleSaveSysUser = async () => {
    if (!selectedSysUser) {
      return
    }

    try {
      await api.put(`/admin/sys-users/${selectedSysUser.idUser}`, {
        ...sysUserData,
        baseId: selectedBaseId,
      })

      setEditSysUser(false)
      // Refetch sys users to get updated data
      // queryClient.invalidateQueries(['sys-users-available'])
    } catch (error) {
      console.error('Erro ao atualizar sys_user:', error)
    }
  }

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Usuário do Sistema ERP
        </label>
      </div>

      {/* Selector de sys_user */}
      <div>
        {isEditing ? (
          // Modo read-only para edição - mostrar nome ao invés de ID
          <div className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
            {watchedSysUserId && loadedSysUser
              ? `${loadedSysUser.completeName || loadedSysUser.name || `ID: ${watchedSysUserId}`}`
              : watchedSysUserId
                ? `Usuário ERP ID: ${watchedSysUserId}`
                : 'Nenhum usuário ERP vinculado'
            }
          </div>
        ) : (
          // Modo normal para criação
          loadingSysUsers ? (
            <div className="flex items-center justify-center py-4">
              <LoadingSpinner size="sm" />
              <span className="ml-2 text-sm text-gray-500">Carregando usuários...</span>
            </div>
          ) : (
            <SearchableSelect
              options={sysUserOptions}
              value={watchedSysUserId ? sysUserOptions.find(opt => opt.value === watchedSysUserId.toString()) || null : null}
              onChange={handleSysUserChange}
              placeholder={allowEmpty
                ? 'Buscar usuário do ERP (ou deixe vazio para API)...'
                : 'Buscar e selecionar usuário do ERP...'
              }
              noOptionsMessage={sysUsers?.every(u => u.hasAriUser) 
                ? "Todos os usuários do ERP já possuem conta ARI" 
                : "Nenhum usuário disponível do ERP"
              }
              isDisabled={loadingSysUsers}
            />
          )
        )}
      </div>

      {/* Informações do sys_user selecionado */}
      {selectedSysUser && (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white">
              Usuário Selecionado
            </h4>
            <button
              type="button"
              onClick={() => setEditSysUser(!editSysUser)}
              className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center"
            >
              {editSysUser ? (
                <>
                  <CheckCircleIcon className="h-4 w-4 mr-1" />
                  Salvar
                </>
              ) : (
                <>
                  <PencilIcon className="h-4 w-4 mr-1" />
                  Editar
                </>
              )}
            </button>
          </div>

          {editSysUser ? (
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                  Nome Completo
                </label>
                <input
                  type="text"
                  value={sysUserData.completeName}
                  onChange={(e) => handleSysUserDataChange('completeName', e.target.value)}
                  className="w-full px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={sysUserData.email}
                  onChange={(e) => handleSysUserDataChange('email', e.target.value)}
                  className="w-full px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                  Grupo
                </label>
                <input
                  type="text"
                  value={sysUserData.grupo}
                  onChange={(e) => handleSysUserDataChange('grupo', e.target.value)}
                  className="w-full px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                />
              </div>
              <label className="flex items-center text-sm">
                <input
                  type="checkbox"
                  checked={sysUserData.supervisor}
                  onChange={(e) => handleSysUserDataChange('supervisor', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mr-2"
                />
                Supervisor
              </label>
              <button
                type="button"
                onClick={handleSaveSysUser}
                className="text-sm bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700"
              >
                Salvar Alterações
              </button>
            </div>
          ) : (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">ID:</span>
                <span className="text-gray-900 dark:text-white">{selectedSysUser.idUser}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Nome:</span>
                <span className="text-gray-900 dark:text-white">{selectedSysUser.completeName || selectedSysUser.name}</span>
              </div>
              {selectedSysUser.email && (
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Email:</span>
                  <span className="text-gray-900 dark:text-white">{selectedSysUser.email}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Grupo:</span>
                <span className="text-gray-900 dark:text-white">{selectedSysUser.grupo}</span>
              </div>
              {selectedSysUser.supervisor && (
                <div className="flex items-center text-green-600 dark:text-green-400">
                  <CheckCircleIcon className="h-4 w-4 mr-1" />
                  Supervisor
                </div>
              )}
            </div>
          )}

          {selectedSysUser.hasAriUser && (
            <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg">
              <div className="flex items-center text-red-600 dark:text-red-400">
                <ExclamationTriangleIcon className="h-5 w-5 mr-2 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Este usuário já possui conta ARI vinculada!</p>
                  <p className="text-xs mt-1">Não é possível criar outra conta para o mesmo usuário do ERP.</p>
                </div>
              </div>
            </div>
          )}

          {/* Lojas do sys_user - Versão Discreta */}
          {(selectedSysUser.idUser || isEditing) && (
            <div className="mt-3">
              {loadingLojas ? (
                <div className="flex items-center text-xs text-gray-500">
                  <LoadingSpinner size="sm" className="h-3 w-3" />
                  <span className="ml-1">Carregando lojas...</span>
                </div>
              ) : sysUserLojas && sysUserLojas.length > 0 ? (
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  <BuildingStorefrontIcon className="h-3 w-3 inline mr-1" />
                  <span className="font-medium">{sysUserLojas.length} loja{sysUserLojas.length > 1 ? 's' : ''}</span>
                  {sysUserLojas.length <= 3 ? (
                    <span>: {sysUserLojas.map(loja => {
                      // Abreviação inteligente do nome da loja
                      const palavras = loja.nome.split(' ')
                      if (palavras.length > 2) {
                        return palavras.map(p => p[0]).join('').toUpperCase()
                      }
                      return loja.nome.substring(0, 10) + (loja.nome.length > 10 ? '...' : '')
                    }).join(', ')}</span>
                  ) : (
                    <span></span>
                  )}
                  
                  {/* Botão para expandir detalhes */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault()
                      const details = e.currentTarget.nextElementSibling
                      if (details) {
                        details.classList.toggle('hidden')
                      }
                    }}
                    className="ml-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 underline"
                  >
                    ver detalhes
                  </button>
                  
                  {/* Detalhes expandíveis */}
                  <div className="hidden mt-2 p-2 bg-gray-50 dark:bg-gray-900 rounded-lg">
                    {sysUserLojas.map((loja) => (
                      <div key={loja.id} className="flex items-start py-1">
                        <BuildingStorefrontIcon className="h-3 w-3 text-gray-400 dark:text-gray-500 mt-0.5 mr-1 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-xs text-gray-700 dark:text-gray-300">{loja.nome}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                  <BuildingStorefrontIcon className="h-3 w-3 inline mr-1" />
                  Sem lojas vinculadas
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}