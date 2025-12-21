import { IsString, IsOptional, IsBoolean, MinLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateBaseDto {
  @ApiPropertyOptional({ example: 'Nome da Base' })
  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'Nome deve ter no minimo 2 caracteres' })
  nome?: string;

  @ApiPropertyOptional({ example: '12345678000190' })
  @IsOptional()
  @IsString()
  cnpj?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  ativo?: boolean;
}
