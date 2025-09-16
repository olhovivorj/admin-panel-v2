import React, { useState } from 'react'
import { BuildingStorefrontIcon, BeakerIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline'
import { useQuery } from '@tanstack/react-query'
import api from '@/services/api'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { Button } from '@/components/common/Button'

interface TestResult {
  endpoint: string
  lojaId?: number
  success: boolean
  message: string
  data?: any
}

export function LojaAccessTest({ userId }: { userId: number }) {
  const [testResults, setTestResults] = useState<TestResult[]>([])
  const [testing, setTesting] = useState(false)

  // Buscar lojas do usuário
  const { data: userLojas } = useQuery({
    queryKey: ['user-lojas-test', userId],
    queryFn: async () => {
      const response = await api.get(`/usuarios/${userId}/lojas`)
      return response.data.data
    },
  })

  // Buscar todas as lojas disponíveis
  const { data: todasLojas } = useQuery({
    queryKey: ['all-lojas'],
    queryFn: async () => {
      const response = await api.get('/api/admin/lojas')
      return response.data.data || []
    },
  })

  const runTests = async () => {
    setTesting(true)
    setTestResults([])
    
    const results: TestResult[] = []
    
    // Teste 1: Buscar clientes sem especificar loja
    try {
      const response = await api.get('/api/crm/clientes?limit=5')
      results.push({
        endpoint: '/api/crm/clientes',
        success: true,
        message: `Retornou ${response.data.data?.length || 0} clientes`,
        data: response.data.data,
      })
    } catch (error: any) {
      results.push({
        endpoint: '/api/crm/clientes',
        success: false,
        message: error.response?.data?.message || 'Erro ao buscar clientes',
      })
    }
    
    // Teste 2: Se tem lojas específicas, testar acesso
    if (userLojas && !userLojas.acessoTotal && userLojas.lojas.length > 0) {
      // Testar loja permitida
      const lojaPermitida = userLojas.lojas[0]
      try {
        const response = await api.get(`/api/crm/clientes?limit=5&lojaId=${lojaPermitida.empresaId}`)
        results.push({
          endpoint: '/api/crm/clientes',
          lojaId: lojaPermitida.empresaId,
          success: true,
          message: `Acesso permitido à loja ${lojaPermitida.nomeLoja}`,
          data: response.data.data,
        })
      } catch (error: any) {
        results.push({
          endpoint: '/api/crm/clientes',
          lojaId: lojaPermitida.empresaId,
          success: false,
          message: `Erro ao acessar loja ${lojaPermitida.nomeLoja}: ${error.response?.data?.message}`,
        })
      }
      
      // Testar loja NÃO permitida (se houver)
      const lojaNaoPermitida = todasLojas?.find((loja: any) => 
        !userLojas.lojas.some((ul: any) => ul.empresaId === loja.id)
      )
      
      if (lojaNaoPermitida) {
        try {
          const response = await api.get(`/api/crm/clientes?limit=5&lojaId=${lojaNaoPermitida.id}`)
          results.push({
            endpoint: '/api/crm/clientes',
            lojaId: lojaNaoPermitida.id,
            success: false,
            message: `ERRO: Conseguiu acessar loja ${lojaNaoPermitida.nome} sem permissão!`,
            data: response.data.data,
          })
        } catch (error: any) {
          results.push({
            endpoint: '/api/crm/clientes',
            lojaId: lojaNaoPermitida.id,
            success: true,
            message: `Acesso negado corretamente à loja ${lojaNaoPermitida.nome}`,
          })
        }
      }
    }
    
    // Teste 3: Verificar isolamento de dados
    if (userLojas && !userLojas.acessoTotal && userLojas.lojas.length > 0) {
      try {
        const response = await api.get('/api/vendas/pedidos?limit=10&dataInicio=2024-01-01&dataFim=2024-12-31')
        const vendas = response.data.data || []
        
        // Verificar se todas as vendas são das lojas permitidas
        const lojasPermitidas = userLojas.lojas.map((l: any) => l.empresaId)
        const vendasForaDoEscopo = vendas.filter((venda: any) => 
          !lojasPermitidas.includes(venda.lojaId || venda.ID_EMPRESA)
        )
        
        if (vendasForaDoEscopo.length > 0) {
          results.push({
            endpoint: '/api/vendas/pedidos',
            success: false,
            message: `ERRO: ${vendasForaDoEscopo.length} vendas de lojas não permitidas foram retornadas!`,
            data: vendasForaDoEscopo,
          })
        } else {
          results.push({
            endpoint: '/api/vendas/pedidos',
            success: true,
            message: `✅ Isolamento funcionando: ${vendas.length} vendas, todas das lojas permitidas`,
          })
        }
      } catch (error: any) {
        results.push({
          endpoint: '/api/vendas/pedidos',
          success: false,
          message: `Erro ao testar vendas: ${error.response?.data?.message}`,
        })
      }
    }
    
    setTestResults(results)
    setTesting(false)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center gap-2">
          <BeakerIcon className="h-5 w-5" />
          Teste de Acesso às Lojas
        </h3>
        
        <Button
          onClick={runTests}
          disabled={testing}
          size="sm"
          className="flex items-center gap-2"
        >
          {testing ? (
            <>
              <LoadingSpinner size="xs" />
              Testando...
            </>
          ) : (
            <>
              <BeakerIcon className="h-4 w-4" />
              Executar Testes
            </>
          )}
        </Button>
      </div>
      
      {/* Informações do usuário */}
      {userLojas && (
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <BuildingStorefrontIcon className="h-5 w-5 text-gray-500" />
            <span className="font-medium text-gray-900 dark:text-white">
              Configuração de Lojas
            </span>
          </div>
          
          {userLojas.acessoTotal ? (
            <p className="text-sm text-green-600 dark:text-green-400">
              ✅ Acesso total - Pode ver dados de todas as lojas
            </p>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Acesso restrito a {userLojas.lojas.length} loja(s):
              </p>
              <div className="flex flex-wrap gap-2">
                {userLojas.lojas.map((loja: any) => (
                  <span
                    key={loja.id}
                    className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs rounded"
                  >
                    {loja.nomeLoja}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Resultados dos testes */}
      {testResults.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium text-gray-900 dark:text-white">Resultados:</h4>
          
          {testResults.map((result, index) => (
            <div
              key={index}
              className={`p-3 rounded-lg border ${
                result.success
                  ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                  : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
              }`}
            >
              <div className="flex items-start gap-2">
                {result.success ? (
                  <CheckCircleIcon className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
                ) : (
                  <XCircleIcon className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5" />
                )}
                
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {result.endpoint}
                    {result.lojaId && ` (Loja ID: ${result.lojaId})`}
                  </p>
                  <p className={`text-sm mt-1 ${
                    result.success
                      ? 'text-green-700 dark:text-green-300'
                      : 'text-red-700 dark:text-red-300'
                  }`}>
                    {result.message}
                  </p>
                  
                  {result.data && (
                    <details className="mt-2">
                      <summary className="text-xs text-gray-600 dark:text-gray-400 cursor-pointer">
                        Ver dados retornados
                      </summary>
                      <pre className="mt-2 text-xs bg-gray-100 dark:bg-gray-900 p-2 rounded overflow-x-auto">
                        {JSON.stringify(result.data, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}