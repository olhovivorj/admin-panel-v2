import React, { useState } from 'react'
import { Dialog } from '@headlessui/react'
import {
  XMarkIcon,
  PlayIcon,
  ClipboardDocumentIcon,
  ArrowDownTrayIcon,
  DocumentTextIcon,
  TableCellsIcon,
  QuestionMarkCircleIcon,
  CogIcon,
  AdjustmentsHorizontalIcon,
  KeyIcon,
  ArrowsPointingOutIcon,
  ChevronRightIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline'
import { Button } from './Button'
import { LoadingSpinner } from './LoadingSpinner'
import { systemService } from '@/services/system'
import { ExcelExporter, EndpointColumns } from '@/utils/excelExport'
import { usePaginationConfig } from '@/config/pagination.config'
import toast from 'react-hot-toast'
import { DataAnalysisViewer } from '../data-analysis/DataAnalysisViewer'
import { useAuth } from '@/contexts/AuthContext'
import { useBase } from '@/contexts/BaseContext'

// Função para gerar parâmetros padrão para endpoints PontoMarket
const generatePontoMarketParams = (path: string) => {
  // Verificar se tem parâmetros na URL (ex: {idVenda})
  const urlParams = []
  const paramMatches = path.match(/\{(\w+)\}/g)
  if (paramMatches) {
    paramMatches.forEach(match => {
      const paramName = match.replace(/[{}]/g, '')
      urlParams.push({
        name: paramName,
        required: true,
        description: `ID do ${paramName.replace(/([A-Z])/g, ' $1').toLowerCase().trim()}`,
        isUrlParam: true,
      })
    })
  }

  // Parâmetros básicos padronizados em inglês
  const paramsBasicos = [
    { name: 'baseId', required: false, description: 'ID da base (padrão: 49 - Qualina)' },
    { name: 'limit', required: false, description: 'Limite de registros (padrão: 2000000 para buscar tudo)' },
    { name: 'offset', required: false, description: 'Número de registros para pular. Ex: 0=início, 1000=página 2, 2000=página 3' },
  ]

  // Endpoint de indicadores - parâmetros especiais organizados
  if (path.includes('indicadores/stats')) {
    return [
      ...urlParams,
      // Parâmetros principais
      { name: 'periodo', required: false, description: 'Período pré-definido', type: 'select',
        options: ['hoje', 'ontem', '7dias', '30dias', '3meses', '6meses', '1ano', 'tudo'],
        group: 'principal',
        defaultValue: '30dias' },
      { name: 'agruparPor', required: false, description: 'Agrupar resultados por', type: 'select',
        options: ['', 'cliente', 'vendedor', 'loja'],
        group: 'principal',
        placeholder: 'Sem agrupamento' },
      { name: 'campos', required: false, description: 'Selecione os campos desejados ou deixe vazio para todos',
        type: 'multiselect',
        options: [
          'ticketMedio',
          'totalAtendimentos',
          'totalPecasVendidas',
          'descontoMedio',
          'pecasPorAtendimento',
          'margemMedia',
          'valorTotalVendas',
          'valorTotalCusto',
          'valorTotalDesconto',
          'totalDevolucoes',
          'percentualDevolucoes',
          'totalRetificacoes',
          'percentualRetificacoes',
        ],
        group: 'principal',
        placeholder: 'Todos os campos' },

      // Filtros de data (apenas se não usar período)
      { name: 'dataInicial', required: false, description: 'Data inicial customizada (YYYYMMDD) - use apenas se não selecionar período',
        group: 'datas',
        disableWhen: 'periodo' },
      { name: 'dataFinal', required: false, description: 'Data final customizada (YYYYMMDD) - use apenas se não selecionar período',
        group: 'datas',
        disableWhen: 'periodo' },

      // Filtros específicos
      { name: 'idCliente', required: false, description: 'Filtrar por cliente específico', type: 'number',
        group: 'filtros' },
      { name: 'idVendedor', required: false, description: 'Filtrar por vendedor específico', type: 'number',
        group: 'filtros' },
      { name: 'idLoja', required: false, description: 'Filtrar por loja específica', type: 'number',
        group: 'filtros' },

      // Opções avançadas
      { name: 'incluirComparacao', required: false, description: 'Comparar com período anterior e mostrar variações % (ex: 30dias atuais vs 30dias anteriores)', type: 'boolean',
        group: 'avancado' },
      { name: 'quebrarPorMes', required: false, description: 'Dividir resultados mês a mês (funciona apenas para períodos > 30 dias como 3meses, 6meses, 1ano)', type: 'boolean',
        group: 'avancado' },
      { name: 'limit', required: false, description: 'Limite de registros quando agrupado (padrão: 50)', type: 'number',
        group: 'avancado' },
    ]
  }

  // Endpoint de ranking
  if (path.includes('indicadores/ranking')) {
    return [
      ...urlParams,
      { name: 'tipo', required: true, description: 'Tipo de ranking', type: 'select',
        options: ['cliente', 'vendedor', 'loja', 'produto'],
        group: 'principal' },
      { name: 'criterio', required: false, description: 'Critério de ordenação', type: 'select',
        options: ['valor', 'quantidade', 'ticket', 'margem', 'frequencia'],
        group: 'principal' },
      { name: 'periodo', required: false, description: 'Período para análise', type: 'select',
        options: ['hoje', 'ontem', '7dias', '30dias', '3meses', '6meses', '1ano', 'tudo'],
        group: 'principal' },
      { name: 'dataInicial', required: false, description: 'Data inicial customizada (YYYYMMDD)',
        group: 'datas' },
      { name: 'dataFinal', required: false, description: 'Data final customizada (YYYYMMDD)',
        group: 'datas' },
      { name: 'limit', required: false, description: 'Quantidade de registros (padrão: 20)', type: 'number',
        group: 'principal' },
    ]
  }

  // Endpoints que precisam de filtros de data
  if (path.includes('clientes') || path.includes('vendas') || path.includes('produtos') || path.includes('itens-vendas')) {
    const params = [
      ...urlParams,
      ...paramsBasicos,
      { name: 'dataInicial', required: false, description: 'Data inicial (formato: YYYYMMDD)' },
      { name: 'dataFinal', required: false, description: 'Data final (formato: YYYYMMDD)' },
    ]

    // Adicionar parâmetro específico para clientes
    if (path.includes('clientes')) {
      params.push({
        name: 'incluirCalculados',
        required: false,
        description: 'Incluir campos calculados (primeira/última venda, última loja/vendedor). Valores: true ou false',
        type: 'boolean',
      })
    }

    return params
  }

  // Outros endpoints apenas com parâmetros básicos
  return [...urlParams, ...paramsBasicos]
}

interface EndpointTestModalProps {
  isOpen: boolean
  onClose: () => void
  endpoint: {
    method: string
    path: string
    summary: string
    description: string
    parameters?: Array<{
      name: string
      required: boolean
      description: string
    }>
    tags: string[]
  }
  selectedApiUser?: {
    id: number
    email: string
    name: string
    baseId: number
    baseName?: string
    api_key: string
    api_secret?: string
    rate_limit_per_hour: number
    permissoes_endpoints?: any
  }
}

export function EndpointTestModal({ isOpen, onClose, endpoint, selectedApiUser }: EndpointTestModalProps) {
  const { calculatePagination, getEndpointConfig, pageSizeOptions } = usePaginationConfig()
  const { selectedBase, selectedBaseId } = useBase()
  const { user } = useAuth()
  const [queryParams, setQueryParams] = useState<Record<string, string>>({})
  const [requestBody, setRequestBody] = useState('')
  const [customHeaders, setCustomHeaders] = useState<Record<string, string>>({})
  const [result, setResult] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [logs, setLogs] = useState<string[]>([])
  const [showDocumentation, setShowDocumentation] = useState(false)
  const [viewMode, setViewMode] = useState<'json' | 'table' | 'sql' | 'analytics'>('json')
  const [endpointDoc, setEndpointDoc] = useState<string>('')
  const [jsonCache, setJsonCache] = useState<string | null>(null)
  const [streamingMode, setStreamingMode] = useState(false)
  const [streamData, setStreamData] = useState<any[]>([])
  const [streamProgress, setStreamProgress] = useState({
    current: 0,
    total: 0,
    page: 0,
    isStreaming: false,
    canCancel: false,
  })
  const [showAdvancedConfig, setShowAdvancedConfig] = useState(false)
  const [customPageSize, setCustomPageSize] = useState<number | null>(null)
  const [maxRecords, setMaxRecords] = useState<number | null>(null)
  const [showAnalysisViewer, setShowAnalysisViewer] = useState(false)
  const [testProgress, setTestProgress] = useState({
    isRunning: false,
    startTime: null as Date | null,
  })
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [abortController, setAbortController] = useState<AbortController | null>(null)
  const [paginationData, setPaginationData] = useState({
    currentPage: 1,
    hasMore: false,
    totalRecords: 0,
    recordsPerPage: 0,
  })
  const [showDateOptions, setShowDateOptions] = useState(false)
  const [lastDatePeriod, setLastDatePeriod] = useState<string>('3meses') // Período padrão

  // Chave para localStorage baseada no endpoint
  const getStorageKey = (suffix: string) => `@ari:endpoint-test:${endpoint.path}:${suffix}`
  const getGlobalStorageKey = (suffix: string) => `@ari:endpoint-test:global:${suffix}`

  // Carregar configurações salvas
  const loadSavedConfigs = () => {
    try {
      // Carregar parâmetros específicos do endpoint
      const savedParams = localStorage.getItem(getStorageKey('params'))
      if (savedParams) {
        const params = JSON.parse(savedParams)
        setQueryParams(prev => ({ ...prev, ...params }))
      }

      // Carregar body da requisição
      const savedBody = localStorage.getItem(getStorageKey('body'))
      if (savedBody) {
        setRequestBody(savedBody)
      }

      // Carregar headers customizados
      const savedHeaders = localStorage.getItem(getStorageKey('headers'))
      if (savedHeaders) {
        setCustomHeaders(JSON.parse(savedHeaders))
      }

      // Carregar configurações globais
      const savedPageSize = localStorage.getItem(getGlobalStorageKey('pageSize'))
      if (savedPageSize) {
        setCustomPageSize(parseInt(savedPageSize))
      }

      const savedMaxRecords = localStorage.getItem(getGlobalStorageKey('maxRecords'))
      if (savedMaxRecords) {
        setMaxRecords(parseInt(savedMaxRecords))
      }

      // ViewMode sempre inicia como 'json' ao abrir o modal
      // (usuário pode trocar manualmente para table ou sql depois)
      setViewMode('json')

      const savedShowAdvanced = localStorage.getItem(getGlobalStorageKey('showAdvanced'))
      if (savedShowAdvanced) {
        setShowAdvancedConfig(savedShowAdvanced === 'true')
      }

      // Carregar último período de data usado
      const savedDatePeriod = localStorage.getItem(getGlobalStorageKey('lastDatePeriod'))
      if (savedDatePeriod && ['hoje', 'ontem', 'semana', 'mes', '3meses', '6meses', 'ano', 'mesCorrente', 'tudo'].includes(savedDatePeriod)) {
        setLastDatePeriod(savedDatePeriod)
      }
    } catch (error) {
      console.warn('Erro ao carregar configurações salvas:', error)
    }
  }

  // Salvar configurações
  const saveConfigs = () => {
    try {
      // Salvar apenas parâmetros preenchidos
      const filledParams = Object.fromEntries(
        Object.entries(queryParams).filter(([, value]) => value.trim()),
      )
      if (Object.keys(filledParams).length > 0) {
        localStorage.setItem(getStorageKey('params'), JSON.stringify(filledParams))
      }

      // Salvar body se preenchido
      if (requestBody.trim()) {
        localStorage.setItem(getStorageKey('body'), requestBody)
      }

      // Salvar headers se preenchidos
      const filledHeaders = Object.fromEntries(
        Object.entries(customHeaders).filter(([, value]) => value.trim()),
      )
      if (Object.keys(filledHeaders).length > 0) {
        localStorage.setItem(getStorageKey('headers'), JSON.stringify(filledHeaders))
      }

      // Salvar configurações globais
      if (customPageSize) {
        localStorage.setItem(getGlobalStorageKey('pageSize'), customPageSize.toString())
      }
      if (maxRecords) {
        localStorage.setItem(getGlobalStorageKey('maxRecords'), maxRecords.toString())
      }
      // ViewMode não é salvo - sempre inicia como 'json'
      localStorage.setItem(getGlobalStorageKey('showAdvanced'), showAdvancedConfig.toString())
      localStorage.setItem(getGlobalStorageKey('lastDatePeriod'), lastDatePeriod)
    } catch (error) {
      console.warn('Erro ao salvar configurações:', error)
    }
  }

  // Carregar configurações ao abrir o modal
  React.useEffect(() => {
    if (isOpen) {
      loadSavedConfigs()
    }
  }, [isOpen, endpoint.path])

  // Salvar configurações quando parâmetros mudarem
  React.useEffect(() => {
    if (isOpen) {
      const timeoutId = setTimeout(saveConfigs, 500) // Debounce de 500ms
      return () => clearTimeout(timeoutId)
    }
  }, [queryParams, requestBody, customHeaders, customPageSize, maxRecords, showAdvancedConfig, lastDatePeriod, isOpen])

  // Fechar dropdown de datas ao clicar fora
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showDateOptions) {
        const target = event.target as Element
        if (!target.closest('.relative')) {
          setShowDateOptions(false)
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showDateOptions])

  // Contador de segundos em tempo real
  React.useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null

    if (testProgress.isRunning && testProgress.startTime) {
      setElapsedSeconds(0)
      intervalId = setInterval(() => {
        if (testProgress.startTime) {
          const elapsed = Math.floor((Date.now() - testProgress.startTime.getTime()) / 1000)
          setElapsedSeconds(elapsed)
        }
      }, 1000)
    } else {
      setElapsedSeconds(0)
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId)
      }
    }
  }, [testProgress.isRunning, testProgress.startTime])

  // Cache do JSON formatado para melhorar performance
  React.useEffect(() => {
    if (result?.data) {
      // Formatar JSON apenas quando o resultado mudar
      const formattedJson = JSON.stringify(result.data, null, 2)
      setJsonCache(formattedJson)
    } else {
      setJsonCache(null)
    }
  }, [result])

  // Limpar configurações salvas
  const clearSavedConfigs = () => {
    try {
      // Limpar configurações específicas do endpoint
      localStorage.removeItem(getStorageKey('params'))
      localStorage.removeItem(getStorageKey('body'))
      localStorage.removeItem(getStorageKey('headers'))

      // Limpar configurações globais
      localStorage.removeItem(getGlobalStorageKey('pageSize'))
      localStorage.removeItem(getGlobalStorageKey('maxRecords'))
      localStorage.removeItem(getGlobalStorageKey('viewMode'))
      localStorage.removeItem(getGlobalStorageKey('showAdvanced'))
      localStorage.removeItem(getGlobalStorageKey('lastDatePeriod'))

      // Resetar estados
      setQueryParams({})
      setRequestBody('')
      setCustomHeaders({})
      setCustomPageSize(null)
      setMaxRecords(null)
      setViewMode('json')
      setShowAdvancedConfig(false)
      setLastDatePeriod('3meses') // Voltar ao padrão

      toast.success('Configurações limpas!')
    } catch (error) {
      console.warn('Erro ao limpar configurações:', error)
      toast.error('Erro ao limpar configurações')
    }
  }

  // Buscar documentação específica do endpoint
  const getEndpointDocumentation = () => {
    // Usar o novo endpoint que busca documentação específica por path
    fetch(`http://localhost:3000/api/docs/endpoint-spec?path=${encodeURIComponent(endpoint.path)}`)
      .then(response => {
        if (!response.ok) {
          throw new Error('Documentação não encontrada')
        }
        return response.text()
      })
      .then(markdown => setEndpointDoc(markdown))
      .catch(() => setEndpointDoc('📋 Documentação específica não disponível para este endpoint\n\nEste endpoint pode não ter documentação PontoMarket ou pode ser um endpoint interno do sistema.'))
  }

  // Formatar data para formato YYYYMMDD (PontoMarket)
  const formatarData = (date: Date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}${month}${day}` // YYYYMMDD
  }

  // Obter classe CSS para item do dropdown baseado se está selecionado
  const getDropdownItemClass = (periodo: string) => {
    const isSelected = periodo === lastDatePeriod
    const baseClass = 'px-2 py-1 text-xs rounded text-left'

    if (isSelected) {
      return `${baseClass} bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100 border border-blue-300 dark:border-blue-700`
    } else {
      return `${baseClass} bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600`
    }
  }

  // Obter texto do período para exibição
  const getDatePeriodText = (periodo: string) => {
    const textos: Record<string, string> = {
      'hoje': 'Hoje',
      'ontem': 'Ontem',
      'semana': '7 dias',
      'mes': '1 mês',
      '3meses': '3 meses',
      '6meses': '6 meses',
      'ano': '1 ano',
      'mesCorrente': 'Mês atual',
      'anoCorrente': 'Ano atual',
      'tudo': 'Tudo',
    }
    return textos[periodo] || '3 meses'
  }

  // Opções de preenchimento de data
  const preencherComData = (periodo: string) => {
    // Salvar o período selecionado
    setLastDatePeriod(periodo)

    const params: Record<string, string> = { ...queryParams }
    const hoje = new Date()
    let dataInicial: Date
    let dataFinal: Date = hoje
    let descricao: string

    switch (periodo) {
      case 'hoje':
        dataInicial = new Date(hoje)
        descricao = 'hoje'
        break
      case 'ontem':
        dataInicial = new Date(hoje)
        dataInicial.setDate(hoje.getDate() - 1)
        dataInicial.setHours(0, 0, 0, 0) // Início do dia ontem
        // Para "ontem", final deve ser início do dia hoje (para busca < hoje)
        dataFinal = new Date(hoje)
        dataFinal.setHours(0, 0, 0, 0) // Início do dia hoje
        descricao = 'ontem'
        break
      case 'semana':
        dataInicial = new Date(hoje)
        dataInicial.setDate(hoje.getDate() - 7)
        descricao = 'últimos 7 dias'
        break
      case 'mes':
        dataInicial = new Date(hoje)
        dataInicial.setMonth(hoje.getMonth() - 1)
        descricao = 'último mês'
        break
      case '3meses':
        dataInicial = new Date(hoje)
        dataInicial.setMonth(hoje.getMonth() - 3)
        descricao = 'últimos 3 meses'
        break
      case '6meses':
        dataInicial = new Date(hoje)
        dataInicial.setMonth(hoje.getMonth() - 6)
        descricao = 'últimos 6 meses'
        break
      case 'ano':
        dataInicial = new Date(hoje)
        dataInicial.setFullYear(hoje.getFullYear() - 1)
        descricao = 'último ano'
        break
      case 'anoCorrente':
        dataInicial = new Date(hoje.getFullYear(), 0, 1)
        descricao = 'ano corrente'
        break
      case 'mesCorrente':
        dataInicial = new Date(hoje.getFullYear(), hoje.getMonth(), 1)
        descricao = 'mês corrente'
        break
      case 'tudo':
        // Para buscar TUDO, definir range desde 2000 até hoje
        dataInicial = new Date('2000-01-01T00:00:00.000Z')
        dataFinal = new Date()
        dataFinal.setHours(23, 59, 59, 999) // Fim do dia hoje
        descricao = 'TODOS os registros (desde 2000)'
        break
      default:
        dataInicial = new Date(hoje)
        dataInicial.setMonth(hoje.getMonth() - 3)
        descricao = 'últimos 3 meses (padrão)'
    }

    // Usar parâmetros gerados se não houver do Swagger
    const endpointParams = endpoint.parameters && endpoint.parameters.length > 0
      ? endpoint.parameters
      : generatePontoMarketParams(endpoint.path)

    // Definir datas se o endpoint suporta filtros de data
    const hasDateFilters = endpointParams.some(p =>
      p.name === 'dataInicial' || p.name === 'dataFinal',
    )

    if (hasDateFilters) {
      // Formato YYYYMMDD para compatibilidade PontoMarket
      params['dataInicial'] = formatarData(dataInicial)
      params['dataFinal'] = formatarData(dataFinal)
    }

    // Preencher outros parâmetros padrão
    endpointParams.forEach(param => {
      if (param.name === 'baseId') {
        // Se tem usuário API selecionado, NÃO preencher baseId (será determinado pelo backend)
        if (!selectedApiUser) {
          params[param.name] = '49' // Só preencher baseId quando não tem usuário API
        }
      } else if (param.name === 'limite') {
        params[param.name] = '1000' // Limite padrão
      } else if (param.name === 'offset') {
        params[param.name] = '0' // Offset 0 - começar do início
      } else if (!['dataInicial', 'dataFinal'].includes(param.name) && param.required && !params[param.name]) {
        params[param.name] = ''
      }
    })

    setQueryParams(params)
    setShowDateOptions(false)

    // Log diferente para "tudo" vs períodos com data
    if (periodo === 'tudo') {
      // Já logado no case 'tudo' acima
    } else {
      addLog(`📅 Parâmetros preenchidos com ${descricao}: ${formatarData(dataInicial)} a ${formatarData(dataFinal)}`)
      toast.success(`Datas configuradas: ${descricao}`)
    }
  }

  // Inicializar parâmetros baseado na definição do endpoint
  const initializeParams = () => {
    // Usar parâmetros do Swagger se disponíveis, senão gerar parâmetros PontoMarket
    const params = endpoint.parameters && endpoint.parameters.length > 0
      ? endpoint.parameters
      : generatePontoMarketParams(endpoint.path)

    // Verificar se tem parâmetros de data
    const hasDateParams = params.some(p =>
      p.name === 'dataInicial' || p.name === 'dataFinal',
    )

    if (hasDateParams) {
      setShowDateOptions(true)
    } else {
      // Sem parâmetros de data, preencher normalmente
      const newParams: Record<string, string> = { ...queryParams }

      params.forEach(param => {
        if (param.name === 'baseId') {
          // Se tem usuário API selecionado, NÃO preencher baseId (será determinado pelo backend)
          if (!selectedApiUser) {
            newParams[param.name] = '49' // Só preencher baseId quando não tem usuário API
          }
        } else if (param.name === 'limit') {
          newParams[param.name] = '2000000' // Limite alto para buscar tudo
        } else if (param.name === 'offset') {
          newParams[param.name] = '0' // Offset padrão - começar do primeiro registro
        } else if (param.required && !newParams[param.name]) {
          newParams[param.name] = ''
        }
      })

      setQueryParams(newParams)
      addLog('📋 Parâmetros preenchidos com valores padrão')
      toast.success('Parâmetros preenchidos!')
    }
  }

  const addLog = (message: string, type: 'info' | 'success' | 'warning' | 'error' | 'progress' = 'info') => {
    const timestamp = new Date().toLocaleTimeString('pt-BR', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })

    const icons = {
      info: '📋',
      success: '✅',
      warning: '⚠️',
      error: '❌',
      progress: '⚡',
    }

    const icon = icons[type] || '📋'
    setLogs(prev => [...prev, `[${timestamp}] ${icon} ${message}`])
  }

  // Modo streaming - paginação automática
  const handleStreamingTest = async () => {
    // Limpar estado anterior - MAS NÃO OS LOGS
    setResult(null)
    // setLogs([]) // REMOVIDO - manter histórico dos logs
    setStreamData([])
    setStreamingMode(true)
    setStreamProgress({ current: 0, total: 0, page: 0, isStreaming: true, canCancel: false })

    // Criar novo AbortController para este teste
    const controller = new AbortController()
    setAbortController(controller)

    // Verificar se é admin para páginas maiores
    const userStr = localStorage.getItem('@ari:user')
    const isAdmin = userStr?.includes('admin@invistto.com.br') || false

    // Usar configuração de paginação otimizada para streaming
    const defaultStreamingPageSize = isAdmin ? 10000 : 5000 // Admin usa páginas maiores
    const paginationConfig = calculatePagination(endpoint.path, {
      limit: customPageSize || defaultStreamingPageSize,
    })
    const pageSize = paginationConfig.limit
    const maxToLoad = maxRecords || Number.MAX_SAFE_INTEGER // Sem limite - buscar TODOS os dados

    let currentPage = 1
    const totalRecords = 0
    let allData: any[] = []
    let shouldContinue = true

    try {
      addLog('🚀 MODO STREAMING INICIADO', 'info')
      addLog(`📄 Carregando ${pageSize.toLocaleString()} registros por página`)
      addLog(`💾 Máximo: ${maxToLoad.toLocaleString()} registros total`)

      while (shouldContinue && !controller.signal.aborted) {
        addLog(`Carregando página ${currentPage}...`, 'progress')

        // Preparar parâmetros da página (remover baseId)
        const pageParams: Record<string, any> = {
          offset: (currentPage - 1) * pageSize,
          limit: pageSize,
        }

        // Adicionar outros parâmetros
        Object.entries(queryParams).forEach(([key, value]) => {
          // Se tem usuário API selecionado, SEMPRE remover baseId
          if (selectedApiUser && key === 'baseId') {
            return // Pular baseId completamente
          }
          
          if (value && value.trim()) {
            if (!isNaN(Number(value))) {
              pageParams[key] = Number(value)
            } else {
              pageParams[key] = value
            }
          }
        })

        // Processar path parameters antes de fazer a requisição
        let processedPath = endpoint.path
        const pathParamMatches = endpoint.path.match(/\{([^}]+)\}/g)
        
        if (pathParamMatches) {
          pathParamMatches.forEach(match => {
            const paramName = match.slice(1, -1) // Remove { }
            const paramValue = queryParams[paramName]
            
            if (paramValue) {
              processedPath = processedPath.replace(match, paramValue)
              // Remover do pageParams se existir
              delete pageParams[paramName]
            }
          })
        }

        // Adicionar headers de autenticação se houver usuário API selecionado
        const headers: Record<string, string> = { ...customHeaders }
        
        // DEBUG: Verificar o conteúdo do selectedApiUser
        console.log('🔍 [DEBUG] selectedApiUser:', selectedApiUser)
        addLog(`🔍 DEBUG: selectedApiUser = ${JSON.stringify(selectedApiUser)}`)
        
        if (selectedApiUser?.api_key && selectedApiUser?.api_secret) {
          headers['X-API-Key'] = selectedApiUser.api_key
          
          // HOTFIX: Para PontoMarket, usar o secret original
          if (selectedApiUser.email === 'pontomarket@dnp.com.br') {
            headers['X-API-Secret'] = '2b1b87e0f12bbdf175e0d73f8772128fe441e450a23654bfddf5a9877b0478f9'
          } else {
            headers['X-API-Secret'] = selectedApiUser.api_secret
          }
          // NÃO adicionar baseId aos params - o contexto vem do usuário API no backend
          addLog(`🔐 Usando credenciais API de: ${selectedApiUser.name} (Base ${selectedApiUser.baseId})`)
          addLog(`🏢 Contexto será da base ${selectedApiUser.baseId} - ${selectedApiUser.baseName || 'Base ' + selectedApiUser.baseId}`)
          addLog(`🔑 Headers API: X-API-Key=${headers['X-API-Key']}, X-API-Secret=${headers['X-API-Secret']?.substring(0, 10)}...`)
          addLog(`📊 Dados do usuário API: ${JSON.stringify({
            id: selectedApiUser.id,
            email: selectedApiUser.email,
            baseId: selectedApiUser.baseId,
            baseName: selectedApiUser.baseName,
            rate_limit: selectedApiUser.rate_limit_per_hour
          })}`)
        }

        const response = await systemService.testEndpointAdvanced({
          method: endpoint.method,
          path: processedPath,
          queryParams: pageParams,
          headers: Object.keys(headers).length > 0 ? headers : undefined,
        })

        if (response.success && response.data?.data) {
          const pageData = response.data.data

          // DEBUG: Verificar estrutura dos dados
          console.log('🔍 DEBUG response.data:', response.data)
          console.log('🔍 DEBUG pageData:', pageData)
          console.log('🔍 DEBUG pageData type:', typeof pageData)
          console.log('🔍 DEBUG Array.isArray(pageData):', Array.isArray(pageData))

          // Garantir que pageData é um array
          const dataArray = Array.isArray(pageData) ? pageData :
            Array.isArray(pageData?.data) ? pageData.data : []

          if (dataArray.length === 0) {
            addLog(`⚠️ Página ${currentPage} retornou dados vazios ou formato inválido`, 'warning')
            shouldContinue = false
          } else {
            allData = [...allData, ...dataArray]

            // Atualizar progresso
            setStreamData([...allData])
            setStreamProgress(prev => ({
              ...prev,
              current: allData.length,
              total: response.data.total || allData.length,
              page: currentPage,
            }))

            const elapsedTime = testProgress.startTime ?
              ((Date.now() - testProgress.startTime.getTime()) / 1000).toFixed(1) : '0'
            addLog(`Página ${currentPage}: ${dataArray.length} registros → Total: ${allData.length.toLocaleString()} (${elapsedTime}s)`, 'progress')

            // Verificar se deve continuar
            shouldContinue = dataArray.length === pageSize && allData.length < maxToLoad
            currentPage++

            // Pequena pausa para UI responsiva
            await new Promise(resolve => setTimeout(resolve, 100))

            // Verificar se atingiu o limite máximo
            if (allData.length >= maxToLoad) {
              addLog(`Limite máximo de ${maxToLoad.toLocaleString()} registros atingido`, 'warning')
              shouldContinue = false
            }
          }
        } else {
          shouldContinue = false
          addLog(`Erro na página ${currentPage}: ${response.message}`, 'error')
        }
      }

      if (!controller.signal.aborted) {
        const duration = testProgress.startTime ?
          ((Date.now() - testProgress.startTime.getTime()) / 1000).toFixed(1) : '0'
        addLog(`Carregamento concluído: ${allData.length.toLocaleString()} registros em ${currentPage - 1} páginas (${duration}s)`, 'success')

        setResult({
          success: true,
          data: { success: true, total: allData.length, data: allData, executionTime: `${duration}s` },
          status: 200,
          timestamp: new Date().toISOString(),
        })
      } else {
        addLog('Carregamento cancelado pelo usuário', 'warning')
      }

    } catch (error: any) {
      addLog(`Erro durante carregamento: ${error.message}`, 'error')
    } finally {
      setStreamProgress(prev => ({ ...prev, isStreaming: false, canCancel: false }))
      setStreamingMode(false)
      setIsLoading(false) // Resetar loading após streaming
      setTestProgress({
        isRunning: false,
        startTime: null,
      })
    }
  }

  const cancelStreaming = () => {
    setStreamProgress(prev => ({ ...prev, canCancel: false }))
    addLog('🛑 Cancelando carregamento...')
  }

  // ESTRATÉGIA INTELIGENTE: Tenta buscar normalmente, se muito grande usa streaming
  const handleSmartTest = async () => {
    addLog('🚀 [DEBUG] Iniciando handleSmartTest')
    setIsLoading(true)
    setResult(null)
    // NÃO limpar logs - manter histórico

    // Verificar se é admin para usar limite maior
    const userStr = localStorage.getItem('@ari:user')
    const isAdmin = userStr?.includes('admin@invistto.com.br') || false

    // TEMPORARIAMENTE DESABILITADO - voltar ao método normal que funcionava
    // const isMassiveDataEndpoint = endpoint.path.includes('/clientes') ||
    //                              endpoint.path.includes('/vendas') ||
    //                              endpoint.path.includes('/produtos')
    //
    // if (isMassiveDataEndpoint) {
    //   addLog(`📊 Endpoint de dados massivos detectado - usando streaming automático`)
    //   return handleStreamingTest()
    // }

    // Usar EXATAMENTE o limite configurado pelo usuário na interface
    const limiteConfigurado = parseInt(queryParams.limit) || 2000000
    const LIMITE_TESTE = limiteConfigurado // Respeitar TOTALMENTE o limite do usuário

    try {
      addLog('🔍 Executando teste...')

      // 1. PRIMEIRA TENTATIVA: Buscar com limite de teste
      const testParams = { ...queryParams, limit: LIMITE_TESTE }
      
      // Se tem usuário API selecionado, remover baseId dos parâmetros
      if (selectedApiUser && testParams.baseId) {
        delete testParams.baseId
        addLog(`🏢 Removendo baseId dos parâmetros - usando contexto API`)
      }
      
      addLog(`🔍 Testando com limite de ${LIMITE_TESTE.toLocaleString()} registros...`)

      // Processar path parameters antes de fazer a requisição
      let processedPath = endpoint.path
      const pathParamMatches = endpoint.path.match(/\{([^}]+)\}/g)
      
      if (pathParamMatches) {
        pathParamMatches.forEach(match => {
          const paramName = match.slice(1, -1) // Remove { }
          const paramValue = queryParams[paramName]
          
          if (paramValue) {
            processedPath = processedPath.replace(match, paramValue)
            // Remover do testParams pois já foi usado no path
            delete testParams[paramName]
          }
        })
      }

      // Adicionar headers de autenticação se houver usuário API selecionado
      const headers: Record<string, string> = { ...customHeaders }
      
      // DEBUG: Verificar o conteúdo do selectedApiUser
      console.log('🔍 [DEBUG] selectedApiUser:', selectedApiUser)
      console.log('🔍 [DEBUG] selectedApiUser.api_key:', selectedApiUser?.api_key)
      console.log('🔍 [DEBUG] selectedApiUser.api_secret:', selectedApiUser?.api_secret)
      
      addLog(`🔍 DEBUG: selectedApiUser = ${JSON.stringify(selectedApiUser)}`)
      
      // Verificar se o usuário API tem credenciais completas
      // Para usuários tipo API, AMBOS api_key e api_secret são obrigatórios
      const hasApiKey = selectedApiUser?.api_key && selectedApiUser.api_key !== ''
      const hasApiSecret = selectedApiUser?.api_secret && selectedApiUser.api_secret !== ''
      
      console.log('🔍 [DEBUG] selectedApiUser:', selectedApiUser)
      console.log('🔍 [DEBUG] api_key:', selectedApiUser?.api_key)
      console.log('🔍 [DEBUG] api_secret:', selectedApiUser?.api_secret)
      console.log('🔍 [DEBUG] hasApiKey:', hasApiKey)
      console.log('🔍 [DEBUG] hasApiSecret:', hasApiSecret)
      
      if (hasApiKey && hasApiSecret) {
        headers['X-API-Key'] = selectedApiUser.api_key
        
        // HOTFIX TEMPORÁRIO: PontoMarket precisa do secret original (não o hash)
        // TODO: Implementar sistema seguro para armazenar secrets de teste
        if (selectedApiUser.email === 'pontomarket@dnp.com.br') {
          // Sobrescrever com credenciais reais para teste
          headers['X-API-Key'] = 'ak_5a5ab1b1d295f55d53e80279410d5dde'
          headers['X-API-Secret'] = '5eea5908647471040d1e78b6e10c2fc25589c268e23199f96f712d5ee0468c35'
          addLog('🔐 Usando credenciais oficiais do PontoMarket')
        } else {
          // Para outros usuários API, usar o que vem do banco
          headers['X-API-Secret'] = selectedApiUser.api_secret
        }
        
        // DEBUG: Verificar headers finais
        console.log('📤 [DEBUG] Headers sendo enviados:', {
          'X-API-Key': headers['X-API-Key'],
          'X-API-Secret': headers['X-API-Secret']?.substring(0, 10) + '...',
          allHeaders: Object.keys(headers)
        })
        // NÃO adicionar baseId aos params - o contexto vem do usuário API no backend
        addLog(`🔐 Usando credenciais API de: ${selectedApiUser.name} (Base ${selectedApiUser.baseId})`)
        addLog(`🏢 Contexto será da base ${selectedApiUser.baseId} - ${selectedApiUser.baseName || 'Base ' + selectedApiUser.baseId}`)
        addLog(`🔑 API Key: ${selectedApiUser.api_key}`)
        
        // Mostrar parte do secret usado (original ou hash)
        const secretUsed = selectedApiUser.email === 'pontomarket@dnp.com.br' 
          ? '2b1b87e0f12bbdf175e0d73f8772128fe441e450a23654bfddf5a9877b0478f9'
          : selectedApiUser.api_secret
        addLog(`🔑 API Secret: ${secretUsed.substring(0, 10)}...`)
      } else {
        if (!selectedApiUser) {
          const baseInfo = selectedBase ? `Base ${selectedBaseId}: ${selectedBase.NOME}` : `Base ${selectedBaseId}`
          addLog(`👤 Usando credenciais do usuário logado (JWT)`)
          addLog(`📧 Usuário: ${user?.email || 'Não identificado'} (${user?.name || 'Sem nome'})`)
          addLog(`🏢 Base do contexto: ${baseInfo}`)
          addLog(`ℹ️ Para testar como API externa, selecione um usuário API acima`)
        } else {
          addLog(`⚠️ Usuário API selecionado mas sem credenciais completas`)
          addLog(`⚠️ DEBUG: api_key=${!!selectedApiUser.api_key}, api_secret=${!!selectedApiUser.api_secret}`)
          if (!hasApiKey) {
            addLog(`❌ Faltando API Key para o usuário ${selectedApiUser.name}`)
          }
          if (!hasApiSecret) {
            addLog(`❌ Faltando API Secret para o usuário ${selectedApiUser.name}`)
          }
        }
      }

      const response = await systemService.testEndpointAdvanced({
        method: endpoint.method,
        path: processedPath,
        queryParams: testParams,
        headers: Object.keys(headers).length > 0 ? headers : undefined,
      })

      if (response.success && response.data?.data) {
        const recordCount = Array.isArray(response.data.data) ? response.data.data.length : 0
        addLog(`📊 Response data type: ${typeof response.data.data}, Array: ${Array.isArray(response.data.data)}`)

        // 2. DECIDIR ESTRATÉGIA BASEADO NO RESULTADO
        if (recordCount >= LIMITE_TESTE) {
          // Muitos dados mesmo com filtros - usar streaming
          addLog(`📊 ${recordCount.toLocaleString()} registros encontrados (limite atingido)`)
          addLog('🚀 Muitos dados! Mudando para carregamento por páginas...')

          setIsLoading(false) // Liberar para streaming
          await handleStreamingTest()
          return
        } else {
          // Poucos dados - mostrar resultado normal
          addLog(`✅ ${recordCount.toLocaleString()} registros encontrados (volume adequado)`)
          addLog('📋 Exibindo resultado completo')

          addLog(`✅ Resultado final: ${recordCount.toLocaleString()} registros`)
          setResult(response)
          setIsLoading(false)
          addLog('🏁 handleSmartTest FINALIZADO com sucesso')
          return
        }
      } else {
        // Erro ou sem dados - MANTER LOGS e mostrar detalhes
        addLog(`❌ Erro na resposta: Status ${response.status || 'N/A'}`)
        addLog(`📝 Mensagem: ${response.message || 'Sem mensagem de erro'}`)
        addLog(`📊 Sucesso: ${response.success ? 'Sim' : 'Não'}`)
        if (response.data) {
          addLog(`📋 Dados recebidos: ${JSON.stringify(response.data).substring(0, 200)}...`)
        }
        setResult(response)
        setIsLoading(false)
        addLog('🏁 handleSmartTest FINALIZADO com erro')
      }

    } catch (error: any) {
      addLog(`❌ Erro no teste: ${error.message}`)
      addLog(`🔍 Stack: ${error.stack || 'Stack não disponível'}`)

      // FORÇAR um resultado de erro para ser exibido
      setResult({
        success: false,
        status: 500,
        statusText: 'Erro interno',
        message: error.message,
        data: { error: error.message, stack: error.stack },
        timestamp: new Date().toISOString(),
      })

      setIsLoading(false)
      addLog('🏁 handleSmartTest FINALIZADO com EXCEPTION')
    }
  }

  const handleCancel = () => {
    if (abortController) {
      abortController.abort()
      addLog('🛑 Requisição cancelada pelo usuário')
      toast.error('Teste cancelado')
    }

    // Forçar parada do processamento
    setTestProgress({
      isRunning: false,
      startTime: null,
    })
    setStreamProgress(prev => ({
      ...prev,
      isStreaming: false,
      canCancel: false,
    }))
    setStreamingMode(false)
    setAbortController(null)
    setIsLoading(false)
    addLog('🏁 Teste interrompido')
  }

  const handleTest = async () => {
    // Limpar estado anterior - MAS NÃO OS LOGS
    setIsLoading(true)
    setResult(null)
    // setLogs([]) // REMOVIDO - manter histórico dos logs
    setStreamData([])
    setStreamingMode(false)
    setStreamProgress({ current: 0, total: 0, page: 0, isStreaming: false, canCancel: false })

    // Criar AbortController para cancelamento
    const controller = new AbortController()
    setAbortController(controller)

    // Inicializar progresso
    setTestProgress({
      isRunning: true,
      startTime: new Date(),
    })

    try {
      addLog(`🚀 Iniciando teste: ${endpoint.method} ${endpoint.path}`)

      // Verificar autenticação
      const token = localStorage.getItem('@ari:token')
      if (!token) {
        addLog('❌ Erro: Token de autenticação não encontrado')
        addLog('💡 Dica: Faça login na aplicação primeiro')
        toast.error('Você precisa estar logado para testar endpoints')
        setIsLoading(false)
        return
      }
      addLog('🔐 Token de autenticação encontrado')

      // Verificar baseId
      const baseIdFromStorage = localStorage.getItem('@ari:selectedBaseId')
      if (!baseIdFromStorage || baseIdFromStorage === 'null') {
        addLog('⚠️ Base não selecionada - usando padrão do parâmetro')
      } else {
        addLog(`🏢 Base selecionada: ${baseIdFromStorage}`)
      }

      // Preparar query params (remover vazios e baseId quando usando API)
      const cleanParams: Record<string, any> = {}
      Object.entries(queryParams).forEach(([key, value]) => {
        // Se tem usuário API selecionado, SEMPRE remover baseId
        if (selectedApiUser && key === 'baseId') {
          addLog(`🏢 baseId ignorado (${value}) - usando contexto do usuário API: ${selectedApiUser.name} (Base ${selectedApiUser.baseId})`)
          return
        }

        if (value.trim()) {
          // Tentar converter números
          if (!isNaN(Number(value))) {
            cleanParams[key] = Number(value)
            addLog(`📊 Parâmetro ${key}: ${value} (convertido para número)`)
          } else {
            cleanParams[key] = value
            addLog(`📝 Parâmetro ${key}: "${value}"`)
          }
        }
      })

      // Usar configuração da tela (customPageSize como limit, maxRecords como máximo)
      if (!cleanParams.limit && (endpoint.path.includes('/clientes') || endpoint.path.includes('/vendas') || endpoint.path.includes('/produtos'))) {
        const pageSize = customPageSize || 1000 // Tamanho da página da tela
        cleanParams.limit = pageSize
        addLog(`📄 Tamanho da página: ${pageSize.toLocaleString()} registros`, 'info')

        if (maxRecords) {
          addLog(`🔒 Limite máximo total: ${maxRecords.toLocaleString()} registros`, 'info')
        }
      }

      // Preparar body
      let body = null
      if (requestBody.trim() && ['POST', 'PUT', 'PATCH'].includes(endpoint.method)) {
        try {
          body = JSON.parse(requestBody)
          addLog(`📦 Corpo da requisição: JSON válido (${Object.keys(body).length} propriedades)`)
        } catch (e) {
          addLog('❌ Erro: JSON inválido no corpo da requisição')
          toast.error('JSON inválido no corpo da requisição')
          setIsLoading(false)
          return
        }
      }

      // Processar path parameters (ex: /api/clientes/{id})
      let processedPath = endpoint.path
      const pathParamMatches = endpoint.path.match(/\{([^}]+)\}/g)
      
      if (pathParamMatches) {
        pathParamMatches.forEach(match => {
          const paramName = match.slice(1, -1) // Remove { }
          const paramValue = queryParams[paramName]
          
          if (paramValue) {
            processedPath = processedPath.replace(match, paramValue)
            // Remover do queryParams pois já foi usado no path
            delete cleanParams[paramName]
            addLog(`🔄 Substituindo parâmetro de rota: ${match} → ${paramValue}`)
          } else {
            addLog(`⚠️ Parâmetro de rota ${match} não fornecido`)
          }
        })
      }

      addLog(`🔗 Enviando requisição para: ${processedPath}`)
      addLog(`📋 Parâmetros query: ${Object.keys(cleanParams).length} itens`)

      // Chamar API com timeout e cancelamento
      const timeoutId = setTimeout(() => controller.abort(), 600000) // 10 minutos

      let response
      try {
        // Verificar se foi cancelado antes de fazer a requisição
        if (controller.signal.aborted) {
          throw new Error('Requisição cancelada')
        }

        // Adicionar headers de autenticação se houver usuário API selecionado
        const headers: Record<string, string> = { ...customHeaders }
        
        // DEBUG: Verificar o conteúdo do selectedApiUser
        console.log('🔍 [DEBUG] selectedApiUser:', selectedApiUser)
        addLog(`🔍 DEBUG: selectedApiUser = ${JSON.stringify(selectedApiUser)}`)
        
        if (selectedApiUser?.api_key && selectedApiUser?.api_secret) {
          headers['X-API-Key'] = selectedApiUser.api_key
          
          // HOTFIX: Para PontoMarket, usar o secret original
          if (selectedApiUser.email === 'pontomarket@dnp.com.br') {
            headers['X-API-Secret'] = '2b1b87e0f12bbdf175e0d73f8772128fe441e450a23654bfddf5a9877b0478f9'
          } else {
            headers['X-API-Secret'] = selectedApiUser.api_secret
          }
          // NÃO adicionar baseId aos params - o contexto vem do usuário API no backend
          addLog(`🔐 Usando credenciais API de: ${selectedApiUser.name} (Base ${selectedApiUser.baseId})`)
          addLog(`🏢 Contexto será da base ${selectedApiUser.baseId} - ${selectedApiUser.baseName || 'Base ' + selectedApiUser.baseId}`)
          addLog(`🔑 Headers API: X-API-Key=${headers['X-API-Key']}, X-API-Secret=${headers['X-API-Secret']?.substring(0, 10)}...`)
          addLog(`📊 Dados do usuário API: ${JSON.stringify({
            id: selectedApiUser.id,
            email: selectedApiUser.email,
            baseId: selectedApiUser.baseId,
            baseName: selectedApiUser.baseName,
            rate_limit: selectedApiUser.rate_limit_per_hour
          })}`)
        }

        response = await systemService.testEndpointAdvanced({
          method: endpoint.method,
          path: processedPath,
          queryParams: Object.keys(cleanParams).length > 0 ? cleanParams : undefined,
          body,
          headers: Object.keys(headers).length > 0 ? headers : undefined,
          signal: controller.signal,
        })
        clearTimeout(timeoutId)

        // Verificar se foi cancelado após a requisição
        if (controller.signal.aborted) {
          throw new Error('Requisição cancelada')
        }
      } catch (error: any) {
        clearTimeout(timeoutId)
        if (error.name === 'AbortError' || error.message === 'Requisição cancelada') {
          throw new Error('Requisição cancelada')
        }
        throw error
      }

      addLog(`📥 Resposta recebida: Status ${response.status} ${response.statusText || ''}`)
      addLog(`✅ Sucesso: ${response.success ? 'Sim' : 'Não'}`)

      if (response.data) {
        const dataSize = JSON.stringify(response.data).length
        addLog(`📊 Dados recebidos: ${dataSize.toLocaleString()} caracteres`)

        // Detectar e enfatizar quantidade de registros
        let recordCount = 0
        if (response.data.data && Array.isArray(response.data.data)) {
          recordCount = response.data.data.length
          addLog(`🎯 REGISTROS RETORNADOS: ${recordCount.toLocaleString()} itens`, 'success')
        } else if (response.data.data?.data && Array.isArray(response.data.data.data)) {
          recordCount = response.data.data.data.length
          addLog(`🎯 REGISTROS RETORNADOS: ${recordCount.toLocaleString()} itens`, 'success')
        } else if (Array.isArray(response.data)) {
          recordCount = response.data.length
          addLog(`🎯 REGISTROS RETORNADOS: ${recordCount.toLocaleString()} itens`, 'success')
        } else if (response.data.success === false) {
          addLog(`⚠️ API retornou: ${response.data.message || 'Erro não especificado'}`)
        } else {
          addLog('📄 Resposta única (não é lista de registros)')
        }

        // Informações adicionais se disponíveis
        if (response.data.meta) {
          addLog(`📈 Meta informações: Total ${response.data.meta.total || 'N/A'} | Página ${response.data.meta.page || 1}`)
        }
      }

      // Verificar se foi cancelado antes de processar resultado
      if (controller.signal.aborted) {
        throw new Error('Requisição cancelada')
      }

      setResult(response)

      if (response.success) {
        // Calcular total de registros para o resumo final
        let finalRecordCount = 0
        if (response.data?.data && Array.isArray(response.data.data)) {
          finalRecordCount = response.data.data.length
        } else if (response.data?.data?.data && Array.isArray(response.data.data.data)) {
          finalRecordCount = response.data.data.data.length
        } else if (Array.isArray(response.data)) {
          finalRecordCount = response.data.length
        }

        addLog('🎉 TESTE CONCLUÍDO COM SUCESSO!')
        addLog(`📊 TOTAL FINAL: ${finalRecordCount.toLocaleString()} registros carregados`)

        // Calcular tempo total e performance se disponível
        if (testProgress.startTime) {
          const totalTime = ((Date.now() - testProgress.startTime.getTime()) / 1000).toFixed(1)
          const recordsPerSecond = records > 0 ? (records / parseFloat(totalTime)).toFixed(0) : '0'
          addLog(`⏱️ Tempo total: ${totalTime}s (${recordsPerSecond} registros/segundo)`)
        }
        addLog('🏁 Teste finalizado')

        toast.success(`${finalRecordCount.toLocaleString()} registros carregados com sucesso!`)
      } else {
        addLog(`💥 Teste falhou: ${response.message}`)
        toast.error(`${endpoint.method} ${endpoint.path} - Erro: ${response.message}`)
      }
    } catch (error: any) {
      if (error.message === 'Requisição cancelada' || error.code === 'ERR_CANCELED') {
        addLog('🛑 Teste cancelado ou interrompido')

        // Mesmo cancelado, mostrar detalhes do que estava sendo executado
        if (error.config) {
          addLog(`⚙️ URL que estava sendo testada: ${error.config.method?.toUpperCase()} ${error.config.url}`)
          if (error.config.params) {
            addLog(`🔧 Parâmetros que foram enviados: ${JSON.stringify(error.config.params, null, 2)}`)
          }
        }

        if (error.code) {
          addLog(`🏷️ Código do cancelamento: ${error.code}`)
        }

        addLog('💡 Dica: Verifique se o backend ari-nest está rodando na porta 3000')

        toast.error('Teste cancelado/interrompido - verifique logs')

        // Criar resultado para manter logs visíveis mesmo cancelado
        setResult({
          success: false,
          error: true,
          message: `Teste cancelado/interrompido: ${error.message}`,
          errorDetails: {
            status: null,
            statusText: 'Cancelado',
            data: null,
            code: error.code,
            url: error.config?.url,
            method: error.config?.method,
          },
          timestamp: new Date().toISOString(),
        })
      } else {
        // Log detalhado do erro principal
        addLog(`💥 Erro durante o teste: ${error.message}`)

        // Adicionar detalhes da resposta se disponível
        if (error.response) {
          addLog(`📡 Status HTTP: ${error.response.status} ${error.response.statusText || ''}`)

          if (error.response.data) {
            if (typeof error.response.data === 'string') {
              addLog(`📄 Resposta do servidor: ${error.response.data}`)
            } else {
              addLog(`📄 Resposta do servidor: ${JSON.stringify(error.response.data, null, 2)}`)
            }
          }

          if (error.response.headers) {
            addLog(`📋 Headers da resposta: ${JSON.stringify(error.response.headers, null, 2)}`)
          }
        }

        // Detalhes da configuração da requisição
        if (error.config) {
          addLog(`⚙️ URL da requisição: ${error.config.method?.toUpperCase()} ${error.config.url}`)

          if (error.config.params) {
            addLog(`🔧 Parâmetros enviados: ${JSON.stringify(error.config.params, null, 2)}`)
          }

          if (error.config.data) {
            addLog(`📦 Body enviado: ${error.config.data}`)
          }
        }

        // Stack trace para debug
        if (error.stack) {
          addLog(`🔍 Stack trace: ${error.stack}`)
        }

        // Código de erro específico
        if (error.code) {
          addLog(`🏷️ Código do erro: ${error.code}`)
        }

        // Timeout information
        if (error.code === 'ECONNABORTED') {
          addLog('⏱️ Timeout: A requisição demorou mais que o esperado')
        }

        // Network errors
        if (error.code === 'ERR_NETWORK') {
          addLog('🌐 Erro de rede: Verifique se o backend está rodando')
        }

        toast.error(`Erro: ${error.message}`)
        setResult({
          success: false,
          error: true,
          message: error.message,
          errorDetails: {
            status: error.response?.status,
            statusText: error.response?.statusText,
            data: error.response?.data,
            code: error.code,
            url: error.config?.url,
            method: error.config?.method,
          },
          timestamp: new Date().toISOString(),
        })
      }
    } finally {
      setTestProgress({
        isRunning: false,
        startTime: null,
      })
      setAbortController(null)
      setIsLoading(false)
      addLog('🏁 Teste finalizado')
    }
  }

  const exportAsJSON = () => {
    const analysisData = getAnalysisData()
    if (analysisData.length === 0) {
      toast.error('Nenhum dado disponível para exportação')
      return
    }

    const exportData = {
      endpoint: {
        method: endpoint.method,
        path: endpoint.path,
        summary: endpoint.summary,
      },
      request: result.requestConfig,
      response: {
        status: result.status,
        statusText: result.statusText,
        totalRecords: analysisData.length,
        timestamp: result.timestamp,
      },
      data: analysisData,
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `api-test-${endpoint.method}-${endpoint.path.replace(/\//g, '-')}-${new Date().toISOString().split('T')[0]}.json`
    link.click()
    URL.revokeObjectURL(url)
    toast.success(`${analysisData.length} registros exportados como JSON`)
  }

  const exportAsExcel = () => {
    const analysisData = getAnalysisData()
    if (analysisData.length === 0) {
      toast.error('Nenhum dado disponível para exportação')
      return
    }

    // Detectar tipo de endpoint baseado no path
    let endpointType = 'dados'
    let columns = []

    if (endpoint.path.includes('/clientes')) {
      endpointType = 'clientes'
      columns = EndpointColumns.clientes
    } else if (endpoint.path.includes('/lojas')) {
      endpointType = 'lojas'
      columns = EndpointColumns.lojas
    } else if (endpoint.path.includes('/produtos')) {
      endpointType = 'produtos'
      columns = EndpointColumns.produtos
    } else if (endpoint.path.includes('/vendedores')) {
      endpointType = 'vendedores'
      columns = EndpointColumns.vendedores
    } else if (endpoint.path.includes('/vendas')) {
      endpointType = 'vendas'
      columns = EndpointColumns.vendas
    }

    // Se não há colunas específicas, criar automaticamente
    if (columns.length === 0 && analysisData.length > 0) {
      columns = Object.keys(analysisData[0]).map(key => ({ key, label: key }))
    }

    // Gerar nome do arquivo
    const timestamp = new Date().toISOString().split('T')[0]
    const filename = `${endpointType}-base49-${timestamp}.csv`

    // Exportar usando o ExcelExporter
    ExcelExporter.downloadCSV(filename, analysisData, columns)
    toast.success(`Dados exportados: ${filename} (${analysisData.length} registros)`)
  }

  const exportAsXLSX = () => {
    if (!result?.data) {
      return
    }

    // Detectar tipo de endpoint baseado no path
    let endpointType = 'dados'
    let columns = []
    let data = []

    if (endpoint.path.includes('/clientes')) {
      endpointType = 'clientes'
      columns = EndpointColumns.clientes
    } else if (endpoint.path.includes('/lojas')) {
      endpointType = 'lojas'
      columns = EndpointColumns.lojas
    } else if (endpoint.path.includes('/produtos')) {
      endpointType = 'produtos'
      columns = EndpointColumns.produtos
    } else if (endpoint.path.includes('/vendedores')) {
      endpointType = 'vendedores'
      columns = EndpointColumns.vendedores
    } else if (endpoint.path.includes('/vendas')) {
      endpointType = 'vendas'
      columns = EndpointColumns.vendas
    }

    // Usar dados da análise
    const analysisData = getAnalysisData()
    if (analysisData.length === 0) {
      toast.error('Nenhum dado disponível para exportação')
      return
    }

    // Usar os dados analisados corretamente
    data = analysisData

    // Se não há colunas específicas, criar automaticamente
    if (columns.length === 0 && data.length > 0) {
      columns = Object.keys(data[0]).map(key => ({ key, label: key }))
    }

    // Gerar nome do arquivo
    const timestamp = new Date().toISOString().split('T')[0]
    const filename = `${endpointType}-base49-${timestamp}.xlsx`

    // Exportar usando o ExcelExporter
    ExcelExporter.downloadXLSX(filename, data, columns)
    toast.success(`Excel exportado: ${filename} (${data.length} registros)`)
  }

  const exportAsHTML = () => {
    if (!result) {
      return
    }

    const htmlContent = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Teste API - ${endpoint.method} ${endpoint.path}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
        .header { border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
        .section { margin-bottom: 30px; }
        .code { background: #f5f5f5; padding: 15px; border-radius: 5px; overflow-x: auto; }
        .success { color: #16a34a; }
        .error { color: #dc2626; }
        .method { padding: 2px 8px; border-radius: 3px; font-weight: bold; color: white; font-size: 12px; }
        .get { background: #2563eb; }
        .post { background: #16a34a; }
        .put { background: #ea580c; }
        .delete { background: #dc2626; }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Teste de API</h1>
        <p><span class="method ${endpoint.method.toLowerCase()}">${endpoint.method}</span> ${endpoint.path}</p>
        <p><strong>Testado em:</strong> ${result.timestamp}</p>
    </div>
    
    <div class="section">
        <h2>Endpoint</h2>
        <p><strong>Descrição:</strong> ${endpoint.description}</p>
        <p><strong>Resumo:</strong> ${endpoint.summary}</p>
    </div>
    
    <div class="section">
        <h2>Resultado</h2>
        <p><strong>Status:</strong> <span class="${result.success ? 'success' : 'error'}">${result.status} ${result.statusText || ''}</span></p>
        ${result.message ? `<p><strong>Mensagem:</strong> ${typeof result.message === 'string' ? result.message : JSON.stringify(result.message)}</p>` : ''}
    </div>
    
    <div class="section">
        <h2>Dados da Resposta</h2>
        <div class="code">
            <pre>${JSON.stringify(result.data, null, 2)}</pre>
        </div>
    </div>
    
    ${result.requestConfig ? `
    <div class="section">
        <h2>Configuração da Requisição</h2>
        <div class="code">
            <pre>${JSON.stringify(result.requestConfig, null, 2)}</pre>
        </div>
    </div>
    ` : ''}
</body>
</html>`

    const blob = new Blob([htmlContent], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `api-test-${endpoint.method}-${endpoint.path.replace(/\//g, '-')}-${new Date().toISOString().split('T')[0]}.html`
    link.click()
    URL.revokeObjectURL(url)
    toast.success('Relatório HTML gerado')
  }

  // Obter dados para análise
  const getAnalysisData = () => {
    // Priorizar dados do streaming se disponível
    if (streamData.length > 0) {
      return streamData
    }

    // NOVO: Estrutura otimizada: {success: true, data: {data: [...], meta: {...}}}
    if (result?.data?.data?.data && Array.isArray(result.data.data.data)) {
      return result.data.data.data
    }

    // NOVO: Estrutura otimizada direta: {data: {data: [...], meta: {...}}}
    if (result?.data?.data && Array.isArray(result.data.data)) {
      console.log('🎯 Usando estrutura otimizada:', result.data.data.length, 'registros')
      return result.data.data
    }

    // Estrutura: [...] (array direto)
    if (Array.isArray(result?.data)) {
      return result.data
    }

    // Estrutura: {objeto único}
    if (result?.data && typeof result.data === 'object') {
      return [result.data]
    }

    console.warn('⚠️ Estrutura de dados não reconhecida:', result)
    return []
  }

  const openAnalysisViewer = () => {
    const analysisData = getAnalysisData()
    if (analysisData.length === 0) {
      toast.error('Nenhum dado disponível para análise')
      return
    }
    setShowAnalysisViewer(true)
  }

  const copyToClipboard = () => {
    if (!result) {
      return
    }

    const text = `# Teste API: ${endpoint.method} ${endpoint.path}

**Testado em:** ${result.timestamp}
**Status:** ${result.success ? '✅ Sucesso' : '❌ Erro'} - ${result.status} ${result.statusText || ''}
${result.message ? `**Mensagem:** ${typeof result.message === 'string' ? result.message : JSON.stringify(result.message)}` : ''}

## Resposta:
\`\`\`json
${JSON.stringify(result.data, null, 2)}
\`\`\`

${result.requestConfig ? `## Configuração da Requisição:
\`\`\`json
${JSON.stringify(result.requestConfig, null, 2)}
\`\`\`` : ''}`

    navigator.clipboard.writeText(text).then(() => {
      toast.success('Resultado copiado para área de transferência')
    }).catch(() => {
      toast.error('Erro ao copiar para área de transferência')
    })
  }

  return (
    <>
      <Dialog open={isOpen} onClose={() => {}} className="relative z-50">
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4 overflow-y-auto">
          <Dialog.Panel className="w-full max-w-5xl bg-white dark:bg-gray-800 rounded-lg shadow-xl max-h-screen overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div>
                  <Dialog.Title className="text-lg font-medium text-gray-900 dark:text-white">
                  Testar Endpoint
                  </Dialog.Title>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium text-white mr-2 ${
                      endpoint.method === 'GET' ? 'bg-blue-600' :
                        endpoint.method === 'POST' ? 'bg-green-600' :
                          endpoint.method === 'PUT' ? 'bg-orange-600' :
                            endpoint.method === 'DELETE' ? 'bg-red-600' : 'bg-gray-600'
                    }`}>
                      {endpoint.method}
                    </span>
                    {endpoint.path}
                  </p>
                  {/* Indicador de usuário API selecionado */}
                  {selectedApiUser && (
                    <div className="mt-2 flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400">
                      <KeyIcon className="h-4 w-4" />
                      <span>Testando como: <strong>{selectedApiUser.name}</strong> (Base {selectedApiUser.baseId})</span>
                    </div>
                  )}
                </div>

                {/* Botão de documentação do PontoMarket */}
                {endpoint.tags?.some(tag =>
                  tag.includes('PontoMarket') ||
                tag.includes('CRM') ||
                tag.includes('API-Clientes') ||
                tag.includes('API-Produtos') ||
                tag.includes('API-Vendas') ||
                tag.includes('API-Vendedores') ||
                tag.includes('API-Lojas'),
                ) && (
                  <button
                    onClick={() => {
                      if (!showDocumentation) {
                        getEndpointDocumentation()
                      }
                      setShowDocumentation(!showDocumentation)
                    }}
                    className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/50 dark:hover:bg-blue-800 text-blue-700 dark:text-blue-300 rounded-md transition-colors"
                    title="Ver documentação PontoMarket"
                  >
                  📋 Doc PontoMarket
                  </button>
                )}

                {/* Ícone de ajuda discreto */}
                <button
                  onClick={() => {
                    if (!showDocumentation) {
                      getEndpointDocumentation()
                    }
                    setShowDocumentation(!showDocumentation)
                  }}
                  className="text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
                  title="Ver documentação deste endpoint"
                >
                  <QuestionMarkCircleIcon className="h-5 w-5" />
                </button>
              </div>

              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Configuração da Requisição */}
              <div className="space-y-4">
                <h3 className="text-md font-medium text-gray-900 dark:text-white">
                Configuração da Requisição
                </h3>

                {/* Documentação do Endpoint */}
                {showDocumentation && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-md max-h-96 overflow-y-auto">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100">
                    📋 Documentação do Endpoint
                      </h4>
                    </div>

                    {endpointDoc ? (
                      <div className="prose prose-sm max-w-none text-blue-800 dark:text-blue-200">
                        <pre className="whitespace-pre-wrap text-xs bg-blue-100 dark:bg-blue-800/50 p-3 rounded font-mono">
                          {endpointDoc}
                        </pre>
                      </div>
                    ) : (
                      <div className="text-sm text-blue-700 dark:text-blue-300 animate-pulse">
                    Carregando documentação específica do endpoint...
                      </div>
                    )}
                  </div>
                )}

                {/* Parâmetros Query */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Parâmetros Query
                  </label>
                  {(() => {
                  // Usar parâmetros do Swagger se disponíveis, senão gerar parâmetros PontoMarket
                    const params = endpoint.parameters && endpoint.parameters.length > 0
                      ? endpoint.parameters
                      : generatePontoMarketParams(endpoint.path)

                    // Verificar se tem parâmetros com grupos
                    const hasGroups = params.some(p => (p as any).group)

                    if (hasGroups) {
                      // Agrupar parâmetros por grupo
                      const groupedParams = params.reduce((acc, param) => {
                        const group = (param as any).group || 'outros'
                        if (!acc[group]) {
                          acc[group] = []
                        }
                        acc[group].push(param)
                        return acc
                      }, {} as Record<string, typeof params>)

                      const groupOrder = ['principal', 'datas', 'filtros', 'avancado', 'outros']
                      const groupLabels = {
                        principal: '🎯 Parâmetros Principais',
                        datas: '📅 Filtros de Data',
                        filtros: '🔍 Filtros Específicos',
                        avancado: '⚙️ Opções Avançadas',
                        outros: '📋 Outros Parâmetros',
                      }

                      return (
                        <div className="space-y-4">
                          {groupOrder.filter(group => groupedParams[group]).map(group => (
                            <div key={group} className="border dark:border-gray-700 rounded-lg p-3">
                              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                {groupLabels[group] || group}
                              </h4>
                              <div className="space-y-2">
                                {groupedParams[group]
                                  .filter(param => param.name !== 'limit' && param.name !== 'offset')
                                  .map((param) => (
                                    <div key={param.name}>
                                      <label className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                                        {param.name} {param.required && <span className="text-red-500">*</span>}
                                        {param.isUrlParam && (
                                          <span className="text-xs bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 px-1.5 py-0.5 rounded">
                                            URL
                                          </span>
                                        )}
                                        <QuestionMarkCircleIcon
                                          className="h-3 w-3 text-gray-400 hover:text-blue-500 cursor-help"
                                          title={
                                            param.isUrlParam ? `Este parâmetro vai na URL. ${param.description}` :
                                              param.name === 'baseId' ? 'ID da base. Padrão: 49 (Qualina)' :
                                                param.name === 'limite' ? 'Quantos registros buscar. Padrão: 1000' :
                                                  param.name === 'offset' ? 'Pular registros (paginação). 0=início, 1000=página 2, 2000=página 3' :
                                                    param.name === 'dataInicial' || param.name === 'dataFinal' ? 'Formato: YYYYMMDD (ex: 20241201)' :
                                                      param.description
                                          }
                                        />
                                      </label>
                                      {(param as any).type === 'select' ? (
                                        <select
                                          value={queryParams[param.name] || ''}
                                          onChange={(e) => setQueryParams(prev => ({ ...prev, [param.name]: e.target.value }))}
                                          className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                          <option value="">Selecione...</option>
                                          {(param as any).options?.map((option: string) => (
                                            <option key={option} value={option}>{option}</option>
                                          ))}
                                        </select>
                                      ) : (param as any).type === 'boolean' ? (
                                        <div className="flex items-center gap-4 mt-1">
                                          <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-800 p-3 rounded-md">
                                            <label className="flex items-center gap-2 cursor-pointer">
                                              <input
                                                type="radio"
                                                name={param.name}
                                                checked={queryParams[param.name] !== 'true'}
                                                onChange={() => setQueryParams(prev => ({
                                                  ...prev,
                                                  [param.name]: '',
                                                }))}
                                                className="h-4 w-4 text-blue-600"
                                              />
                                              <div>
                                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                  🚀 Rápido
                                                </span>
                                                <span className="text-xs text-gray-500 dark:text-gray-400 block">
                                                  Sem campos calculados
                                                </span>
                                              </div>
                                            </label>
                                            <div className="w-px h-8 bg-gray-300 dark:bg-gray-600"></div>
                                            <label className="flex items-center gap-2 cursor-pointer">
                                              <input
                                                type="radio"
                                                name={param.name}
                                                checked={queryParams[param.name] === 'true'}
                                                onChange={() => setQueryParams(prev => ({
                                                  ...prev,
                                                  [param.name]: 'true',
                                                }))}
                                                className="h-4 w-4 text-blue-600"
                                              />
                                              <div>
                                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                  📊 Completo
                                                </span>
                                                <span className="text-xs text-gray-500 dark:text-gray-400 block">
                                                  Com primeira/última venda
                                                </span>
                                              </div>
                                            </label>
                                          </div>
                                        </div>
                                      ) : (
                                        <input
                                          type="text"
                                          value={queryParams[param.name] || ''}
                                          onChange={(e) => setQueryParams(prev => ({ ...prev, [param.name]: e.target.value }))}
                                          placeholder={
                                            (param as any).placeholder ||
                                            (param.name === 'baseId' ? '49' :
                                              param.name === 'limite' ? '1000' :
                                                param.name === 'offset' ? '0' :
                                                  param.name === 'dataInicial' || param.name === 'dataFinal' ? '20241201' :
                                                    param.description)
                                          }
                                          disabled={(param as any).disableWhen && queryParams[(param as any).disableWhen]}
                                          className={`w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                            (param as any).disableWhen && queryParams[(param as any).disableWhen]
                                              ? 'opacity-50 cursor-not-allowed'
                                              : ''
                                          }`}
                                        />
                                      )}
                                    </div>
                                  ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )
                    }

                    return params.length > 0 ? (
                      <div className="space-y-2">
                        {params
                          .filter(param => param.name !== 'limit' && param.name !== 'offset')
                          .map((param) => (
                            <div key={param.name}>
                              <label className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                                {param.name} {param.required && <span className="text-red-500">*</span>}
                                {param.isUrlParam && (
                                  <span className="text-xs bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 px-1.5 py-0.5 rounded">
                                    URL
                                  </span>
                                )}
                                {param.name === 'baseId' && selectedApiUser && (
                                  <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-1.5 py-0.5 rounded flex items-center gap-1">
                                    <KeyIcon className="h-3 w-3" />
                                    API
                                  </span>
                                )}
                                <QuestionMarkCircleIcon
                                  className="h-3 w-3 text-gray-400 hover:text-blue-500 cursor-help"
                                  title={
                                    param.isUrlParam ? `Este parâmetro vai na URL. ${param.description}` :
                                      param.name === 'baseId' ? (selectedApiUser ? `Usando contexto do usuário API: ${selectedApiUser.name} (Base ${selectedApiUser.baseId})` : 'ID da base. Padrão: 49 (Qualina)') :
                                        param.name === 'limite' ? 'Quantos registros buscar. Padrão: 1000' :
                                          param.name === 'offset' ? 'Pular registros (paginação). 0=início, 1000=página 2, 2000=página 3' :
                                            param.name === 'dataInicial' || param.name === 'dataFinal' ? 'Formato: YYYYMMDD (ex: 20241201)' :
                                              param.description
                                  }
                                />
                              </label>
                              {(param as any).type === 'boolean' ? (
                                <div className="flex items-center gap-4 mt-1">
                                  <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-800 p-3 rounded-md">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                      <input
                                        type="radio"
                                        name={param.name}
                                        checked={queryParams[param.name] !== 'true'}
                                        onChange={() => setQueryParams(prev => ({
                                          ...prev,
                                          [param.name]: '',
                                        }))}
                                        className="h-4 w-4 text-blue-600"
                                      />
                                      <div>
                                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                          🚀 Rápido
                                        </span>
                                        <span className="text-xs text-gray-500 dark:text-gray-400 block">
                                          Sem campos calculados
                                        </span>
                                      </div>
                                    </label>
                                    <div className="w-px h-8 bg-gray-300 dark:bg-gray-600"></div>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                      <input
                                        type="radio"
                                        name={param.name}
                                        checked={queryParams[param.name] === 'true'}
                                        onChange={() => setQueryParams(prev => ({
                                          ...prev,
                                          [param.name]: 'true',
                                        }))}
                                        className="h-4 w-4 text-blue-600"
                                      />
                                      <div>
                                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                          📊 Completo
                                        </span>
                                        <span className="text-xs text-gray-500 dark:text-gray-400 block">
                                          Com primeira/última venda
                                        </span>
                                      </div>
                                    </label>
                                  </div>
                                </div>
                              ) : (
                                <input
                                  type="text"
                                  value={
                                    // Se é baseId e tem usuário API selecionado, mostrar o baseId dele
                                    param.name === 'baseId' && selectedApiUser 
                                      ? selectedApiUser.baseId.toString()
                                      : queryParams[param.name] || ''
                                  }
                                  onChange={(e) => {
                                    // Se é baseId e tem usuário API selecionado, não permitir alteração
                                    if (param.name === 'baseId' && selectedApiUser) {
                                      return
                                    }
                                    setQueryParams(prev => ({ ...prev, [param.name]: e.target.value }))
                                  }}
                                  placeholder={
                                    param.name === 'baseId' ? '49' :
                                      param.name === 'limite' ? '1000' :
                                        param.name === 'offset' ? '0' :
                                          param.name === 'dataInicial' || param.name === 'dataFinal' ? '20241201' :
                                            param.description
                                  }
                                  disabled={
                                    // Desabilitar baseId quando tem usuário API selecionado
                                    (param.name === 'baseId' && selectedApiUser) ||
                                    ((param as any).disableWhen && queryParams[(param as any).disableWhen])
                                  }
                                  className={`w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                    ((param.name === 'baseId' && selectedApiUser) || ((param as any).disableWhen && queryParams[(param as any).disableWhen]))
                                      ? 'opacity-50 cursor-not-allowed'
                                      : ''
                                  }`}
                                />
                              )}
                            </div>
                          ))}
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500 dark:text-gray-400 italic">
                      Nenhum parâmetro definido
                      </div>
                    )
                  })()}

                  {/* Botões de configuração */}
                  <div className="flex gap-2 mt-2">
                    <div className="flex-1 relative">
                      <Button
                        onClick={initializeParams}
                        size="sm"
                        variant="outline"
                        className="w-full"
                      >
                      Preencher Padrões ({getDatePeriodText(lastDatePeriod)})
                      </Button>

                      {/* Dropdown de opções de data */}
                      {showDateOptions && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg z-50 p-2">
                          <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Escolha o período:</div>
                          {/* Botão padrão destacado */}
                          <button
                            onClick={() => preencherComData(lastDatePeriod)}
                            className="w-full mb-2 px-2 py-1.5 text-xs bg-blue-100 dark:bg-blue-900 hover:bg-blue-200 dark:hover:bg-blue-800 rounded text-left border-2 border-blue-300 dark:border-blue-700"
                          >
                          ⭐ {getDatePeriodText(lastDatePeriod)} (Padrão)
                          </button>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Outras opções:</div>
                          <div className="grid grid-cols-2 gap-1">
                            <button
                              onClick={() => preencherComData('hoje')}
                              className={getDropdownItemClass('hoje')}
                            >
                              {lastDatePeriod === 'hoje' ? '✅' : '📅'} Hoje
                            </button>
                            <button
                              onClick={() => preencherComData('ontem')}
                              className={getDropdownItemClass('ontem')}
                            >
                              {lastDatePeriod === 'ontem' ? '✅' : '📅'} Ontem
                            </button>
                            <button
                              onClick={() => preencherComData('semana')}
                              className={getDropdownItemClass('semana')}
                            >
                              {lastDatePeriod === 'semana' ? '✅' : '📅'} 7 dias
                            </button>
                            <button
                              onClick={() => preencherComData('mes')}
                              className={getDropdownItemClass('mes')}
                            >
                              {lastDatePeriod === 'mes' ? '✅' : '📅'} 1 mês
                            </button>
                            <button
                              onClick={() => preencherComData('3meses')}
                              className={getDropdownItemClass('3meses')}
                            >
                              {lastDatePeriod === '3meses' ? '✅' : '📅'} 3 meses
                            </button>
                            <button
                              onClick={() => preencherComData('6meses')}
                              className={getDropdownItemClass('6meses')}
                            >
                              {lastDatePeriod === '6meses' ? '✅' : '📅'} 6 meses
                            </button>
                            <button
                              onClick={() => preencherComData('ano')}
                              className={getDropdownItemClass('ano')}
                            >
                              {lastDatePeriod === 'ano' ? '✅' : '📅'} 1 ano
                            </button>
                            <button
                              onClick={() => preencherComData('mesCorrente')}
                              className={getDropdownItemClass('mesCorrente')}
                            >
                              {lastDatePeriod === 'mesCorrente' ? '✅' : '📅'} Mês atual
                            </button>
                            <button
                              onClick={() => preencherComData('anoCorrente')}
                              className={getDropdownItemClass('anoCorrente')}
                            >
                              {lastDatePeriod === 'anoCorrente' ? '✅' : '📅'} Ano corrente
                            </button>
                            <button
                              onClick={() => preencherComData('tudo')}
                              className={lastDatePeriod === 'tudo'
                                ? 'px-2 py-1 text-xs bg-orange-200 dark:bg-orange-800 text-orange-900 dark:text-orange-100 border border-orange-300 dark:border-orange-600 rounded text-left font-medium'
                                : 'px-2 py-1 text-xs bg-orange-100 dark:bg-orange-900/50 hover:bg-orange-200 dark:hover:bg-orange-800 rounded text-left font-medium'
                              }
                            >
                              {lastDatePeriod === 'tudo' ? '✅' : '🔥'} TODOS (sem filtro)
                            </button>
                          </div>
                          <button
                            onClick={() => setShowDateOptions(false)}
                            className="w-full mt-2 px-2 py-1 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                          >
                          ✕ Cancelar
                          </button>
                        </div>
                      )}
                    </div>
                    <Button
                      onClick={clearSavedConfigs}
                      size="sm"
                      variant="outline"
                      className="px-3"
                      title="Limpar configurações salvas"
                    >
                    🗑️
                    </Button>
                  </div>

                  {/* Indicador de configurações salvas */}
                  {(Object.keys(queryParams).some(key => queryParams[key]?.trim()) ||
                  requestBody.trim() ||
                  Object.keys(customHeaders).length > 0) && (
                    <div className="text-xs text-green-600 dark:text-green-400 mt-1 flex items-center gap-1">
                    💾 Configurações salvas automaticamente
                    </div>
                  )}
                </div>

                {/* Configurações Avançadas */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <button
                    onClick={() => setShowAdvancedConfig(!showAdvancedConfig)}
                    className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                  >
                    <AdjustmentsHorizontalIcon className="h-4 w-4" />
                  Configurações Avançadas de Paginação
                    <span className="ml-auto">{showAdvancedConfig ? '▼' : '▶'}</span>
                  </button>

                  {showAdvancedConfig && (
                    <div className="mt-4 space-y-3 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-md">
                      <div>
                        <label className="flex items-center gap-2 text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Tamanho da Página (registros por vez)
                          <QuestionMarkCircleIcon
                            className="h-4 w-4 text-gray-400 hover:text-blue-500 cursor-help"
                            title="Páginas menores = mais requests, menos memória | Páginas maiores = menos requests, mais memória"
                          />
                        </label>
                        <select
                          value={customPageSize || ''}
                          onChange={(e) => setCustomPageSize(e.target.value ? parseInt(e.target.value) : null)}
                          className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        >
                          <option value="">Padrão ({getEndpointConfig(endpoint.path).defaultPageSize})</option>
                          {pageSizeOptions.map(size => (
                            <option key={size} value={size}>{size.toLocaleString()} registros</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="flex items-center gap-2 text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Limite Máximo Total
                          <QuestionMarkCircleIcon
                            className="h-4 w-4 text-gray-400 hover:text-blue-500 cursor-help"
                            title="Protege contra travamentos limitando o total de registros carregados"
                          />
                        </label>
                        <input
                          type="number"
                          value={maxRecords || ''}
                          onChange={(e) => setMaxRecords(e.target.value ? parseInt(e.target.value) : null)}
                          placeholder={`Padrão: ${getEndpointConfig(endpoint.path).maxTotalRecords.toLocaleString()}`}
                          className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                      </div>

                      {/* Campos Limit e Offset */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="flex items-center gap-2 text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Limit
                            <QuestionMarkCircleIcon
                              className="h-4 w-4 text-gray-400 hover:text-blue-500 cursor-help"
                              title="Número de registros por requisição"
                            />
                          </label>
                          <input
                            type="number"
                            value={queryParams.limit || ''}
                            onChange={(e) => setQueryParams(prev => ({ ...prev, limit: e.target.value }))}
                            placeholder="1000"
                            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          />
                        </div>

                        <div>
                          <label className="flex items-center gap-2 text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Offset
                            <QuestionMarkCircleIcon
                              className="h-4 w-4 text-gray-400 hover:text-blue-500 cursor-help"
                              title="Número de registros para pular (paginação)"
                            />
                          </label>
                          <input
                            type="number"
                            value={queryParams.offset || ''}
                            onChange={(e) => setQueryParams(prev => ({ ...prev, offset: e.target.value }))}
                            placeholder="0"
                            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          />
                        </div>
                      </div>

                    </div>
                  )}
                </div>

                {/* Body da Requisição */}
                {['POST', 'PUT', 'PATCH'].includes(endpoint.method) && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Corpo da Requisição (JSON)
                    </label>
                    <textarea
                      value={requestBody}
                      onChange={(e) => setRequestBody(e.target.value)}
                      placeholder='{"exemplo": "valor"}'
                      rows={6}
                      className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                    />
                  </div>
                )}

                {/* Execução de Teste - BOTÃO ÚNICO INTELIGENTE */}
                <div className="space-y-2">
                  <Button
                    onClick={isLoading ? handleCancel : handleSmartTest}
                    disabled={false}
                    className="w-full flex items-center justify-center gap-2"
                    variant={isLoading ? 'outline' : 'primary'}
                  >
                    {isLoading ? (
                      <>
                        <XMarkIcon className="h-4 w-4" />
                      Cancelar Teste
                      </>
                    ) : (
                      <>
                        <PlayIcon className="h-4 w-4" />
                      Executar
                      </>
                    )}
                  </Button>

                  {/* Aviso quando baseId é ignorado */}
                  {selectedApiUser && queryParams.baseId && (
                    <div className="mt-3 p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
                      <div className="flex items-start gap-2">
                        <InformationCircleIcon className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                        <div className="text-sm">
                          <p className="text-blue-800 dark:text-blue-200 font-medium">
                            Contexto automático ativado
                          </p>
                          <p className="text-blue-700 dark:text-blue-300 text-xs mt-0.5">
                            O parâmetro <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">baseId</code> será ignorado. 
                            O contexto será da base {selectedApiUser.baseId} ({selectedApiUser.baseName || 'Base ' + selectedApiUser.baseId}) 
                            definida no usuário API "{selectedApiUser.name}".
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Configuração da Requisição */}
                  <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-900 rounded-md relative">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Configuração da Requisição</span>
                      <button
                        onClick={() => {
                          // Processar parâmetros como será enviado na requisição real
                          const realParams = { ...queryParams }
                          
                          // Se tem usuário API selecionado, remover baseId
                          if (selectedApiUser && realParams.baseId) {
                            delete realParams.baseId
                          }
                          
                          // Processar headers reais
                          const realHeaders: Record<string, string> = {
                            'Content-Type': 'application/json',
                            ...customHeaders,
                          }
                          
                          // Adicionar headers de API se houver
                          if (selectedApiUser?.api_key && selectedApiUser?.api_secret) {
                            realHeaders['X-API-Key'] = selectedApiUser.api_key
                            realHeaders['X-API-Secret'] = selectedApiUser.api_secret
                          }
                          
                          const requestData = {
                            method: endpoint.method,
                            url: `${endpoint.path}?${new URLSearchParams(realParams).toString()}`,
                            queryParams: realParams,
                            headers: realHeaders,
                            ...(requestBody && { body: requestBody }),
                          }
                          navigator.clipboard.writeText(JSON.stringify(requestData, null, 2))
                          toast.success('Configuração copiada!')
                        }}
                        className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
                        title="Copiar configuração"
                      >
                        <ClipboardDocumentIcon className="h-5 w-5" />
                      </button>
                    </div>
                    <pre className="text-xs text-gray-600 dark:text-gray-400 overflow-auto max-h-32 font-mono">
                      {(() => {
                        // Processar parâmetros como será enviado na requisição real
                        const realParams = { ...queryParams }
                        
                        // Se tem usuário API selecionado, remover baseId
                        if (selectedApiUser && realParams.baseId) {
                          delete realParams.baseId
                        }
                        
                        // Processar headers reais
                        const realHeaders: Record<string, string> = {}
                        
                        // Adicionar headers customizados
                        if (Object.keys(customHeaders).length > 0) {
                          Object.assign(realHeaders, customHeaders)
                        }
                        
                        // Adicionar headers de API se houver
                        if (selectedApiUser?.api_key && selectedApiUser?.api_secret) {
                          realHeaders['X-API-Key'] = selectedApiUser.api_key
                          realHeaders['X-API-Secret'] = selectedApiUser.api_secret
                        }
                        
                        return JSON.stringify({
                          method: endpoint.method,
                          url: `${endpoint.path}?${new URLSearchParams(realParams).toString()}`,
                          queryParams: realParams,
                          ...(Object.keys(realHeaders).length > 0 && { headers: realHeaders }),
                          ...(requestBody && { body: JSON.parse(requestBody || '{}') }),
                        }, null, 2)
                      })()}
                    </pre>
                  </div>

                  {/* Progress Indicator */}
                  {testProgress.isRunning && (
                    <div className="flex items-center justify-center gap-3 py-2">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">Executando...</span>
                      <span className="text-sm text-blue-600 dark:text-blue-400 font-mono font-semibold">
                      ⏱️ {elapsedSeconds}s
                      </span>
                    </div>
                  )}

                  {/* Pagination Controls */}
                  {result && paginationData.hasMore && (
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
                      <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
                        <span>
                        Página {paginationData.currentPage} - {paginationData.totalRecords.toLocaleString()} registros total
                        </span>
                        <span>
                          {((paginationData.currentPage - 1) * paginationData.recordsPerPage + 1).toLocaleString()} - {Math.min(paginationData.currentPage * paginationData.recordsPerPage, paginationData.totalRecords).toLocaleString()}
                        </span>
                      </div>
                      <Button
                        onClick={handleNextPage}
                        disabled={isLoading}
                        variant="outline"
                        className="w-full flex items-center justify-center gap-2"
                      >
                        {isLoading ? (
                          <>
                            <LoadingSpinner size="sm" />
                          Carregando...
                          </>
                        ) : (
                          <>
                            <ChevronRightIcon className="h-4 w-4" />
                          Carregar Próxima Página ({paginationData.recordsPerPage} registros)
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Resultado */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-md font-medium text-gray-900 dark:text-white">
                  Resultado
                  </h3>

                  {result && (
                    <div className="flex items-center gap-2">
                      {/* Botões de visualização */}
                      <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                        <button
                          onClick={() => setViewMode('json')}
                          className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200 ${viewMode === 'json'
                            ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
                            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-gray-600'
                          }`}
                        >
                        📄 JSON
                        </button>
                        <button
                          onClick={() => setViewMode('table')}
                          className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200 ml-1 ${viewMode === 'table'
                            ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
                            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-gray-600'
                          }`}
                        >
                        📊 Tabela
                        </button>
                        <button
                          onClick={() => setViewMode('sql')}
                          className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200 ml-1 ${viewMode === 'sql'
                            ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
                            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-gray-600'
                          }`}
                        >
                        🔍 SQL
                        </button>
                      </div>

                      {/* Botão de Análise Avançada */}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={openAnalysisViewer}
                        className="bg-gradient-to-r from-blue-500 to-purple-600 text-white border-none hover:from-blue-600 hover:to-purple-700"
                      >
                        <ArrowsPointingOutIcon className="h-4 w-4" />
                      Análise
                      </Button>

                      <Button size="sm" variant="outline" onClick={copyToClipboard}>
                        <ClipboardDocumentIcon className="h-4 w-4" />
                      </Button>
                      {/* Botão de exportação contextual baseado no viewMode */}
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => {
                          // Se estiver em modo tabela, exporta XLSX
                          if (viewMode === 'table') {
                            exportAsXLSX()
                          } 
                          // Se estiver em modo JSON, exporta JSON
                          else if (viewMode === 'json') {
                            exportAsJSON()
                          }
                          // Se estiver em modo SQL, exporta JSON (dados brutos)
                          else if (viewMode === 'sql') {
                            exportAsJSON()
                          }
                        }}
                        title={
                          viewMode === 'table' 
                            ? 'Exportar como Excel (XLSX)' 
                            : 'Exportar como JSON'
                        }
                      >
                        <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
                        {viewMode === 'table' ? 'XLSX' : 'JSON'}
                      </Button>
                    </div>
                  )}
                </div>

                {/* Resumo dos dados */}
                {result && (
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🎯</span>
                      <div className="text-sm text-green-700 dark:text-green-300">
                        {(() => {
                        // Calcular total de registros
                          let totalRecords = 0
                          if (streamData.length > 0) {
                            totalRecords = streamData.length
                          } else if (result.data?.data && Array.isArray(result.data.data)) {
                            totalRecords = result.data.data.length
                          } else if (result.data?.data?.data && Array.isArray(result.data.data.data)) {
                            totalRecords = result.data.data.data.length
                          } else if (Array.isArray(result.data)) {
                            totalRecords = result.data.length
                          }

                          // Calcular tempo se disponível
                          let timeText = ''
                          if (testProgress.startTime) {
                            const totalTime = ((Date.now() - testProgress.startTime.getTime()) / 1000).toFixed(1)
                            timeText = ` • ${totalTime}s`
                          }

                          return `${totalRecords.toLocaleString()} registros carregados com sucesso${timeText}`
                        })()}
                      </div>
                    </div>
                  </div>
                )}

                {result ? (
                  <div className="space-y-4">
                    {/* Logs em tempo real */}
                    {logs.length > 0 && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">📋 Log da Execução ({logs.length} entradas):</span>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(logs.join('\n'))
                                toast.success('Logs copiados para clipboard!')
                              }}
                              className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                            >
                            📋 Copiar
                            </button>
                            <button
                              onClick={() => setLogs([])}
                              className="text-xs text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
                            >
                            🗑️ Limpar
                            </button>
                          </div>
                        </div>
                        <div className="mt-2 p-4 bg-gray-900 dark:bg-gray-950 rounded-md overflow-auto max-h-64 text-sm border">
                          {logs.map((log, index) => {
                          // Detectar tipo de log baseado nos ícones
                            let textColor = 'text-gray-300'
                            let bgColor = ''
                            let borderColor = ''

                            if (log.includes('❌')) {
                              textColor = 'text-red-300'
                              bgColor = 'bg-red-900/20'
                              borderColor = 'border-l-red-500'
                            } else if (log.includes('⚠️')) {
                              textColor = 'text-yellow-300'
                              bgColor = 'bg-yellow-900/20'
                              borderColor = 'border-l-yellow-500'
                            } else if (log.includes('⚡')) {
                              textColor = 'text-blue-300'
                              bgColor = 'bg-blue-900/20'
                              borderColor = 'border-l-blue-500'
                            } else if (log.includes('✅')) {
                              textColor = 'text-green-300'
                              bgColor = 'bg-green-900/20'
                              borderColor = 'border-l-green-500'
                            } else if (log.includes('📋')) {
                              textColor = 'text-purple-300'
                              bgColor = 'bg-purple-900/20'
                              borderColor = 'border-l-purple-500'
                            }

                            return (
                              <div key={index} className={`${textColor} ${bgColor} ${borderColor} font-mono text-xs leading-relaxed p-2 mb-1 border-l-2 rounded-r animate-in slide-in-from-left duration-200`}>
                                {log}
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    {/* Status */}
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Status:</span>
                      <span className={`text-sm font-medium ${
                        result.success ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {result.status} {result.statusText}
                      </span>
                    </div>

                    {result.message && (
                      <div>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Mensagem:</span>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {typeof result.message === 'string'
                            ? result.message
                            : JSON.stringify(result.message)
                          }
                        </p>
                      </div>
                    )}

                    {/* Dados da Resposta */}
                    <div>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Dados:</span>

                      {viewMode === 'json' && (
                        <div className="mt-2 bg-gray-50 dark:bg-gray-900 rounded-md overflow-hidden">
                          <div className="bg-gray-100 dark:bg-gray-800 px-3 py-2 flex justify-between items-center">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">📄 Dados (JSON)</span>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(jsonCache || JSON.stringify(result.data, null, 2))
                                toast.success('JSON copiado!')
                              }}
                              className="text-xs bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded"
                            >
                            📋 Copiar JSON
                            </button>
                          </div>
                          <div className="p-3 overflow-auto max-h-96">
                            <pre className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
                              {jsonCache || 'Processando...'}
                            </pre>
                          </div>
                        </div>
                      )}

                      {viewMode === 'table' && (
                        <div className="mt-2 bg-gray-50 dark:bg-gray-900 rounded-md overflow-auto max-h-96">
                          {(() => {
                          // DEBUG: Log da estrutura recebida
                            console.log('🔍 DEBUG result.data:', result.data)
                            console.log('🔍 DEBUG streamData:', streamData)

                            // Priorizar dados do streaming se disponível
                            let data = []

                            // Tratamento especial para endpoint de indicadores
                            if (endpoint.path.includes('/indicadores/stats') && result.data?.data) {
                              const indicadoresData = result.data.data
                              
                              // Renderizar visualização especial para indicadores
                              return (
                                <div className="space-y-4 p-4">
                                  {/* Indicadores Gerais */}
                                  {indicadoresData.geral && (
                                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                                      <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-gray-100">📊 Indicadores Gerais</h3>
                                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                        {Object.entries(indicadoresData.geral).map(([key, value]) => (
                                          <div key={key} className="bg-gray-50 dark:bg-gray-700 p-3 rounded">
                                            <div className="text-xs text-gray-500 dark:text-gray-400">{key}</div>
                                            <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                              {typeof value === 'number' ? 
                                                (key.includes('percentual') ? `${value.toFixed(2)}%` : 
                                                 key.includes('ticket') || key.includes('valor') ? `R$ ${value.toLocaleString('pt-BR', {minimumFractionDigits: 2})}` : 
                                                 value.toLocaleString('pt-BR')) : 
                                                String(value)
                                              }
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {/* Detalhes por Agrupamento */}
                                  {indicadoresData.detalhes && indicadoresData.detalhes.length > 0 && (
                                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                                      <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-gray-100">📋 Detalhes por {queryParams.agruparPor || 'Item'}</h3>
                                      <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                          <thead className="bg-gray-50 dark:bg-gray-700">
                                            <tr>
                                              {Object.keys(indicadoresData.detalhes[0]).map(key => (
                                                <th key={key} className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                                                  {key}
                                                </th>
                                              ))}
                                            </tr>
                                          </thead>
                                          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                            {indicadoresData.detalhes.map((item, idx) => (
                                              <tr key={idx}>
                                                {Object.entries(item).map(([key, value]) => (
                                                  <td key={key} className="px-3 py-2 text-sm text-gray-900 dark:text-gray-100">
                                                    {typeof value === 'number' ? 
                                                      (key.includes('percentual') ? `${value.toFixed(2)}%` : 
                                                       key.includes('ticket') || key.includes('valor') ? `R$ ${value.toLocaleString('pt-BR', {minimumFractionDigits: 2})}` : 
                                                       value.toLocaleString('pt-BR')) : 
                                                      String(value)
                                                    }
                                                  </td>
                                                ))}
                                              </tr>
                                            ))}
                                          </tbody>
                                        </table>
                                      </div>
                                    </div>
                                  )}

                                  {/* Quebra Mensal */}
                                  {indicadoresData.quebraMensal && indicadoresData.quebraMensal.length > 0 && (
                                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                                      <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-gray-100">📅 Quebra por Mês</h3>
                                      <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                          <thead className="bg-gray-50 dark:bg-gray-700">
                                            <tr>
                                              {Object.keys(indicadoresData.quebraMensal[0]).map(key => (
                                                <th key={key} className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                                                  {key}
                                                </th>
                                              ))}
                                            </tr>
                                          </thead>
                                          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                            {indicadoresData.quebraMensal.map((item, idx) => (
                                              <tr key={idx}>
                                                {Object.entries(item).map(([key, value]) => (
                                                  <td key={key} className="px-3 py-2 text-sm text-gray-900 dark:text-gray-100">
                                                    {typeof value === 'number' ? 
                                                      (key.includes('percentual') ? `${value.toFixed(2)}%` : 
                                                       key.includes('ticket') || key.includes('valor') ? `R$ ${value.toLocaleString('pt-BR', {minimumFractionDigits: 2})}` : 
                                                       value.toLocaleString('pt-BR')) : 
                                                      String(value)
                                                    }
                                                  </td>
                                                ))}
                                              </tr>
                                            ))}
                                          </tbody>
                                        </table>
                                      </div>
                                    </div>
                                  )}

                                  {/* Período */}
                                  {indicadoresData.periodo && (
                                    <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded text-sm">
                                      <span className="text-gray-600 dark:text-gray-400">Período: </span>
                                      <span className="font-medium text-gray-900 dark:text-gray-100">
                                        {indicadoresData.periodo.dataInicial} até {indicadoresData.periodo.dataFinal}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              )
                            }

                            if (streamData.length > 0) {
                            // Dados do streaming em tempo real
                              data = streamData
                              console.log('📊 Usando dados do streaming:', data.length, 'registros')
                            } else if (result.data?.data?.data && Array.isArray(result.data.data.data)) {
                            // Estrutura: {success: true, data: {success: true, data: [...]}}
                              data = result.data.data.data
                              console.log('📊 Usando result.data.data.data:', data.length, 'registros')
                            } else if (result.data?.data && Array.isArray(result.data.data)) {
                            // Estrutura: {success: true, data: [...]}
                              data = result.data.data
                              console.log('📊 Usando result.data.data:', data.length, 'registros')
                            } else if (Array.isArray(result.data)) {
                            // Estrutura: [...] (array direto)
                              data = result.data
                              console.log('📊 Usando result.data como array:', data.length, 'registros')
                            } else if (result.data && typeof result.data === 'object') {
                            // Estrutura: {objeto único}
                              data = [result.data]
                              console.log('📊 Usando result.data como objeto único')
                            }

                            console.log('📊 Dados finais para tabela:', data)

                            if (!data || data.length === 0) {
                              return (
                                <div className="p-4 text-center text-gray-500">
                                  <div className="mb-2">📊 Nenhum registro encontrado</div>
                                  {result.data?.total !== undefined && (
                                    <div className="text-xs space-y-1">
                                      <div>
                                      📊 <strong>{result.data.total?.toLocaleString() || 0} registros</strong> |
                                      ⏱️ <strong>{result.data.executionTime || 'N/A'}</strong> |
                                        {result.data.success ? '✅ Sucesso' : '❌ Erro'}
                                      </div>
                                      {result.data.total && result.data.executionTime && (
                                        <div className="text-blue-600 dark:text-blue-400">
                                        🚀 Performance: {Math.round(result.data.total / parseFloat(result.data.executionTime.replace('s', '')))} registros/seg
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              )
                            }

                            const firstItem = data[0]
                            const columns = Object.keys(firstItem || {})

                            return (
                              <div>
                                {/* Resumo dos dados */}
                                {(streamData.length > 0 || result.data?.total !== undefined) && (
                                  <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded border-l-4 border-blue-400">
                                    <div className="flex items-center justify-between text-sm">
                                      <div className="flex items-center gap-4">
                                        <span className="font-medium text-blue-900 dark:text-blue-100">
                                        📊 {streamData.length || result.data?.total || data.length} registros encontrados
                                          {streamProgress.isStreaming && ' (carregando...)'}
                                        </span>
                                        <span className="text-blue-700 dark:text-blue-300">
                                        ⏱️ {streamProgress.isStreaming ? 'Em andamento' : (result.data?.executionTime || 'N/A')}
                                        </span>
                                        <span className="text-blue-700 dark:text-blue-300">
                                          {streamProgress.isStreaming ? '🔄 Carregando' : (result.data?.success ? '✅ Sucesso' : '❌ Erro')}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                )}

                                <div className="relative">
                                  {/* Contêiner com scroll e header fixo */}
                                  <div className="overflow-auto max-h-96 border border-gray-200 dark:border-gray-700 rounded-md">
                                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                      <thead className="bg-gray-100 dark:bg-gray-800 sticky top-0 z-10">
                                        <tr>
                                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider border-r border-gray-300 dark:border-gray-600">
                                          #
                                          </th>
                                          {columns.map((col) => (
                                            <th key={col} className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider border-r border-gray-300 dark:border-gray-600 min-w-[120px]">
                                              {col}
                                            </th>
                                          ))}
                                        </tr>
                                      </thead>
                                      <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                                        {data.slice(0, 100).map((item: any, index: number) => (
                                          <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                                            <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500 dark:text-gray-400 border-r border-gray-200 dark:border-gray-700 font-mono">
                                              {index + 1}
                                            </td>
                                            {columns.map((col) => (
                                              <td key={col} className="px-3 py-2 text-xs text-gray-900 dark:text-gray-100 border-r border-gray-200 dark:border-gray-700 min-w-[120px]">
                                                <div className="max-w-48 truncate" title={String(item[col] || '')}>
                                                  {typeof item[col] === 'object' && item[col] !== null
                                                    ? JSON.stringify(item[col])
                                                    : String(item[col] || '')
                                                  }
                                                </div>
                                              </td>
                                            ))}
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>

                                  {/* Footer com estatísticas */}
                                  <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-800 rounded text-center">
                                    <div className="text-xs text-gray-600 dark:text-gray-400 flex items-center justify-between">
                                      <span>Mostrando {Math.min(100, data.length)} de {data.length} registros</span>
                                      <span>{columns.length} colunas</span>
                                      {data.length > 100 && (
                                        <button
                                          onClick={openAnalysisViewer}
                                          className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                                        >
                                        👁️ Ver todos em Análise
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )
                          })()}
                        </div>
                      )}

                      {viewMode === 'sql' && (
                        <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-900 rounded-md overflow-auto max-h-96">
                          <div className="text-sm">
                            {/* Verificação de contexto quando tem usuário API */}
                            {selectedApiUser && result && (
                              <div className="mb-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded">
                                <p className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">⚠️ Verificação de Contexto:</p>
                                <div className="space-y-1 text-xs">
                                  <p className="text-yellow-700 dark:text-yellow-300">
                                    • Usuário API: <strong>{selectedApiUser.name}</strong> (Base {selectedApiUser.baseId} - {selectedApiUser.baseName || 'Base ' + selectedApiUser.baseId})
                                  </p>
                                  <p className="text-yellow-700 dark:text-yellow-300">
                                    • Credenciais: API Key = {selectedApiUser.api_key}
                                  </p>
                                  <p className="text-yellow-700 dark:text-yellow-300">
                                    • Esperado: WHERE ID_BASE = {selectedApiUser.baseId}
                                  </p>
                                </div>
                              </div>
                            )}
                            <div className="mb-3">
                              <span className="font-medium text-gray-700 dark:text-gray-300">SQL Query Executada:</span>
                              <div className="mt-1 p-2 bg-gray-800 text-green-400 rounded text-xs font-mono">
                                {(() => {
                                // DEBUG: Log da estrutura completa para diagnosticar
                                  console.log('🔍 [SQL DEBUG] Estrutura completa do result:', result)
                                  console.log('🔍 [SQL DEBUG] result.sql_executed:', result?.sql_executed)
                                  console.log('🔍 [SQL DEBUG] result.data?.sql_executed:', result?.data?.sql_executed)

                                  // Buscar SQL real nos possíveis locais
                                  // Com base na sua resposta, deve estar em result.data.sql_executed
                                  const sqlExecuted = result?.data?.sql_executed ||
                                                   result?.sql_executed ||
                                                   result?.query ||
                                                   result?.data?.query ||
                                                   result?.data?.data?.sql_executed

                                  if (sqlExecuted) {
                                    console.log('✅ [SQL DEBUG] SQL encontrado:', sqlExecuted.substring(0, 100) + '...')
                                    
                                    // Analisar qual base está sendo usada no SQL
                                    const baseMatch = sqlExecuted.match(/ID_BASE\s*=\s*(\d+)/i)
                                    if (baseMatch && selectedApiUser) {
                                      const usedBase = parseInt(baseMatch[1])
                                      const expectedBase = selectedApiUser.baseId
                                      
                                      if (usedBase !== expectedBase) {
                                        // Adicionar aviso visual no SQL
                                        return `-- ❌ ERRO DE CONTEXTO DETECTADO!
-- Backend está usando base ${usedBase} mas deveria usar base ${expectedBase} (${selectedApiUser.name})
-- Isso indica que o backend não está respeitando as credenciais API

${sqlExecuted}`
                                      }
                                    }
                                    
                                    return sqlExecuted
                                  }

                                  // DEBUG: Mostrar estrutura para ajudar no diagnóstico
                                  console.log('❌ [SQL DEBUG] SQL não encontrado! Chaves disponíveis:', Object.keys(result || {}))
                                  if (result?.data) {
                                    console.log('❌ [SQL DEBUG] Chaves em result.data:', Object.keys(result.data || {}))
                                  }

                                  // Se não há SQL real, avisar claramente
                                  return `-- ⚠️ SQL REAL NÃO DISPONÍVEL
-- O backend não retornou o campo 'sql_executed'
-- DEBUG: Verifique o console para ver a estrutura da resposta
-- Execute o teste novamente para tentar capturar o SQL real`
                                })()}
                              </div>
                            </div>

                            <div>
                              <span className="font-medium text-gray-700 dark:text-gray-300">Análise dos Dados:</span>
                              <div className="mt-1 space-y-1 text-xs">
                                {(() => {
                                  const data = Array.isArray(result.data) ? result.data :
                                    result.data?.data && Array.isArray(result.data.data) ? result.data.data :
                                      [result.data]
                                  return (
                                    <>
                                      <div className="text-blue-600 dark:text-blue-400">
                                      📊 Total de registros: {data?.length || 0}
                                      </div>
                                      {data && data.length > 0 && (
                                        <div className="text-green-600 dark:text-green-400">
                                        📋 Campos retornados: {Object.keys(data[0] || {}).length}
                                        </div>
                                      )}
                                      <div className="text-purple-600 dark:text-purple-400">
                                      🔍 Endpoint: {endpoint.method} {endpoint.path}
                                      </div>
                                      <div className="text-orange-600 dark:text-orange-400">
                                      ⏱️ Timestamp: {result.timestamp}
                                      </div>
                                    </>
                                  )
                                })()}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                  </div>
                ) : isLoading ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-center">
                      <LoadingSpinner size="sm" />
                      <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">Executando teste...</span>
                    </div>

                    {/* Logs em tempo real durante loading */}
                    {logs.length > 0 && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">📋 Log da Execução ({logs.length} entradas):</span>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(logs.join('\n'))
                                toast.success('Logs copiados para clipboard!')
                              }}
                              className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                            >
                            📋 Copiar
                            </button>
                            <button
                              onClick={() => setLogs([])}
                              className="text-xs text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
                            >
                            🗑️ Limpar
                            </button>
                          </div>
                        </div>
                        <div className="mt-2 p-4 bg-gray-900 dark:bg-gray-950 rounded-md overflow-auto max-h-64 text-sm border">
                          {logs.map((log, index) => {
                          // Detectar tipo de log baseado nos ícones
                            let textColor = 'text-gray-300'
                            let bgColor = ''
                            let borderColor = ''

                            if (log.includes('❌')) {
                              textColor = 'text-red-300'
                              bgColor = 'bg-red-900/20'
                              borderColor = 'border-l-red-500'
                            } else if (log.includes('⚠️')) {
                              textColor = 'text-yellow-300'
                              bgColor = 'bg-yellow-900/20'
                              borderColor = 'border-l-yellow-500'
                            } else if (log.includes('⚡')) {
                              textColor = 'text-blue-300'
                              bgColor = 'bg-blue-900/20'
                              borderColor = 'border-l-blue-500'
                            } else if (log.includes('✅')) {
                              textColor = 'text-green-300'
                              bgColor = 'bg-green-900/20'
                              borderColor = 'border-l-green-500'
                            } else if (log.includes('📋')) {
                              textColor = 'text-purple-300'
                              bgColor = 'bg-purple-900/20'
                              borderColor = 'border-l-purple-500'
                            }

                            return (
                              <div key={index} className={`${textColor} ${bgColor} ${borderColor} font-mono text-xs leading-relaxed p-2 mb-1 border-l-2 rounded-r animate-in slide-in-from-left duration-200`}>
                                {log}
                              </div>
                            )
                          })}
                          <div className="text-yellow-400 font-mono animate-pulse leading-relaxed mb-1">
                          ⚡ [Executando...]
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-48 text-gray-500 dark:text-gray-400">
                    <div className="text-center">
                      <DocumentTextIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Execute o teste para ver o resultado</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>

      {/* Visualizador de Análise de Dados */}
      {showAnalysisViewer && (
        <DataAnalysisViewer
          data={getAnalysisData()}
          title={`${endpoint.method} ${endpoint.path} - Análise de Dados`}
          onClose={() => setShowAnalysisViewer(false)}
          onExport={(format) => {
            if (format === 'xlsx') {
              exportAsXLSX()
            } else if (format === 'csv') {
              exportAsExcel()
            } else if (format === 'json') {
              exportAsJSON()
            }
          }}
        />
      )}
    </>
  )
}