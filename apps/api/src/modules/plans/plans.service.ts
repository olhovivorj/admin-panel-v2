import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { BaseConfigService } from '../../config/base-config.service';
import { CreatePlanDto } from './dto/create-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';

/**
 * PlansService - CRUD de planos usando tabela ari_plans do MySQL
 *
 * Tabelas:
 * - ari_plans: id, name, display_name, description, price, is_active, features, limits, created_at, updated_at
 * - ari_plan_pages: plan_id, page_id (relacionamento N:N)
 */
@Injectable()
export class PlansService {
  private readonly logger = new Logger(PlansService.name);

  constructor(private readonly db: BaseConfigService) {}

  async findAll(includeInactive = false) {
    const whereClause = includeInactive ? '' : 'WHERE p.is_active = 1';

    const plans = await this.db.query(
      `SELECT
        p.id,
        p.name,
        p.display_name as displayName,
        p.description,
        p.price,
        p.is_active as isActive,
        p.features,
        p.limits,
        p.created_at as createdAt,
        p.updated_at as updatedAt,
        (SELECT COUNT(*) FROM ari_plan_pages WHERE plan_id = p.id) as pagesCount,
        (SELECT COUNT(*) FROM ariusers WHERE plan_id = p.id) as usersCount
      FROM ari_plans p
      ${whereClause}
      ORDER BY p.price ASC, p.name ASC`
    );

    return plans.map(plan => ({
      id: plan.id,
      name: plan.name,
      displayName: plan.displayName,
      description: plan.description,
      price: plan.price,
      isActive: plan.isActive === 1,
      features: this.parseJson(plan.features),
      limits: this.parseJson(plan.limits),
      createdAt: plan.createdAt,
      updatedAt: plan.updatedAt,
      pagesCount: plan.pagesCount || 0,
      usersCount: plan.usersCount || 0,
    }));
  }

  async findOne(id: number) {
    const plan = await this.db.queryOne(
      `SELECT
        id,
        name,
        display_name as displayName,
        description,
        price,
        is_active as isActive,
        features,
        limits,
        created_at as createdAt,
        updated_at as updatedAt
      FROM ari_plans
      WHERE id = ?`,
      [id]
    );

    if (!plan) {
      throw new NotFoundException(`Plano ${id} não encontrado`);
    }

    // Get pages included in this plan
    const pages = await this.db.query(
      `SELECT
        p.id,
        p.name,
        p.display_name as displayName,
        p.path,
        p.category,
        a.name as appName,
        a.display_name as appDisplayName
      FROM ari_plan_pages pp
      JOIN ari_pages p ON pp.page_id = p.id
      LEFT JOIN ari_apps a ON p.app_id = a.id
      WHERE pp.plan_id = ?
      ORDER BY a.name, p.name`,
      [id]
    );

    // Get users with this plan
    const users = await this.db.query(
      `SELECT id, nome, email
       FROM ariusers
       WHERE plan_id = ?
       ORDER BY nome`,
      [id]
    );

    return {
      id: plan.id,
      name: plan.name,
      displayName: plan.displayName,
      description: plan.description,
      price: plan.price,
      isActive: plan.isActive === 1,
      features: this.parseJson(plan.features),
      limits: this.parseJson(plan.limits),
      createdAt: plan.createdAt,
      updatedAt: plan.updatedAt,
      pages: pages.map(p => ({
        id: p.id,
        name: p.name,
        displayName: p.displayName,
        path: p.path,
        category: p.category,
        appName: p.appName,
        appDisplayName: p.appDisplayName,
      })),
      users: users.map(u => ({
        id: u.id,
        nome: u.nome,
        email: u.email,
      })),
    };
  }

  async create(dto: CreatePlanDto) {
    // Check if plan name already exists
    const existing = await this.db.queryOne(
      'SELECT id FROM ari_plans WHERE name = ?',
      [dto.name]
    );

    if (existing) {
      throw new ConflictException('Nome de plano já existe');
    }

    const insertId = await this.db.insert('ari_plans', {
      name: dto.name,
      display_name: dto.displayName,
      description: dto.description || null,
      price: dto.price || 0,
      is_active: dto.isActive !== false ? 1 : 0,
      features: dto.features ? JSON.stringify(dto.features) : null,
      limits: dto.limits ? JSON.stringify(dto.limits) : null,
    });

    this.logger.log(`Plano criado: ${dto.name} (ID: ${insertId})`);

    return this.findOne(insertId);
  }

  async update(id: number, dto: UpdatePlanDto) {
    const existing = await this.db.queryOne(
      'SELECT id, name FROM ari_plans WHERE id = ?',
      [id]
    );

    if (!existing) {
      throw new NotFoundException(`Plano ${id} não encontrado`);
    }

    // Check if new name conflicts
    if (dto.name && dto.name !== existing.name) {
      const nameExists = await this.db.queryOne(
        'SELECT id FROM ari_plans WHERE name = ? AND id != ?',
        [dto.name, id]
      );

      if (nameExists) {
        throw new ConflictException('Nome de plano já existe');
      }
    }

    const updateData: Record<string, any> = {};
    if (dto.name) updateData.name = dto.name;
    if (dto.displayName) updateData.display_name = dto.displayName;
    if (dto.description !== undefined) updateData.description = dto.description || null;
    if (dto.price !== undefined) updateData.price = dto.price;
    if (dto.isActive !== undefined) updateData.is_active = dto.isActive ? 1 : 0;
    if (dto.features !== undefined) updateData.features = dto.features ? JSON.stringify(dto.features) : null;
    if (dto.limits !== undefined) updateData.limits = dto.limits ? JSON.stringify(dto.limits) : null;

    if (Object.keys(updateData).length > 0) {
      await this.db.update('ari_plans', updateData, 'id = ?', [id]);
      this.logger.log(`Plano atualizado: ID ${id}`);
    }

    return this.findOne(id);
  }

  async remove(id: number) {
    const plan = await this.db.queryOne(
      'SELECT id, name FROM ari_plans WHERE id = ?',
      [id]
    );

    if (!plan) {
      throw new NotFoundException(`Plano ${id} não encontrado`);
    }

    // Check if there are users with this plan
    const userCount = await this.db.queryOne<{ count: number }>(
      'SELECT COUNT(*) as count FROM ariusers WHERE plan_id = ?',
      [id]
    );

    if (userCount?.count > 0) {
      throw new BadRequestException(
        `Plano possui ${userCount.count} usuário(s) vinculado(s). Remova os usuários primeiro.`
      );
    }

    // Delete plan pages
    await this.db.delete('ari_plan_pages', 'plan_id = ?', [id]);
    // Delete plan
    await this.db.delete('ari_plans', 'id = ?', [id]);

    this.logger.log(`Plano removido: ${plan.name} (ID: ${id})`);

    return { message: 'Plano removido com sucesso' };
  }

  async toggleStatus(id: number) {
    const plan = await this.db.queryOne(
      'SELECT id, name, is_active as isActive FROM ari_plans WHERE id = ?',
      [id]
    );

    if (!plan) {
      throw new NotFoundException(`Plano ${id} não encontrado`);
    }

    const newStatus = plan.isActive === 1 ? 0 : 1;
    await this.db.update('ari_plans', { is_active: newStatus }, 'id = ?', [id]);

    this.logger.log(`Plano ${newStatus ? 'ativado' : 'desativado'}: ${plan.name} (ID: ${id})`);

    return {
      id,
      isActive: newStatus === 1,
      message: newStatus === 1 ? 'Plano ativado' : 'Plano desativado',
    };
  }

  async getPages(id: number) {
    const plan = await this.db.queryOne(
      'SELECT id FROM ari_plans WHERE id = ?',
      [id]
    );

    if (!plan) {
      throw new NotFoundException(`Plano ${id} não encontrado`);
    }

    const pages = await this.db.query(
      `SELECT
        p.id,
        p.name,
        p.display_name as displayName,
        p.path,
        p.category,
        a.id as appId,
        a.name as appName,
        a.display_name as appDisplayName
      FROM ari_plan_pages pp
      JOIN ari_pages p ON pp.page_id = p.id
      LEFT JOIN ari_apps a ON p.app_id = a.id
      WHERE pp.plan_id = ?
      ORDER BY a.name, p.name`,
      [id]
    );

    return pages.map(p => ({
      id: p.id,
      name: p.name,
      displayName: p.displayName,
      path: p.path,
      category: p.category,
      app: p.appId ? {
        id: p.appId,
        name: p.appName,
        displayName: p.appDisplayName,
      } : null,
    }));
  }

  async setPages(id: number, pageIds: number[]) {
    const plan = await this.db.queryOne(
      'SELECT id FROM ari_plans WHERE id = ?',
      [id]
    );

    if (!plan) {
      throw new NotFoundException(`Plano ${id} não encontrado`);
    }

    // Remove existing pages
    await this.db.delete('ari_plan_pages', 'plan_id = ?', [id]);

    // Add new pages
    for (const pageId of pageIds) {
      await this.db.insert('ari_plan_pages', {
        plan_id: id,
        page_id: pageId,
      });
    }

    this.logger.log(`Páginas atualizadas para plano ${id}: ${pageIds.length} páginas`);

    return this.getPages(id);
  }

  private parseJson(value: string | null): any {
    if (!value) return null;
    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  }
}
