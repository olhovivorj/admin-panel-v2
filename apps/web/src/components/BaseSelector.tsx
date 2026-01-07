import { useState, useRef, useEffect } from 'react'
import { BuildingOfficeIcon, ChevronDownIcon, CheckIcon } from '@heroicons/react/24/outline'
import { useBase } from '@/contexts/BaseContext'

export function BaseSelector() {
  const {
    bases,
    selectedBase,
    isLoading,
    selectBase,
    isAdmin,
    canSelectBase,
  } = useBase()

  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSearchTerm('')
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Focar no input quando abrir
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  // Não mostrar selector para usuários não-admin
  if (!canSelectBase) {
    return (
      <div className="w-64">
        <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Base Ativa</div>
        <div className="flex items-center px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md">
          <BuildingOfficeIcon className="h-4 w-4 text-gray-400 mr-2" />
          <div className="flex-1">
            <div className="text-sm text-gray-900 dark:text-white">
              {selectedBase?.NOME || 'Carregando...'}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {selectedBase?.BASE} • ID: {selectedBase?.baseId}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="w-64">
        <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Base Ativa</div>
        <div className="animate-pulse">
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-md"></div>
        </div>
      </div>
    )
  }

  // Filtrar bases pelo termo de busca
  const filteredBases = searchTerm
    ? bases.filter(base =>
      base.NOME.toLowerCase().includes(searchTerm.toLowerCase()) ||
        base.BASE.toLowerCase().includes(searchTerm.toLowerCase()),
    )
    : bases

  const handleSelectBase = (baseCode: string) => {
    selectBase(baseCode)
    setIsOpen(false)
    setSearchTerm('')
  }

  return (
    <div className="w-64 relative" ref={dropdownRef}>
      {/* Botão principal */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
      >
        <div className="flex items-center gap-2">
          <BuildingOfficeIcon className="h-4 w-4 text-gray-400" />
          <div className="text-left">
            {selectedBase ? (
              <div className="font-medium text-gray-900 dark:text-white">{selectedBase.NOME}</div>
            ) : (
              <div className="text-gray-500">Selecione uma base</div>
            )}
          </div>
        </div>
        <ChevronDownIcon className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg">
          {/* Campo de busca */}
          <div className="p-2 border-b border-gray-200 dark:border-gray-700">
            <input
              ref={inputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Digite para buscar..."
              className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Lista de opções */}
          <div className="max-h-60 overflow-y-auto">
            {/* Bases filtradas */}
            {filteredBases.length > 0 ? (
              filteredBases.map(base => (
                <button
                  key={base.baseId}
                  onClick={() => handleSelectBase(base.BASE)}
                  className={`w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-between group ${
                    selectedBase?.BASE === base.BASE ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                  }`}
                >
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">{base.NOME}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {base.BASE} • ID: {base.baseId}
                      {(base as any).clienteCount !== undefined && ` • ${(base as any).clienteCount} clientes`}
                    </div>
                  </div>
                  {selectedBase?.BASE === base.BASE && (
                    <CheckIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  )}
                </button>
              ))
            ) : (
              <div className="px-3 py-4 text-sm text-gray-500 dark:text-gray-400 text-center">
                Nenhuma base encontrada
              </div>
            )}
          </div>
        </div>
      )}

      {/* Status da base */}
      {!isAdmin && selectedBase && (
        <div className="mt-1 text-xs text-blue-600 dark:text-blue-400">
          Base restrita ao seu usuário
        </div>
      )}
    </div>
  )
}