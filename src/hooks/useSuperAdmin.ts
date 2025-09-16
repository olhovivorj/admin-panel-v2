import { useAuth } from '@/contexts/AuthContext'

/**
 * Hook para verificar se o usuário logado é administrador
 */
export function useSuperAdmin() {
  const { user } = useAuth()

  // QUALQUER administrador tem todos os poderes
  const isAdmin = user?.role === 'admin'
  const isSuperAdmin = isAdmin // Mantém compatibilidade

  return {
    isAdmin,
    isSuperAdmin, // Mantém para compatibilidade
    canEditProtectedFields: isAdmin,
    canCreateAdmins: isAdmin,
    canChangeUserType: isAdmin,
    canEditAnyUser: isAdmin,
    user,
  }
}