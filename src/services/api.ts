import axios, { AxiosError } from 'axios'
import toast from 'react-hot-toast'
import { logger } from '@/utils/logger'

// Auditoria de segurança conforme contrato técnico
const auditLogger = {
  logApiAccess: (method: string, url: string, baseId?: number, status?: number) => {
    logger.info('[AUDIT] API access', {
      method,
      url,
      baseId,
      status,
      timestamp: new Date().toISOString(),
      type: 'API_ACCESS',
    }, 'API')
  },
}

// Função para obter a URL base do ambiente selecionado
function getBaseURL() {
  const savedUrl = localStorage.getItem('@ari:apiUrl')
  const savedEnv = localStorage.getItem('@ari:environment')
  
  if (savedUrl) {
    return `${savedUrl}/api`
  }
  
  // Fallback baseado no ambiente salvo
  if (savedEnv === 'production') {
    return 'https://ierp.invistto.com/api'
  }
  
  // Default para local
  return 'http://localhost:3000/api'
}

export const api = axios.create({
  baseURL: getBaseURL(),
  timeout: 600000, // 10 minutos para volumes muito grandes (120k+ registros)
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor para adicionar token e baseId
api.interceptors.request.use(
  (config) => {
    // Marcar timestamp da requisição
    config.metadata = { startTime: Date.now() }

    // Verificar se já tem credenciais API (X-API-Key e X-API-Secret)
    const hasApiCredentials = config.headers['X-API-Key'] && config.headers['X-API-Secret']
    
    // Token de autenticação - NÃO adicionar se tem credenciais API
    if (!hasApiCredentials) {
      const token = localStorage.getItem('@ari:token')
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
        console.log('🔐 [API] Token presente no request:', token.substring(0, 20) + '...')
      } else {
        console.warn('⚠️ [API] Nenhum token encontrado no localStorage')
      }
    } else {
      console.log('🔑 [API] Usando credenciais API (X-API-Key/Secret), ignorando JWT')
    }

    // Base selecionada - estratégia diferente para admin vs usuário normal
    // IMPORTANTE: Se tem credenciais API, não mexer no baseId (já vem do contexto do usuário API)
    if (!hasApiCredentials) {
      const selectedBaseId = localStorage.getItem('@ari:selectedBaseId')
      const selectedBaseCode = localStorage.getItem('@ari:selectedBase')
      const userString = localStorage.getItem('@ari:user')
      let isAdmin = false
      let userBaseId = null

      // Verificar se é admin
      if (userString) {
        try {
          const user = JSON.parse(userString)
          isAdmin = user?.isMaster || user?.email === 'admin@invistto.com.br'
          userBaseId = user?.baseId
        } catch (e) {
          // Ignorar erro de parse
        }
      }

      if (selectedBaseId && selectedBaseId !== 'null') {
        if (isAdmin && selectedBaseId !== userBaseId?.toString()) {
          // Admin selecionou base diferente da sua - usar header especial
          config.headers['X-Admin-Base-Override'] = selectedBaseId
          logger.info('Admin override: base diferente via header', 'API', {
            userBaseId,
            selectedBaseId,
            headerValue: selectedBaseId,
          })
        } else {
          // Usuário normal ou admin na sua própria base - não enviar baseId (vem do JWT)
          logger.info('Base será obtida do JWT token', 'API', {
            isAdmin,
            selectedBaseId,
            userBaseId,
          })
        }
      } else {
        logger.warn('Nenhuma base selecionada no localStorage', 'API')
      }
    } else {
      // Com credenciais API, o baseId vem do próprio usuário API
      logger.info('Usando contexto do usuário API, baseId será determinado pelo backend', 'API')
    }

    // Auditoria obrigatória (conformidade contrato)
    const baseId = config.params?.baseId
    auditLogger.logApiAccess(config.method?.toUpperCase() || 'GET', config.url || '', baseId)

    // Log estruturado da requisição (desenvolvimento)
    if (import.meta.env.DEV) {
      logger.info('API Request', 'API', { method: config.method?.toUpperCase(), url: config.url })
      console.log('📋 [API Headers]', config.headers)
      
      // Log especial para credenciais API
      if (config.headers['X-API-Key']) {
        console.log('🔑 [API Auth] Usando credenciais API:')
        console.log('  - X-API-Key:', config.headers['X-API-Key'])
        console.log('  - X-API-Secret:', config.headers['X-API-Secret']?.substring(0, 10) + '...')
        console.log('  - Authorization:', config.headers['Authorization'] ? 'JWT presente (NÃO deveria!)' : 'Sem JWT (correto)')
      }
      
      if (config.data !== undefined) {
        console.log('📦 [API Data]', config.data)
      }
      if (config.params !== undefined) {
        console.log('🔍 [API Params]', config.params)
      }
    }

    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

// Função para detectar se o erro é de backend não disponível
function isBackendUnavailableError(error: AxiosError): boolean {
  // Erro de rede (NETWORK_ERROR)
  if (error.code === 'ERR_NETWORK' || error.code === 'NETWORK_ERROR') {
    return true
  }

  // Timeout na conexão (ECONNABORTED)
  if (error.code === 'ECONNABORTED' && error.message.includes('timeout')) {
    return true
  }

  // Connection refused (backend não rodando)
  if (error.code === 'ECONNREFUSED') {
    return true
  }

  // Axios específico: Failed to fetch
  if (error.message?.includes('fetch') || error.message?.includes('Network Error')) {
    return true
  }

  // Status 0 ou ausência de response (indica backend não acessível)
  if (!error.response && error.request) {
    return true
  }

  // 502 Bad Gateway / 503 Service Unavailable / 504 Gateway Timeout
  if ([502, 503, 504].includes(error.response?.status || 0)) {
    return true
  }

  return false
}

// Response interceptor para tratar erros globalmente
api.interceptors.response.use(
  (response) => {
    // Auditoria obrigatória (conformidade contrato)
    const baseId = response.config.params?.baseId
    auditLogger.logApiAccess(
      response.config.method?.toUpperCase() || 'GET',
      response.config.url || '',
      baseId,
      response.status,
    )

    // Log estruturado da resposta (desenvolvimento)
    if (import.meta.env.DEV) {
      console.log('✅ [API Response]', response.config.method?.toUpperCase(), response.config.url)
      console.log('📊 [API Response Data]', response.data)
    }
    return response
  },
  (error: AxiosError) => {
    // Log detalhado do erro
    console.error('Axios error:', {
      message: error.message,
      code: error.code,
      config: error.config,
      response: error.response,
    })

    // Backend não disponível (detecção prioritária)
    if (isBackendUnavailableError(error)) {
      const message = 'Backend ari-nest não está disponível. Verifique se o serviço está rodando.'
      toast.error(message, {
        duration: 5000,
        id: 'backend-unavailable', // Evita toasts duplicados
      })
      console.error('🔴 [API] Backend não disponível:', error.message)
      return Promise.reject(error)
    }

    // Token expirado ou inválido
    if (error.response?.status === 401) {
      // Log detalhado para debug
      console.error('🔴 [API] 401 Unauthorized:', {
        url: error.config?.url,
        method: error.config?.method,
        headers: error.config?.headers,
        response: error.response?.data,
        hasToken: !!localStorage.getItem('@ari:token'),
      })

      // SEGURANÇA: Limpar apenas dados de autenticação, preservar cache de bases
      localStorage.removeItem('@ari:token')
      localStorage.removeItem('@ari:user')
      localStorage.removeItem('@ari:refreshToken')
      sessionStorage.clear()

      // Mensagem simples, não objeto
      const errorMessage = typeof error.response?.data?.message === 'string'
        ? error.response.data.message
        : 'Sessão expirada. Faça login novamente.'

      toast.error(errorMessage)

      // Forçar redirecionamento para login
      setTimeout(() => {
        window.location.href = '/login'
      }, 100)

      return Promise.reject(error)
    }

    // Erro de servidor (500, 502, 503, 504 já tratados acima)
    if (error.response?.status === 500) {
      toast.error('Erro interno do servidor. Tente novamente.')
    }

    // Base não selecionada
    if (error.response?.status === 400 && typeof error.response?.data?.message === 'string' && error.response?.data?.message?.includes('base')) {
      toast.error('Selecione uma base para continuar.')
    }

    // Outros erros de rede não classificados
    if (!error.response && error.request && !isBackendUnavailableError(error)) {
      toast.error('Erro de rede. Verifique sua conexão com a internet.')
    }

    return Promise.reject(error)
  },
)

export default api