-- Script para criar usuário de teste no admin-panel
-- Senha: teste123 (hash bcrypt)

INSERT INTO ariusers (
    email,
    password,
    name,
    role,
    active,
    baseId,
    created_at,
    updated_at
) VALUES (
    'teste@admin.com',
    '$2b$10$YXJpL3Rlc3RlMTIzAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA', -- teste123
    'Usuário Teste',
    'admin',
    1,
    1,
    NOW(),
    NOW()
) ON DUPLICATE KEY UPDATE
    password = VALUES(password),
    updated_at = NOW();