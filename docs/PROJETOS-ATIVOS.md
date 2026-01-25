# Projetos Ativos - Ecossistema Invistto

**Atualizado em:** 2026-01-24
**Critério:** Último commit de Dezembro 2025 em diante

---

## Resumo Rápido

| # | Projeto | Última Alteração | Porta(s) | Função |
|---|---------|------------------|----------|--------|
| 1 | **invistto-hub** | 2026-01-24 | 5173 | SSO Gateway central |
| 2 | **invistto-auth** | 2026-01-24 | 3001 | API de autenticação |
| 3 | **admin-panel-v2** | 2026-01-24 | 5173/3002 | Painel administrativo |
| 4 | **courier-v3** | 2026-01-24 | 3008/3333 | Analytics WhatsApp |
| 5 | **invistto-bi** | 2026-01-24 | 3007 | Business Intelligence |
| 6 | **zeiss-api-client** | 2026-01-24 | 3006/3005 | Integração Zeiss Vision |
| 7 | **olhovivo-lens** | 2026-01-24 | 3009/3015 | Hub multi-laboratório |
| 8 | **ari** | 2026-01-24 | 3010 | API Analytics (BI) |
| 9 | **api-invistto** | 2026-01-24 | 3000 | CRM Pontomarket |
| 10 | **servermcp** | 2026-01-24 | 3002 | Gateway MCP Claude |
| 11 | **invistto-template** | 2026-01-24 | - | Template base |
| 12 | **sales-api** | 2025-12-06 | 3011 | Vendas óticas |

---

## 1. INVISTTO-HUB (Central)

**Função:** Gateway SSO - Ponto de entrada para todos os apps

```
Tipo: Frontend only (Web + Desktop + Mobile)
Porta: 5173 (dev) | /hub/ (prod)
React: 19.2.0
State: TanStack Query v5.90.18
UI: TailwindCSS + Heroicons + Lucide
Auth: @invistto/auth-react (useCookies: !isTauri)
Plataformas: Web, Tauri 2 (Desktop), Capacitor 6 (Mobile)
```

**Fluxo SSO:**
1. Usuário faz login no Hub
2. Hub gera código SSO (30 segundos)
3. Abre app com `?sso_code=xxx`
4. App troca código por cookies httpOnly
5. Usuário logado automaticamente

---

## 2. INVISTTO-AUTH (Autenticação)

**Função:** API centralizada de autenticação

```
Tipo: NestJS Backend
Porta: 3001
Framework: NestJS 10.x
ORM: MySQL2 (raw queries)
DB: MySQL (painel.invistto.com:3305/invistto)
```

**Endpoints:**
- `POST /auth/login` - Login com email/senha
- `GET /auth/validate` - Validar token JWT
- `POST /auth/refresh` - Renovar token
- `POST /auth/logout` - Logout
- `POST /auth/sso/init` - Iniciar SSO (gera código)
- `POST /auth/sso/exchange` - Trocar código por token
- `POST /auth/sso/validate-token` - Validar token e setar cookies

**Features:** JWT 24h, httpOnly cookies, CSRF protection, SSO código 30s

---

## 3. ADMIN-PANEL-V2 (Administração)

**Função:** Painel de gestão de usuários, bases, roles, páginas

```
Tipo: Monorepo (pnpm + Turbo)
├── apps/web (Frontend)
│   Porta: 5173 | /admin/ (prod)
│   React: 18.3.1
│   State: TanStack Query v5.90.12
│   Auth: @invistto/auth-react (useCookies: true)
│
└── apps/api (Backend)
    Porta: 3002
    Framework: NestJS 10.x
    ORM: Prisma
    DB: MySQL
```

**Tabelas Prisma:**
- User, Role, Permission
- Base (com config Firebird)
- UserRole, UserBase, RolePermission

---

## 4. COURIER-V3 (WhatsApp Analytics)

**Função:** Dashboard de ROI campanhas WhatsApp

```
Tipo: Monorepo (pnpm + Turbo)
├── apps/web (Frontend)
│   Porta: 3008 | /courier/ (prod)
│   React: 19.2.3
│   State: TanStack Query v5.90.20
│   Charts: Recharts 3.1.2
│   Auth: @invistto/auth-react (useCookies: true)
│
└── apps/api (Backend)
    Porta: 3333
    Framework: NestJS 10.x
    ORM: Prisma + Firebird
    DB: MySQL + Firebird (multi-tenant)
    Endpoints: 29
```

**Features:** SqlSafeValidator, DTOs validados, Cache Redis, V3 removido

---

## 5. INVISTTO-BI (Business Intelligence)

**Função:** Dashboards de vendas, financeiro, estoque

```
Tipo: Single project
Porta: 3007 | /bi/ (prod)
React: 19.1.0
State: TanStack Query v5.84.1
Charts: Recharts 3.1.2
UI: TailwindCSS + Heroicons + Radix UI
Auth: @invistto/auth-react (useCookies: true)
Backend: ARI (porta 3010)
Mobile: Capacitor 6 (iOS/Android)
```

**Módulos Analytics:**
- Vendas, Financeiro, Vendedores
- Clientes, Lojas, Produtos
- Estoque, Médicos, Compras
- Ótica, Insights (AI)

---

## 6. ZEISS-API-CLIENT (Integração Zeiss)

**Função:** Catálogo, preços e pedidos Carl Zeiss Vision

```
Tipo: Full-stack (frontend + backend separados)
├── Frontend
│   Porta: 3006 | /zeiss/ (prod)
│   React: 19.1.0
│   UI: Material UI 7.3.1 + TailwindCSS
│   Auth: @invistto/auth-react
│
└── Backend
    Porta: 3005
    Framework: NestJS 10.x
    ORM: MySQL2 + Firebird
    DB: MySQL (zeiss_*) + Firebird (ERP)
```

**Features:** BullMQ jobs, Redis cache, WebSocket, Zeiss SAO API

---

## 7. OLHOVIVO-LENS (Multi-Laboratório)

**Função:** Hub consolidado de catálogos (Zeiss, Rodenstock, HOYA, Essilor)

```
Tipo: Full-stack (frontend + backend)
├── Frontend
│   Porta: 3009 | /lentes/ (prod)
│   React: 19.1.0
│   Charts: Recharts 3.1.2
│   Auth: @invistto/auth-react
│   Mobile: Capacitor 6
│
└── Backend
    Porta: 3015
    Framework: NestJS 10.3.0
    ORM: Prisma + Firebird
    DB: MySQL (lens_*) + Firebird
```

**Features:** Sync batch, margin calculation, Firebird distribution

---

## 8. ARI (Analytics REST Invistto)

**Função:** API de BI - Serve dados para invistto-bi

```
Tipo: NestJS Backend
Porta: 3010
Framework: NestJS 11.x
ORM: Knex.js
DB: MySQL (painel.invistto.com:3305/invistto)
```

**11 Módulos Analytics:**
- VendasModule, FinanceiroModule, VendedoresModule
- ClientesModule, LojasModule, ProdutosModule
- EstoqueModule, MedicosModule, ComprasModule
- OticaModule, InsightsModule

**Features:** MCP Claude integration, AI billing tracking

---

## 9. API-INVISTTO (CRM Pontomarket)

**Função:** CRM multi-tenant com integração Pontomarket

```
Tipo: NestJS Backend
Porta: 3000
Framework: NestJS 10.x
ORM: MySQL2 (raw)
DB: MySQL + Redis + RabbitMQ (opcional)
```

**Features:** Rate limiting, AI integration (Claude/OpenAI), Message queue

---

## 10. SERVERMCP (Gateway MCP)

**Função:** Gateway para Claude Desktop

```
Tipo: Express.js (Node.js puro)
Porta: 3002
Cache: Redis (DB 0 e 1)
```

**Features:**
- Basic Auth → JWT conversion
- Circuit breaker
- Proxy para ARI (:3010)
- AI providers (Anthropic + OpenAI)

---

## 11. INVISTTO-TEMPLATE

**Função:** Boilerplate para novos projetos

```
Tipo: Template
Frontend: React 19 + Vite + TailwindCSS
Backend: NestJS 10.3.0
Mobile: Capacitor 6
Auth: @invistto/auth-react (centralizado)
```

**Uso:** `npm run setup` → preenche placeholders

---

## 12. SALES-API

**Função:** Gestão de vendas óticas

```
Tipo: NestJS Backend
Porta: 3011
Framework: NestJS 11.x
ORM: Firebird + MySQL2
DB: Firebird (ERP) + MySQL (auth)
```

---

## Diagrama de Relacionamento

```
                    ┌─────────────────┐
                    │  INVISTTO HUB   │
                    │     :5173       │
                    └────────┬────────┘
                             │ SSO
                    ┌────────▼────────┐
                    │  INVISTTO-AUTH  │
                    │     :3001       │
                    └────────┬────────┘
                             │
    ┌────────────────────────┼────────────────────────┐
    │            │           │           │            │
┌───▼───┐  ┌─────▼─────┐ ┌───▼───┐ ┌─────▼─────┐ ┌────▼────┐
│ADMIN  │  │  COURIER  │ │  BI   │ │  ZEISS    │ │ LENS    │
│:5173  │  │   :3008   │ │ :3007 │ │  :3006    │ │ :3009   │
└───┬───┘  └─────┬─────┘ └───┬───┘ └─────┬─────┘ └────┬────┘
    │            │           │           │            │
┌───▼───┐  ┌─────▼─────┐     │     ┌─────▼─────┐ ┌────▼────┐
│:3002  │  │   :3333   │     │     │   :3005   │ │ :3015   │
└───────┘  └───────────┘     │     └───────────┘ └─────────┘
                             │
                      ┌──────▼──────┐
                      │    ARI      │
                      │   :3010     │
                      └─────────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
       ┌──────▼──────┐  ┌────▼────┐  ┌──────▼──────┐
       │    MySQL    │  │ Firebird │  │   Redis    │
       │painel:3305  │  │  (ERPs)  │  │ localhost  │
       └─────────────┘  └──────────┘  └────────────┘
```

---

## Projetos Inativos (Antes de Dez 2025)

| Projeto | Último Commit | Status |
|---------|---------------|--------|
| ai-service | 2025-08-18 | Aguardando integração |
| ai-billing-service | 2025-07-15 | Aguardando integração |
| ari-whatsapp-service | 2025-07-15 | Pausado |
| sharedconfig | 2025-07-15 | Estável (pacote) |
| sharedschema | 2025-09-30 | Estável (pacote) |
| olhovivo | 2025-09-12 | Depreciado (usar olhovivo-lens) |
| projeto-invistto | Antigo | Legado |
| superV, superpdv | Antigo | Legado |

---

## Stack Atual (Projetos Ativos)

### Frontend
| Tecnologia | Versão Atual | Projetos |
|------------|--------------|----------|
| React | 18.3.1 - 19.2.3 | Todos |
| TanStack Query | v5.84 - v5.90 | Todos |
| TailwindCSS | v3.x | Todos |
| Axios | Latest | Todos |
| @invistto/auth-react | Local | Todos |
| Capacitor | 6.x | BI, Lens, Hub |

### Backend
| Tecnologia | Versão | Projetos |
|------------|--------|----------|
| NestJS | 10.x - 11.x | Todos |
| Prisma | 6.x | Admin, Courier, Lens |
| Knex.js | Latest | ARI |
| MySQL2 | Latest | Auth, API-Invistto |
| node-firebird | Latest | Courier, Zeiss, Lens, Sales |

---

## Bancos de Dados Ativos

### MySQL Principal
- **Host:** painel.invistto.com:3305
- **Database:** invistto
- **Usado por:** auth, admin, courier, ari, api-invistto, bi

### Firebird (Multi-tenant)
- **Hosts:** Vários (1 por cliente)
- **Usado por:** courier, zeiss, lens, sales

### Redis
- **Host:** localhost:6379
- **Usado por:** servermcp, api-invistto, zeiss
