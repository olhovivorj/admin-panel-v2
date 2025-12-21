import { Module } from '@nestjs/common';
import { ErpController } from './erp.controller';
import { ErpService } from './erp.service';
import { FirebirdService } from './firebird.service';

@Module({
  controllers: [ErpController],
  providers: [ErpService, FirebirdService],
  exports: [ErpService, FirebirdService],
})
export class ErpModule {}
