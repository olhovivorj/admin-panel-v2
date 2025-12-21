import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Patch,
  Body,
  Param,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { UsuariosService } from './usuarios.service';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

@ApiTags('usuarios')
@ApiBearerAuth()
@Controller('usuarios')
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}

  @Get()
  @ApiOperation({ summary: 'Listar usuarios' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    return this.usuariosService.findAll(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 10,
      search,
    );
  }

  @Get('check-email')
  @ApiOperation({ summary: 'Verificar disponibilidade de email' })
  @ApiQuery({ name: 'email', required: true, type: String })
  @ApiQuery({ name: 'excludeId', required: false, type: Number })
  async checkEmail(
    @Query('email') email: string,
    @Query('excludeId') excludeId?: string,
  ) {
    return this.usuariosService.checkEmail(
      email,
      excludeId ? parseInt(excludeId, 10) : undefined,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar usuario por ID' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.usuariosService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Criar usuario' })
  async create(@Body() dto: CreateUsuarioDto) {
    return this.usuariosService.create(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar usuario' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUsuarioDto,
  ) {
    return this.usuariosService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover usuario' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.usuariosService.remove(id);
  }

  @Patch(':id/change-password')
  @ApiOperation({ summary: 'Alterar senha do usuario' })
  async changePassword(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.usuariosService.changePassword(id, dto);
  }

  @Get(':id/bases')
  @ApiOperation({ summary: 'Listar bases do usuario' })
  async getUserBases(@Param('id', ParseIntPipe) id: number) {
    return this.usuariosService.getUserBases(id);
  }

  @Post(':id/bases')
  @ApiOperation({ summary: 'Atribuir bases ao usuario' })
  async setUserBases(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { baseIds: number[] },
  ) {
    return this.usuariosService.setUserBases(id, body.baseIds);
  }
}
