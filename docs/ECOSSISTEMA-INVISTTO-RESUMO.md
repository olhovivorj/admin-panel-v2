# Ecossistema Invistto - Resumo Executivo

**Gerado em:** 2026-01-24
**Total de Projetos:** 28 | **Ativos:** 15 | **Bancos:** 3 | **Tabelas:** ~100

---

## Arquitetura Geral

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           INVISTTO HUB (SSO Gateway)                        │
│                     Web :5173 | Desktop (Tauri) | Mobile (Capacitor)        │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          AUTH API :3001 (Centralizado)                       │
│              JWT (24h) + httpOnly Cookies + SSO (código 30s)                │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
        ┌─────────────┬───────────────┼───────────────┬─────────────┐
        ▼             ▼               ▼               ▼             ▼
┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│ Admin Panel │ │   Courier   │ │ Invistto BI │ │ Zeiss Client│ │OlhoVivo Lens│
│ :5173/admin │ │ :3008/courier│ │ :3007/bi    │ │ :3006/zeiss │ │ :3009/lentes│
└─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘
        │             │               │               │             │
        ▼             ▼               ▼               ▼             ▼
┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│ Admin API   │ │ Courier API │ │  ARI API    │ │  Zeiss API  │ │  Lens API   │
│    :3002    │ │    :3333    │ │    :3010    │ │    :3005    │ │    :3015    │
└─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘
        │             │               │               │             │
        └─────────────┴───────────────┼───────────────┴─────────────┘
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              BANCOS DE DADOS                                │
│  MySQL (painel.invistto.com:3305) │ Firebird (ERPs) │ Redis (cache/queue)  │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Mapa de Portas

| Porta | Serviço | Tipo |
|-------|---------|------|
| **3000** | api-invistto (Pontomarket CRM) | Backend |
| **3001** | invistto-auth (Auth API) | Backend |
| **3002** | admin-panel-api / servermcp | Backend |
| **3003** | ai-service | Backend |
| **3004** | ai-billing-service | Backend |
| **3005** | zeiss-backend | Backend |
| **3006** | zeiss-frontend | Frontend |
| **3007** | invistto-bi / ari-whatsapp-service | Frontend/Service |
| **3008** | courier-frontend | Frontend |
| **3009** | olhovivo-lens-frontend | Frontend |
| **3010** | ari (Analytics API) | Backend |
| **3011** | sales-api | Backend |
| **3015** | olhovivo-lens-backend | Backend |
| **3333** | courier-api / dash-invistto-api | Backend |
| **5173** | admin-panel-frontend / invistto-hub | Frontend |

---

## Stack Padronizada

### Frontend
| Tecnologia | Versão | Status |
|------------|--------|--------|
| React | 19.1.0 | Recomendado |
| TypeScript | 5.x | Padrão |
| Vite | Latest | Padrão |
| TanStack Query | v5.x | Padrão |
| TailwindCSS | v3.x | Padrão |
| Axios | Latest | Padrão |
| @invistto/auth-react | Local | Padrão |
| Recharts | 3.x | Charts |
| Capacitor | 6.x | Mobile |

### Backend
| Tecnologia | Versão | Status |
|------------|--------|--------|
| NestJS | 11.x | Recomendado |
| TypeScript | 5.x | Padrão |
| Prisma | 6.x | Recomendado (ORM) |
| @invistto/auth | Local | Padrão |
| class-validator | Latest | Validação |
| Swagger | Latest | Docs |
| Redis | 7.x | Cache |
| Bull | 4.x | Queues |

---

## Bancos de Dados

### MySQL Principal
- **Host:** painel.invistto.com:3305
- **Database:** invistto
- **Tabelas principais:**
  - `ariusers` - Usuários do sistema
  - `base` - Multi-tenant bases (clientes)
  - `courier` - Mensagens WhatsApp
  - `vd_pedido` / `vd_pedido_itens` - Vendas
  - `vd_campanha` - Campanhas marketing
  - `ge_pessoa` / `ge_empresa` - Cadastros
  - `es_produto` - Produtos
  - `ari_ai_*` - Tabelas de AI billing

### Firebird (ERPs Legados)
- **Host:** Vários (1 banco por cliente)
- **Exemplo:** inv04.invistto.com:3307/db_qualina
- **Uso:** Dados do ERP (vendas, estoque, clientes)

### Redis
- **Host:** localhost:6379
- **DB 0:** ari-nest cache
- **DB 1:** servermcp cache
- **Uso:** Cache, filas (Bull), sessões

---

## Pacotes Compartilhados

| Pacote | Localização | Função |
|--------|-------------|--------|
| `@invistto/auth-react` | invistto-auth/packages/react | AuthProvider, hooks React |
| `@invistto/auth` | invistto-auth/packages/core | Guards, decorators NestJS |
| `@invistto/shared-system-config` | sharedconfig | Configurações centralizadas |
| `@invistto/database-schema` | sharedschema | Prisma schema compartilhado |

---

## Problemas de Padronização

### Críticos
1. **Versões React inconsistentes**
   - Admin: 18.3.1 | BI/Zeiss/Lens: 19.1.0 | Hub/Courier: 19.2.x
   - **Ação:** Padronizar para React 19.1.0

2. **ORMs diferentes**
   - Prisma, Knex.js, MySQL2 raw, TypeORM
   - **Ação:** Consolidar em Prisma para novos projetos

3. **Portas conflitantes (resolvido)**
   - ARI e olhovivo-lens usavam 3010
   - **Resolvido:** olhovivo-lens migrado para 3015

### Avisos
1. **Storage keys inconsistentes**
   - `@ari:token` vs `@courier:token` vs `@invistto-bi:token`
   - **Ação:** Padronizar para `@invistto:{app}:token`

2. **NestJS versions**
   - 10.x vs 11.x
   - **Ação:** Migrar todos para 11.x

3. **Projetos legados**
   - projeto-invistto, superV, superpdv, whoamii
   - **Ação:** Arquivar ou depreciar

### Melhorias
1. **Monorepo inconsistente**
   - Apenas admin-panel e courier são monorepo
   - **Considerar:** turborepo/nx para todos

2. **Validação SQL**
   - Apenas courier tem SqlSafeValidator
   - **Ação:** Implementar em todos backends

---

## Fluxo de Autenticação

```
1. Usuário acessa Hub
2. Hub → POST /auth/login → Recebe JWT + cookies
3. Hub → POST /auth/sso/init → Gera código SSO (30s)
4. Hub abre App com ?sso_code=xxx
5. App → POST /auth/sso/exchange → Recebe cookies httpOnly
6. App logado automaticamente (SSO)
7. Logout → Volta para Hub
```

---

## Arquivos de Referência

- **Diagrama HTML:** `ECOSSISTEMA-INVISTTO.html`
- **Dados JSON:** `ECOSSISTEMA-INVISTTO.json`
- **Script Python:** `ECOSSISTEMA-INVISTTO.py`
- **Este resumo:** `ECOSSISTEMA-INVISTTO-RESUMO.md`

---

## Próximos Passos Recomendados

1. [ ] Padronizar React para 19.1.0 em todos os projetos
2. [ ] Migrar NestJS 10.x → 11.x
3. [ ] Implementar SqlSafeValidator em todos backends
4. [ ] Padronizar storage keys
5. [ ] Arquivar projetos legados
6. [ ] Documentar APIs com Swagger (todos)
7. [ ] Implementar testes automatizados
