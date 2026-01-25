# CLAUDE-RESUMO - Sessão Admin Panel V2

**Data**: 2026-01-25
**Projeto**: admin-panel-v2 - Interface administrativa do INVISTTO ERP

---

## Problemas Resolvidos

### 1. Deploy Automático Falhando (GitHub Actions)
- **Causa**: Faltava dependência `axios` no `apps/api/package.json`
- **Arquivo**: `apps/api/src/modules/system/system.service.ts` usava axios sem ter instalado
- **Solução**: Adicionado `"axios": "^1.6.8"` ao package.json
- **Commit**: `809069b`

### 2. PM2 com Porta Errada no Servidor
- **Causa**: admin-panel-api estava configurado para porta 3001 (Auth API) em vez de 3002
- **Solução**: Deletado processo antigo `admin-panel` (id 11) e reiniciado com `ecosystem.production.config.js`
- **Status**: API rodando na porta 3002

### 3. Conflito de Portas - servermcp vs admin-panel-api
- **Problema**: Ambos configurados para porta 3002
- **Solução**: Alterado servermcp para porta **3099**
- **Arquivos alterados**:
  - `/servermcp/.env` (já estava 3099)
  - `/servermcp/.env.production`: 3002 → 3099
  - `/servermcp/ecosystem.config.js`: 3002 → 3099
  - `/servermcp/ecosystem.production.config.js`: 3002 → 3099

### 4. Porta api-invistto Inconsistente
- **Problema**: `.env.production` local dizia 3000, servidor usa 4001
- **Solução**: Atualizado `/api-invistto/.env.production`: 3000 → 4001

### 5. Documentação Desatualizada
- **Arquivos atualizados**:
  - `docs/ECOSSISTEMA-INVISTTO.json`
  - `docs/PROJETOS-ATIVOS.md`
- **Commits**: Pushed para main

---

## Problema Atual em Investigação

### Redirect para `/login` sem `/admin` (404)
- **Sintoma**: Usuário vê tela brevemente, depois 404 em `https://ierp.invistto.com/login`
- **Deveria ser**: `https://ierp.invistto.com/admin/login`
- **Causa identificada**: Build em produção tem `window.location.href="/login"` (sem `/admin`)

**Arquivos com problema encontrados e corrigidos localmente**:
1. `apps/web/src/hooks/useUserEdit.ts:27` - Corrigido para `/admin/login`
2. `apps/web/src/components/ProtectedRoute.tsx:23` - Corrigido para `window.location.href = '/admin/login'`

**Commits realizados**:
- `51049e8` fix(web): use /admin/login instead of /login for redirect

**Problema pendente**: O build em produção ainda mostra múltiplos arquivos JS com `/login` sem prefixo:
```
index-C4HzJBo4.js:window.location.href="/login
index-CchKi6Am.js:window.location.href="/login
... (8 arquivos)
```

---

## Mapeamento de Portas Final (Local = Produção)

| Projeto | Porta | Status |
|---------|-------|--------|
| auth-api | 3001 | OK |
| admin-panel-api | 3002 | OK |
| zeiss-api-client | 3005 | OK |
| invistto-bi | 3007 | OK |
| servermcp | 3099 | OK |
| ari | 3010 | OK |
| lentes-api | 3015 | OK |
| courier-api | 3333 | OK |
| api-invistto | 4001 | OK |

---

## Próximos Passos

1. **Verificar se deploy atualizou o build** - Os arquivos JS no servidor ainda têm código antigo
2. **Investigar origem do `/login`** - Pode ser da biblioteca `@invistto/auth-react` ou código legado
3. **Testar após limpar cache** - Ctrl+Shift+R no browser

---

## Arquivos Importantes

- **SSH Servidor**: `ssh -p 7022 robson@ierp.invistto.com`
- **Nginx config**: `/etc/nginx/sites-enabled/ierp*`
- **Build produção**: `/var/www/admin-panel-v2/dist/`
- **PM2 logs**: `~/logs/admin-panel-v2/`

---

## Pendências

### Menu "Uso de IA" não aparece
- Usuário é admin (isMaster=true)
- Menu hardcoded inclui "Uso de IA" para admin
- Precisa investigar por que não aparece em produção

### Status das APIs no Dashboard
- Endpoint `/admin/api/system/health` retorna 401 (precisa autenticação)
- Componente `SystemHealthCard` não aparece no dashboard
