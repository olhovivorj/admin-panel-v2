import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { BuildingStorefrontIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { usersService, LojaDisponivel, UsuarioLojaDto } from '@/services/users'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { useBase } from '@/contexts/BaseContext'
import toast from 'react-hot-toast'

interface LojasSelectorProps {
  userId: number
  userName: string
  onUpdate?: () => void
  readOnly?: boolean
}

export function LojasSelector({ userId, userName, onUpdate, readOnly = false }: LojasSelectorProps) {
  const { selectedBaseId } = useBase()
  const [isEditing, setIsEditing] = useState(false)
  const [selectedLojas, setSelectedLojas] = useState<number[]>([])
  const [acessoTotal, setAcessoTotal] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  // Buscar lojas do usuário
  const { data: userLojas, isLoading: loadingUserLojas, refetch } = useQuery({
    queryKey: ['user-lojas', userId],
    queryFn: () => usersService.getUserLojas(userId),
    enabled: !!userId,
  })

  // Buscar lojas disponíveis
  const { data: lojasDisponiveis, isLoading: loadingLojas } = useQuery({
    queryKey: ['lojas-disponiveis', selectedBaseId],
    queryFn: () => usersService.getAvailableLojas(selectedBaseId || undefined),
    enabled: !!selectedBaseId && isEditing,
  })

  // Atualizar estado quando carregar dados
  useEffect(() => {
    if (userLojas) {
      setAcessoTotal(userLojas.acessoTotal)
      setSelectedLojas(userLojas.lojas.map(l => l.empresaId))
    }
  }, [userLojas])

  const handleToggleAcessoTotal = () => {
    setAcessoTotal(!acessoTotal)
    if (!acessoTotal) {
      setSelectedLojas([])
    }
  }

  const handleToggleLoja = (lojaId: number) => {
    if (acessoTotal) {
      setAcessoTotal(false)
      setSelectedLojas([lojaId])
    } else {
      setSelectedLojas(prev =>
        prev.includes(lojaId)
          ? prev.filter(id => id !== lojaId)
          : [...prev, lojaId],
      )
    }
  }

  const handleSave = async () => {
    try {
      setIsSaving(true)
      const lojasIds = acessoTotal ? [] : selectedLojas
      await usersService.updateUserLojas(userId, lojasIds)

      toast.success('Lojas atualizadas com sucesso')
      setIsEditing(false)
      refetch()
      onUpdate?.()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao atualizar lojas')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setIsEditing(false)
    // Restaurar valores originais
    if (userLojas) {
      setAcessoTotal(userLojas.acessoTotal)
      setSelectedLojas(userLojas.lojas.map(l => l.empresaId))
    }
  }

  if (loadingUserLojas) {
    return (
      <div className="flex items-center justify-center py-4">
        <LoadingSpinner size="sm" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
          <BuildingStorefrontIcon className="h-4 w-4" />
          Lojas Permitidas
        </h3>
        {!readOnly && !isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
          >
            Editar
          </button>
        )}
      </div>

      {!isEditing ? (
        // Modo visualização
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          {userLojas?.acessoTotal ? (
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
              <CheckIcon className="h-5 w-5" />
              <span className="font-medium">Acesso a todas as lojas</span>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Acesso restrito a {userLojas?.lojas.length || 0} loja(s):
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                {userLojas?.lojas.map((loja) => (
                  <div
                    key={loja.id}
                    className="flex items-center gap-2 text-sm bg-white dark:bg-gray-700 px-3 py-2 rounded-md"
                  >
                    <BuildingStorefrontIcon className="h-4 w-4 text-gray-500" />
                    <span className="font-medium">{loja.nomeLoja}</span>
                    {loja.cidade && loja.uf && (
                      <span className="text-gray-500">
                        ({loja.cidade}/{loja.uf})
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        // Modo edição
        <div className="space-y-4">
          {/* Toggle acesso total */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <label className="flex items-center justify-between cursor-pointer">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={acessoTotal}
                  onChange={handleToggleAcessoTotal}
                  className="h-4 w-4 text-blue-600 rounded"
                />
                <div>
                  <span className="font-medium text-gray-900 dark:text-white">
                    Acesso a todas as lojas
                  </span>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Usuário pode acessar dados de qualquer loja da base
                  </p>
                </div>
              </div>
            </label>
          </div>

          {/* Mensagem quando tem acesso total */}
          {acessoTotal && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <CheckIcon className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-green-800 dark:text-green-200">
                    Acesso completo ativado
                  </p>
                  <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                    Este usuário pode acessar dados de todas as {lojasDisponiveis?.length || 0} lojas desta base.
                    Para restringir o acesso, desmarque a opção acima.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Lista de lojas - só mostra se NÃO tem acesso total */}
          {!acessoTotal && (
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
              <div className="bg-gray-50 dark:bg-gray-800 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Selecione as lojas permitidas
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {selectedLojas.length} loja(s) selecionada(s)
                </p>
              </div>

              {loadingLojas ? (
                <div className="flex items-center justify-center py-8">
                  <LoadingSpinner size="sm" />
                </div>
              ) : (
                <div className="max-h-64 overflow-y-auto">
                  {lojasDisponiveis?.map((loja) => (
                    <label
                      key={loja.id}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer border-b border-gray-100 dark:border-gray-800 last:border-0"
                    >
                      <input
                        type="checkbox"
                        checked={selectedLojas.includes(loja.id)}
                        onChange={() => handleToggleLoja(loja.id)}
                        className="h-4 w-4 text-blue-600 rounded"
                      />
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 dark:text-white">
                          {loja.nome}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {loja.razaoSocial} • {loja.cidade}/{loja.uf}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Botões de ação */}
          <div className="flex justify-end gap-2">
            <button
              onClick={handleCancel}
              disabled={isSaving}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving || (!acessoTotal && selectedLojas.length === 0)}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-md flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <LoadingSpinner size="sm" />
                  Salvando...
                </>
              ) : (
                'Salvar'
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}