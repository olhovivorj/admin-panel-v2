import { Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'

interface ProtectedRouteProps {
  children: React.ReactNode
  roles?: Array<'admin' | 'user' | 'viewer'>
}

export function ProtectedRoute({ children, roles }: ProtectedRouteProps) {
  const { user, loading } = useAuth()

  // Verificação adicional de segurança - token deve existir
  // ✅ SEGURANÇA: Token em sessionStorage (expira ao fechar navegador)
  const token = sessionStorage.getItem('@ari:token')

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  // SEGURANÇA RIGOROSA: Deve ter user E token válido
  if (!user || !token) {
    // Limpa qualquer vestígio antes de redirecionar
    localStorage.clear()
    sessionStorage.clear()
    return <Navigate to="/login" replace />
  }

  // Verificar role do usuário (suporta role como objeto ou string legada)
  if (roles) {
    const userRoleName = typeof user.role === 'object' ? user.role?.name?.toLowerCase() : (user as any).roleName?.toLowerCase()
    if (userRoleName && !roles.includes(userRoleName as any)) {
      return <Navigate to="/dashboard" replace />
    }
  }

  return <>{children}</>
}