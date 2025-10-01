import { useState, useCallback } from 'react'
import api from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import { isAdmin as checkIsAdmin } from '@/utils/roleHelpers'

interface BulkLoadOptions {
  endpoint: string;
  baseId: number;
  filters?: Record<string, any>;
  onProgress?: (loaded: number, total: number) => void;
  onBatch?: (data: any[], batchNumber: number) => void;
}

interface BulkLoadResult {
  data: any[];
  totalCount: number;
  loadTime: number;
  batchCount: number;
}

export function useBulkDataLoader() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  const loadBulkData = useCallback(async (options: BulkLoadOptions): Promise<BulkLoadResult> => {
    const {
      endpoint,
      baseId,
      filters = {},
      onProgress,
      onBatch,
    } = options

    setLoading(true)
    setError(null)

    const startTime = Date.now()
    const allData: any[] = []
    let batchCount = 0

    try {
      // 1. Primeiro, obter contagem total
      const countEndpoint = endpoint.includes('/count') ? endpoint : `${endpoint}/count`
      const countResponse = await api.get(countEndpoint, {
        params: {
          baseId,
          ...filters,
        },
      })

      const totalCount = countResponse.data?.data?.count || 0

      if (totalCount === 0) {
        return {
          data: [],
          totalCount: 0,
          loadTime: Date.now() - startTime,
          batchCount: 0,
        }
      }

      // 2. Determinar tamanho do batch baseado no role
      const isAdmin = checkIsAdmin(user)
      const batchSize = isAdmin ? 20000 : 5000

      // 3. Calcular número de batches necessários
      const totalBatches = Math.ceil(totalCount / batchSize)

      console.log(`📊 Iniciando carga de ${totalCount} registros em ${totalBatches} lotes de ${batchSize}`)

      // 4. Snapshot timestamp para consistência entre requisições
      const snapshotTime = new Date().toISOString()

      // 5. Fazer requisições em sequência para manter ordem
      for (let page = 1; page <= totalBatches; page++) {
        const response = await api.get(endpoint, {
          params: {
            baseId,
            ...filters,
            per_page: batchSize,
            page: page,
            // Manter compatibilidade com API legada
            limit: batchSize,
            offset: (page - 1) * batchSize,
            // Snapshot para consistência
            _snapshot: snapshotTime,
            // Ordenação consistente
            sort_by: 'id',
            sort_order: 'asc',
          },
        })

        const batchData = response.data?.data || []
        allData.push(...batchData)
        batchCount++

        // Callback de progresso
        if (onProgress) {
          onProgress(allData.length, totalCount)
        }

        // Callback por batch (útil para processar dados incrementalmente)
        if (onBatch) {
          onBatch(batchData, page)
        }

        // Log de progresso
        console.log(`✅ Lote ${page}/${totalBatches} carregado: ${batchData.length} registros`)

        // Pequeno delay entre requisições para não sobrecarregar
        if (page < totalBatches) {
          await new Promise(resolve => setTimeout(resolve, 100))
        }
      }

      const loadTime = Date.now() - startTime
      console.log(`🎉 Carga completa: ${allData.length} registros em ${loadTime}ms`)

      return {
        data: allData,
        totalCount: allData.length,
        loadTime,
        batchCount,
      }

    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Erro ao carregar dados'
      setError(errorMessage)
      console.error('❌ Erro na carga bulk:', errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }, [user])

  return {
    loading,
    error,
    loadBulkData,
  }
}

// Hook específico para clientes com cache opcional
export function useBulkClientLoader() {
  const bulkLoader = useBulkDataLoader()
  const [cachedData, setCachedData] = useState<Map<string, any[]>>(new Map())

  const loadClients = useCallback(async (
    baseId: number,
    filters?: Record<string, any>,
    useCache = true,
  ) => {
    // Gerar chave de cache baseada nos filtros
    const cacheKey = JSON.stringify({ baseId, ...filters })

    // Verificar cache
    if (useCache && cachedData.has(cacheKey)) {
      console.log('📦 Retornando dados do cache')
      return {
        data: cachedData.get(cacheKey)!,
        fromCache: true,
      }
    }

    // Carregar dados
    const result = await bulkLoader.loadBulkData({
      endpoint: '/api/clientes',
      baseId,
      filters,
      onProgress: (loaded, total) => {
        console.log(`📈 Progresso: ${loaded}/${total} (${Math.round(loaded/total * 100)}%)`)
      },
    })

    // Atualizar cache
    if (useCache) {
      setCachedData(prev => new Map(prev).set(cacheKey, result.data))
    }

    return {
      ...result,
      fromCache: false,
    }
  }, [bulkLoader, cachedData])

  const clearCache = useCallback(() => {
    setCachedData(new Map())
    console.log('🗑️ Cache limpo')
  }, [])

  return {
    ...bulkLoader,
    loadClients,
    clearCache,
    cacheSize: cachedData.size,
  }
}