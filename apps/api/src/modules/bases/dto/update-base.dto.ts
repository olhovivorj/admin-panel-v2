import { IsString, IsOptional, IsInt, MinLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO para atualização de base
 * Tabela: base (MySQL)
 */
export class UpdateBaseDto {
  @ApiPropertyOptional({ example: 'Nome da Base' })
  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'Nome deve ter no mínimo 2 caracteres' })
  nome?: string;

  @ApiPropertyOptional({ example: 'BASE100', description: 'Código da base' })
  @IsOptional()
  @IsString()
  codigo?: string;

  @ApiPropertyOptional({ example: 'token-api', description: 'Token de API' })
  @IsOptional()
  @IsString()
  token?: string;

  @ApiPropertyOptional({ example: 1, description: 'Servidor (SRV)' })
  @IsOptional()
  @IsInt()
  servidor?: number;
}
