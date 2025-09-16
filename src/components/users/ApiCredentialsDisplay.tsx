import React, { useState } from 'react'
import { KeyIcon, ClipboardDocumentIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline'
import { toast } from 'react-hot-toast'

interface ApiCredentialsDisplayProps {
  apiKey: string
  apiSecret: string
  userName: string
}

export const ApiCredentialsDisplay: React.FC<ApiCredentialsDisplayProps> = ({
  apiKey,
  apiSecret,
  userName,
}) => {
  const [showSecret, setShowSecret] = useState(false)

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast.success(`${label} copiado para a área de transferência!`)
  }

  return (
    <div className="bg-green-50 dark:bg-green-900/20 border border-green-300 dark:border-green-700 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        <KeyIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
        <h3 className="text-sm font-semibold text-green-800 dark:text-green-200">
          Credenciais de API Geradas
        </h3>
      </div>
      
      <p className="text-xs text-green-700 dark:text-green-300 mb-4">
        Salve estas credenciais com segurança. O API Secret não poderá ser recuperado novamente.
      </p>

      {/* API Key */}
      <div className="mb-3">
        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
          API Key
        </label>
        <div className="flex items-center gap-2">
          <code className="flex-1 px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded text-xs font-mono text-gray-800 dark:text-gray-200">
            {apiKey}
          </code>
          <button
            type="button"
            onClick={() => copyToClipboard(apiKey, 'API Key')}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            title="Copiar API Key"
          >
            <ClipboardDocumentIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* API Secret */}
      <div className="mb-4">
        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
          API Secret
        </label>
        <div className="flex items-center gap-2">
          <code className="flex-1 px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded text-xs font-mono text-gray-800 dark:text-gray-200">
            {showSecret ? apiSecret : '•'.repeat(64)}
          </code>
          <button
            type="button"
            onClick={() => setShowSecret(!showSecret)}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            title={showSecret ? 'Ocultar Secret' : 'Mostrar Secret'}
          >
            {showSecret ? (
              <EyeSlashIcon className="h-4 w-4" />
            ) : (
              <EyeIcon className="h-4 w-4" />
            )}
          </button>
          <button
            type="button"
            onClick={() => copyToClipboard(apiSecret, 'API Secret')}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            title="Copiar API Secret"
          >
            <ClipboardDocumentIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Exemplo de uso */}
      <div className="border-t border-green-200 dark:border-green-800 pt-3">
        <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
          Exemplo de uso:
        </p>
        <pre className="text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded overflow-x-auto">
{`curl -H "X-API-Key: ${apiKey}" \\
     -H "X-API-Secret: ${apiSecret}" \\
     http://localhost:3000/api/clientes`}
        </pre>
      </div>
    </div>
  )
}