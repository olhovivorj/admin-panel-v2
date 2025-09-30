-- ============================================
-- VERIFICAR ESTRUTURA ATUAL DO BANCO
-- Execute este script para ver o que já existe
-- ============================================

SELECT '==== VERIFICANDO TABELAS RELACIONADAS A ROLES ====' as Info;

-- 1. Verificar se tabelas antigas existem
SELECT
    CASE WHEN COUNT(*) > 0 THEN '✅ roles existe' ELSE '❌ roles NÃO existe' END as Status
FROM information_schema.tables
WHERE table_schema = DATABASE() AND table_name = 'roles';

SELECT
    CASE WHEN COUNT(*) > 0 THEN '✅ system_pages existe' ELSE '❌ system_pages NÃO existe' END as Status
FROM information_schema.tables
WHERE table_schema = DATABASE() AND table_name = 'system_pages';

SELECT
    CASE WHEN COUNT(*) > 0 THEN '✅ role_permissions existe' ELSE '❌ role_permissions NÃO existe' END as Status
FROM information_schema.tables
WHERE table_schema = DATABASE() AND table_name = 'role_permissions';

-- 2. Verificar se tabelas novas (com ari_) existem
SELECT
    CASE WHEN COUNT(*) > 0 THEN '✅ ari_roles existe' ELSE '❌ ari_roles NÃO existe' END as Status
FROM information_schema.tables
WHERE table_schema = DATABASE() AND table_name = 'ari_roles';

SELECT
    CASE WHEN COUNT(*) > 0 THEN '✅ ari_pages existe' ELSE '❌ ari_pages NÃO existe' END as Status
FROM information_schema.tables
WHERE table_schema = DATABASE() AND table_name = 'ari_pages';

SELECT
    CASE WHEN COUNT(*) > 0 THEN '✅ ari_role_permissions existe' ELSE '❌ ari_role_permissions NÃO existe' END as Status
FROM information_schema.tables
WHERE table_schema = DATABASE() AND table_name = 'ari_role_permissions';

-- 3. Listar TODAS as tabelas que começam com 'ari'
SELECT '==== TODAS AS TABELAS ARI* ====' as Info;
SELECT table_name FROM information_schema.tables
WHERE table_schema = DATABASE()
  AND table_name LIKE 'ari%'
ORDER BY table_name;

-- 4. Verificar estrutura da tabela ariusers
SELECT '==== CAMPOS DA TABELA ARIUSERS ====' as Info;
SELECT
    COLUMN_NAME,
    DATA_TYPE,
    IS_NULLABLE,
    COLUMN_KEY,
    COLUMN_DEFAULT,
    COLUMN_COMMENT
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'ariusers'
ORDER BY ORDINAL_POSITION;

-- 5. Verificar se role_id existe em ariusers
SELECT '==== VERIFICANDO CAMPO role_id ====' as Info;
SELECT
    CASE WHEN COUNT(*) > 0 THEN '✅ role_id existe em ariusers' ELSE '❌ role_id NÃO existe em ariusers' END as Status
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'ariusers'
  AND COLUMN_NAME = 'role_id';

-- 6. Verificar se id_pessoa existe em ariusers
SELECT '==== VERIFICANDO CAMPO id_pessoa ====' as Info;
SELECT
    CASE WHEN COUNT(*) > 0 THEN '✅ id_pessoa existe em ariusers' ELSE '❌ id_pessoa NÃO existe em ariusers' END as Status
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'ariusers'
  AND COLUMN_NAME = 'id_pessoa';

-- 7. Se ari_roles existe, mostrar roles cadastrados
SET @table_exists = (SELECT COUNT(*) FROM information_schema.tables
    WHERE table_schema = DATABASE() AND table_name = 'ari_roles');

SET @sql = IF(@table_exists > 0,
    'SELECT "==== ROLES CADASTRADOS ====" as Info; SELECT id, name, display_name, priority FROM ari_roles ORDER BY priority DESC',
    'SELECT "Tabela ari_roles não existe ainda" as Info');

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 8. Se ari_pages existe, contar páginas
SET @table_exists = (SELECT COUNT(*) FROM information_schema.tables
    WHERE table_schema = DATABASE() AND table_name = 'ari_pages');

SET @sql = IF(@table_exists > 0,
    'SELECT "==== PÁGINAS CADASTRADAS ====" as Info; SELECT COUNT(*) as total_paginas FROM ari_pages; SELECT category, COUNT(*) as total FROM ari_pages GROUP BY category ORDER BY total DESC',
    'SELECT "Tabela ari_pages não existe ainda" as Info');

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 9. Se ari_role_permissions existe, contar permissões
SET @table_exists = (SELECT COUNT(*) FROM information_schema.tables
    WHERE table_schema = DATABASE() AND table_name = 'ari_role_permissions');

SET @sql = IF(@table_exists > 0,
    'SELECT "==== PERMISSÕES CADASTRADAS ====" as Info; SELECT COUNT(*) as total_permissoes FROM ari_role_permissions',
    'SELECT "Tabela ari_role_permissions não existe ainda" as Info');

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 10. Verificar FKs existentes
SELECT '==== FOREIGN KEYS EM ARIUSERS ====' as Info;
SELECT
    CONSTRAINT_NAME,
    COLUMN_NAME,
    REFERENCED_TABLE_NAME,
    REFERENCED_COLUMN_NAME
FROM information_schema.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'ariusers'
  AND REFERENCED_TABLE_NAME IS NOT NULL
ORDER BY CONSTRAINT_NAME;

SELECT '==== VERIFICAÇÃO CONCLUÍDA ====' as Info;