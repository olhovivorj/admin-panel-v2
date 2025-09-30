import { UseFormRegister, UseFormSetValue, UseFormWatch, FieldErrors } from 'react-hook-form'
import { useState, useEffect } from 'react'
import { usersService } from '../../../services/users'
import { logger } from '../../../utils/logger'
import toast from 'react-hot-toast'

interface VinculosERPTabProps {
  register: UseFormRegister<any>
  watch: UseFormWatch<any>
  setValue: UseFormSetValue<any>
  errors: FieldErrors
  user: any | null
  isEditing: boolean
  selectedBaseId: number
}

export const VinculosERPTab = ({ register, watch, setValue, errors, user, isEditing, selectedBaseId }: VinculosERPTabProps) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [selectedPessoaPreview, setSelectedPessoaPreview] = useState<any>(null)
  const [loadingPessoaData, setLoadingPessoaData] = useState(false)

  const tipoUsuario = watch('tipo_usuario')

  // Debounced search
  useEffect(() => {
    const searchPessoas = async () => {
      if (searchTerm.length < 3 || !selectedBaseId) {
        setSearchResults([])
        return
      }

      setIsSearching(true)
      try {
        const results = await usersService.searchPessoas(searchTerm, selectedBaseId)
        setSearchResults(Array.isArray(results) ? results : [])
      } catch (error) {
        logger.error('Erro ao buscar pessoas:', error)
        setSearchResults([])
      } finally {
        setIsSearching(false)
      }
    }

    const timer = setTimeout(searchPessoas, 500)
    return () => clearTimeout(timer)
  }, [searchTerm, selectedBaseId])

  const handlePessoaSelected = async (idPessoa: number, pessoaData?: any) => {
    setLoadingPessoaData(true)
    setSearchResults([])
    setSearchTerm('')

    try {
      const response = await usersService.getPessoaData(idPessoa, selectedBaseId)
      setSelectedPessoaPreview(response)

      // Auto-fill form fields
      setValue('id_pessoa', idPessoa)
      if (response.nome) setValue('name', response.nome)
      if (response.email) setValue('email', response.email.toLowerCase())
      if (response.telefone) setValue('telefone', response.telefone)

      toast.success(`✅ Dados de ${response.nome || 'pessoa'} carregados!`)
    } catch (error) {
      logger.error('Erro ao carregar dados da pessoa:', error)
      toast.error('Erro ao carregar dados da pessoa')
    } finally {
      setLoadingPessoaData(false)
    }
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
        Vínculos com ERP
      </h3>

      {isEditing && !!user?.id_pessoa && user.id_pessoa > 0 ? (
        /* Modo edição com id_pessoa JÁ definido: mostrar read-only */
        <div className="bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg p-4">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Pessoa Vinculada
          </p>
          <div className="space-y-1">
            <p className="text-sm text-gray-900 dark:text-white">
              <strong>ID:</strong> {user.id_pessoa}
            </p>
            <p className="text-sm text-gray-900 dark:text-white">
              <strong>Nome:</strong> {user.name}
            </p>
          </div>
          <p className="mt-3 text-xs text-amber-600 dark:text-amber-400">
            🔒 ID da pessoa não pode ser alterado após definido
          </p>
        </div>
      ) : (
        /* Modo criação OU edição sem id_pessoa: permitir buscar e selecionar */
        <div className="space-y-4">
          {isEditing && !user?.id_pessoa && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-300 dark:border-blue-700 rounded-lg p-3 mb-4">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                ℹ️ <strong>Compatibilização necessária:</strong> Este usuário ainda não está vinculado ao ERP. Selecione uma pessoa abaixo para vincular. Após definir, não será possível alterar.
              </p>
            </div>
          )}

          {!selectedPessoaPreview ? (
            <>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Buscar Pessoa {tipoUsuario === 'NORMAL' && <span className="text-red-600">*</span>}
              </label>

              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white text-gray-900 dark:bg-gray-700 dark:text-white"
                  placeholder="Digite nome ou CPF (mínimo 3 caracteres)"
                  autoFocus={!isEditing}
                />
                {isSearching && (
                  <div className="absolute right-3 top-2.5">
                    <span className="text-blue-600">🔄</span>
                  </div>
                )}
              </div>

              {searchResults.length > 0 && (
                <div className="mt-2 border border-gray-300 dark:border-gray-600 rounded-md max-h-60 overflow-y-auto bg-white dark:bg-gray-800">
                  {searchResults.map((pessoa) => (
                    <button
                      key={pessoa.id || pessoa.ID_PESSOA}
                      type="button"
                      onClick={() => handlePessoaSelected(pessoa.id || pessoa.ID_PESSOA, pessoa)}
                      className="w-full text-left px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 border-b border-gray-200 dark:border-gray-700 last:border-b-0"
                    >
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {pessoa.nome || pessoa.RAZAO}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {pessoa.cpfCnpj || pessoa.CPF_CNPJ} {pessoa.email && `• ${pessoa.email}`}
                      </p>
                    </button>
                  ))}
                </div>
              )}

              {searchTerm.length >= 3 && searchResults.length === 0 && !isSearching && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  Nenhuma pessoa encontrada
                </p>
              )}

              {tipoUsuario === 'NORMAL' && (
                <p className="text-xs text-red-600 mt-2">
                  ⚠️ Campo obrigatório para usuários NORMAL
                </p>
              )}
            </>
          ) : (
            /* Pessoa selecionada: preview */
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-300 dark:border-green-700 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-green-900 dark:text-green-100 mb-2">
                    ✅ Pessoa Selecionada
                  </p>
                  <div className="space-y-1">
                    <p className="text-sm text-green-800 dark:text-green-200">
                      <strong>ID:</strong> {selectedPessoaPreview.id || selectedPessoaPreview.ID_PESSOA}
                    </p>
                    <p className="text-sm text-green-800 dark:text-green-200">
                      <strong>Nome:</strong> {selectedPessoaPreview.nome || selectedPessoaPreview.RAZAO}
                    </p>
                    {selectedPessoaPreview.cpfCnpj && (
                      <p className="text-sm text-green-800 dark:text-green-200">
                        <strong>CPF/CNPJ:</strong> {selectedPessoaPreview.cpfCnpj}
                      </p>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedPessoaPreview(null)
                    setValue('id_pessoa', undefined)
                    setValue('name', '')
                    setValue('email', '')
                    setValue('telefone', '')
                  }}
                  className="text-red-600 hover:text-red-800 text-sm"
                >
                  Trocar
                </button>
              </div>
            </div>
          )}

          {/* Campo hidden para id_pessoa */}
          <input type="hidden" {...register('id_pessoa', { valueAsNumber: true })} />
          {errors.id_pessoa && (
            <p className="mt-1 text-sm text-red-600">{errors.id_pessoa.message}</p>
          )}
        </div>
      )}
    </div>
  )
}
