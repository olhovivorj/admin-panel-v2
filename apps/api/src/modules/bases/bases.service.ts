import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { BaseConfigService } from '../../config/base-config.service';
import { CreateBaseDto } from './dto/create-base.dto';
import { UpdateBaseDto } from './dto/update-base.dto';
import { FirebirdConfigDto } from './dto/firebird-config.dto';

/**
 * BasesService - CRUD de bases usando tabelas MySQL existentes
 *
 * Tabelas:
 * - base: ID_BASE, NOME, BASE, TOKEN, SRV, etc.
 * - base_config: FIREBIRD_HOST, FIREBIRD_PORT, FIREBIRD_DATABASE, etc.
 */
@Injectable()
export class BasesService {
  private readonly logger = new Logger(BasesService.name);

  constructor(private readonly db: BaseConfigService) {}

  /**
   * Lista simplificada de bases (sem estatísticas) - carregamento rápido
   */
  async findAllSimples() {
    const items = await this.db.query(
      `SELECT
        b.ID_BASE,
        b.NOME,
        b.BASE
      FROM base b
      ORDER BY b.NOME ASC`
    );

    return {
      success: true,
      data: items.map(base => ({
        ID_BASE: base.ID_BASE,
        NOME: base.NOME,
        BASE: base.BASE,
      })),
    };
  }

  async findAll(page = 1, limit = 10, search?: string) {
    const offset = (page - 1) * limit;

    let whereClause = '1=1';
    const params: any[] = [];

    if (search) {
      whereClause += ' AND (b.NOME LIKE ? OR b.BASE LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    // Query com paginação e contagem de usuários
    const items = await this.db.query(
      `SELECT
        b.ID_BASE as id,
        b.NOME as nome,
        b.BASE as codigo,
        b.TOKEN as token,
        b.SRV as servidor,
        bc.FIREBIRD_HOST as fbHost,
        bc.FIREBIRD_PORT as fbPort,
        bc.FIREBIRD_DATABASE as fbDatabase,
        bc.FIREBIRD_ACTIVE as fbActive,
        bc.CREATED_AT as createdAt,
        bc.UPDATED_AT as updatedAt,
        (SELECT COUNT(*) FROM ariusers WHERE ID_BASE = b.ID_BASE) as usuariosCount
      FROM base b
      LEFT JOIN base_config bc ON b.ID_BASE = bc.ID_BASE
      WHERE ${whereClause}
      ORDER BY b.NOME ASC
      LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    // Count total
    const countResult = await this.db.queryOne<{ total: number }>(
      `SELECT COUNT(*) as total FROM base b WHERE ${whereClause}`,
      params
    );

    const total = countResult?.total || 0;

    return {
      items: items.map(base => ({
        // Campos em MAIÚSCULO (padrão frontend)
        ID_BASE: base.id,
        NOME: base.nome,
        BASE: base.codigo,
        // Campos adicionais
        baseId: base.id,
        token: base.token,
        servidor: base.servidor,
        hasFirebirdConfig: !!(base.fbHost && base.fbDatabase),
        firebirdActive: base.fbActive === 1,
        firebird_active: base.fbActive === 1,
        firebird_status: (base.fbHost && base.fbDatabase) ? 'CONFIGURED' : 'PENDING_CONFIG',
        firebird_host: base.fbHost,
        firebird_port: base.fbPort,
        firebird_database: base.fbDatabase,
        usuariosCount: base.usuariosCount || 0,
        createdAt: base.createdAt,
        updatedAt: base.updatedAt,
      })),
      total,
      page,
      pageSize: limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: number) {
    const base = await this.db.queryOne(
      `SELECT
        b.ID_BASE as id,
        b.NOME as nome,
        b.BASE as codigo,
        b.TOKEN as token,
        b.SRV as servidor,
        bc.FIREBIRD_HOST as fbHost,
        bc.FIREBIRD_PORT as fbPort,
        bc.FIREBIRD_DATABASE as fbDatabase,
        bc.FIREBIRD_USER as fbUser,
        bc.FIREBIRD_ROLE as fbRole,
        bc.FIREBIRD_ACTIVE as fbActive,
        bc.CREATED_AT as createdAt,
        bc.UPDATED_AT as updatedAt
      FROM base b
      LEFT JOIN base_config bc ON b.ID_BASE = bc.ID_BASE
      WHERE b.ID_BASE = ?`,
      [id]
    );

    if (!base) {
      throw new NotFoundException(`Base ${id} não encontrada`);
    }

    // Buscar usuários da base
    const usuarios = await this.db.query(
      `SELECT id, nome, email, ativo, ultimo_acesso as lastLogin
       FROM ariusers
       WHERE ID_BASE = ?
       ORDER BY nome ASC`,
      [id]
    );

    return {
      id: base.id,
      nome: base.nome,
      codigo: base.codigo,
      token: base.token,
      servidor: base.servidor,
      hasFirebirdConfig: !!(base.fbHost && base.fbDatabase),
      firebirdActive: base.fbActive === 1,
      createdAt: base.createdAt,
      updatedAt: base.updatedAt,
      usuarios: usuarios.map(u => ({
        id: u.id,
        nome: u.nome,
        email: u.email,
        ativo: u.ativo === 1,
        lastLogin: u.lastLogin,
      })),
    };
  }

  async create(dto: CreateBaseDto) {
    // Check if ID_BASE already exists
    if (dto.id) {
      const existing = await this.db.queryOne(
        'SELECT ID_BASE FROM base WHERE ID_BASE = ?',
        [dto.id]
      );
      if (existing) {
        throw new BadRequestException(`Base com ID ${dto.id} já existe`);
      }
    }

    // Get next ID_BASE if not provided
    let baseId = dto.id;
    if (!baseId) {
      const maxId = await this.db.queryOne<{ maxId: number }>(
        'SELECT MAX(ID_BASE) as maxId FROM base'
      );
      baseId = (maxId?.maxId || 0) + 1;
    }

    // Insert into base
    await this.db.query(
      `INSERT INTO base (ID_BASE, NOME, BASE, TOKEN, SRV) VALUES (?, ?, ?, ?, ?)`,
      [baseId, dto.nome, dto.codigo || `BASE${baseId}`, dto.token || null, dto.servidor || 0]
    );

    // Insert into base_config
    await this.db.query(
      `INSERT INTO base_config (ID_BASE, FIREBIRD_HOST, FIREBIRD_PORT, FIREBIRD_DATABASE, FIREBIRD_USER, FIREBIRD_PASSWORD, FIREBIRD_ACTIVE)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        baseId,
        dto.fbHost || 'localhost',
        dto.fbPort || 3050,
        dto.fbDatabase || null,
        dto.fbUser || 'SYSDBA',
        dto.fbPassword || null,
        dto.fbActive ? 1 : 0,
      ]
    );

    this.logger.log(`Base criada: ${dto.nome} (ID: ${baseId})`);

    return this.findOne(baseId);
  }

  async update(id: number, dto: UpdateBaseDto) {
    const existing = await this.db.queryOne(
      'SELECT ID_BASE FROM base WHERE ID_BASE = ?',
      [id]
    );

    if (!existing) {
      throw new NotFoundException(`Base ${id} não encontrada`);
    }

    // Update base table
    const baseData: Record<string, any> = {};
    if (dto.nome) baseData.NOME = dto.nome;
    if (dto.codigo) baseData.BASE = dto.codigo;
    if (dto.token !== undefined) baseData.TOKEN = dto.token || null;
    if (dto.servidor !== undefined) baseData.SRV = dto.servidor;

    if (Object.keys(baseData).length > 0) {
      await this.db.update('base', baseData, 'ID_BASE = ?', [id]);
    }

    this.logger.log(`Base atualizada: ID ${id}`);

    return this.findOne(id);
  }

  async remove(id: number) {
    const base = await this.db.queryOne(
      'SELECT ID_BASE, NOME FROM base WHERE ID_BASE = ?',
      [id]
    );

    if (!base) {
      throw new NotFoundException(`Base ${id} não encontrada`);
    }

    // Check if there are users
    const userCount = await this.db.queryOne<{ count: number }>(
      'SELECT COUNT(*) as count FROM ariusers WHERE ID_BASE = ?',
      [id]
    );

    if (userCount?.count > 0) {
      throw new BadRequestException(
        `Base possui ${userCount.count} usuário(s) vinculado(s). Remova os usuários primeiro.`
      );
    }

    // Delete from base_config first (FK)
    await this.db.delete('base_config', 'ID_BASE = ?', [id]);
    // Delete from base
    await this.db.delete('base', 'ID_BASE = ?', [id]);

    this.logger.log(`Base removida: ${base.NOME} (ID: ${id})`);

    return { message: 'Base removida com sucesso' };
  }

  async getFirebirdConfig(id: number) {
    const config = await this.db.queryOne(
      `SELECT
        bc.FIREBIRD_HOST as fbHost,
        bc.FIREBIRD_PORT as fbPort,
        bc.FIREBIRD_DATABASE as fbDatabase,
        bc.FIREBIRD_USER as fbUser,
        bc.FIREBIRD_ROLE as fbRole,
        bc.FIREBIRD_CHARSET as fbCharset,
        bc.FIREBIRD_ACTIVE as fbActive,
        bc.FIREBIRD_PASSWORD as fbPassword
      FROM base_config bc
      WHERE bc.ID_BASE = ?`,
      [id]
    );

    if (!config) {
      throw new NotFoundException(`Configuração Firebird não encontrada para base ${id}`);
    }

    return {
      host: config.fbHost,
      port: config.fbPort,
      database: config.fbDatabase,
      user: config.fbUser,
      role: config.fbRole,
      charset: config.fbCharset,
      active: config.fbActive === 1,
      hasPassword: !!config.fbPassword,
      passwordConfigured: !!config.fbPassword,
    };
  }

  async updateFirebirdConfig(id: number, dto: FirebirdConfigDto) {
    // Check if base exists
    const base = await this.db.queryOne(
      'SELECT ID_BASE FROM base WHERE ID_BASE = ?',
      [id]
    );

    if (!base) {
      throw new NotFoundException(`Base ${id} não encontrada`);
    }

    // Check if config exists
    const configExists = await this.db.queryOne(
      'SELECT ID_BASE FROM base_config WHERE ID_BASE = ?',
      [id]
    );

    const configData: Record<string, any> = {};
    if (dto.host) configData.FIREBIRD_HOST = dto.host;
    if (dto.port) configData.FIREBIRD_PORT = dto.port;
    if (dto.database) configData.FIREBIRD_DATABASE = dto.database;
    if (dto.user) configData.FIREBIRD_USER = dto.user;
    if (dto.password) configData.FIREBIRD_PASSWORD = dto.password;
    if (dto.role !== undefined) configData.FIREBIRD_ROLE = dto.role || null;
    if (dto.active !== undefined) configData.FIREBIRD_ACTIVE = dto.active ? 1 : 0;

    if (configExists) {
      await this.db.update('base_config', configData, 'ID_BASE = ?', [id]);
    } else {
      configData.ID_BASE = id;
      await this.db.insert('base_config', configData);
    }

    this.logger.log(`Configuração Firebird atualizada para base ${id}`);

    return { message: 'Configuração Firebird atualizada com sucesso' };
  }

  async getBaseStats(id: number) {
    const base = await this.db.queryOne(
      'SELECT ID_BASE FROM base WHERE ID_BASE = ?',
      [id]
    );

    if (!base) {
      throw new NotFoundException(`Base ${id} não encontrada`);
    }

    const userCount = await this.db.queryOne<{ count: number }>(
      'SELECT COUNT(*) as count FROM ariusers WHERE ID_BASE = ?',
      [id]
    );

    const config = await this.db.queryOne(
      'SELECT FIREBIRD_HOST, FIREBIRD_DATABASE, FIREBIRD_ACTIVE FROM base_config WHERE ID_BASE = ?',
      [id]
    );

    return {
      usuariosCount: userCount?.count || 0,
      hasFirebirdConfig: !!(config?.FIREBIRD_HOST && config?.FIREBIRD_DATABASE),
      firebirdActive: config?.FIREBIRD_ACTIVE === 1,
    };
  }

  async getBaseUsuarios(id: number) {
    const base = await this.db.queryOne(
      'SELECT ID_BASE FROM base WHERE ID_BASE = ?',
      [id]
    );

    if (!base) {
      throw new NotFoundException(`Base ${id} não encontrada`);
    }

    const usuarios = await this.db.query(
      `SELECT id, nome, email, ativo, ultimo_acesso as lastLogin
       FROM ariusers
       WHERE ID_BASE = ?
       ORDER BY nome ASC`,
      [id]
    );

    return usuarios.map(u => ({
      id: u.id,
      nome: u.nome,
      email: u.email,
      ativo: u.ativo === 1,
      lastLogin: u.lastLogin,
    }));
  }

  async getAllBases() {
    const bases = await this.db.query(
      `SELECT ID_BASE as id, NOME as nome FROM base ORDER BY NOME ASC`
    );

    return bases;
  }

  /**
   * Busca lojas (empresas) do MySQL para uma base
   */
  async getLojas(baseId: number) {
    const lojas = await this.db.query(
      `SELECT
        id,
        id_empresa,
        nome_empresa,
        cnpj,
        ativo,
        dt_cadastro,
        dt_atualizacao
      FROM base_config_empresas
      WHERE id_base = ?
      ORDER BY nome_empresa`,
      [baseId]
    );

    this.logger.log(`Encontradas ${lojas.length} lojas na base ${baseId}`);

    return lojas.map((row: any) => ({
      ID_EMPRESA: row.id_empresa,
      id_empresa: row.id_empresa,
      NOME_FANTASIA: row.nome_empresa || '',
      nome_fantasia: row.nome_empresa || '',
      RAZAO_SOCIAL: row.nome_empresa || '',
      razao_social: row.nome_empresa || '',
      CNPJ: row.cnpj || '',
      cnpj: row.cnpj || '',
      DATA_INICIO: row.dt_cadastro,
      data_inicio: row.dt_cadastro,
      ATIVO: row.ativo === 'S' ? 1 : 0,
      ativo: row.ativo === 'S',
    }));
  }
}
