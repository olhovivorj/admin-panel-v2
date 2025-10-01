/**
 * Role Helpers - Funções utilitárias para verificação de permissões
 *
 * Sistema baseado em prioridade numérica:
 * - Master: 100
 * - Admin: 80
 * - Supervisor: 60
 * - Operator: 40
 * - User: 20
 */

interface UserWithRole {
  roleId?: number
  roleName?: string
  rolePriority?: number
  canChangeBase?: boolean
  isMaster?: boolean
  isSupervisor?: boolean
}

/**
 * Verifica se o usuário é Master (prioridade 100)
 */
export function isMaster(user: UserWithRole | null): boolean {
  if (!user) return false

  // Novo sistema: verificar rolePriority
  if (user.rolePriority !== undefined) {
    return user.rolePriority >= 100
  }

  // Fallback: sistema antigo
  return user.isMaster === true
}

/**
 * Verifica se o usuário é Admin ou superior (prioridade >= 80)
 */
export function isAdmin(user: UserWithRole | null): boolean {
  if (!user) return false

  // Novo sistema: verificar rolePriority
  if (user.rolePriority !== undefined) {
    return user.rolePriority >= 80
  }

  // Fallback: sistema antigo
  return user.isMaster === true
}

/**
 * Verifica se o usuário é Supervisor ou superior (prioridade >= 60)
 */
export function isSupervisor(user: UserWithRole | null): boolean {
  if (!user) return false

  // Novo sistema: verificar rolePriority
  if (user.rolePriority !== undefined) {
    return user.rolePriority >= 60
  }

  // Fallback: sistema antigo
  return user.isMaster === true || user.isSupervisor === true
}

/**
 * Verifica se o usuário pode trocar de base
 * Apenas Master (100) pode trocar de base
 */
export function canChangeBase(user: UserWithRole | null): boolean {
  if (!user) return false

  // Novo sistema: usar campo específico
  if (user.canChangeBase !== undefined) {
    return user.canChangeBase
  }

  // Fallback: baseado em prioridade - APENAS MASTER
  if (user.rolePriority !== undefined) {
    return user.rolePriority >= 100
  }

  // Fallback final: sistema antigo
  return user.isMaster === true
}

/**
 * Verifica se o usuário tem permissão para ver todas as bases
 * Apenas Admin ou superior
 */
export function canViewAllBases(user: UserWithRole | null): boolean {
  return isAdmin(user)
}

/**
 * Verifica se o usuário pode gerenciar outros usuários
 * Apenas Admin ou superior
 */
export function canManageUsers(user: UserWithRole | null): boolean {
  return isAdmin(user)
}

/**
 * Verifica se o usuário pode acessar configurações do sistema
 * Apenas Master
 */
export function canAccessSystemSettings(user: UserWithRole | null): boolean {
  return isMaster(user)
}

/**
 * Obtém o nome da role de forma legível
 */
export function getRoleName(user: UserWithRole | null): string {
  if (!user) return 'Desconhecido'

  // Novo sistema: usar roleName
  if (user.roleName) {
    // Mapear nomes técnicos para nomes legíveis
    const roleNames: Record<string, string> = {
      'master': 'Master',
      'admin': 'Administrador',
      'supervisor': 'Supervisor',
      'operator': 'Operador',
      'user': 'Usuário',
    }
    return roleNames[user.roleName.toLowerCase()] || user.roleName
  }

  // Fallback: sistema antigo
  if (user.isMaster) return 'Master'
  if (user.isSupervisor) return 'Supervisor'
  return 'Usuário'
}

/**
 * Obtém a prioridade numérica da role
 */
export function getRolePriority(user: UserWithRole | null): number {
  if (!user) return 0

  // Novo sistema
  if (user.rolePriority !== undefined) {
    return user.rolePriority
  }

  // Fallback: sistema antigo
  if (user.isMaster) return 100
  if (user.isSupervisor) return 60
  return 20
}
