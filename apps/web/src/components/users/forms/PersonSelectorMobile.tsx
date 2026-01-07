import { useState, useEffect } from 'react'
import { MagnifyingGlassIcon, UserIcon, XMarkIcon, FunnelIcon } from '@heroicons/react/24/outline'
import api from '@/services/api'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'

interface Person {
  ID: number
  NOME: string
  CPF: string
  EMAIL: string
  status?: string
}

interface PersonSelectorMobileProps {
  baseId: number
  value?: number
  onChange: (personId: number | null, personData?: Person) => void
  required?: boolean
  disabled?: boolean
  tipoUsuario?: 'NORMAL' | 'API'
}

export function PersonSelectorMobile({
  baseId,
  value,
  onChange,
  required = false,
  disabled = false,
  tipoUsuario = 'NORMAL'
}: PersonSelectorMobileProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [searching, setSearching] = useState(false)
  const [pessoas, setPessoas] = useState<Person[]>([])
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null)
  const [showResults, setShowResults] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [searchType, setSearchType] = useState<'tudo' | 'nome' | 'cpf' | 'email'>('tudo')

  // Se for usuário API, mensagem simples
  if (tipoUsuario === 'API') {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
        <p className="text-sm text-yellow-800 text-center">
          <span className="font-medium">🔗 Usuário API</span><br/>
          <span className="text-xs">Não precisa vincular pessoa</span>
        </p>
      </div>
    )
  }

  // Busca pessoas - Mobile optimized
  const searchPessoas = async (query: string) => {
    if (query.length < 2) {  // Mobile: busca com 2 caracteres
      setPessoas([])
      return
    }

    setSearching(true)
    try {
      const response = await api.get('/pessoas/search', {
        params: {
          q: query,
          baseId,
          type: searchType !== 'tudo' ? searchType : undefined
        }
      })
      setPessoas(response.data || [])
      setShowResults(true)
    } catch (error) {
      console.error('Erro ao buscar pessoas:', error)
      setPessoas([])
    } finally {
      setSearching(false)
    }
  }

  // Debounce rápido para mobile (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm) {
        searchPessoas(searchTerm)
      } else {
        setPessoas([])
        setShowResults(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [searchTerm, searchType])

  // Carregar pessoa selecionada
  useEffect(() => {
    if (value && !selectedPerson) {
      loadPerson(value)
    }
  }, [value])

  const loadPerson = async (personId: number) => {
    try {
      const response = await api.get(`/pessoas/${personId}`, {
        params: { baseId }
      })
      setSelectedPerson(response.data)
    } catch (error) {
      console.error('Erro ao carregar pessoa:', error)
    }
  }

  const handleSelect = (person: Person) => {
    setSelectedPerson(person)
    onChange(person.ID, person)
    setShowResults(false)
    setSearchTerm('')
    setPessoas([])
  }

  const handleClear = () => {
    setSelectedPerson(null)
    onChange(null)
    setSearchTerm('')
  }

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">
        Pessoa do ERP {required && <span className="text-red-500">*</span>}
      </label>

      {/* Pessoa selecionada - Card mobile */}
      {selectedPerson ? (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-4 shadow-sm">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <UserIcon className="h-5 w-5 text-blue-600" />
                <p className="font-semibold text-gray-900 text-sm">{selectedPerson.NOME}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-gray-600">
                  <span className="font-medium">CPF:</span> {selectedPerson.CPF}
                </p>
                <p className="text-xs text-gray-600">
                  <span className="font-medium">Email:</span> {selectedPerson.EMAIL}
                </p>
              </div>
            </div>
            {!disabled && (
              <button
                type="button"
                onClick={handleClear}
                className="p-1.5 hover:bg-white/50 rounded-lg transition-colors"
              >
                <XMarkIcon className="h-5 w-5 text-gray-500" />
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {/* Barra de busca mobile-first */}
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onFocus={() => setShowResults(true)}
              placeholder="Digite para buscar..."
              disabled={disabled}
              className="w-full pl-10 pr-10 py-3 text-base border border-gray-300 rounded-xl
                       focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                       placeholder:text-gray-400"
            />
            <MagnifyingGlassIcon className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />

            {/* Botão de filtros */}
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={`absolute right-3 top-3 p-1 rounded-lg transition-colors
                ${showFilters ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <FunnelIcon className="h-5 w-5" />
            </button>

            {searching && (
              <div className="absolute right-12 top-3.5">
                <LoadingSpinner size="sm" />
              </div>
            )}
          </div>

          {/* Filtros rápidos - Mobile optimized */}
          {showFilters && (
            <div className="flex gap-2 overflow-x-auto pb-2 -mx-2 px-2">
              {(['tudo', 'nome', 'cpf', 'email'] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setSearchType(type)}
                  className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all
                    ${searchType === type
                      ? 'bg-blue-500 text-white shadow-md'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                  {type === 'tudo' ? '🔍 Tudo' :
                   type === 'nome' ? '👤 Nome' :
                   type === 'cpf' ? '📄 CPF' :
                   '✉️ Email'}
                </button>
              ))}
            </div>
          )}

          {/* Resultados - Otimizado para touch */}
          {showResults && pessoas.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-xl shadow-lg max-h-72 overflow-y-auto">
              {pessoas.map((person) => (
                <button
                  key={person.ID}
                  type="button"
                  onClick={() => handleSelect(person)}
                  className="w-full px-4 py-4 text-left hover:bg-gray-50 active:bg-gray-100
                           border-b last:border-b-0 transition-colors"
                >
                  <div>
                    <p className="font-medium text-gray-900 text-sm mb-1">{person.NOME}</p>
                    <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                      <span className="inline-flex items-center">
                        📄 {person.CPF}
                      </span>
                      <span className="inline-flex items-center">
                        ✉️ {person.EMAIL}
                      </span>
                      {person.status && (
                        <span className="text-red-600 font-medium">
                          ⚠️ {person.status}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Estado vazio - Mobile friendly */}
          {showResults && searchTerm.length >= 2 && !searching && pessoas.length === 0 && (
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-8 text-center">
              <p className="text-gray-500 mb-2">
                Nenhuma pessoa encontrada
              </p>
              <p className="text-xs text-gray-400">
                Busca: "{searchTerm}" {searchType !== 'tudo' && `(${searchType})`}
              </p>
            </div>
          )}

          {/* Dica inicial */}
          {!searchTerm && !showResults && (
            <p className="text-xs text-gray-500 text-center mt-2">
              Digite pelo menos 2 caracteres para buscar
            </p>
          )}
        </div>
      )}

      {/* Mensagem de ajuda - Mobile */}
      <p className="text-xs text-gray-500 text-center">
        {required ?
          '⚠️ Obrigatório vincular a pessoa do ERP' :
          '💡 Opcional: vincule a uma pessoa existente'
        }
      </p>
    </div>
  )
}