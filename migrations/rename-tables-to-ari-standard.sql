-- ============================================
-- RENOMEAR TABELAS PARA PADRÃO ARI_
-- Data: 30/09/2025
-- Projeto: Admin Panel V2
-- ============================================

-- IMPORTANTE: Execute este script APENAS UMA VEZ
-- Verifica se as tabelas antigas existem antes de renomear

-- 1. RENOMEAR roles -> ari_roles
SET @table_exists = (SELECT COUNT(*) FROM information_schema.tables
    WHERE table_schema = DATABASE() AND table_name = 'roles');

SET @sql = IF(@table_exists > 0,
    'RENAME TABLE roles TO ari_roles',
    'SELECT "Tabela roles não existe ou já foi renomeada" as Warning');

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 2. RENOMEAR system_pages -> ari_pages
SET @table_exists = (SELECT COUNT(*) FROM information_schema.tables
    WHERE table_schema = DATABASE() AND table_name = 'system_pages');

SET @sql = IF(@table_exists > 0,
    'RENAME TABLE system_pages TO ari_pages',
    'SELECT "Tabela system_pages não existe ou já foi renomeada" as Warning');

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 3. RENOMEAR role_permissions -> ari_role_permissions
SET @table_exists = (SELECT COUNT(*) FROM information_schema.tables
    WHERE table_schema = DATABASE() AND table_name = 'role_permissions');

SET @sql = IF(@table_exists > 0,
    'RENAME TABLE role_permissions TO ari_role_permissions',
    'SELECT "Tabela role_permissions não existe ou já foi renomeada" as Warning');

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 4. RECRIAR VIEW com novos nomes
DROP VIEW IF EXISTS v_role_permissions;

CREATE OR REPLACE VIEW v_ari_role_permissions AS
SELECT
  r.name as role_name,
  r.display_name as role_display,
  r.priority as role_priority,
  p.path as page_path,
  p.name as page_name,
  p.category as page_category,
  rp.can_access,
  rp.can_edit,
  rp.can_delete
FROM ari_role_permissions rp
JOIN ari_roles r ON r.id = rp.role_id
JOIN ari_pages p ON p.id = rp.page_id
WHERE p.is_active = TRUE
ORDER BY r.priority DESC, p.category, p.name;

-- 5. VERIFICAR SE RENOMEAÇÃO FOI BEM-SUCEDIDA
SELECT '==== VERIFICAÇÃO DE TABELAS RENOMEADAS ====' as Info;

SELECT
    CASE
        WHEN COUNT(*) > 0 THEN '✅ ari_roles existe'
        ELSE '❌ ari_roles NÃO existe'
    END as Status
FROM information_schema.tables
WHERE table_schema = DATABASE() AND table_name = 'ari_roles';

SELECT
    CASE
        WHEN COUNT(*) > 0 THEN '✅ ari_pages existe'
        ELSE '❌ ari_pages NÃO existe'
    END as Status
FROM information_schema.tables
WHERE table_schema = DATABASE() AND table_name = 'ari_pages';

SELECT
    CASE
        WHEN COUNT(*) > 0 THEN '✅ ari_role_permissions existe'
        ELSE '❌ ari_role_permissions NÃO existe'
    END as Status
FROM information_schema.tables
WHERE table_schema = DATABASE() AND table_name = 'ari_role_permissions';

-- 6. CONTAR REGISTROS
SELECT 'ari_roles' as Tabela, COUNT(*) as Total FROM ari_roles;
SELECT 'ari_pages' as Tabela, COUNT(*) as Total FROM ari_pages;
SELECT 'ari_role_permissions' as Tabela, COUNT(*) as Total FROM ari_role_permissions;

-- 7. MOSTRAR ESTRUTURA ARIUSERS COM ROLE_ID
SELECT
    COLUMN_NAME,
    DATA_TYPE,
    IS_NULLABLE,
    COLUMN_KEY,
    COLUMN_DEFAULT
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'ariusers'
  AND COLUMN_NAME = 'role_id';

SELECT '==== RENOMEAÇÃO CONCLUÍDA ====' as Info;