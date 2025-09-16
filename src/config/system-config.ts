/**
 * 🎯 SISTEMA INVISTTO - CONFIGURAÇÃO UNIFICADA FRONTEND
 *
 * CONFORMIDADE CONTRATO V2.1:
 * ✅ URLs padronizadas
 * ✅ Configuração centralizada
 * ✅ Integração com ari-nest exclusivamente
 * ✅ Autenticação JWT unificada
 */

export type SystemEnvironment = 'development' | 'production' | 'test';

export interface FrontendConfig {
  environment: SystemEnvironment;
  system: {
    name: string;
    version: string;
    contractVersion: string;
    title: string;
  };
  api: {
    baseUrl: string;
    timeout: number;
    retries: number;
  };
  auth: {
    tokenKey: string;
    refreshKey: string;
    storageType: 'localStorage' | 'sessionStorage';
  };
  cache: {
    enabled: boolean;
    ttl: number;
    maxSize: number;
  };
  features: {
    realtime: boolean;
    analytics: boolean;
    debugging: boolean;
  };
  ui: {
    theme: 'light' | 'dark' | 'auto';
    language: 'pt-BR' | 'en-US';
    sidebar: 'expanded' | 'collapsed';
  };
}

class AdminPanelConfig {
  private static instance: AdminPanelConfig
  private config: FrontendConfig

  private constructor() {
    this.config = this.loadConfiguration()
  }

  public static getInstance(): AdminPanelConfig {
    if (!AdminPanelConfig.instance) {
      AdminPanelConfig.instance = new AdminPanelConfig()
    }
    return AdminPanelConfig.instance
  }

  private loadConfiguration(): FrontendConfig {
    const env = (import.meta.env.MODE as SystemEnvironment) || 'development'

    return {
      environment: env,
      system: {
        name: 'INVISTTO_ADMIN_PANEL',
        version: '2.1.0',
        contractVersion: 'v2.1',
        title: 'INVISTTO Admin Panel',
      },
      api: {
        baseUrl: env === 'production'
          ? import.meta.env.VITE_API_URL || 'https://ierp.invistto.com'
          : import.meta.env.VITE_API_URL || 'http://localhost:3000',
        timeout: 30000,
        retries: 3,
      },
      auth: {
        tokenKey: 'invistto_admin_token',
        refreshKey: 'invistto_admin_refresh',
        storageType: 'localStorage',
      },
      cache: {
        enabled: true,
        ttl: 300000, // 5 minutos
        maxSize: 100, // 100 itens
      },
      features: {
        realtime: env === 'development',
        analytics: true,
        debugging: env === 'development',
      },
      ui: {
        theme: 'light',
        language: 'pt-BR',
        sidebar: 'expanded',
      },
    }
  }

  public getConfig(): FrontendConfig {
    return { ...this.config }
  }

  public getApiUrl(endpoint?: string): string {
    const baseUrl = `${this.config.api.baseUrl}/api`
    return endpoint ? `${baseUrl}${endpoint}` : baseUrl
  }

  public getApiConfig() {
    return this.config.api
  }

  public getAuthConfig() {
    return this.config.auth
  }

  public isProduction(): boolean {
    return this.config.environment === 'production'
  }

  public isDevelopment(): boolean {
    return this.config.environment === 'development'
  }

  public getStorageKey(key: string): string {
    return `invistto_admin_${key}`
  }

  // Endpoints específicos do Admin Panel
  public getEndpoints() {
    const baseUrl = this.getApiUrl()

    return {
      // Auth
      auth: {
        login: `${baseUrl}/auth/login`,
        logout: `${baseUrl}/auth/logout`,
        refresh: `${baseUrl}/auth/refresh`,
        profile: `${baseUrl}/auth/profile`,
      },
      // Users management
      users: {
        list: `${baseUrl}/usuarios`,
        detail: (id: number) => `${baseUrl}/usuarios/${id}`,
        create: `${baseUrl}/usuarios`,
        update: (id: number) => `${baseUrl}/usuarios/${id}`,
        activate: (id: number) => `${baseUrl}/usuarios/${id}/activate`,
        deactivate: (id: number) => `${baseUrl}/usuarios/${id}/deactivate`,
      },
      // Analytics
      analytics: {
        dashboard: `${baseUrl}/analytics/dashboard`,
        rfm: `${baseUrl}/analytics/rfm`,
        insights: `${baseUrl}/analytics/insights`,
      },
      // System
      system: {
        health: `${baseUrl}/health`,
        bases: `${baseUrl}/bases`,
        config: `${baseUrl}/config`,
      },
    }
  }
}

// Cache TTL para componentes (milissegundos)
export const CACHE_TTL = {
  USER_DATA: 300000,     // 5 minutos
  DASHBOARD: 60000,      // 1 minuto
  ANALYTICS: 180000,     // 3 minutos
  STATIC_DATA: 600000,   // 10 minutos
  CONFIG: 1800000,        // 30 minutos
} as const

// Constantes do sistema
export const SYSTEM_CONSTANTS = {
  NAME: 'INVISTTO_ADMIN_PANEL',
  VERSION: '2.1.0',
  CONTRACT_VERSION: 'v2.1',
  API_TARGET: 'ari-nest',
  SUPPORTED_LANGUAGES: ['pt-BR', 'en-US'],
  THEMES: ['light', 'dark', 'auto'],
} as const

// Export singleton
export const adminPanelConfig = AdminPanelConfig.getInstance()