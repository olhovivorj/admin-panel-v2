import { Injectable, Logger } from '@nestjs/common';
import { BaseConfigService } from '../../config/base-config.service';

export interface SyncConfig {
  id: number;
  tipo: string;
  cron_expression: string;
  habilitado: boolean;
  atualizado_em?: Date;
  atualizado_por?: string;
  proxima_execucao?: string;
}

export interface WatchdogConfig {
  ativo: boolean;
  intervalo: number;
  lote: number;
  horaInicio: string;
  horaFim: string;
  ultimaExec: Date | null;
}

export interface ZvcConfig {
  ativo: boolean;
  horario: string;
  diasAtras: number;
  limite: number;
  gruposExcluidos: string;
  dataInicio: Date | null;
  ultimaExec: Date | null;
}

export interface SchedulerLog {
  id: number;
  base_id: number;
  tipo: string;
  dt_inicio: Date;
  dt_fim: Date | null;
  status: string;
  processados: number;
  sucesso: number;
  erro: number;
  erro_msg: string | null;
  usuario: string;
}

export interface SchedulerStats {
  total: number;
  sucesso: number;
  erro: number;
  executando: number;
}

@Injectable()
export class SchedulesService {
  private readonly logger = new Logger(SchedulesService.name);

  constructor(private readonly db: BaseConfigService) {}

  /**
   * Buscar todas as configurações de sync (zeiss_sync_config)
   */
  async getSyncConfigs(): Promise<SyncConfig[]> {
    try {
      const configs = await this.db.query<SyncConfig>(
        `SELECT id, tipo, cron_expression, habilitado, atualizado_em, atualizado_por
         FROM zeiss_sync_config
         ORDER BY tipo`,
      );
      return configs || [];
    } catch (error) {
      this.logger.error('Erro ao buscar sync configs:', error);
      return [];
    }
  }

  /**
   * Buscar configuração de sync por tipo
   */
  async getSyncConfigByTipo(tipo: string): Promise<SyncConfig | null> {
    const config = await this.db.queryOne<SyncConfig>(
      `SELECT * FROM zeiss_sync_config WHERE tipo = ?`,
      [tipo],
    );
    return config || null;
  }

  /**
   * Atualizar configuração de sync
   */
  async updateSyncConfig(
    tipo: string,
    data: { cron_expression?: string; habilitado?: boolean },
    usuario: string,
  ): Promise<SyncConfig | null> {
    const updates: string[] = [];
    const values: any[] = [];

    if (data.cron_expression !== undefined) {
      updates.push('cron_expression = ?');
      values.push(data.cron_expression);
    }
    if (data.habilitado !== undefined) {
      updates.push('habilitado = ?');
      values.push(data.habilitado ? 1 : 0);
    }

    if (updates.length === 0) return null;

    updates.push('atualizado_em = NOW()');
    updates.push('atualizado_por = ?');
    values.push(usuario);
    values.push(tipo);

    await this.db.query(
      `UPDATE zeiss_sync_config SET ${updates.join(', ')} WHERE tipo = ?`,
      values,
    );

    return this.getSyncConfigByTipo(tipo);
  }

  /**
   * Criar configuração de sync se não existir
   */
  async createSyncConfigIfNotExists(
    tipo: string,
    cron_expression: string,
  ): Promise<void> {
    await this.db.query(
      `INSERT IGNORE INTO zeiss_sync_config (tipo, cron_expression, habilitado)
       VALUES (?, ?, 1)`,
      [tipo, cron_expression],
    );
  }

  /**
   * Buscar configuração do watchdog por base
   */
  async getWatchdogConfig(baseId: number): Promise<WatchdogConfig> {
    const config = await this.db.queryOne<any>(
      `SELECT
        COALESCE(ZEISS_WATCHDOG_ATIVO, 1) as ativo,
        COALESCE(ZEISS_WATCHDOG_INTERVALO, 5) as intervalo,
        COALESCE(ZEISS_WATCHDOG_LOTE, 10) as lote,
        COALESCE(ZEISS_WATCHDOG_HORA_INICIO, '00:00:00') as horaInicio,
        COALESCE(ZEISS_WATCHDOG_HORA_FIM, '23:59:59') as horaFim,
        ZEISS_WATCHDOG_ULTIMA_EXEC as ultimaExec
       FROM base_config
       WHERE id_base = ?`,
      [baseId],
    );

    return config || {
      ativo: true,
      intervalo: 5,
      lote: 10,
      horaInicio: '00:00:00',
      horaFim: '23:59:59',
      ultimaExec: null,
    };
  }

  /**
   * Atualizar configuração do watchdog
   */
  async updateWatchdogConfig(
    baseId: number,
    data: Partial<WatchdogConfig>,
  ): Promise<WatchdogConfig> {
    const updates: string[] = [];
    const values: any[] = [];

    if (data.ativo !== undefined) {
      updates.push('ZEISS_WATCHDOG_ATIVO = ?');
      values.push(data.ativo ? 1 : 0);
    }
    if (data.intervalo !== undefined) {
      updates.push('ZEISS_WATCHDOG_INTERVALO = ?');
      values.push(data.intervalo);
    }
    if (data.lote !== undefined) {
      updates.push('ZEISS_WATCHDOG_LOTE = ?');
      values.push(data.lote);
    }
    if (data.horaInicio !== undefined) {
      updates.push('ZEISS_WATCHDOG_HORA_INICIO = ?');
      values.push(data.horaInicio);
    }
    if (data.horaFim !== undefined) {
      updates.push('ZEISS_WATCHDOG_HORA_FIM = ?');
      values.push(data.horaFim);
    }

    if (updates.length > 0) {
      values.push(baseId);
      await this.db.query(
        `UPDATE base_config SET ${updates.join(', ')} WHERE id_base = ?`,
        values,
      );
    }

    return this.getWatchdogConfig(baseId);
  }

  /**
   * Buscar configuração do ZVC por base
   */
  async getZvcConfig(baseId: number): Promise<ZvcConfig> {
    const config = await this.db.queryOne<any>(
      `SELECT
        COALESCE(ZEISS_ZVC_SYNC_HABILITADO, 1) as ativo,
        COALESCE(ZEISS_ZVC_HORARIO, '03:00:00') as horario,
        COALESCE(ZEISS_ZVC_DIAS_ATRAS, 7) as diasAtras,
        COALESCE(ZEISS_ZVC_LIMITE, 100) as limite,
        COALESCE(ZEISS_ZVC_GRUPOS_EXCLUIDOS, '') as gruposExcluidos,
        ZEISS_ZVC_DATA_INICIO as dataInicio,
        ZEISS_ZVC_ULTIMA_EXEC as ultimaExec
       FROM base_config
       WHERE id_base = ?`,
      [baseId],
    );

    return config || {
      ativo: true,
      horario: '03:00:00',
      diasAtras: 7,
      limite: 100,
      gruposExcluidos: '',
      dataInicio: null,
      ultimaExec: null,
    };
  }

  /**
   * Atualizar configuração do ZVC
   */
  async updateZvcConfig(
    baseId: number,
    data: Partial<ZvcConfig>,
  ): Promise<ZvcConfig> {
    const updates: string[] = [];
    const values: any[] = [];

    if (data.ativo !== undefined) {
      updates.push('ZEISS_ZVC_SYNC_HABILITADO = ?');
      values.push(data.ativo ? 1 : 0);
    }
    if (data.horario !== undefined) {
      updates.push('ZEISS_ZVC_HORARIO = ?');
      values.push(data.horario);
    }
    if (data.diasAtras !== undefined) {
      updates.push('ZEISS_ZVC_DIAS_ATRAS = ?');
      values.push(data.diasAtras);
    }
    if (data.limite !== undefined) {
      updates.push('ZEISS_ZVC_LIMITE = ?');
      values.push(data.limite);
    }
    if (data.gruposExcluidos !== undefined) {
      updates.push('ZEISS_ZVC_GRUPOS_EXCLUIDOS = ?');
      values.push(data.gruposExcluidos);
    }
    if (data.dataInicio !== undefined) {
      updates.push('ZEISS_ZVC_DATA_INICIO = ?');
      values.push(data.dataInicio);
    }

    if (updates.length > 0) {
      values.push(baseId);
      await this.db.query(
        `UPDATE base_config SET ${updates.join(', ')} WHERE id_base = ?`,
        values,
      );
    }

    return this.getZvcConfig(baseId);
  }

  /**
   * Buscar logs de execução de schedulers
   */
  async getSchedulerLogs(
    baseId?: number,
    tipo?: string,
    limit = 50,
  ): Promise<SchedulerLog[]> {
    let sql = `
      SELECT id, base_id, tipo, dt_inicio, dt_fim, status,
             processados, sucesso, erro, erro_msg, usuario
      FROM zeiss_scheduler_log
      WHERE 1=1
    `;
    const params: any[] = [];

    if (baseId) {
      sql += ' AND base_id = ?';
      params.push(baseId);
    }
    if (tipo) {
      sql += ' AND tipo = ?';
      params.push(tipo);
    }

    sql += ' ORDER BY dt_inicio DESC LIMIT ?';
    params.push(limit);

    const logs = await this.db.query<SchedulerLog>(sql, params);
    return logs || [];
  }

  /**
   * Buscar estatísticas gerais dos schedulers
   */
  async getSchedulerStats(baseId?: number): Promise<SchedulerStats> {
    let sql = `
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'SUCESSO' THEN 1 ELSE 0 END) as sucesso,
        SUM(CASE WHEN status = 'ERRO' THEN 1 ELSE 0 END) as erro,
        SUM(CASE WHEN status = 'EXECUTANDO' THEN 1 ELSE 0 END) as executando
      FROM zeiss_scheduler_log
      WHERE dt_inicio >= DATE_SUB(NOW(), INTERVAL 30 DAY)
    `;
    const params: any[] = [];

    if (baseId) {
      sql += ' AND base_id = ?';
      params.push(baseId);
    }

    const stats = await this.db.queryOne<SchedulerStats>(sql, params);
    return stats || { total: 0, sucesso: 0, erro: 0, executando: 0 };
  }

  /**
   * Buscar configurações completas de uma base
   */
  async getBaseSchedulerConfig(baseId: number) {
    const [watchdog, zvc] = await Promise.all([
      this.getWatchdogConfig(baseId),
      this.getZvcConfig(baseId),
    ]);

    return { watchdog, zvc };
  }

  /**
   * Toggle ativo/inativo de um scheduler por base
   */
  async toggleScheduler(
    baseId: number,
    tipo: 'watchdog' | 'zvc',
  ): Promise<{ ativo: boolean }> {
    if (tipo === 'watchdog') {
      await this.db.query(
        `UPDATE base_config
         SET ZEISS_WATCHDOG_ATIVO = NOT COALESCE(ZEISS_WATCHDOG_ATIVO, 1)
         WHERE id_base = ?`,
        [baseId],
      );
      const config = await this.getWatchdogConfig(baseId);
      return { ativo: config.ativo };
    } else {
      await this.db.query(
        `UPDATE base_config
         SET ZEISS_ZVC_SYNC_HABILITADO = NOT COALESCE(ZEISS_ZVC_SYNC_HABILITADO, 1)
         WHERE id_base = ?`,
        [baseId],
      );
      const config = await this.getZvcConfig(baseId);
      return { ativo: config.ativo };
    }
  }
}
