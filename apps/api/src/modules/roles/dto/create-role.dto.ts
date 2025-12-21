import { IsString, IsOptional, IsArray, IsInt, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateRoleDto {
  @ApiProperty({ example: 'admin' })
  @IsString()
  @MinLength(2, { message: 'Nome deve ter no minimo 2 caracteres' })
  name: string;

  @ApiPropertyOptional({ example: 'Administrador do sistema' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: [1, 2, 3], description: 'IDs das permissoes' })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  permissionIds?: number[];
}
