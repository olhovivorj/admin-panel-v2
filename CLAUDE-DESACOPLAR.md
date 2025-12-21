# CLAUDE-DESACOPLAR.md - Plano de Desacoplamento admin-panel-v2

## Contexto

### Situacao Atual
- **Frontend**: `admin-panel-v2` (React 18 + Vite + TailwindCSS)
- **Backend**: `ari-nest` (NestJS + Prisma + MySQL) - projeto externo
- **Schema**: `@invistto/database-schema` - pacote compartilhado com 50K+ linhas
- **Config**: `@invistto/shared-system-config` - constantes do sistema

### Objetivo
Criar **monorepo autonomo** com backend proprio embutido, eliminando dependencias externas.

### Estrutura Final
```
admin-panel-v2/
├── apps/
│   ├── api/           # Backend NestJS novo
│   └── web/           # Frontend React existente
├── packages/
│   └── shared/        # Tipos e utilitarios compartilhados
├── package.json       # Root workspace
├── turbo.json         # Turborepo config
└── pnpm-workspace.yaml
```

---

## Etapa 1: Setup do Monorepo

### 1.1 Configurar workspaces

**Arquivos a criar:**

`pnpm-workspace.yaml`:
```yaml
packages:
  - "apps/*"
  - "packages/*"
```

`turbo.json`:
```json
{
  "$schema": "https://turbo.build/schema.json",
  "pipeline": {
    "build": { "dependsOn": ["^build"], "outputs": ["dist/**"] },
    "dev": { "cache": false, "persistent": true },
    "lint": {}
  }
}
```

### 1.2 Reorganizar estrutura
1. Criar `apps/web/` e mover frontend atual
2. Criar `apps/api/` para novo backend
3. Criar `packages/shared/` para tipos

---

## Etapa 2: Criar Backend (apps/api)

### 2.1 Estrutura
```
apps/api/src/
├── modules/
│   ├── auth/       # Login, JWT, guards
│   ├── usuarios/   # CRUD usuarios
│   ├── bases/      # CRUD bases + Firebird
│   ├── roles/      # Roles e permissoes
│   └── erp/        # Integracao ERP Firebird
├── database/prisma/
└── common/guards/
```

### 2.2 Dependencias principais
- @nestjs/core, @nestjs/jwt, @nestjs/passport
- @prisma/client, node-firebird
- bcrypt, passport-jwt

---

## Etapa 3: Endpoints a Migrar (40+)

| Modulo | Endpoints | Prioridade |
|--------|-----------|------------|
| Auth | POST /login, GET /verify, GET /me, PATCH /change-password | P0 |
| Usuarios | GET/POST/PUT/DELETE /usuarios, bases, change-password | P0 |
| Bases | GET/POST/PUT/DELETE /bases, firebird-config, test-firebird | P1 |
| Roles | CRUD /roles, /permissions | P1 |
| ERP | /erp/pessoas, empresas, produtos, estoque, vendas | P2 |

### Detalhamento dos Endpoints

#### Modulo Auth (4 endpoints)
| Metodo | Rota | Descricao |
|--------|------|-----------|
| POST | /auth/login | Login com email/senha |
| GET | /auth/verify | Verificar token valido |
| GET | /auth/me | Dados do usuario logado |
| PATCH | /auth/change-password | Alterar senha propria |

#### Modulo Usuarios (8 endpoints)
| Metodo | Rota | Descricao |
|--------|------|-----------|
| GET | /usuarios | Listar usuarios (paginado) |
| GET | /usuarios/:id | Buscar usuario por ID |
| POST | /usuarios | Criar usuario |
| PUT | /usuarios/:id | Atualizar usuario |
| DELETE | /usuarios/:id | Remover usuario |
| PATCH | /usuarios/:id/change-password | Alterar senha de usuario |
| GET | /usuarios/:id/bases | Listar bases do usuario |
| POST | /usuarios/:id/bases | Atribuir bases ao usuario |

#### Modulo Bases (10 endpoints)
| Metodo | Rota | Descricao |
|--------|------|-----------|
| GET | /bases | Listar todas as bases |
| GET | /bases/:id | Buscar base por ID |
| POST | /bases | Criar base |
| PUT | /bases/:id | Atualizar base |
| DELETE | /bases/:id | Remover base |
| GET | /bases/:id/firebird | Configuracao Firebird da base |
| PUT | /bases/:id/firebird-config | Atualizar config Firebird |
| POST | /bases/:id/test-firebird | Testar conexao Firebird |
| GET | /bases/:id/usuarios | Usuarios com acesso a base |
| GET | /bases/:id/stats | Estatisticas da base |

#### Modulo Roles (7 endpoints)
| Metodo | Rota | Descricao |
|--------|------|-----------|
| GET | /roles | Listar roles |
| GET | /roles/:id | Buscar role por ID |
| POST | /roles | Criar role |
| PUT | /roles/:id | Atualizar role |
| DELETE | /roles/:id | Remover role |
| GET | /roles/:id/permissions | Permissoes da role |
| PUT | /roles/:id/permissions | Atribuir permissoes |

#### Modulo Permissions (4 endpoints)
| Metodo | Rota | Descricao |
|--------|------|-----------|
| GET | /permissions | Listar permissoes |
| GET | /permissions/grouped | Permissoes agrupadas por modulo |
| POST | /permissions | Criar permissao |
| DELETE | /permissions/:id | Remover permissao |

#### Modulo ERP (8 endpoints)
| Metodo | Rota | Descricao |
|--------|------|-----------|
| GET | /erp/pessoas | Listar pessoas (Firebird) |
| GET | /erp/pessoas/:id | Buscar pessoa |
| GET | /erp/empresas | Listar empresas |
| GET | /erp/empresas/:id | Buscar empresa |
| GET | /erp/produtos | Listar produtos |
| GET | /erp/estoque | Consultar estoque |
| GET | /erp/vendas | Relatorio vendas |
| GET | /erp/dashboard | Dados dashboard |

---

## Etapa 4: Schema Prisma Local

```prisma
// apps/api/prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}

model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  password  String
  nome      String
  ativo     Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  roles     UserRole[]
  bases     UserBase[]
}

model Role {
  id          Int      @id @default(autoincrement())
  name        String   @unique
  description String?

  users       UserRole[]
  permissions RolePermission[]
}

model Permission {
  id       Int     @id @default(autoincrement())
  name     String  @unique
  module   String
  action   String

  roles    RolePermission[]
}

model Base {
  id            Int      @id @default(autoincrement())
  nome          String
  cnpj          String?
  ativo         Boolean  @default(true)

  // Firebird config
  fbHost        String?
  fbPort        Int?     @default(3050)
  fbDatabase    String?
  fbUser        String?
  fbPassword    String?

  users         UserBase[]
}

model UserRole {
  userId Int
  roleId Int

  user   User @relation(fields: [userId], references: [id])
  role   Role @relation(fields: [roleId], references: [id])

  @@id([userId, roleId])
}

model UserBase {
  userId Int
  baseId Int

  user   User @relation(fields: [userId], references: [id])
  base   Base @relation(fields: [baseId], references: [id])

  @@id([userId, baseId])
}

model RolePermission {
  roleId       Int
  permissionId Int

  role       Role       @relation(fields: [roleId], references: [id])
  permission Permission @relation(fields: [permissionId], references: [id])

  @@id([roleId, permissionId])
}
```

---

## Etapa 5: Pacote Shared

### 5.1 Estrutura
```
packages/shared/
├── src/
│   ├── types/
│   │   ├── user.types.ts
│   │   ├── base.types.ts
│   │   ├── role.types.ts
│   │   └── api.types.ts
│   ├── constants/
│   │   └── permissions.ts
│   └── index.ts
├── package.json
└── tsconfig.json
```

### 5.2 Tipos Compartilhados
```typescript
// packages/shared/src/types/user.types.ts
export interface User {
  id: number;
  email: string;
  nome: string;
  ativo: boolean;
  roles: Role[];
  bases: Base[];
}

export interface CreateUserDto {
  email: string;
  password: string;
  nome: string;
  roleIds?: number[];
  baseIds?: number[];
}

// packages/shared/src/types/api.types.ts
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
```

---

## Etapa 6: Atualizar Frontend

### 6.1 Ajustar imports
```typescript
// Antes
import { User } from '@invistto/database-schema';

// Depois
import { User } from '@admin-panel/shared';
```

### 6.2 Atualizar API base URL
```typescript
// apps/web/src/services/api.ts
const API_URL = import.meta.env.VITE_API_URL || '/api';
```

### 6.3 Configurar proxy (dev)
```typescript
// apps/web/vite.config.ts
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
});
```

---

## Etapa 7: Scripts Root

```json
// package.json (root)
{
  "scripts": {
    "dev": "turbo run dev",
    "dev:api": "turbo run dev --filter=api",
    "dev:web": "turbo run dev --filter=web",
    "build": "turbo run build",
    "lint": "turbo run lint",
    "db:generate": "cd apps/api && pnpm prisma generate",
    "db:migrate": "cd apps/api && pnpm prisma migrate dev",
    "db:push": "cd apps/api && pnpm prisma db push"
  }
}
```

---

## Ordem de Execucao

| # | Etapa | Arquivos |
|---|-------|----------|
| 1 | Setup Monorepo | turbo.json, pnpm-workspace.yaml |
| 2 | Mover frontend | apps/web/* |
| 3 | Criar API scaffold | apps/api/* |
| 4 | Modulo Auth | auth.module.ts, jwt.strategy.ts |
| 5 | Modulo Usuarios | usuarios.module.ts |
| 6 | Modulo Bases | bases.module.ts |
| 7 | Modulo Roles | roles.module.ts |
| 8 | Pacote Shared | packages/shared/* |
| 9 | Atualizar Web imports | apps/web/src/* |
| 10 | Modulo ERP | erp.module.ts |

---

## Arquivos Criticos

### A Criar
- `apps/api/src/main.ts`
- `apps/api/src/app.module.ts`
- `apps/api/src/modules/auth/auth.module.ts`
- `apps/api/src/modules/auth/auth.controller.ts`
- `apps/api/src/modules/auth/auth.service.ts`
- `apps/api/src/modules/auth/strategies/jwt.strategy.ts`
- `apps/api/src/modules/usuarios/usuarios.module.ts`
- `apps/api/src/modules/usuarios/usuarios.controller.ts`
- `apps/api/src/modules/usuarios/usuarios.service.ts`
- `apps/api/src/modules/bases/bases.module.ts`
- `apps/api/src/modules/roles/roles.module.ts`
- `apps/api/src/common/guards/jwt-auth.guard.ts`
- `apps/api/prisma/schema.prisma`
- `packages/shared/src/index.ts`
- `packages/shared/package.json`
- `turbo.json`
- `pnpm-workspace.yaml`

### A Modificar
- `apps/web/vite.config.ts` (proxy)
- `apps/web/src/services/api.ts` (base URL)
- `apps/web/package.json` (remover @invistto/*)

---

## Dependencias a Remover (apos migracao)
- `@invistto/database-schema`
- `@invistto/shared-system-config`

---

## Acoplamentos Identificados

### SessionStorage
- `@ari:token` - Token JWT
- `@ari:user` - Dados do usuario

### Multi-tenant
- `ID_BASE` - Campo para identificar tenant em todas as queries

### Tipos do Prisma usados
- `User`, `Base`, `Role`, `Permission`
- `PrismaClient` (para tipos derivados)

---

**Ultima atualizacao:** 2025-12-21
