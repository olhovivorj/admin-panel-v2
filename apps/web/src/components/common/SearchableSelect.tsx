import Select, {
  Props as SelectProps,
  GroupBase,
  StylesConfig,
  components,
  DropdownIndicatorProps,
  ClearIndicatorProps,
} from 'react-select'
import { ChevronUpDownIcon, XMarkIcon } from '@heroicons/react/24/outline'

export interface SelectOption {
  value: any
  label: string
  subtitle?: string
  disabled?: boolean
  [key: string]: any
}

interface SearchableSelectProps extends Omit<SelectProps<SelectOption, boolean, GroupBase<SelectOption>>, 'styles'> {
  label?: string
  error?: string
  required?: boolean
  onSearch?: (query: string) => void
  searchThreshold?: number
  icon?: React.ComponentType<{ className?: string }>
}

// Componentes customizados
const DropdownIndicator = (props: DropdownIndicatorProps<SelectOption>) => (
  <components.DropdownIndicator {...props}>
    <ChevronUpDownIcon className="h-5 w-5 text-gray-400" />
  </components.DropdownIndicator>
)

const ClearIndicator = (props: ClearIndicatorProps<SelectOption>) => (
  <components.ClearIndicator {...props}>
    <XMarkIcon className="h-4 w-4 text-gray-400 hover:text-gray-600" />
  </components.ClearIndicator>
)

// Estilos customizados para o tema
const getCustomStyles = (error?: string): StylesConfig<SelectOption, boolean> => ({
  control: (provided, state) => ({
    ...provided,
    backgroundColor: 'var(--color-bg)',
    borderColor: error
      ? '#ef4444'
      : state.isFocused
        ? '#3b82f6'
        : 'var(--color-border)',
    borderWidth: '1px',
    borderRadius: '0.5rem',
    boxShadow: state.isFocused
      ? '0 0 0 2px rgba(59, 130, 246, 0.2)'
      : 'none',
    minHeight: '2.5rem',
    '&:hover': {
      borderColor: state.isFocused ? '#3b82f6' : 'var(--color-border-hover)',
    },
  }),

  input: (provided) => ({
    ...provided,
    color: 'var(--color-text)',
  }),

  placeholder: (provided) => ({
    ...provided,
    color: 'var(--color-text-muted)',
  }),

  singleValue: (provided) => ({
    ...provided,
    color: 'var(--color-text)',
  }),

  menu: (provided) => ({
    ...provided,
    backgroundColor: 'var(--color-bg)',
    border: '1px solid var(--color-border)',
    borderRadius: '0.5rem',
    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    zIndex: 50,
  }),

  option: (provided, state) => ({
    ...provided,
    backgroundColor: state.isSelected
      ? '#3b82f6'
      : state.isFocused
        ? 'var(--color-bg-hover)'
        : 'transparent',
    color: state.isSelected
      ? 'white'
      : 'var(--color-text)',
    padding: '0.5rem 0.75rem',
    '&:active': {
      backgroundColor: state.isSelected ? '#3b82f6' : 'var(--color-bg-hover)',
    },
  }),

  multiValue: (provided) => ({
    ...provided,
    backgroundColor: '#dbeafe',
    borderRadius: '0.375rem',
  }),

  multiValueLabel: (provided) => ({
    ...provided,
    color: '#1e40af',
    fontSize: '0.875rem',
  }),

  multiValueRemove: (provided) => ({
    ...provided,
    color: '#1e40af',
    '&:hover': {
      backgroundColor: '#3b82f6',
      color: 'white',
    },
  }),

  noOptionsMessage: (provided) => ({
    ...provided,
    color: 'var(--color-text-muted)',
    padding: '0.5rem 0.75rem',
  }),

  loadingMessage: (provided) => ({
    ...provided,
    color: 'var(--color-text-muted)',
    padding: '0.5rem 0.75rem',
  }),
})

export function SearchableSelect({
  label,
  error,
  required,
  onSearch,
  searchThreshold = 3,
  onInputChange,
  className = '',
  ...props
}: SearchableSelectProps) {

  const handleInputChange = (inputValue: string, actionMeta: any) => {
    // Chamar callback original se existir
    onInputChange?.(inputValue, actionMeta)

    // Busca customizada
    if (onSearch && inputValue.length >= searchThreshold) {
      onSearch(inputValue)
    }
  }

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      <Select
        {...props}
        styles={getCustomStyles(error)}
        components={{
          DropdownIndicator,
          ClearIndicator,
          ...props.components,
        }}
        onInputChange={handleInputChange}
        placeholder={props.placeholder || 'Digite para pesquisar...'}
        noOptionsMessage={({ inputValue }) =>
          onSearch && inputValue.length < searchThreshold
            ? `Digite pelo menos ${searchThreshold} caracteres para buscar`
            : 'Nenhum resultado encontrado'
        }
        loadingMessage={() => 'Carregando...'}
        classNamePrefix="react-select"
        formatOptionLabel={(option: SelectOption) => (
          <div>
            <div className="font-medium">{option.label}</div>
            {option.subtitle && (
              <div className="text-xs text-gray-500">{option.subtitle}</div>
            )}
          </div>
        )}
      />

      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  )
}

// CSS personalizado para trabalhar com Tailwind
export const reactSelectStyles = `
:root {
  --color-bg: rgb(255 255 255);
  --color-bg-hover: rgb(243 244 246);
  --color-border: rgb(209 213 219);
  --color-border-hover: rgb(156 163 175);
  --color-text: rgb(17 24 39);
  --color-text-muted: rgb(107 114 128);
}

.dark {
  --color-bg: rgb(55 65 81);
  --color-bg-hover: rgb(75 85 99);
  --color-border: rgb(75 85 99);
  --color-border-hover: rgb(107 114 128);
  --color-text: rgb(243 244 246);
  --color-text-muted: rgb(156 163 175);
}

.react-select__control {
  border-color: var(--color-border) !important;
}

.react-select__control--is-focused {
  border-color: #3b82f6 !important;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2) !important;
}

.react-select__menu {
  background-color: var(--color-bg) !important;
  border: 1px solid var(--color-border) !important;
}

.react-select__option {
  background-color: transparent !important;
}

.react-select__option--is-focused {
  background-color: var(--color-bg-hover) !important;
}

.react-select__option--is-selected {
  background-color: #3b82f6 !important;
}

.react-select__single-value {
  color: var(--color-text) !important;
}

.react-select__input {
  color: var(--color-text) !important;
}

.react-select__placeholder {
  color: var(--color-text-muted) !important;
}
`