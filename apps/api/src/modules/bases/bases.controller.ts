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

  @Post(':id/test-firebird')
  @ApiOperation({ summary: 'Testar conexao Firebird' })
  async testFirebirdConnection(@Param('id', ParseIntPipe) id: number) {
    return this.basesService.testFirebirdConnection(id);
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
}
