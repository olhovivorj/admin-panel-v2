import { UseFormRegister, UseFormWatch, UseFormSetValue, FieldErrors } from 'react-hook-form'
import { useState, useEffect } from 'react'
import { usersService } from '../../../services/users'
import { logger } from '../../../utils/logger'
import toast from 'react-hot-toast'

interface DadosBasicosTabProps {
  register: UseFormRegister<any>
  watch: UseFormWatch<any>
  setValue: UseFormSetValue<any>
  errors: FieldErrors
  isEditing: boolean
  selectedBaseId: number
}

export const DadosBasicosTab = ({ register, watch, setValue, errors, isEditing, selectedBaseId }: DadosBasicosTabProps) => {
  const tipoUsuario = watch('tipo_usuario')
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [selectedPessoa, setSelectedPessoa] = useState<any>(null)
  const [showPassword, setShowPassword] = useState(false)

  // Debounced search
  useEffect(() => {
    const searchPessoas = async () => {
      if (searchTerm.length < 3 || !selectedBaseId || tipoUsuario === 'API') {
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
  }, [searchTerm, selectedBaseId, tipoUsuario])

  const handlePessoaSelected = async (idPessoa: number) => {
    setIsSearching(true)
    setSearchResults([])
    setSearchTerm('')

    try {
      // Validar se pessoa já está vinculada a outro usuário
      const usuariosResponse = await usersService.getUsers({ baseId: selectedBaseId })
      const usuarios = usuariosResponse.data?.users || usuariosResponse.data || []
      const usuarioExistente = usuarios.find((u: any) => u.id_pessoa === idPessoa)

      if (usuarioExistente) {
        toast.error(`⚠️ Esta pessoa já está vinculada ao usuário: ${usuarioExistente.name}`)
        setIsSearching(false)
        return
      }

      const pessoaData = await usersService.getPessoaData(idPessoa, selectedBaseId)
      setSelectedPessoa(pessoaData)

      // Auto-fill form fields - mapeamento de campos UPPERCASE do ERP
      setValue('id_pessoa', idPessoa)
      const nome = pessoaData.RAZAO || pessoaData.nome || pessoaData.FANTASIA
      const email = pessoaData.EMAIL || pessoaData.email
      const telefone = pessoaData.FAX || pessoaData.TELEFONE || pessoaData.CELULAR || pessoaData.celular // FAX = celular

      // Nome sempre vem do ERP (read-only)
      if (nome) setValue('name', nome.trim())

      // Email e telefone só preenchem se os campos estiverem vazios (permite edição)
      if (email && !watch('email')) setValue('email', email.toLowerCase().trim())
      if (telefone && !watch('telefone')) setValue('telefone', telefone.trim())

      toast.success(`✅ ${nome || 'Pessoa'} selecionado!`)
    } catch (error) {
      logger.error('Erro ao carregar dados da pessoa:', error)
      toast.error('Erro ao carregar dados da pessoa')
    } finally {
      setIsSearching(false)
    }
  }

  const handleRemovePessoa = () => {
    setSelectedPessoa(null)
    setValue('id_pessoa', undefined)
    setValue('name', '')
    setValue('email', '')
    setValue('telefone', '')
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
        Informações Básicas
      </h3>

      {/* Seletor de Pessoa (apenas para usuários NORMAL) */}
      {tipoUsuario === 'NORMAL' && !watch('id_pessoa') && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Filtrar por nome
          </label>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white text-gray-900 dark:bg-gray-700 dark:text-white mb-2"
            placeholder="Digite para filtrar (mínimo 3 caracteres)"
          />

          {isSearching && (
            <p className="text-sm text-blue-600 mb-2">🔄 Buscando...</p>
          )}

          {searchResults.length > 0 && (
            <>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Selecionar Pessoa *
              </label>
              <select
                onChange={(e) => {
                  const idPessoa = parseInt(e.target.value, 10)
                  if (idPessoa) handlePessoaSelected(idPessoa)
                }}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white text-gray-900 dark:bg-gray-700 dark:text-white"
                size={Math.min(searchResults.length + 1, 8)}
              >
                <option value="">-- Selecione uma pessoa --</option>
                {searchResults.map((pessoa) => (
                  <option
                    key={pessoa.id || pessoa.ID_PESSOA}
                    value={pessoa.id || pessoa.ID_PESSOA}
                  >
                    {pessoa.nome || pessoa.RAZAO}
                    {pessoa.email ? ` - ${pessoa.email}` : ''}
                  </option>
                ))}
              </select>
            </>
          )}

          {searchTerm.length >= 3 && searchResults.length === 0 && !isSearching && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              Nenhuma pessoa encontrada
            </p>
          )}
        </div>
      )}

      {/* Pessoa selecionada preview */}
      {tipoUsuario === 'NORMAL' && selectedPessoa && watch('id_pessoa') && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-300 dark:border-green-700 rounded-lg p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-green-900 dark:text-green-100 mb-2">
                ✅ Pessoa Selecionada
              </p>
              <p className="text-sm text-green-800 dark:text-green-200">
                <strong>{selectedPessoa.nome || selectedPessoa.RAZAO}</strong>
              </p>
              <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                ID: {selectedPessoa.id || selectedPessoa.ID_PESSOA}
              </p>
            </div>
            <button
              type="button"
              onClick={handleRemovePessoa}
              className="text-red-600 hover:text-red-800 text-sm font-medium"
            >
              Trocar
            </button>
          </div>
        </div>
      )}

      {/* Campo hidden para id_pessoa */}
      <input type="hidden" {...register('id_pessoa', { valueAsNumber: true })} />

      {/* Nome */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Nome Completo *
          {watch('id_pessoa') && (
            <span className="ml-2 text-xs text-amber-600 dark:text-amber-400">
              🔒 Vem do ERP (somente leitura)
            </span>
          )}
        </label>
        <input
          {...register('name')}
          type="text"
          disabled={!!watch('id_pessoa')}
          className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md ${
            watch('id_pessoa')
              ? 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300 cursor-not-allowed'
              : 'bg-white text-gray-900 dark:bg-gray-700 dark:text-white'
          }`}
          placeholder="João da Silva"
        />
        {errors.name && (
          <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
        )}
      </div>

      {/* Email */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Email *
          {watch('id_pessoa') && (
            <span className="ml-2 text-xs text-green-600 dark:text-green-400">
              ✏️ Editável (salvo no sistema, não no ERP)
            </span>
          )}
        </label>
        <input
          {...register('email')}
          type="email"
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white text-gray-900 dark:bg-gray-700 dark:text-white"
          placeholder="joao@empresa.com"
        />
        {errors.email && (
          <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
        )}
      </div>

      {/* Telefone */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Telefone
          {watch('id_pessoa') && (
            <span className="ml-2 text-xs text-green-600 dark:text-green-400">
              ✏️ Editável (salvo no sistema, não no ERP)
            </span>
          )}
        </label>
        <input
          {...register('telefone')}
          type="text"
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white text-gray-900 dark:bg-gray-700 dark:text-white"
          placeholder="(21) 99999-9999"
        />
        {errors.telefone && (
          <p className="mt-1 text-sm text-red-600">{errors.telefone.message}</p>
        )}
      </div>

      {/* Senha (apenas na criação) */}
      {!isEditing && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Senha *
          </label>
          <div className="relative">
            <input
              {...register('password')}
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              data-form-type="other"
              data-lpignore="true"
              id={`pwd-${Math.random()}`}
              className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-md bg-white text-gray-900 dark:bg-gray-700 dark:text-white"
              placeholder="Mínimo 6 caracteres"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            >
              {showPassword ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>
          {errors.password && (
            <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
          )}
        </div>
      )}

      {/* Tipo Usuário - FIXO */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Tipo de Usuário
        </label>
        <input
          type="text"
          value={tipoUsuario === 'API' ? 'API' : 'Normal'}
          disabled
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300 cursor-not-allowed"
        />
        <input type="hidden" {...register('tipo_usuario')} />
        <p className="mt-1 text-xs text-gray-500">
          {isEditing
            ? '⚠️ Tipo não pode ser alterado. Para mudar, exclua e crie novamente.'
            : 'ℹ️ Tipo definido ao clicar no botão de criar usuário.'
          }
        </p>
      </div>

      {/* Usuário ativo */}
      <div className="flex items-center">
        <input
          {...register('ativo')}
          type="checkbox"
          id="ativo"
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        />
        <label htmlFor="ativo" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
          Usuário ativo
        </label>
      </div>
    </div>
  )
}
