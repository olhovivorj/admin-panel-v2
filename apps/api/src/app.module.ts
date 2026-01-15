import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { InvisttoAuthModule } from '@invistto/auth';
import { ConfigServiceModule } from './config';
import { AuthUserRepository } from './modules/auth/auth-user.repository';
import { UsuariosModule } from './modules/usuarios/usuarios.module';
import { BasesModule } from './modules/bases/bases.module';
import { RolesModule } from './modules/roles/roles.module';
import { ErpModule } from './modules/erp/erp.module';
import { AppsModule } from './modules/apps/apps.module';
import { PagesModule } from './modules/pages/pages.module';
import { PlansModule } from './modules/plans/plans.module';
import { SchedulesModule } from './modules/schedules/schedules.module';
import { LoggerModule } from './modules/logger/logger.module';

/**
 * AppModule - Módulo principal do Admin Panel V2
 *
 * API DESACOPLADA - Usa tabelas MySQL existentes (sem Prisma):
 * - ariusers: Usuários do sistema
 * - base: Bases/clientes
 * - base_config: Configurações Firebird por base
 * - ari_roles: Roles do sistema
 * - ari_role_permissions: Permissões por role
 * - ari_plans: Planos de assinatura
 * - ari_pages: Páginas/permissões
 *
 * Auth: @invistto/auth (pacote compartilhado)
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    // Módulo global de configuração (BaseConfigService, FirebirdConnectionManager)
    ConfigServiceModule,
    // Modulo de autenticacao (@invistto/auth - pacote compartilhado)
    // NOTA: Auth agora e limpo (sem Firebird). ERP e tratado pelo ErpModule local.
    InvisttoAuthModule.forRootAsync({
      imports: [ConfigServiceModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        jwt: {
          secret: configService.get<string>('JWT_SECRET', 'default-secret-change-in-production'),
          expiration: configService.get<string>('JWT_EXPIRATION', '8h'),
        },
      }),
      userRepository: AuthUserRepository,
    }),
    // Módulos CRUD (todos usam BaseConfigService + tabelas MySQL existentes)
    UsuariosModule,
    BasesModule,
    RolesModule,
    ErpModule,
    AppsModule,
    PagesModule,
    PlansModule,
    SchedulesModule,
    // Módulo de logger para receber logs do frontend
    LoggerModule,
  ],
})
export class AppModule {}
