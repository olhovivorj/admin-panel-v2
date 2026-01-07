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
import { PagesService } from './pages.service';
import { CreatePageDto } from './dto/create-page.dto';
import { UpdatePageDto } from './dto/update-page.dto';

@ApiTags('pages')
@ApiBearerAuth()
@Controller('pages')
export class PagesController {
  constructor(private readonly pagesService: PagesService) {}

  @Get()
  @ApiOperation({ summary: 'Listar páginas' })
  @ApiQuery({ name: 'appId', required: false, type: Number })
  @ApiQuery({ name: 'includeInactive', required: false, type: Boolean })
  async findAll(
    @Query('appId') appId?: string,
    @Query('includeInactive') includeInactive?: string,
  ) {
    return this.pagesService.findAll({
      appId: appId ? parseInt(appId, 10) : undefined,
      includeInactive: includeInactive === 'true',
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar página por ID' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.pagesService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Criar página' })
  async create(@Body() dto: CreatePageDto) {
    return this.pagesService.create(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar página' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePageDto,
  ) {
    return this.pagesService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover página' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.pagesService.remove(id);
  }

  @Patch(':id/toggle-status')
  @ApiOperation({ summary: 'Ativar/desativar página' })
  async toggleStatus(@Param('id', ParseIntPipe) id: number) {
    return this.pagesService.toggleStatus(id);
  }

  @Post('reorder')
  @ApiOperation({ summary: 'Reordenar páginas' })
  async reorder(@Body() body: { pageIds: number[] }) {
    return this.pagesService.reorder(body.pageIds);
  }
}
