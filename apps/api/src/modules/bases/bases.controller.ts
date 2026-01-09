import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { BasesService } from './bases.service';
import { CreateBaseDto } from './dto/create-base.dto';
import { UpdateBaseDto } from './dto/update-base.dto';
import { FirebirdConfigDto } from './dto/firebird-config.dto';

@ApiTags('bases')
@ApiBearerAuth()
@Controller('bases')
export class BasesController {
  constructor(private readonly basesService: BasesService) {}

  @Get()
  @ApiOperation({ summary: 'Listar bases' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    return this.basesService.findAll(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 10,
      search,
    );
  }

  @Get('simples/list')
  @ApiOperation({ summary: 'Listar bases simples (sem estatísticas)' })
  async findAllSimples() {
    return this.basesService.findAllSimples();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar base por ID' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.basesService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Criar base' })
  async create(@Body() dto: CreateBaseDto) {
    return this.basesService.create(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar base' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateBaseDto,
  ) {
    return this.basesService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover base' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.basesService.remove(id);
  }

  @Get(':id/firebird')
  @ApiOperation({ summary: 'Buscar configuracao Firebird da base' })
  async getFirebirdConfig(@Param('id', ParseIntPipe) id: number) {
    return this.basesService.getFirebirdConfig(id);
  }

  @Put(':id/firebird-config')
  @ApiOperation({ summary: 'Atualizar configuracao Firebird' })
  async updateFirebirdConfig(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: FirebirdConfigDto,
  ) {
    return this.basesService.updateFirebirdConfig(id, dto);
  }

  @Get(':id/usuarios')
  @ApiOperation({ summary: 'Listar usuarios da base' })
  async getBaseUsuarios(@Param('id', ParseIntPipe) id: number) {
    return this.basesService.getBaseUsuarios(id);
  }

  @Get(':id/stats')
  @ApiOperation({ summary: 'Estatisticas da base' })
  async getBaseStats(@Param('id', ParseIntPipe) id: number) {
    return this.basesService.getBaseStats(id);
  }

  @Get(':id/lojas')
  @ApiOperation({ summary: 'Listar lojas (empresas) da base' })
  async getLojas(@Param('id', ParseIntPipe) id: number) {
    return this.basesService.getLojas(id);
  }

  @Get(':id/lojas/config')
  @ApiOperation({ summary: 'Listar lojas com configurações de serviços Zeiss' })
  async getLojasConfig(@Param('id', ParseIntPipe) id: number) {
    return this.basesService.getLojasConfig(id);
  }

  @Post(':id/lojas/config')
  @ApiOperation({ summary: 'Salvar configuração de uma loja' })
  async saveLojaConfig(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: {
      id_empresa: number;
      nome_empresa: string;
      cnpj?: string;
      ZEISS_USA_CATALOGO: string;
      ZEISS_USA_SAO: string;
      ZEISS_USA_ZVC: string;
      ZEISS_USA_MARKETPLACE: string;
      ZEISS_CODIGO_LOJA?: string;
      ativo?: string;
    },
  ) {
    return this.basesService.saveLojaConfig(id, data);
  }

  @Get(':id/zeiss-config')
  @ApiOperation({ summary: 'Buscar configurações Zeiss da base' })
  async getZeissConfig(@Param('id', ParseIntPipe) id: number) {
    return this.basesService.getZeissConfig(id);
  }

  @Put(':id/zeiss-config')
  @ApiOperation({ summary: 'Atualizar configurações Zeiss da base' })
  async updateZeissConfig(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: {
      precoPorCnpj?: 'S' | 'N';
      ativo?: boolean;
    },
  ) {
    return this.basesService.updateZeissConfig(id, data);
  }
}
