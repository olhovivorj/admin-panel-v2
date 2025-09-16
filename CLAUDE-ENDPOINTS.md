# 📡 MAPEAMENTO DE ENDPOINTS - ADMIN PANEL V2 (SIMPLIFICADO)

## 📊 RESUMO APÓS LIMPEZA RADICAL
- **Total de Endpoints:** 20
- **Services Ativos:** 4 (api, users, bases, system)
- **Páginas:** 4 (Login, Dashboard, Users, Bases)
- **Código Removido:** 70% do projeto original

---

## 🔑 LOGIN PAGE
**Contexto:** `src/contexts/AuthContext.tsx`

| Endpoint | Método | Usado? | Descrição |
|----------|--------|--------|-----------|
| `/auth/login` | POST | ✅ | Login via AuthContext |
| `/auth/logout` | POST | ✅ | Logout via AuthContext |

---

## 📊 DASHBOARD PAGE
**Service:** `src/services/system.ts`

| Endpoint | Método | Usado? | Descrição |
|----------|--------|--------|-----------|
| `/admin/sistema/status` | GET | ✅ | Status do sistema |
| `/admin/dashboard/stats` | GET | ❌ | Não implementado no backend |
| `/health` | GET | ❌ | Health check não usado |

**Também usa:**
- `/usuarios` (via users.ts)
- `/bases` (via bases.ts)

---

## 👥 USERS PAGE
**Service:** `src/services/users.ts` (simplificado)

| Endpoint | Método | Usado? | Descrição |
|----------|--------|--------|-----------|
| `/usuarios` | GET | ✅ | Listar usuários com filtros |
| `/usuarios/{id}` | GET | ✅ | Buscar usuário por ID |
| `/usuarios` | POST | ✅ | Criar novo usuário |
| `/usuarios/{id}` | PUT | ✅ | Atualizar usuário |
| `/usuarios/{id}` | DELETE | ✅ | Deletar usuário |
| `/usuarios/{id}/change-password` | PUT | ✅ | Trocar senha |
| `/usuarios/bases` | GET | ✅ | Bases do usuário |
| `/usuarios/check-email` | GET | ✅ | Verificar email disponível |

---

## 🗄️ BASES PAGE
**Service:** `src/services/bases.ts`

| Endpoint | Método | Usado? | Descrição |
|----------|--------|--------|-----------|
| `/bases` | GET | ✅ | Listar todas as bases |
| `/bases/simples/list` | GET | ✅ | Lista simplificada |
| `/bases/{id}/stats` | GET | ✅ | Estatísticas da base |
| `/bases/{id}/firebird` | GET | ✅ | Config Firebird |
| `/bases/{id}/firebird-config` | PUT | ✅ | Atualizar config Firebird |
| `/bases/{id}/firebird/test` | POST | ✅ | Testar conexão Firebird |
| `/bases/firebird/ativas` | GET | ✅ | Bases Firebird ativas |
| `/bases/{id}/lojas` | GET | ✅ | Lojas da base |
| `/empresas/{baseId}` | GET | ✅ | Dados da empresa |

---

## 🚀 ESTRUTURA SIMPLIFICADA DOS SERVICES

### users.ts (114 linhas)
```typescript
- getUsers()          // Listar com paginação
- getUser()           // Buscar por ID
- createUser()        // Criar
- updateUser()        // Atualizar
- deleteUser()        // Deletar
- changePassword()    // Trocar senha
- toggleUserStatus()  // Ativar/Desativar
- getUserBases()      // Bases do usuário
- checkEmailAvailable() // Validar email
```

### bases.ts (195 linhas)
```typescript
- getBases()              // Listar bases
- getBasesSimples()       // Lista simples
- getBaseStats()          // Estatísticas
- getFirebirdConfig()     // Config Firebird
- updateFirebirdConfig()  // Atualizar config
- testFirebirdConnection() // Testar conexão
- getFirebirdAtivas()     // Bases ativas
- getBaseLojas()          // Lojas da base
- getEmpresas()           // Dados empresa
```

### system.ts (49 linhas)
```typescript
- getSystemStatus()    // Status do sistema
- getDashboardStats()  // Stats dashboard
- healthCheck()        // Health check
```

### api.ts (sem alterações)
- Configuração do Axios
- Interceptors para JWT
- Base URL management

---

## ✅ ENDPOINTS ESSENCIAIS MANTIDOS

### Usuários (8 endpoints)
- CRUD completo
- Gestão de senha
- Validações

### Bases (9 endpoints)
- Listagem e stats
- Configuração Firebird completa
- Teste de conexão

### Sistema (3 endpoints)
- Status básico
- Dashboard stats
- Health check

---

## ❌ REMOVIDOS NA LIMPEZA

### Completamente Eliminados:
- `/monitoring/*` - 15 endpoints
- `/analytics/*` - 4 endpoints
- `/config/*` - 5 endpoints
- `/admin/monitoring/*` - 8 endpoints
- `/usuarios/tokens/*` - 5 endpoints
- `/usuarios/api-logs` - 1 endpoint
- `/usuarios/sys-users/*` - 4 endpoints
- `/cache/*` - 2 endpoints
- `/docs/*` - 3 endpoints

### Total Removido: **47 endpoints**

---

## 📈 COMPARAÇÃO ANTES x DEPOIS

| Métrica | Antes | Depois | Redução |
|---------|-------|--------|---------|
| Total Endpoints | 68 | 20 | -70% |
| Services | 6 | 4 | -33% |
| Linhas de Código | ~2500 | ~400 | -84% |
| Complexidade | Alta | Baixa | ✅ |

---

## 🎯 FOCO ATUAL

O admin-panel-v2 agora tem apenas **3 responsabilidades**:

1. **Gerenciar Usuários** - CRUD completo
2. **Configurar Bases** - Firebird settings
3. **Monitorar Status** - Dashboard básico

Sem métricas complexas, sem logs detalhados, sem configurações de API.
**Simples, direto e funcional.**

---

**Última Atualização:** 15/09/2025
**Versão:** 2.0 (Simplificada)