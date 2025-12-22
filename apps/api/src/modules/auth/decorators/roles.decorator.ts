import { SetMetadata } from '@nestjs/common';

/**
 * Roles disponíveis no sistema
 * Baseado em: ari-nest e courier-v3
 */
export enum Role {
  USER = 'USER',
  ADMIN = 'ADMIN',
  SUPERVISOR = 'SUPERVISOR',
  MASTER = 'MASTER',
  VENDEDOR = 'VENDEDOR',
  GERENTE = 'GERENTE',
  ANALISTA = 'ANALISTA',
}

export const ROLES_KEY = 'roles';

/**
 * Decorator para restringir acesso por role
 *
 * Uso:
 * @Roles(Role.ADMIN, Role.SUPERVISOR)
 * @Get('admin-only')
 * async adminEndpoint() { ... }
 */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
