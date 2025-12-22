import { Global, Module } from '@nestjs/common';
import { BaseConfigService } from './base-config.service';
import { FirebirdConnectionManager } from './firebird-connection-manager.service';

/**
 * Módulo de Configuração Global
 *
 * Fornece:
 * - BaseConfigService: Acesso ao MySQL (ariusers, base_config, etc.)
 * - FirebirdConnectionManager: Pool de conexões Firebird
 *
 * NOTA: Este módulo é @Global(), então os services estão disponíveis
 * em todos os módulos sem precisar importar novamente.
 */
@Global()
@Module({
  providers: [
    BaseConfigService,
    FirebirdConnectionManager,
  ],
  exports: [
    BaseConfigService,
    FirebirdConnectionManager,
  ],
})
export class ConfigServiceModule {}
