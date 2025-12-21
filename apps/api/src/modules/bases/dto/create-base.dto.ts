import { IsString, IsOptional, IsBoolean, IsInt, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateBaseDto {
  @ApiProperty({ example: 'Nome da Base' })
  @IsString()
  @MinLength(2, { message: 'Nome deve ter no minimo 2 caracteres' })
  nome: string;

  @ApiPropertyOptional({ example: '12345678000190' })
  @IsOptional()
  @IsString()
  cnpj?: string;

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  ativo?: boolean;

  @ApiPropertyOptional({ example: 'localhost' })
  @IsOptional()
  @IsString()
  fbHost?: string;

  @ApiPropertyOptional({ example: 3050, default: 3050 })
  @IsOptional()
  @IsInt()
  fbPort?: number;

  @ApiPropertyOptional({ example: '/path/to/database.fdb' })
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
}
