import { useState } from 'react'
import { useBulkClientLoader } from '../hooks/useBulkDataLoader'
import { useBase } from '../contexts/BaseContext'
import { ArrowDownTrayIcon, XCircleIcon, CheckCircleIcon } from '@heroicons/react/24/outline'

export function BulkDataExample() {
  const { selectedBase } = useBase()
  const { loading, error, loadClients, clearCache, cacheSize } = useBulkClientLoader()
  const [progress, setProgress] = useState({ loaded: 0, total: 0 })
  const [result, setResult] = useState<any>(null)

  const handleLoadAllClients = async () => {
    if (!selectedBase?.baseId) {
      alert('Selecione uma base primeiro')
      return
    }

    try {
      const data = await loadClients(
        selectedBase.baseId,
        {
          dataInicial: '20180101', // Desde 2018
          status: 'all', // Todos os status
        },
        false, // Não usar cache para forçar nova carga
      )

      setResult(data)
      console.log('Dados carregados:', data)
    } catch (err) {
      console.error('Erro ao carregar:', err)
    }
  }

  const handleLoadWithProgress = async () => {
    if (!selectedBase?.baseId) {
      alert('Selecione uma base primeiro')
      return
    }

    setProgress({ loaded: 0, total: 0 })
    setResult(null)

    try {
      const { loadBulkData } = await import('../hooks/useBulkDataLoader').then(m => ({
        loadBulkData: new m.useBulkDataLoader().loadBulkData,
      }))

      const data = await loadBulkData({
        endpoint: '/api/clientes',
        baseId: selectedBase.baseId,
        filters: {
          dataInicial: '20180101',
        },
        onProgress: (loaded: number, total: number) => {
          setProgress({ loaded, total })
        },
        onBatch: (batchData: any[], batchNumber: number) => {
          console.log(`Batch ${batchNumber} recebido com ${batchData.length} registros`)
        },
      })

      setResult(data)
    } catch (err) {
      console.error('Erro:', err)
    }
  }

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
      <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
        Teste de Carga em Massa
      </h2>

      <div className="space-y-4">
        {/* Status */}
        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Base selecionada: <span className="font-semibold">{selectedBase?.nome || 'Nenhuma'}</span>
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Cache: {cacheSize} conjunto(s) armazenado(s)
          </p>
        </div>

        {/* Botões de ação */}
        <div className="flex gap-3">
          <button
            onClick={handleLoadAllClients}
            disabled={loading || !selectedBase}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowDownTrayIcon className="w-5 h-5" />
            Carregar Todos os Clientes
          </button>

          <button
            onClick={handleLoadWithProgress}
            disabled={loading || !selectedBase}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowDownTrayIcon className="w-5 h-5" />
            Carregar com Progresso
          </button>

          <button
            onClick={clearCache}
            className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            <XCircleIcon className="w-5 h-5" />
            Limpar Cache
          </button>
        </div>

        {/* Loading e Progresso */}
        {loading && (
          <div className="bg-blue-50 dark:bg-blue-900 p-4 rounded">
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <div>
                <p className="text-blue-700 dark:text-blue-300 font-medium">
                  Carregando dados...
                </p>
                {progress.total > 0 && (
                  <div className="mt-2">
                    <div className="flex justify-between text-sm text-blue-600 dark:text-blue-400">
                      <span>{progress.loaded.toLocaleString()} de {progress.total.toLocaleString()}</span>
                      <span>{Math.round((progress.loaded / progress.total) * 100)}%</span>
                    </div>
                    <div className="mt-1 w-full bg-blue-200 dark:bg-blue-700 rounded-full h-2">
                      <div
                        className="bg-blue-600 dark:bg-blue-400 h-2 rounded-full transition-all"
                        style={{ width: `${(progress.loaded / progress.total) * 100}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Erro */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900 p-4 rounded">
            <div className="flex items-center gap-3">
              <XCircleIcon className="w-8 h-8 text-red-600 dark:text-red-400" />
              <div>
                <p className="text-red-700 dark:text-red-300 font-medium">Erro ao carregar dados</p>
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Resultado */}
        {result && !loading && (
          <div className="bg-green-50 dark:bg-green-900 p-4 rounded">
            <div className="flex items-center gap-3">
              <CheckCircleIcon className="w-8 h-8 text-green-600 dark:text-green-400" />
              <div>
                <p className="text-green-700 dark:text-green-300 font-medium">
                  Carga concluída com sucesso!
                </p>
                <div className="mt-2 space-y-1 text-sm text-green-600 dark:text-green-400">
                  <p>• Total de registros: {result.totalCount?.toLocaleString()}</p>
                  <p>• Tempo de carga: {(result.loadTime / 1000).toFixed(2)}s</p>
                  <p>• Número de lotes: {result.batchCount}</p>
                  <p>• Dados em cache: {result.fromCache ? 'Sim' : 'Não'}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Preview dos dados */}
        {result?.data && result.data.length > 0 && (
          <div className="mt-4">
            <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">
              Preview (primeiros 5 registros)
            </h3>
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded overflow-x-auto">
              <pre className="text-xs text-gray-600 dark:text-gray-300">
                {JSON.stringify(result.data.slice(0, 5), null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}