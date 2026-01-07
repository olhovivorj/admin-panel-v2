import api from './api'
import { Base } from '@/types'
import { logger } from '@/utils/logger'

export interface BaseWithStats extends Base {
  ID_BASE?: number // Compatibilidade com backend
  ativo?: boolean
  lastActivity?: string
  isActive?: boolean
  // Configurações Firebird
  firebird_host?: string
  firebird_port?: number
  firebird_database?: string
  firebird_user?: string
  firebird_role?: string
  firebird_charset?: string
  firebird_active?: boolean
  firebird_status?: 'CONFIGURED' | 'PENDING_CONFIG'
  passwordConfigured?: boolean
}

export interface FirebirdConfig {
  host?: string
  port?: number
  database?: string
  user?: string
  password?: string
  role?: string
  charset?: string
  active?: boolean
}

export const basesService = {
  // Buscar empresas de uma base específica
  async getEmpresas(baseId: number) {
    try {
      logger.info(`Buscando empresas da base ${baseId}`, 'EMPRESA')
      const response = await api.get(`/empresas/${baseId}`)

      if (!response.data.success) {
        logger.error(`Erro ao buscar empresas da base ${baseId}`, 'EMPRESA', {
          error: response.data.error,
          fullResponse: response.data,
        })
        throw new Error(`${response.data.error?.code || 'UNKNOWN'}: ${response.data.error?.message || 'Erro desconhecido'}`)
      }

      logger.info(`Empresas da base ${baseId} carregadas: ${response.data.data?.length || 0} empresas`, 'EMPRESA')
      return response.data.data || []
    } catch (error: any) {
      logger.error(`Erro ao buscar empresas da base ${baseId}`, 'EMPRESA', { error: error.message })
      throw error
    }
  },

  // Listar bases simples (sem estatísticas) - carregamento rápido
  async getBasesSimples() {
    try {
      logger.info('Iniciando busca de bases simples', 'BASE')
      const response = await api.get('/bases/simples/list')

      if (!response.data.success) {
        logger.error('Erro ao buscar bases simples', 'BASE', {
          error: response.data.error,
          fullResponse: response.data,
        })
        throw new Error(`${response.data.error?.code || 'UNKNOWN'}: ${response.data.error?.message || 'Erro desconhecido'}`)
      }

      // Transformar ID_BASE para baseId para compatibilidade com frontend
      const basesTransformadas = response.data.data?.map((base: any) => ({
        ...base,
        baseId: base.ID_BASE,
      })) || []

      logger.info(`Bases simples carregadas: ${basesTransformadas.length} bases`, 'BASE')
      return basesTransformadas
    } catch (error: any) {
      logger.error('Erro ao buscar bases simples', 'BASE', { error: error.message })
      throw error
    }
  },

  // Listar todas as bases disponíveis (com estatísticas)
  // Timeout de 10 segundos para evitar loops infinitos
  async getBases() {
    const timeout = 10000 // 10 segundos
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    try {
      logger.info('Iniciando busca de bases completas', 'BASE')

      const response = await api.get('/bases', {
        signal: controller.signal,
        timeout: timeout,
      })

      clearTimeout(timeoutId)

      if (!response.data.success) {
        logger.error('Erro ao buscar bases', 'BASE', {
          error: response.data.error,
          fullResponse: response.data,
        })
        throw new Error(`${response.data.error?.code || 'UNKNOWN'}: ${response.data.error?.message || 'Erro desconhecido'}`)
      }

      // Transformar ID_BASE para baseId para compatibilidade com frontend
      const basesTransformadas = response.data.data?.map((base: any) => ({
        ...base,
        baseId: base.ID_BASE,
      })) || []

      logger.info(`Bases completas carregadas: ${basesTransformadas.length} bases`, 'BASE')
      return basesTransformadas
    } catch (error: any) {
      clearTimeout(timeoutId)

      // Detectar timeout
      if (error.name === 'CanceledError' || error.code === 'ECONNABORTED') {
        const timeoutError = new Error('⏱️ Timeout: Servidor demorou mais de 10 segundos para responder. Tente novamente.')
        logger.error('Timeout ao buscar bases', 'BASE', { timeout: `${timeout}ms` })
        throw timeoutError
      }

      logger.error('Erro inesperado ao buscar bases', 'BASE', {
        error: error.message,
        code: error.code,
        stack: error.stack
      })
      throw error
    }
  },

  // Buscar base por ID
  async getBase(id: number) {
    const response = await api.get<BaseWithStats>(`/bases/${id}`)
    return response.data
  },

  // Buscar base por código BASE
  async getBaseByCode(baseCode: string) {
    const bases = await this.getBases()
    const foundBase = bases.find(base => base.BASE === baseCode)

    // Garantir que baseId está presente
    if (foundBase && !foundBase.baseId && foundBase.ID_BASE) {
      foundBase.baseId = foundBase.ID_BASE
    }

    return foundBase
  },

  // Estatísticas da base
  async getBaseStats(id: number) {
    const response = await api.get(`/bases/${id}/stats`)
    return response.data
  },

  // OPERAÇÕES FIREBIRD

  // Listar bases com Firebird ativo
  async getBasesWithFirebird() {
    const response = await api.get('/bases/firebird/ativas')

    if (!response.data.success) {
      throw new Error(`${response.data.error.code}: ${response.data.error.message}`)
    }

    return response.data.data
  },

  // Buscar configuração Firebird de uma base
  async getFirebirdConfig(id: number) {
    const response = await api.get(`/bases/${id}/firebird`)

    if (!response.data.success) {
      throw new Error(`${response.data.error.code}: ${response.data.error.message}`)
    }

    return response.data.data
  },

  // Atualizar configuração Firebird
  async updateFirebirdConfig(id: number, config: FirebirdConfig) {
    const response = await api.put(`/bases/${id}/firebird-config`, config)

    if (!response.data.success) {
      throw new Error(`${response.data.error.code}: ${response.data.error.message}`)
    }

    return response.data.data
  },

  // Validar conexão Firebird (teste de conectividade)
  async testFirebirdConnection(id: number) {
    const response = await api.post(`/bases/${id}/firebird/test`)

    if (!response.data.success) {
      throw new Error(`${response.data.error.code}: ${response.data.error.message}`)
    }

    return response.data.data
  },

  // Listar lojas de uma base
  async getLojasDaBase(id: number) {
    const response = await api.get(`/bases/${id}/lojas`)

    if (!response.data.success) {
      throw new Error(`${response.data.error.code}: ${response.data.error.message}`)
    }

    return response.data.data
  },
}