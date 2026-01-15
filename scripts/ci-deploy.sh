#!/bin/bash
# =============================================================================
# CI/CD DEPLOY - ADMIN PANEL (Frontend + Backend)
# =============================================================================
# Este script é executado pelo GitHub Actions no servidor de produção
# Faz deploy do frontend (SPA) e backend (NestJS API)
# =============================================================================

set -e  # Parar em caso de erro

# Configurações
DEPLOY_DIR="$HOME/projetos/admin-panel-v2"
WEB_DIR="/var/www/admin-panel"
BACKUP_DIR="$HOME/backups/admin-panel"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
PM2_APP_NAME="admin-panel-api"

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

echo "=============================================="
echo "  DEPLOY AUTOMATICO - ADMIN PANEL"
echo "  Timestamp: $TIMESTAMP"
echo "=============================================="

# -----------------------------------------------------------------------------
# 1. ATUALIZAR CODIGO
# -----------------------------------------------------------------------------
log_info "Atualizando codigo do repositorio..."
cd $DEPLOY_DIR
git fetch origin main
git reset --hard origin/main

# -----------------------------------------------------------------------------
# 2. INSTALAR DEPENDENCIAS
# -----------------------------------------------------------------------------
log_info "Instalando dependencias..."

# Verificar se pnpm está instalado, senão usar npm
if command -v pnpm &> /dev/null; then
    pnpm install --frozen-lockfile 2>/dev/null || pnpm install
else
    npm install
fi

# -----------------------------------------------------------------------------
# 3. CONFIGURAR AMBIENTE DE PRODUCAO
# -----------------------------------------------------------------------------
log_info "Configurando ambiente de producao..."

# Frontend env
cat > apps/web/.env.production.local << EOF
VITE_API_URL=https://ierp.invistto.com
VITE_ENVIRONMENT=production
EOF

# Backend env (se não existir, criar template)
if [ ! -f "apps/api/.env" ]; then
    log_warn "apps/api/.env nao encontrado! Usando configuracao padrao."
fi

# -----------------------------------------------------------------------------
# 4. BUILD
# -----------------------------------------------------------------------------
log_info "Fazendo build de producao..."

# Build do monorepo (frontend + backend)
if command -v pnpm &> /dev/null; then
    pnpm build
else
    npm run build
fi

# -----------------------------------------------------------------------------
# 5. BACKUP DA VERSAO ATUAL
# -----------------------------------------------------------------------------
log_info "Criando backup da versao atual..."
mkdir -p $BACKUP_DIR

# Backup do frontend
if [ -d "$WEB_DIR" ]; then
    cp -r $WEB_DIR $BACKUP_DIR/frontend_$TIMESTAMP
    log_info "Backup frontend criado: frontend_$TIMESTAMP"
fi

# -----------------------------------------------------------------------------
# 6. DEPLOY DO FRONTEND
# -----------------------------------------------------------------------------
log_info "Deploying frontend para $WEB_DIR..."
sudo mkdir -p $WEB_DIR
sudo rsync -av --delete apps/web/dist/ $WEB_DIR/
sudo chown -R www-data:www-data $WEB_DIR
log_info "Frontend deployed!"

# -----------------------------------------------------------------------------
# 7. DEPLOY DO BACKEND (PM2)
# -----------------------------------------------------------------------------
log_info "Deploying backend API..."

# Criar diretório de logs
mkdir -p $HOME/logs/admin-panel

# Verificar se PM2 está instalado
if ! command -v pm2 &> /dev/null; then
    log_error "PM2 nao esta instalado! Instalando..."
    npm install -g pm2
fi

# Verificar se o processo já existe
if pm2 list | grep -q "$PM2_APP_NAME"; then
    log_info "Reiniciando processo PM2: $PM2_APP_NAME"
    pm2 restart $PM2_APP_NAME --update-env
else
    log_info "Iniciando novo processo PM2: $PM2_APP_NAME"
    pm2 start ecosystem.production.config.js
fi

# Salvar configuração PM2
pm2 save

log_info "Backend deployed!"

# -----------------------------------------------------------------------------
# 8. LIMPEZA DE BACKUPS ANTIGOS
# -----------------------------------------------------------------------------
log_info "Limpando backups antigos (mantendo ultimos 5)..."
cd $BACKUP_DIR
ls -dt frontend_* 2>/dev/null | tail -n +6 | xargs -r rm -rf

# -----------------------------------------------------------------------------
# 9. VERIFICACAO FINAL
# -----------------------------------------------------------------------------
log_info "Verificando status dos servicos..."

# Status PM2
pm2 status $PM2_APP_NAME

# Verificar se frontend está acessível localmente
if curl -s -o /dev/null -w "%{http_code}" http://localhost/admin/ | grep -q "200"; then
    log_info "Frontend respondendo OK!"
else
    log_warn "Frontend pode nao estar acessivel localmente (verificar nginx)"
fi

echo ""
echo "=============================================="
echo -e "${GREEN}  DEPLOY CONCLUIDO COM SUCESSO!${NC}"
echo "  Timestamp: $TIMESTAMP"
echo "=============================================="
echo ""
echo "URLs:"
echo "  Frontend: https://admin.ierp.invistto.com/admin/"
echo "  Backend:  https://ierp.invistto.com (proxy para API)"
echo ""
