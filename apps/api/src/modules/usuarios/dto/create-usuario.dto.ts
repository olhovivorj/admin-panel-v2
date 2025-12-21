import {
  IsEmail,
  IsString,
  IsOptional,
  IsBoolean,
  IsArray,
  IsInt,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateUsuarioDto {
  @ApiProperty({ example: 'usuario@email.com' })
  @IsEmail({}, { message: 'Email invalido' })
  email: string;

  @ApiProperty({ example: 'senha123' })
  @IsString()
  @MinLength(6, { message: 'Senha deve ter no minimo 6 caracteres' })
  password: string;

  @ApiProperty({ example: 'Nome do Usuario' })
  @IsString()
  @MinLength(2, { message: 'Nome deve ter no minimo 2 caracteres' })
  nome: string;

  @ApiPropertyOptional({ example: '11999999999' })
  @IsOptional()
  @IsString()
  telefone?: string;

  @ApiPropertyOptional({ example: 'Observacoes sobre o usuario' })
  @IsOptional()
  @IsString()
  obs?: string;

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  ativo?: boolean;

  @ApiPropertyOptional({ example: [1, 2], description: 'IDs das roles' })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  roleIds?: number[];

  @ApiPropertyOptional({ example: [1], description: 'IDs das bases' })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  baseIds?: number[];
}
