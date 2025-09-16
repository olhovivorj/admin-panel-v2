# 📋 CLAUDE.MD - ADMIN PANEL V2 (SIMPLIFICADO)

## 🎯 CONTEXTO DO PROJETO
- **Admin Panel V2**: Interface administrativa simplificada do INVISTTO ERP
- **Stack**: React 18 + TypeScript + Vite + TailwindCSS
- **Propósito**: CRUD de usuários, configuração Firebird das bases, dashboard simples
- **Versão**: 2.0 (Versão limpa e enxuta)

---

## 🔐 REGRAS DE AUTENTICAÇÃO E USUÁRIOS

### 1️⃣ **AUTENTICAÇÃO (AUTH)**

#### 1.1 Login
- **Endpoint**: `POST /auth/login`
- **Campos obrigatórios**: email, password
- **Retorno**: JWT token + dados do usuário
- **Armazenamento**: Token salvo no localStorage com chave `@ari:token`
- **Duração**: Token não expira automaticamente (sem refresh token implementado)

#### 1.2 Logout
- **Endpoint**: `POST /auth/logout`
- **Ação**: Remove token do localStorage
- **Redirect**: Sempre redireciona para `/login`

#### 1.3 Interceptor Axios
- **Localização**: `src/services/api.ts`
- **Header automático**: `Authorization: Bearer {token}`
- **Erro 401**: Redireciona automaticamente para `/login`
- **BaseId**: Incluído em todas as requisições quando disponível

#### 1.4 Protected Routes
- **Component**: `ProtectedRoute`
- **Validação**: Verifica se existe token no localStorage
- **Sem token**: Redirect para `/login`
- **Com token**: Renderiza children

#### 1.5 Context de Autenticação
- **Arquivo**: `src/contexts/AuthContext.tsx`
- **Estados**:
  - `user`: Dados do usuário logado
  - `isAuthenticated`: Boolean se está autenticado
  - `isLoading`: Estado de carregamento
- **Métodos**:
  - `login(email, password)`: Autentica usuário
  - `logout()`: Desloga usuário
  - `checkAuth()`: Verifica se token é válido

---

### 2️⃣ **GESTÃO DE USUÁRIOS**

#### 2.1 Tipos de Usuário
- **Roles disponíveis**:
  - `admin`: Acesso total ao sistema
  - `user`: Acesso padrão
  - `viewer`: Apenas visualização

#### 2.2 Campos do Usuário
```typescript
interface User {
  id: number           // ID único
  name: string        // Nome completo
  email: string       // Email único
  telefone?: string   // Telefone opcional
  obs?: string        // Observações
  role: Role          // Papel do usuário
  active: boolean     // Status ativo/inativo
  baseId: number      // Base vinculada (IMUTÁVEL)
  baseName?: string   // Nome da base
  createdAt: string   // Data criação
  updatedAt: string   // Data atualização
  lastLogin?: string  // Último acesso
}
```

#### 2.3 Regras de Criação
- **Email**: Deve ser único no sistema
- **Senha**: Mínimo 6 caracteres (validação frontend)
- **BaseId**: Obrigatório e IMUTÁVEL após criação
- **Role**: Padrão 'user' se não especificado
- **Active**: Padrão true (ativo)

#### 2.4 Regras de Atualização
- **Campos editáveis**:
  - name, email, telefone, obs, role, active
- **Campos NÃO editáveis**:
  - id, baseId, createdAt, password (só via endpoint específico)
- **Email**: Validar unicidade antes de atualizar

#### 2.5 Regras de Exclusão
- **Soft delete**: Não implementado (exclusão física)
- **Confirmação**: Sempre pedir confirmação no frontend
- **Cascade**: Verificar dependências antes de deletar

#### 2.6 Troca de Senha
- **Endpoint**: `PUT /usuarios/{id}/change-password`
- **Validação**: Senha atual obrigatória
- **Nova senha**: Mínimo 6 caracteres
- **Sem histórico**: Não guarda senhas antigas

---

### 3️⃣ **PERMISSÕES E ACESSOS**

#### 3.1 Super Admin
- **Hook**: `useSuperAdmin()`
- **Identificação**: `role === 'admin'`
- **Permissões especiais**:
  - Ver menu "Bases de Dados"
  - Acessar configurações Firebird
  - Ver todos os usuários de todas as bases

#### 3.2 Multi-tenant (Bases)
- **Regra principal**: Usuário só vê dados da sua base
- **BaseId**: Sempre presente nas requisições
- **Admin exception**: Admin pode ver "TODAS" as bases
- **Imutável**: BaseId não pode ser alterado após criação

#### 3.3 Validações Frontend
- **Email disponível**: `GET /usuarios/check-email`
- **Bases do usuário**: `GET /usuarios/bases`
- **Toggle status**: `PUT /usuarios/{id}` com `{active: boolean}`

---

### 4️⃣ **SESSÃO E ESTADO**

#### 4.1 Persistência
- **localStorage Keys**:
  - `@ari:token`: JWT token
  - `@ari:user`: Dados do usuário (JSON)
  - `@ari:apiUrl`: URL da API selecionada
  - `@ari:environment`: Ambiente (local/production)

#### 4.2 Contexts Disponíveis
- **AuthContext**: Gerencia autenticação
- **BaseContext**: Gerencia base selecionada
- **ThemeContext**: Gerencia tema dark/light

#### 4.3 React Query
- **Cache padrão**: 5 minutos (staleTime)
- **Refetch**: Desabilitado no focus da janela
- **Retry**: 1 tentativa em caso de erro

---

### 5️⃣ **SEGURANÇA**

#### 5.1 Senhas
- **Criptografia**: BCrypt no backend (não visível no frontend)
- **Transmissão**: Sempre via HTTPS em produção
- **Armazenamento**: Nunca armazenar senha em plaintext
- **Reset**: Não implementado (sem recuperação de senha)

#### 5.2 Tokens
- **JWT**: Assinado no backend
- **Payload**: id, email, role, baseId
- **Renovação**: Não implementada (sem refresh token)
- **Revogação**: Apenas via logout (client-side)

#### 5.3 Validações
- **Frontend**: Validação básica de campos
- **Backend**: Validação completa e sanitização
- **SQL Injection**: Prevenido via Prisma ORM
- **XSS**: React escapa automaticamente

---

### 6️⃣ **FLUXOS PRINCIPAIS**

#### 6.1 Fluxo de Login
1. Usuário entra email/senha
2. Frontend envia POST /auth/login
3. Backend valida credenciais
4. Retorna JWT + dados do usuário
5. Frontend salva no localStorage
6. Redireciona para /dashboard

#### 6.2 Fluxo de Logout
1. Usuário clica em logout
2. Frontend remove token do localStorage
3. Opcionalmente chama POST /auth/logout
4. Redireciona para /login

#### 6.3 Fluxo CRUD Usuário
1. **Create**: Validar email único → Criar com senha → Retornar novo usuário
2. **Read**: Listar paginado ou buscar por ID
3. **Update**: Validar campos → Atualizar → Retornar atualizado
4. **Delete**: Confirmar → Deletar → Retornar sucesso

---

### 7️⃣ **ENDPOINTS DE USUÁRIOS**

| Operação | Método | Endpoint | Auth Required |
|----------|--------|----------|---------------|
| Listar | GET | `/usuarios` | ✅ |
| Buscar | GET | `/usuarios/{id}` | ✅ |
| Criar | POST | `/usuarios` | ✅ |
| Atualizar | PUT | `/usuarios/{id}` | ✅ |
| Deletar | DELETE | `/usuarios/{id}` | ✅ |
| Trocar Senha | PUT | `/usuarios/{id}/change-password` | ✅ |
| Verificar Email | GET | `/usuarios/check-email` | ✅ |
| Listar Bases | GET | `/usuarios/bases` | ✅ |

---

### 8️⃣ **MENSAGENS E FEEDBACK**

#### 8.1 Toasts (react-hot-toast)
- **Sucesso**: Verde, ícone ✓, 4 segundos
- **Erro**: Vermelho, ícone ✗, 4 segundos
- **Loading**: Spinner, mensagem customizada
- **Posição**: top-right

#### 8.2 Mensagens Padrão
- **Login sucesso**: "Login realizado com sucesso!"
- **Login erro**: "Email ou senha inválidos"
- **Criar usuário**: "Usuário criado com sucesso!"
- **Atualizar**: "Usuário atualizado com sucesso!"
- **Deletar**: "Usuário removido com sucesso!"
- **Senha**: "Senha alterada com sucesso!"

#### 8.3 Validações
- **Email inválido**: "Por favor, insira um email válido"
- **Email duplicado**: "Este email já está em uso"
- **Senha curta**: "A senha deve ter no mínimo 6 caracteres"
- **Campos obrigatórios**: "Este campo é obrigatório"

---

### 9️⃣ **ESTADOS DE LOADING**

#### 9.1 Skeleton Loading
- Lista de usuários: Mostra skeleton rows
- Formulários: Desabilita campos durante submit
- Botões: Mostra spinner durante ação

#### 9.2 Empty States
- Sem usuários: "Nenhum usuário encontrado"
- Sem resultados: "Nenhum resultado para sua busca"
- Erro de conexão: "Erro ao conectar com o servidor"

---

### 🔟 **BOAS PRÁTICAS**

#### 10.1 Performance
- Paginação: Sempre paginar listas (padrão 10 itens)
- Cache: Usar React Query para cache de dados
- Debounce: Em campos de busca (300ms)

#### 10.2 UX
- Confirmações: Sempre confirmar ações destrutivas
- Feedback: Sempre dar feedback visual de ações
- Loading: Sempre mostrar estado de carregamento
- Erros: Mensagens claras e acionáveis

#### 10.3 Código
- Types: Sempre tipar com TypeScript
- Services: Centralizar lógica em services
- Hooks: Criar hooks customizados para lógica complexa
- Components: Componentes pequenos e reutilizáveis

---

## 📝 CHECKLIST DE IMPLEMENTAÇÃO

### ✅ Implementado
- [x] Login/Logout básico
- [x] CRUD completo de usuários
- [x] Validação de email único
- [x] Troca de senha
- [x] Toggle ativo/inativo
- [x] Roles (admin/user/viewer)
- [x] Multi-tenant por base
- [x] Protected routes
- [x] Interceptor para token

### ❌ Não Implementado
- [ ] Refresh token
- [ ] Recuperação de senha
- [ ] 2FA (Two-factor auth)
- [ ] Histórico de senhas
- [ ] Auditoria de ações
- [ ] Rate limiting
- [ ] IP whitelist
- [ ] Sessão com timeout
- [ ] Remember me

---

## 🚨 AVISOS IMPORTANTES

1. **Sem refresh token**: Token não renova automaticamente
2. **Sem recuperação**: Não há fluxo de "esqueci minha senha"
3. **BaseId imutável**: Usuário não pode trocar de base
4. **Delete físico**: Exclusão remove registro do banco
5. **Sem auditoria**: Não registra histórico de alterações

---

**Última Atualização:** 15/09/2025
**Versão:** 2.0 (Simplificada)
**Foco:** Simplicidade e funcionalidade essencial