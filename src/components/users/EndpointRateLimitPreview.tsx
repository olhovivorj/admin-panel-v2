import React, { useState } from 'react'
import { EndpointRateLimitConfig } from './EndpointRateLimitConfig'

/**
 * Componente de preview/teste para o EndpointRateLimitConfig
 * TEMPORÁRIO - apenas para testar antes de integrar no formulário principal
 */
export const EndpointRateLimitPreview: React.FC = () => {
  const [permissions, setPermissions] = useState<Record<string, any>>({})

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Preview: Configuração Rate Limit por Endpoint
        </h1>

        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mb-6">
          <h2 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
            ℹ️ Componente de Teste
          </h2>
          <p className="text-sm text-blue-700 dark:text-blue-300">
            Este é um preview do componente EndpointRateLimitConfig antes de integrar no formulário principal.
            Teste todas as funcionalidades aqui para garantir que está funcionando corretamente.
          </p>
        </div>

        {/* Componente sendo testado */}
        <EndpointRateLimitConfig
          value={permissions}
          onChange={setPermissions}
          className="mb-6"
        />

        {/* Debug - mostrar valor atual */}
        <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Debug - Valor Atual:
          </h3>
          <pre className="text-xs text-gray-600 dark:text-gray-400 overflow-auto">
            {JSON.stringify(permissions, null, 2)}
          </pre>
        </div>

        {/* Instruções de teste */}
        <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
          <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-2">
            🧪 Checklist de Testes:
          </h3>
          <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
            <li>• Expandir/recolher o componente</li>
            <li>• Testar presets (Básico, Completo, Analytics)</li>
            <li>• Habilitar/desabilitar endpoints individuais</li>
            <li>• Alterar valores de rate limit</li>
            <li>• Verificar resumo das configurações</li>
            <li>• Testar tema claro/escuro</li>
            <li>• Verificar responsividade</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default EndpointRateLimitPreview