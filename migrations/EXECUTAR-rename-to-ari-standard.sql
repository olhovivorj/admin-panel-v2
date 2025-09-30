-- ============================================
-- RENOMEAR TABELAS PARA PADRÃO ARI_
-- Data: 30/09/2025
-- EXECUTAR ESTE SCRIPT NO BANCO
-- ============================================

-- IMPORTANTE: Vai renomear as tabelas existentes
-- roles → ari_roles
-- system_pages → ari_pages
-- role_permissions → ari_role_permissions

-- 1. RENOMEAR TABELAS
RENAME TABLE roles TO ari_roles;
RENAME TABLE system_pages TO ari_pages;
RENAME TABLE role_permissions TO ari_role_permissions;

-- 2. RECRIAR VIEW com novos nomes
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

-- 3. RENOMEAR CAMPO ID_PESSOA para id_pessoa (minúsculo)
ALTER TABLE ariusers CHANGE COLUMN ID_PESSOA id_pessoa INT NULL COMMENT 'FK para ge_pessoa (Firebird)';

-- 4. VERIFICAÇÃO
SELECT '==== TABELAS RENOMEADAS ====' as Info;

SELECT table_name, table_rows
FROM information_schema.tables
WHERE table_schema = DATABASE()
  AND table_name IN ('ari_roles', 'ari_pages', 'ari_role_permissions')
ORDER BY table_name;

SELECT '==== VERIFICANDO CAMPO id_pessoa ====' as Info;
SHOW COLUMNS FROM ariusers LIKE '%pessoa%';

SELECT '==== RENOMEAÇÃO CONCLUÍDA ====' as Info;