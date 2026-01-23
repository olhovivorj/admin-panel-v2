import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD, Reflector } from '@nestjs/core';
import { StandaloneJwtGuard } from '@invistto/auth';
import { ConfigServiceModule } from './config';
// Auth removido - usa API Auth centralizada (porta 3001) via proxy
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
 * Auth: API Auth centralizada (porta 3001) + StandaloneJwtGuard
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    // Módulo global de configuração (BaseConfigService, FirebirdConnectionManager)
    ConfigServiceModule,
    // Auth: Usa API Auth centralizada (porta 3001) via proxy
    // Guard: StandaloneJwtGuard valida tokens JWT sem módulo
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
  providers: [
    // Guard global - valida tokens JWT gerados pela API Auth centralizada (porta 3001)
    // Usa factory provider para injetar Reflector explicitamente
    {
      provide: APP_GUARD,
      useFactory: (reflector: Reflector) => new StandaloneJwtGuard(reflector),
      inject: [Reflector],
    },
  ],
})
export class AppModule {}
