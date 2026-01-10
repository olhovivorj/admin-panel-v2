import { ApiProperty } from '@nestjs/swagger';

/**
 * Credenciais Firebird para conexão dinâmica
 * Incluídas no JWT payload para acesso ao ERP
 */
export class FirebirdCredentials {
  @ApiProperty({ example: '192.168.1.10' })
  host: string;

  @ApiProperty({ example: 3050 })
  port: number;

  @ApiProperty({ example: '/opt/firebird/data/INVISTTO.FDB' })
  database: string;

  @ApiProperty({ example: 'SYSDBA' })
  user: string;

  @ApiProperty({ example: 'masterkey', description: 'Senha criptografada' })
  password: string;
}

/**
 * Informações do plano do usuário
 */
export class PlanInfo {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'pro' })
  name: string;

  @ApiProperty({ example: 'Pro' })
  displayName: string;

  @ApiProperty({ example: 'business' })
  type: string;
}

/**
 * Informações do app
 */
export class AppInfo {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'zeiss' })
  name: string;

  @ApiProperty({ example: 'Zeiss Lab Client' })
  displayName: string;

  @ApiProperty({ example: 'Glasses' })
  icon: string;
}

/**
 * Informações da role do usuário
 */
export class RoleInfo {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'ADMIN' })
  name: string;

  @ApiProperty({ example: 'Administrador' })
  displayName: string;

  @ApiProperty({ example: 80, description: 'Prioridade da role (100=Master, 80=Admin, 60=Supervisor, etc)' })
  priority: number;
}

/**
 * Informações da página
 */
export class PageInfo {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Dashboard' })
  name: string;

  @ApiProperty({ example: '/dashboard' })
  path: string;

  @ApiProperty({ example: 'Principal' })
  category: string;

  @ApiProperty({ type: AppInfo })
  app: AppInfo;
}

/**
 * Dados do usuário autenticado
 * Retornado após login bem-sucedido
 */
export class UserResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'admin@invistto.com.br' })
  email: string;

  @ApiProperty({ example: 'Administrador' })
  name: string;

  @ApiProperty({ example: 'Invistto - Matriz' })
  base: string;

  @ApiProperty({ example: 42, description: 'ID_BASE para multi-tenancy' })
  baseId: number;

  @ApiProperty({ example: true })
  isMaster: boolean;

  @ApiProperty({ example: false })
  isSupervisor: boolean;

  @ApiProperty({ example: ['courier', 'zeiss', 'admin-panel'], description: 'Apps disponíveis para o usuário' })
  permissions: string[];

  @ApiProperty({ type: PlanInfo, required: false, description: 'Plano de assinatura do usuário' })
  plan?: PlanInfo;

  @ApiProperty({ type: [PageInfo], required: false, description: 'Páginas disponíveis no plano' })
  pages?: PageInfo[];

  @ApiProperty({ type: RoleInfo, required: false, description: 'Role do usuário com priority' })
  role?: RoleInfo;

  @ApiProperty({ type: FirebirdCredentials, required: false })
  firebird?: FirebirdCredentials;
}

/**
 * Resposta de autenticação completa
 * Padrão OAuth 2.0 (RFC 6749) - Compatível com courier-v3
 */
export class AuthResponseDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'JWT token para autenticação',
  })
  access_token: string;

  @ApiProperty({
    example: 'Bearer',
    description: 'Tipo do token (sempre Bearer para JWT)',
  })
  token_type: string;

  @ApiProperty({
    example: 3600,
    description: 'Tempo de expiração do token em segundos (padrão OAuth2)',
  })
  expires_in: number;

  @ApiProperty({ type: UserResponseDto })
  user: UserResponseDto;
}
