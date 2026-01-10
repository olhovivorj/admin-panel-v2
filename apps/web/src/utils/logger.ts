import api from '@/services/api'

type LogLevel = 'info' | 'warn' | 'error' | 'debug'
type LogContext = 'PANEL' | 'AUTH' | 'API' | 'USER' | 'BASE' | 'CONFIG' | 'FORM' | 'ERROR' | 'API_FORM' | 'EMPRESA' | string

interface LogEntry {
  id: string
  level: LogLevel
  message: string
  context: LogContext
  timestamp: string
  metadata?: any
}

class PanelLogger {
  private queue: LogEntry[] = []
  private localLogs: LogEntry[] = []
  private isProcessing = false
  private batchSize = 10
  private flushInterval = 30000 // 30 segundos
  private maxLocalLogs = 1000 // Máximo de logs locais

  constructor() {
    // Carregar logs salvos
    this.loadLocalLogs()

    // Iniciar flush automático
    setInterval(() => this.flush(), this.flushInterval)

    // Enviar logs ao fechar a página
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => this.flush())
    }
  }

  private async sendToServer(logs: LogEntry[]) {
    // Só enviar em produção para não interferir no desenvolvimento
    if (import.meta.env.PROD) {
      try {
        await api.post('/logger/batch', { logs })
      } catch (error: any) {
        // Ignorar erros de abort (quando usuário navega para outra página)
        if (error.code === 'ECONNABORTED' || error.message === 'Request aborted') {
          return
        }
        console.error('Erro ao enviar logs:', error)
      }
    }
  }

  private async flush() {
    // Não enviar se não houver logs na fila
    if (this.queue.length === 0 || this.isProcessing) {
      return
    }

    this.isProcessing = true
    const logsToSend = this.queue.splice(0, this.batchSize)

    try {
      await this.sendToServer(logsToSend)
    } finally {
      this.isProcessing = false
    }
  }

  private log(level: LogLevel, message: string, context: LogContext, metadata?: any) {
    // Garantir que message seja sempre uma string
    const safeMessage = typeof message === 'string' ? message : JSON.stringify(message)

    const entry: LogEntry = {
      id: crypto.randomUUID(),
      level,
      message: safeMessage,
      context,
      timestamp: new Date().toISOString(),
      metadata: {
        ...metadata,
        userAgent: navigator.userAgent,
        url: window.location.href,
      },
    }

    // Log no console formatado (desenvolvimento) ou estruturado (produção)
    if (import.meta.env.DEV) {
      const colors = {
        info: '#2563eb',
        warn: '#d97706',
        error: '#dc2626',
        debug: '#7c3aed',
      }
      const time = new Date().toLocaleTimeString('pt-BR', { hour12: false })
      console.log(
        `%c[${time}] ${level.toUpperCase()} [${context}]`,
        `color: ${colors[level] || '#666'}; font-weight: bold`,
        safeMessage,
        metadata,
      )
    } else {
      const consoleMethod = level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'log'
      console[consoleMethod](`[${context}] ${safeMessage}`, metadata)
    }

    // Adicionar à fila e logs locais
    this.queue.push(entry)
    this.addToLocalLogs(entry)

    // Flush imediato para erros
    if (level === 'error') {
      this.flush()
    }
  }

  info(message: string, context: LogContext = 'PANEL', metadata?: any) {
    this.log('info', message, context, metadata)
  }

  warn(message: string, context: LogContext = 'PANEL', metadata?: any) {
    this.log('warn', message, context, metadata)
  }

  error(message: string, context: LogContext = 'PANEL', metadata?: any) {
    this.log('error', message, context, metadata)
  }

  debug(message: string, context: LogContext = 'PANEL', metadata?: any) {
    if (import.meta.env.DEV) {
      this.log('debug', message, context, metadata)
    }
  }

  // Métodos específicos para operações comuns
  logAuth(action: 'login' | 'logout' | 'refresh', email?: string, success: boolean = true) {
    const message = `${action} ${success ? 'realizado' : 'falhou'} - ${email || 'usuário desconhecido'}`
    this[success ? 'info' : 'error'](message, 'AUTH', { action, email, success })
  }

  logApiCall(method: string, url: string, status?: number, duration?: number) {
    const message = `${method} ${url} - ${status || 'pending'} ${duration ? `(${duration}ms)` : ''}`
    this.info(message, 'API', { method, url, status, duration })
  }

  logUserAction(action: string, details?: any) {
    this.info(`Ação do usuário: ${action}`, 'USER', details)
  }

  logBaseChange(oldBase?: number, newBase?: number) {
    this.info(`Base alterada: ${oldBase || 'nenhuma'} → ${newBase || 'nenhuma'}`, 'BASE', {
      oldBase,
      newBase,
    })
  }

  logConfigChange(key: string, oldValue?: any, newValue?: any) {
    this.info(`Configuração alterada: ${key}`, 'CONFIG', { key, oldValue, newValue })
  }

  // Métodos para gerenciar logs locais
  private addToLocalLogs(entry: LogEntry) {
    this.localLogs.unshift(entry) // Adicionar no início

    // Limitar tamanho
    if (this.localLogs.length > this.maxLocalLogs) {
      this.localLogs = this.localLogs.slice(0, this.maxLocalLogs)
    }

    // Salvar no localStorage (apenas últimos 100)
    try {
      const logsToSave = this.localLogs.slice(0, 100)
      localStorage.setItem('panel-logs', JSON.stringify(logsToSave))
    } catch (error) {
      // Se o localStorage estiver cheio, limpar logs antigos
      localStorage.removeItem('panel-logs')
    }
  }

  // Carregar logs do localStorage na inicialização
  private loadLocalLogs() {
    try {
      const saved = localStorage.getItem('panel-logs')
      if (saved) {
        this.localLogs = JSON.parse(saved)
      }
    } catch (error) {
      this.localLogs = []
    }
  }

  // Métodos públicos para o visor de logs
  getLogs(filters?: {
    level?: LogLevel[]
    context?: LogContext[]
    search?: string
    limit?: number
  }): LogEntry[] {
    let filtered = [...this.localLogs]

    if (filters?.level && filters.level.length > 0) {
      filtered = filtered.filter(log => filters.level!.includes(log.level))
    }

    if (filters?.context && filters.context.length > 0) {
      filtered = filtered.filter(log => filters.context!.includes(log.context))
    }

    if (filters?.search) {
      const search = filters.search.toLowerCase()
      filtered = filtered.filter(log =>
        log.message.toLowerCase().includes(search) ||
        log.context.toLowerCase().includes(search) ||
        JSON.stringify(log.metadata).toLowerCase().includes(search),
      )
    }

    if (filters?.limit) {
      filtered = filtered.slice(0, filters.limit)
    }

    return filtered
  }

  clearLogs() {
    this.localLogs = []
    localStorage.removeItem('panel-logs')
  }

  exportLogs(): string {
    return JSON.stringify(this.localLogs, null, 2)
  }
}

// Singleton
export const logger = new PanelLogger()

// Nota: Os interceptors do axios estão configurados em services/api.ts
// para evitar conflitos e duplicação de handlers