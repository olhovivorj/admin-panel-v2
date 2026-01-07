import {
  Controller,
  Get,
  Param,
  Query,
  ParseIntPipe,
  Headers,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiHeader } from '@nestjs/swagger';
import { ErpService } from './erp.service';
import { FirebirdService } from './firebird.service';

@ApiTags('erp')
@ApiBearerAuth()
@Controller('erp')
export class ErpController {
  constructor(
    private readonly erpService: ErpService,
    private readonly firebirdService: FirebirdService,
  ) {}

  private getBaseId(baseIdHeader?: string): number {
    if (!baseIdHeader) {
      throw new BadRequestException('Header X-Base-Id e obrigatorio');
    }
    const baseId = parseInt(baseIdHeader, 10);
    if (isNaN(baseId)) {
      throw new BadRequestException('X-Base-Id deve ser um numero');
    }
    return baseId;
  }

  // ==================== PESSOAS ====================

  @Get('pessoas')
  @ApiOperation({ summary: 'Listar pessoas' })
  @ApiHeader({ name: 'X-Base-Id', required: true, description: 'ID da base' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'tipo', required: false, enum: ['F', 'J'] })
  async getPessoas(
    @Headers('x-base-id') baseIdHeader: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('tipo') tipo?: 'F' | 'J',
  ) {
    const baseId = this.getBaseId(baseIdHeader);
    return this.erpService.getPessoas(baseId, {
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
      search,
      tipo,
    });
  }

  @Get('pessoas/:id')
  @ApiOperation({ summary: 'Buscar pessoa por ID' })
  @ApiHeader({ name: 'X-Base-Id', required: true, description: 'ID da base' })
  async getPessoa(
    @Headers('x-base-id') baseIdHeader: string,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const baseId = this.getBaseId(baseIdHeader);
    return this.erpService.getPessoa(baseId, id);
  }

  @Get('pessoas/disponiveis-vinculacao')
  @ApiOperation({ summary: 'Listar pessoas disponiveis para vinculacao com usuario' })
  @ApiHeader({ name: 'X-Base-Id', required: true, description: 'ID da base' })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getPessoasDisponiveisVinculacao(
    @Headers('x-base-id') baseIdHeader: string,
    @Query('search') search?: string,
    @Query('limit') limit?: string,
  ) {
    const baseId = this.getBaseId(baseIdHeader);
    return this.erpService.getPessoasDisponiveisVinculacao(baseId, {
      search,
      limit: limit ? parseInt(limit, 10) : 20,
    });
  }

  // ==================== EMPRESAS ====================

  @Get('empresas')
  @ApiOperation({ summary: 'Listar empresas' })
  @ApiHeader({ name: 'X-Base-Id', required: true, description: 'ID da base' })
  async getEmpresas(@Headers('x-base-id') baseIdHeader: string) {
    const baseId = this.getBaseId(baseIdHeader);
    return this.erpService.getEmpresas(baseId);
  }

  @Get('empresas/:id')
  @ApiOperation({ summary: 'Buscar empresa por ID' })
  @ApiHeader({ name: 'X-Base-Id', required: true, description: 'ID da base' })
  async getEmpresa(
    @Headers('x-base-id') baseIdHeader: string,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const baseId = this.getBaseId(baseIdHeader);
    return this.erpService.getEmpresa(baseId, id);
  }

  // ==================== TEST CONNECTION ====================

  @Get('test-connection')
  @ApiOperation({ summary: 'Testar conexao Firebird' })
  @ApiHeader({ name: 'X-Base-Id', required: true, description: 'ID da base' })
  async testConnection(@Headers('x-base-id') baseIdHeader: string) {
    const baseId = this.getBaseId(baseIdHeader);
    return this.firebirdService.testConnection(baseId);
  }
}
