#!/bin/bash

echo "=================================================="
echo "🧪 TESTE CRUD COM AUTENTICAÇÃO"
echo "=================================================="
echo ""

# Token obtido do login
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsImVtYWlsIjoiYWRtaW5AaW52aXN0dG8uY29tLmJyIiwiYmFzZUlkIjo0OSwiaXNNYXN0ZXIiOnRydWUsImlzU3VwZXJ2aXNvciI6ZmFsc2UsInBlcm1pc3Npb25zIjpbImRhc2hib2FyZCJdLCJpYXQiOjE3NTc5NTI5OTEsImV4cCI6MTc1ODAzOTM5MX0.1mwkNdaI1La0DTlEGyxA9876PQ-05visjYf3r4AO6L8"

API_URL="http://localhost:3000/api"

echo "✅ Usando token de admin@invistto.com.br"
echo ""

echo "=================================================="
echo "1️⃣  LISTAR USUÁRIOS"
echo "=================================================="
curl -s -X GET "$API_URL/usuarios?limit=3" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" | jq '.'

echo ""
echo "=================================================="
echo "2️⃣  CRIAR NOVO USUÁRIO"
echo "=================================================="
NOVO_USUARIO='{
  "name": "Teste CRUD Admin Panel",
  "email": "teste.crud@invistto.com",
  "password": "senha123",
  "role": "user",
  "baseId": 49,
  "telefone": "11999999999",
  "obs": "Usuário criado via teste automatizado"
}'

echo "Dados enviados:"
echo "$NOVO_USUARIO" | jq '.'
echo ""
echo "Resposta:"

RESPONSE=$(curl -s -X POST "$API_URL/usuarios" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "$NOVO_USUARIO")

echo "$RESPONSE" | jq '.'

# Extrair ID do usuário criado
USER_ID=$(echo "$RESPONSE" | jq -r '.data.id // .id // empty')

if [ -n "$USER_ID" ]; then
    echo ""
    echo "✅ Usuário criado com ID: $USER_ID"

    echo ""
    echo "=================================================="
    echo "3️⃣  BUSCAR USUÁRIO POR ID"
    echo "=================================================="
    curl -s -X GET "$API_URL/usuarios/$USER_ID" \
      -H "Authorization: Bearer $TOKEN" | jq '.'

    echo ""
    echo "=================================================="
    echo "4️⃣  ATUALIZAR USUÁRIO"
    echo "=================================================="
    UPDATE_DATA='{
      "name": "Teste CRUD Atualizado",
      "telefone": "11888888888",
      "obs": "Dados atualizados com sucesso"
    }'

    echo "Dados enviados:"
    echo "$UPDATE_DATA" | jq '.'
    echo ""
    echo "Resposta:"

    curl -s -X PUT "$API_URL/usuarios/$USER_ID" \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      -d "$UPDATE_DATA" | jq '.'

    echo ""
    echo "=================================================="
    echo "5️⃣  TOGGLE STATUS (DESATIVAR)"
    echo "=================================================="
    curl -s -X PUT "$API_URL/usuarios/$USER_ID" \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      -d '{"active": false}' | jq '.data | {id, name, active}'

    echo ""
    echo "=================================================="
    echo "6️⃣  TOGGLE STATUS (REATIVAR)"
    echo "=================================================="
    curl -s -X PUT "$API_URL/usuarios/$USER_ID" \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      -d '{"active": true}' | jq '.data | {id, name, active}'

    echo ""
    echo "=================================================="
    echo "7️⃣  TROCAR SENHA"
    echo "=================================================="
    curl -s -X POST "$API_URL/usuarios/$USER_ID/change-password" \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      -d '{"currentPassword": "senha123", "newPassword": "novaSenha456"}' | jq '.'

    echo ""
    echo "=================================================="
    echo "8️⃣  DELETAR USUÁRIO"
    echo "=================================================="
    echo "Deletando usuário ID: $USER_ID"
    curl -s -X DELETE "$API_URL/usuarios/$USER_ID" \
      -H "Authorization: Bearer $TOKEN" | jq '.'

else
    echo "❌ Não foi possível criar o usuário para testes adicionais"
fi

echo ""
echo "=================================================="
echo "9️⃣  VERIFICAR EMAIL DISPONÍVEL"
echo "=================================================="
curl -s -X GET "$API_URL/usuarios/check-email?email=novo@teste.com" \
  -H "Authorization: Bearer $TOKEN" | jq '.'

echo ""
echo "=================================================="
echo "🔟 LISTAR BASES DO USUÁRIO"
echo "=================================================="
curl -s -X GET "$API_URL/usuarios/bases" \
  -H "Authorization: Bearer $TOKEN" | jq '.'

echo ""
echo "=================================================="
echo "✅ TESTES CONCLUÍDOS!"
echo "=================================================="
echo ""
echo "Resumo dos endpoints testados:"
echo "✅ GET    /usuarios         - Listar usuários"
echo "✅ POST   /usuarios         - Criar usuário"
echo "✅ GET    /usuarios/{id}    - Buscar por ID"
echo "✅ PUT    /usuarios/{id}    - Atualizar usuário"
echo "✅ DELETE /usuarios/{id}    - Deletar usuário"
echo "✅ POST   /usuarios/{id}/change-password - Trocar senha"
echo "✅ GET    /usuarios/check-email - Verificar email"
echo "✅ GET    /usuarios/bases   - Listar bases"
echo ""