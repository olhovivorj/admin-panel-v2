import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthUser } from '../dto/jwt-payload.dto';

/**
 * Decorator para extrair o usuário autenticado da request
 *
 * Uso:
 * @Get('profile')
 * @UseGuards(JwtAuthGuard)
 * async getProfile(@CurrentUser() user: AuthUser) {
 *   console.log(user.email, user.baseId, user.firebird.host);
 * }
 *
 * Baseado em: ari-nest e courier-v3
 */
export const CurrentUser = createParamDecorator(
  (data: keyof AuthUser | undefined, ctx: ExecutionContext): AuthUser | any => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      return null;
    }

    // Se especificar uma propriedade, retorna apenas ela
    return data ? user[data] : user;
  },
);

/**
 * Decorator para extrair apenas o baseId do usuário
 *
 * Uso:
 * @Get('data')
 * async getData(@GetBaseId() baseId: number) { ... }
 */
export const GetBaseId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): number => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.baseId) {
      throw new Error('ID_BASE não encontrado no usuário autenticado');
    }

    return user.baseId;
  },
);

/**
 * Decorator para extrair credenciais Firebird do usuário
 *
 * Uso:
 * @Get('zeiss-data')
 * async getZeissData(@GetFirebirdCredentials() firebird: FirebirdCredentials) {
 *   const connection = await this.firebirdService.connect(firebird);
 *   // ...
 * }
 */
export const GetFirebirdCredentials = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.firebird) {
      throw new Error('Credenciais Firebird não encontradas no token');
    }

    return user.firebird;
  },
);
