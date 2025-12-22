import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import * as Firebird from 'node-firebird';
import { BaseConfigService } from '../../config/base-config.service';

export interface FirebirdConnection {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
}

/**
 * FirebirdService - Conexão com banco Firebird do ERP
 *
 * Usa tabela base_config (MySQL) para obter credenciais
 */
@Injectable()
export class FirebirdService {
  private readonly logger = new Logger(FirebirdService.name);

  constructor(private readonly db: BaseConfigService) {}

  async getConnectionConfig(baseId: number): Promise<FirebirdConnection> {
    // Buscar configuração na tabela base_config
    const config = await this.db.queryOne<{
      FB_HOST: string;
      FB_PORT: number;
      FB_DATABASE: string;
      FB_USER: string;
      FB_PASSWORD: string;
    }>(
      `SELECT FB_HOST, FB_PORT, FB_DATABASE, FB_USER, FB_PASSWORD
       FROM base_config
       WHERE ID_BASE = ?`,
      [baseId]
    );

    if (!config) {
      throw new BadRequestException(`Base ${baseId} não possui configuração Firebird`);
    }

    if (!config.FB_HOST || !config.FB_DATABASE) {
      throw new BadRequestException(
        `Base ${baseId} não possui configuração Firebird completa`
      );
    }

    return {
      host: config.FB_HOST,
      port: config.FB_PORT || 3050,
      database: config.FB_DATABASE,
      user: config.FB_USER || 'SYSDBA',
      password: config.FB_PASSWORD || 'masterkey',
    };
  }

  async query<T = any>(baseId: number, sql: string, params: any[] = []): Promise<T[]> {
    const config = await this.getConnectionConfig(baseId);

    return new Promise((resolve, reject) => {
      Firebird.attach(config, (err, db) => {
        if (err) {
          this.logger.error(`Erro ao conectar ao Firebird: ${err.message}`);
          reject(new BadRequestException(`Erro ao conectar: ${err.message}`));
          return;
        }

        db.query(sql, params, (err, result) => {
          db.detach();

          if (err) {
            this.logger.error(`Erro na query Firebird: ${err.message}`);
            reject(new BadRequestException(`Erro na query: ${err.message}`));
            return;
          }

          // Trim string values (Firebird CHAR fields have trailing spaces)
          const trimmedResult = (result || []).map((row: any) => {
            const trimmedRow: any = {};
            for (const key in row) {
              const value = row[key];
              trimmedRow[key] = typeof value === 'string' ? value.trim() : value;
            }
            return trimmedRow;
          });

          resolve(trimmedResult as T[]);
        });
      });
    });
  }

  async queryOne<T = any>(baseId: number, sql: string, params: any[] = []): Promise<T | null> {
    const result = await this.query<T>(baseId, sql, params);
    return result.length > 0 ? result[0] : null;
  }

  async execute(baseId: number, sql: string, params: any[] = []): Promise<void> {
    const config = await this.getConnectionConfig(baseId);

    return new Promise((resolve, reject) => {
      Firebird.attach(config, (err, db) => {
        if (err) {
          this.logger.error(`Erro ao conectar ao Firebird: ${err.message}`);
          reject(new BadRequestException(`Erro ao conectar: ${err.message}`));
          return;
        }

        db.execute(sql, params, (err) => {
          db.detach();

          if (err) {
            this.logger.error(`Erro ao executar no Firebird: ${err.message}`);
            reject(new BadRequestException(`Erro ao executar: ${err.message}`));
            return;
          }

          resolve();
        });
      });
    });
  }

  async testConnection(baseId: number): Promise<{ success: boolean; message: string }> {
    try {
      const result = await this.queryOne<{ CURRENT_TIMESTAMP: Date }>(
        baseId,
        'SELECT CURRENT_TIMESTAMP FROM RDB$DATABASE'
      );

      return {
        success: true,
        message: `Conexão OK - ${result?.CURRENT_TIMESTAMP}`,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message,
      };
    }
  }
}
