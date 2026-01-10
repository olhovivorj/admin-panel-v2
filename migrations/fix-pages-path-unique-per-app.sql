-- ============================================
-- FIX: Alterar constraint UNIQUE de path para (path, app_id)
-- Permite o mesmo path em apps diferentes
-- ============================================

-- 1. Ver indexes atuais
SELECT '==== INDEXES ATUAIS EM ari_pages ====' as Info;
SHOW INDEX FROM ari_pages;

-- 2. Remover constraint UNIQUE existente no path
-- O nome do index pode variar, vamos verificar primeiro
SELECT
    CONSTRAINT_NAME,
    COLUMN_NAME
FROM information_schema.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'ari_pages'
  AND COLUMN_NAME = 'path';

-- 3. Executar a alteracao
-- ATENCAO: Adapte o nome do index se necessario (pode ser 'path' ou 'path_unique' ou outro)
ALTER TABLE ari_pages DROP INDEX `path`;

-- 4. Criar novo index UNIQUE composto (path + app_id)
ALTER TABLE ari_pages ADD UNIQUE KEY `path_app_unique` (`path`, `app_id`);

-- 5. Verificar que funcionou
SELECT '==== INDEXES APOS ALTERACAO ====' as Info;
SHOW INDEX FROM ari_pages;

SELECT '==== ALTERACAO CONCLUIDA ====' as Info;
