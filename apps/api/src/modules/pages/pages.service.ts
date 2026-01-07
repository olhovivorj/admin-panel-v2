import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { BaseConfigService } from '../../config/base-config.service';
import { CreatePageDto } from './dto/create-page.dto';
import { UpdatePageDto } from './dto/update-page.dto';

/**
 * PagesService - CRUD de páginas usando tabela ari_pages do MySQL
 *
 * Tabela: ari_pages
 * Campos: id, name, display_name, path, category, app_id, icon, description, is_active, order, created_at, updated_at
 */
@Injectable()
export class PagesService {
  private readonly logger = new Logger(PagesService.name);

  constructor(private readonly db: BaseConfigService) {}

  async findAll(options: { appId?: number; includeInactive?: boolean } = {}) {
    let whereClause = '1=1';
    const params: any[] = [];

    if (!options.includeInactive) {
      whereClause += ' AND p.is_active = 1';
    }

    if (options.appId) {
      whereClause += ' AND p.app_id = ?';
      params.push(options.appId);
    }

    const pages = await this.db.query(
      `SELECT
        p.id,
        p.name,
        p.display_name as displayName,
        p.path,
        p.category,
        p.app_id as appId,
        a.name as appName,
        a.display_name as appDisplayName,
        p.icon,
        p.description,
        p.is_active as isActive,
        p.\`order\`,
        p.created_at as createdAt,
        p.updated_at as updatedAt
      FROM ari_pages p
      LEFT JOIN ari_apps a ON p.app_id = a.id
      WHERE ${whereClause}
      ORDER BY p.\`order\` ASC, p.name ASC`,
      params
    );

    return pages.map(page => ({
      id: page.id,
      name: page.name,
      displayName: page.displayName,
      path: page.path,
      category: page.category,
      appId: page.appId,
      app: page.appId ? {
        id: page.appId,
        name: page.appName,
        displayName: page.appDisplayName,
      } : null,
      icon: page.icon,
      description: page.description,
      isActive: page.isActive === 1,
      order: page.order,
      createdAt: page.createdAt,
      updatedAt: page.updatedAt,
    }));
  }

  async findOne(id: number) {
    const page = await this.db.queryOne(
      `SELECT
        p.id,
        p.name,
        p.display_name as displayName,
        p.path,
        p.category,
        p.app_id as appId,
        a.name as appName,
        a.display_name as appDisplayName,
        p.icon,
        p.description,
        p.is_active as isActive,
        p.\`order\`,
        p.created_at as createdAt,
        p.updated_at as updatedAt
      FROM ari_pages p
      LEFT JOIN ari_apps a ON p.app_id = a.id
      WHERE p.id = ?`,
      [id]
    );

    if (!page) {
      throw new NotFoundException(`Página ${id} não encontrada`);
    }

    // Get roles that have access to this page
    const roles = await this.db.query(
      `SELECT
        r.id,
        r.name,
        r.display_name as displayName,
        rp.can_access as canAccess,
        rp.can_edit as canEdit,
        rp.can_delete as canDelete
      FROM ari_role_permissions rp
      JOIN ari_roles r ON rp.role_id = r.id
      WHERE rp.page_id = ?
      ORDER BY r.priority DESC, r.name ASC`,
      [id]
    );

    // Get plans that include this page
    const plans = await this.db.query(
      `SELECT
        pl.id,
        pl.name,
        pl.display_name as displayName
      FROM ari_plan_pages pp
      JOIN ari_plans pl ON pp.plan_id = pl.id
      WHERE pp.page_id = ?
      ORDER BY pl.name ASC`,
      [id]
    );

    return {
      id: page.id,
      name: page.name,
      displayName: page.displayName,
      path: page.path,
      category: page.category,
      appId: page.appId,
      app: page.appId ? {
        id: page.appId,
        name: page.appName,
        displayName: page.appDisplayName,
      } : null,
      icon: page.icon,
      description: page.description,
      isActive: page.isActive === 1,
      order: page.order,
      createdAt: page.createdAt,
      updatedAt: page.updatedAt,
      roles: roles.map(r => ({
        id: r.id,
        name: r.name,
        displayName: r.displayName,
        canAccess: r.canAccess === 1,
        canEdit: r.canEdit === 1,
        canDelete: r.canDelete === 1,
      })),
      plans: plans.map(p => ({
        id: p.id,
        name: p.name,
        displayName: p.displayName,
      })),
    };
  }

  async create(dto: CreatePageDto) {
    // Check if page name already exists
    const existing = await this.db.queryOne(
      'SELECT id FROM ari_pages WHERE name = ?',
      [dto.name]
    );

    if (existing) {
      throw new ConflictException('Nome de página já existe');
    }

    // Check if path already exists
    const pathExists = await this.db.queryOne(
      'SELECT id FROM ari_pages WHERE path = ?',
      [dto.path]
    );

    if (pathExists) {
      throw new ConflictException('Path já está em uso');
    }

    const insertId = await this.db.insert('ari_pages', {
      name: dto.name,
      display_name: dto.displayName,
      path: dto.path,
      category: dto.category || null,
      app_id: dto.appId || null,
      icon: dto.icon || null,
      description: dto.description || null,
      is_active: dto.isActive !== false ? 1 : 0,
      order: dto.order || 0,
    });

    this.logger.log(`Página criada: ${dto.name} (ID: ${insertId})`);

    return this.findOne(insertId);
  }

  async update(id: number, dto: UpdatePageDto) {
    const existing = await this.db.queryOne(
      'SELECT id, name, path FROM ari_pages WHERE id = ?',
      [id]
    );

    if (!existing) {
      throw new NotFoundException(`Página ${id} não encontrada`);
    }

    // Check if new name conflicts
    if (dto.name && dto.name !== existing.name) {
      const nameExists = await this.db.queryOne(
        'SELECT id FROM ari_pages WHERE name = ? AND id != ?',
        [dto.name, id]
      );

      if (nameExists) {
        throw new ConflictException('Nome de página já existe');
      }
    }

    // Check if new path conflicts
    if (dto.path && dto.path !== existing.path) {
      const pathExists = await this.db.queryOne(
        'SELECT id FROM ari_pages WHERE path = ? AND id != ?',
        [dto.path, id]
      );

      if (pathExists) {
        throw new ConflictException('Path já está em uso');
      }
    }

    const updateData: Record<string, any> = {};
    if (dto.name) updateData.name = dto.name;
    if (dto.displayName) updateData.display_name = dto.displayName;
    if (dto.path) updateData.path = dto.path;
    if (dto.category !== undefined) updateData.category = dto.category || null;
    if (dto.appId !== undefined) updateData.app_id = dto.appId || null;
    if (dto.icon !== undefined) updateData.icon = dto.icon || null;
    if (dto.description !== undefined) updateData.description = dto.description || null;
    if (dto.isActive !== undefined) updateData.is_active = dto.isActive ? 1 : 0;
    if (dto.order !== undefined) updateData.order = dto.order;

    if (Object.keys(updateData).length > 0) {
      await this.db.update('ari_pages', updateData, 'id = ?', [id]);
      this.logger.log(`Página atualizada: ID ${id}`);
    }

    return this.findOne(id);
  }

  async remove(id: number) {
    const page = await this.db.queryOne(
      'SELECT id, name FROM ari_pages WHERE id = ?',
      [id]
    );

    if (!page) {
      throw new NotFoundException(`Página ${id} não encontrada`);
    }

    // Delete related permissions
    await this.db.delete('ari_role_permissions', 'page_id = ?', [id]);
    // Delete related plan pages
    await this.db.delete('ari_plan_pages', 'page_id = ?', [id]);
    // Delete page
    await this.db.delete('ari_pages', 'id = ?', [id]);

    this.logger.log(`Página removida: ${page.name} (ID: ${id})`);

    return { message: 'Página removida com sucesso' };
  }

  async toggleStatus(id: number) {
    const page = await this.db.queryOne(
      'SELECT id, name, is_active as isActive FROM ari_pages WHERE id = ?',
      [id]
    );

    if (!page) {
      throw new NotFoundException(`Página ${id} não encontrada`);
    }

    const newStatus = page.isActive === 1 ? 0 : 1;
    await this.db.update('ari_pages', { is_active: newStatus }, 'id = ?', [id]);

    this.logger.log(`Página ${newStatus ? 'ativada' : 'desativada'}: ${page.name} (ID: ${id})`);

    return {
      id,
      isActive: newStatus === 1,
      message: newStatus === 1 ? 'Página ativada' : 'Página desativada',
    };
  }

  async reorder(pageIds: number[]) {
    for (let i = 0; i < pageIds.length; i++) {
      await this.db.update('ari_pages', { order: i }, 'id = ?', [pageIds[i]]);
    }

    this.logger.log(`Páginas reordenadas: ${pageIds.join(', ')}`);

    return { message: 'Páginas reordenadas com sucesso' };
  }
}
