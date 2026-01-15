import { Navigate } from 'react-router-dom'
import { useAuth } from '@invistto/auth-react'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'

interface ProtectedRouteProps {
  children: React.ReactNode
  roles?: Array<'admin' | 'user' | 'viewer'>
}

export function ProtectedRoute({ children, roles }: ProtectedRouteProps) {
  const { user, loading, isAuthenticated } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  // Verifica autenticação via hook (o pacote gerencia o storage internamente)
  if (!isAuthenticated || !user) {
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