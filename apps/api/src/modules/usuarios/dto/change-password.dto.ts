import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChangePasswordDto {
  @ApiProperty({ example: 'novaSenha123' })
  @IsString()
  @MinLength(6, { message: 'Nova senha deve ter no minimo 6 caracteres' })
  newPassword: string;
}
