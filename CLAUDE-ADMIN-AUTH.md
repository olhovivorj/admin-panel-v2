# Plano: Fase 6 - Integrar @invistto/auth no admin-panel-v2

## Status do Projeto

| Fase | Status |
|------|--------|
| Fase 1: Criar projeto base | Concluida |
| Fase 2: Extrair backend | Concluida |
| Fase 3: Extrair frontend | Concluida |
| Fase 4: Tornar configuravel | Concluida |
| Fase 5: Adicionar testes | Concluida (108 testes) |
| **Fase 6: Integrar admin-panel-v2** | EM ANDAMENTO |

---

## Estrategia de Seguranca

### Branch: `feature/invistto-auth`

**Motivo:** Projeto em producao - mudancas isoladas permitem:
- Desenvolver sem afetar main
- Reverter instantaneamente se necessario
- Testar completamente antes do merge
- Deploy controlado

### Comandos de Emergencia
```bash
# Se algo quebrar durante desenvolvimento:
git stash && git checkout main

# Se precisar abandonar a branch:
git checkout main
git branch -D feature/invistto-auth
```

---

## Arquivos a Modificar (admin-panel-v2)

### Backend (apps/api/)

| Arquivo | Acao | Descricao |
|---------|------|-----------|
| `package.json` | EDITAR | Adicionar dependencia @invistto/auth |
| `src/app.module.ts` | EDITAR | Trocar import do auth module |
| `src/modules/auth/` | REMOVER | Pasta inteira (substituida pelo pacote) |
| `src/common/guards/jwt-auth.guard.ts` | REMOVER | Arquivo legado duplicado |

### Frontend (apps/web/)

| Arquivo | Acao | Descricao |
|---------|------|-----------|
| `package.json` | EDITAR | Adicionar dependencia @invistto/auth-react |
| `src/contexts/AuthContext.tsx` | REMOVER | Substituido pelo pacote |
| `src/pages/Login.tsx` | EDITAR | Usar LoginPage do pacote |
| `src/components/ProtectedRoute.tsx` | REMOVER | Substituido pelo pacote |
| `src/App.tsx` | EDITAR | Atualizar imports/providers |
| `src/services/api.ts` | EDITAR | Remover logica de auth duplicada |

---

## Plano de Execucao Detalhado

### Passo 1: Criar Branch
```bash
cd /home/robson/Documentos/projetos/codigo-fonte/admin-panel-v2
git checkout main
git pull origin main
git checkout -b feature/invistto-auth
```

### Passo 2: Instalar Pacotes
```bash
# Backend
cd apps/api
pnpm add @invistto/auth@file:../../../../invistto-auth/packages/core

# Frontend
cd ../web
pnpm add @invistto/auth-react@file:../../../../invistto-auth/packages/react
```

### Passo 3: Backend - Criar UserRepository

Criar `apps/api/src/modules/auth/auth-user.repository.ts`:
```typescript
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IAuthUserRepository, AuthUserData } from '@invistto/auth';
import { Ariuser } from '../ariusers/entities/ariuser.entity';

@Injectable()
export class AuthUserRepository implements IAuthUserRepository {
  constructor(
    @InjectRepository(Ariuser)
    private readonly userRepo: Repository<Ariuser>,
  ) {}

  async findByEmail(email: string): Promise<AuthUserData | null> {
    const user = await this.userRepo.findOne({ where: { email } });
    if (!user) return null;

    return {
      id: user.id,
      email: user.email,
      nome: user.nome,
      senha: user.senha,
      funcao: user.funcao,
      ativo: user.ativo,
      baseId: user.baseId,
      baseName: '', // Sera preenchido pelo getBaseName
    };
  }

  async getBaseName(baseId: number): Promise<string> {
    // Implementar query para buscar nome da base
  }

  async updateLastAccess(userId: number): Promise<void> {
    await this.userRepo.update(userId, { ultimoAcesso: new Date() });
  }
}
```

### Passo 4: Backend - Atualizar app.module.ts

De:
```typescript
import { InvisttoAuthModule } from './modules/auth/invistto-auth.module';
```

Para:
```typescript
import { InvisttoAuthModule, AUTH_USER_REPOSITORY } from '@invistto/auth';
import { AuthUserRepository } from './modules/auth/auth-user.repository';

@Module({
  imports: [
    InvisttoAuthModule.forRootAsync({
      imports: [TypeOrmModule.forFeature([Ariuser])],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        jwt: {
          secret: config.get('JWT_SECRET'),
          expiration: config.get('JWT_EXPIRATION') || '8h',
        },
        firebird: {
          enabled: true,
          encryptionKey: config.get('FIREBIRD_ENCRYPTION_KEY'),
        },
      }),
      extraProviders: [
        {
          provide: AUTH_USER_REPOSITORY,
          useClass: AuthUserRepository,
        },
      ],
    }),
  ],
})
```

### Passo 5: Backend - Remover Arquivos Antigos
```bash
rm -rf apps/api/src/modules/auth/invistto-auth.module.ts
rm -rf apps/api/src/modules/auth/invistto-auth.controller.ts
rm -rf apps/api/src/modules/auth/invistto-auth.service.ts
rm -rf apps/api/src/modules/auth/strategies/
rm -rf apps/api/src/modules/auth/guards/
rm -rf apps/api/src/modules/auth/decorators/
rm -rf apps/api/src/modules/auth/dto/
rm apps/api/src/common/guards/jwt-auth.guard.ts
```

**Manter:** `apps/api/src/modules/auth/auth-user.repository.ts` (criado no passo 3)

### Passo 6: Frontend - Atualizar App.tsx

De:
```tsx
import { AuthProvider } from './contexts/AuthContext';
```

Para:
```tsx
import { AuthProvider } from '@invistto/auth-react';

<AuthProvider
  apiUrl={import.meta.env.VITE_API_URL}
  onLogout={() => {
    queryClient.clear();
    navigate('/login');
  }}
>
```

### Passo 7: Frontend - Atualizar Login.tsx

De:
```tsx
// 166 linhas de codigo...
```

Para:
```tsx
import { LoginPage } from '@invistto/auth-react';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const navigate = useNavigate();

  return (
    <LoginPage
      title="Admin Panel"
      subtitle="Sistema administrativo Invistto"
      logo="/logo.png"
      showRememberMe={false}
      showQuickLogin={import.meta.env.DEV}
      quickCredentials={{
        email: 'admin@invistto.com.br',
        password: 'admin123',
      }}
      onSuccess={() => navigate('/dashboard')}
      onError={(err) => console.error('Login error:', err)}
    />
  );
}
```

### Passo 8: Frontend - Atualizar imports nos componentes

Buscar e substituir em todos os arquivos:
```typescript
// De:
import { useAuth } from '../contexts/AuthContext';
import { useAuth } from '../../contexts/AuthContext';

// Para:
import { useAuth } from '@invistto/auth-react';
```

### Passo 9: Frontend - Remover Arquivos Antigos
```bash
rm apps/web/src/contexts/AuthContext.tsx
rm apps/web/src/components/ProtectedRoute.tsx
```

### Passo 10: Testar
```bash
# Terminal 1 - Backend
cd apps/api && pnpm dev

# Terminal 2 - Frontend
cd apps/web && pnpm dev
```

**Checklist de Testes:**
- [ ] Login com credenciais validas
- [ ] Login com credenciais invalidas (mensagem de erro)
- [ ] Logout (limpa sessao, redireciona)
- [ ] Acesso a rota protegida sem token (redireciona para login)
- [ ] Refresh da pagina mantem sessao
- [ ] Token invalido/expirado (redireciona para login)
- [ ] Permissoes de role funcionando

---

## Rollback (se necessario)

```bash
# Opcao 1: Abandonar branch
git checkout main

# Opcao 2: Reverter commits especificos
git log --oneline  # ver commits
git revert <commit-hash>

# Opcao 3: Hard reset (perder tudo)
git checkout main
git branch -D feature/invistto-auth
```

---

## Verificacao Final

Antes de fazer merge para main:

1. **Testes automatizados passando**
   ```bash
   cd apps/api && pnpm test
   cd apps/web && pnpm test
   ```

2. **Build de producao funcionando**
   ```bash
   pnpm build
   ```

3. **Teste manual completo em staging** (se disponivel)

4. **Code review** (opcional mas recomendado)

---

## Pacote @invistto/auth

Localizado em: `/home/robson/Documentos/projetos/codigo-fonte/invistto-auth/`

### Estrutura
```
invistto-auth/
├── packages/
│   ├── core/           # @invistto/auth (Backend NestJS)
│   │   └── 49 testes
│   └── react/          # @invistto/auth-react (Frontend React)
│       └── 59 testes
```

### Exports Principais

**@invistto/auth (Backend):**
- `InvisttoAuthModule` - Modulo NestJS configuravel
- `JwtAuthGuard` - Guard de autenticacao
- `RolesGuard` - Guard de autorizacao por role
- `@Public()` - Decorator para rotas publicas
- `@CurrentUser()` - Decorator para extrair usuario
- `@Roles()` - Decorator para definir roles
- `@BaseId()` - Decorator para extrair baseId
- `IAuthUserRepository` - Interface do repositorio
- `AUTH_USER_REPOSITORY` - Token de injecao

**@invistto/auth-react (Frontend):**
- `AuthProvider` - Provider de autenticacao
- `LoginPage` - Componente de login configuravel
- `ProtectedRoute` - Guard de rotas
- `useAuth()` - Hook de autenticacao
- `usePermissions()` - Hook de permissoes
- `useUserRole()` - Hook de roles
