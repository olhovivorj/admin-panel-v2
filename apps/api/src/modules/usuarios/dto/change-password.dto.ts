import { IsString, MinLength, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ChangePasswordDto {
  @ApiPropertyOptional({ example: 'senhaAtual123', description: 'Senha atual (opcional para admin)' })
  @IsOptional()
  @IsString()
  currentPassword?: string;

  @ApiProperty({ example: 'novaSenha123' })
  @IsString()
  @MinLength(6, { message: 'Nova senha deve ter no mínimo 6 caracteres' })
  newPassword: string;
}
