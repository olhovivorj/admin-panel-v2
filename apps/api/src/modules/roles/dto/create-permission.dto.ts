import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePermissionDto {
  @ApiProperty({ example: 'usuarios.create' })
  @IsString()
  @MinLength(2, { message: 'Nome deve ter no minimo 2 caracteres' })
  name: string;

  @ApiProperty({ example: 'usuarios' })
  @IsString()
  module: string;

  @ApiProperty({ example: 'create' })
  @IsString()
  action: string;
}
