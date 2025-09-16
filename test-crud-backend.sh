#!/bin/bash

echo "=================================================="
echo "🧪 TESTE COMPLETO DO CRUD DE USUÁRIOS"
echo "=================================================="
echo ""

# URL base da API
API_URL="http://localhost:3000/api"

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Função para fazer requisições e mostrar resultado
test_endpoint() {
    local method=$1
    local endpoint=$2
    local data=$3
    local description=$4

    echo -e "${YELLOW}▶ Testando:${NC} $description"
    echo "  Método: $method"
    echo "  Endpoint: $endpoint"

    if [ -n "$data" ]; then
        echo "  Dados: $data"
        response=$(curl -s -X $method "$API_URL$endpoint" \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer $TOKEN" \
            -d "$data")
    else
        response=$(curl -s -X $method "$API_URL$endpoint" \
            -H "Authorization: Bearer $TOKEN")
    fi

    # Formatar resposta com jq se disponível
    if command -v jq &> /dev/null; then
        echo "$response" | jq '.' 2>/dev/null || echo "$response"
    else
        echo "$response"
    fi

    echo ""
    echo "---------------------------------------------------"
    echo ""
}

# 1. Verificar se o backend está rodando
echo -e "${YELLOW}🔍 Verificando se o backend está rodando...${NC}"
health_check=$(curl -s -o /dev/null -w "%{http_code}" $API_URL)
if [ "$health_check" == "200" ] || [ "$health_check" == "401" ]; then
    echo -e "${GREEN}✅ Backend está rodando!${NC}"
else
    echo -e "${RED}❌ Backend não está respondendo em $API_URL${NC}"
    echo "Por favor, inicie o backend com: cd ../ari-nest && npm run start:dev"
    exit 1
fi
echo ""

# 2. Tentar fazer login com credenciais padrão
echo -e "${YELLOW}🔐 Tentando fazer login...${NC}"
echo ""

# Lista de credenciais para tentar
credentials=(
    '{"email":"admin@invistto.com","password":"Invistto@2024"}'
    '{"email":"admin@admin.com","password":"admin123"}'
    '{"email":"teste@admin.com","password":"teste123"}'
    '{"email":"admin@example.com","password":"admin123"}'
)

TOKEN=""
for cred in "${credentials[@]}"; do
    echo "Tentando: $cred"
    login_response=$(curl -s -X POST "$API_URL/auth/login" \
        -H "Content-Type: application/json" \
        -d "$cred")

    # Verificar se o login foi bem-sucedido
    if echo "$login_response" | grep -q "token"; then
        TOKEN=$(echo "$login_response" | jq -r '.token // .access_token // .data.token // .data.access_token' 2>/dev/null)
        if [ -n "$TOKEN" ] && [ "$TOKEN" != "null" ]; then
            echo -e "${GREEN}✅ Login bem-sucedido!${NC}"
            echo "Token obtido: ${TOKEN:0:20}..."
            break
        fi
    fi
done

if [ -z "$TOKEN" ]; then
    echo -e "${YELLOW}⚠️  Não foi possível fazer login. Continuando sem autenticação...${NC}"
    echo "Alguns endpoints podem retornar erro 401."
    TOKEN="no-auth-token"
fi

echo ""
echo "=================================================="
echo "📋 INICIANDO TESTES DO CRUD"
echo "=================================================="
echo ""

# 3. Listar usuários
test_endpoint "GET" "/usuarios?limit=5" "" "Listar primeiros 5 usuários"

# 4. Criar novo usuário
NEW_USER_DATA='{
    "name": "Teste CRUD",
    "email": "teste.crud@example.com",
    "password": "senha123",
    "role": "user",
    "baseId": 1,
    "telefone": "11999999999",
    "obs": "Usuário criado via teste automatizado"
}'
test_endpoint "POST" "/usuarios" "$NEW_USER_DATA" "Criar novo usuário"

# 5. Buscar usuário por ID (assumindo ID 1 existe)
test_endpoint "GET" "/usuarios/1" "" "Buscar usuário ID 1"

# 6. Atualizar usuário
UPDATE_DATA='{
    "name": "Teste CRUD Atualizado",
    "telefone": "11888888888",
    "obs": "Dados atualizados via teste"
}'
test_endpoint "PUT" "/usuarios/1" "$UPDATE_DATA" "Atualizar usuário ID 1"

# 7. Toggle status (ativar/desativar)
TOGGLE_DATA='{"active": false}'
test_endpoint "PUT" "/usuarios/1" "$TOGGLE_DATA" "Desativar usuário ID 1"

# 8. Trocar senha
CHANGE_PASSWORD_DATA='{
    "currentPassword": "senha123",
    "newPassword": "novaSenha456"
}'
test_endpoint "PUT" "/usuarios/1/change-password" "$CHANGE_PASSWORD_DATA" "Trocar senha do usuário ID 1"

# 9. Verificar email disponível
test_endpoint "GET" "/usuarios/check-email?email=novo@example.com" "" "Verificar se email está disponível"

# 10. Listar bases do usuário
test_endpoint "GET" "/usuarios/bases" "" "Listar bases disponíveis"

echo ""
echo "=================================================="
echo -e "${GREEN}✅ TESTES CONCLUÍDOS!${NC}"
echo "=================================================="
echo ""
echo "Resumo:"
echo "- Backend: http://localhost:3000"
echo "- Frontend: http://localhost:3001"
echo "- Documentação: http://localhost:3000/api/docs"
echo ""
echo "Para testar manualmente, use:"
echo "1. O arquivo HTML: test-users-crud.html"
echo "2. Ou acesse o admin panel: http://localhost:3001"
echo ""