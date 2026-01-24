import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

export interface ServiceHealth {
  name: string;
  status: 'healthy' | 'unhealthy' | 'unknown';
  responseTimeMs: number;
  details?: any;
  error?: string;
}

export interface SystemHealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  services: ServiceHealth[];
}

@Injectable()
export class SystemService {
  private readonly logger = new Logger(SystemService.name);

  // URLs internas das APIs (não expostas ao frontend)
  // type: 'mysql' = verifica isConnected, 'ping' = qualquer resposta = online
  private readonly services = [
    {
      name: 'api-invistto (DNP/PontoMarket)',
      url: 'http://localhost:4001/api/health/mysql',
      type: 'mysql',
    },
    {
      name: 'Auth API',
      url: 'http://localhost:3001/',
      type: 'ping',
    },
    {
      name: 'Zeiss API',
      url: 'http://localhost:3005/',
      type: 'ping',
    },
    {
      name: 'ARI (BI/Analytics)',
      url: 'http://localhost:3010/',
      type: 'ping',
    },
    {
      name: 'Courier',
      url: 'http://localhost:3333/',
      type: 'ping',
    },
    {
      name: 'OlhoVivo Lens',
      url: 'http://localhost:3015/',
      type: 'ping',
    },
  ];

  async getSystemHealth(): Promise<SystemHealthResponse> {
    // Executar checks em paralelo para melhor performance
    const results = await Promise.all(
      this.services.map((service) => this.checkService(service)),
    );

    // Determina status geral
    const allHealthy = results.every((s) => s.status === 'healthy');
    const anyUnhealthy = results.some((s) => s.status === 'unhealthy');

    return {
      status: allHealthy ? 'healthy' : anyUnhealthy ? 'unhealthy' : 'degraded',
      timestamp: new Date().toISOString(),
      services: results,
    };
  }

  private async checkService(service: {
    name: string;
    url: string;
    type: string;
  }): Promise<ServiceHealth> {
    const startTime = Date.now();

    try {
      const response = await axios.get(service.url, {
        timeout: 5000,
        // Aceitar qualquer status code (para tipo 'ping')
        validateStatus: (status) =>
          service.type === 'ping' ? status < 500 : status >= 200 && status < 300,
      });

      const responseTimeMs = Date.now() - startTime;
      const data = response.data;

      // Para api-invistto/mysql, verifica isConnected
      if (service.type === 'mysql' && data.data) {
        return {
          name: service.name,
          status: data.data.isConnected ? 'healthy' : 'unhealthy',
          responseTimeMs,
          details: {
            isConnected: data.data.isConnected,
            uptimeMs: data.data.uptimeMs,
            reconnectAttempts: data.data.reconnectAttempts,
            lastError: data.data.lastError,
            currentBackoffMs: data.data.currentBackoffMs,
          },
        };
      }

      // Tipo 'ping' - qualquer resposta < 500 = online
      if (service.type === 'ping') {
        return {
          name: service.name,
          status: 'healthy',
          responseTimeMs,
        };
      }

      // Genérico - considera healthy se retornou 200
      return {
        name: service.name,
        status: 'healthy',
        responseTimeMs,
        details: data,
      };
    } catch (error) {
      const responseTimeMs = Date.now() - startTime;

      this.logger.warn(
        `Health check failed for ${service.name}: ${error.message}`,
      );

      return {
        name: service.name,
        status: 'unhealthy',
        responseTimeMs,
        error: error.message,
      };
    }
  }
}
