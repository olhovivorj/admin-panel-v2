import { IsString, IsOptional, IsBoolean, IsInt, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO para criação de base
 * Tabelas: base + base_config (MySQL)
 */
export class CreateBaseDto {
  @ApiPropertyOptional({ example: 100, description: 'ID_BASE (auto-gerado se não informado)' })
  @IsOptional()
  @IsInt()
  id?: number;

  @ApiProperty({ example: 'Nome da Base' })
  @IsString()
  @MinLength(2, { message: 'Nome deve ter no mínimo 2 caracteres' })
  nome: string;

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

  // Firebird config
  @ApiPropertyOptional({ example: 'localhost' })
  @IsOptional()
  @IsString()
  fbHost?: string;

  @ApiPropertyOptional({ example: 3050, default: 3050 })
  @IsOptional()
  @IsInt()
  fbPort?: number;

  @ApiPropertyOptional({ example: '/opt/firebird/data/INVISTTO.FDB' })
  @IsOptional()
  @IsString()
  fbDatabase?: string;

  @ApiPropertyOptional({ example: 'SYSDBA' })
  @IsOptional()
  @IsString()
  fbUser?: string;

  @ApiPropertyOptional({ example: 'masterkey' })
  @IsOptional()
  @IsString()
  fbPassword?: string;

  @ApiPropertyOptional({ example: true, default: false })
  @IsOptional()
  @IsBoolean()
  fbActive?: boolean;
}
