# Plano: Centralização de Autenticação (@invistto/auth)

## Problema Identificado

### Duplicação Massiva de Código

| Projeto | Arquivos Auth | Linhas | Duplicação |
|---------|---------------|--------|------------|
| **admin-panel-v2** | 14 arquivos | ~1000 | Base |
| **zeiss-api-client** | 14 arquivos | 988 | **90-100% idêntico** |
| **courier-v3** | 24 arquivos | ~1500 | 70% similar |

### O Que Está Duplicado (100% idêntico entre admin-panel e zeiss):

```
├── guards/
│   ├── jwt-auth.guard.ts         ← 100% idêntico
│   └── roles.guard.ts            ← 99% idêntico
├── decorators/
│   ├── public.decorator.ts       ← 100% idêntico
│   ├── current-user.decorator.ts ← 100% idêntico
│   └── roles.decorator.ts        ← 100% idêntico
├── strategies/
│   └── jwt.strategy.ts           ← 100% idêntico
├── dto/
│   ├── login.dto.ts              ← 100% idêntico
│   ├── auth-response.dto.ts      ← 100% idêntico
│   └── jwt-payload.dto.ts        ← 100% idêntico
└── invistto-auth.module.ts       ← 100% idêntico
```

### Consequências:
1. Bug fix em um projeto não propaga para outros
2. Manutenção triplicada
3. Risco de divergência e inconsistências
4. Correções de segurança podem não ser aplicadas uniformemente

---

## Decisões Tomadas

1. **Onde criar o pacote?** → Pasta `/codigo-fonte/invistto-auth/`
2. **Como distribuir?** → Link local (`file:../invistto-auth`)
3. **Dev mode?** → Sim, com `bypassPermissions` para ver páginas em desenvolvimento

---

## Estrutura Proposta do Pacote (Monorepo Profissional)

```
/codigo-fonte/invistto-auth/
│
├── packages/
│   │
│   ├── core/                             # @invistto/auth (Backend NestJS)
│   │   ├── src/
│   │   │   ├── index.ts                  # Exports públicos
│   │   │   ├── invistto-auth.module.ts   # Módulo principal (forRoot)
│   │   │   ├── invistto-auth.service.ts  # Lógica de login
│   │   │   │
│   │   │   ├── config/
│   │   │   │   ├── auth-config.interface.ts
│   │   │   │   └── auth-config.service.ts
│   │   │   │
│   │   │   ├── guards/
│   │   │   │   ├── jwt-auth.guard.ts
│   │   │   │   ├── roles.guard.ts
│   │   │   │   ├── api-key.guard.ts
│   │   │   │   └── index.ts
│   │   │   │
│   │   │   ├── decorators/
│   │   │   │   ├── public.decorator.ts
│   │   │   │   ├── current-user.decorator.ts
│   │   │   │   ├── roles.decorator.ts
│   │   │   │   ├── base-id.decorator.ts
│   │   │   │   └── index.ts
│   │   │   │
│   │   │   ├── strategies/
│   │   │   │   ├── jwt.strategy.ts
│   │   │   │   ├── api-key.strategy.ts
│   │   │   │   └── index.ts
│   │   │   │
│   │   │   ├── dto/
│   │   │   │   ├── login.dto.ts
│   │   │   │   ├── auth-response.dto.ts
│   │   │   │   ├── jwt-payload.dto.ts
│   │   │   │   └── index.ts
│   │   │   │
│   │   │   ├── interfaces/
│   │   │   │   ├── auth-user.interface.ts
│   │   │   │   ├── firebird-credentials.interface.ts
│   │   │   │   └── index.ts
│   │   │   │
│   │   │   └── utils/
│   │   │       ├── encryption.util.ts
│   │   │       └── password.util.ts
│   │   │
│   │   ├── __tests__/                    # TESTES OBRIGATÓRIOS
│   │   │   ├── auth.service.spec.ts      # Login, validação senha
│   │   │   ├── jwt.strategy.spec.ts      # Geração/validação JWT
│   │   │   ├── guards.spec.ts            # JwtGuard, RolesGuard
│   │   │   ├── encryption.spec.ts        # Criptografia Firebird
│   │   │   └── password.spec.ts          # bcrypt helpers
│   │   │
│   │   ├── package.json
│   │   ├── tsconfig.json                 # strict: true
│   │   ├── tsconfig.build.json
│   │   └── jest.config.js
│   │
│   └── ui/                               # @invistto/auth-ui (Frontend React)
│       ├── src/
│       │   ├── index.ts                  # Exports públicos
│       │   ├── LoginModal.tsx            # Modal completo
│       │   ├── LoginForm.tsx             # Form isolado
│       │   ├── hooks/
│       │   │   └── useAuth.ts            # Hook de autenticação
│       │   ├── components/
│       │   │   ├── EmailInput.tsx
│       │   │   ├── PasswordInput.tsx
│       │   │   └── ErrorMessage.tsx
│       │   └── types/
│       │       └── index.ts
│       │
│       ├── __tests__/                    # TESTES OBRIGATÓRIOS
│       │   ├── LoginModal.spec.tsx       # Renderiza, submete
│       │   ├── LoginForm.spec.tsx        # Validação, erros
│       │   └── useAuth.spec.ts           # Hook behavior
│       │
│       ├── package.json
│       ├── tsconfig.json                 # strict: true
│       └── jest.config.js
│
├── package.json                          # Workspaces config
├── jest.config.base.js                   # Config compartilhada
├── tsconfig.base.json                    # Config compartilhada
└── README.md
```

---

## Regras de Qualidade (Não Negociáveis)

### TypeScript Strict
```json
// tsconfig.json em cada pacote
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  }
}
```

### Cobertura Mínima de Testes
```javascript
// jest.config.js
module.exports = {
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
}
```

### Testes Obrigatórios por Área

| Pacote | Área | Testes Mínimos |
|--------|------|----------------|
| **core** | Service | login(), validatePassword(), generateToken() |
| **core** | Guards | canActivate() com/sem token, com/sem roles |
| **core** | Strategy | validate() com payload válido/inválido |
| **core** | Utils | encrypt(), decrypt(), hashPassword(), comparePassword() |
| **ui** | LoginModal | renderiza, submete form, mostra loading |
| **ui** | LoginForm | validação email, validação senha, erro de API |
| **ui** | useAuth | login success, login error, logout |

---

## Configuração Flexível

```typescript
// Interface de configuração
interface InvisttoAuthConfig {
  // JWT
  jwt: {
    secret: string;
    expiration?: string;  // default: '8h'
  };

  // MySQL (obrigatório)
  mysql: {
    host: string;
    port: number;
    user: string;
    password: string;
    database: string;
  };

  // Firebird (opcional - admin-panel e zeiss usam, courier não)
  firebird?: {
    enabled: boolean;
    encryptionKey?: string;
    fallback?: {
      host: string;
      port: number;
      database: string;
      user: string;
      password: string;
    };
  };

  // API Key (opcional - courier usa)
  apiKey?: {
    enabled: boolean;
    headerName?: string;  // default: 'X-API-Key'
    secretHeaderName?: string;  // default: 'X-API-Secret'
  };

  // Permissões
  permissions?: {
    source: 'plan' | 'role' | 'both';  // admin usa plan, courier usa role
    appId?: number;  // para filtrar páginas por app
  };

  // Desenvolvimento
  development?: {
    enabled: boolean;  // process.env.NODE_ENV === 'development'
    bypassPermissions?: boolean;  // Ignora verificação de páginas
    masterEmails?: string[];  // Emails com acesso total
  };
}
```

---

## Uso em Cada Projeto

### Admin-Panel-V2
```typescript
InvisttoAuthModule.forRoot({
  jwt: { secret: process.env.JWT_SECRET },
  mysql: { ... },
  firebird: { enabled: true, encryptionKey: process.env.FIREBIRD_KEY },
  permissions: { source: 'plan' },
  development: {
    enabled: process.env.NODE_ENV === 'development',
    bypassPermissions: true,
  },
})
```

### Zeiss-API-Client
```typescript
InvisttoAuthModule.forRoot({
  jwt: { secret: process.env.JWT_SECRET },
  mysql: { ... },
  firebird: { enabled: true, encryptionKey: process.env.FIREBIRD_KEY },
  permissions: { source: 'plan' },
})
```

### Courier-V3
```typescript
InvisttoAuthModule.forRoot({
  jwt: { secret: process.env.JWT_SECRET },
  mysql: { ... },
  firebird: { enabled: false },  // Courier não usa Firebird
  apiKey: { enabled: true },     // Courier suporta API Key
  permissions: { source: 'role', appId: 2 },
})
```

---

## Estratégia de Migração Segura (Não Quebrar Produção)

### Princípio: Migração Paralela

```
FASE 1 - PREPARAÇÃO (sem risco)
├── Criar pacote @invistto/auth
├── Testar isoladamente
└── Código antigo continua funcionando

FASE 2 - INSTALAÇÃO PARALELA (baixo risco)
├── Instalar pacote no projeto
├── Criar endpoint alternativo: POST /auth/login-new
├── Endpoint antigo continua funcionando
└── Testar novo endpoint

FASE 3 - TROCA GRADUAL (risco controlado)
├── Em STAGING: trocar para novo endpoint
├── Testar exaustivamente
├── Se OK: trocar em PRODUÇÃO
└── Manter código antigo comentado por 1 semana

FASE 4 - LIMPEZA (sem risco)
├── Remover código antigo
├── Remover endpoint alternativo
└── Documentar migração
```

### Rollback Rápido

Se algo quebrar em produção:
```typescript
// Em 30 segundos: descomentar código antigo
// Ou: reverter commit no Git
// Ou: apontar para endpoint antigo no frontend
```

---

## Escopo do Pacote

### O Que ENTRA no @invistto/auth (Backend)
- Módulo NestJS (InvisttoAuthModule)
- Service de login/validação
- Guards (JWT, Roles, ApiKey)
- Decorators (@Public, @CurrentUser, @Roles, @GetBaseId)
- Strategies (JWT, ApiKey)
- DTOs
- Utils (criptografia, bcrypt)

### O Que NÃO ENTRA (Frontend fica em cada projeto)
- Modal de login
- Ícones
- Estilos CSS
- Componentes React

**Motivo:** Cada projeto tem identidade visual própria. O backend é idêntico, o frontend varia.

---

## Ordem de Implementação

### Passo 1: Criar Pacote Base
1. Criar `/codigo-fonte/invistto-auth/`
2. Extrair código do admin-panel como base
3. Adicionar config flexível (Firebird opcional)
4. Adicionar dev mode (bypassPermissions)
5. Testar isoladamente

### Passo 2: Integrar Admin-Panel (Primeiro Piloto)
1. `npm install file:../invistto-auth`
2. Criar endpoint `/auth/login-new` usando pacote
3. Testar em paralelo com endpoint antigo
4. Se OK, trocar endpoint principal
5. Remover módulo auth local

### Passo 3: Integrar Zeiss
1. Mesmo processo do admin-panel
2. Config: `firebird: { enabled: true }`

### Passo 4: Integrar Courier
1. Mesmo processo
2. Config: `firebird: { enabled: false }, apiKey: { enabled: true }`

---

## Configurações por Projeto

| Projeto | Firebird | API Key | Permissões |
|---------|----------|---------|------------|
| admin-panel-v2 | ✅ enabled | ❌ | plan-based |
| zeiss-api-client | ✅ enabled | ❌ | plan-based |
| courier-v3 | ❌ disabled | ✅ enabled | role-based |

---

## Problema das Permissões em Desenvolvimento

### Situação Atual
- Ao fazer login, permissões são carregadas do banco
- Página nova não está cadastrada = não aparece no menu
- Desenvolvedor não consegue ver a página em desenvolvimento

### Solução no Pacote

```typescript
// No service de permissões
async getUserPlanAndPages(planId: number) {
  // Se está em dev E bypass ativo → retorna tudo
  if (this.isDevelopment && this.config.development?.bypassPermissions) {
    return this.getAllActivePages();
  }

  // Produção → só páginas do plano
  return this.getPlanPages(planId);
}
```

---

**Última atualização:** 2025-01-09
