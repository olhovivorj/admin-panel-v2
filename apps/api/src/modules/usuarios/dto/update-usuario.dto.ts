import {
  IsEmail,
  IsString,
  IsOptional,
  IsBoolean,
  IsInt,
  MinLength,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO para atualização de usuário
 * Tabela: ariusers (MySQL)
 */
export class UpdateUsuarioDto {
  @ApiPropertyOptional({ example: 'usuario@email.com' })
  @IsOptional()
  @IsEmail({}, { message: 'Email inválido' })
  email?: string;

  @ApiPropertyOptional({ example: 'Nome do Usuário' })
  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'Nome deve ter no mínimo 2 caracteres' })
  nome?: string;

  @ApiPropertyOptional({ example: '11999999999' })
  @IsOptional()
  @IsString()
  telefone?: string;

  @ApiPropertyOptional({ example: 'Observações sobre o usuário' })
  @IsOptional()
  @IsString()
  obs?: string;

  @ApiPropertyOptional({ example: 49, description: 'ID da base (ID_BASE)' })
  @IsOptional()
  @IsInt()
  baseId?: number;

  @ApiPropertyOptional({ example: 'user', enum: ['user', 'admin', 'master', 'supervisor'] })
  @IsOptional()
  @IsString()
  funcao?: string;

  @ApiPropertyOptional({ example: 1, description: 'ID do role (ari_roles)' })
  @IsOptional()
  @IsInt()
  roleId?: number;

  @ApiPropertyOptional({ example: 1, description: 'ID do plano (ari_plans)' })
  @IsOptional()
  @IsInt()
  planId?: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  ativo?: boolean;

  @ApiPropertyOptional({ example: 'dark', enum: ['light', 'dark'] })
  @IsOptional()
  @IsString()
  theme?: string;

  @ApiPropertyOptional({ example: 'pt-BR' })
  @IsOptional()
  @IsString()
  language?: string;
}
