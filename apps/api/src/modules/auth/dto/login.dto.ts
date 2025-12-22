import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

/**
 * DTO para login de usuários
 * Baseado em: ari-nest e courier-v3
 */
export class LoginDto {
  @ApiProperty({
    example: 'admin@invistto.com.br',
    description: 'Email do usuário cadastrado no MySQL (ariusers)',
  })
  @IsEmail({}, { message: 'Email inválido' })
  @IsNotEmpty({ message: 'Email é obrigatório' })
  email: string;

  @ApiProperty({
    example: 'admin123',
    description: 'Senha do usuário (bcrypt hash no banco)',
  })
  @IsString()
  @IsNotEmpty({ message: 'Senha é obrigatória' })
  @MinLength(6, { message: 'Senha deve ter no mínimo 6 caracteres' })
  password: string;
}
