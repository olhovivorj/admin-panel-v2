import { ExclamationTriangleIcon, ArrowPathIcon } from '@heroicons/react/24/outline'
import { Button } from './Button'

interface ErrorFallbackProps {
  error?: Error
  resetError?: () => void
  title?: string
  description?: string
  showRetry?: boolean
}

export function ErrorFallback({
  error,
  resetError,
  title = 'Algo deu errado',
  description = 'Ocorreu um erro inesperado. Por favor, tente novamente.',
  showRetry = true,
}: ErrorFallbackProps) {
  const handleRefresh = () => {
    window.location.reload()
  }

  return (
    <div className="min-h-64 flex items-center justify-center p-6">
      <div className="text-center">
        <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-red-500" />
        <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-gray-100">
          {title}
        </h3>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          {description}
        </p>

        {error && import.meta.env.DEV && (
          <details className="mt-4 text-left">
            <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
              Detalhes do erro (desenvolvimento)
            </summary>
            <pre className="mt-2 text-xs bg-gray-100 dark:bg-gray-800 p-3 rounded overflow-auto">
              {error.message}
              {error.stack && `\n\n${error.stack}`}
            </pre>
          </details>
        )}

        <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
          {showRetry && resetError && (
            <Button
              onClick={resetError}
              variant="primary"
              icon={ArrowPathIcon}
            >
              Tentar novamente
            </Button>
          )}
          <Button
            onClick={handleRefresh}
            variant="outline"
          >
            Recarregar página
          </Button>
        </div>
      </div>
    </div>
  )
}

// Fallback específico para quando dados não carregam
export function DataLoadError({ onRetry }: { onRetry?: () => void }) {
  return (
    <ErrorFallback
      title="Erro ao carregar dados"
      description="Não foi possível carregar os dados. Verifique sua conexão e tente novamente."
      resetError={onRetry}
      showRetry={!!onRetry}
    />
  )
}

// Fallback para quando não há dados
export function EmptyState({
  title = 'Nenhum dado encontrado',
  description = 'Não há dados para exibir no momento.',
  action,
}: {
  title?: string
  description?: string
  action?: React.ReactNode
}) {
  return (
    <div className="min-h-64 flex items-center justify-center p-6">
      <div className="text-center">
        <div className="mx-auto h-12 w-12 text-gray-400">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>
        <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-gray-100">
          {title}
        </h3>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          {description}
        </p>
        {action && (
          <div className="mt-6">
            {action}
          </div>
        )}
      </div>
    </div>
  )
}