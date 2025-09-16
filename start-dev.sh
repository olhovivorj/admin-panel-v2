#!/bin/bash
# Script para iniciar admin-panel e ari-nest juntos

echo "🚀 Iniciando ambiente de desenvolvimento..."

# Terminal 1: Backend
echo "📦 Iniciando ari-nest (backend)..."
gnome-terminal --tab --title="ARI-NEST Backend" -- bash -c "cd ../ari-nest && npm run start:dev; exec bash"

# Aguardar backend iniciar
echo "⏳ Aguardando backend iniciar (15 segundos)..."
sleep 15

# Terminal 2: Frontend
echo "🎨 Iniciando admin-panel (frontend)..."
npm run dev

echo "✅ Ambiente iniciado!"
echo "Backend: http://localhost:3000"
echo "Frontend: http://localhost:3001"