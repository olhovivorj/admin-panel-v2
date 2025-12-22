import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtPayload, AuthUser } from '../dto/jwt-payload.dto';
import * as crypto from 'crypto';

/**
 * JWT Strategy - Valida tokens JWT
 * Baseado em: ari-nest e courier-v3
 *
 * Adaptação: Inclui decriptação de credenciais Firebird
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly encryptionKey: string;

  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });

    // Chave para decriptar credenciais Firebird do JWT
    this.encryptionKey = this.configService.get<string>(
      'FIREBIRD_ENCRYPTION_KEY',
      'default-encryption-key-change-in-production',
    );
  }

  /**
   * Valida o payload do JWT e retorna o user object
   * Este objeto será anexado a request.user
   */
  async validate(payload: JwtPayload): Promise<AuthUser> {
    if (!payload.sub || !payload.baseId) {
      throw new UnauthorizedException('Token inválido - dados incompletos');
    }

    // Decriptar senha Firebird
    let firebirdPassword = payload.firebird?.password;
    if (firebirdPassword) {
      try {
        firebirdPassword = this.decrypt(firebirdPassword);
      } catch (error) {
        throw new UnauthorizedException('Erro ao decriptar credenciais Firebird');
      }
    }

    const user: AuthUser = {
      id: payload.sub,
      email: payload.email,
      nome: payload.nome,
      baseId: payload.baseId,
      baseName: payload.baseName,
      isMaster: payload.isMaster || false,
      isSupervisor: payload.isSupervisor || false,
      permissions: payload.permissions || [],
      roles: payload.roles || [payload.perfil?.toUpperCase()] || ['USER'],

      // Credenciais Firebird (decriptadas)
      firebird: payload.firebird
        ? {
            host: payload.firebird.host,
            port: payload.firebird.port,
            database: payload.firebird.database,
            user: payload.firebird.user,
            password: firebirdPassword,
          }
        : null,
    };

    return user;
  }

  /**
   * Decripta senha usando AES-256-CBC
   */
  private decrypt(encryptedText: string): string {
    try {
      const textParts = encryptedText.split(':');
      const iv = Buffer.from(textParts.shift(), 'hex');
      const encryptedData = Buffer.from(textParts.join(':'), 'hex');
      const key = crypto.scryptSync(this.encryptionKey, 'salt', 32);

      const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
      let decrypted = decipher.update(encryptedData);
      decrypted = Buffer.concat([decrypted, decipher.final()]);

      return decrypted.toString();
    } catch (error) {
      throw new Error('Falha ao decriptar senha Firebird');
    }
  }
}
