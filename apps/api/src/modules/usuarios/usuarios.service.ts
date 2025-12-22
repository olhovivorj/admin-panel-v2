import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { BaseConfigService } from '../../config/base-config.service';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

/**
 * UsuariosService - CRUD de usuários usando tabela ariusers do MySQL
 *
 * Tabela: ariusers
 * Campos principais: id, email, senha, nome, ID_BASE, funcao, role_id, plan_id, ativo
 */
@Injectable()
export class UsuariosService {
  private readonly logger = new Logger(UsuariosService.name);

  constructor(private readonly db: BaseConfigService) {}

  async findAll(page = 1, limit = 10, search?: string, baseId?: number) {
    const offset = (page - 1) * limit;

    let whereClause = '1=1';
    const params: any[] = [];

    if (search) {
      whereClause += ' AND (nome LIKE ? OR email LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    if (baseId) {
      whereClause += ' AND ID_BASE = ?';
      params.push(baseId);
    }

    // Query com paginação
    const items = await this.db.query(
      `SELECT
        u.id,
        u.email,
        u.nome,
        u.telefone,
        u.ID_BASE as baseId,
        b.NOME as baseName,
        u.funcao,
        u.role_id,
        r.name as roleName,
        r.display_name as roleDisplayName,
        u.plan_id,
        p.name as planName,
        u.ativo,
        u.ultimo_acesso as lastLogin,
        u.criado_em as createdAt,
        u.atualizado_em as updatedAt
      FROM ariusers u
      LEFT JOIN base b ON u.ID_BASE = b.ID_BASE
      LEFT JOIN ari_roles r ON u.role_id = r.id
      LEFT JOIN ari_plans p ON u.plan_id = p.id
      WHERE ${whereClause}
      ORDER BY u.criado_em DESC
      LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    // Count total
    const countResult = await this.db.queryOne<{ total: number }>(
      `SELECT COUNT(*) as total FROM ariusers u WHERE ${whereClause}`,
      params
    );

    const total = countResult?.total || 0;

    return {
      items: items.map(user => ({
        id: user.id,
        email: user.email,
        nome: user.nome,
        telefone: user.telefone,
        baseId: user.baseId,
        baseName: user.baseName,
        funcao: user.funcao,
        role: user.role_id ? {
          id: user.role_id,
          name: user.roleName,
          displayName: user.roleDisplayName,
        } : null,
        plan: user.plan_id ? {
          id: user.plan_id,
          name: user.planName,
        } : null,
        ativo: user.ativo === 1,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      })),
      total,
      page,
      pageSize: limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: number) {
    const user = await this.db.queryOne(
      `SELECT
        u.id,
        u.email,
        u.nome,
        u.telefone,
        u.ID_BASE as baseId,
        b.NOME as baseName,
        u.funcao,
        u.role_id,
        r.name as roleName,
        r.display_name as roleDisplayName,
        u.plan_id,
        p.name as planName,
        p.display_name as planDisplayName,
        u.ativo,
        u.ultimo_acesso as lastLogin,
        u.criado_em as createdAt,
        u.atualizado_em as updatedAt,
        u.theme,
        u.language,
        u.preferences
      FROM ariusers u
      LEFT JOIN base b ON u.ID_BASE = b.ID_BASE
      LEFT JOIN ari_roles r ON u.role_id = r.id
      LEFT JOIN ari_plans p ON u.plan_id = p.id
      WHERE u.id = ?`,
      [id]
    );

    if (!user) {
      throw new NotFoundException(`Usuário ${id} não encontrado`);
    }

    return {
      id: user.id,
      email: user.email,
      nome: user.nome,
      telefone: user.telefone,
      baseId: user.baseId,
      baseName: user.baseName,
      funcao: user.funcao,
      role: user.role_id ? {
        id: user.role_id,
        name: user.roleName,
        displayName: user.roleDisplayName,
      } : null,
      plan: user.plan_id ? {
        id: user.plan_id,
        name: user.planName,
        displayName: user.planDisplayName,
      } : null,
      ativo: user.ativo === 1,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      theme: user.theme,
      language: user.language,
      preferences: user.preferences,
    };
  }

  async create(dto: CreateUsuarioDto) {
    // Check if email already exists
    const existingUser = await this.db.queryOne(
      'SELECT id FROM ariusers WHERE email = ?',
      [dto.email.toLowerCase()]
    );

    if (existingUser) {
      throw new ConflictException('Email já está em uso');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    // Insert user
    const insertId = await this.db.insert('ariusers', {
      email: dto.email.toLowerCase(),
      senha: hashedPassword,
      nome: dto.nome,
      telefone: dto.telefone || null,
      ID_BASE: dto.baseId,
      funcao: dto.funcao || 'user',
      role_id: dto.roleId || null,
      plan_id: dto.planId || null,
      ativo: dto.ativo !== false ? 1 : 0,
    });

    this.logger.log(`Usuário criado: ${dto.email} (ID: ${insertId})`);

    return this.findOne(insertId);
  }

  async update(id: number, dto: UpdateUsuarioDto) {
    // Check if user exists
    const existingUser = await this.db.queryOne(
      'SELECT id, email FROM ariusers WHERE id = ?',
      [id]
    );

    if (!existingUser) {
      throw new NotFoundException(`Usuário ${id} não encontrado`);
    }

    // Check if email is already used by another user
    if (dto.email && dto.email.toLowerCase() !== existingUser.email) {
      const emailExists = await this.db.queryOne(
        'SELECT id FROM ariusers WHERE email = ? AND id != ?',
        [dto.email.toLowerCase(), id]
      );

      if (emailExists) {
        throw new ConflictException('Email já está em uso');
      }
    }

    // Build update data
    const updateData: Record<string, any> = {};

    if (dto.email) updateData.email = dto.email.toLowerCase();
    if (dto.nome) updateData.nome = dto.nome;
    if (dto.telefone !== undefined) updateData.telefone = dto.telefone || null;
    if (dto.funcao) updateData.funcao = dto.funcao;
    if (dto.roleId !== undefined) updateData.role_id = dto.roleId || null;
    if (dto.planId !== undefined) updateData.plan_id = dto.planId || null;
    if (dto.baseId) updateData.ID_BASE = dto.baseId;
    if (dto.ativo !== undefined) updateData.ativo = dto.ativo ? 1 : 0;
    if (dto.theme) updateData.theme = dto.theme;
    if (dto.language) updateData.language = dto.language;

    if (Object.keys(updateData).length > 0) {
      await this.db.update('ariusers', updateData, 'id = ?', [id]);
      this.logger.log(`Usuário atualizado: ID ${id}`);
    }

    return this.findOne(id);
  }

  async remove(id: number) {
    const user = await this.db.queryOne(
      'SELECT id, email FROM ariusers WHERE id = ?',
      [id]
    );

    if (!user) {
      throw new NotFoundException(`Usuário ${id} não encontrado`);
    }

    await this.db.delete('ariusers', 'id = ?', [id]);

    this.logger.log(`Usuário removido: ${user.email} (ID: ${id})`);

    return { message: 'Usuário removido com sucesso' };
  }

  async changePassword(id: number, dto: ChangePasswordDto) {
    const user = await this.db.queryOne(
      'SELECT id, senha FROM ariusers WHERE id = ?',
      [id]
    );

    if (!user) {
      throw new NotFoundException(`Usuário ${id} não encontrado`);
    }

    // Verify current password if provided
    if (dto.currentPassword) {
      const isValid = await bcrypt.compare(dto.currentPassword, user.senha);
      if (!isValid) {
        throw new ConflictException('Senha atual incorreta');
      }
    }

    const hashedPassword = await bcrypt.hash(dto.newPassword, 10);

    await this.db.update('ariusers', { senha: hashedPassword }, 'id = ?', [id]);

    this.logger.log(`Senha alterada para usuário ID: ${id}`);

    return { message: 'Senha alterada com sucesso' };
  }

  async checkEmail(email: string, excludeId?: number) {
    let sql = 'SELECT id FROM ariusers WHERE email = ?';
    const params: any[] = [email.toLowerCase()];

    if (excludeId) {
      sql += ' AND id != ?';
      params.push(excludeId);
    }

    const user = await this.db.queryOne(sql, params);

    if (user) {
      return { available: false, message: 'Email já está em uso' };
    }

    return { available: true };
  }

  async getUserBases(id: number) {
    const user = await this.db.queryOne(
      `SELECT u.ID_BASE as baseId, b.NOME as baseName
       FROM ariusers u
       LEFT JOIN base b ON u.ID_BASE = b.ID_BASE
       WHERE u.id = ?`,
      [id]
    );

    if (!user) {
      throw new NotFoundException(`Usuário ${id} não encontrado`);
    }

    // User has only one base in ariusers
    if (user.baseId) {
      return [{
        id: user.baseId,
        nome: user.baseName,
      }];
    }

    return [];
  }

  async setUserBase(id: number, baseId: number) {
    const user = await this.db.queryOne(
      'SELECT id FROM ariusers WHERE id = ?',
      [id]
    );

    if (!user) {
      throw new NotFoundException(`Usuário ${id} não encontrado`);
    }

    await this.db.update('ariusers', { ID_BASE: baseId }, 'id = ?', [id]);

    return this.getUserBases(id);
  }

  async toggleStatus(id: number) {
    const user = await this.db.queryOne(
      'SELECT id, ativo FROM ariusers WHERE id = ?',
      [id]
    );

    if (!user) {
      throw new NotFoundException(`Usuário ${id} não encontrado`);
    }

    const newStatus = user.ativo === 1 ? 0 : 1;
    await this.db.update('ariusers', { ativo: newStatus }, 'id = ?', [id]);

    return {
      id,
      ativo: newStatus === 1,
      message: newStatus === 1 ? 'Usuário ativado' : 'Usuário desativado',
    };
  }
}
