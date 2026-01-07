import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import * as mysql from 'mysql2/promise';

/**
 * Serviço de Configuração
 *
 * IMPORTANTE: Usa APENAS a tabela base_config (definitivo desde 2025-10-24)
 * Tabela `base` foi descontinuada para configurações Firebird/Zeiss
 *
 * Baseado em: zeiss-api-client/src/config/base-config.service.ts
 */
@Injectable()
export class BaseConfigService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(BaseConfigService.name);
  private pool: mysql.Pool;

  async onModuleInit() {
    this.pool = mysql.createPool({
      host: process.env.DATABASE_HOST || 'localhost',
      port: parseInt(process.env.DATABASE_PORT) || 3306,
      user: process.env.DATABASE_USER || 'root',
      password: process.env.DATABASE_PASSWORD || '',
      database: process.env.DATABASE_NAME || 'ariusers',

      // Pool configuration
      connectionLimit: 10,
      waitForConnections: true,
      queueLimit: 0,

      // Keep-alive TCP (evita ECONNRESET)
      enableKeepAlive: true,
      keepAliveInitialDelay: 30000, // 30s

      // Timeouts
      connectTimeout: 10000,
    });

    // Warm-up: testa conexão ao criar
    this.pool.on('connection', (connection) => {
      connection.query('SELECT 1');
      this.logger.debug('Nova conexão MySQL criada e testada');
    });

    this.logger.log('MySQL connection pool criado (max: 10, keep-alive: 30s)');
  }

  /**
   * Retry logic com backoff exponencial
   */
  private async executeWithRetry<T>(
    operation: () => Promise<T>,
    retries = 3,
    operationName = 'Query'
  ): Promise<T> {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        const isLastAttempt = attempt === retries;
        const isConnectionError =
          error.code === 'ECONNRESET' ||
          error.code === 'ETIMEDOUT' ||
          error.code === 'PROTOCOL_CONNECTION_LOST';

        if (isConnectionError && !isLastAttempt) {
          const backoff = Math.min(100 * Math.pow(2, attempt - 1), 1000);
          this.logger.warn(
            `${operationName} falhou (${error.code}), tentativa ${attempt}/${retries}. Aguardando ${backoff}ms...`
          );
          await new Promise(r => setTimeout(r, backoff));
          continue;
        }

        throw error;
      }
    }
  }

  /**
   * Testa conexão MySQL (health check) com retry automático
   */
  async testConnection(): Promise<void> {
    await this.executeWithRetry(
      () => this.pool.execute('SELECT 1'),
      3,
      'testConnection'
    );
  }

  /**
   * Atualiza configurações da base
   */
  async updateConfig(ID_BASE: number, updateData: Record<string, any>) {
    try {
      const setClauses = Object.keys(updateData).map(key => `${key} = ?`).join(', ');
      const values = Object.values(updateData);
      values.push(ID_BASE);

      await this.pool.execute(
        `UPDATE base_config SET ${setClauses} WHERE ID_BASE = ?`,
        values
      );

      const [rows] = await this.pool.execute(
        'SELECT * FROM base_config WHERE ID_BASE = ?',
        [ID_BASE]
      );

      return (rows as any[])[0];
    } catch (error) {
      this.logger.error(`Erro ao atualizar configurações da base ${ID_BASE}:`, error);
      throw error;
    }
  }

  /**
   * Busca configurações da base
   */
  async getConfig(ID_BASE: number, selectFields?: string[]) {
    try {
      const fields = selectFields && selectFields.length > 0 ? selectFields.join(', ') : '*';
      const [rows] = await this.pool.execute(
        `SELECT ${fields} FROM base_config WHERE ID_BASE = ?`,
        [ID_BASE]
      );

      const baseConfig = (rows as any[])[0];

      if (!baseConfig) {
        throw new Error(`Configuração não encontrada para base ${ID_BASE} em base_config`);
      }

      this.logger.log(`Configurações carregadas de base_config para base ${ID_BASE}`);

      return {
        ...baseConfig,
        _source: 'base_config'
      };

    } catch (error) {
      this.logger.error(`Erro ao buscar configurações para base ${ID_BASE}:`, error);
      throw error;
    }
  }

  /**
   * Busca usuário por email na tabela ariusers
   */
  async getUserByEmail(email: string) {
    try {
      const [rows] = await this.pool.execute(
        `SELECT
          id,
          email,
          senha,
          nome,
          ID_BASE,
          funcao,
          role_id,
          plan_id,
          tipo_usuario,
          ativo
        FROM ariusers
        WHERE email = ?
        LIMIT 1`,
        [email]
      );

      return (rows as any[])[0];
    } catch (error) {
      this.logger.error(`Erro ao buscar usuário ${email}:`, error);
      throw error;
    }
  }

  /**
   * Busca nome da base por ID
   */
  async getBaseName(ID_BASE: number): Promise<string> {
    try {
      const [rows] = await this.pool.execute(
        'SELECT NOME FROM base WHERE ID_BASE = ? LIMIT 1',
        [ID_BASE]
      );

      const baseData = (rows as any[])[0];
      return baseData?.NOME || `Base ${ID_BASE}`;
    } catch (error) {
      this.logger.warn(`Erro ao buscar nome da base ${ID_BASE}:`, error);
      return `Base ${ID_BASE}`;
    }
  }

  /**
   * Busca dados do plano do usuário (ari_plans)
   */
  async getPlanData(plan_id: number) {
    try {
      const [rows] = await this.pool.execute(
        `SELECT id, name, display_name, plan_type
        FROM ari_plans
        WHERE id = ?
        LIMIT 1`,
        [plan_id]
      );

      return (rows as any[])[0];
    } catch (error) {
      this.logger.error(`Erro ao buscar plano ${plan_id}:`, error);
      return null;
    }
  }

  /**
   * Busca páginas do plano (ari_plan_pages + ari_pages + ari_apps)
   */
  async getPlanPages(plan_id: number) {
    try {
      const [rows] = await this.pool.execute(
        `SELECT
          p.id,
          p.name,
          p.path,
          p.category,
          p.app_id,
          a.name as app_name,
          a.display_name as app_display_name,
          a.icon as app_icon
        FROM ari_plan_pages pp
        JOIN ari_pages p ON pp.page_id = p.id
        LEFT JOIN ari_apps a ON p.app_id = a.id
        WHERE pp.plan_id = ?
        AND p.is_active = 1
        ORDER BY a.name, p.category, p.name`,
        [plan_id]
      );

      return rows as any[];
    } catch (error) {
      this.logger.error(`Erro ao buscar páginas do plano ${plan_id}:`, error);
      return [];
    }
  }

  /**
   * Atualizar último acesso do usuário
   */
  async updateLastAccess(userId: number): Promise<void> {
    try {
      await this.pool.execute(
        `UPDATE ariusers
        SET
          ultimo_acesso = NOW(),
          access_count = COALESCE(access_count, 0) + 1
        WHERE id = ?`,
        [userId]
      );
    } catch (error) {
      this.logger.warn(`Erro ao atualizar último acesso: ${error.message}`);
    }
  }

  /**
   * Busca informações de permissões do usuário
   */
  async getUserPermissions(user_id: number) {
    try {
      const [rows] = await this.pool.execute(
        `SELECT
          u.id,
          u.email,
          u.nome,
          u.role_id,
          u.plan_id,
          r.name as role_name,
          r.permissions as role_permissions,
          p.name as plan_name,
          p.limits as plan_limits,
          p.features as plan_features
        FROM ariusers u
        LEFT JOIN roles r ON u.role_id = r.id
        LEFT JOIN plans p ON u.plan_id = p.id
        WHERE u.id = ?
        LIMIT 1`,
        [user_id]
      );

      return (rows as any[])[0];
    } catch (error) {
      this.logger.error(`Erro ao buscar permissões do usuário ${user_id}:`, error);
      return null;
    }
  }

  /**
   * Executa query SQL genérica
   * @param sql - Query SQL
   * @param params - Parâmetros
   * @returns Resultado da query
   *
   * NOTA: Usa pool.query() ao invés de pool.execute() porque:
   * - execute() usa prepared statements com restrições de tipos
   * - LIMIT/OFFSET como placeholders pode falhar com execute() em algumas versões MySQL
   * - query() faz escape seguro dos valores e funciona universalmente
   */
  async query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    const [rows] = await this.pool.query(sql, params);
    return rows as T[];
  }

  /**
   * Executa query SQL e retorna o primeiro resultado
   */
  async queryOne<T = any>(sql: string, params: any[] = []): Promise<T | null> {
    const rows = await this.query<T>(sql, params);
    return rows[0] || null;
  }

  /**
   * Executa INSERT e retorna o insertId
   */
  async insert(table: string, data: Record<string, any>): Promise<number> {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const placeholders = keys.map(() => '?').join(', ');

    const sql = `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders})`;
    const [result] = await this.pool.query(sql, values);
    return (result as any).insertId;
  }

  /**
   * Executa UPDATE
   */
  async update(table: string, data: Record<string, any>, where: string, whereParams: any[]): Promise<number> {
    const setClauses = Object.keys(data).map(key => `${key} = ?`).join(', ');
    const values = [...Object.values(data), ...whereParams];

    const sql = `UPDATE ${table} SET ${setClauses} WHERE ${where}`;
    const [result] = await this.pool.query(sql, values);
    return (result as any).affectedRows;
  }

  /**
   * Executa DELETE
   */
  async delete(table: string, where: string, whereParams: any[]): Promise<number> {
    const sql = `DELETE FROM ${table} WHERE ${where}`;
    const [result] = await this.pool.query(sql, whereParams);
    return (result as any).affectedRows;
  }

  async onModuleDestroy() {
    if (this.pool) {
      await this.pool.end();
      this.logger.log('MySQL connection pool fechado');
    }
  }
}
