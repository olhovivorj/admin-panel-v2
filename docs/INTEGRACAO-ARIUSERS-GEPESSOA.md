# 🔗 Integração ariusers → ge_pessoa

**Data:** 30/09/2025
**Branch:** `feature/roles-and-gepessoa-integration`

---

## 🎯 OBJETIVO

Conectar usuários do sistema ARI (`ariusers`) com pessoas do ERP legado (`ge_pessoa`) para ter acesso completo aos dados cadastrais.

---

## 📊 ESTRUTURA ATUAL

### Tabela `ariusers` (MySQL)
```sql
id              INT PRIMARY KEY
ID_BASE         INT              -- Multi-tenant
id_pessoa       INT              -- FK para ge_pessoa.ID_PESSOA (NOVO)
email           VARCHAR(255)     -- Login
senha           VARCHAR(255)     -- Hash bcrypt
nome            VARCHAR(255)     -- Nome do usuário
role_id         INT              -- FK para ari_roles
telefone        VARCHAR(20)      -- Telefone
```

### Tabela `ge_pessoa` (MySQL - origem Firebird)
```sql
ID_BASE         INT              -- Multi-tenant
ID_PESSOA       INT              -- PK da pessoa
TIPO_PESSOA     CHAR(1)          -- 'F' = Física, 'J' = Jurídica
RAZAO           VARCHAR(50)      -- Razão social / Nome completo
FANTASIA        VARCHAR(50)      -- Nome fantasia
DATA_CADASTRO   DATETIME
FG_CONSENTIMENTO CHAR(1)         -- Consentimento LGPD
```

### Tabela `ge_pessoa_endereco`
```sql
ID_BASE         INT
ID_ENDERECO     INT PRIMARY KEY
ID_PESSOA       INT              -- FK para ge_pessoa
ENDERECO        VARCHAR(100)
BAIRRO          VARCHAR(40)
CEP             VARCHAR(10)
TELEFONE        VARCHAR(20)
EMAIL           VARCHAR(100)     -- Email cadastrado
```

### Tabela `ge_pessoa_fisica`
```sql
ID_BASE         INT
ID_PESSOA       INT PRIMARY KEY
CPF             VARCHAR(11)
RG              VARCHAR(20)
DT_NASCIMENTO   DATE
SEXO            CHAR(1)
NOME_PAI        VARCHAR(40)
NOME_MAE        VARCHAR(40)
ESTADO_CIVIL    VARCHAR(10)
ID_PROFISSAO    INT
```

---

## 🔑 REGRAS DE NEGÓCIO

### 1. **Usuários Normais DEVEM existir em ge_pessoa**
- Todo usuário `tipo_usuario = 'NORMAL'` precisa ter `id_pessoa` preenchido
- Validar ao criar/editar usuário que `id_pessoa` existe em `ge_pessoa`
- Validar que `ID_BASE` do usuário corresponde ao `ID_BASE` da pessoa

### 2. **Usuários API são exceção**
- `tipo_usuario = 'API'` NÃO precisa de `id_pessoa`
- São usuários de integração, não pessoas físicas

### 3. **Chave composta no ge_pessoa**
```sql
PRIMARY KEY (ID_BASE, ID_PESSOA)
```
- Sempre usar ambos nas consultas
- Multi-tenant por base

### 4. **Dados prioritários**
| Campo | Origem | Observação |
|-------|--------|------------|
| Nome | `ge_pessoa.RAZAO` | Fonte de verdade |
| Email | `ge_pessoa_endereco.EMAIL` | Principal |
| Telefone | `ge_pessoa_endereco.TELEFONE` | Principal |
| CPF | `ge_pessoa_fisica.CPF` | Apenas pessoa física |

---

## 💻 IMPLEMENTAÇÃO

### 1. View SQL para facilitar consultas

```sql
CREATE OR REPLACE VIEW v_ariusers_complete AS
SELECT
  -- Dados ariusers
  au.id as usuario_id,
  au.ID_BASE,
  au.email as email_login,
  au.nome as nome_usuario,
  au.role_id,
  ar.name as role_name,
  ar.display_name as role_display,
  au.tipo_usuario,
  au.ativo,
  au.telefone as telefone_usuario,

  -- Dados ge_pessoa
  au.id_pessoa,
  gp.TIPO_PESSOA,
  gp.RAZAO as nome_completo,
  gp.FANTASIA as nome_fantasia,
  gp.DATA_CADASTRO as data_cadastro_pessoa,
  gp.FG_CONSENTIMENTO as consentimento_lgpd,

  -- Dados ge_pessoa_endereco (principal)
  gpe.EMAIL as email_pessoa,
  gpe.TELEFONE as telefone_pessoa,
  gpe.ENDERECO,
  gpe.BAIRRO,
  gpe.CEP,

  -- Dados ge_pessoa_fisica (se for pessoa física)
  gpf.CPF,
  gpf.RG,
  gpf.DT_NASCIMENTO,
  gpf.SEXO,

  -- Metadados
  au.criado_em,
  au.atualizado_em,
  au.ultimo_acesso

FROM ariusers au

-- Join com role
LEFT JOIN ari_roles ar ON au.role_id = ar.id

-- Join com ge_pessoa
LEFT JOIN ge_pessoa gp
  ON gp.ID_BASE = au.ID_BASE
  AND gp.ID_PESSOA = au.id_pessoa

-- Join com endereço (pegar o primeiro/principal)
LEFT JOIN ge_pessoa_endereco gpe
  ON gpe.ID_BASE = gp.ID_BASE
  AND gpe.ID_PESSOA = gp.ID_PESSOA
  AND gpe.ID_ENDERECO = (
    SELECT MIN(ID_ENDERECO)
    FROM ge_pessoa_endereco
    WHERE ID_BASE = gp.ID_BASE
      AND ID_PESSOA = gp.ID_PESSOA
  )

-- Join com pessoa física (se aplicável)
LEFT JOIN ge_pessoa_fisica gpf
  ON gpf.ID_BASE = gp.ID_BASE
  AND gpf.ID_PESSOA = gp.ID_PESSOA

WHERE au.tipo_usuario != 'API' OR au.tipo_usuario IS NULL;
```

---

## 🛡️ VALIDAÇÕES NECESSÁRIAS

### Backend (NestJS)

#### 1. Validar ao criar usuário
```typescript
// Validar que pessoa existe e pertence à base
const pessoa = await this.prisma.ge_pessoa.findFirst({
  where: {
    ID_BASE: createUserDto.ID_BASE,
    ID_PESSOA: createUserDto.id_pessoa
  }
});

if (!pessoa && createUserDto.tipo_usuario !== 'API') {
  throw new BadRequestException(
    'Pessoa não encontrada na base especificada'
  );
}
```

#### 2. Service para buscar dados completos
```typescript
async findUserComplete(userId: number) {
  // Buscar pela view
  const result = await this.prisma.$queryRaw`
    SELECT * FROM v_ariusers_complete WHERE usuario_id = ${userId}
  `;
  return result[0];
}
```

### Frontend (Admin Panel)

#### 1. Selector de Pessoa
```typescript
// Componente PersonSelector.tsx
interface PersonSelectorProps {
  baseId: number;
  value?: number;
  onChange: (idPessoa: number) => void;
}

// Busca pessoas por nome/CPF
const searchPessoas = async (term: string) => {
  const response = await api.get('/ge-pessoa/search', {
    params: { baseId, term }
  });
  return response.data;
};
```

#### 2. Exibir dados da pessoa
```typescript
// Mostrar dados da pessoa vinculada
{userData.id_pessoa && (
  <div className="pessoa-info">
    <h3>Dados Cadastrais (ERP)</h3>
    <p><strong>Nome:</strong> {userData.nome_completo}</p>
    <p><strong>Email:</strong> {userData.email_pessoa}</p>
    <p><strong>Telefone:</strong> {userData.telefone_pessoa}</p>
    {userData.CPF && <p><strong>CPF:</strong> {userData.CPF}</p>}
  </div>
)}
```

---

## 📋 ENDPOINTS NECESSÁRIOS

### GET `/api/ge-pessoa/search`
Buscar pessoas por nome/CPF/email

**Query params:**
- `baseId` (required)
- `term` (required)
- `tipo?` ('F' | 'J')

**Response:**
```json
[
  {
    "id_pessoa": 123,
    "id_base": 5,
    "nome": "João da Silva",
    "tipo_pessoa": "F",
    "cpf": "12345678901",
    "email": "joao@email.com",
    "telefone": "(21) 99999-9999"
  }
]
```

### GET `/api/ge-pessoa/:id`
Buscar pessoa específica

**Params:**
- `id` - ID da pessoa
- `baseId` - Query param obrigatório

**Response:** Dados completos da pessoa

### GET `/api/usuarios/:id/complete`
Buscar usuário com dados completos (ariusers + ge_pessoa)

**Response:**
```json
{
  "id": 1,
  "email": "user@email.com",
  "nome": "João",
  "role": "admin",
  "id_pessoa": 123,
  "pessoa": {
    "nome_completo": "João da Silva Santos",
    "cpf": "12345678901",
    "telefone": "(21) 99999-9999",
    "endereco": "Rua das Flores, 123"
  }
}
```

---

## ⚠️ CONSIDERAÇÕES IMPORTANTES

### 1. **Performance**
- View `v_ariusers_complete` pode ser pesada
- Usar índices em `ge_pessoa.ID_PESSOA`
- Paginar resultados de busca

### 2. **Segurança**
- Nunca permitir acesso cross-tenant
- Sempre validar `ID_BASE` nas queries
- Logar tentativas de acesso a pessoas de outras bases

### 3. **Migração de Dados Existentes**
```sql
-- Usuários sem id_pessoa precisam ser vinculados
SELECT id, nome, email, telefone
FROM ariusers
WHERE id_pessoa IS NULL
  AND tipo_usuario != 'API'
  AND ativo = 1;
```

### 4. **LGPD**
- Respeitar `FG_CONSENTIMENTO` de `ge_pessoa`
- Não enviar mensagens para quem não deu consentimento

---

## 🚀 PRÓXIMOS PASSOS

1. ✅ Criar view `v_ariusers_complete`
2. ⏳ Criar endpoints no backend
3. ⏳ Criar componente PersonSelector no frontend
4. ⏳ Atualizar modal de usuário para incluir seleção de pessoa
5. ⏳ Migrar usuários existentes (vincular com ge_pessoa)

---

**Documentação criada em:** 30/09/2025