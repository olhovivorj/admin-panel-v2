import { IsString, IsOptional, IsBoolean, IsNumber, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePageDto {
  @ApiProperty({ description: 'Nome único da página (slug)' })
  @IsString()
  @MaxLength(50)
  name: string;

  @ApiProperty({ description: 'Nome de exibição' })
  @IsString()
  @MaxLength(100)
  displayName: string;

  @ApiProperty({ description: 'Path da rota (ex: /users, /dashboard)' })
  @IsString()
  @MaxLength(100)
  path: string;

  @ApiPropertyOptional({ description: 'Categoria/grupo da página' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  category?: string;

  @ApiPropertyOptional({ description: 'ID do app ao qual pertence' })
  @IsOptional()
  @IsNumber()
  appId?: number;

  @ApiPropertyOptional({ description: 'Ícone da página' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  icon?: string;

  @ApiPropertyOptional({ description: 'Descrição da página' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;

  @ApiPropertyOptional({ description: 'Página ativa', default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Ordem de exibição', default: 0 })
  @IsOptional()
  @IsNumber()
  order?: number;
}
