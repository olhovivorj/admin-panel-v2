import { createParamDecorator, ExecutionContext, BadRequestException } from '@nestjs/common';

/**
 * Decorator customizado para extrair baseId do JWT token
 *
 * ELIMINA DUPLICAÇÃO: Código repetido em 17+ endpoints
 *
 * USO:
 * ```typescript
 * @Get('verificar-tabelas')
 * verificarTabelas(@BaseId() baseId: number) {
 *   return this.configService.verificarTabelas(baseId);
 * }
 * ```
 *
 * ANTES (7 linhas repetidas):
 * ```typescript
 * verificarTabelas(@Request() req: any) {
 *   const baseId = req.user?.baseId || req.user?.ID_BASE;
 *   if (!baseId) {
 *     return { success: false, error: 'ID_BASE não encontrado...' };
 *   }
 *   return this.configService.verificarTabelas(baseId);
 * }
 * ```
 *
 * AGORA (1 linha):
 * ```typescript
 * verificarTabelas(@BaseId() baseId: number) {
 *   return this.configService.verificarTabelas(baseId);
 * }
 * ```
 */
export const BaseId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): number => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    // Extrair baseId do JWT (suporta ambos formatos: baseId ou ID_BASE)
    const baseId = user?.baseId || user?.ID_BASE;

    if (!baseId) {
      throw new BadRequestException({
        success: false,
        error: 'ID_BASE não encontrado no token do usuário',
        statusCode: 400,
      });
    }

    return baseId;
  },
);
