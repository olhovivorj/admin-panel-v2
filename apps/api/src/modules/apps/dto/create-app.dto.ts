import { IsString, IsOptional, IsBoolean, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAppDto {
  @ApiProperty({ description: 'Nome único do app (slug)' })
  @IsString()
  @MaxLength(50)
  name: string;

  @ApiProperty({ description: 'Nome de exibição' })
  @IsString()
  @MaxLength(100)
  displayName: string;

  @ApiPropertyOptional({ description: 'Ícone do app (ex: FiHome, FiSettings)' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  icon?: string;

  @ApiPropertyOptional({ description: 'Descrição do app' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;

  @ApiPropertyOptional({ description: 'App ativo', default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
