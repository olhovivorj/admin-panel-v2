#!/bin/bash

echo "🚀 Iniciando ARI Admin Panel Unificado..."
echo ""
echo "📦 Verificando dependências..."

if [ ! -d "node_modules" ]; then
    echo "❌ node_modules não encontrado. Execute: npm install"
    exit 1
fi

echo "✅ Dependências OK"
echo ""
echo "🌐 Iniciando servidor de desenvolvimento..."
echo ""
echo "➜ Acesse: http://localhost:5174"
echo "➜ Login: admin@invistto.com.br / admin123"
echo ""

# Tentar com npx
npx vite --port 5174 --host