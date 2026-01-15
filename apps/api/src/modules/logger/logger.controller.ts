import { Controller, Post, Body } from '@nestjs/common';
import { Public } from '@invistto/auth';

@Controller('logger')
export class LoggerController {
  @Post('batch')
  @Public() // Permitir logs sem autenticação para capturar erros de login
  async batch(@Body() body: { logs: any[] }) {
    // Por enquanto, apenas recebe os logs sem processar
    // Você pode implementar salvamento em arquivo ou banco depois
    console.log(`[Frontend Logs] Recebidos ${body.logs?.length || 0} logs`);
    return { success: true };
  }
}