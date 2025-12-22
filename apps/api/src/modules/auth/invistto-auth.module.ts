import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { InvisttoAuthController } from './invistto-auth.controller';
import { InvisttoAuthService } from './invistto-auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { BaseConfigService } from '../../config/base-config.service';
import { FirebirdConnectionManager } from '../../config/firebird-connection-manager.service';

/**
 * Módulo de Autenticação Invistto
 * Baseado em: ari-nest/auth.module.ts e courier-v3/auth.module.ts
 *
 * REUTILIZÁVEL - Pode ser copiado para outros projetos Invistto
 *
 * Fornece:
 * - JWT Authentication
 * - Guards (JwtAuthGuard, RolesGuard)
 * - Decorators (@CurrentUser, @GetBaseId, @GetFirebirdCredentials)
 * - Login com MySQL + Firebird credentials
 */
@Module({
  imports: [
    ConfigModule,

    // Passport com estratégia JWT
    PassportModule.register({ defaultStrategy: 'jwt' }),

    // JWT Module configurado via environment
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRATION', '8h'),
        },
      }),
    }),
  ],

  controllers: [InvisttoAuthController],

  providers: [
    InvisttoAuthService,
    JwtStrategy,
    JwtAuthGuard,
    RolesGuard,
    // ✅ v3.3.2: BaseConfigService e FirebirdConnectionManager removidos
    // ConfigModule (@Global) já exporta esses services
    // Remover daqui para evitar múltiplas instâncias (violação DRY)
  ],

  exports: [
    // Exportar para uso em outros módulos
    JwtModule,
    InvisttoAuthService,
    JwtStrategy,
    JwtAuthGuard,
    RolesGuard,
  ],
})
export class InvisttoAuthModule {}
