import { Fragment, useState } from 'react'
import { Combobox, Transition } from '@headlessui/react'
import { ChevronUpDownIcon, CheckIcon, BuildingOfficeIcon } from '@heroicons/react/24/outline'
import { useBase } from '@/contexts/BaseContext'
import { cn } from '@/utils/cn'

export function SearchableBaseSelector() {
  const { bases, selectedBase, selectedBaseCode, isLoading, selectBase } = useBase()
  const [query, setQuery] = useState('')

  const filteredBases = query === ''
    ? bases
    : bases.filter((base) => {
      const searchTerm = query.toLowerCase()
      return (
        base.NOME.toLowerCase().includes(searchTerm) ||
          base.BASE.toLowerCase().includes(searchTerm) ||
          base.ID_BASE.toString().includes(searchTerm)
      )
    })

  if (isLoading) {
    return (
      <div className="w-64">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-16 mb-2"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-64">
      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
        Base Ativa
      </label>
      <Combobox value={selectedBaseCode} onChange={selectBase}>
        <div className="relative">
          <div className="relative w-full cursor-default overflow-hidden rounded-lg bg-white dark:bg-gray-700 text-left shadow-sm border border-gray-300 dark:border-gray-600 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500">
            <Combobox.Input
              className="w-full border-none py-2 pl-3 pr-10 text-sm leading-5 text-gray-900 dark:text-white bg-transparent focus:ring-0 focus:outline-none"
              displayValue={(baseCode) => {
                const base = bases.find(b => b.BASE === baseCode)
                return base ? `${base.NOME} (${base.BASE})` : ''
              }}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Digite para pesquisar..."
            />
            <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2">
              <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
            </Combobox.Button>
          </div>
          <Transition
            as={Fragment}
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
            afterLeave={() => setQuery('')}
          >
            <Combobox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white dark:bg-gray-700 py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
              {filteredBases.length === 0 && query !== '' ? (
                <div className="relative cursor-default select-none py-2 px-4 text-gray-700 dark:text-gray-300">
                  Nenhuma base encontrada.
                </div>
              ) : (
                filteredBases.map((base) => (
                  <Combobox.Option
                    key={base.ID_BASE}
                    className={({ active }) =>
                      cn(
                        'relative cursor-default select-none py-2 pl-10 pr-4',
                        active ? 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100' : 'text-gray-900 dark:text-white',
                      )
                    }
                    value={base.BASE}
                  >
                    {({ selected, active }) => (
                      <>
                        <div className="flex items-center">
                          <span className={cn('block truncate', selected ? 'font-medium' : 'font-normal')}>
                            {base.NOME}
                          </span>
                          <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                            ({base.BASE} - ID: {base.ID_BASE})
                          </span>
                        </div>
                        {selected ? (
                          <span className={cn(
                            'absolute inset-y-0 left-0 flex items-center pl-3',
                            active ? 'text-blue-600' : 'text-blue-600 dark:text-blue-400',
                          )}>
                            <CheckIcon className="h-5 w-5" aria-hidden="true" />
                          </span>
                        ) : null}
                      </>
                    )}
                  </Combobox.Option>
                ))
              )}
            </Combobox.Options>
          </Transition>
        </div>
      </Combobox>

      {selectedBase && (
        <div className="mt-2 text-xs text-gray-500">
          ID: {selectedBase.baseId}
          {selectedBase.clienteCount !== undefined && (
            <span className="ml-2">• Clientes: {selectedBase.clienteCount}</span>
          )}
        </div>
      )}
    </div>
  )
}