import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './modules/auth/auth.module';
import { UsuariosModule } from './modules/usuarios/usuarios.module';
import { BasesModule } from './modules/bases/bases.module';
import { RolesModule } from './modules/roles/roles.module';
import { ErpModule } from './modules/erp/erp.module';
import { DatabaseModule } from './database/database.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    DatabaseModule,
    AuthModule,
    UsuariosModule,
    BasesModule,
    RolesModule,
    ErpModule,
  ],
})
export class AppModule {}
