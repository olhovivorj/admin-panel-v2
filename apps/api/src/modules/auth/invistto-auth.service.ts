import { Injectable, UnauthorizedException, Logger, Inject, forwardRef } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { BaseConfigService } from '../../config/base-config.service';
import { FirebirdConnectionManager } from '../../config/firebird-connection-manager.service';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto, UserResponseDto } from './dto/auth-response.dto';
import { JwtPayload } from './dto/jwt-payload.dto';

/**
 * Serviço de Autenticação Invistto
 * Baseado em: ari-nest/auth.service.ts e courier-v3/local-auth.service.ts
 *
 * FLUXO:
 * 1. Login → MySQL (ariusers) → validar email/senha
 * 2. Buscar ID_BASE do usuário
 * 3. Buscar credenciais Firebird na tabela 'base'
 * 4. Gerar JWT com credenciais Firebird criptografadas
 * 5. Retornar token + user data
 */
@Injectable()
export class InvisttoAuthService {
  private readonly logger = new Logger(InvisttoAuthService.name);
  private readonly encryptionKey: string;
  private readonly jwtExpiration: string;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly baseConfigService: BaseConfigService,
    @Inject(forwardRef(() => FirebirdConnectionManager))
    private readonly firebirdManager: FirebirdConnectionManager,
  ) {
    this.encryptionKey = this.configService.get<string>(
      'FIREBIRD_ENCRYPTION_KEY',
      'default-encryption-key-change-in-production',
    );
    this.jwtExpiration = this.configService.get<string>('JWT_EXPIRATION', '8h');
  }

  /**
   * LOGIN - Autentica usuário e retorna JWT
   */
  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    this.logger.log(`🔐 Tentativa de login: ${loginDto.email}`);

    // 1. Validar usuário no MySQL (ariusers)
    const user = await this.validateUser(loginDto);

    // 2. Buscar credenciais Firebird
    const firebirdCredentials = await this.getFirebirdCredentials(user.baseId);

    // 3. Gerar JWT token
    const { access_token, expiresAt } = await this.generateToken(user, firebirdCredentials);

    // 4. Atualizar último acesso
    await this.updateLastAccess(user.id);

    this.logger.log(`✅ Login bem-sucedido: ${user.email} | Base: ${user.baseId}`);

    // Padrão OAuth 2.0 (RFC 6749) - Compatível com courier-v3
    return {
      access_token,
      token_type: 'Bearer',
      expires_in: 3600, // 1 hora em segundos
      user: {
        ...user,
        firebird: firebirdCredentials,
      },
    };
  }

  /**
   * VALIDAR USUÁRIO - Busca no MySQL e valida senha
   */
  private async validateUser(loginDto: LoginDto): Promise<UserResponseDto> {
    const { email, password } = loginDto;

    // Query ariusers (MySQL) via BaseConfigService
    const ariUser = await this.baseConfigService.getUserByEmail(email.toLowerCase());

    if (!ariUser || ariUser.ativo !== 1) {
      this.logger.warn(`❌ Usuário não encontrado ou inativo: ${email}`);
      throw new UnauthorizedException('Credenciais inválidas');
    }

    // Validar senha (bcrypt ou plain text para desenvolvimento)
    const isPasswordValid = await this.validatePassword(password, ariUser.senha || '');

    if (!isPasswordValid) {
      this.logger.warn(`❌ Senha incorreta para: ${email}`);
      throw new UnauthorizedException('Credenciais inválidas');
    }

    if (!ariUser.ID_BASE) {
      this.logger.error(`❌ Usuário ${email} sem ID_BASE definido`);
      throw new UnauthorizedException('Usuário sem base configurada');
    }

    // Buscar nome da base
    const baseName = await this.baseConfigService.getBaseName(ariUser.ID_BASE);

    // Determinar permissões baseadas no plano
    const isMaster = ariUser.funcao === 'admin' || ariUser.funcao === 'master';
    const isSupervisor = ariUser.funcao === 'supervisor';

    // Buscar plano e páginas do usuário
    const planData = await this.getUserPlanAndPages(ariUser.plan_id);

    const userResponse: UserResponseDto = {
      id: ariUser.id,
      email: ariUser.email,
      name: ariUser.nome || ariUser.email.split('@')[0],
      base: baseName,
      baseId: ariUser.ID_BASE,
      isMaster,
      isSupervisor,
      permissions: planData.permissions, // Apps únicos do plano
      plan: planData.plan, // Dados do plano
      pages: planData.pages, // Páginas do plano
    };

    return userResponse;
  }

  /**
   * BUSCAR PLANO E PÁGINAS DO USUÁRIO
   */
  private async getUserPlanAndPages(planId: number | null) {
    // Se usuário não tem plano, retornar vazio
    if (!planId) {
      this.logger.warn('⚠️  Usuário sem plano definido');
      return {
        plan: null,
        pages: [],
        permissions: [],
      };
    }

    try {
      // Buscar plano do usuário
      const plan = await this.baseConfigService.getPlanData(planId);

      if (!plan) {
        this.logger.warn(`⚠️  Plano ${planId} não encontrado`);
        return { plan: null, pages: [], permissions: [] };
      }

      // Buscar páginas do plano com informações do app
      const pagesData = await this.baseConfigService.getPlanPages(planId);

      // Extrair apps únicos (permissions = lista de apps)
      const appsSet = new Set<string>();
      pagesData.forEach((page) => {
        if (page.app_name) {
          appsSet.add(page.app_name);
        }
      });

      const permissions = Array.from(appsSet);

      this.logger.debug(`✅ Plano: ${plan.name} | ${pagesData.length} páginas | Apps: ${permissions.join(', ')}`);

      return {
        plan: {
          id: plan.id,
          name: plan.name,
          displayName: plan.display_name,
          type: plan.plan_type,
        },
        pages: pagesData.map((p) => ({
          id: p.id,
          name: p.name,
          path: p.path,
          category: p.category,
          app: {
            id: p.app_id,
            name: p.app_name,
            displayName: p.app_display_name,
            icon: p.app_icon,
          },
        })),
        permissions,
      };
    } catch (error) {
      this.logger.error(`❌ Erro ao buscar plano/páginas: ${error.message}`);
      return { plan: null, pages: [], permissions: [] };
    }
  }

  /**
   * VALIDAR SENHA - bcrypt ou plain text
   */
  private async validatePassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    if (!hashedPassword) {
      return false;
    }

    // Se não é hash bcrypt (desenvolvimento), comparar diretamente
    if (!hashedPassword.startsWith('$2b$') && !hashedPassword.startsWith('$2a$')) {
      return plainPassword === hashedPassword;
    }

    // Verificar hash bcrypt
    try {
      return await bcrypt.compare(plainPassword, hashedPassword);
    } catch (error) {
      this.logger.error(`Erro ao validar senha bcrypt: ${error.message}`);
      return false;
    }
  }

  /**
   * ✅ v3.3.2: BUSCAR CREDENCIAIS FIREBIRD - Tabela 'base'
   *
   * IMPORTANTE: Apenas busca credenciais no MySQL, NÃO testa conexão Firebird
   * Conexões Firebird são lazy (criadas sob demanda) e gerenciadas por pool
   * Timeouts aplicados em FirebirdConnectionManager previnem deadlocks
   */
  private async getFirebirdCredentials(baseId: number) {
    this.logger.debug(`  🔍 Buscando credenciais Firebird para base ${baseId}...`);

    try {
      // ✅ v3.3.2: Apenas MySQL lookup (SEM conexão Firebird)
      // Usar BaseConfigService que tem fallback automático base_config → base
      const config = await this.baseConfigService.getConfig(baseId);

      if (!config.FIREBIRD_ACTIVE) {
        throw new Error(`Firebird desativado para base ${baseId}`);
      }

      this.logger.debug(`  ✅ Credenciais encontradas (${config._source}): ${config.FIREBIRD_HOST}:${config.FIREBIRD_PORT}`);

      return {
        host: config.FIREBIRD_HOST || this.configService.get<string>('FIREBIRD_HOST', 'localhost'),
        port: config.FIREBIRD_PORT || this.configService.get<number>('FIREBIRD_PORT', 3050),
        database: config.FIREBIRD_DATABASE || this.configService.get<string>('FIREBIRD_DATABASE', '/opt/firebird/data/INVISTTO.FDB'),
        user: config.FIREBIRD_USER || this.configService.get<string>('FIREBIRD_USER', 'SYSDBA'),
        password: config.FIREBIRD_PASSWORD || this.configService.get<string>('FIREBIRD_PASSWORD', 'masterkey'),
      };
    } catch (error) {
      this.logger.error(`❌ Erro ao buscar credenciais Firebird: ${error.message}`);
      throw new UnauthorizedException('Erro ao configurar conexão com ERP');
    }
  }

  /**
   * GERAR TOKEN JWT - Com credenciais Firebird criptografadas
   */
  private async generateToken(
    user: UserResponseDto,
    firebirdCredentials: any,
  ): Promise<{ access_token: string; expiresAt: string }> {
    // Criptografar senha Firebird
    const encryptedPassword = this.encrypt(firebirdCredentials.password);

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      nome: user.name,
      baseId: user.baseId,
      baseName: user.base,
      isMaster: user.isMaster,
      isSupervisor: user.isSupervisor,
      permissions: user.permissions,
      roles: user.isMaster ? ['MASTER', 'ADMIN'] : user.isSupervisor ? ['SUPERVISOR'] : ['USER'],

      // Credenciais Firebird (senha criptografada)
      firebird: {
        host: firebirdCredentials.host,
        port: firebirdCredentials.port,
        database: firebirdCredentials.database,
        user: firebirdCredentials.user,
        password: encryptedPassword,
      },
    };

    const access_token = this.jwtService.sign(payload);

    // Calcular data de expiração
    const expiresInMs = this.parseExpiration(this.jwtExpiration);
    const expiresAt = new Date(Date.now() + expiresInMs).toISOString();

    return { access_token, expiresAt };
  }

  /**
   * CRIPTOGRAFAR - AES-256-CBC
   */
  private encrypt(text: string): string {
    const key = crypto.scryptSync(this.encryptionKey, 'salt', 32);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    return iv.toString('hex') + ':' + encrypted;
  }

  /**
   * ATUALIZAR ÚLTIMO ACESSO
   */
  private async updateLastAccess(userId: number): Promise<void> {
    await this.baseConfigService.updateLastAccess(userId);
  }

  /**
   * PARSE EXPIRATION - Converter string tipo "8h" para milissegundos
   */
  private parseExpiration(exp: string): number {
    const match = exp.match(/^(\d+)([smhd])$/);
    if (!match) return 8 * 60 * 60 * 1000; // Default 8h

    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case 's':
        return value * 1000;
      case 'm':
        return value * 60 * 1000;
      case 'h':
        return value * 60 * 60 * 1000;
      case 'd':
        return value * 24 * 60 * 60 * 1000;
      default:
        return 8 * 60 * 60 * 1000;
    }
  }

  /**
   * LOGOUT - Limpar conexões Firebird do usuário
   * ✅ NOVO: Endpoint de logout com cleanup (deadlock auth fix)
   */
  async logout(baseId: number): Promise<void> {
    this.logger.log(`👋 Logout iniciado para base ${baseId}`);

    try {
      // ✅ v3.1.5: Driver nativo gerencia conexões automaticamente via pool
      // Não é mais necessário fechar conexões individuais
      this.logger.log(`✅ Logout completado (conexões gerenciadas por pool nativo)`);
    } catch (error) {
      this.logger.error(`❌ Erro ao fazer logout para base ${baseId}:`, error.message);
      // Não lançar erro - graceful degradation
      // O frontend já limpou o token, então o logout é "bem-sucedido" mesmo com erro no backend
    }
  }
}
