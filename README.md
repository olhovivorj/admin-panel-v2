# Admin Panel V2 - INVISTTO

Interface administrativa simplificada do INVISTTO ERP, focada em funcionalidades essenciais.

## 🎯 Características

- **Simplificado**: Redução de 84% do código original
- **Foco**: CRUD de usuários e configuração de bases Firebird
- **Limpo**: Apenas 20 endpoints essenciais (reduzido de 68)
- **Moderno**: React 18 + TypeScript + Vite + TailwindCSS

## 🚀 Quick Start

### Pré-requisitos

- Node.js 20+
- NPM ou Yarn
- Backend ari-nest rodando na porta 3000

### Instalação

```bash
# Clone o repositório
git clone https://github.com/olhovivorj/admin-panel-v2.git
cd admin-panel-v2

# Instale as dependências
npm install

# Configure o ambiente
cp .env.example .env

# Inicie o desenvolvimento
npm run dev
```

O frontend estará disponível em http://localhost:3001

### Backend

O backend (ari-nest) deve estar rodando em http://localhost:3000

```bash
cd ../ari-nest
npm run start:dev
```

## 📁 Estrutura

```
admin-panel-v2/
├── src/
│   ├── components/   # Componentes React
│   ├── contexts/     # Contextos (Auth, Base, Theme)
│   ├── pages/        # Páginas (Dashboard, Users, Bases, Login)
│   ├── services/     # Serviços de API
│   ├── hooks/        # React hooks customizados
│   └── utils/        # Utilitários
├── public/           # Assets estáticos
└── docs/            # Documentação
```

## 🔧 Funcionalidades

### Implementado ✅

- **Autenticação JWT** com localStorage
- **CRUD completo de usuários**
  - Criar, listar, atualizar, deletar
  - Validação de email único
  - Troca de senha
  - Toggle ativo/inativo
- **Gestão de bases** (multi-tenant)
- **Dashboard simplificado**
- **Tema dark/light**
- **Paginação e filtros**

### Removido 🗑️

- Analytics complexo
- Monitoring e métricas
- Configurações de API
- Logs detalhados
- AI Billing

## 📊 Endpoints

Total de 20 endpoints mantidos (70% de redução):

### Auth (2)
- `POST /auth/login`
- `POST /auth/logout`

### Users (10)
- `GET /usuarios`
- `GET /usuarios/:id`
- `POST /usuarios`
- `PUT /usuarios/:id`
- `DELETE /usuarios/:id`
- `PUT /usuarios/:id/change-password`
- `GET /usuarios/check-email`
- `GET /usuarios/bases`
- `GET /usuarios/stats`
- `POST /usuarios/toggle-status`

### Bases (5)
- `GET /bases`
- `GET /bases/:id`
- `POST /bases`
- `PUT /bases/:id`
- `DELETE /bases/:id`

### System (3)
- `GET /system/status`
- `GET /system/dashboard`
- `GET /system/health`

## 🔐 Autenticação

- **Token JWT** armazenado no localStorage
- **Chave**: `@ari:token`
- **Duração**: 24h
- **Auto-logout** em 401

## 👥 Tipos de Usuário

- **admin**: Acesso total
- **user**: Acesso padrão
- **viewer**: Apenas visualização

## 🎨 Tecnologias

- **React 18** - UI Library
- **TypeScript** - Type Safety
- **Vite** - Build Tool
- **TailwindCSS** - Styling
- **React Query** - Data Fetching
- **React Hook Form** - Forms
- **Axios** - HTTP Client
- **React Router** - Routing

## 📝 Documentação

- [`CLAUDE.md`](./CLAUDE.md) - Regras de negócio e autenticação
- [`CLAUDE-ENDPOINTS.md`](./CLAUDE-ENDPOINTS.md) - Mapeamento de endpoints

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Proprietário - INVISTTO © 2025

## 🚧 Status

**Versão**: 2.0.0 (Simplificada)
**Status**: Em produção
**Última atualização**: 15/01/2025