import { Controller, Post, Body, Get, UseGuards, Request, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { InvisttoAuthService } from './invistto-auth.service';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto, UserResponseDto } from './dto/auth-response.dto';
import { Public } from './decorators/public.decorator';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { AuthUser } from './dto/jwt-payload.dto';

/**
 * Controller de Autenticação Invistto
 * Baseado em: ari-nest e courier-v3
 *
 * Endpoints:
 * - POST /auth/login - Login com email/senha
 * - GET /auth/profile - Retorna dados do usuário autenticado
 * - GET /auth/validate - Valida token JWT
 */
@ApiTags('Auth - Autenticação')
@Controller('auth')
export class InvisttoAuthController {
  private readonly logger = new Logger(InvisttoAuthController.name);

  constructor(private readonly authService: InvisttoAuthService) {}

  @Public()
  @Post('login')
  @ApiOperation({
    summary: 'Login de usuário',
    description:
      'Autentica usuário via MySQL (ariusers), busca credenciais Firebird e retorna JWT token. ' +
      'O token contém credenciais Firebird criptografadas para acesso ao ERP.',
  })
  @ApiResponse({
    status: 200,
    description: 'Login bem-sucedido - Retorna JWT token + user data',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Credenciais inválidas ou usuário inativo',
  })
  async login(@Body() loginDto: LoginDto): Promise<AuthResponseDto> {
    this.logger.log(`🔐 POST /auth/login - ${loginDto.email}`);
    return this.authService.login(loginDto);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Perfil do usuário autenticado',
    description: 'Retorna dados completos do usuário extraídos do JWT token.',
  })
  @ApiResponse({
    status: 200,
    description: 'Dados do usuário',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Token inválido ou expirado',
  })
  async getProfile(@CurrentUser() user: AuthUser) {
    this.logger.log(`👤 GET /auth/profile - ${user.email}`);

    return {
      id: user.id,
      email: user.email,
      name: user.nome,
      base: user.baseName,
      baseId: user.baseId,
      isMaster: user.isMaster,
      isSupervisor: user.isSupervisor,
      permissions: user.permissions,
      firebird: {
        host: user.firebird.host,
        port: user.firebird.port,
        database: user.firebird.database,
        user: user.firebird.user,
        // NÃO retornar senha no perfil
      },
    };
  }

  @Get('validate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Valida token JWT',
    description: 'Verifica se o token JWT é válido e não expirado.',
  })
  @ApiResponse({
    status: 200,
    description: 'Token válido',
  })
  @ApiResponse({
    status: 401,
    description: 'Token inválido ou expirado',
  })
  async validate(@Request() req: any) {
    this.logger.log(`✅ GET /auth/validate - ${req.user.email}`);

    return {
      valid: true,
      userId: req.user.id,
      email: req.user.email,
      baseId: req.user.baseId,
    };
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Logout de usuário',
    description:
      'Invalida sessão do usuário e fecha conexões Firebird ativas. ' +
      'O frontend deve limpar o token JWT após chamar este endpoint.',
  })
  @ApiResponse({
    status: 200,
    description: 'Logout bem-sucedido',
  })
  @ApiResponse({
    status: 401,
    description: 'Token inválido ou expirado',
  })
  async logout(@CurrentUser() user: AuthUser) {
    this.logger.log(`👋 POST /auth/logout - ${user.email} (base ${user.baseId})`);

    try {
      // Fechar conexões Firebird do usuário
      await this.authService.logout(user.baseId);

      return {
        success: true,
        message: 'Logout realizado com sucesso',
      };
    } catch (error) {
      this.logger.error(`Erro no logout: ${error.message}`);
      // Retornar sucesso mesmo com erro (graceful degradation)
      // O frontend já limpou o token, então o logout é considerado bem-sucedido
      return {
        success: true,
        message: 'Logout realizado (com avisos)',
        warning: error.message,
      };
    }
  }
}
