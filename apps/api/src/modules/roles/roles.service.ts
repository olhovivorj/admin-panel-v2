import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { BaseConfigService } from '../../config/base-config.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

/**
 * RolesService - CRUD de roles usando tabela ari_roles do MySQL
 *
 * Tabelas:
 * - ari_roles: id, name, display_name, description, priority
 * - ari_role_permissions: role_id, page_id, can_access, can_edit, can_delete
 */
@Injectable()
export class RolesService {
  private readonly logger = new Logger(RolesService.name);

  constructor(private readonly db: BaseConfigService) {}

  async findAll() {
    const roles = await this.db.query(
      `SELECT
        r.id,
        r.name,
        r.display_name as displayName,
        r.description,
        r.priority,
        r.created_at as createdAt,
        r.updated_at as updatedAt,
        (SELECT COUNT(*) FROM ariusers WHERE role_id = r.id) as usersCount,
        (SELECT COUNT(*) FROM ari_role_permissions WHERE role_id = r.id) as permissionsCount
      FROM ari_roles r
      ORDER BY r.priority DESC, r.name ASC`
    );

    return roles.map(role => ({
      id: role.id,
      name: role.name,
      displayName: role.displayName,
      description: role.description,
      priority: role.priority,
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
      usersCount: role.usersCount || 0,
      permissionsCount: role.permissionsCount || 0,
    }));
  }

  async findOne(id: number) {
    const role = await this.db.queryOne(
      `SELECT
        id,
        name,
        display_name as displayName,
        description,
        priority,
        created_at as createdAt,
        updated_at as updatedAt
      FROM ari_roles
      WHERE id = ?`,
      [id]
    );

    if (!role) {
      throw new NotFoundException(`Role ${id} não encontrada`);
    }

    // Get permissions (pages)
    const permissions = await this.db.query(
      `SELECT
        rp.page_id as pageId,
        p.name as pageName,
        p.path as pagePath,
        p.category,
        rp.can_access as canAccess,
        rp.can_edit as canEdit,
        rp.can_delete as canDelete
      FROM ari_role_permissions rp
      JOIN ari_pages p ON rp.page_id = p.id
      WHERE rp.role_id = ?
      ORDER BY p.category, p.name`,
      [id]
    );

    // Get users with this role
    const users = await this.db.query(
      `SELECT id, nome, email
       FROM ariusers
       WHERE role_id = ?
       ORDER BY nome`,
      [id]
    );

    return {
      id: role.id,
      name: role.name,
      displayName: role.displayName,
      description: role.description,
      priority: role.priority,
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
      permissions: permissions.map(p => ({
        pageId: p.pageId,
        pageName: p.pageName,
        pagePath: p.pagePath,
        category: p.category,
        canAccess: p.canAccess === 1,
        canEdit: p.canEdit === 1,
        canDelete: p.canDelete === 1,
      })),
      users: users.map(u => ({
        id: u.id,
        nome: u.nome,
        email: u.email,
      })),
    };
  }

  async create(dto: CreateRoleDto) {
    // Check if role name already exists
    const existing = await this.db.queryOne(
      'SELECT id FROM ari_roles WHERE name = ?',
      [dto.name]
    );

    if (existing) {
      throw new ConflictException('Role já existe');
    }

    const insertId = await this.db.insert('ari_roles', {
      name: dto.name,
      display_name: dto.displayName || dto.name,
      description: dto.description || null,
      priority: dto.priority || 0,
    });

    this.logger.log(`Role criada: ${dto.name} (ID: ${insertId})`);

    return this.findOne(insertId);
  }

  async update(id: number, dto: UpdateRoleDto) {
    const existing = await this.db.queryOne(
      'SELECT id, name FROM ari_roles WHERE id = ?',
      [id]
    );

    if (!existing) {
      throw new NotFoundException(`Role ${id} não encontrada`);
    }

    // Check if new name conflicts
    if (dto.name && dto.name !== existing.name) {
      const nameExists = await this.db.queryOne(
        'SELECT id FROM ari_roles WHERE name = ? AND id != ?',
        [dto.name, id]
      );

      if (nameExists) {
        throw new ConflictException('Nome de role já existe');
      }
    }

    const updateData: Record<string, any> = {};
    if (dto.name) updateData.name = dto.name;
    if (dto.displayName) updateData.display_name = dto.displayName;
    if (dto.description !== undefined) updateData.description = dto.description || null;
    if (dto.priority !== undefined) updateData.priority = dto.priority;

    if (Object.keys(updateData).length > 0) {
      await this.db.update('ari_roles', updateData, 'id = ?', [id]);
      this.logger.log(`Role atualizada: ID ${id}`);
    }

    return this.findOne(id);
  }

  async remove(id: number) {
    const role = await this.db.queryOne(
      'SELECT id, name FROM ari_roles WHERE id = ?',
      [id]
    );

    if (!role) {
      throw new NotFoundException(`Role ${id} não encontrada`);
    }

    // Check if there are users with this role
    const userCount = await this.db.queryOne<{ count: number }>(
      'SELECT COUNT(*) as count FROM ariusers WHERE role_id = ?',
      [id]
    );

    if (userCount?.count > 0) {
      throw new BadRequestException(
        `Role possui ${userCount.count} usuário(s) vinculado(s). Remova os usuários primeiro.`
      );
    }

    // Delete permissions first
    await this.db.delete('ari_role_permissions', 'role_id = ?', [id]);
    // Delete role
    await this.db.delete('ari_roles', 'id = ?', [id]);

    this.logger.log(`Role removida: ${role.name} (ID: ${id})`);

    return { message: 'Role removida com sucesso' };
  }

  async getPermissions(id: number) {
    const role = await this.db.queryOne(
      'SELECT id FROM ari_roles WHERE id = ?',
      [id]
    );

    if (!role) {
      throw new NotFoundException(`Role ${id} não encontrada`);
    }

    const permissions = await this.db.query(
      `SELECT
        rp.page_id as pageId,
        p.name as pageName,
        p.path as pagePath,
        p.category,
        rp.can_access as canAccess,
        rp.can_edit as canEdit,
        rp.can_delete as canDelete
      FROM ari_role_permissions rp
      JOIN ari_pages p ON rp.page_id = p.id
      WHERE rp.role_id = ?
      ORDER BY p.category, p.name`,
      [id]
    );

    return permissions.map(p => ({
      pageId: p.pageId,
      pageName: p.pageName,
      pagePath: p.pagePath,
      category: p.category,
      canAccess: p.canAccess === 1,
      canEdit: p.canEdit === 1,
      canDelete: p.canDelete === 1,
    }));
  }

  async setPermissions(id: number, permissions: Array<{ pageId: number; canAccess?: boolean; canEdit?: boolean; canDelete?: boolean }>) {
    const role = await this.db.queryOne(
      'SELECT id FROM ari_roles WHERE id = ?',
      [id]
    );

    if (!role) {
      throw new NotFoundException(`Role ${id} não encontrada`);
    }

    // Remove existing permissions
    await this.db.delete('ari_role_permissions', 'role_id = ?', [id]);

    // Add new permissions
    for (const perm of permissions) {
      await this.db.insert('ari_role_permissions', {
        role_id: id,
        page_id: perm.pageId,
        can_access: perm.canAccess ? 1 : 0,
        can_edit: perm.canEdit ? 1 : 0,
        can_delete: perm.canDelete ? 1 : 0,
      });
    }

    this.logger.log(`Permissões atualizadas para role ${id}: ${permissions.length} páginas`);

    return this.getPermissions(id);
  }
}
