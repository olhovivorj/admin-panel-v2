import { IsString, IsOptional, IsInt, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO para criação de role
 * Tabela: ari_roles (MySQL)
 */
export class CreateRoleDto {
  @ApiProperty({ example: 'admin' })
  @IsString()
  @MinLength(2, { message: 'Nome deve ter no mínimo 2 caracteres' })
  name: string;

  @ApiPropertyOptional({ example: 'Administrador' })
  @IsOptional()
  @IsString()
  displayName?: string;

  @ApiPropertyOptional({ example: 'Administrador do sistema' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 10, description: 'Prioridade (maior = mais importante)' })
  @IsOptional()
  @IsInt()
  priority?: number;
}
