#!/bin/bash

# =============================================================================
# DEPLOY DO ADMIN PANEL NO SERVIDOR IERP.INVISTTO.COM
# =============================================================================
# Este script deve ser executado NO SERVIDOR onde está a ari-nest
# 
# Estrutura esperada no servidor:
# /home/[user]/dev/
#   ├── ari-nest/          (backend já rodando)
#   └── admin-panel/       (frontend - será criado/atualizado)
# =============================================================================

set -e  # Parar em caso de erro

# Configurações
DEPLOY_USER="root"  # Ajuste conforme seu usuário
DEPLOY_HOST="ierp.invistto.com"
DEV_DIR="/root/dev"  # Ajuste conforme seu diretório
REPO_URL="https://github.com/seu-usuario/admin-panel.git"  # Ajuste se tiver repo
NGINX_CONFIG="/etc/nginx/sites-available/admin-panel"
NGINX_ENABLED="/etc/nginx/sites-enabled/admin-panel"

echo "🚀 Deploy do Admin Panel para Produção"
echo "======================================="

# Se estiver executando localmente, copiar para o servidor
if [[ "$HOSTNAME" != *"invistto"* ]]; then
    echo "📦 Preparando arquivos localmente..."
    
    # Criar arquivo tar com o código fonte
    echo "📦 Criando arquivo tar do projeto..."
    tar -czf admin-panel.tar.gz \
        --exclude=node_modules \
        --exclude=dist \
        --exclude=.git \
        --exclude=*.log \
        -C /home/robson/Documentos/projetos/codigo-fonte \
        admin-panel
    
    echo "📤 Enviando para o servidor..."
    scp admin-panel.tar.gz $DEPLOY_USER@$DEPLOY_HOST:$DEV_DIR/
    
    echo "🔧 Executando build no servidor..."
    ssh $DEPLOY_USER@$DEPLOY_HOST << 'ENDSSH'
        cd /root/dev
        
        # Backup do anterior se existir
        if [ -d "admin-panel" ]; then
            echo "📋 Fazendo backup da versão anterior..."
            mv admin-panel admin-panel.backup.$(date +%Y%m%d_%H%M%S)
        fi
        
        # Extrair novo código
        echo "📂 Extraindo código fonte..."
        tar -xzf admin-panel.tar.gz
        cd admin-panel
        
        # Instalar dependências
        echo "📦 Instalando dependências..."
        npm install
        
        # Configurar para produção
        echo "⚙️ Configurando ambiente de produção..."
        cat > .env.production.local << EOF
VITE_API_URL=https://ierp.invistto.com
VITE_ENVIRONMENT=production
EOF
        
        # Build para produção
        echo "🔨 Fazendo build de produção..."
        npm run build
        
        # Criar diretório web se não existir
        if [ ! -d "/var/www/admin-panel" ]; then
            mkdir -p /var/www/admin-panel
        fi
        
        # Copiar arquivos buildados
        echo "📋 Copiando arquivos para /var/www/admin-panel..."
        rsync -av --delete dist/ /var/www/admin-panel/
        
        # Ajustar permissões
        chown -R www-data:www-data /var/www/admin-panel
        
        echo "✅ Build concluído no servidor!"
ENDSSH
    
    # Limpar arquivo temporário
    rm admin-panel.tar.gz
    
else
    # Executando diretamente no servidor
    echo "🔧 Executando build diretamente no servidor..."
    
    cd $DEV_DIR/admin-panel
    
    # Atualizar código se for um repositório git
    if [ -d ".git" ]; then
        echo "📥 Atualizando código do repositório..."
        git pull
    fi
    
    # Instalar/atualizar dependências
    echo "📦 Instalando dependências..."
    npm install
    
    # Build para produção
    echo "🔨 Fazendo build de produção..."
    npm run build
    
    # Copiar para diretório web
    echo "📋 Copiando arquivos para /var/www/admin-panel..."
    rsync -av --delete dist/ /var/www/admin-panel/
    
    # Ajustar permissões
    chown -R www-data:www-data /var/www/admin-panel
fi

echo ""
echo "✅ Deploy concluído com sucesso!"
echo ""
echo "📝 Próximos passos:"
echo "   1. Configure o nginx se ainda não estiver configurado"
echo "   2. Acesse: https://admin.ierp.invistto.com"
echo ""
echo "🔧 Para configurar o nginx, use o arquivo nginx-admin-panel.conf"