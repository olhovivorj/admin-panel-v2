import { Injectable, BadRequestException } from '@nestjs/common';
import * as Firebird from 'node-firebird';
import { PrismaService } from '../../database/prisma.service';

export interface FirebirdConnection {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
}

@Injectable()
export class FirebirdService {
  constructor(private readonly prisma: PrismaService) {}

  async getConnectionConfig(baseId: number): Promise<FirebirdConnection> {
    const base = await this.prisma.base.findUnique({
      where: { id: baseId },
    });

    if (!base) {
      throw new BadRequestException(`Base ${baseId} nao encontrada`);
    }

    if (!base.fbHost || !base.fbDatabase) {
      throw new BadRequestException(
        `Base ${baseId} nao possui configuracao Firebird`,
      );
    }

    return {
      host: base.fbHost,
      port: base.fbPort || 3050,
      database: base.fbDatabase,
      user: base.fbUser || 'SYSDBA',
      password: base.fbPassword || 'masterkey',
    };
  }

  async query<T = any>(baseId: number, sql: string, params: any[] = []): Promise<T[]> {
    const config = await this.getConnectionConfig(baseId);

    return new Promise((resolve, reject) => {
      Firebird.attach(config, (err, db) => {
        if (err) {
          reject(new BadRequestException(`Erro ao conectar: ${err.message}`));
          return;
        }

        db.query(sql, params, (err, result) => {
          db.detach();

          if (err) {
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
          reject(new BadRequestException(`Erro ao conectar: ${err.message}`));
          return;
        }

        db.execute(sql, params, (err) => {
          db.detach();

          if (err) {
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
        'SELECT CURRENT_TIMESTAMP FROM RDB$DATABASE',
      );

      return {
        success: true,
        message: `Conexao OK - ${result?.CURRENT_TIMESTAMP}`,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message,
      };
    }
  }
}
