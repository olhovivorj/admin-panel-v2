import { Dialog } from '@headlessui/react'
import { XMarkIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline'
import { useQuery } from '@tanstack/react-query'
import { UsuarioResponseDto } from '@/services/users'
import { basesService } from '@/services/bases'
import { Button } from '@/components/common/Button'
import { LojasSelector } from './LojasSelector'
import { useAuth } from '@/contexts/AuthContext'
import { LojaAccessTest } from './LojaAccessTest'
import { isAdmin as checkIsAdmin } from '@/utils/roleHelpers'

interface UserDetailModalProps {
  user: UsuarioResponseDto
  isOpen: boolean
  onClose: () => void
}

export function UserDetailModal({ user, isOpen, onClose }: UserDetailModalProps) {
  const { user: currentUser } = useAuth()
  const isAdmin = checkIsAdmin(currentUser)

  // Query para buscar bases (para mostrar nomes ao invés de IDs)
  const { data: basesData = [], error: basesError } = useQuery({
    queryKey: ['bases'],
    queryFn: () => basesService.getBases(),
    staleTime: 1000 * 60 * 5, // 5 minutos
    retry: false, // Não retentar se der erro
  })

  // Cast para array se necessário
  const bases = (Array.isArray(basesData) ? basesData : []) as any[]

  // Log error se existir
  if (basesError) {
    console.error('❌ Erro ao buscar bases no UserDetailModal:', basesError)
  }

  const getBaseName = (baseId: number) => {
    // Mapear nomes conhecidos
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

  const getRoleBadge = (role: string) => {
    const roleConfig = {
      admin: { label: 'Administrador', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' },
      user: { label: 'Usuário', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' },
      viewer: { label: 'Visualizador', color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300' },
    }

    const config = roleConfig[role as keyof typeof roleConfig] || roleConfig.viewer

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    )
  }

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="w-full max-w-lg bg-white dark:bg-gray-800 rounded-lg shadow-xl">
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <Dialog.Title className="text-lg font-medium text-gray-900 dark:text-white">
              Detalhes do Usuário
            </Dialog.Title>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Avatar e Nome */}
            <div className="flex items-center space-x-4">
              <div className="h-16 w-16 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                <span className="text-xl font-medium text-gray-700 dark:text-gray-200">
                  {user.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  {user.name}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {user.email}
                </p>
                <div className="mt-1">
                  {getRoleBadge(user.funcao || user.role?.name || 'user')}
                </div>
              </div>
            </div>

            {/* Status */}
            <div className="flex items-center space-x-2">
              {user.status === 'active' ? (
                <CheckCircleIcon className="h-5 w-5 text-green-500" />
              ) : (
                <XCircleIcon className="h-5 w-5 text-red-500" />
              )}
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {user.status === 'active' ? 'Ativo' : (user.status as string) === 'suspended' ? 'Suspenso' : 'Inativo'}
              </span>
            </div>

            {/* Informações */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  ID
                </label>
                <p className="mt-1 text-sm text-gray-900 dark:text-white">
                  {user.id}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Base Principal
                </label>
                <p className="mt-1 text-sm text-gray-900 dark:text-white">
                  {getBaseName(user.baseId)}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Base ID
                </label>
                <p className="mt-1 text-sm text-gray-900 dark:text-white">
                  Base {user.baseId}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Último Acesso
                </label>
                <p className="mt-1 text-sm text-gray-900 dark:text-white">
                  {user.lastLogin
                    ? new Date(user.lastLogin).toLocaleDateString('pt-BR', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                    : 'Nunca'
                  }
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Total de Acessos
                </label>
                <p className="mt-1 text-sm text-gray-900 dark:text-white">
                  {(user as any).total_requisicoes_api || 0} acesso{((user as any).total_requisicoes_api || 0) !== 1 ? 's' : ''}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Criado em
                </label>
                <p className="mt-1 text-sm text-gray-900 dark:text-white">
                  {new Date(user.createdAt).toLocaleDateString('pt-BR', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Atualizado em
                </label>
                <p className="mt-1 text-sm text-gray-900 dark:text-white">
                  {new Date(user.updatedAt).toLocaleDateString('pt-BR', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </p>
              </div>

              {/* Informações adicionais para usuários API */}
              {user.tipo_usuario === 'API' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      API Key
                    </label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white font-mono">
                      {user.api_key ? `${user.api_key.substring(0, 12)}...` : 'N/A'}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Rate Limit
                    </label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white">
                      {user.rate_limit_per_hour || 1000}/hora
                    </p>
                  </div>
                </>
              )}

              {/* Telefone e observações */}
              {user.telefone && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Telefone
                  </label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">
                    {user.telefone}
                  </p>
                </div>
              )}

              {user.obs && (
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Observações
                  </label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">
                    {user.obs}
                  </p>
                </div>
              )}
            </div>

            {/* Teste de Acesso às Lojas - apenas para usuários API */}
            {user.tipo_usuario === 'API' && (
              <div className="col-span-2 border-t pt-4">
                <LojaAccessTest userId={user.id} />
              </div>
            )}

            {/* Seletor de Lojas - apenas para admins e usuários NORMAL */}
            {isAdmin && user.tipo_usuario === 'NORMAL' && (
              <div className="col-span-2 border-t pt-4">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  <p className="font-medium mb-2">Lojas com Acesso</p>
                  <p className="italic">Funcionalidade temporariamente indisponível</p>
                </div>
                {/* <LojasSelector
                  userId={user.id}
                  userName={user.name}
                  readOnly={!isAdmin}
                /> */}
              </div>
            )}
          </div>

          <div className="flex justify-end p-6 border-t border-gray-200 dark:border-gray-700">
            <Button onClick={onClose}>
              Fechar
            </Button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  )
}