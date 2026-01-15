#!/bin/bash
# =============================================================================
# ROLLBACK - ADMIN PANEL
# =============================================================================
# Script para reverter deploy em caso de problemas
# Uso: ./scripts/rollback.sh [backup_name]
# =============================================================================

set -e

BACKUP_DIR="$HOME/backups/admin-panel"
WEB_DIR="/var/www/admin-panel"
DEPLOY_DIR="$HOME/projetos/admin-panel-v2"
PM2_APP_NAME="admin-panel-api"

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

echo "=============================================="
echo "  ROLLBACK - ADMIN PANEL"
echo "=============================================="

# Verificar se diretório de backup existe
if [ ! -d "$BACKUP_DIR" ]; then
    log_error "Diretorio de backup nao encontrado: $BACKUP_DIR"
    exit 1
fi

# Listar backups disponíveis
echo ""
log_info "Backups disponiveis:"
echo ""
ls -lt $BACKUP_DIR | grep "frontend_" | head -10
echo ""

# Se backup foi passado como argumento, usar ele
if [ -n "$1" ]; then
    BACKUP_NAME="$1"
else
    # Perguntar qual backup restaurar
    read -p "Digite o nome do backup para restaurar (ou 'latest' para o mais recente): " BACKUP_NAME
fi

# Se escolheu latest, pegar o mais recente
if [ "$BACKUP_NAME" == "latest" ]; then
    BACKUP_NAME=$(ls -t $BACKUP_DIR | grep "frontend_" | head -1)
    log_info "Usando backup mais recente: $BACKUP_NAME"
fi

BACKUP_PATH="$BACKUP_DIR/$BACKUP_NAME"

# Verificar se backup existe
if [ ! -d "$BACKUP_PATH" ]; then
    log_error "Backup nao encontrado: $BACKUP_PATH"
    exit 1
fi

# Confirmar rollback
echo ""
log_warn "ATENCAO: Isso vai substituir o frontend atual!"
read -p "Confirma rollback para $BACKUP_NAME? (s/N): " CONFIRM

if [ "$CONFIRM" != "s" ] && [ "$CONFIRM" != "S" ]; then
    log_info "Rollback cancelado."
    exit 0
fi

# -----------------------------------------------------------------------------
# ROLLBACK DO FRONTEND
# -----------------------------------------------------------------------------
log_info "Restaurando frontend..."
sudo rsync -av --delete $BACKUP_PATH/ $WEB_DIR/
sudo chown -R www-data:www-data $WEB_DIR
log_info "Frontend restaurado!"

# -----------------------------------------------------------------------------
# ROLLBACK DO BACKEND (git revert)
# -----------------------------------------------------------------------------
echo ""
read -p "Deseja tambem fazer rollback do backend para o commit anterior? (s/N): " ROLLBACK_BACKEND

if [ "$ROLLBACK_BACKEND" == "s" ] || [ "$ROLLBACK_BACKEND" == "S" ]; then
    log_info "Fazendo rollback do backend..."

    cd $DEPLOY_DIR

    # Mostrar commits recentes
    echo ""
    log_info "Commits recentes:"
    git log --oneline -5
    echo ""

    read -p "Digite o hash do commit para restaurar (ou 'HEAD~1' para anterior): " COMMIT_HASH

    if [ -n "$COMMIT_HASH" ]; then
        git checkout $COMMIT_HASH -- apps/api/

        # Rebuild backend
        log_info "Rebuilding backend..."
        npm run build --filter=@admin-panel/api 2>/dev/null || (cd apps/api && npm run build)

        # Restart PM2
        log_info "Reiniciando PM2..."
        pm2 restart $PM2_APP_NAME
        pm2 save

        log_info "Backend restaurado!"
    fi
fi

echo ""
echo "=============================================="
echo -e "${GREEN}  ROLLBACK CONCLUIDO!${NC}"
echo "=============================================="
echo ""
log_info "Verificando status..."
pm2 status $PM2_APP_NAME

echo ""
echo "URLs para verificar:"
echo "  Frontend: https://admin.ierp.invistto.com/admin/"
echo "  Backend:  https://ierp.invistto.com"
echo ""
