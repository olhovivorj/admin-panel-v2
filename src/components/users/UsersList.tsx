import { useState, useEffect, Fragment } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Menu, Transition } from '@headlessui/react'
import toast from 'react-hot-toast'
import {
  PencilIcon,
  TrashIcon,
  EyeIcon,
  UserPlusIcon,
  KeyIcon,
  CheckCircleIcon,
  XCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ArrowPathIcon,
  BuildingStorefrontIcon,
  EllipsisVerticalIcon,
  EllipsisHorizontalIcon,
  ViewColumnsIcon,
  Bars3Icon,
  ArrowDownTrayIcon,
  DocumentTextIcon,
  TableCellsIcon,
  CogIcon,
} from '@heroicons/react/24/outline'
import { usersService, UsuarioResponseDto } from '@/services/users'
import { basesService } from '@/services/bases'
import { UserFormModalSimple } from './UserFormModalSimple'
import { ApiUserFormModal } from './ApiUserFormModal'
import { UserDetailModal } from './UserDetailModal'
import { EndpointConfigModal } from './EndpointConfigModal'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { Button } from '@/components/common/Button'
import { useBase } from '@/contexts/BaseContext'
import { useOperationToast } from '@/hooks/useOperationToast'
import { cn } from '@/utils/cn'
import { logger } from '@/utils/logger'
import { ExcelExporter, ExcelColumn } from '@/utils/excelExport'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface UsersListProps {
  filters?: {
    search?: string
    role?: string
    active?: boolean
  }
  selectedBaseId: number // baseId obrigatório (política de base única)
}

export function UsersList({ filters, selectedBaseId }: UsersListProps) {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [showFormModal, setShowFormModal] = useState(false)
  const [showApiFormModal, setShowApiFormModal] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showEndpointConfigModal, setShowEndpointConfigModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState<UsuarioResponseDto | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [userLojas, setUserLojas] = useState<Map<number, { acessoTotal: boolean; count: number }>>(new Map())
  const [compactActions, setCompactActions] = useState(() => {
    // Carrega preferência do localStorage
    const saved = localStorage.getItem('@ari:compactActions')
    return saved === 'true'
  })

  // Salva preferência quando muda
  useEffect(() => {
    localStorage.setItem('@ari:compactActions', compactActions.toString())
  }, [compactActions])

  const limit = 10

  // Query para buscar usuários com baseId obrigatório
  const {
    data: usersResponse,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['users', page, limit, filters, selectedBaseId],
    queryFn: async () => {
      logger.info(`🔍 [UsersList] Carregando usuários - Página ${page}, Base ${selectedBaseId}`, 'USER')
      logger.info('🔍 [UsersList] Query habilitada:', {
        enabled: !!selectedBaseId,
        selectedBaseId,
        page,
        limit,
        filters,
      }, 'USER')
      const result = await usersService.getUsers({
        page,
        limit,
        ...filters,
        baseId: selectedBaseId, // Sempre filtrar por baseId (política obrigatória)
      })

      // DEBUG: Mostrar primeiro usuário para verificar dados
      if (result?.data?.length > 0) {
        const firstUser = result.data[0]
        logger.info('🔍 DEBUG - Primeiro usuário da lista:', {
          id: firstUser.id,
          name: firstUser.name,
          telefone: firstUser.telefone,
          obs: firstUser.obs,
        }, 'USER')
      }

      return result
    },
    staleTime: 1000 * 60 * 5, // 5 minutos - cache mais longo para performance
    gcTime: 1000 * 60 * 10, // 10 minutos no cache
    enabled: !!selectedBaseId, // Só carregar se tiver baseId selecionado
    refetchOnWindowFocus: false, // Não recarregar ao focar janela
    onSuccess: (data) => {
      logger.info(`✅ [UsersList] ${data?.data?.length || 0} usuários carregados da base ${selectedBaseId}`, 'USER')
    },
    onError: (error) => {
      logger.error('❌ [UsersList] Erro ao carregar usuários:', error, 'USER')
    },
  })

  // Debug adicional
  logger.info('🔍 [UsersList] Estado da query:', {
    selectedBaseId,
    isLoading,
    error: error?.message,
    dataLength: usersResponse?.data?.length,
    enabled: !!selectedBaseId,
  }, 'USER')

  // Mutations usando o hook personalizado
  const deleteMutation = useOperationToast({
    mutationFn: usersService.deleteUser,
    loadingMessage: 'Removendo usuário...',
    successMessage: 'Usuário removido com sucesso!',
    errorMessage: (error: any) => error.response?.data?.message || 'Erro ao remover usuário',
    toastId: (userId) => `delete-${userId}`,
    onSuccess: async () => {
      // Invalidar queries
      await queryClient.invalidateQueries({ queryKey: ['users'] })
      await queryClient.invalidateQueries({ queryKey: ['user-stats'] })
      
      // Forçar refetch das estatísticas com a base correta
      await queryClient.refetchQueries({
        queryKey: ['user-stats', selectedBaseId],
        type: 'active',
      })
      
      // Refetch da lista de usuários
      await queryClient.refetchQueries({
        queryKey: ['users', page, limit, filters, selectedBaseId],
        type: 'active',
      })
      
      // Forçar refetch usando o método direto
      await refetch()
    },
  })

  const [showApiKeysModal, setShowApiKeysModal] = useState(false)
  const [newApiKeys, setNewApiKeys] = useState<{ apiKey: string; apiSecret: string } | null>(null)

  const regenerateApiKeyMutation = useOperationToast({
    mutationFn: async (userId: number) => {
      logger.info('🔑 Regenerando API Key:', 'USER', { userId })
      return await usersService.regenerateApiKey(userId)
    },
    successMessage: (data: any) => {
      logger.info('📦 Dados retornados da API:', 'USER', data)
      
      // O backend pode retornar em data.data ou diretamente em data
      const apiData = data.data || data
      
      // Tentar diferentes formatos de resposta
      const apiKey = apiData.apiKey || apiData.api_key || apiData.newApiKey
      const apiSecret = apiData.apiSecret || apiData.api_secret || apiData.newApiSecret
      
      logger.info('🔍 Tentando extrair credenciais:', 'USER', {
        apiData,
        apiKey,
        apiSecret,
        keys: Object.keys(apiData)
      })
      
      if (!apiKey || !apiSecret) {
        logger.error('❌ Credenciais não encontradas na resposta:', 'USER', {
          data,
          apiData,
          keys: Object.keys(apiData)
        })
        return 'API Key regenerada, mas as credenciais não foram retornadas corretamente'
      }
      
      // Salvar as credenciais para mostrar no modal
      setNewApiKeys({ apiKey, apiSecret })
      setShowApiKeysModal(true)
      
      // Criar conteúdo formatado para copiar
      const credentials = `API Key: ${apiKey}\nAPI Secret: ${apiSecret}`
      
      // Tentar copiar para clipboard
      navigator.clipboard.writeText(credentials).then(() => {
        logger.info('✅ Credenciais copiadas para clipboard', 'USER')
      }).catch(err => {
        logger.error('❌ Erro ao copiar credenciais:', 'USER', err)
      })
      
      return 'API Key regenerada com sucesso! As novas credenciais estão sendo exibidas.'
    },
    errorMessage: (error: any) => error.response?.data?.message || 'Erro ao regenerar API Key',
    toastId: (userId) => `regenerate-${userId}`,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })

  const toggleStatusMutation = useOperationToast({
    mutationFn: usersService.toggleUserStatus,
    loadingMessage: 'Alterando status...',
    successMessage: (returnedData) => {
      logger.info('✅ Toggle status sucesso - dados retornados:', returnedData, 'USER')
      
      // Debug: ver exatamente o que está sendo retornado
      const status = returnedData.status
      const ativo = returnedData.ativo
      
      logger.info('🔍 Debug mensagem sucesso:', 'USER', {
        status,
        ativo,
        statusIsActive: status === 'active',
        ativoIsTrue: ativo === true,
      })
      
      // Determinar se foi ativado ou inativado baseado nos dados retornados
      const foiAtivado = status === 'active' || ativo === true
      return `Usuário ${foiAtivado ? 'ativado' : 'inativado'} com sucesso!`
    },
    errorMessage: (error: any) => error.response?.data?.message || 'Erro ao alterar status',
    toastId: (userId) => `toggle-${userId}`,
    onSuccess: async (data) => {
      logger.info('🔄 onSuccess do toggleStatusMutation', 'USER', { data })
      
      // Pequeno delay para garantir que o backend processou
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Invalidar todas as queries relacionadas
      await queryClient.invalidateQueries({ queryKey: ['users'] })
      await queryClient.invalidateQueries({ queryKey: ['user-stats'] })
      
      // Forçar refetch imediato
      await refetch()
    },
  })

  const resetPasswordMutation = useOperationToast({
    mutationFn: usersService.resetPassword,
    loadingMessage: 'Resetando senha...',
    successMessage: 'Senha resetada com sucesso!',
    errorMessage: (error: any) => error.response?.data?.message || 'Erro ao resetar senha',
    toastId: (userId) => `reset-${userId}`,
  })

  // Definir colunas para exportação
  const exportColumns: ExcelColumn[] = [
    { key: 'id', label: 'ID', width: 10 },
    { key: 'name', label: 'Nome', width: 30 },
    { key: 'email', label: 'Email', width: 35 },
    { key: 'telefone', label: 'Telefone', width: 15 },
    { 
      key: 'tipo_usuario', 
      label: 'Tipo', 
      width: 15,
      formatter: (value) => value === 'API' ? 'API' : 'Normal'
    },
    { 
      key: 'role', 
      label: 'Perfil', 
      width: 15,
      formatter: (value) => {
        const roles = {
          admin: 'Administrador',
          user: 'Usuário',
          viewer: 'Visualizador'
        }
        return roles[value as keyof typeof roles] || value
      }
    },
    { 
      key: 'status', 
      label: 'Status', 
      width: 10,
      formatter: (value) => value === 'active' ? 'Ativo' : 'Inativo'
    },
    { 
      key: 'createdAt', 
      label: 'Criado em', 
      width: 20,
      formatter: (value) => value ? format(new Date(value), 'dd/MM/yyyy HH:mm', { locale: ptBR }) : ''
    },
    { 
      key: 'lastLogin', 
      label: 'Último acesso', 
      width: 20,
      formatter: (value) => value ? format(new Date(value), 'dd/MM/yyyy HH:mm', { locale: ptBR }) : 'Nunca'
    },
    { key: 'obs', label: 'Observações', width: 40 },
  ]

  const handleExportCSV = () => {
    if (!usersResponse?.data || usersResponse.data.length === 0) {
      operationToast.warning('Nenhum usuário para exportar')
      return
    }

    const filename = `usuarios_${format(new Date(), 'yyyyMMdd_HHmmss')}.csv`
    ExcelExporter.downloadCSV(filename, usersResponse.data, exportColumns)
    operationToast.success(`Arquivo ${filename} baixado com sucesso`)
  }

  const handleExportExcel = () => {
    if (!usersResponse?.data || usersResponse.data.length === 0) {
      operationToast.warning('Nenhum usuário para exportar')
      return
    }

    const filename = `usuarios_${format(new Date(), 'yyyyMMdd_HHmmss')}.xlsx`
    ExcelExporter.downloadXLSX(filename, usersResponse.data, exportColumns)
    operationToast.success(`Arquivo ${filename} baixado com sucesso`)
  }

  const handleEdit = async (user: UsuarioResponseDto) => {
    try {
      // Adicionar pequeno delay para garantir que o backend processou
      if (user.createdAt && new Date(user.createdAt).getTime() > Date.now() - 5000) {
        logger.info('⏳ Usuário recém-criado, aguardando 500ms', 'USER')
        await new Promise(resolve => setTimeout(resolve, 500))
      }
      
      // Buscar dados atualizados do usuário antes de editar
      logger.info('🔍 Buscando dados atualizados do usuário para edição', 'USER', {
        id: user.id,
        tipo_usuario: user.tipo_usuario,
      })
      const updatedUser = await usersService.getUser(user.id)
      logger.info('✅ Dados do usuário carregados:', 'USER', updatedUser)
      setSelectedUser(updatedUser)
      setIsEditing(true)
      
      // Decidir qual modal abrir baseado no tipo
      if (updatedUser.tipo_usuario === 'API') {
        setShowApiFormModal(true)
      } else {
        setShowFormModal(true)
      }
    } catch (error) {
      logger.error('❌ Erro ao buscar usuário para edição:', error, 'USER')
      // Se falhar, usar os dados que já temos
      setSelectedUser(user)
      setIsEditing(true)
      
      // Decidir qual modal abrir baseado no tipo
      if (user.tipo_usuario === 'API') {
        setShowApiFormModal(true)
      } else {
        setShowFormModal(true)
      }
    }
  }

  const handleView = (user: UsuarioResponseDto) => {
    setSelectedUser(user)
    setShowDetailModal(true)
  }

  const handleConfigureApi = async (user: UsuarioResponseDto) => {
    try {
      // Buscar dados atualizados do usuário antes de abrir o modal
      logger.info('🔍 Buscando dados atualizados para configuração API', 'USER', { userId: user.id })
      const updatedUser = await usersService.getUser(user.id)
      logger.info('✅ Dados atualizados carregados:', 'USER', { 
        userId: updatedUser.id,
        permissoes: updatedUser.permissoes_endpoints 
      })
      setSelectedUser(updatedUser)
      setShowEndpointConfigModal(true)
    } catch (error) {
      logger.error('❌ Erro ao buscar dados atualizados do usuário:', 'USER', error)
      // Se falhar, usar os dados antigos
      setSelectedUser(user)
      setShowEndpointConfigModal(true)
    }
  }

  const handleDelete = async (user: UsuarioResponseDto) => {
    if (window.confirm(`Tem certeza que deseja remover o usuário "${user.name}"?`)) {
      try {
        await deleteMutation.mutateAsync(user.id)
        // Forçar atualização imediata da lista
        refetch()
      } catch (error) {
        // Erro já é tratado pelo useOperationToast
      }
    }
  }

  const handleRegenerateApiKey = async (user: UsuarioResponseDto) => {
    logger.info('🔑 Regenerar API Key iniciado:', 'USER', {
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
    })
    
    if (window.confirm(`Tem certeza que deseja regenerar a API Key do usuário "${user.name}"?\n\nAs credenciais antigas serão invalidadas imediatamente.`)) {
      try {
        await regenerateApiKeyMutation.mutateAsync(user.id)
      } catch (error) {
        logger.error('❌ Erro ao regenerar API Key:', 'USER', error)
      }
    }
  }

  const handleToggleStatus = async (user: UsuarioResponseDto) => {
    const isCurrentlyActive = user.status === 'active'
    const action = isCurrentlyActive ? 'inativar' : 'ativar'
    
    logger.info('🎯 Toggle status iniciado:', 'USER', {
      userId: user.id,
      userName: user.name,
      currentStatus: user.status,
      isCurrentlyActive,
      action,
    })
    
    if (window.confirm(`Tem certeza que deseja ${action} o usuário "${user.name}"?`)) {
      try {
        const result = await toggleStatusMutation.mutateAsync(user.id)
        logger.info('✅ Toggle status resultado:', 'USER', result)
        
        // Forçar atualização imediata
        logger.info('🔄 Forçando refetch após toggle status', 'USER')
        await refetch()
      } catch (error) {
        logger.error('❌ Erro ao alternar status:', error, 'USER')
      }
    }
  }

  const handleResetPassword = (user: UsuarioResponseDto) => {
    if (window.confirm(`Tem certeza que deseja resetar a senha do usuário "${user.name}"?`)) {
      resetPasswordMutation.mutate(user.id)
    }
  }

  const handleCreateNew = (type: 'NORMAL' | 'API') => {
    setSelectedUser(null)
    setIsEditing(false)
    // Configurar o tipo inicial no modal através de um estado
    localStorage.setItem('newUserType', type)
    setShowCreateModal(true)
  }

  const getRoleBadge = (role: string) => {
    const roleConfig = {
      admin: { label: 'Administrador', color: 'bg-red-100 text-red-800' },
      ADMIN: { label: 'Administrador', color: 'bg-red-100 text-red-800' },
      user: { label: 'Usuário', color: 'bg-blue-100 text-blue-800' },
      USER: { label: 'Usuário', color: 'bg-blue-100 text-blue-800' },
      operator: { label: 'Operador', color: 'bg-green-100 text-green-800' },
      OPERATOR: { label: 'Operador', color: 'bg-green-100 text-green-800' },
      viewer: { label: 'Visualizador', color: 'bg-gray-100 text-gray-800' },
      VIEWER: { label: 'Visualizador', color: 'bg-gray-100 text-gray-800' },
    }

    const config = roleConfig[role as keyof typeof roleConfig] || { label: role || 'Indefinido', color: 'bg-gray-100 text-gray-800' }

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    )
  }

  // Usar bases do BaseContext (já otimizado com cache)
  const { bases } = useBase()

  const getBaseName = (baseId: number) => {
    // Mapear nomes conhecidos enquanto não temos as bases carregadas
    const baseNames: Record<number, string> = {
      1: 'INVISTTO',
      2: 'DNP',
      49: 'Qualina'
    }
    
    // Tentar encontrar no array de bases primeiro
    const base = bases.find(b => (b.ID_BASE || b.baseId) === baseId)
    if (base) {
      return base.NOME || base.BASE || baseNames[baseId] || `Base ${baseId}`
    }
    
    // Fallback para nomes conhecidos
    return baseNames[baseId] || `Base ${baseId}`
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Erro ao carregar usuários</p>
        <Button
          onClick={() => queryClient.invalidateQueries({ queryKey: ['users'] })}
          className="mt-4"
        >
          Tentar novamente
        </Button>
      </div>
    )
  }

  const users = usersResponse?.data?.users || usersResponse?.data || []
  const total = usersResponse?.data?.total || usersResponse?.total || 0
  const totalPages = Math.ceil(total / limit)

  return (
    <>
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Usuários ARI
            </h3>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setCompactActions(!compactActions)}
                variant="outline"
                size="sm"
                title={compactActions ? "Mostrar todos os ícones" : "Usar menu dropdown"}
                className="flex items-center gap-2"
              >
                {compactActions ? (
                  <>
                    <ViewColumnsIcon className="h-4 w-4" />
                    <span className="hidden sm:inline text-xs">Expandir</span>
                  </>
                ) : (
                  <>
                    <Bars3Icon className="h-4 w-4" />
                    <span className="hidden sm:inline text-xs">Compactar</span>
                  </>
                )}
              </Button>
              <Button
                onClick={() => refetch()}
                variant="outline"
                size="sm"
                disabled={isLoading}
              >
                <ArrowPathIcon className="h-4 w-4 mr-2" />
                Atualizar
              </Button>
              <Menu as="div" className="relative inline-block text-left">
                <div>
                  <Menu.Button className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                    <ArrowDownTrayIcon className="h-4 w-4" />
                    Exportar
                  </Menu.Button>
                </div>
                <Transition
                  as={Fragment}
                  enter="transition ease-out duration-100"
                  enterFrom="transform opacity-0 scale-95"
                  enterTo="transform opacity-100 scale-100"
                  leave="transition ease-in duration-75"
                  leaveFrom="transform opacity-100 scale-100"
                  leaveTo="transform opacity-0 scale-95"
                >
                  <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white dark:bg-gray-800 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                    <div className="py-1">
                      <Menu.Item>
                        {({ active }) => (
                          <button
                            onClick={handleExportCSV}
                            className={cn(
                              active ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-200',
                              'group flex items-center px-4 py-2 text-sm w-full'
                            )}
                          >
                            <DocumentTextIcon className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500 dark:group-hover:text-gray-300" />
                            Exportar CSV
                          </button>
                        )}
                      </Menu.Item>
                      <Menu.Item>
                        {({ active }) => (
                          <button
                            onClick={handleExportExcel}
                            className={cn(
                              active ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-200',
                              'group flex items-center px-4 py-2 text-sm w-full'
                            )}
                          >
                            <TableCellsIcon className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500 dark:group-hover:text-gray-300" />
                            Exportar Excel
                          </button>
                        )}
                      </Menu.Item>
                    </div>
                  </Menu.Items>
                </Transition>
              </Menu>
              
              <Button
                onClick={() => handleCreateNew('NORMAL')}
                className="flex items-center gap-2"
                variant="primary"
              >
                <UserPlusIcon className="h-4 w-4" />
                Novo Usuário Normal
              </Button>
              <Button
                onClick={() => handleCreateNew('API')}
                className="flex items-center gap-2"
                variant="secondary"
              >
                <KeyIcon className="h-4 w-4" />
                Novo Usuário API
              </Button>
            </div>
          </div>
          {total > 0 && (
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {total} usuário{total !== 1 ? 's' : ''} encontrado{total !== 1 ? 's' : ''}
            </p>
          )}
        </div>

        {/* Lista */}
        {users.length === 0 ? (
          <div className="text-center py-12">
            <UserPlusIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
              Nenhum usuário encontrado
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Comece criando um novo usuário.
            </p>
            <div className="mt-6 flex items-center justify-center gap-3">
              <Button onClick={() => handleCreateNew('NORMAL')} variant="primary">
                <UserPlusIcon className="h-4 w-4 mr-2" />
                Novo Usuário Normal
              </Button>
              <Button onClick={() => handleCreateNew('API')} variant="secondary">
                <KeyIcon className="h-4 w-4 mr-2" />
                Novo Usuário API
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Usuário
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Tipo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Perfil/Info
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Último Login
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {users.map((user) => {
                  // Log para debug do status
                  logger.info('📋 Renderizando usuário:', 'USER', {
                    id: user.id,
                    name: user.name,
                    status: user.status,
                    ativo: user.ativo,
                    statusIsActive: user.status === 'active',
                  })
                  
                  return (
                    <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                              <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                                {user.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {user.name}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {user.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col gap-1">
                          {user.tipo_usuario === 'API' ? (
                            <>
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                🔗 API
                              </span>
                              <span className="text-xs text-gray-500">
                                Rate: {user.rate_limit_per_hour || 1000}/h
                              </span>
                            </>
                          ) : (
                            <>
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                👤 Normal
                              </span>
                              <span className="text-xs text-gray-500">
                                SysUser: {user.iduser || 'N/A'}
                              </span>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col gap-1">
                          {user.tipo_usuario === 'API' ? (
                            <div className="space-y-1">
                              <span className="text-sm font-medium text-gray-900 dark:text-white">
                                API Key: {user.api_key ? `${user.api_key.substring(0, 12)}...` : 'N/A'}
                              </span>
                              {user.permissions && (
                                <div className="flex flex-wrap gap-1">
                                  {(() => {
                                    // Converter permissions para array, seja objeto ou array
                                    let permArray: string[] = []
                                    
                                    if (Array.isArray(user.permissions)) {
                                      // Para usuários NORMAL
                                      permArray = user.permissions
                                    } else if (typeof user.permissions === 'object') {
                                      // Para usuários API - pegar apenas endpoints habilitados
                                      permArray = Object.entries(user.permissions)
                                        .filter(([_, enabled]) => enabled)
                                        .map(([endpoint]) => endpoint)
                                    }
                                    
                                    if (permArray.length === 0) return null
                                    
                                    return (
                                      <>
                                        {permArray.slice(0, 3).map((perm, idx) => (
                                          <span
                                            key={idx}
                                            className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800"
                                          >
                                            {perm.split(':')[0]}
                                          </span>
                                        ))}
                                        {permArray.length > 3 && (
                                          <span className="text-xs text-gray-500">
                                            +{permArray.length - 3}
                                          </span>
                                        )}
                                      </>
                                    )
                                  })()}
                                </div>
                              )}
                            </div>
                          ) : (
                            getRoleBadge(user.role)
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {user.status === 'active' ? (
                            <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />
                          ) : (
                            <XCircleIcon className="h-5 w-5 text-red-500 mr-2" />
                          )}
                          <span className={cn(
                            'text-sm',
                            user.status === 'active' ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400',
                          )}>
                            {user.status === 'active' ? 'Ativo' :
                              user.status === 'suspended' ? 'Suspenso' : 'Inativo'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {user.lastLogin
                          ? new Date(user.lastLogin).toLocaleDateString('pt-BR')
                          : 'Nunca'
                        }
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {compactActions ? (
                          <Menu as="div" className="relative inline-block text-left">
                            <div>
                              <Menu.Button className="inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-2 py-1 text-sm font-medium text-gray-700 dark:text-gray-200 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-100 dark:focus:ring-offset-gray-800">
                                <EllipsisHorizontalIcon className="h-5 w-5" aria-hidden="true" />
                              </Menu.Button>
                            </div>

                            <Transition
                              as={Fragment}
                              enter="transition ease-out duration-100"
                              enterFrom="transform opacity-0 scale-95"
                              enterTo="transform opacity-100 scale-100"
                              leave="transition ease-in duration-75"
                              leaveFrom="transform opacity-100 scale-100"
                              leaveTo="transform opacity-0 scale-95"
                            >
                              <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white dark:bg-gray-800 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                                <div className="py-1">
                                  <Menu.Item>
                                    {({ active }) => (
                                      <button
                                        onClick={() => handleView(user)}
                                        className={cn(
                                          active ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-200',
                                          'group flex items-center px-4 py-2 text-sm w-full'
                                        )}
                                      >
                                        <EyeIcon className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500" aria-hidden="true" />
                                        Ver detalhes
                                      </button>
                                    )}
                                  </Menu.Item>
                                  <Menu.Item>
                                    {({ active }) => (
                                      <button
                                        onClick={() => handleEdit(user)}
                                        className={cn(
                                          active ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-200',
                                          'group flex items-center px-4 py-2 text-sm w-full'
                                        )}
                                      >
                                        <PencilIcon className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500" aria-hidden="true" />
                                        Editar
                                      </button>
                                    )}
                                  </Menu.Item>
                                  
                                  {user.tipo_usuario === 'API' && (
                                    <Menu.Item>
                                      {({ active }) => (
                                        <button
                                          onClick={() => handleConfigureApi(user)}
                                          className={cn(
                                            active ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-200',
                                            'group flex items-center px-4 py-2 text-sm w-full'
                                          )}
                                        >
                                          <CogIcon className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500" aria-hidden="true" />
                                          Configurar API
                                        </button>
                                      )}
                                    </Menu.Item>
                                  )}
                                  
                                  <div className="border-t border-gray-100 dark:border-gray-700"></div>
                                  
                                  {user.tipo_usuario === 'NORMAL' ? (
                                    <Menu.Item>
                                      {({ active }) => (
                                        <button
                                          onClick={() => handleResetPassword(user)}
                                          disabled={resetPasswordMutation.isPending}
                                          className={cn(
                                            active ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-200',
                                            'group flex items-center px-4 py-2 text-sm w-full',
                                            resetPasswordMutation.isPending && 'opacity-50 cursor-not-allowed'
                                          )}
                                        >
                                          <KeyIcon className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500" aria-hidden="true" />
                                          Resetar senha
                                        </button>
                                      )}
                                    </Menu.Item>
                                  ) : (
                                    <Menu.Item>
                                      {({ active }) => (
                                        <button
                                          onClick={() => handleRegenerateApiKey(user)}
                                          className={cn(
                                            active ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-200',
                                            'group flex items-center px-4 py-2 text-sm w-full'
                                          )}
                                        >
                                          <span className="mr-3 text-gray-400 group-hover:text-gray-500">🔄</span>
                                          Regenerar API Key
                                        </button>
                                      )}
                                    </Menu.Item>
                                  )}
                                  
                                  <Menu.Item>
                                    {({ active }) => (
                                      <button
                                        onClick={() => handleToggleStatus(user)}
                                        disabled={toggleStatusMutation.isPending}
                                        className={cn(
                                          active ? 'bg-gray-100 dark:bg-gray-700' : '',
                                          user.status === 'active' 
                                            ? 'text-red-600 hover:text-red-700' 
                                            : 'text-green-600 hover:text-green-700',
                                          'group flex items-center px-4 py-2 text-sm w-full',
                                          toggleStatusMutation.isPending && 'opacity-50 cursor-not-allowed'
                                        )}
                                      >
                                        {user.status === 'active' ? (
                                          <>
                                            <XCircleIcon className="mr-3 h-5 w-5" aria-hidden="true" />
                                            Inativar
                                          </>
                                        ) : (
                                          <>
                                            <CheckCircleIcon className="mr-3 h-5 w-5" aria-hidden="true" />
                                            Ativar
                                          </>
                                        )}
                                      </button>
                                    )}
                                  </Menu.Item>
                                  
                                  <div className="border-t border-gray-100 dark:border-gray-700"></div>
                                  
                                  <Menu.Item>
                                    {({ active }) => (
                                      <button
                                        onClick={() => handleDelete(user)}
                                        disabled={deleteMutation.isPending}
                                        className={cn(
                                          active ? 'bg-red-100 dark:bg-red-900' : '',
                                          'text-red-600 hover:text-red-700 group flex items-center px-4 py-2 text-sm w-full',
                                          deleteMutation.isPending && 'opacity-50 cursor-not-allowed'
                                        )}
                                      >
                                        <TrashIcon className="mr-3 h-5 w-5" aria-hidden="true" />
                                        Remover
                                      </button>
                                    )}
                                  </Menu.Item>
                                </div>
                              </Menu.Items>
                            </Transition>
                          </Menu>
                        ) : (
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleView(user)}
                              title="Ver detalhes"
                            >
                              <EyeIcon className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEdit(user)}
                              title="Editar"
                            >
                              <PencilIcon className="h-4 w-4" />
                            </Button>

                            {/* Botão Configurar API - apenas para usuários API */}
                            {user.tipo_usuario === 'API' && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleConfigureApi(user)}
                                title="Configurar API"
                                className="text-purple-600 hover:text-purple-800"
                              >
                                <CogIcon className="h-4 w-4" />
                              </Button>
                            )}

                            {/* Ações específicas por tipo */}
                            {user.tipo_usuario === 'NORMAL' ? (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleResetPassword(user)}
                                title="Resetar senha"
                                disabled={resetPasswordMutation.isPending}
                              >
                                <KeyIcon className="h-4 w-4" />
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleRegenerateApiKey(user)}
                                title="Regenerar API Key"
                                className="text-purple-600 hover:text-purple-800"
                              >
                                🔄
                              </Button>
                            )}

                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                console.log('===== BOTÃO CLICADO =====')
                                console.log('User:', user)
                                console.log('Status:', user.status)
                                console.log('=========================')
                                
                                logger.info('🖱️ Botão toggle clicado:', 'USER', {
                                  userId: user.id,
                                  userName: user.name,
                                  currentStatus: user.status,
                                })
                                handleToggleStatus(user)
                              }}
                              title={user.status === 'active' ? 'Inativar' : 'Ativar'}
                              disabled={toggleStatusMutation.isPending}
                              className={user.status === 'active' ? 'text-red-600 hover:text-red-800' : 'text-green-600 hover:text-green-800'}
                            >
                              {user.status === 'active' ? <XCircleIcon className="h-4 w-4" /> : <CheckCircleIcon className="h-4 w-4" />}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDelete(user)}
                              title="Remover"
                              disabled={deleteMutation.isPending}
                              className="text-red-600 hover:text-red-800"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                  })}
                </tbody>
              </table>
            </div>

            {/* Paginação */}
            {totalPages > 1 && (
              <div className="bg-white dark:bg-gray-800 px-6 py-3 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                    Página {page} de {totalPages} ({total} total)
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      <ChevronLeftIcon className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                    >
                      <ChevronRightIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modals */}
      {showFormModal && (
        (() => {
          logger.info('🚀 Abrindo UserFormModalSimple', 'USER', {
            isEditing,
            selectedUser: selectedUser ? {
              id: selectedUser.id,
              name: selectedUser.name,
              tipo_usuario: selectedUser.tipo_usuario,
              email: selectedUser.email,
            } : null,
          })

          // Debug adicional
          logger.info('DEBUG UsersList - Estado completo:', 'USER', {
            selectedUser: selectedUser,
            isEditing: isEditing,
            userPropToPass: isEditing ? selectedUser : null
          })

          return (
            <UserFormModalSimple
              user={isEditing ? selectedUser : null}
              isOpen={showFormModal}
          onClose={() => {
            logger.info('🚪 Fechando UserFormModalSimple', 'USER')
            setShowFormModal(false)
            setSelectedUser(null)
            setIsEditing(false)
          }}
          onSuccess={async () => {
            // Aguardar um momento para garantir que o backend processou
            await new Promise(resolve => setTimeout(resolve, 300))
            
            // Invalidar e forçar refetch
            await queryClient.invalidateQueries({ queryKey: ['users'] })
            
            // Forçar refetch imediato
            await refetch()
            
            setShowFormModal(false)
            setSelectedUser(null)
            setIsEditing(false)
          }}
        />
          )
        })()
      )}

      {showCreateModal && (
        (() => {
          const newUserType = localStorage.getItem('newUserType')
          localStorage.removeItem('newUserType')
          
          if (newUserType === 'API') {
            return (
              <ApiUserFormModal
                user={null}
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onSuccess={async () => {
                  await new Promise(resolve => setTimeout(resolve, 300))
                  await queryClient.invalidateQueries({ queryKey: ['users'] })
                  await queryClient.invalidateQueries({ queryKey: ['user-stats'] })
                  await refetch()
                  setShowCreateModal(false)
                }}
              />
            )
          } else {
            return (
              <UserFormModalSimple
                user={null}
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onSuccess={async () => {
                  await new Promise(resolve => setTimeout(resolve, 300))
                  await queryClient.invalidateQueries({ queryKey: ['users'] })
                  await queryClient.invalidateQueries({ queryKey: ['user-stats'] })
                  await refetch()
                  setShowCreateModal(false)
                }}
              />
            )
          }
        })()
      )}

      {showDetailModal && selectedUser && (
        <UserDetailModal
          user={selectedUser}
          isOpen={showDetailModal}
          onClose={() => {
            setShowDetailModal(false)
            setSelectedUser(null)
          }}
        />
      )}

      {showApiFormModal && (
        <ApiUserFormModal
          user={isEditing ? selectedUser : null}
          isOpen={showApiFormModal}
          onClose={() => {
            logger.info('🚪 Fechando ApiUserFormModal', 'USER')
            setShowApiFormModal(false)
            setSelectedUser(null)
            setIsEditing(false)
          }}
          onSuccess={async () => {
            await new Promise(resolve => setTimeout(resolve, 300))
            await queryClient.invalidateQueries({ queryKey: ['users'] })
            await refetch()
            setShowApiFormModal(false)
            setSelectedUser(null)
            setIsEditing(false)
          }}
        />
      )}

      {showEndpointConfigModal && selectedUser && (
        <EndpointConfigModal
          user={selectedUser}
          isOpen={showEndpointConfigModal}
          onClose={() => {
            setShowEndpointConfigModal(false)
            setSelectedUser(null)
          }}
        />
      )}

      {/* Modal para mostrar as novas API Keys */}
      {showApiKeysModal && newApiKeys && (
        <Transition show={showApiKeysModal} as={Fragment}>
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-screen items-center justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0"
                enterTo="opacity-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
              >
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowApiKeysModal(false)} />
              </Transition.Child>

              <span className="hidden sm:inline-block sm:h-screen sm:align-middle" aria-hidden="true">
                &#8203;
              </span>

              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                enterTo="opacity-100 translate-y-0 sm:scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              >
                <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
                  <div>
                    <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 dark:bg-green-900">
                      <CheckCircleIcon className="h-6 w-6 text-green-600 dark:text-green-400" aria-hidden="true" />
                    </div>
                    <div className="mt-3 text-center sm:mt-5">
                      <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                        API Key Regenerada com Sucesso!
                      </h3>
                      <div className="mt-4">
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                          Copie as credenciais abaixo. Elas não serão mostradas novamente.
                        </p>
                        
                        <div className="bg-gray-100 dark:bg-gray-900 rounded-lg p-4 text-left">
                          <div className="mb-3">
                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">API Key</label>
                            <div className="flex items-center">
                              <code className="flex-1 text-sm font-mono text-gray-900 dark:text-gray-100 break-all">
                                {newApiKeys.apiKey}
                              </code>
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(newApiKeys.apiKey)
                                  toast.success('API Key copiada!')
                                }}
                                className="ml-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                              >
                                📋
                              </button>
                            </div>
                          </div>
                          
                          <div>
                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">API Secret</label>
                            <div className="flex items-center">
                              <code className="flex-1 text-sm font-mono text-gray-900 dark:text-gray-100 break-all">
                                {newApiKeys.apiSecret}
                              </code>
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(newApiKeys.apiSecret)
                                  toast.success('API Secret copiado!')
                                }}
                                className="ml-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                              >
                                📋
                              </button>
                            </div>
                          </div>
                        </div>
                        
                        <div className="mt-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md p-3">
                          <p className="text-xs text-yellow-800 dark:text-yellow-200">
                            ⚠️ Importante: Salve estas credenciais em um local seguro. As credenciais antigas foram invalidadas.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-5 sm:mt-6 flex gap-3">
                    <button
                      type="button"
                      className="inline-flex justify-center w-full rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:text-sm"
                      onClick={() => {
                        const credentials = `API Key: ${newApiKeys.apiKey}\nAPI Secret: ${newApiKeys.apiSecret}`
                        navigator.clipboard.writeText(credentials)
                        toast.success('Credenciais copiadas!')
                      }}
                    >
                      Copiar Tudo
                    </button>
                    <button
                      type="button"
                      className="inline-flex justify-center w-full rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-700 text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 sm:text-sm"
                      onClick={() => {
                        setShowApiKeysModal(false)
                        setNewApiKeys(null)
                      }}
                    >
                      Fechar
                    </button>
                  </div>
                </div>
              </Transition.Child>
            </div>
          </div>
        </Transition>
      )}
    </>
  )
}