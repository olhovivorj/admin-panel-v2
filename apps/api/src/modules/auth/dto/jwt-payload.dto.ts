/**
 * Payload do JWT Token
 * Inclui credenciais Firebird para conexão dinâmica ao ERP
 *
 * IMPORTANTE: Firebird credentials são criptografadas antes de serem incluídas no token
 */
export interface JwtPayload {
  // Standard JWT fields
  sub: number; // User ID
  iat?: number; // Issued at
  exp?: number; // Expiration

  // User data
  email: string;
  nome: string;
  perfil?: string;

  // Multi-tenancy
  baseId: number;
  baseName: string;

  // Permissions
  isMaster: boolean;
  isSupervisor: boolean;
  permissions: string[];
  roles?: string[];

  // Firebird Connection (CRITICAL for Zeiss API)
  firebird: {
    host: string;
    port: number;
    database: string;
    user: string;
    password: string; // Encrypted with AES-256
  };
}

/**
 * User object attached to request after JWT validation
 * Available in controllers via @Request() req or @CurrentUser() decorator
 */
export interface AuthUser {
  id: number;
  email: string;
  nome: string;
  baseId: number;
  baseName: string;
  isMaster: boolean;
  isSupervisor: boolean;
  permissions: string[];
  roles: string[];

  // Firebird credentials (decrypted)
  firebird: {
    host: string;
    port: number;
    database: string;
    user: string;
    password: string;
  };
}
