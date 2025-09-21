import { useState, useEffect } from 'react'
import { MagnifyingGlassIcon, UserIcon, XMarkIcon, AdjustmentsHorizontalIcon } from '@heroicons/react/24/outline'
import api from '@/services/api'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'

interface Person {
  ID: number
  NOME: string
  CPF: string
  EMAIL: string
  status?: string
}

interface PersonSelectorProps {
  baseId: number
  value?: number
  onChange: (personId: number | null, personData?: Person) => void
  required?: boolean
  disabled?: boolean
  tipoUsuario?: 'NORMAL' | 'API'
}

export function PersonSelector({
  baseId,
  value,
  onChange,
  required = false,
  disabled = false,
  tipoUsuario = 'NORMAL'
}: PersonSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [searching, setSearching] = useState(false)
  const [pessoas, setPessoas] = useState<Person[]>([])
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null)
  const [showDropdown, setShowDropdown] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false) // Pesquisa avançada
  const [searchType, setSearchType] = useState<'all' | 'name' | 'cpf' | 'email'>('all')

  // Se for usuário API, não precisa selecionar pessoa
  if (tipoUsuario === 'API') {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-sm text-yellow-800">
          <span className="font-medium">Usuário API</span> não precisa estar vinculado a uma pessoa do ERP
        </p>
      </div>
    )
  }

  // Busca pessoas disponíveis
  const searchPessoas = async (query: string) => {
    if (query.length < 3) {
      setPessoas([])
      return
    }

    setSearching(true)
    try {
      const response = await api.get('/pessoas/search', {
        params: { q: query, baseId }
      })
      setPessoas(response.data || [])
    } catch (error) {
      console.error('Erro ao buscar pessoas:', error)
      setPessoas([])
    } finally {
      setSearching(false)
    }
  }

  // Debounce da busca
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm) {
        searchPessoas(searchTerm)
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [searchTerm])

  // Carregar pessoa selecionada se tiver value
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
    setShowDropdown(false)
    setSearchTerm('')
    setPessoas([])
  }

  const handleClear = () => {
    setSelectedPerson(null)
    onChange(null)
    setSearchTerm('')
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        Pessoa do ERP {required && <span className="text-red-500">*</span>}
      </label>

      {/* Pessoa selecionada */}
      {selectedPerson ? (
        <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center space-x-3">
            <UserIcon className="h-5 w-5 text-blue-600" />
            <div>
              <p className="font-medium text-gray-900">{selectedPerson.NOME}</p>
              <p className="text-sm text-gray-500">
                CPF: {selectedPerson.CPF} | Email: {selectedPerson.EMAIL}
              </p>
            </div>
          </div>
          {!disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          )}
        </div>
      ) : (
        <div className="relative">
          {/* Campo de busca */}
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                setShowDropdown(true)
              }}
              onFocus={() => setShowDropdown(true)}
              placeholder="Buscar por nome, CPF ou email..."
              disabled={disabled}
              className="w-full px-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            {searching && (
              <div className="absolute right-3 top-2.5">
                <LoadingSpinner size="small" />
              </div>
            )}
          </div>

          {/* Dropdown de resultados */}
          {showDropdown && pessoas.length > 0 && (
            <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
              {pessoas.map((person) => (
                <button
                  key={person.ID}
                  type="button"
                  onClick={() => handleSelect(person)}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b last:border-b-0"
                >
                  <div>
                    <p className="font-medium text-gray-900">{person.NOME}</p>
                    <p className="text-sm text-gray-500">
                      CPF: {person.CPF} | Email: {person.EMAIL}
                      {person.status && (
                        <span className="ml-2 text-xs text-red-600">
                          ({person.status})
                        </span>
                      )}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Mensagem quando não há resultados */}
          {showDropdown && searchTerm.length >= 3 && !searching && pessoas.length === 0 && (
            <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg p-4">
              <p className="text-sm text-gray-500 text-center">
                Nenhuma pessoa encontrada para "{searchTerm}"
              </p>
            </div>
          )}
        </div>
      )}

      {/* Mensagem de ajuda */}
      <p className="text-xs text-gray-500">
        {required ?
          'Usuário só pode ser criado se a pessoa existir no ERP' :
          'Opcional: vincule o usuário a uma pessoa do ERP'
        }
      </p>
    </div>
  )
}