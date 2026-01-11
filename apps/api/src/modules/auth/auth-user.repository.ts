import { Injectable } from '@nestjs/common';
import {
  IAuthUserRepository,
  AuthUserData,
  AuthPlanData,
  AuthPageData,
  AuthRoleData,
  AuthFirebirdData,
} from '@invistto/auth';
import { BaseConfigService } from '../../config/base-config.service';

/**
 * Implementacao do repositorio de usuarios para o admin-panel-v2
 * Conecta o pacote @invistto/auth com o banco de dados MySQL do projeto
 */
@Injectable()
export class AuthUserRepository implements IAuthUserRepository {
  constructor(private readonly baseConfigService: BaseConfigService) {}

  /**
   * Busca usuario por email na tabela ariusers
   */
  async findByEmail(email: string): Promise<AuthUserData | null> {
    const user = await this.baseConfigService.getUserByEmail(email.toLowerCase());

    if (!user) return null;

    return {
      id: user.id,
      email: user.email,
      nome: user.nome,
      senha: user.senha,
      funcao: user.funcao,
      ativo: user.ativo,
      baseId: user.ID_BASE,
      planId: user.plan_id,
      roleId: user.role_id,
    };
  }

  /**
   * Busca nome da base pelo ID
   */
  async getBaseName(baseId: number): Promise<string> {
    return this.baseConfigService.getBaseName(baseId);
  }

  /**
   * Busca dados do plano do usuario
   */
  async getPlanData(planId: number): Promise<AuthPlanData | null> {
    const plan = await this.baseConfigService.getPlanData(planId);

    if (!plan) return null;

    return {
      id: plan.id,
      name: plan.name,
      displayName: plan.display_name,
      type: plan.plan_type,
    };
  }

  /**
   * Busca paginas do plano do usuario
   */
  async getPlanPages(planId: number): Promise<AuthPageData[]> {
    const pages = await this.baseConfigService.getPlanPages(planId);

    return pages.map((p: any) => ({
      id: p.id,
      name: p.name,
      path: p.path,
      category: p.category,
      appId: p.app_id,
      appName: p.app_name,
      appDisplayName: p.app_display_name,
      appIcon: p.app_icon,
    }));
  }

  /**
   * Busca role do usuario
   */
  async getRoleData(roleId: number): Promise<AuthRoleData | null> {
    const role = await this.baseConfigService.queryOne<{
      id: number;
      name: string;
      display_name: string;
      priority: number;
    }>(`
      SELECT id, name, display_name, priority
      FROM ari_roles WHERE id = ?
    `, [roleId]);

    if (!role) return null;

    return {
      id: role.id,
      name: role.name,
      displayName: role.display_name,
      priority: role.priority,
    };
  }

  /**
   * Busca credenciais Firebird da base
   */
  async getFirebirdCredentials(baseId: number): Promise<AuthFirebirdData | null> {
    try {
      const config = await this.baseConfigService.getConfig(baseId);

      return {
        active: config.FIREBIRD_ACTIVE === 1 || config.FIREBIRD_ACTIVE === true,
        host: config.FIREBIRD_HOST,
        port: config.FIREBIRD_PORT,
        database: config.FIREBIRD_DATABASE,
        user: config.FIREBIRD_USER,
        password: config.FIREBIRD_PASSWORD,
      };
    } catch {
      return null;
    }
  }

  /**
   * Atualiza ultimo acesso do usuario
   */
  async updateLastAccess(userId: number): Promise<void> {
    await this.baseConfigService.updateLastAccess(userId);
  }
}
