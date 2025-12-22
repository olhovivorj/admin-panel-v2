import { Injectable, Logger } from '@nestjs/common';
import { BaseConfigService } from './base-config.service';
import * as Firebird from 'node-firebird';

interface FirebirdConnection {
  ID_BASE: number;
  database: any;
  config: Firebird.Options;
  lastUsed: Date;
}

/**
 * Gerenciador de Conexões Firebird
 *
 * Baseado em: zeiss-api-client/src/config/firebird-connection-manager.service.ts
 */
@Injectable()
export class FirebirdConnectionManager {
  private readonly logger = new Logger(FirebirdConnectionManager.name);
  private connections: Map<number, FirebirdConnection> = new Map();

  constructor(
    private readonly baseConfigService: BaseConfigService
  ) {
    // Limpar conexões antigas a cada 5 minutos
    setInterval(() => this.cleanupOldConnections(), 5 * 60 * 1000);
  }

  /**
   * Validar se conexão ainda está ativa (com timeout de 3 segundos)
   */
  private async isConnectionAlive(db: any): Promise<boolean> {
    return new Promise((resolve) => {
      const timeout = setTimeout(() => resolve(false), 3000);

      try {
        db.query('SELECT 1 FROM RDB$DATABASE', [], (err: any, result: any) => {
          clearTimeout(timeout);
          resolve(!err && result !== undefined);
        });
      } catch {
        clearTimeout(timeout);
        resolve(false);
      }
    });
  }

  /**
   * Obter conexão Firebird para uma base específica
   */
  async getConnection(ID_BASE: number): Promise<any> {
    // Verificar se já existe conexão ativa
    const existing = this.connections.get(ID_BASE);
    if (existing) {
      const isAlive = await this.isConnectionAlive(existing.database);
      if (isAlive) {
        existing.lastUsed = new Date();
        this.logger.debug(`Reutilizando conexão Firebird para base ${ID_BASE}`);
        return existing.database;
      } else {
        this.logger.warn(`Conexão Firebird inativa para base ${ID_BASE}, criando nova...`);
        this.connections.delete(ID_BASE);
        try {
          existing.database.detach(() => {});
        } catch {}
      }
    }

    // Buscar credenciais usando BaseConfigService
    const config = await this.baseConfigService.getConfig(ID_BASE);
    this.logger.log(`Configuração obtida de: ${config._source}`);

    if (!config || !config.FIREBIRD_ACTIVE) {
      throw new Error(`Base ${ID_BASE} não está configurada para Firebird`);
    }

    // Log de debug das credenciais
    this.logger.log(`Configurando conexão Firebird para base ${ID_BASE}:`);
    this.logger.log(`   Host: ${config.FIREBIRD_HOST}`);
    this.logger.log(`   Port: ${config.FIREBIRD_PORT}`);
    this.logger.log(`   Database: ${config.FIREBIRD_DATABASE}`);
    this.logger.log(`   User: ${config.FIREBIRD_USER}`);
    this.logger.log(`   Password: ${config.FIREBIRD_PASSWORD ? '***existe***' : '***vazio***'}`);
    this.logger.log(`   Role: ${config.FIREBIRD_ROLE}`);
    this.logger.log(`   Origem: ${config._source}`);

    // Criar nova conexão
    const firebirdConfig: Firebird.Options = {
      host: config.FIREBIRD_HOST,
      port: config.FIREBIRD_PORT || 3050,
      database: config.FIREBIRD_DATABASE,
      user: config.FIREBIRD_USER,
      password: config.FIREBIRD_PASSWORD,
      lowercase_keys: false,
      role: config.FIREBIRD_ROLE || null,
      pageSize: 4096
    };

    return new Promise((resolve, reject) => {
      let completed = false;

      // Timeout de 10s para conectar
      const connectTimeout = setTimeout(() => {
        if (!completed) {
          completed = true;
          this.logger.error(`Timeout de 10s ao conectar Firebird para base ${ID_BASE}`);
          reject(new Error(`Timeout ao conectar Firebird (10s) - verifique a rede`));
        }
      }, 10000);

      Firebird.attach(firebirdConfig, (err, db) => {
        if (completed) return;
        completed = true;
        clearTimeout(connectTimeout);

        if (err) {
          this.logger.error(`Erro ao conectar Firebird para base ${ID_BASE}:`, err);
          reject(err);
          return;
        }

        // Armazenar conexão
        this.connections.set(ID_BASE, {
          ID_BASE,
          database: db,
          config: firebirdConfig,
          lastUsed: new Date()
        });

        this.logger.log(`Conexão Firebird estabelecida para base ${ID_BASE}`);
        resolve(db);
      });
    });
  }

  /**
   * Executar query em uma base específica
   */
  async executeQuery(ID_BASE: number, query: string, params: any[] = [], retryCount: number = 0): Promise<any> {
    const maxRetries = 2;
    const QUERY_TIMEOUT_MS = 30000;
    const db = await this.getConnection(ID_BASE);

    return new Promise((resolve, reject) => {
      let completed = false;

      const timeout = setTimeout(() => {
        if (!completed) {
          completed = true;
          this.logger.error(`Query timeout após ${QUERY_TIMEOUT_MS/1000}s: ${query.substring(0, 100)}...`);
          reject(new Error(`Query timeout após ${QUERY_TIMEOUT_MS/1000}s`));
        }
      }, QUERY_TIMEOUT_MS);

      try {
        db.query(query, params, async (err: any, result: any) => {
          if (!completed) {
            completed = true;
            clearTimeout(timeout);

            if (err) {
              const errorMsg = err.message || String(err);
              if (errorMsg.includes('lazy_count') || errorMsg.includes('Cannot set properties of undefined')) {
                this.logger.warn(`Erro lazy_count detectado, removendo conexão corrompida...`);
                this.connections.delete(ID_BASE);
                try {
                  db.detach(() => {});
                } catch {}

                if (retryCount < maxRetries) {
                  this.logger.log(`Tentando reconectar (tentativa ${retryCount + 1}/${maxRetries})...`);
                  try {
                    const retryResult = await this.executeQuery(ID_BASE, query, params, retryCount + 1);
                    resolve(retryResult);
                    return;
                  } catch (retryErr) {
                    reject(retryErr);
                    return;
                  }
                }
              }

              this.logger.error(`Erro na query para base ${ID_BASE}:`, err);
              reject(err);
              return;
            }
            resolve(result);
          }
        });
      } catch (error) {
        if (!completed) {
          completed = true;
          clearTimeout(timeout);
          this.logger.error(`Exceção ao executar query:`, error);
          reject(error);
        }
      }
    });
  }

  /**
   * Executar query (alias)
   */
  async execute(ID_BASE: number, query: string, params: any[] = []): Promise<any> {
    return this.executeQuery(ID_BASE, query, params);
  }

  /**
   * Fechar conexão de uma base específica
   */
  async closeConnection(ID_BASE: number): Promise<void> {
    const connection = this.connections.get(ID_BASE);
    if (!connection) return;

    return new Promise((resolve) => {
      connection.database.detach(() => {
        this.connections.delete(ID_BASE);
        this.logger.log(`Conexão Firebird fechada para base ${ID_BASE}`);
        resolve();
      });
    });
  }

  /**
   * Limpar conexões antigas (não usadas há mais de 30 minutos)
   */
  private async cleanupOldConnections() {
    const now = new Date();
    const maxAge = 30 * 60 * 1000;

    for (const [ID_BASE, connection] of this.connections.entries()) {
      const age = now.getTime() - connection.lastUsed.getTime();

      if (age > maxAge) {
        await this.closeConnection(ID_BASE);
        this.logger.log(`Conexão inativa removida para base ${ID_BASE}`);
      }
    }
  }

  /**
   * Fechar todas as conexões (para shutdown)
   */
  async closeAllConnections(): Promise<void> {
    const promises = Array.from(this.connections.keys()).map(ID_BASE =>
      this.closeConnection(ID_BASE)
    );

    await Promise.all(promises);
    this.logger.log('Todas as conexões Firebird foram fechadas');
  }
}
