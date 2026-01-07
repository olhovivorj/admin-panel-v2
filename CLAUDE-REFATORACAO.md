# Plano de Refatoração Detalhado - Admin Panel V2

## Resumo Executivo

| Aspecto | Backend | Frontend | Total |
|---------|---------|----------|-------|
| **Score** | 7.1/10 | 6.3/10 | 6.7/10 |
| **Arquivos Críticos** | 5 | 4 | 9 |
| **Linhas Afetadas** | ~2.000 | ~3.000 | ~5.000 |

---

## FASE 1: Backend - Arquivos Críticos

### 1.1 erp.service.ts (504 linhas) → 6 arquivos

**Localização:** `apps/api/src/modules/erp/erp.service.ts`

**Responsabilidades atuais misturadas:**
- Pessoas: `getPessoas()`, `getPessoa()` (linhas 8-143)
- Empresas: `getEmpresas()`, `getEmpresa()` (linhas 145-232)
- Produtos: `getProdutos()` (linhas 234-301)
- Estoque: `getEstoque()` (linhas 303-364)
- Vendas: `getVendas()` (linhas 366-444)
- Dashboard: `getDashboard()` (linhas 446-504)

**Extração proposta:**
```
apps/api/src/modules/erp/
├── erp.module.ts (atualizar imports)
├── erp.controller.ts (manter, ajustar injeções)
├── services/
│   ├── pessoas.service.ts (~140 linhas)
│   ├── empresas.service.ts (~90 linhas)
│   ├── produtos.service.ts (~70 linhas)
│   ├── estoque.service.ts (~65 linhas)
│   ├── vendas.service.ts (~80 linhas)
│   └── dashboard.service.ts (~60 linhas)
└── erp.service.ts (DELETAR após migração)
```

**Padrão comum extraível:**
```typescript
// Criar helper de paginação reutilizável
interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
```

---

### 1.2 bases.service.ts (451 linhas) → 3 arquivos

**Localização:** `apps/api/src/modules/bases/bases.service.ts`

**Responsabilidades atuais:**
- CRUD bases: `findAll`, `findOne`, `create`, `update`, `remove` (linhas 26-246)
- Firebird config: `getFirebirdConfig`, `updateFirebirdConfig`, `testFirebirdConnection` (linhas 248-388)
- Stats/Users: `getBaseStats`, `getBaseUsuarios`, `getAllBases` (linhas 390-451)

**Extração proposta:**
```
apps/api/src/modules/bases/
├── bases.module.ts (atualizar)
├── bases.controller.ts (manter)
├── bases.service.ts (~220 linhas - apenas CRUD)
├── services/
│   ├── base-firebird.service.ts (~150 linhas)
│   └── base-stats.service.ts (~80 linhas)
```

---

### 1.3 base-config.service.ts (359 linhas) → Extrair repositories

**Localização:** `apps/api/src/config/base-config.service.ts`

**Responsabilidades misturadas (9):**
1. Pool management (`onModuleInit`, `onModuleDestroy`)
2. Retry logic (`executeWithRetry`)
3. Base config queries (`getConfig`, `updateConfig`)
4. User queries (`getUserByEmail`, `getUserPermissions`)
5. Plan queries (`getPlanData`, `getPlanPages`)
6. Last access update (`updateLastAccess`)
7. Generic CRUD (`query`, `queryOne`, `insert`, `update`, `delete`)
8. Health check (`testConnection`)
9. Base name lookup (`getBaseName`)

**Extração proposta:**
```
apps/api/src/config/
├── database.module.ts (novo)
├── database-pool.service.ts (~80 linhas - pool + retry)
├── base-config.service.ts (~100 linhas - apenas config)
└── repositories/
    ├── base.repository.ts (~60 linhas)
    ├── user.repository.ts (~80 linhas)
    └── plan.repository.ts (~60 linhas)
```

---

### 1.4 invistto-auth.service.ts (351 linhas) → 3 arquivos

**Localização:** `apps/api/src/modules/auth/invistto-auth.service.ts`

**Responsabilidades:**
- Login principal (`login`, `validateUser`) - 78-126 linhas
- Planos/Páginas (`getUserPlanAndPages`) - 131-191 linhas
- Password validation (`validatePassword`) - 196-213 linhas
- Firebird credentials (`getFirebirdCredentials`) - 222-247 linhas
- Token generation + encryption (`generateToken`, `encrypt`) - 252-301 linhas
- Logout (`logout`) - 338-350 linhas

**Extração proposta:**
```
apps/api/src/modules/auth/
├── auth.module.ts (atualizar)
├── auth.controller.ts (manter)
├── invistto-auth.service.ts (~150 linhas - login/logout)
├── services/
│   ├── password.service.ts (~40 linhas)
│   ├── jwt-token.service.ts (~80 linhas - encrypt + generate)
│   └── user-plan.service.ts (~70 linhas)
```

---

### 1.5 usuarios.service.ts (368 linhas) → Manter, pequenas melhorias

**Localização:** `apps/api/src/modules/usuarios/usuarios.service.ts`

**Status:** Já está relativamente bem organizado.

**Pequenas melhorias:**
- Extrair mapeamento de `items.map()` para método privado
- Extrair validações para helpers reutilizáveis

---

## FASE 2: Frontend - Arquivos Críticos

### 2.1 UsersList.tsx (1356 linhas) → 6 arquivos

**Localização:** `apps/web/src/components/users/UsersList.tsx`

**Problemas identificados:**
- 13 useState hooks (linhas 53-67)
- 6 mutations com useOperationToast (linhas 135-261)
- Lógica de export (linhas 263-329)
- Handlers complexos (linhas 331-466)
- Table + Actions (linhas 698-1069)
- 5 modais inline (linhas 1106-1354)

**Extração proposta:**
```
apps/web/src/components/users/
├── UsersList.tsx (~200 linhas - orquestrador)
├── components/
│   ├── UsersTable.tsx (~300 linhas)
│   ├── UsersTableRow.tsx (~150 linhas)
│   ├── UserActionsDropdown.tsx (~150 linhas)
│   ├── UsersHeader.tsx (~100 linhas)
│   ├── UsersPagination.tsx (~50 linhas)
│   └── ApiKeysModal.tsx (~120 linhas)
├── hooks/
│   ├── useUserListState.ts (~50 linhas - 13 useState)
│   ├── useUserMutations.ts (~130 linhas - 6 mutations)
│   └── useUserExport.ts (~70 linhas)
```

---

### 2.2 UserFormModalWithTabs.tsx (247 linhas) → OK

**Localização:** `apps/web/src/components/users/UserFormModalWithTabs.tsx`

**Status:** ✅ Já está bem modularizado com tabs separadas:
- `DadosBasicosTab`
- `PermissoesTab`
- `LimitesAcessoTab`

**Ação:** Nenhuma refatoração necessária.

---

### 2.3 EndpointConfigModal.tsx (639 linhas) → 4 arquivos

**Localização:** `apps/web/src/components/users/EndpointConfigModal.tsx`

**Problemas:**
- Tab endpoints + security misturados
- Lógica de IP validation inline
- Config state management complexo

**Extração proposta:**
```
apps/web/src/components/users/endpoint-config/
├── EndpointConfigModal.tsx (~100 linhas - shell)
├── tabs/
│   ├── EndpointsTab.tsx (~200 linhas)
│   └── SecurityTab.tsx (~150 linhas)
├── components/
│   ├── EndpointItem.tsx (~80 linhas)
│   └── IpWhitelistManager.tsx (~100 linhas)
└── hooks/
    └── useEndpointConfig.ts (~50 linhas)
```

---

### 2.4 SysUserSelector.tsx (507 linhas) → 4 arquivos

**Localização:** `apps/web/src/components/users/forms/SysUserSelector.tsx`

**Problemas:**
- Muitas proteções/guards inline (linhas 72-163)
- Edit mode misturado com display
- Lojas display inline

**Extração proposta:**
```
apps/web/src/components/users/forms/sys-user/
├── SysUserSelector.tsx (~150 linhas - orquestrador)
├── components/
│   ├── SysUserSearch.tsx (~80 linhas)
│   ├── SysUserInfo.tsx (~100 linhas)
│   ├── SysUserEditForm.tsx (~100 linhas)
│   └── SysUserLojas.tsx (~70 linhas)
└── hooks/
    └── useSysUserSelector.ts (~50 linhas)
```

---

## FASE 3: Ordem de Execução

### Prioridade 1 - Backend (Crítico)
1. [ ] `erp.service.ts` → Dividir em 6 services
2. [ ] `bases.service.ts` → Extrair Firebird + Stats

### Prioridade 2 - Frontend (Crítico)
3. [ ] `UsersList.tsx` → Extrair hooks + componentes
4. [ ] Criar `useUserListState.ts` hook
5. [ ] Criar `useUserMutations.ts` hook
6. [ ] Criar `UsersTable.tsx` componente

### Prioridade 3 - Backend (Alto)
7. [ ] `base-config.service.ts` → Extrair repositories
8. [ ] `invistto-auth.service.ts` → Extrair token + password services

### Prioridade 4 - Frontend (Alto)
9. [ ] `EndpointConfigModal.tsx` → Dividir tabs
10. [ ] `SysUserSelector.tsx` → Modularizar

---

## Arquivos Finais a Criar/Modificar

### Backend (17 arquivos)
```
apps/api/src/
├── modules/erp/services/
│   ├── pessoas.service.ts (NOVO)
│   ├── empresas.service.ts (NOVO)
│   ├── produtos.service.ts (NOVO)
│   ├── estoque.service.ts (NOVO)
│   ├── vendas.service.ts (NOVO)
│   └── dashboard.service.ts (NOVO)
├── modules/bases/services/
│   ├── base-firebird.service.ts (NOVO)
│   └── base-stats.service.ts (NOVO)
├── modules/auth/services/
│   ├── password.service.ts (NOVO)
│   ├── jwt-token.service.ts (NOVO)
│   └── user-plan.service.ts (NOVO)
├── config/
│   ├── database-pool.service.ts (NOVO)
│   └── repositories/
│       ├── base.repository.ts (NOVO)
│       ├── user.repository.ts (NOVO)
│       └── plan.repository.ts (NOVO)
```

### Frontend (15 arquivos)
```
apps/web/src/components/users/
├── components/
│   ├── UsersTable.tsx (NOVO)
│   ├── UsersTableRow.tsx (NOVO)
│   ├── UserActionsDropdown.tsx (NOVO)
│   ├── UsersHeader.tsx (NOVO)
│   ├── UsersPagination.tsx (NOVO)
│   └── ApiKeysModal.tsx (NOVO)
├── hooks/
│   ├── useUserListState.ts (NOVO)
│   ├── useUserMutations.ts (NOVO)
│   └── useUserExport.ts (NOVO)
├── endpoint-config/
│   ├── tabs/EndpointsTab.tsx (NOVO)
│   ├── tabs/SecurityTab.tsx (NOVO)
│   └── components/IpWhitelistManager.tsx (NOVO)
├── forms/sys-user/
│   ├── SysUserSearch.tsx (NOVO)
│   ├── SysUserInfo.tsx (NOVO)
│   └── SysUserLojas.tsx (NOVO)
```

---

## Benefícios Esperados

| Métrica | Antes | Depois |
|---------|-------|--------|
| Maior arquivo BE | 504 linhas | ~150 linhas |
| Maior arquivo FE | 1356 linhas | ~200 linhas |
| Testabilidade | Baixa | Alta |
| Reutilização | ~30% | ~70% |
| Manutenibilidade | Difícil | Fácil |
