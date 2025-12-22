import { SetMetadata } from '@nestjs/common';

/**
 * Decorator para marcar rotas como públicas (sem autenticação)
 *
 * Uso:
 * @Public()
 * @Post('login')
 * async login() { ... }
 *
 * Baseado em: ari-nest e courier-v3
 */
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
