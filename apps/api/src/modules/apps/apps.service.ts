import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { BaseConfigService } from '../../config/base-config.service';
import { CreateAppDto } from './dto/create-app.dto';
import { UpdateAppDto } from './dto/update-app.dto';

/**
 * AppsService - CRUD de aplicações usando tabela ari_apps do MySQL
 *
 * Tabela: ari_apps
 * Campos: id, name, display_name, icon, description, is_active, created_at, updated_at
 */
@Injectable()
export class AppsService {
  private readonly logger = new Logger(AppsService.name);

  constructor(private readonly db: BaseConfigService) {}

  async findAll(includeInactive = false) {
    const whereClause = includeInactive ? '' : 'WHERE a.is_active = 1';

    const apps = await this.db.query(
      `SELECT
        a.id,
        a.name,
        a.display_name as displayName,
        a.icon,
        a.description,
        a.is_active as isActive,
        a.created_at as createdAt,
        a.updated_at as updatedAt,
        (SELECT COUNT(*) FROM ari_pages WHERE app_id = a.id) as pagesCount,
        (SELECT COUNT(*) FROM ari_pages WHERE app_id = a.id AND is_active = 1) as activePagesCount
      FROM ari_apps a
      ${whereClause}
      ORDER BY a.name ASC`
    );

    return apps.map(app => ({
      id: app.id,
      name: app.name,
      displayName: app.displayName,
      icon: app.icon,
      description: app.description,
      isActive: app.isActive === 1,
      createdAt: app.createdAt,
      updatedAt: app.updatedAt,
      pagesCount: app.pagesCount || 0,
      activePagesCount: app.activePagesCount || 0,
    }));
  }

  async findOne(id: number) {
    const app = await this.db.queryOne(
      `SELECT
        id,
        name,
        display_name as displayName,
        icon,
        description,
        is_active as isActive,
        created_at as createdAt,
        updated_at as updatedAt
      FROM ari_apps
      WHERE id = ?`,
      [id]
    );

    if (!app) {
      throw new NotFoundException(`App ${id} não encontrado`);
    }

    // Get pages of this app
    const pages = await this.db.query(
      `SELECT
        id,
        name,
        display_name as displayName,
        path,
        category,
        icon,
        is_active as isActive,
        \`order\`
      FROM ari_pages
      WHERE app_id = ?
      ORDER BY \`order\` ASC, name ASC`,
      [id]
    );

    return {
      id: app.id,
      name: app.name,
      displayName: app.displayName,
      icon: app.icon,
      description: app.description,
      isActive: app.isActive === 1,
      createdAt: app.createdAt,
      updatedAt: app.updatedAt,
      pages: pages.map(p => ({
        id: p.id,
        name: p.name,
        displayName: p.displayName,
        path: p.path,
        category: p.category,
        icon: p.icon,
        isActive: p.isActive === 1,
        order: p.order,
      })),
    };
  }

  async create(dto: CreateAppDto) {
    // Check if app name already exists
    const existing = await this.db.queryOne(
      'SELECT id FROM ari_apps WHERE name = ?',
      [dto.name]
    );

    if (existing) {
      throw new ConflictException('Nome de app já existe');
    }

    const insertId = await this.db.insert('ari_apps', {
      name: dto.name,
      display_name: dto.displayName,
      icon: dto.icon || null,
      description: dto.description || null,
      is_active: dto.isActive !== false ? 1 : 0,
    });

    this.logger.log(`App criado: ${dto.name} (ID: ${insertId})`);

    return this.findOne(insertId);
  }

  async update(id: number, dto: UpdateAppDto) {
    const existing = await this.db.queryOne(
      'SELECT id, name FROM ari_apps WHERE id = ?',
      [id]
    );

    if (!existing) {
      throw new NotFoundException(`App ${id} não encontrado`);
    }

    // Check if new name conflicts
    if (dto.name && dto.name !== existing.name) {
      const nameExists = await this.db.queryOne(
        'SELECT id FROM ari_apps WHERE name = ? AND id != ?',
        [dto.name, id]
      );

      if (nameExists) {
        throw new ConflictException('Nome de app já existe');
      }
    }

    const updateData: Record<string, any> = {};
    if (dto.name) updateData.name = dto.name;
    if (dto.displayName) updateData.display_name = dto.displayName;
    if (dto.icon !== undefined) updateData.icon = dto.icon || null;
    if (dto.description !== undefined) updateData.description = dto.description || null;
    if (dto.isActive !== undefined) updateData.is_active = dto.isActive ? 1 : 0;

    if (Object.keys(updateData).length > 0) {
      await this.db.update('ari_apps', updateData, 'id = ?', [id]);
      this.logger.log(`App atualizado: ID ${id}`);
    }

    return this.findOne(id);
  }

  async remove(id: number) {
    const app = await this.db.queryOne(
      'SELECT id, name FROM ari_apps WHERE id = ?',
      [id]
    );

    if (!app) {
      throw new NotFoundException(`App ${id} não encontrado`);
    }

    // Check if there are pages linked to this app
    const pagesCount = await this.db.queryOne<{ count: number }>(
      'SELECT COUNT(*) as count FROM ari_pages WHERE app_id = ?',
      [id]
    );

    if (pagesCount?.count > 0) {
      throw new BadRequestException(
        `App possui ${pagesCount.count} página(s) vinculada(s). Remova as páginas primeiro.`
      );
    }

    await this.db.delete('ari_apps', 'id = ?', [id]);

    this.logger.log(`App removido: ${app.name} (ID: ${id})`);

    return { message: 'App removido com sucesso' };
  }

  async toggleStatus(id: number) {
    const app = await this.db.queryOne(
      'SELECT id, name, is_active as isActive FROM ari_apps WHERE id = ?',
      [id]
    );

    if (!app) {
      throw new NotFoundException(`App ${id} não encontrado`);
    }

    const newStatus = app.isActive === 1 ? 0 : 1;
    await this.db.update('ari_apps', { is_active: newStatus }, 'id = ?', [id]);

    this.logger.log(`App ${newStatus ? 'ativado' : 'desativado'}: ${app.name} (ID: ${id})`);

    return {
      id,
      isActive: newStatus === 1,
      message: newStatus === 1 ? 'App ativado' : 'App desativado',
    };
  }

  async getPages(id: number) {
    const app = await this.db.queryOne(
      'SELECT id FROM ari_apps WHERE id = ?',
      [id]
    );

    if (!app) {
      throw new NotFoundException(`App ${id} não encontrado`);
    }

    const pages = await this.db.query(
      `SELECT
        id,
        name,
        display_name as displayName,
        path,
        category,
        icon,
        description,
        is_active as isActive,
        \`order\`,
        created_at as createdAt,
        updated_at as updatedAt
      FROM ari_pages
      WHERE app_id = ?
      ORDER BY \`order\` ASC, name ASC`,
      [id]
    );

    return pages.map(p => ({
      id: p.id,
      name: p.name,
      displayName: p.displayName,
      path: p.path,
      category: p.category,
      icon: p.icon,
      description: p.description,
      isActive: p.isActive === 1,
      order: p.order,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    }));
  }
}
