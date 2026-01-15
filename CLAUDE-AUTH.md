# Plano: Implementar @invistto/auth (Pacote Compartilhado)

## Referencia

Documentacao existente:
- `admin-panel-v2/CLAUDE-AUTH.md` - Este arquivo
- `admin-panel-v2/CLAUDE-DESACOPLAR.md` - Contexto de desacoplamento

---

## Decisao Atualizada: INCLUIR UI

### Analise Pragmatica dos Logins

| Projeto | Linhas | Core identico? |
|---------|--------|----------------|
| admin-panel | 166 | SIM |
| courier | 211 | SIM |
| zeiss | 128 | SIM |
| **Total** | **505** | 95% identico |

### O que realmente difere (parametrizavel):
- Titulo/subtitulo → `title`, `subtitle` props
- Logo → `logo` prop (URL)
- Quick login → `showQuickLogin`, `quickCredentials` props
- Remember me → `showRememberMe` prop
- Forgot password → `showForgotPassword` prop
- Redirect → `onSuccess` callback

### Conclusao
Com ~15 props configuraveis, UM componente substitui 505 linhas duplicadas.

---

## Decisoes Finais

| Decisao | Valor |
|---------|-------|
| Onde criar? | `/codigo-fonte/invistto-auth/` |
| Como distribuir? | Link local (`file:../invistto-auth`) |
| Dev mode? | Sim, com `bypassPermissions` |
| Frontend no pacote? | **SIM** - LoginPage, AuthProvider, ProtectedRoute, hooks |
| Backend no pacote? | SIM - 100% identico entre projetos |

---

## Estrutura Aprovada

```
/codigo-fonte/invistto-auth/
├── packages/
│   ├── core/                        # @invistto/auth (Backend NestJS)
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── invistto-auth.module.ts
│   │   │   ├── invistto-auth.service.ts
│   │   │   ├── config/
│   │   │   ├── guards/
│   │   │   ├── decorators/
│   │   │   ├── strategies/
│   │   │   ├── dto/
│   │   │   ├── interfaces/
│   │   │   └── utils/
│   │   ├── __tests__/
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── react/                       # @invistto/auth-react (Frontend React)
│       ├── src/
│       │   ├── index.ts
│       │   ├── components/
│       │   │   ├── LoginPage.tsx       # Componente de login parametrizavel
│       │   │   ├── ProtectedRoute.tsx  # Guard de rotas
│       │   │   └── index.ts
│       │   ├── contexts/
│       │   │   ├── AuthContext.tsx     # Provider de autenticacao
│       │   │   └── index.ts
│       │   ├── hooks/
│       │   │   ├── useAuth.ts          # Hook principal
│       │   │   ├── usePermissions.ts   # Hook de permissoes
│       │   │   └── index.ts
│       │   ├── services/
│       │   │   ├── auth.service.ts     # Chamadas API
│       │   │   └── index.ts
│       │   └── types/
│       │       ├── auth.types.ts
│       │       └── index.ts
│       ├── package.json
│       └── tsconfig.json
├── package.json
├── pnpm-workspace.yaml
└── README.md
```

---

## Configuracao por Projeto

### Backend (NestJS)

```typescript
// Admin-Panel e Zeiss
InvisttoAuthModule.forRoot({
  jwt: { secret: process.env.JWT_SECRET },
  mysql: { ... },
  firebird: { enabled: true, encryptionKey: process.env.FIREBIRD_KEY },
  permissions: { source: 'plan' },
})

// Courier
InvisttoAuthModule.forRoot({
  jwt: { secret: process.env.JWT_SECRET },
  mysql: { ... },
  firebird: { enabled: false },
  apiKey: { enabled: true },
  permissions: { source: 'role', appId: 2 },
})
```

### Frontend (React)

```tsx
// Admin-Panel
<AuthProvider apiUrl={import.meta.env.VITE_API_URL}>
  <LoginPage
    title="Admin Panel"
    subtitle="Sistema administrativo"
    logo="/logo.png"
    showRememberMe={true}
    showForgotPassword={false}
    onSuccess={() => navigate('/dashboard')}
  />
</AuthProvider>

// Courier (com quick login em dev)
<LoginPage
  title="Courier"
  subtitle="Sistema de entregas"
  showQuickLogin={import.meta.env.DEV}
  quickCredentials={{ email: 'admin@test.com', password: 'admin123' }}
  onSuccess={() => navigate('/dashboard')}
/>

// Zeiss (minimalista)
<LoginPage
  title="Zeiss API"
  onSuccess={() => navigate('/dashboard')}
/>
```

### Props do LoginPage

| Prop | Tipo | Default | Descricao |
|------|------|---------|-----------|
| `title` | string | "Login" | Titulo principal |
| `subtitle` | string | "" | Subtitulo opcional |
| `logo` | string | undefined | URL do logo |
| `showRememberMe` | boolean | false | Mostrar checkbox "Lembrar" |
| `showForgotPassword` | boolean | false | Mostrar link "Esqueci senha" |
| `showQuickLogin` | boolean | false | Botao de login rapido (dev) |
| `quickCredentials` | object | undefined | Credenciais pre-definidas |
| `onSuccess` | function | required | Callback apos login |
| `onError` | function | undefined | Callback em caso de erro |
| `className` | string | undefined | Classes CSS customizadas |
| `theme` | 'light'/'dark'/'auto' | 'auto' | Tema do formulario |

---

## Passos de Implementacao

### Fase 1: Criar Projeto Base
1. [ ] Criar pasta `/codigo-fonte/invistto-auth/`
2. [ ] Configurar package.json raiz com workspaces
3. [ ] Configurar pnpm-workspace.yaml
4. [ ] Configurar tsconfig.base.json (strict: true)
5. [ ] Estruturar packages/core/ e packages/react/

### Fase 2: Extrair Backend do admin-panel-v2
Copiar de `apps/api/src/modules/auth/`:
1. [ ] invistto-auth.module.ts
2. [ ] invistto-auth.service.ts
3. [ ] invistto-auth.controller.ts
4. [ ] strategies/jwt.strategy.ts
5. [ ] guards/jwt-auth.guard.ts
6. [ ] guards/roles.guard.ts
7. [ ] decorators/ (todos)
8. [ ] dto/ (todos)

### Fase 3: Extrair Frontend do admin-panel-v2
Copiar de `apps/web/src/`:
1. [ ] contexts/AuthContext.tsx → adaptar para configuravel
2. [ ] pages/Login.tsx → transformar em LoginPage component
3. [ ] components/ProtectedRoute.tsx
4. [ ] hooks/useAuth.ts (extrair do context)
5. [ ] services/api.ts (parte de auth)
6. [ ] types relacionados

### Fase 4: Tornar Configuravel
Backend:
1. [ ] Criar InvisttoAuthConfig interface
2. [ ] Implementar forRoot() com DI
3. [ ] Flag `firebird.enabled` para opcional
4. [ ] Flag `apiKey.enabled` para courier
5. [ ] Flag `development.bypassPermissions`

Frontend:
1. [ ] LoginPageProps interface com todas as props
2. [ ] AuthProviderConfig interface
3. [ ] Suporte a temas (light/dark/auto)
4. [ ] Injecao de API URL via prop

### Fase 5: Adicionar Testes
Backend:
1. [ ] auth.service.spec.ts
2. [ ] jwt.strategy.spec.ts
3. [ ] guards.spec.ts
4. [ ] encryption.spec.ts

Frontend:
1. [ ] LoginPage.test.tsx
2. [ ] AuthContext.test.tsx
3. [ ] useAuth.test.ts

### Fase 6: Integrar no admin-panel-v2
```bash
pnpm add @invistto/auth@file:../../invistto-auth/packages/core
pnpm add @invistto/auth-react@file:../../invistto-auth/packages/react
```
1. [ ] Substituir modulo auth local pelo pacote (backend)
2. [ ] Substituir Login page pelo LoginPage component (frontend)
3. [ ] Substituir AuthContext pelo do pacote
4. [ ] Testar login, logout, permissoes
5. [ ] Remover codigo duplicado

### Fase 7: Integrar nos demais
1. [ ] zeiss-api-client (backend + frontend)
2. [ ] courier-v3 (backend + frontend)

---

## Arquivos a Criar

```
invistto-auth/
├── package.json
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── README.md
├── packages/
│   ├── core/                              # @invistto/auth
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── invistto-auth.module.ts
│   │   │   ├── invistto-auth.service.ts
│   │   │   ├── invistto-auth.controller.ts
│   │   │   ├── config/
│   │   │   │   ├── auth-config.interface.ts
│   │   │   │   └── auth-config.service.ts
│   │   │   ├── guards/
│   │   │   │   ├── jwt-auth.guard.ts
│   │   │   │   ├── roles.guard.ts
│   │   │   │   ├── api-key.guard.ts
│   │   │   │   └── index.ts
│   │   │   ├── decorators/
│   │   │   │   ├── public.decorator.ts
│   │   │   │   ├── current-user.decorator.ts
│   │   │   │   ├── roles.decorator.ts
│   │   │   │   ├── base-id.decorator.ts
│   │   │   │   └── index.ts
│   │   │   ├── strategies/
│   │   │   │   ├── jwt.strategy.ts
│   │   │   │   ├── api-key.strategy.ts
│   │   │   │   └── index.ts
│   │   │   ├── dto/
│   │   │   │   ├── login.dto.ts
│   │   │   │   ├── auth-response.dto.ts
│   │   │   │   ├── jwt-payload.dto.ts
│   │   │   │   └── index.ts
│   │   │   ├── interfaces/
│   │   │   │   ├── auth-user.interface.ts
│   │   │   │   ├── firebird-credentials.interface.ts
│   │   │   │   └── index.ts
│   │   │   └── utils/
│   │   │       ├── encryption.util.ts
│   │   │       └── password.util.ts
│   │   └── __tests__/
│   │       ├── auth.service.spec.ts
│   │       ├── jwt.strategy.spec.ts
│   │       └── guards.spec.ts
│   │
│   └── react/                             # @invistto/auth-react
│       ├── package.json
│       ├── tsconfig.json
│       ├── vite.config.ts                 # Build config (lib mode)
│       ├── src/
│       │   ├── index.ts                   # Export publico
│       │   ├── components/
│       │   │   ├── LoginPage.tsx          # Formulario de login
│       │   │   ├── ProtectedRoute.tsx     # Guard de rotas
│       │   │   └── index.ts
│       │   ├── contexts/
│       │   │   ├── AuthContext.tsx        # Provider principal
│       │   │   └── index.ts
│       │   ├── hooks/
│       │   │   ├── useAuth.ts             # Estado de autenticacao
│       │   │   ├── usePermissions.ts      # Verificacao de permissoes
│       │   │   ├── useCurrentUser.ts      # Dados do usuario
│       │   │   └── index.ts
│       │   ├── services/
│       │   │   ├── auth.service.ts        # Chamadas API
│       │   │   ├── storage.service.ts     # localStorage helper
│       │   │   └── index.ts
│       │   └── types/
│       │       ├── auth.types.ts          # User, Token, etc
│       │       ├── config.types.ts        # Props e configs
│       │       └── index.ts
│       └── __tests__/
│           ├── LoginPage.test.tsx
│           ├── AuthContext.test.tsx
│           └── useAuth.test.ts
```

---

## Codigo Duplicado Atual

### Backend (NestJS)

| Arquivo | admin-panel | zeiss | courier |
|---------|-------------|-------|---------|
| jwt-auth.guard.ts | 100% | 100% | 95% |
| roles.guard.ts | 100% | 99% | 90% |
| public.decorator.ts | 100% | 100% | 100% |
| current-user.decorator.ts | 100% | 100% | 100% |
| roles.decorator.ts | 100% | 100% | 100% |
| jwt.strategy.ts | 100% | 100% | 95% |
| login.dto.ts | 100% | 100% | 100% |
| auth-response.dto.ts | 100% | 100% | 90% |

**~1000 linhas backend duplicadas por projeto**

### Frontend (React)

| Arquivo | admin-panel | zeiss | courier |
|---------|-------------|-------|---------|
| Login.tsx | 166 linhas | 128 linhas | 211 linhas |
| AuthContext.tsx | 100% | 100% | 95% |
| ProtectedRoute.tsx | 100% | 100% | 100% |
| useAuth hook | 100% | 100% | 100% |
| api.ts (auth part) | 100% | 100% | 95% |

**~500 linhas frontend duplicadas por projeto**

### Total: ~1500 linhas duplicadas por projeto (4500 total)

---

## Verificacao

### Backend
1. Login endpoint retorna JWT
2. JWT valida corretamente
3. Guards bloqueiam rotas protegidas
4. Decorators extraem user/baseId
5. Firebird funciona onde habilitado
6. API Key funciona no courier
7. bypassPermissions funciona em dev

### Frontend
1. LoginPage renderiza com props customizadas
2. Login submete e recebe token
3. AuthContext armazena e disponibiliza user
4. ProtectedRoute bloqueia rotas sem token
5. useAuth retorna estado correto
6. Quick login funciona em dev
7. Temas light/dark aplicados corretamente

### Integracao
1. admin-panel-v2: login completo com permissoes por plano
2. zeiss-api-client: login com Firebird
3. courier-v3: login + API Key + quick login

---

## Proximos Passos Imediatos

1. Criar pasta `invistto-auth` em `/codigo-fonte/`
2. Configurar monorepo (package.json + pnpm-workspace.yaml)
3. Copiar backend do admin-panel-v2
4. Copiar frontend do admin-panel-v2
5. Parametrizar LoginPage com props
6. Testar isoladamente
7. Integrar no admin-panel-v2 primeiro

---

## Estimativa

| Fase | Complexidade |
|------|--------------|
| Criar projeto base | Baixa |
| Extrair backend | Media |
| Extrair frontend | Media |
| Tornar configuravel | Alta |
| Testes | Media |
| Integrar admin-panel | Media |
| Integrar zeiss + courier | Media |

---

## Dependencias do Pacote React

```json
{
  "peerDependencies": {
    "react": "^18.0.0",
    "react-dom": "^18.0.0",
    "react-router-dom": "^6.0.0"
  },
  "dependencies": {
    "axios": "^1.6.0",
    "react-hook-form": "^7.0.0",
    "zod": "^3.0.0",
    "@hookform/resolvers": "^3.0.0"
  },
  "devDependencies": {
    "@types/react": "^18.0.0",
    "typescript": "^5.0.0",
    "vite": "^5.0.0"
  }
}
```

**Nota:** TailwindCSS fica como peerDependency opcional - componentes usam classes Tailwind mas projeto consumidor pode sobrescrever via `className` prop.

---

**Ultima atualizacao:** 2026-01-11
