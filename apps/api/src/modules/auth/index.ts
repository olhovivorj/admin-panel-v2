/**
 * Index para facilitar imports do módulo de autenticação
 *
 * Uso em outros arquivos:
 * import { InvisttoAuthModule, JwtAuthGuard, CurrentUser } from '@/core/invistto-auth';
 */

// Module
export * from './invistto-auth.module';
export * from './invistto-auth.service';
export * from './invistto-auth.controller';

// DTOs
export * from './dto/login.dto';
export * from './dto/auth-response.dto';
export * from './dto/jwt-payload.dto';

// Guards
export * from './guards/jwt-auth.guard';
export * from './guards/roles.guard';

// Strategies
export * from './strategies/jwt.strategy';

// Decorators
export * from './decorators/public.decorator';
export * from './decorators/current-user.decorator';
export * from './decorators/roles.decorator';
