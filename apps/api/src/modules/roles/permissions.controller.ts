import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PermissionsService } from './permissions.service';
import { CreatePermissionDto } from './dto/create-permission.dto';

@ApiTags('permissions')
@ApiBearerAuth()
@Controller('permissions')
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Get()
  @ApiOperation({ summary: 'Listar permissoes' })
  async findAll() {
    return this.permissionsService.findAll();
  }

  @Get('grouped')
  @ApiOperation({ summary: 'Listar permissoes agrupadas por modulo' })
  async findGrouped() {
    return this.permissionsService.findGrouped();
  }

  @Post()
  @ApiOperation({ summary: 'Criar permissao' })
  async create(@Body() dto: CreatePermissionDto) {
    return this.permissionsService.create(dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover permissao' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.permissionsService.remove(id);
  }
}
