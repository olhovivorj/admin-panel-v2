import { useAuth } from '@/contexts/AuthContext'
import { isAdmin as checkIsAdmin, isMaster, canManageUsers } from '@/utils/roleHelpers'

/**
 * Hook para verificar se o usuário logado é administrador
 * Agora usa roleHelpers para verificar permissões baseadas em rolePriority
 */
export function useSuperAdmin() {
  const { user } = useAuth()

  // Usar roleHelpers para verificar permissões
  const isAdmin = checkIsAdmin(user)
  const isSuperAdmin = isMaster(user) // Super admin = Master (prioridade 100)

  return {
    isAdmin,
    isSuperAdmin,
    canEditProtectedFields: isAdmin,
    canCreateAdmins: isAdmin,
    canChangeUserType: isAdmin,
    canEditAnyUser: isAdmin,
    canManageUsers: canManageUsers(user),
    user,
  }
}