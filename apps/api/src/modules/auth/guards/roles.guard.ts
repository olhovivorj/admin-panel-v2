import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY, Role } from '../decorators/roles.decorator';

/**
 * Guard de Roles - Verifica se usuário tem permissão baseado em roles
 * Baseado em: ari-nest e courier-v3
 *
 * Uso:
 * @Roles(Role.ADMIN, Role.SUPERVISOR)
 * @UseGuards(JwtAuthGuard, RolesGuard)
 * @Get('admin-only')
 * async adminRoute() { ... }
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();

    if (!user) {
      throw new ForbiddenException('Usuário não autenticado');
    }

    // Master tem acesso a tudo
    if (user.isMaster) {
      return true;
    }

    // Verificar se usuário tem alguma das roles necessárias
    const hasRole = requiredRoles.some((role) =>
      user.roles?.some((userRole: string) => userRole.toUpperCase() === role),
    );

    if (!hasRole) {
      throw new ForbiddenException(
        `Acesso negado. Roles necessárias: ${requiredRoles.join(', ')}`,
      );
    }

    return true;
  }
}
