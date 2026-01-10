import { useAuth } from '@/contexts/AuthContext'

/**
 * Hook para verificar permissões do usuário
 * Usa role.priority com fallback para isMaster/isSupervisor
 *
 * Prioridades:
 * - 100: Master (tudo, troca bases)
 * - 80: Admin (gerencia usuarios, deleta)
 * - 60: Supervisor (edita config)
 * - 40: Operator (edita dados)
 * - 20: User (visualiza)
 */
export function useSuperAdmin() {
  const { user } = useAuth()

  // Priority da role OU fallback para sistema antigo
  const priority = user?.role?.priority
    ?? (user?.isMaster ? 100 : user?.isSupervisor ? 60 : 20)

  return {
    // Direitos baseados em priority
    canChangeBase: priority >= 100,
    canManageUsers: priority >= 80,
    canEditConfig: priority >= 60,
    canEdit: priority >= 40,
    canDelete: priority >= 80,

    // Helpers (compatibilidade)
    isMaster: priority >= 100,
    isAdmin: priority >= 80,
    isSupervisor: priority >= 60,
    isSuperAdmin: priority >= 100,

    // MANTER retornos existentes para compatibilidade
    canEditProtectedFields: priority >= 80,
    canCreateAdmins: priority >= 80,
    canChangeUserType: priority >= 80,
    canEditAnyUser: priority >= 80,

    user,
  }
}