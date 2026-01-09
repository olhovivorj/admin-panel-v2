import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SchedulesService, WatchdogConfig, ZvcConfig } from './schedules.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('schedules')
@ApiBearerAuth()
@Controller('schedules')
export class SchedulesController {
  constructor(private readonly schedulesService: SchedulesService) {}

  // ==================== SYNC CONFIGS ====================

  @Get('sync-configs')
  @ApiOperation({ summary: 'Listar todas as configurações de sync' })
  async getSyncConfigs() {
    return this.schedulesService.getSyncConfigs();
  }

  @Get('sync-configs/:tipo')
  @ApiOperation({ summary: 'Buscar configuração de sync por tipo' })
  async getSyncConfigByTipo(@Param('tipo') tipo: string) {
    return this.schedulesService.getSyncConfigByTipo(tipo);
  }

  @Put('sync-configs/:tipo')
  @ApiOperation({ summary: 'Atualizar configuração de sync' })
  async updateSyncConfig(
    @Param('tipo') tipo: string,
    @Body() data: { cron_expression?: string; habilitado?: boolean; descricao?: string },
    @CurrentUser() user: any,
  ) {
    const usuario = user?.email || 'admin';
    return this.schedulesService.updateSyncConfig(tipo, data, usuario);
  }

  @Post('sync-configs/:tipo/toggle')
  @ApiOperation({ summary: 'Toggle habilitado/desabilitado de sync config' })
  async toggleSyncConfig(
    @Param('tipo') tipo: string,
    @CurrentUser() user: any,
  ) {
    const config = await this.schedulesService.getSyncConfigByTipo(tipo);
    if (!config) {
      return { success: false, message: 'Configuração não encontrada' };
    }
    const usuario = user?.email || 'admin';
    return this.schedulesService.updateSyncConfig(
      tipo,
      { habilitado: !config.habilitado },
      usuario,
    );
  }

  // ==================== WATCHDOG CONFIG (POR BASE) ====================

  @Get('bases/:baseId/watchdog')
  @ApiOperation({ summary: 'Buscar configuração do watchdog da base' })
  async getWatchdogConfig(@Param('baseId', ParseIntPipe) baseId: number) {
    return this.schedulesService.getWatchdogConfig(baseId);
  }

  @Put('bases/:baseId/watchdog')
  @ApiOperation({ summary: 'Atualizar configuração do watchdog da base' })
  async updateWatchdogConfig(
    @Param('baseId', ParseIntPipe) baseId: number,
    @Body() data: Partial<WatchdogConfig>,
  ) {
    return this.schedulesService.updateWatchdogConfig(baseId, data);
  }

  @Post('bases/:baseId/watchdog/toggle')
  @ApiOperation({ summary: 'Toggle ativo/inativo do watchdog' })
  async toggleWatchdog(@Param('baseId', ParseIntPipe) baseId: number) {
    return this.schedulesService.toggleScheduler(baseId, 'watchdog');
  }

  // ==================== ZVC CONFIG (POR BASE) ====================

  @Get('bases/:baseId/zvc')
  @ApiOperation({ summary: 'Buscar configuração do ZVC da base' })
  async getZvcConfig(@Param('baseId', ParseIntPipe) baseId: number) {
    return this.schedulesService.getZvcConfig(baseId);
  }

  @Put('bases/:baseId/zvc')
  @ApiOperation({ summary: 'Atualizar configuração do ZVC da base' })
  async updateZvcConfig(
    @Param('baseId', ParseIntPipe) baseId: number,
    @Body() data: Partial<ZvcConfig>,
  ) {
    return this.schedulesService.updateZvcConfig(baseId, data);
  }

  @Post('bases/:baseId/zvc/toggle')
  @ApiOperation({ summary: 'Toggle ativo/inativo do ZVC' })
  async toggleZvc(@Param('baseId', ParseIntPipe) baseId: number) {
    return this.schedulesService.toggleScheduler(baseId, 'zvc');
  }

  // ==================== CONFIG COMPLETA POR BASE ====================

  @Get('bases/:baseId')
  @ApiOperation({ summary: 'Buscar todas as configurações de scheduler da base' })
  async getBaseSchedulerConfig(@Param('baseId', ParseIntPipe) baseId: number) {
    return this.schedulesService.getBaseSchedulerConfig(baseId);
  }

  // ==================== LOGS ====================

  @Get('logs')
  @ApiOperation({ summary: 'Listar logs de execução dos schedulers' })
  async getSchedulerLogs(
    @Query('baseId') baseId?: string,
    @Query('tipo') tipo?: string,
    @Query('limit') limit?: string,
  ) {
    return this.schedulesService.getSchedulerLogs(
      baseId ? parseInt(baseId, 10) : undefined,
      tipo,
      limit ? parseInt(limit, 10) : 50,
    );
  }

  // ==================== STATS ====================

  @Get('stats')
  @ApiOperation({ summary: 'Estatísticas gerais dos schedulers' })
  async getSchedulerStats(@Query('baseId') baseId?: string) {
    return this.schedulesService.getSchedulerStats(
      baseId ? parseInt(baseId, 10) : undefined,
    );
  }
}
