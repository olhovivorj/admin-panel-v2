import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PermissionsService } from './permissions.service';

/**
 * PermissionsController - Lista páginas/permissões do sistema
 *
 * Páginas são cadastradas diretamente no banco (ari_pages)
 * Este controller apenas lista as permissões disponíveis
 */
@ApiTags('permissions')
@ApiBearerAuth()
@Controller('permissions')
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Get()
  @ApiOperation({ summary: 'Listar todas as páginas/permissões' })
  async findAll() {
    return this.permissionsService.findAll();
  }

  @Get('grouped')
  @ApiOperation({ summary: 'Listar permissões agrupadas por app' })
  async findGrouped() {
    return this.permissionsService.findGrouped();
  }

  @Get('apps')
  @ApiOperation({ summary: 'Listar apps disponíveis' })
  async getApps() {
    return this.permissionsService.getApps();
  }

  @Get('app/:appId')
  @ApiOperation({ summary: 'Listar permissões de um app específico' })
  async findByApp(@Param('appId', ParseIntPipe) appId: number) {
    return this.permissionsService.findByApp(appId);
  }
}
