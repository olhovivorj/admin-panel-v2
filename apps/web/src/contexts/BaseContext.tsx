import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { basesService, BaseWithStats } from '@/services/bases'
import { appConfig } from '@/config/app.config'
import toast from 'react-hot-toast'
import { useAuth } from './AuthContext'
import { logger } from '@/utils/logger'
import { isAdmin as checkIsAdmin, canChangeBase as checkCanChangeBase } from '@/utils/roleHelpers'

interface BaseContextData {
  bases: BaseWithStats[]
  selectedBase: BaseWithStats | null
  selectedBaseCode: string | null
  selectedBaseId: number | null
  isLoading: boolean
  error: string | null
  selectBase: (baseCode: string) => void
  clearSelection: () => void
  refreshBases: () => void
  loadBasesOnFirstLogin: () => void
  isAdmin: boolean
  canSelectBase: boolean
  userBaseId: number | null
}

const BaseContext = createContext<BaseContextData>({} as BaseContextData)

export function BaseProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [selectedBaseCode, setSelectedBaseCode] = useState<string | null>(null)
  const [selectedBase, setSelectedBase] = useState<BaseWithStats | null>(null)
  const [selectedBaseId, setSelectedBaseId] = useState<number | null>(null)

  // Verificar permissões usando roleHelpers
  const isAdmin = checkIsAdmin(user)
  const canSelectBase = checkCanChangeBase(user)
  const userBaseId = user?.baseId || null

  // Debug do usuário
  useEffect(() => {
    if (user) {
      logger.debug('👤 [BaseContext] User loaded:', {
        email: user.email,
        baseId: user.baseId,
        isAdmin,
        canSelectBase,
        userBaseId,
      })
    }
  }, [user, isAdmin, canSelectBase, userBaseId])

  // Estado local para bases (evitar query desnecessária no F5)
  const [basesFromCache, setBasesFromCache] = useState<BaseWithStats[]>([])
  const [hasBasesInCache, setHasBasesInCache] = useState(false)

  // Carregar bases do cache imediatamente (ANTES de qualquer coisa)
  useEffect(() => {
    const cachedBases = localStorage.getItem('@ari:cachedBases')
    if (cachedBases) {
      try {
        const parsed = JSON.parse(cachedBases)
        setBasesFromCache(parsed)
        setHasBasesInCache(true)
        logger.info('⚡ [BaseContext] Bases carregadas do cache localStorage - ZERO latência', {
          basesCount: parsed.length,
          cacheSize: cachedBases.length,
        })
      } catch (error) {
        logger.warn('⚠️ [BaseContext] Cache de bases corrompido, removendo')
        localStorage.removeItem('@ari:cachedBases')
        setHasBasesInCache(false)
      }
    } else {
      logger.info('ℹ️ [BaseContext] Nenhum cache de bases encontrado - será carregado da API')
      setHasBasesInCache(false)
    }
  }, [])

  // Estados para controle manual
  const [isLoadingFromAPI, setIsLoadingFromAPI] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)

  // Função para carregar bases da API APENAS quando necessário
  const loadBasesFromAPI = async () => {
    if (hasBasesInCache) {
      logger.info('🚫 [BaseContext] Não carregando da API - cache já existe')
      return
    }

    setIsLoadingFromAPI(true)
    setApiError(null)

    try {
      logger.info('🌐 [BaseContext] Carregando bases SIMPLES da API (primeira vez) - SEM estatísticas')
      const data = await basesService.getBasesSimples()

      // Salvar no cache
      localStorage.setItem('@ari:cachedBases', JSON.stringify(data))
      setBasesFromCache(data)
      setHasBasesInCache(true)

      logger.info('✅ [BaseContext] Bases SIMPLES carregadas e salvas no cache:', data?.length, 'bases')
    } catch (error: any) {
      const errorMessage = error.message || 'Erro ao carregar bases'
      setApiError(errorMessage)
      logger.error('❌ [BaseContext] Erro ao carregar bases da API:', error)
    } finally {
      setIsLoadingFromAPI(false)
    }
  }

  // Carregar bases APENAS se user existe E não tem cache
  useEffect(() => {
    if (user && !hasBasesInCache && !isLoadingFromAPI) {
      logger.info('🔄 [BaseContext] User carregado, verificando necessidade de carregar bases')
      loadBasesFromAPI()
    }
  }, [user, hasBasesInCache, isLoadingFromAPI])

  // Função para refresh manual (limpa cache e recarrega)
  const refreshBases = async () => {
    logger.info('🔄 [BaseContext] Refresh manual solicitado - limpando cache')
    localStorage.removeItem('@ari:cachedBases')
    setHasBasesInCache(false)
    setBasesFromCache([])
    await loadBasesFromAPI()
  }

  // Usar sempre bases do cache (já carregadas ou vazias)
  const bases = basesFromCache
  const isLoading = isLoadingFromAPI && !hasBasesInCache
  const error = apiError

  // Carregar base imediatamente do localStorage para melhor UX
  useEffect(() => {
    // Carregar IMEDIATAMENTE, mesmo antes do user estar disponível
    const storedBaseCode = localStorage.getItem('@ari:selectedBase')
    const storedBaseName = localStorage.getItem('@ari:selectedBaseName')
    const storedBaseId = localStorage.getItem('@ari:selectedBaseId')

    if (storedBaseCode && storedBaseId) {
      // Criar objeto base temporário com dados do localStorage
      const tempBase = {
        BASE: storedBaseCode,
        NOME: storedBaseName || storedBaseCode,
        baseId: parseInt(storedBaseId),
      } as BaseWithStats

      setSelectedBaseCode(storedBaseCode)
      setSelectedBase(tempBase)
      setSelectedBaseId(parseInt(storedBaseId))
    }
  }, []) // Sem dependência do user para carregar mais rápido

  // Carregar base selecionada com lógica admin vs usuário normal (após carregar bases)
  useEffect(() => {
    if (bases.length === 0 || !user) {
      return
    }

    if (isAdmin) {
      // ADMIN: pode selecionar qualquer base, usar localStorage
      const storedBaseCode = localStorage.getItem(appConfig.selectedBaseKey)

      if (storedBaseCode) {
        // Tentar carregar base salva
        const base = bases.find(b => b.BASE === storedBaseCode)
        if (base) {
          setSelectedBaseCode(storedBaseCode)
          setSelectedBase(base)
          setSelectedBaseId(base.baseId)
          return
        }
      }

      // Se admin não tem base salva, usar base do usuário
      if (userBaseId) {
        const userBase = bases.find(b => b.baseId === userBaseId)
        if (userBase) {
          setSelectedBaseCode(userBase.BASE)
          setSelectedBase(userBase)
          setSelectedBaseId(userBase.baseId)
          localStorage.setItem(appConfig.selectedBaseKey, userBase.BASE)
          localStorage.setItem(appConfig.selectedBaseIdKey, userBase.baseId.toString())
          localStorage.setItem('@ari:selectedBaseName', userBase.NOME)
        }
      }
    } else {
      // USUÁRIO NORMAL: restrito à sua base
      if (userBaseId) {
        const userBase = bases.find(b => b.baseId === userBaseId)
        if (userBase) {
          setSelectedBaseCode(userBase.BASE)
          setSelectedBase(userBase)
          setSelectedBaseId(userBase.baseId)
          // Não salvar no localStorage para usuários normais
        } else {
          logger.warn(`Base ${userBaseId} do usuário não encontrada nas bases disponíveis`)
        }
      }
    }
  }, [bases, user, isAdmin, userBaseId])

  // Função para selecionar uma base (apenas para admin)
  const selectBase = (baseCode: string) => {
    if (!isAdmin && !canSelectBase) {
      toast.error('Você não tem permissão para alterar bases')
      return
    }

    const base = bases.find(b => b.BASE === baseCode)
    if (base) {
      setSelectedBaseCode(baseCode)
      setSelectedBase(base)
      setSelectedBaseId(base.baseId)

      // Salvar apenas para admin
      localStorage.setItem(appConfig.selectedBaseKey, baseCode)
      localStorage.setItem(appConfig.selectedBaseIdKey, base.baseId.toString())
      localStorage.setItem('@ari:selectedBaseName', base.NOME)

      toast.success(`Base alterada para: ${base.NOME}`)
    } else {
      toast.error('Base não encontrada')
    }
  }

  // Função para limpar seleção
  const clearSelection = () => {
    setSelectedBaseCode(null)
    setSelectedBase(null)
    setSelectedBaseId(null)
    localStorage.removeItem(appConfig.selectedBaseKey)
    localStorage.removeItem(appConfig.selectedBaseIdKey)
    toast.info('Nenhuma base selecionada')
  }

  // Função para carregar bases APENAS no primeiro login
  const loadBasesOnFirstLogin = () => {
    if (!localStorage.getItem('@ari:selectedBase')) {
      logger.debug('🔄 [BaseContext] Carregando bases no primeiro login')
      refreshBases()
    }
  }

  return (
    <BaseContext.Provider
      value={{
        bases,
        selectedBase,
        selectedBaseCode,
        selectedBaseId,
        isLoading,
        error: error?.message || null,
        selectBase,
        clearSelection,
        refreshBases,
        loadBasesOnFirstLogin,
        isAdmin,
        canSelectBase,
        userBaseId,
      }}
    >
      {children}
    </BaseContext.Provider>
  )
}

export const useBase = () => {
  const context = useContext(BaseContext)
  if (!context) {
    throw new Error('useBase must be used within a BaseProvider')
  }
  return context
}