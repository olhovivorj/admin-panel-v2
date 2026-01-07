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
import { PlansService } from './plans.service';
import { CreatePlanDto } from './dto/create-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';

@ApiTags('plans')
@ApiBearerAuth()
@Controller('plans')
export class PlansController {
  constructor(private readonly plansService: PlansService) {}

  @Get()
  @ApiOperation({ summary: 'Listar planos' })
  @ApiQuery({ name: 'includeInactive', required: false, type: Boolean })
  async findAll(@Query('includeInactive') includeInactive?: string) {
    return this.plansService.findAll(includeInactive === 'true');
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar plano por ID' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.plansService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Criar plano' })
  async create(@Body() dto: CreatePlanDto) {
    return this.plansService.create(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar plano' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePlanDto,
  ) {
    return this.plansService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover plano' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.plansService.remove(id);
  }

  @Patch(':id/toggle-status')
  @ApiOperation({ summary: 'Ativar/desativar plano' })
  async toggleStatus(@Param('id', ParseIntPipe) id: number) {
    return this.plansService.toggleStatus(id);
  }

  @Get(':id/pages')
  @ApiOperation({ summary: 'Listar páginas do plano' })
  async getPages(@Param('id', ParseIntPipe) id: number) {
    return this.plansService.getPages(id);
  }

  @Put(':id/pages')
  @ApiOperation({ summary: 'Atribuir páginas ao plano' })
  async setPages(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { pageIds: number[] },
  ) {
    return this.plansService.setPages(id, body.pageIds);
  }
}
