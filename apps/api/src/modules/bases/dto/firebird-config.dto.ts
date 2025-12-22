import { IsString, IsOptional, IsInt, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO para configuração Firebird
 * Tabela: base_config (MySQL)
 */
export class FirebirdConfigDto {
  @ApiPropertyOptional({ example: 'localhost' })
  @IsOptional()
  @IsString()
  host?: string;

  @ApiPropertyOptional({ example: 3050, default: 3050 })
  @IsOptional()
  @IsInt()
  port?: number;

  @ApiPropertyOptional({ example: '/opt/firebird/data/INVISTTO.FDB' })
  @IsOptional()
  @IsString()
  database?: string;

  @ApiPropertyOptional({ example: 'SYSDBA' })
  @IsOptional()
  @IsString()
  user?: string;

  @ApiPropertyOptional({ example: 'masterkey' })
  @IsOptional()
  @IsString()
  password?: string;

  @ApiPropertyOptional({ example: 'RDB$ADMIN' })
  @IsOptional()
  @IsString()
  role?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
