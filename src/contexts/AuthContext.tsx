import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '@/services/api'
import toast from 'react-hot-toast'
import { logger } from '@/utils/logger'

interface User {
  id: number
  email: string
  name: string
  role: 'admin' | 'user' | 'viewer'
  baseId: number
  base: string
  isMaster: boolean
  isSupervisor: boolean
  permissions: string[]
  tipoUsuario?: string
  canChangeBase?: boolean
}

interface AuthContextData {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  refreshToken: () => Promise<void>
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    loadUserFromStorage()
  }, [])

  async function loadUserFromStorage() {
    try {
      const token = localStorage.getItem('@ari:token')
      const savedUser = localStorage.getItem('@ari:user')

      logger.info('SECURITY CHECK', { hasToken: !!token, hasSavedUser: !!savedUser }, 'AUTH')

      if (token && savedUser) {
        // Verificar se token não expirou fazendo verificação no backend
        try {
          const response = await api.get('/auth/verify')
          if (response.data.success) {
            api.defaults.headers.authorization = `Bearer ${token}`
            setUser(JSON.parse(savedUser))
            logger.info('Token válido - usuário autenticado', {}, 'AUTH')
          } else {
            throw new Error('Token inválido')
          }
        } catch (error) {
          logger.warn('Token inválido - limpando dados', {}, 'AUTH')
          localStorage.clear()
          sessionStorage.clear()
        }
      } else {
        logger.info('Sem token ou usuário - não autenticado', {}, 'AUTH')
      }
    } catch (error) {
      logger.error('Erro ao carregar usuário', { error }, 'AUTH')
      localStorage.clear()
      sessionStorage.clear()
    } finally {
      setLoading(false)
    }
  }

  async function login(email: string, password: string) {
    try {
      logger.logAuth('login', email, false) // Log início do login

      const response = await api.post('/auth/login', { email, password })
      const responseData = response.data

      if (!responseData.success) {
        throw new Error(responseData.error?.message || 'Erro ao fazer login')
      }

      const userData = responseData.data
      const access_token = userData.access_token

      const user = {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        role: userData.isMaster ? 'admin' : (userData.isSupervisor ? 'user' : 'viewer'),
        baseId: userData.baseId,
        base: userData.base,
        isMaster: userData.isMaster,
        isSupervisor: userData.isSupervisor,
        permissions: userData.permissions || [],
        tipoUsuario: userData.tipoUsuario || 'COMUM',
        canChangeBase: userData.canChangeBase || false,
      }

      localStorage.setItem('@ari:token', access_token)
      localStorage.setItem('@ari:user', JSON.stringify(user))

      // Salvar baseId selecionada para as requisições da API
      if (user.baseId) {
        localStorage.setItem('@ari:selectedBaseId', user.baseId.toString())
      }

      // Para melhorar UX: salvar info da base do usuário no localStorage
      // para que o BaseSelector carregue instantaneamente
      if (userData.base) {
        localStorage.setItem('@ari:selectedBase', userData.base)
        localStorage.setItem('@ari:selectedBaseName', userData.baseName || userData.base)
      }

      api.defaults.headers.authorization = `Bearer ${access_token}`
      setUser(user)

      logger.logAuth('login', email, true) // Log sucesso do login
      logger.info(`Usuário ${user.name} (${user.role}) conectado à base ${user.baseId}`, 'AUTH')

      toast.success('Login realizado com sucesso!')
      navigate('/dashboard')
    } catch (error: any) {
      logger.logAuth('login', email, false) // Log falha do login

      // Verificar se é erro de backend indisponível (já tratado pelo interceptor)
      // Evitar toast duplicado, apenas logs
      if (error.code === 'ERR_NETWORK' || error.code === 'ECONNREFUSED') {
        logger.error('Backend indisponível durante login', 'AUTH', { email, error: error.message })
        // Toast já foi mostrado pelo interceptor da API
        throw error
      }

      // Debug detalhado do erro
      if (error.code === 'ERR_CANCELED') {
        logger.error('Request cancelada', 'AUTH', { email })
        toast.error('Requisição cancelada. Tente novamente.')
      } else if (error.code === 'ECONNABORTED') {
        logger.error('Timeout na requisição', 'AUTH', { email })
        toast.error('Tempo esgotado. Tente novamente.')
      } else {
        // Garantir que message seja sempre uma string
        let message = 'Erro ao fazer login'

        if (typeof error.response?.data?.message === 'string') {
          message = error.response.data.message
        } else if (typeof error.response?.data === 'string') {
          message = error.response.data
        } else if (error.message) {
          message = error.message
        }

        logger.error(`Erro no login: ${message}`, 'AUTH', { email, error })
        toast.error(message)
      }

      throw error
    }
  }

  function logout() {
    const currentUser = user

    // LIMPEZA TOTAL - SEGURANÇA MÁXIMA
    // Remove TODOS os dados do localStorage para garantir que não volte sem login
    localStorage.clear()

    // Limpa todos os dados de sessão
    sessionStorage.clear()

    // Remove header de autorização
    delete api.defaults.headers.authorization
    delete api.defaults.headers.common['Authorization']

    // Limpa estado do usuário
    setUser(null)

    // Invalida qualquer cache do React Query
    if (window.queryClient) {
      window.queryClient.clear()
    }

    logger.logAuth('logout', currentUser?.email)

    // Força navegação para login e reload completo
    navigate('/login')

    // Força reload da página após pequeno delay para garantir limpeza completa
    setTimeout(() => {
      window.location.reload()
    }, 100)
  }

  async function refreshToken() {
    try {
      const response = await api.post('/auth/refresh')
      const { token } = response.data

      localStorage.setItem('@ari:token', token)
      api.defaults.headers.authorization = `Bearer ${token}`
    } catch (error) {
      logout()
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshToken }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider')
  }
  return context
}