import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ConfigServiceModule } from './config';
import { InvisttoAuthModule } from './modules/auth';
import { UsuariosModule } from './modules/usuarios/usuarios.module';
import { BasesModule } from './modules/bases/bases.module';
import { RolesModule } from './modules/roles/roles.module';
import { ErpModule } from './modules/erp/erp.module';
import { AppsModule } from './modules/apps/apps.module';
import { PagesModule } from './modules/pages/pages.module';
import { PlansModule } from './modules/plans/plans.module';

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
 * Auth baseado em: zeiss-api-client/invistto-auth
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    // Módulo global de configuração (BaseConfigService, FirebirdConnectionManager)
    ConfigServiceModule,
    // Módulo de autenticação (usa MySQL ariusers via BaseConfigService)
    InvisttoAuthModule,
    // Módulos CRUD (todos usam BaseConfigService + tabelas MySQL existentes)
    UsuariosModule,
    BasesModule,
    RolesModule,
    ErpModule,
    AppsModule,
    PagesModule,
    PlansModule,
  ],
})
export class AppModule {}
