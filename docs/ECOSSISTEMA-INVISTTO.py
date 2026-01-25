#!/usr/bin/env python3
"""
ECOSSISTEMA INVISTTO - Diagrama de Arquitetura
Gerado em: 2026-01-24
Autor: Claude (análise automatizada)

Execução: python3 ECOSSISTEMA-INVISTTO.py
Saída: ECOSSISTEMA-INVISTTO.html (abre automaticamente no navegador)
"""

import json
from datetime import datetime

# ============================================================================
# DADOS DO ECOSSISTEMA (extraídos via análise rigorosa)
# ============================================================================

ECOSYSTEM_DATA = {
    "meta": {
        "generated_at": datetime.now().isoformat(),
        "total_projects": 28,
        "active_projects": 15,
        "databases": 3,
        "total_tables": 100
    },

    # =========================================================================
    # FRONTENDS (Apps Web/Mobile)
    # =========================================================================
    "frontends": {
        "invistto-hub": {
            "name": "Invistto Hub",
            "description": "Central Hub - SSO Gateway para todos os apps",
            "port": 5173,
            "production_path": "/hub/",
            "react_version": "19.2.0",
            "state_management": "TanStack Query v5.90.18",
            "ui_framework": "TailwindCSS + Heroicons + Lucide",
            "http_client": "axios 1.13.2",
            "auth": "@invistto/auth-react",
            "auth_config": {
                "tokenKey": "@invistto-hub:token",
                "userKey": "@invistto-hub:user",
                "useCookies": "!isTauri",
                "validateOnLoad": True
            },
            "platforms": ["Web", "Desktop (Tauri 2)", "Mobile (Capacitor 6)"],
            "special": "SSO com código seguro (30s)"
        },
        "admin-panel-v2": {
            "name": "Admin Panel",
            "description": "Painel administrativo - Gestão de usuários, bases, roles",
            "port": 5173,
            "production_path": "/admin/",
            "react_version": "18.3.1",
            "state_management": "TanStack Query v5.90.12",
            "ui_framework": "TailwindCSS",
            "http_client": "axios",
            "auth": "@invistto/auth-react",
            "auth_config": {
                "tokenKey": "@ari:token",
                "userKey": "@ari:user",
                "useCookies": True,
                "validateOnLoad": True
            },
            "backend_port": 3002,
            "type": "monorepo"
        },
        "courier-v3": {
            "name": "Courier Analytics",
            "description": "Dashboard WhatsApp - ROI campanhas, análise produtos",
            "port": 3008,
            "production_path": "/courier/",
            "react_version": "19.2.3",
            "state_management": "TanStack Query v5.90.20",
            "ui_framework": "TailwindCSS + Lucide + Recharts",
            "http_client": "axios",
            "auth": "@invistto/auth-react",
            "auth_config": {
                "tokenKey": "@courier:token",
                "userKey": "@courier:user",
                "useCookies": True,
                "validateOnLoad": True
            },
            "backend_port": 3333,
            "type": "monorepo"
        },
        "invistto-bi": {
            "name": "Invistto BI",
            "description": "Business Intelligence - Vendas, financeiro, estoque",
            "port": 3007,
            "production_path": "/bi/",
            "react_version": "19.1.0",
            "state_management": "TanStack Query v5.84.1",
            "ui_framework": "TailwindCSS + Heroicons + Radix UI + Recharts",
            "http_client": "axios 1.4.0",
            "auth": "@invistto/auth-react",
            "auth_config": {
                "tokenKey": "@invistto-bi:token",
                "userKey": "@invistto-bi:user",
                "useCookies": True,
                "validateOnLoad": True
            },
            "backend": "ARI (porta 3010)",
            "platforms": ["Web", "Mobile (Capacitor 6)"]
        },
        "zeiss-api-client": {
            "name": "Zeiss Lab Client",
            "description": "Integração Carl Zeiss Vision - Catálogo, pedidos, preços",
            "port": 3006,
            "production_path": "/zeiss/",
            "react_version": "19.1.0",
            "state_management": "TanStack Query v5.84.1",
            "ui_framework": "Material UI 7.3.1 + TailwindCSS + Recharts",
            "http_client": "axios 1.4.0",
            "auth": "@invistto/auth-react",
            "backend_port": 3005,
            "special": "Integração Zeiss SAO API + Firebird multi-tenant"
        },
        "olhovivo-lens": {
            "name": "OlhoVivo Lentes",
            "description": "Hub multi-laboratório - Zeiss, Rodenstock, HOYA, Essilor",
            "port": 3009,
            "production_path": "/lentes/",
            "react_version": "19.1.0",
            "state_management": "TanStack Query v5.84.1",
            "ui_framework": "TailwindCSS + Heroicons + Recharts",
            "http_client": "axios 1.4.0",
            "auth": "@invistto/auth-react",
            "backend_port": 3015,
            "platforms": ["Web", "Mobile (Capacitor 6)"]
        }
    },

    # =========================================================================
    # BACKENDS (APIs NestJS)
    # =========================================================================
    "backends": {
        "invistto-auth": {
            "name": "Auth API",
            "description": "Autenticação centralizada - JWT, SSO, password reset",
            "port": 3001,
            "framework": "NestJS 10.x",
            "orm": "MySQL2 (raw queries)",
            "database": "MySQL (painel.invistto.com:3305/invistto)",
            "endpoints": [
                "POST /auth/login",
                "GET /auth/validate",
                "POST /auth/refresh",
                "POST /auth/logout",
                "GET /auth/profile",
                "POST /auth/forgot-password",
                "POST /auth/reset-password",
                "POST /auth/sso/init",
                "POST /auth/sso/exchange",
                "POST /auth/sso/validate-token"
            ],
            "features": ["JWT 24h", "httpOnly cookies", "CSRF protection", "SSO código 30s"]
        },
        "admin-panel-api": {
            "name": "Admin Panel API",
            "description": "Backend do painel administrativo",
            "port": 3002,
            "framework": "NestJS 10.x",
            "orm": "Prisma",
            "database": "MySQL (painel.invistto.com:3305/invistto)",
            "models": ["User", "Role", "Permission", "Base", "UserRole", "UserBase", "RolePermission"]
        },
        "courier-api": {
            "name": "Courier V2 API",
            "description": "Backend analytics WhatsApp - 29 endpoints",
            "port": 3333,
            "framework": "NestJS 10.x",
            "orm": "Prisma + Firebird",
            "database": "MySQL + Firebird (multi-tenant)",
            "endpoints_count": 29,
            "features": ["DTOs validados", "SqlSafeValidator", "Cache Redis"]
        },
        "ari": {
            "name": "ARI - Analytics REST Invistto",
            "description": "API de BI - 11 domínios analytics",
            "port": 3010,
            "framework": "NestJS 11.x",
            "orm": "Knex.js",
            "database": "MySQL (painel.invistto.com:3305/invistto)",
            "modules": [
                "VendasModule", "FinanceiroModule", "VendedoresModule",
                "ClientesModule", "LojasModule", "ProdutosModule",
                "EstoqueModule", "MedicosModule", "ComprasModule",
                "OticaModule", "InsightsModule"
            ],
            "features": ["MCP Claude integration", "AI billing tracking"]
        },
        "zeiss-backend": {
            "name": "Zeiss Lab API",
            "description": "Backend integração Zeiss Vision",
            "port": 3005,
            "framework": "NestJS 10.x",
            "orm": "MySQL2 + Firebird",
            "database": "MySQL (zeiss_*) + Firebird (ERP)",
            "features": ["BullMQ jobs", "Redis cache", "WebSocket", "Zeiss SAO API"]
        },
        "olhovivo-backend": {
            "name": "OlhoVivo Lens API",
            "description": "Backend multi-laboratório",
            "port": 3015,
            "framework": "NestJS 10.3.0",
            "orm": "Prisma + Firebird",
            "database": "MySQL (lens_*) + Firebird",
            "features": ["Multi-lab consolidation", "Sync batch", "Margin calculation"]
        },
        "api-invistto": {
            "name": "API Invistto (Pontomarket)",
            "description": "CRM multi-tenant - Integração Pontomarket",
            "port": 3000,
            "framework": "NestJS 10.x",
            "orm": "MySQL2 (raw)",
            "database": "MySQL + Redis + RabbitMQ",
            "features": ["Rate limiting", "AI integration (Claude/OpenAI)", "Message queue"]
        },
        "sales-api": {
            "name": "Sales API",
            "description": "Gestão vendas óticas",
            "port": 3011,
            "framework": "NestJS 11.x",
            "orm": "Firebird + MySQL2",
            "database": "Firebird (ERP) + MySQL (auth)"
        },
        "dash-invistto-api": {
            "name": "Dashboard API",
            "description": "Métricas e indicadores",
            "port": 3333,
            "framework": "NestJS 11.x",
            "orm": "Prisma + Firebird",
            "database": "MySQL + Firebird"
        }
    },

    # =========================================================================
    # SERVIÇOS AUXILIARES
    # =========================================================================
    "services": {
        "ai-service": {
            "name": "AI Service",
            "description": "NLP e processamento de consultas naturais",
            "port": 3003,
            "framework": "NestJS 11.x",
            "integrates_with": ["ai-billing-service (3004)"]
        },
        "ai-billing-service": {
            "name": "AI Billing Service",
            "description": "Tracking de uso de AI (tokens, custos)",
            "port": 3004,
            "framework": "Express.js",
            "orm": "Prisma",
            "database": "MySQL",
            "features": ["Cron jobs", "Invoice generation", "Usage limits"]
        },
        "ari-whatsapp-service": {
            "name": "WhatsApp Service",
            "description": "Envio de mensagens WhatsApp via Web.js",
            "port": 3007,
            "framework": "NestJS 10.x",
            "queue": "Bull + Redis",
            "features": ["Rate limiting", "Retry strategy", "Session management"]
        },
        "servermcp": {
            "name": "ServerMCP",
            "description": "Gateway MCP para Claude Desktop",
            "port": 3002,
            "framework": "Express.js (Node.js)",
            "features": ["Basic→JWT conversion", "Circuit breaker", "Redis cache"],
            "integrates_with": ["ari (3010)", "ai-service (3003)"]
        }
    },

    # =========================================================================
    # PACOTES COMPARTILHADOS
    # =========================================================================
    "shared_packages": {
        "@invistto/auth-react": {
            "name": "Auth React",
            "description": "Autenticação React centralizada",
            "location": "invistto-auth/packages/react",
            "exports": ["AuthProvider", "useAuth", "usePermissions", "useUserRole"],
            "features": ["SSO support", "httpOnly cookies", "Token refresh"]
        },
        "@invistto/auth": {
            "name": "Auth Core",
            "description": "Guards e decorators NestJS",
            "location": "invistto-auth/packages/core",
            "exports": ["JwtAuthGuard", "RolesGuard", "@CurrentUser", "@Public", "@Roles"]
        },
        "@invistto/shared-system-config": {
            "name": "Shared Config",
            "description": "Configurações centralizadas",
            "location": "sharedconfig",
            "exports": ["InvisttoSystemConfig", "systemConfig"]
        },
        "@invistto/database-schema": {
            "name": "Database Schema",
            "description": "Prisma schema compartilhado",
            "location": "sharedschema",
            "exports": ["PrismaClient", "types"]
        }
    },

    # =========================================================================
    # BANCOS DE DADOS
    # =========================================================================
    "databases": {
        "mysql_main": {
            "name": "MySQL Principal",
            "host": "painel.invistto.com",
            "port": 3305,
            "database": "invistto",
            "tables_count": "80+",
            "key_tables": [
                "ariusers - Usuários do sistema",
                "base - Multi-tenant bases",
                "courier - Mensagens WhatsApp",
                "vd_pedido - Pedidos de venda",
                "vd_pedido_itens - Itens dos pedidos",
                "vd_campanha - Campanhas marketing",
                "ge_pessoa - Cadastro de pessoas",
                "ge_empresa - Empresas/Lojas",
                "es_produto - Produtos",
                "ari_ai_usage - Uso de AI",
                "ari_access_logs - Logs de acesso"
            ],
            "used_by": [
                "invistto-auth", "admin-panel-v2", "courier-v3",
                "ari", "api-invistto", "ai-billing-service"
            ]
        },
        "firebird_erp": {
            "name": "Firebird ERP",
            "host": "inv04.invistto.com (e outros)",
            "port": 3307,
            "description": "Bancos legados dos ERPs - 1 por cliente",
            "used_by": ["courier-v3", "zeiss-api-client", "olhovivo-lens", "sales-api", "dash-invistto-api"]
        },
        "redis": {
            "name": "Redis",
            "host": "localhost",
            "port": 6379,
            "databases": {
                "0": "ari-nest cache",
                "1": "servermcp cache"
            },
            "used_by": ["servermcp", "ari-whatsapp-service", "api-invistto", "zeiss-api-client"]
        }
    },

    # =========================================================================
    # PROBLEMAS DE PADRONIZAÇÃO
    # =========================================================================
    "standardization_issues": {
        "critical": [
            {
                "issue": "Versões React inconsistentes",
                "details": "18.3.1 (admin-panel) vs 19.1.0 (bi, zeiss, olhovivo) vs 19.2.0+ (hub, courier)",
                "recommendation": "Padronizar para React 19.1.0 (LTS estável)"
            },
            {
                "issue": "ORMs diferentes",
                "details": "Prisma vs Knex.js vs MySQL2 raw vs TypeORM",
                "recommendation": "Consolidar em Prisma para novos projetos"
            },
            {
                "issue": "Portas conflitantes",
                "details": "ARI e olhovivo-lens usam porta 3010",
                "recommendation": "olhovivo-lens já migrado para 3015"
            }
        ],
        "warnings": [
            {
                "issue": "Storage keys inconsistentes",
                "details": "@ari:token vs @courier:token vs @invistto-bi:token",
                "recommendation": "Padronizar para @invistto:{app}:token"
            },
            {
                "issue": "NestJS versions diferentes",
                "details": "10.x vs 11.x",
                "recommendation": "Migrar todos para NestJS 11.x"
            },
            {
                "issue": "Projetos legados sem manutenção",
                "details": "projeto-invistto, superV, superpdv, whoamii",
                "recommendation": "Arquivar ou depreciar oficialmente"
            }
        ],
        "improvements": [
            {
                "issue": "Monorepo inconsistente",
                "details": "admin-panel e courier são monorepo, outros são single",
                "recommendation": "Considerar turborepo/nx para todos"
            },
            {
                "issue": "Validação SQL",
                "details": "Apenas courier tem SqlSafeValidator",
                "recommendation": "Implementar em todos os backends"
            }
        ]
    },

    # =========================================================================
    # PORTAS EM USO
    # =========================================================================
    "ports_map": {
        3000: "api-invistto (Pontomarket CRM)",
        3001: "invistto-auth (Auth API)",
        3002: "admin-panel-api / servermcp",
        3003: "ai-service",
        3004: "ai-billing-service",
        3005: "zeiss-backend",
        3006: "zeiss-frontend",
        3007: "invistto-bi / ari-whatsapp-service",
        3008: "courier-frontend",
        3009: "olhovivo-lens-frontend",
        3010: "ari (Analytics API)",
        3011: "sales-api",
        3015: "olhovivo-lens-backend",
        3333: "courier-api / dash-invistto-api",
        5173: "admin-panel-frontend / invistto-hub"
    }
}

# ============================================================================
# GERAÇÃO DO HTML INTERATIVO
# ============================================================================

HTML_TEMPLATE = """
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Ecossistema Invistto - Mapa de Arquitetura</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://unpkg.com/mermaid@10/dist/mermaid.min.js"></script>
    <style>
        .card {{ transition: all 0.3s ease; }}
        .card:hover {{ transform: translateY(-2px); box-shadow: 0 10px 40px rgba(0,0,0,0.1); }}
        .mermaid {{ background: #f8fafc; border-radius: 8px; padding: 20px; }}
        details summary {{ cursor: pointer; }}
        details summary::-webkit-details-marker {{ display: none; }}
        .port-badge {{ font-family: monospace; }}
    </style>
</head>
<body class="bg-gray-50 min-h-screen">
    <div class="max-w-7xl mx-auto px-4 py-8">
        <!-- Header -->
        <header class="text-center mb-12">
            <h1 class="text-4xl font-bold text-gray-900 mb-2">🏗️ Ecossistema Invistto</h1>
            <p class="text-gray-600">Mapa completo de arquitetura - Gerado em {generated_at}</p>
            <div class="flex justify-center gap-4 mt-4">
                <span class="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                    {total_projects} Projetos
                </span>
                <span class="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                    {active_projects} Ativos
                </span>
                <span class="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm">
                    {databases} Bancos de Dados
                </span>
                <span class="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm">
                    ~{total_tables} Tabelas
                </span>
            </div>
        </header>

        <!-- Diagrama Principal -->
        <section class="mb-12">
            <h2 class="text-2xl font-bold text-gray-800 mb-4">📊 Diagrama de Arquitetura</h2>
            <div class="bg-white rounded-xl shadow-lg p-6 overflow-x-auto">
                <div class="mermaid">
flowchart TB
    subgraph HUB["🏠 INVISTTO HUB (SSO Gateway)"]
        HUB_WEB["Web :5173"]
        HUB_DESK["Desktop (Tauri)"]
        HUB_MOB["Mobile (Capacitor)"]
    end

    subgraph AUTH["🔐 AUTH API :3001"]
        AUTH_JWT["JWT + Cookies"]
        AUTH_SSO["SSO (30s codes)"]
    end

    subgraph FRONTENDS["🖥️ APLICAÇÕES FRONTEND"]
        ADMIN["Admin Panel\\n:5173 → /admin/"]
        COURIER["Courier Analytics\\n:3008 → /courier/"]
        BI["Invistto BI\\n:3007 → /bi/"]
        ZEISS_F["Zeiss Client\\n:3006 → /zeiss/"]
        LENS_F["OlhoVivo Lens\\n:3009 → /lentes/"]
    end

    subgraph BACKENDS["⚙️ APIS BACKEND"]
        ADMIN_API["Admin API\\n:3002"]
        COURIER_API["Courier API\\n:3333"]
        ARI["ARI Analytics\\n:3010"]
        ZEISS_B["Zeiss API\\n:3005"]
        LENS_B["Lens API\\n:3015"]
        SALES["Sales API\\n:3011"]
    end

    subgraph SERVICES["🔧 SERVIÇOS AUXILIARES"]
        AI["AI Service\\n:3003"]
        AI_BILL["AI Billing\\n:3004"]
        WA["WhatsApp\\n:3007"]
        MCP["ServerMCP\\n:3002"]
    end

    subgraph DATA["💾 DADOS"]
        MYSQL[("MySQL\\npainel.invistto.com:3305")]
        FB[("Firebird\\nERPs Legados")]
        REDIS[("Redis\\nlocalhost:6379")]
    end

    HUB --> AUTH
    FRONTENDS --> AUTH

    ADMIN --> ADMIN_API
    COURIER --> COURIER_API
    BI --> ARI
    ZEISS_F --> ZEISS_B
    LENS_F --> LENS_B

    BACKENDS --> MYSQL
    BACKENDS --> FB

    AI --> AI_BILL
    MCP --> ARI
    WA --> REDIS

    classDef hub fill:#3b82f6,stroke:#1d4ed8,color:#fff
    classDef auth fill:#ef4444,stroke:#dc2626,color:#fff
    classDef frontend fill:#10b981,stroke:#059669,color:#fff
    classDef backend fill:#8b5cf6,stroke:#7c3aed,color:#fff
    classDef service fill:#f59e0b,stroke:#d97706,color:#fff
    classDef data fill:#6366f1,stroke:#4f46e5,color:#fff

    class HUB_WEB,HUB_DESK,HUB_MOB hub
    class AUTH_JWT,AUTH_SSO auth
    class ADMIN,COURIER,BI,ZEISS_F,LENS_F frontend
    class ADMIN_API,COURIER_API,ARI,ZEISS_B,LENS_B,SALES backend
    class AI,AI_BILL,WA,MCP service
    class MYSQL,FB,REDIS data
                </div>
            </div>
        </section>

        <!-- Frontends -->
        <section class="mb-12">
            <h2 class="text-2xl font-bold text-gray-800 mb-4">🖥️ Aplicações Frontend</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {frontend_cards}
            </div>
        </section>

        <!-- Backends -->
        <section class="mb-12">
            <h2 class="text-2xl font-bold text-gray-800 mb-4">⚙️ APIs Backend</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {backend_cards}
            </div>
        </section>

        <!-- Serviços -->
        <section class="mb-12">
            <h2 class="text-2xl font-bold text-gray-800 mb-4">🔧 Serviços Auxiliares</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {service_cards}
            </div>
        </section>

        <!-- Bancos de Dados -->
        <section class="mb-12">
            <h2 class="text-2xl font-bold text-gray-800 mb-4">💾 Bancos de Dados</h2>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                {database_cards}
            </div>
        </section>

        <!-- Pacotes Compartilhados -->
        <section class="mb-12">
            <h2 class="text-2xl font-bold text-gray-800 mb-4">📦 Pacotes Compartilhados</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {package_cards}
            </div>
        </section>

        <!-- Mapa de Portas -->
        <section class="mb-12">
            <h2 class="text-2xl font-bold text-gray-800 mb-4">🔌 Mapa de Portas</h2>
            <div class="bg-white rounded-xl shadow-lg p-6">
                <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    {port_badges}
                </div>
            </div>
        </section>

        <!-- Problemas de Padronização -->
        <section class="mb-12">
            <h2 class="text-2xl font-bold text-gray-800 mb-4">⚠️ Problemas de Padronização</h2>

            <div class="space-y-4">
                <details class="bg-red-50 rounded-xl p-4 border border-red-200">
                    <summary class="font-bold text-red-800 flex items-center gap-2">
                        🔴 Críticos ({critical_count})
                    </summary>
                    <div class="mt-4 space-y-3">
                        {critical_issues}
                    </div>
                </details>

                <details class="bg-yellow-50 rounded-xl p-4 border border-yellow-200">
                    <summary class="font-bold text-yellow-800 flex items-center gap-2">
                        🟡 Avisos ({warning_count})
                    </summary>
                    <div class="mt-4 space-y-3">
                        {warning_issues}
                    </div>
                </details>

                <details class="bg-blue-50 rounded-xl p-4 border border-blue-200">
                    <summary class="font-bold text-blue-800 flex items-center gap-2">
                        🔵 Melhorias ({improvement_count})
                    </summary>
                    <div class="mt-4 space-y-3">
                        {improvement_issues}
                    </div>
                </details>
            </div>
        </section>

        <!-- Stack Padrão -->
        <section class="mb-12">
            <h2 class="text-2xl font-bold text-gray-800 mb-4">✅ Stack Padrão Recomendada</h2>
            <div class="bg-white rounded-xl shadow-lg p-6">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                        <h3 class="font-bold text-lg mb-3 text-green-700">Frontend</h3>
                        <ul class="space-y-2 text-gray-700">
                            <li>✓ <strong>React 19.1.0</strong> (LTS estável)</li>
                            <li>✓ <strong>TypeScript 5.x</strong></li>
                            <li>✓ <strong>Vite</strong> (build tool)</li>
                            <li>✓ <strong>TanStack Query v5</strong> (state/cache)</li>
                            <li>✓ <strong>TailwindCSS</strong> (styling)</li>
                            <li>✓ <strong>Axios</strong> (HTTP client)</li>
                            <li>✓ <strong>@invistto/auth-react</strong> (auth)</li>
                            <li>✓ <strong>Recharts</strong> (charts)</li>
                            <li>✓ <strong>Capacitor 6</strong> (mobile)</li>
                        </ul>
                    </div>
                    <div>
                        <h3 class="font-bold text-lg mb-3 text-purple-700">Backend</h3>
                        <ul class="space-y-2 text-gray-700">
                            <li>✓ <strong>NestJS 11.x</strong></li>
                            <li>✓ <strong>TypeScript 5.x</strong></li>
                            <li>✓ <strong>Prisma</strong> (ORM MySQL)</li>
                            <li>✓ <strong>@invistto/auth</strong> (guards)</li>
                            <li>✓ <strong>class-validator</strong> (DTOs)</li>
                            <li>✓ <strong>Swagger</strong> (docs)</li>
                            <li>✓ <strong>Redis</strong> (cache)</li>
                            <li>✓ <strong>Bull</strong> (queues)</li>
                            <li>✓ <strong>node-firebird</strong> (legacy)</li>
                        </ul>
                    </div>
                </div>
            </div>
        </section>

        <!-- Footer -->
        <footer class="text-center text-gray-500 py-8 border-t">
            <p>Gerado automaticamente por Claude Code</p>
            <p class="text-sm mt-1">Última atualização: {generated_at}</p>
        </footer>
    </div>

    <script>
        mermaid.initialize({{{{ startOnLoad: true, theme: 'default' }}}});
    </script>
</body>
</html>
"""

def generate_frontend_cards(frontends):
    cards = []
    for key, app in frontends.items():
        platforms = ", ".join(app.get("platforms", ["Web"]))
        card = f"""
        <div class="card bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
            <div class="flex justify-between items-start mb-3">
                <h3 class="font-bold text-lg text-gray-800">{app['name']}</h3>
                <span class="port-badge bg-green-100 text-green-800 px-2 py-1 rounded text-sm">:{app['port']}</span>
            </div>
            <p class="text-gray-600 text-sm mb-3">{app['description']}</p>
            <div class="space-y-1 text-xs text-gray-500">
                <p><strong>React:</strong> {app['react_version']}</p>
                <p><strong>State:</strong> {app['state_management']}</p>
                <p><strong>Path:</strong> {app.get('production_path', '/')}</p>
                <p><strong>Plataformas:</strong> {platforms}</p>
            </div>
        </div>
        """
        cards.append(card)
    return "\n".join(cards)

def generate_backend_cards(backends):
    cards = []
    for key, api in backends.items():
        features = ", ".join(api.get("features", [])[:3]) if api.get("features") else "N/A"
        card = f"""
        <div class="card bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
            <div class="flex justify-between items-start mb-3">
                <h3 class="font-bold text-lg text-gray-800">{api['name']}</h3>
                <span class="port-badge bg-purple-100 text-purple-800 px-2 py-1 rounded text-sm">:{api['port']}</span>
            </div>
            <p class="text-gray-600 text-sm mb-3">{api['description']}</p>
            <div class="space-y-1 text-xs text-gray-500">
                <p><strong>Framework:</strong> {api['framework']}</p>
                <p><strong>ORM:</strong> {api['orm']}</p>
                <p><strong>DB:</strong> {api.get('database', 'N/A')[:40]}...</p>
            </div>
        </div>
        """
        cards.append(card)
    return "\n".join(cards)

def generate_service_cards(services):
    cards = []
    for key, svc in services.items():
        card = f"""
        <div class="card bg-white rounded-xl shadow-lg p-4 border-l-4 border-orange-500">
            <div class="flex justify-between items-start mb-2">
                <h3 class="font-bold text-gray-800">{svc['name']}</h3>
                <span class="port-badge bg-orange-100 text-orange-800 px-2 py-1 rounded text-xs">:{svc['port']}</span>
            </div>
            <p class="text-gray-600 text-xs">{svc['description']}</p>
        </div>
        """
        cards.append(card)
    return "\n".join(cards)

def generate_database_cards(databases):
    cards = []
    colors = {"mysql_main": "indigo", "firebird_erp": "amber", "redis": "rose"}
    for key, db in databases.items():
        color = colors.get(key, "gray")
        used_by = ", ".join(db.get("used_by", [])[:4]) if db.get("used_by") else "N/A"
        card = f"""
        <div class="card bg-white rounded-xl shadow-lg p-6 border-l-4 border-{color}-500">
            <h3 class="font-bold text-lg text-gray-800 mb-2">{db['name']}</h3>
            <p class="text-gray-600 text-sm mb-3">{db.get('host', '')}:{db.get('port', '')}</p>
            <p class="text-xs text-gray-500"><strong>Usado por:</strong> {used_by}</p>
        </div>
        """
        cards.append(card)
    return "\n".join(cards)

def generate_package_cards(packages):
    cards = []
    for key, pkg in packages.items():
        exports = ", ".join(pkg.get("exports", [])[:3])
        card = f"""
        <div class="card bg-white rounded-xl shadow-lg p-4 border-l-4 border-cyan-500">
            <h3 class="font-bold text-gray-800 text-sm mb-1">{key}</h3>
            <p class="text-gray-600 text-xs mb-2">{pkg['description']}</p>
            <p class="text-xs text-gray-400">Exports: {exports}</p>
        </div>
        """
        cards.append(card)
    return "\n".join(cards)

def generate_port_badges(ports):
    badges = []
    colors = {
        "auth": "red", "frontend": "green", "backend": "purple",
        "service": "orange", "data": "indigo"
    }
    for port, desc in sorted(ports.items()):
        color = "gray"
        if "auth" in desc.lower(): color = "red"
        elif "frontend" in desc.lower() or port in [3006, 3007, 3008, 3009, 5173]: color = "green"
        elif "api" in desc.lower() or "backend" in desc.lower(): color = "purple"
        elif "service" in desc.lower(): color = "orange"

        badge = f"""
        <div class="bg-{color}-100 text-{color}-800 px-3 py-2 rounded-lg text-center">
            <div class="font-mono font-bold">:{port}</div>
            <div class="text-xs truncate">{desc[:20]}</div>
        </div>
        """
        badges.append(badge)
    return "\n".join(badges)

def generate_issues(issues_list):
    items = []
    for issue in issues_list:
        item = f"""
        <div class="bg-white rounded-lg p-3">
            <p class="font-semibold text-gray-800">{issue['issue']}</p>
            <p class="text-sm text-gray-600 mt-1">{issue['details']}</p>
            <p class="text-sm text-green-700 mt-1">💡 {issue['recommendation']}</p>
        </div>
        """
        items.append(item)
    return "\n".join(items)

def main():
    data = ECOSYSTEM_DATA

    html = HTML_TEMPLATE.format(
        generated_at=data["meta"]["generated_at"][:19],
        total_projects=data["meta"]["total_projects"],
        active_projects=data["meta"]["active_projects"],
        databases=data["meta"]["databases"],
        total_tables=data["meta"]["total_tables"],
        frontend_cards=generate_frontend_cards(data["frontends"]),
        backend_cards=generate_backend_cards(data["backends"]),
        service_cards=generate_service_cards(data["services"]),
        database_cards=generate_database_cards(data["databases"]),
        package_cards=generate_package_cards(data["shared_packages"]),
        port_badges=generate_port_badges(data["ports_map"]),
        critical_count=len(data["standardization_issues"]["critical"]),
        warning_count=len(data["standardization_issues"]["warnings"]),
        improvement_count=len(data["standardization_issues"]["improvements"]),
        critical_issues=generate_issues(data["standardization_issues"]["critical"]),
        warning_issues=generate_issues(data["standardization_issues"]["warnings"]),
        improvement_issues=generate_issues(data["standardization_issues"]["improvements"])
    )

    output_path = "/home/robson/Documentos/projetos/codigo-fonte/ECOSSISTEMA-INVISTTO.html"
    with open(output_path, "w", encoding="utf-8") as f:
        f.write(html)

    print(f"✅ Diagrama gerado: {output_path}")
    print(f"📊 Total de projetos mapeados: {data['meta']['total_projects']}")
    print(f"🔌 Portas em uso: {len(data['ports_map'])}")
    print(f"⚠️  Problemas identificados: {len(data['standardization_issues']['critical']) + len(data['standardization_issues']['warnings']) + len(data['standardization_issues']['improvements'])}")

    # Exportar também como JSON para referência
    json_path = "/home/robson/Documentos/projetos/codigo-fonte/ECOSSISTEMA-INVISTTO.json"
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    print(f"📄 Dados JSON: {json_path}")

    # Abrir no navegador
    import webbrowser
    webbrowser.open(f"file://{output_path}")

if __name__ == "__main__":
    main()
