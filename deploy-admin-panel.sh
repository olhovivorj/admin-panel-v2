#!/bin/bash

echo "🚀 Deploy ADMIN-PANEL para GitHub..."
echo ""

echo "📋 Status atual do repositório:"
git status
echo ""

echo "📁 Adicionando arquivos..."

# Adicionar apenas arquivos essenciais (excluir configurações locais)
git add src/
git add public/
git add package*.json
git add *.md 2>/dev/null || true
git add *.json 2>/dev/null || true
git add *.js 2>/dev/null || true
git add *.ts 2>/dev/null || true
git add index.html
git add vite.config.*
git add tailwind.config.js
git add postcss.config.js
git add tsconfig*.json

# Não adicionar configurações locais do Claude
git reset .claude/settings.local.json 2>/dev/null || true

echo "📝 Fazendo commit..."
git commit -m "feat: Admin Panel INVISTTO - Complete System

✨ Funcionalidades principais:
- Dashboard administrativo completo
- Gestão de usuários multi-tenant
- Sistema de bases/lojas
- Analytics e relatórios
- API Docs integrada com Swagger
- Autenticação JWT robusta

🎯 Características:
- React 18 + TypeScript + Vite
- TailwindCSS para UI moderna
- React Query para gerenciamento de estado
- Isolamento total por ID_BASE
- Interface responsiva e intuitiva

🔒 Segurança:
- Autenticação obrigatória
- Controle de acesso por roles
- Isolamento multi-tenant
- Validações frontend e backend

🛠️ Tecnologias:
- React 18, TypeScript, Vite
- TailwindCSS, React Query
- React Router DOM, React Hook Form
- Recharts, Date-fns, Zod

📊 Módulos:
- Usuários ARI (CRUD completo)
- Dashboard com métricas
- Gestão de bases/empresas
- Sistema de logs e auditoria
- Documentação de APIs

🚀 Generated with Claude Code"

echo ""
echo "🔄 Configurando branch main..."
git branch -M main

echo "📥 Sincronizando com GitHub (pode ter README automático)..."
git pull origin main --allow-unrelated-histories --no-edit

echo "📤 Enviando para GitHub..."
git push -u origin main

echo ""
if [ $? -eq 0 ]; then
    echo "🎉 Deploy do ADMIN-PANEL realizado com sucesso!"
    echo "🔗 Repositório: https://github.com/olhovivorj/admin-panel"
    echo ""
    echo "✅ Sistema disponível:"
    echo "  - Admin Dashboard: http://localhost:5173"
    echo "  - Gestão completa multi-tenant"
    echo "  - Interface administrativa robusta"
    echo "  - Integração com ari-nest API"
else
    echo "❌ Erro no deploy. Verifique as mensagens acima."
fi