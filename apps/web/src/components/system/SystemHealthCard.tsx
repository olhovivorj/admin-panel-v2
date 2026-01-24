import { useQuery } from '@tanstack/react-query'
import { systemService, ServiceHealth } from '@/services/system'
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline'

function formatUptime(ms: number): string {
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 0) return `${days}d ${hours % 24}h`
  if (hours > 0) return `${hours}h ${minutes % 60}m`
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`
  return `${seconds}s`
}

function ServiceItem({ service }: { service: ServiceHealth }) {
  const isHealthy = service.status === 'healthy'
  const Icon = isHealthy ? CheckCircleIcon : ExclamationCircleIcon

  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
      <div className="flex items-center gap-2">
        <Icon
          className={`w-5 h-5 ${isHealthy ? 'text-green-500' : 'text-red-500'}`}
        />
        <span className="text-sm text-gray-700 dark:text-gray-300">
          {service.name}
        </span>
      </div>
      <div className="flex items-center gap-3 text-xs">
        {service.details?.uptimeMs !== undefined && isHealthy && (
          <span className="text-gray-500 dark:text-gray-400">
            Uptime: {formatUptime(service.details.uptimeMs)}
          </span>
        )}
        {service.details?.reconnectAttempts !== undefined &&
          service.details.reconnectAttempts > 0 && (
            <span className="text-yellow-600 dark:text-yellow-400">
              Reconexões: {service.details.reconnectAttempts}
            </span>
          )}
        {service.error && (
          <span className="text-red-500 truncate max-w-[150px]" title={service.error}>
            {service.error}
          </span>
        )}
        <span className="text-gray-400">{service.responseTimeMs}ms</span>
      </div>
    </div>
  )
}

export function SystemHealthCard() {
  const {
    data: health,
    isLoading,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['system-health'],
    queryFn: systemService.getSystemHealth,
    refetchInterval: 30000, // Atualiza a cada 30 segundos
    staleTime: 10000,
  })

  const statusColors = {
    healthy: 'bg-green-500',
    degraded: 'bg-yellow-500',
    unhealthy: 'bg-red-500',
  }

  const statusLabels = {
    healthy: 'Saudável',
    degraded: 'Degradado',
    unhealthy: 'Indisponível',
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Status do Sistema
        </h3>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          title="Atualizar"
        >
          <ArrowPathIcon
            className={`w-5 h-5 text-gray-500 ${isFetching ? 'animate-spin' : ''}`}
          />
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <ArrowPathIcon className="w-6 h-6 text-gray-400 animate-spin" />
        </div>
      ) : error ? (
        <div className="text-center py-4">
          <ExclamationCircleIcon className="w-8 h-8 text-red-500 mx-auto mb-2" />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Erro ao carregar status
          </p>
        </div>
      ) : health ? (
        <>
          {/* Status Geral */}
          <div className="flex items-center gap-2 mb-4">
            <div
              className={`w-3 h-3 rounded-full ${statusColors[health.status]}`}
            />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {statusLabels[health.status]}
            </span>
            <span className="text-xs text-gray-400 ml-auto">
              {new Date(health.timestamp).toLocaleTimeString('pt-BR')}
            </span>
          </div>

          {/* Lista de Serviços */}
          <div className="space-y-1">
            {health.services.map((service) => (
              <ServiceItem key={service.name} service={service} />
            ))}
          </div>
        </>
      ) : null}
    </div>
  )
}
