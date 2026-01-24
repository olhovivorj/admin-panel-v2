import { Controller, Get } from '@nestjs/common';
import { SystemService, SystemHealthResponse } from './system.service';

@Controller('system')
export class SystemController {
  constructor(private readonly systemService: SystemService) {}

  @Get('health')
  async getSystemHealth(): Promise<SystemHealthResponse> {
    return this.systemService.getSystemHealth();
  }
}
