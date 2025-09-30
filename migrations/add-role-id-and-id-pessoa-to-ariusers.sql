-- ============================================
-- ADICIONAR CAMPOS role_id E id_pessoa EM ariusers
-- Data: 30/09/2025
-- Projeto: Admin Panel V2
-- ============================================

-- 1. Adicionar campo role_id (FK para ari_roles)
ALTER TABLE ariusers
ADD COLUMN IF NOT EXISTS role_id INT NULL COMMENT 'FK para ari_roles - novo sistema de permissões'
AFTER funcao;

-- 2. Adicionar campo id_pessoa (FK futuro para ge_pessoa Firebird)
ALTER TABLE ariusers
ADD COLUMN IF NOT EXISTS id_pessoa INT NULL COMMENT 'FK para ge_pessoa (Firebird) - integração ERP legado'
AFTER role_id;

-- 3. Criar índice para role_id
CREATE INDEX IF NOT EXISTS idx_role_id ON ariusers(role_id);

-- 4. Criar índice para id_pessoa
CREATE INDEX IF NOT EXISTS idx_id_pessoa ON ariusers(id_pessoa);

-- 5. Adicionar FK constraint (apenas se ari_roles existir)
SET @fk_exists = (SELECT COUNT(*)
    FROM information_schema.TABLE_CONSTRAINTS
    WHERE CONSTRAINT_SCHEMA = DATABASE()
      AND TABLE_NAME = 'ariusers'
      AND CONSTRAINT_NAME = 'fk_ariusers_role');

SET @sql = IF(@fk_exists = 0 AND EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'ari_roles'),
    'ALTER TABLE ariusers ADD CONSTRAINT fk_ariusers_role FOREIGN KEY (role_id) REFERENCES ari_roles(id) ON DELETE SET NULL',
    'SELECT "FK já existe ou tabela ari_roles não encontrada" as Info');

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 6. Migrar dados existentes de funcao para role_id
UPDATE ariusers au
SET au.role_id = (
    SELECT ar.id
    FROM ari_roles ar
    WHERE ar.name = au.funcao
)
WHERE au.funcao IS NOT NULL
  AND au.role_id IS NULL
  AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'ari_roles');

-- 7. Verificar migração
SELECT '==== VERIFICAÇÃO DE CAMPOS ADICIONADOS ====' as Info;

SELECT
    COLUMN_NAME,
    DATA_TYPE,
    IS_NULLABLE,
    COLUMN_KEY,
    COLUMN_COMMENT
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'ariusers'
  AND COLUMN_NAME IN ('role_id', 'id_pessoa', 'funcao')
ORDER BY ORDINAL_POSITION;

-- 8. Mostrar estatísticas
SELECT
    'Usuários com funcao preenchido' as Tipo,
    COUNT(*) as Total
FROM ariusers
WHERE funcao IS NOT NULL;

SELECT
    'Usuários com role_id preenchido' as Tipo,
    COUNT(*) as Total
FROM ariusers
WHERE role_id IS NOT NULL;

SELECT
    'Usuários com id_pessoa preenchido' as Tipo,
    COUNT(*) as Total
FROM ariusers
WHERE id_pessoa IS NOT NULL;

-- 9. Mostrar mapeamento funcao -> role_id
SELECT
    au.funcao as funcao_antiga,
    ar.name as role_novo,
    ar.display_name as role_nome,
    COUNT(*) as total_usuarios
FROM ariusers au
LEFT JOIN ari_roles ar ON au.role_id = ar.id
GROUP BY au.funcao, ar.name, ar.display_name
ORDER BY total_usuarios DESC;

SELECT '==== MIGRAÇÃO CONCLUÍDA ====' as Info;