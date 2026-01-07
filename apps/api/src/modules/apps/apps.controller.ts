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
import { AppsService } from './apps.service';
import { CreateAppDto } from './dto/create-app.dto';
import { UpdateAppDto } from './dto/update-app.dto';

@ApiTags('apps')
@ApiBearerAuth()
@Controller('apps')
export class AppsController {
  constructor(private readonly appsService: AppsService) {}

  @Get()
  @ApiOperation({ summary: 'Listar apps' })
  @ApiQuery({ name: 'includeInactive', required: false, type: Boolean })
  async findAll(@Query('includeInactive') includeInactive?: string) {
    return this.appsService.findAll(includeInactive === 'true');
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar app por ID' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.appsService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Criar app' })
  async create(@Body() dto: CreateAppDto) {
    return this.appsService.create(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar app' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateAppDto,
  ) {
    return this.appsService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover app' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.appsService.remove(id);
  }

  @Patch(':id/toggle-status')
  @ApiOperation({ summary: 'Ativar/desativar app' })
  async toggleStatus(@Param('id', ParseIntPipe) id: number) {
    return this.appsService.toggleStatus(id);
  }

  @Get(':id/pages')
  @ApiOperation({ summary: 'Listar páginas do app' })
  async getPages(@Param('id', ParseIntPipe) id: number) {
    return this.appsService.getPages(id);
  }
}
