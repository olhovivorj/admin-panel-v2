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
  const token = localStorage.getItem('@ari:token')

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

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}