import React, { useState } from 'react'
import { Cog6ToothIcon } from '@heroicons/react/24/outline'

// Definição dos endpoints disponíveis - TAG CRM
const AVAILABLE_ENDPOINTS = [
  { endpoint: 'clientes', name: 'Clientes', category: 'CRM' },
  { endpoint: 'produtos', name: 'Produtos', category: 'CRM' },
  { endpoint: 'vendas', name: 'Vendas', category: 'CRM' },
  { endpoint: 'vendas-itens', name: 'Itens de Vendas', category: 'CRM' },
  { endpoint: 'vendedores', name: 'Vendedores', category: 'CRM' },
  { endpoint: 'lojas', name: 'Lojas/Empresas', category: 'CRM' },
]

interface EndpointRateLimitConfigProps {
  value: any
  onChange: (value: any) => void
  className?: string
  compact?: boolean
}

export const EndpointRateLimitConfig: React.FC<EndpointRateLimitConfigProps> = ({
  value = {},
  onChange,
  className = '',
}) => {
  const [isExpanded, setIsExpanded] = useState(false)
  
  // Garantir que value não é null/undefined
  const safeValue = value || {}
  
  // Converter array de strings para objeto se necessário
  const permissions = typeof safeValue === 'object' && !Array.isArray(safeValue) ? safeValue : 
    Array.isArray(safeValue) ? 
      safeValue.reduce((acc, endpoint) => ({ ...acc, [endpoint]: true }), {}) : 
      {}

  const toggleEndpoint = (endpoint: string) => {
    const newPermissions = { ...permissions }
    if (newPermissions[endpoint]) {
      delete newPermissions[endpoint]
    } else {
      newPermissions[endpoint] = true
    }
    onChange(newPermissions)
  }

  // Garantir que permissions não é undefined antes de usar Object.keys
  const enabledEndpoints = permissions ? Object.keys(permissions).filter(k => permissions[k]) : []
  const enabledCount = enabledEndpoints.length

  return (
    <div className={`border border-gray-200 dark:border-gray-600 rounded-lg ${className}`}>
      {/* Header Compacto */}
      <div
        className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <Cog6ToothIcon className="h-4 w-4 text-gray-500" />
          <div>
            <h3 className="text-xs font-medium text-gray-900 dark:text-white">
              Endpoints Permitidos
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {enabledCount} selecionados
            </p>
          </div>
        </div>
        <div className="text-gray-400 text-xs">
          {isExpanded ? '▼' : '▶'}
        </div>
      </div>

      {/* Content Expandido */}
      {isExpanded && (
        <div className="border-t border-gray-200 dark:border-gray-600 p-3">
          {/* Presets Rápidos */}
          <div className="flex gap-1 mb-3">
            <button
              type="button"
              onClick={() => onChange({
                clientes: true,
                produtos: true,
                lojas: true,
              })}
              className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200"
            >
              Básico
            </button>
            <button
              type="button"
              onClick={() => onChange({
                clientes: true,
                produtos: true,
                vendas: true,
                vendedores: true,
                lojas: true,
              })}
              className="px-2 py-1 text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded hover:bg-green-200"
            >
              Vendas
            </button>
            <button
              type="button"
              onClick={() => onChange(
                AVAILABLE_ENDPOINTS.reduce((acc, e) => ({ ...acc, [e.endpoint]: true }), {})
              )}
              className="px-2 py-1 text-xs bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded hover:bg-purple-200"
            >
              Todos
            </button>
            <button
              type="button"
              onClick={() => onChange({})}
              className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200"
            >
              Limpar
            </button>
          </div>

          {/* Lista de Endpoints CRM */}
          <div className="mb-3">
            <h5 className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
              Endpoints CRM Disponíveis
            </h5>
            <div className="grid grid-cols-2 gap-1">
              {AVAILABLE_ENDPOINTS.map(endpoint => (
                <label
                  key={endpoint.endpoint}
                  className="flex items-center gap-1 text-xs cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 p-1 rounded"
                >
                  <input
                    type="checkbox"
                    checked={!!permissions[endpoint.endpoint]}
                    onChange={() => toggleEndpoint(endpoint.endpoint)}
                    className="h-3 w-3 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-gray-700 dark:text-gray-300">
                    {endpoint.name}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Resumo Compacto */}
          {enabledCount > 0 && (
            <div className="mt-3 p-2 bg-gray-50 dark:bg-gray-700 rounded text-xs">
              <span className="font-medium text-gray-700 dark:text-gray-300">Selecionados:</span>
              <div className="mt-1 flex flex-wrap gap-1">
                {enabledEndpoints.map(ep => (
                  <span
                    key={ep}
                    className="inline-block px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full text-xs"
                  >
                    {ep}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default EndpointRateLimitConfig