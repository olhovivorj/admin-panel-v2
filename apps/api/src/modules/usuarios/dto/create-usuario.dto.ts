import {
  IsEmail,
  IsString,
  IsOptional,
  IsBoolean,
  IsInt,
  MinLength,
  IsNotEmpty,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO para criação de usuário
 * Tabela: ariusers (MySQL)
 */
export class CreateUsuarioDto {
  @ApiProperty({ example: 'usuario@email.com' })
  @IsEmail({}, { message: 'Email inválido' })
  @IsNotEmpty({ message: 'Email é obrigatório' })
  email: string;

  @ApiProperty({ example: 'senha123' })
  @IsString()
  @MinLength(6, { message: 'Senha deve ter no mínimo 6 caracteres' })
  password: string;

  @ApiProperty({ example: 'Nome do Usuário' })
  @IsString()
  @MinLength(2, { message: 'Nome deve ter no mínimo 2 caracteres' })
  nome: string;

  @ApiPropertyOptional({ example: '11999999999' })
  @IsOptional()
  @IsString()
  telefone?: string;

  @ApiPropertyOptional({ example: 'Observações sobre o usuário' })
  @IsOptional()
  @IsString()
  obs?: string;

  @ApiProperty({ example: 49, description: 'ID da base (ID_BASE)' })
  @IsInt({ message: 'Base deve ser um número' })
  @IsNotEmpty({ message: 'Base é obrigatória' })
  baseId: number;

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

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  ativo?: boolean;

  @ApiPropertyOptional({ example: 'NORMAL', enum: ['NORMAL', 'API'], default: 'NORMAL' })
  @IsOptional()
  @IsString()
  tipo_usuario?: string;
}
