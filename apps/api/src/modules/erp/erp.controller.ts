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

  // ==================== PRODUTOS ====================

  @Get('produtos')
  @ApiOperation({ summary: 'Listar produtos' })
  @ApiHeader({ name: 'X-Base-Id', required: true, description: 'ID da base' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'grupoId', required: false, type: Number })
  async getProdutos(
    @Headers('x-base-id') baseIdHeader: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('grupoId') grupoId?: string,
  ) {
    const baseId = this.getBaseId(baseIdHeader);
    return this.erpService.getProdutos(baseId, {
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
      search,
      grupoId: grupoId ? parseInt(grupoId, 10) : undefined,
    });
  }

  // ==================== ESTOQUE ====================

  @Get('estoque')
  @ApiOperation({ summary: 'Consultar estoque' })
  @ApiHeader({ name: 'X-Base-Id', required: true, description: 'ID da base' })
  @ApiQuery({ name: 'empresaId', required: true, type: Number })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  async getEstoque(
    @Headers('x-base-id') baseIdHeader: string,
    @Query('empresaId') empresaIdStr: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    const baseId = this.getBaseId(baseIdHeader);
    const empresaId = parseInt(empresaIdStr, 10);

    if (isNaN(empresaId)) {
      throw new BadRequestException('empresaId e obrigatorio');
    }

    return this.erpService.getEstoque(baseId, empresaId, {
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
      search,
    });
  }

  // ==================== VENDAS ====================

  @Get('vendas')
  @ApiOperation({ summary: 'Relatorio de vendas' })
  @ApiHeader({ name: 'X-Base-Id', required: true, description: 'ID da base' })
  @ApiQuery({ name: 'empresaId', required: false, type: Number })
  @ApiQuery({ name: 'dataInicio', required: false, type: String })
  @ApiQuery({ name: 'dataFim', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getVendas(
    @Headers('x-base-id') baseIdHeader: string,
    @Query('empresaId') empresaId?: string,
    @Query('dataInicio') dataInicio?: string,
    @Query('dataFim') dataFim?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const baseId = this.getBaseId(baseIdHeader);
    return this.erpService.getVendas(baseId, {
      empresaId: empresaId ? parseInt(empresaId, 10) : undefined,
      dataInicio,
      dataFim,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
    });
  }

  // ==================== DASHBOARD ====================

  @Get('dashboard')
  @ApiOperation({ summary: 'Dados do dashboard' })
  @ApiHeader({ name: 'X-Base-Id', required: true, description: 'ID da base' })
  @ApiQuery({ name: 'empresaId', required: false, type: Number })
  async getDashboard(
    @Headers('x-base-id') baseIdHeader: string,
    @Query('empresaId') empresaId?: string,
  ) {
    const baseId = this.getBaseId(baseIdHeader);
    return this.erpService.getDashboard(
      baseId,
      empresaId ? parseInt(empresaId, 10) : undefined,
    );
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
