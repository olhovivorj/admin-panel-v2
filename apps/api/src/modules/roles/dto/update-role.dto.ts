import { IsString, IsOptional, MinLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateRoleDto {
  @ApiPropertyOptional({ example: 'admin' })
  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'Nome deve ter no minimo 2 caracteres' })
  name?: string;

  @ApiPropertyOptional({ example: 'Administrador do sistema' })
  @IsOptional()
  @IsString()
  description?: string;
}
