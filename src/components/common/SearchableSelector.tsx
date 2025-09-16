import { Fragment, useState, useEffect } from 'react'
import { Combobox, Transition } from '@headlessui/react'
import {
  ChevronUpDownIcon,
  CheckIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline'
import { cn } from '@/utils/cn'

export interface SearchableSelectorOption {
  id: string | number
  label: string
  subtitle?: string
  value: any
  disabled?: boolean
}

interface SearchableSelectorProps {
  // Dados
  options: SearchableSelectorOption[]
  value?: SearchableSelectorOption | SearchableSelectorOption[] | null

  // Configurações
  multiple?: boolean
  placeholder?: string
  label?: string
  searchPlaceholder?: string
  icon?: React.ComponentType<{ className?: string }>

  // Busca
  searchThreshold?: number // Número mínimo de caracteres para buscar
  onSearch?: (query: string) => void | Promise<void>
  isLoading?: boolean

  // Callbacks
  onChange: (value: SearchableSelectorOption | SearchableSelectorOption[] | null) => void
  onInputChange?: (query: string) => void

  // Customização
  className?: string
  disabled?: boolean
  required?: boolean
  error?: string

  // Renderização customizada
  renderOption?: (option: SearchableSelectorOption) => React.ReactNode
  renderSelected?: (option: SearchableSelectorOption) => React.ReactNode
}

export function SearchableSelector({
  options = [],
  value,
  multiple = false,
  placeholder = 'Selecione...',
  label,
  searchPlaceholder = 'Digite para pesquisar...',
  icon: Icon,
  searchThreshold = 3,
  onSearch,
  isLoading = false,
  onChange,
  onInputChange,
  className = '',
  disabled = false,
  required = false,
  error,
  renderOption,
  renderSelected,
}: SearchableSelectorProps) {
  const [query, setQuery] = useState('')
  const [filteredOptions, setFilteredOptions] = useState(options)

  // Filtrar opções localmente
  useEffect(() => {
    if (query === '') {
      setFilteredOptions(options)
      return
    }

    if (query.length >= searchThreshold && onSearch) {
      // Busca externa (API)
      onSearch(query)
      return
    }

    if (query.length < searchThreshold && onSearch) {
      // Não buscar ainda
      setFilteredOptions([])
      return
    }

    // Busca local
    const filtered = options.filter((option) => {
      const searchTerm = query.toLowerCase()
      return (
        option.label.toLowerCase().includes(searchTerm) ||
        option.subtitle?.toLowerCase().includes(searchTerm) ||
        option.id.toString().toLowerCase().includes(searchTerm)
      )
    })

    setFilteredOptions(filtered)
  }, [query, options, searchThreshold, onSearch])

  // Atualizar opções filtradas quando options mudam (para busca externa)
  useEffect(() => {
    if (onSearch && query.length >= searchThreshold) {
      setFilteredOptions(options)
    }
  }, [options, query, searchThreshold, onSearch])

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = event.target.value
    setQuery(newQuery)
    onInputChange?.(newQuery)
  }

  const handleSelection = (option: SearchableSelectorOption | null) => {
    if (!option) {
      onChange(multiple ? [] : null)
      return
    }

    if (multiple) {
      const currentValues = Array.isArray(value) ? value : []
      const isSelected = currentValues.some(v => v.id === option.id)

      if (isSelected) {
        // Remover
        const newValues = currentValues.filter(v => v.id !== option.id)
        onChange(newValues)
      } else {
        // Adicionar
        onChange([...currentValues, option])
      }
    } else {
      onChange(option)
      setQuery('')
    }
  }

  const removeOption = (optionToRemove: SearchableSelectorOption) => {
    if (multiple && Array.isArray(value)) {
      const newValues = value.filter(v => v.id !== optionToRemove.id)
      onChange(newValues)
    }
  }

  const getDisplayValue = (option: SearchableSelectorOption) => {
    if (renderSelected) {
      return renderSelected(option)
    }
    return option.label
  }

  const renderOptionContent = (option: SearchableSelectorOption) => {
    if (renderOption) {
      return renderOption(option)
    }

    return (
      <div className="block">
        <span className="font-medium">{option.label}</span>
        {option.subtitle && (
          <span className="block text-xs text-gray-500 dark:text-gray-400">
            {option.subtitle}
          </span>
        )}
      </div>
    )
  }

  const isOptionSelected = (option: SearchableSelectorOption) => {
    if (multiple && Array.isArray(value)) {
      return value.some(v => v.id === option.id)
    }
    return value && (value as SearchableSelectorOption).id === option.id
  }

  return (
    <div className={cn('w-full', className)}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      <Combobox
        value={value}
        onChange={handleSelection}
        multiple={multiple}
        disabled={disabled}
      >
        <div className="relative">
          {/* Input de busca */}
          <div className="relative w-full cursor-default overflow-hidden rounded-lg bg-white dark:bg-gray-700 text-left shadow-sm border border-gray-300 dark:border-gray-600 focus-within:ring-2 focus-within:ring-blue-500">
            <Combobox.Input
              className={cn(
                'w-full border-none py-2 text-sm leading-5 text-gray-900 dark:text-white bg-transparent focus:ring-0 focus:outline-none',
                Icon ? 'pl-10' : 'pl-3',
                'pr-10',
              )}
              displayValue={() => {
                if (multiple && Array.isArray(value) && value.length > 0) {
                  return `${value.length} selecionado(s)`
                }
                if (!multiple && value) {
                  return (value as SearchableSelectorOption).label
                }
                return ''
              }}
              onChange={handleInputChange}
              placeholder={searchPlaceholder}
            />

            {Icon && (
              <div className="absolute inset-y-0 left-0 flex items-center pl-3">
                <Icon className="h-5 w-5 text-gray-400" />
              </div>
            )}

            <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2">
              {isLoading ? (
                <div className="animate-spin h-5 w-5 border-2 border-gray-300 border-t-blue-600 rounded-full" />
              ) : (
                <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
              )}
            </Combobox.Button>
          </div>

          {/* Tags para seleção múltipla */}
          {multiple && Array.isArray(value) && value.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {value.map((option) => (
                <span
                  key={option.id}
                  className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-md"
                >
                  {getDisplayValue(option)}
                  <button
                    type="button"
                    onClick={() => removeOption(option)}
                    className="hover:text-blue-600 dark:hover:text-blue-300"
                  >
                    <XMarkIcon className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Dropdown de opções */}
          <Transition
            as={Fragment}
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
            afterLeave={() => setQuery('')}
          >
            <Combobox.Options className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white dark:bg-gray-700 py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
              {query.length > 0 && query.length < searchThreshold && onSearch ? (
                <div className="relative cursor-default select-none py-2 px-4 text-gray-500 dark:text-gray-400">
                  Digite pelo menos {searchThreshold} caracteres para buscar...
                </div>
              ) : filteredOptions.length === 0 && query !== '' ? (
                <div className="relative cursor-default select-none py-2 px-4 text-gray-700 dark:text-gray-300">
                  Nenhum resultado encontrado.
                </div>
              ) : (
                filteredOptions.map((option) => (
                  <Combobox.Option
                    key={option.id}
                    className={({ active }) =>
                      cn(
                        'relative cursor-default select-none py-2 pl-10 pr-4',
                        active ? 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100' : 'text-gray-900 dark:text-white',
                        option.disabled && 'opacity-50 cursor-not-allowed',
                      )
                    }
                    value={option}
                    disabled={option.disabled}
                  >
                    {({ active }) => (
                      <>
                        {renderOptionContent(option)}
                        {isOptionSelected(option) && (
                          <span className={cn(
                            'absolute inset-y-0 left-0 flex items-center pl-3',
                            active ? 'text-blue-600' : 'text-blue-600 dark:text-blue-400',
                          )}>
                            <CheckIcon className="h-5 w-5" aria-hidden="true" />
                          </span>
                        )}
                      </>
                    )}
                  </Combobox.Option>
                ))
              )}
            </Combobox.Options>
          </Transition>
        </div>
      </Combobox>

      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  )
}